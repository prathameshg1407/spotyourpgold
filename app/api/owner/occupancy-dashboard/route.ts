import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import Room from "@/models/room";
import TenantAllocation from "@/models/tenantAllocation";
import Listing from "@/models/listing";
import { authUser } from "@/actions/authUser";

// Response helpers
function jsonResponse(data: object, status: number = 200) {
  return NextResponse.json(data, { status });
}

function errorResponse(message: string, status: number = 400) {
  return jsonResponse({ success: false, message }, status);
}

/**
 * GET - Get occupancy dashboard data for owner
 */
export async function GET(req: NextRequest) {
  try {
    await connectToDB();
    const user = await authUser();

    if (!user || (user.role !== "owner" && user.role !== "admin")) {
      return errorResponse("Unauthorized", 401);
    }

    // Get all owner's listings
    const listings = await Listing.find({ ownerId: user.id })
      .select("_id pgName location roomTypes")
      .lean();

    const listingIds = listings.map((l) => l._id);

    // Get all rooms for these listings using aggregation for better performance
    const roomsAggregation = await Room.aggregate([
      {
        $match: {
          listingId: { $in: listingIds },
          isActive: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "beds.currentTenantId",
          foreignField: "_id",
          as: "tenantDetails",
          pipeline: [
            { $project: { fullName: 1, email: 1, phone: 1 } },
          ],
        },
      },
      {
        $addFields: {
          beds: {
            $map: {
              input: "$beds",
              as: "bed",
              in: {
                $mergeObjects: [
                  "$$bed",
                  {
                    tenant: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$tenantDetails",
                            as: "t",
                            cond: { $eq: ["$$t._id", "$$bed.currentTenantId"] },
                          },
                        },
                        0,
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $project: {
          tenantDetails: 0,
        },
      },
      {
        $sort: { floor: 1, roomNumber: 1 },
      },
    ]);

    // Get allocations summary
    const allocationStats = await TenantAllocation.aggregate([
      {
        $match: {
          listingId: { $in: listingIds },
          status: { $in: ["active", "notice_period"] },
        },
      },
      {
        $group: {
          _id: {
            listingId: "$listingId",
            status: "$status",
          },
          count: { $sum: 1 },
          totalRent: { $sum: "$monthlyRent" },
        },
      },
    ]);

    // Calculate stats per listing
    const listingStats = listings.map((listing: any) => {
      const listingRooms = roomsAggregation.filter(
        (r: any) => r.listingId.toString() === listing._id.toString()
      );

      const stats = {
        totalRooms: listingRooms.length,
        totalBeds: 0,
        occupiedBeds: 0,
        availableBeds: 0,
        reservedBeds: 0,
        maintenanceBeds: 0,
        upcomingVacancies: 0,
      };

      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      listingRooms.forEach((room: any) => {
        stats.totalBeds += room.beds.length;
        room.beds.forEach((bed: any) => {
          switch (bed.status) {
            case "occupied":
              stats.occupiedBeds++;
              if (
                bed.expectedVacateDate &&
                new Date(bed.expectedVacateDate) <= thirtyDaysFromNow
              ) {
                stats.upcomingVacancies++;
              }
              break;
            case "available":
              stats.availableBeds++;
              break;
            case "reserved":
              stats.reservedBeds++;
              break;
            case "maintenance":
              stats.maintenanceBeds++;
              break;
          }
        });
      });

      // Room type breakdown
      const roomTypeBreakdown = (listing.roomTypes || []).map((rt: any) => {
        const typeRooms = listingRooms.filter((r: any) => r.roomType === rt.type);
        const typeTotalBeds = typeRooms.reduce(
          (acc: number, r: any) => acc + r.beds.length,
          0
        );
        const typeOccupiedBeds = typeRooms.reduce(
          (acc: number, r: any) => acc + r.occupiedBeds,
          0
        );

        return {
          type: rt.type,
          totalRooms: typeRooms.length,
          totalBeds: typeTotalBeds,
          occupiedBeds: typeOccupiedBeds,
          availableBeds: typeTotalBeds - typeOccupiedBeds,
          monthlyRent: rt.monthlyRent,
          occupancyRate:
            typeTotalBeds > 0
              ? Math.round((typeOccupiedBeds / typeTotalBeds) * 100)
              : 0,
        };
      });

      // Get allocation stats for this listing
      const listingAllocationStats = allocationStats.filter(
        (a: any) => a._id.listingId.toString() === listing._id.toString()
      );

      const activeCount =
        listingAllocationStats.find((a: any) => a._id.status === "active")
          ?.count || 0;
      const noticePeriodCount =
        listingAllocationStats.find(
          (a: any) => a._id.status === "notice_period"
        )?.count || 0;

      const occupiableBeds = stats.totalBeds - stats.maintenanceBeds;

      return {
        _id: listing._id,
        pgName: listing.pgName,
        location: listing.location,
        roomTypes: listing.roomTypes || [],
        ...stats,
        activeTenants: activeCount,
        tenantsInNoticePeriod: noticePeriodCount,
        occupancyRate:
          occupiableBeds > 0
            ? Math.round((stats.occupiedBeds / occupiableBeds) * 100)
            : 0,
        roomTypeBreakdown,
        rooms: listingRooms.map((room: any) => ({
          _id: room._id,
          roomNumber: room.roomNumber,
          roomType: room.roomType,
          floor: room.floor,
          status: room.status,
          capacity: room.capacity,
          occupiedBeds: room.occupiedBeds,
          availableBeds: room.availableBeds,
          monthlyRent: room.monthlyRent,
          beds: room.beds.map((bed: any) => ({
            _id: bed._id,
            bedNumber: bed.bedNumber,
            bedLabel: bed.bedLabel,
            status: bed.status,
            tenant: bed.tenant
              ? {
                  _id: bed.tenant._id,
                  name: bed.tenant.fullName,
                  email: bed.tenant.email,
                  phone: bed.tenant.phone,
                }
              : null,
            occupiedFrom: bed.occupiedFrom,
            expectedVacateDate: bed.expectedVacateDate,
            noticeGiven: bed.noticeGiven,
          })),
        })),
      };
    });

    // Overall stats
    const overall = {
      totalListings: listings.length,
      totalRooms: roomsAggregation.length,
      totalBeds: 0,
      occupiedBeds: 0,
      availableBeds: 0,
      reservedBeds: 0,
      maintenanceBeds: 0,
      occupancyRate: 0,
      tenantsInNoticePeriod: 0,
      upcomingVacancies: 0,
      monthlyRevenue: 0,
    };

    listingStats.forEach((ls: any) => {
      overall.totalBeds += ls.totalBeds;
      overall.occupiedBeds += ls.occupiedBeds;
      overall.availableBeds += ls.availableBeds;
      overall.reservedBeds += ls.reservedBeds;
      overall.maintenanceBeds += ls.maintenanceBeds;
      overall.tenantsInNoticePeriod += ls.tenantsInNoticePeriod;
      overall.upcomingVacancies += ls.upcomingVacancies;
    });

    // Calculate overall occupancy rate
    const totalOccupiable = overall.totalBeds - overall.maintenanceBeds;
    overall.occupancyRate =
      totalOccupiable > 0
        ? Math.round((overall.occupiedBeds / totalOccupiable) * 100)
        : 0;

    // Calculate monthly revenue from active allocations
    const revenueData = allocationStats.reduce((acc: number, a: any) => {
      return acc + (a.totalRent || 0);
    }, 0);
    overall.monthlyRevenue = revenueData;

    return jsonResponse({
      success: true,
      data: {
        overall,
        listings: listingStats,
      },
    });
  } catch (error) {
    console.error("Get occupancy dashboard error:", error);
    return errorResponse("Internal server error", 500);
  }
}