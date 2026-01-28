import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import mongoose from "mongoose";
import Room from "@/models/room";
import TenantAllocation from "@/models/tenantAllocation";
import Listing from "@/models/listing";
import Notification from "@/models/notification";
import { authUser } from "@/actions/authUser";

// POST - Vacate a bed (process move-out)
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

    if (!bedNumber) {
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
    if (bed.status !== "occupied" && bed.status !== "reserved") {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, message: "Bed is not occupied" },
        { status: 400 }
      );
    }

    // Get allocation
    const allocation = await TenantAllocation.findById(bed.currentAllocationId).session(session);
    if (!allocation) {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, message: "Allocation not found" },
        { status: 404 }
      );
    }

    // Update allocation
    allocation.status = "vacated";
    allocation.actualMoveOutDate = actualMoveOutDate ? new Date(actualMoveOutDate) : new Date();
    allocation.refundAmount = refundAmount;
    allocation.securityDepositRefunded = refundAmount > 0;
    if (notes) {
      allocation.ownerNotes = notes;
    }
    await allocation.save({ session });

    // Update bed status
    room.beds[bedIndex].status = "available";
    room.beds[bedIndex].currentTenantId = null;
    room.beds[bedIndex].currentAllocationId = null;
    room.beds[bedIndex].occupiedFrom = null;
    room.beds[bedIndex].expectedVacateDate = null;
    room.beds[bedIndex].noticeGiven = false;
    room.beds[bedIndex].noticeDate = null;

    await room.save({ session });

    // Update listing availability
    await updateListingAvailability(room.listingId.toString(), session);

    // Create notification for tenant
    await Notification.create(
      [
        {
          userId: allocation.tenantId,
          type: "move_out_completed",
          title: "Move-out Completed",
          message: `Your stay at ${listing.pgName}, Room ${room.roomNumber} has been completed. ${
            refundAmount > 0 ? `Security deposit refund: ₹${refundAmount}` : ""
          }`,
          relatedId: allocation._id,
          relatedType: "allocation",
          priority: "medium",
          metadata: {
            roomNumber: room.roomNumber,
            bedNumber,
            refundAmount,
          },
        },
      ],
      { session }
    );

    await session.commitTransaction();

    return NextResponse.json({
      success: true,
      message: "Tenant vacated successfully",
      data: {
        allocation,
        room,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Vacate tenant error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
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
  try {
    await connectToDB();
    const user = await authUser();
    const { id: roomId } = await params;

    if (!user || (user.role !== "owner" && user.role !== "admin")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { bedNumber, expectedVacateDate } = await req.json();

    if (!bedNumber || !expectedVacateDate) {
      return NextResponse.json(
        { success: false, message: "Bed number and expected vacate date are required" },
        { status: 400 }
      );
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return NextResponse.json(
        { success: false, message: "Room not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    const listing = await Listing.findById(room.listingId);
    if (!listing || listing.ownerId.toString() !== user.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 }
      );
    }

    // Find and update bed
    const bedIndex = room.beds.findIndex((b: any) => b.bedNumber === bedNumber);
    if (bedIndex === -1) {
      return NextResponse.json(
        { success: false, message: "Bed not found" },
        { status: 404 }
      );
    }

    room.beds[bedIndex].noticeGiven = true;
    room.beds[bedIndex].noticeDate = new Date();
    room.beds[bedIndex].expectedVacateDate = new Date(expectedVacateDate);

    await room.save();

    // Update allocation
    if (room.beds[bedIndex].currentAllocationId) {
      await TenantAllocation.findByIdAndUpdate(room.beds[bedIndex].currentAllocationId, {
        status: "notice_period",
        noticeGivenDate: new Date(),
        expectedVacateDate: new Date(expectedVacateDate),
      });
    }

    return NextResponse.json({
      success: true,
      message: "Notice period recorded",
      data: room,
    });
  } catch (error) {
    console.error("Record notice error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function
async function updateListingAvailability(listingId: string, session: any) {
  const rooms = await Room.find({ listingId }).session(session);

  const roomTypeAvailability: Record<string, number> = {};

  rooms.forEach((room) => {
    if (!roomTypeAvailability[room.roomType]) {
      roomTypeAvailability[room.roomType] = 0;
    }
    roomTypeAvailability[room.roomType] += room.availableBeds;
  });

  const listing = await Listing.findById(listingId).session(session);
  if (listing) {
    listing.roomTypes = listing.roomTypes.map((rt: any) => {
      const roomsWithAvailability = rooms.filter(
        (r) => r.roomType === rt.type && r.availableBeds > 0
      ).length;
      rt.availableRooms = roomsWithAvailability;
      return rt;
    });
    await listing.save({ session });
  }
}