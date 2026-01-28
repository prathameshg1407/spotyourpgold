import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import TenantAllocation from "@/models/tenantAllocation";
import Room from "@/models/room";
import { authUser } from "@/actions/authUser";

// GET - Get user's current allocation
export async function GET(req: NextRequest) {
  try {
    await connectToDB();
    const user = await authUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get active allocation
    const allocation: any = await TenantAllocation.findOne({
      tenantId: user.id,
      status: { $in: ["active", "notice_period", "pending"] },
    })
      .populate("listingId", "pgName location amenities detailedRules mealTimings rentInclusions images primaryImage")
      .populate("roomId")
      .lean();

    if (!allocation) {
      return NextResponse.json({
        success: true,
        data: null,
        message: "No active allocation found",
      });
    }

    // Get room details - allocation.roomId is populated
    const populatedRoomId = allocation.roomId;
    const room: any = await Room.findById(populatedRoomId?._id || allocation.roomId).lean();

    // Get roommates (other tenants in same room)
    let roommates: any[] = [];
    if (room) {
      const otherBeds = room.beds?.filter(
        (bed: any) =>
          bed.status === "occupied" &&
          bed.currentTenantId &&
          bed.currentTenantId.toString() !== user.id
      ) || [];

      if (otherBeds.length > 0) {
        const roommateAllocations = await TenantAllocation.find({
          roomId: populatedRoomId?._id || allocation.roomId,
          tenantId: { $ne: user.id },
          status: { $in: ["active", "notice_period"] },
        })
          .populate("tenantId", "fullName")
          .lean();

        roommates = roommateAllocations.map((a: any) => ({
          name: a.tenantId?.fullName || "Unknown",
          bedNumber: a.bedNumber,
          moveInDate: a.moveInDate,
        }));
      }
    }

    // Calculate next rent due
    const pendingRent = allocation.rentHistory?.find(
      (r: any) => r.status === "pending" || r.status === "overdue"
    );

    return NextResponse.json({
      success: true,
      data: {
        allocation: {
          ...allocation,
          room: room
            ? {
                roomNumber: room.roomNumber,
                roomType: room.roomType,
                floor: room.floor,
                isAC: room.isAC,
                hasAttachedBathroom: room.hasAttachedBathroom,
                amenities: room.amenities,
              }
            : null,
        },
        roommates,
        nextRentDue: pendingRent
          ? {
              amount: pendingRent.amount + (pendingRent.lateFee || 0),
              dueDate: pendingRent.dueDate,
              status: pendingRent.status,
              lateFee: pendingRent.lateFee || 0,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Get allocation error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Give notice (tenant initiating move-out)
export async function POST(req: NextRequest) {
  try {
    await connectToDB();
    const user = await authUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { expectedVacateDate, reason } = await req.json();

    if (!expectedVacateDate) {
      return NextResponse.json(
        { success: false, message: "Expected vacate date is required" },
        { status: 400 }
      );
    }

    // Get active allocation
    const allocation: any = await TenantAllocation.findOne({
      tenantId: user.id,
      status: "active",
    });

    if (!allocation) {
      return NextResponse.json(
        { success: false, message: "No active allocation found" },
        { status: 404 }
      );
    }

    // Check notice period
    const vacateDate = new Date(expectedVacateDate);
    const today = new Date();
    const daysDifference = Math.ceil(
      (vacateDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDifference < allocation.noticePeriodDays) {
      return NextResponse.json(
        {
          success: false,
          message: `Minimum notice period is ${allocation.noticePeriodDays} days. Please select a later date.`,
        },
        { status: 400 }
      );
    }

    // Update allocation
    allocation.status = "notice_period";
    allocation.noticeGivenDate = today;
    allocation.expectedVacateDate = vacateDate;
    if (reason) {
      allocation.tenantNotes = reason;
    }
    await allocation.save();

    // Update room bed
    const room: any = await Room.findById(allocation.roomId);
    if (room) {
      const bedIndex = room.beds?.findIndex(
        (b: any) => b.bedNumber === allocation.bedNumber
      );
      if (bedIndex !== -1 && bedIndex !== undefined) {
        room.beds[bedIndex].noticeGiven = true;
        room.beds[bedIndex].noticeDate = today;
        room.beds[bedIndex].expectedVacateDate = vacateDate;
        await room.save();
      }
    }

    // Notify owner
    const Listing = (await import("@/models/listing")).default;
    const Notification = (await import("@/models/notification")).default;
    
    const listing = await Listing.findById(allocation.listingId);
    if (listing) {
      await Notification.create({
        userId: listing.ownerId,
        type: "notice_given",
        title: "Tenant Notice Period",
        message: `Tenant in Room ${allocation.roomNumber}, Bed ${allocation.bedNumber} at ${allocation.pgName} has given notice. Expected vacate date: ${vacateDate.toLocaleDateString()}.`,
        relatedId: allocation._id,
        relatedType: "allocation",
        priority: "high",
        metadata: {
          roomNumber: allocation.roomNumber,
          bedNumber: allocation.bedNumber,
          vacateDate: vacateDate,
          reason: reason || "",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Notice period recorded successfully",
      data: {
        noticeGivenDate: today,
        expectedVacateDate: vacateDate,
        noticePeriodDays: allocation.noticePeriodDays,
      },
    });
  } catch (error) {
    console.error("Give notice error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}