import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import Room from "@/models/room";
import TenantAllocation from "@/models/tenantAllocation";
import Listing from "@/models/listing";
import { authUser } from "@/actions/authUser";

export async function GET(req: NextRequest) {
  try {
    await connectToDB();
    const user = await authUser();

    if (!user || (user.role !== "owner" && user.role !== "admin")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all owner's listings
    const listings = await Listing.find({ ownerId: user.id })
      .select("_id pgName location roomTypes")
      .lean();

    const listingIds = listings.map((l) => l._id);

    // Get all rooms for these listings
    const rooms = await Room.find({ listingId: { $in: listingIds } })
      .populate("beds.currentTenantId", "fullName email phone")
      .lean();

    // Get active allocations
    const allocations = await TenantAllocation.find({
      listingId: { $in: listingIds },
      status: { $in: ["active", "notice_period"] },
    })
      .populate("tenantId", "fullName email phone")
      .lean();

    // Calculate stats per listing
    const listingStats = listings.map((listing: any) => {
      const listingRooms = rooms.filter(
        (r: any) => r.listingId.toString() === listing._id.toString()
      );

      const totalBeds = listingRooms.reduce((acc, r: any) => acc + r.beds.length, 0);
      const occupiedBeds = listingRooms.reduce((acc, r: any) => acc + r.occupiedBeds, 0);
      const availableBeds = listingRooms.reduce((acc, r: any) => acc + r.availableBeds, 0);

      // Upcoming vacancies (next 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      let upcomingVacancies = 0;
      listingRooms.forEach((room: any) => {
        room.beds.forEach((bed: any) => {
          if (
            bed.expectedVacateDate &&
            new Date(bed.expectedVacateDate) <= thirtyDaysFromNow &&
            (bed.status === "occupied" || bed.noticeGiven)
          ) {
            upcomingVacancies++;
          }
        });
      });

      // Room type breakdown
      const roomTypeBreakdown = listing.roomTypes.map((rt: any) => {
        const typeRooms = listingRooms.filter((r: any) => r.roomType === rt.type);
        const typeTotalBeds = typeRooms.reduce((acc, r: any) => acc + r.beds.length, 0);
        const typeOccupiedBeds = typeRooms.reduce((acc, r: any) => acc + r.occupiedBeds, 0);

        return {
          type: rt.type,
          totalRooms: typeRooms.length,
          totalBeds: typeTotalBeds,
          occupiedBeds: typeOccupiedBeds,
          availableBeds: typeTotalBeds - typeOccupiedBeds,
          occupancyRate: typeTotalBeds > 0 ? Math.round((typeOccupiedBeds / typeTotalBeds) * 100) : 0,
        };
      });

      return {
        _id: listing._id,
        pgName: listing.pgName,
        location: listing.location,
        totalRooms: listingRooms.length,
        totalBeds,
        occupiedBeds,
        availableBeds,
        upcomingVacancies,
        occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
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
          beds: room.beds.map((bed: any) => ({
            bedNumber: bed.bedNumber,
            status: bed.status,
            tenant: bed.currentTenantId,
            occupiedFrom: bed.occupiedFrom,
            expectedVacateDate: bed.expectedVacateDate,
            noticeGiven: bed.noticeGiven,
          })),
        })),
      };
    });

    // Overall stats
    const totalBeds = rooms.reduce((acc, r: any) => acc + r.beds.length, 0);
    const totalOccupied = rooms.reduce((acc, r: any) => acc + r.occupiedBeds, 0);
    const totalAvailable = rooms.reduce((acc, r: any) => acc + r.availableBeds, 0);

    // Tenants in notice period
    const tenantsInNoticePeriod = allocations.filter(
      (a: any) => a.status === "notice_period"
    ).length;

    // Upcoming vacancies across all properties
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);

    const allUpcomingVacancies = rooms.reduce((acc, room: any) => {
      const vacatingBeds = room.beds.filter(
        (bed: any) =>
          bed.expectedVacateDate &&
          new Date(bed.expectedVacateDate) <= thirtyDays &&
          bed.status === "occupied"
      );
      return acc + vacatingBeds.length;
    }, 0);

    return NextResponse.json({
      success: true,
      data: {
        overall: {
          totalListings: listings.length,
          totalRooms: rooms.length,
          totalBeds,
          occupiedBeds: totalOccupied,
          availableBeds: totalAvailable,
          occupancyRate: totalBeds > 0 ? Math.round((totalOccupied / totalBeds) * 100) : 0,
          tenantsInNoticePeriod,
          upcomingVacancies: allUpcomingVacancies,
        },
        listings: listingStats,
      },
    });
  } catch (error) {
    console.error("Get occupancy dashboard error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}