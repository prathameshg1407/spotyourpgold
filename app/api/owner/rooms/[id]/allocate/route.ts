import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import mongoose from "mongoose";
import Room from "@/models/room";
import TenantAllocation from "@/models/tenantAllocation";
import Booking from "@/models/booking";
import Listing from "@/models/listing";
import User from "@/models/user";
import Notification from "@/models/notification";
import { authUser } from "@/actions/authUser";

// POST - Allocate tenant to a bed
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
      bookingId,
      bedNumber,
      moveInDate,
      expectedMoveOutDate,
      noticePeriodDays = 30,
    } = await req.json();

    // Validate required fields
    if (!bookingId || !bedNumber) {
      return NextResponse.json(
        { success: false, message: "Booking ID and bed number are required" },
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

    // Get booking
    const booking = await Booking.findById(bookingId).session(session);
    if (!booking) {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Check booking status
    if (booking.status !== "confirmed") {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, message: "Booking must be confirmed before allocation" },
        { status: 400 }
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
    if (bed.status !== "available") {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, message: `Bed ${bedNumber} is not available` },
        { status: 400 }
      );
    }

    // Check if booking already has an allocation
    const existingAllocation = await TenantAllocation.findOne({
      bookingId,
      status: { $in: ["pending", "active"] },
    }).session(session);

    if (existingAllocation) {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, message: "Booking already has an active allocation" },
        { status: 400 }
      );
    }

    // Calculate expected move-out date if not provided
    const moveIn = moveInDate ? new Date(moveInDate) : new Date(booking.moveInDate);
    const durationMonths = parseInt(booking.duration) || 1;
    const moveOut = expectedMoveOutDate
      ? new Date(expectedMoveOutDate)
      : new Date(moveIn.getTime() + durationMonths * 30 * 24 * 60 * 60 * 1000);

    // Create tenant allocation
    const allocation = new TenantAllocation({
      tenantId: booking.userId,
      bookingId: booking._id,
      listingId: room.listingId,
      roomId: room._id,
      bedId: bed._id,
      roomNumber: room.roomNumber,
      bedNumber: bedNumber,
      roomType: room.roomType,
      pgName: listing.pgName,
      allocatedAt: new Date(),
      moveInDate: moveIn,
      expectedMoveOutDate: moveOut,
      status: "active",
      noticePeriodDays,
      monthlyRent: room.monthlyRent,
      securityDeposit: room.securityDeposit,
      securityDepositPaid: booking.paymentStatus === "completed_cash",
    });

    // Generate initial rent history
    const rentHistory = [];
    const currentDate = new Date(moveIn);
    for (let i = 0; i < durationMonths; i++) {
      const monthDate = new Date(currentDate);
      monthDate.setMonth(monthDate.getMonth() + i);
      
      const dueDate = new Date(monthDate);
      dueDate.setDate(5); // Due on 5th of each month

      rentHistory.push({
        month: new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
        amount: room.monthlyRent,
        status: i === 0 && booking.paymentStatus === "completed_cash" ? "paid" : "pending",
        paidAmount: i === 0 && booking.paymentStatus === "completed_cash" ? room.monthlyRent : 0,
        paidAt: i === 0 && booking.paymentStatus === "completed_cash" ? new Date() : null,
        dueDate,
        lateFee: 0,
        paymentMethod: "",
        transactionId: "",
      });
    }
    allocation.rentHistory = rentHistory;

    await allocation.save({ session });

    // Update bed status
    room.beds[bedIndex].status = "occupied";
    room.beds[bedIndex].currentTenantId = booking.userId;
    room.beds[bedIndex].currentAllocationId = allocation._id;
    room.beds[bedIndex].occupiedFrom = moveIn;
    room.beds[bedIndex].expectedVacateDate = moveOut;

    await room.save({ session });

    // Update booking status to completed
    booking.status = "completed";
    await booking.save({ session });

    // Update listing available rooms count
    await updateListingAvailability(room.listingId.toString(), session);

    // Create notification for tenant
    await Notification.create(
      [
        {
          userId: booking.userId,
          type: "room_allocated",
          title: "Room Allocated!",
          message: `You have been allocated Room ${room.roomNumber}, Bed ${bedNumber} at ${listing.pgName}. Move-in date: ${moveIn.toLocaleDateString()}.`,
          relatedId: allocation._id,
          relatedType: "allocation",
          priority: "high",
          metadata: {
            roomNumber: room.roomNumber,
            bedNumber,
            moveInDate: moveIn,
            pgName: listing.pgName,
          },
        },
      ],
      { session }
    );

    await session.commitTransaction();

    return NextResponse.json({
      success: true,
      message: "Tenant allocated successfully",
      data: allocation,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Allocate tenant error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
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
      const available = roomTypeAvailability[rt.type] || 0;
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