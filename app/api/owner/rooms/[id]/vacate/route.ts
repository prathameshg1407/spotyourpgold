import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import mongoose from "mongoose";
import Room from "@/models/room";
import TenantAllocation from "@/models/tenantAllocation";
import Listing from "@/models/listing";
import Notification from "@/models/notification";
import { authUser } from "@/actions/authUser";

// POST - Vacate tenant from a bed
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await connectToDB();
    const user = await authUser();
    const { id: roomId } = await params;

    if (!user || (user.role !== "owner" && user.role !== "admin")) {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const {
      bedNumber,
      actualMoveOutDate,
      refundAmount = 0,
      notes = "",
    } = await req.json();

    // Validate required fields
    if (!bedNumber) {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, message: "Bed number is required" },
        { status: 400 }
      );
    }

    // Get room
    const room = await Room.findById(roomId).session(session);
    if (!room) {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, message: "Room not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    const listing = await Listing.findById(room.listingId).session(session);
    if (!listing || listing.ownerId.toString() !== user.id) {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 }
      );
    }

    // Find the bed
    const bedIndex = room.beds.findIndex((b: any) => b.bedNumber === bedNumber);
    if (bedIndex === -1) {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, message: "Bed not found" },
        { status: 404 }
      );
    }

    const bed = room.beds[bedIndex];
    if (bed.status !== "occupied") {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, message: `Bed ${bedNumber} is not occupied` },
        { status: 400 }
      );
    }

    // Get the allocation
    const allocation = await TenantAllocation.findOne({
      roomId: room._id,
      bedNumber: bedNumber,
      status: { $in: ["active", "notice_period"] },
    }).session(session);

    if (!allocation) {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, message: "No active allocation found for this bed" },
        { status: 404 }
      );
    }

    // Update allocation to vacated
    const moveOutDate = actualMoveOutDate ? new Date(actualMoveOutDate) : new Date();
    allocation.status = "vacated";
    allocation.actualMoveOutDate = moveOutDate;
    allocation.refundAmount = parseFloat(refundAmount.toString()) || 0;
    allocation.ownerNotes = notes;
    allocation.securityDepositRefunded = refundAmount > 0;

    await allocation.save({ session });

    // Update bed status
    const tenantId = bed.currentTenantId;
    room.beds[bedIndex].status = "available";
    room.beds[bedIndex].currentTenantId = null;
    room.beds[bedIndex].currentAllocationId = null;
    room.beds[bedIndex].occupiedFrom = null;
    room.beds[bedIndex].expectedVacateDate = null;
    room.beds[bedIndex].noticeGiven = false;
    room.beds[bedIndex].noticeDate = null;

    await room.save({ session });

    // Update listing available rooms count
    await updateListingAvailability(room.listingId.toString(), session);

    // Create notification for tenant (only if we have a tenantId)
    if (tenantId) {
      try {
        const notificationData = {
          userId: tenantId,
          type: "move_out_processed", // ✅ This now matches the schema
          title: "Move-out Processed",
          message: `Your move-out from Room ${room.roomNumber}, Bed ${bedNumber} at ${listing.pgName} has been processed.${
            refundAmount > 0
              ? ` Security deposit refund: ₹${refundAmount.toLocaleString()}`
              : ""
          }`,
          relatedId: allocation._id,
          relatedType: "allocation", // ✅ This now matches the schema
          priority: "high",
          isRead: false,
          metadata: {
            roomNumber: room.roomNumber,
            bedNumber: bedNumber,
            pgName: listing.pgName,
            moveOutDate: moveOutDate,
            refundAmount: refundAmount,
          },
        };

        await Notification.create([notificationData], { session });
      } catch (notifError) {
        // Log notification error but don't fail the transaction
        console.error("Failed to create notification:", notifError);
      }
    }

    await session.commitTransaction();

    return NextResponse.json({
      success: true,
      message: "Tenant vacated successfully",
      data: {
        allocation,
        refundAmount: refundAmount,
      },
    });
  } catch (error: any) {
    await session.abortTransaction();
    console.error("Vacate tenant error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Internal server error",
        details: error.errors
          ? Object.keys(error.errors).map((key) => error.errors[key].message)
          : [],
      },
      { status: 500 }
    );
  } finally {
    session.endSession();
  }
}

// PUT - Record notice period
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await connectToDB();
    const user = await authUser();
    const { id: roomId } = await params;

    if (!user || (user.role !== "owner" && user.role !== "admin")) {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { bedNumber, expectedVacateDate } = await req.json();

    if (!bedNumber || !expectedVacateDate) {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, message: "Bed number and expected vacate date are required" },
        { status: 400 }
      );
    }

    // Get room
    const room = await Room.findById(roomId).session(session);
    if (!room) {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, message: "Room not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    const listing = await Listing.findById(room.listingId).session(session);
    if (!listing || listing.ownerId.toString() !== user.id) {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 }
      );
    }

    // Find the bed
    const bedIndex = room.beds.findIndex((b: any) => b.bedNumber === bedNumber);
    if (bedIndex === -1) {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, message: "Bed not found" },
        { status: 404 }
      );
    }

    const bed = room.beds[bedIndex];
    if (bed.status !== "occupied") {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, message: `Bed ${bedNumber} is not occupied` },
        { status: 400 }
      );
    }

    // Update bed notice period
    room.beds[bedIndex].noticeGiven = true;
    room.beds[bedIndex].noticeDate = new Date();
    room.beds[bedIndex].expectedVacateDate = new Date(expectedVacateDate);

    await room.save({ session });

    // Update allocation status
    const allocation = await TenantAllocation.findOne({
      roomId: room._id,
      bedNumber: bedNumber,
      status: "active",
    }).session(session);

    if (allocation) {
      allocation.status = "notice_period";
      allocation.noticeGivenDate = new Date();
      allocation.expectedVacateDate = new Date(expectedVacateDate);
      await allocation.save({ session });

      // Create notification for tenant
      if (allocation.tenantId) {
        try {
          const notificationData = {
            userId: allocation.tenantId,
            type: "notice_period_recorded", // ✅ This now matches the schema
            title: "Notice Period Recorded",
            message: `Notice period has been recorded for your stay at ${listing.pgName}, Room ${room.roomNumber}, Bed ${bedNumber}. Expected move-out date: ${new Date(
              expectedVacateDate
            ).toLocaleDateString()}`,
            relatedId: allocation._id,
            relatedType: "allocation", // ✅ This now matches the schema
            priority: "high",
            isRead: false,
            metadata: {
              roomNumber: room.roomNumber,
              bedNumber: bedNumber,
              pgName: listing.pgName,
              expectedVacateDate: new Date(expectedVacateDate),
            },
          };

          await Notification.create([notificationData], { session });
        } catch (notifError) {
          console.error("Failed to create notification:", notifError);
        }
      }
    }

    await session.commitTransaction();

    return NextResponse.json({
      success: true,
      message: "Notice period recorded successfully",
      data: room,
    });
  } catch (error: any) {
    await session.abortTransaction();
    console.error("Record notice error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Internal server error",
        details: error.errors
          ? Object.keys(error.errors).map((key) => error.errors[key].message)
          : [],
      },
      { status: 500 }
    );
  } finally {
    session.endSession();
  }
}

// Helper function to update listing availability
async function updateListingAvailability(listingId: string, session: any) {
  const rooms = await Room.find({ listingId }).session(session);

  // Group by room type and count available beds
  const roomTypeAvailability: Record<string, number> = {};

  rooms.forEach((room) => {
    if (!roomTypeAvailability[room.roomType]) {
      roomTypeAvailability[room.roomType] = 0;
    }
    roomTypeAvailability[room.roomType] += room.availableBeds;
  });

  // Update listing
  const listing = await Listing.findById(listingId).session(session);
  if (listing) {
    listing.roomTypes = listing.roomTypes.map((rt: any) => {
      // Count rooms that have at least one available bed
      const roomsWithAvailability = rooms.filter(
        (r) => r.roomType === rt.type && r.availableBeds > 0
      ).length;
      rt.availableRooms = roomsWithAvailability;
      return rt;
    });
    await listing.save({ session });
  }
}