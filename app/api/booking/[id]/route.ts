import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import mongoose from "mongoose";
import Booking from "@/models/booking";
import Listing from "@/models/listing";
import User from "@/models/user";
import Notification from "@/models/notification";
import Commission from "@/models/commission";
import { authUser } from "@/actions/authUser";

// Update booking status (approve/reject)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await mongoose.startSession();
  
  try {
    await connectToDB();

    const user = await authUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { status, ownerNotes } = await req.json();
    const { id: bookingId } = await params;

    if (!["confirmed", "rejected"].includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status" },
        { status: 400 }
      );
    }

    session.startTransaction();

    const booking = await Booking.findById(bookingId).session(session);
    if (!booking) {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    const listing = await Listing.findById(booking.listingId).session(session);
    if (!listing || listing.ownerId.toString() !== user.id) {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, message: "Unauthorized - Not the owner" },
        { status: 403 }
      );
    }

    if (booking.status !== "pending") {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, message: "Booking is no longer pending" },
        { status: 400 }
      );
    }

    // Update booking status
    booking.status = status;
    if (ownerNotes) {
      booking.ownerNotes = ownerNotes;
    }

    let responseData = booking.toObject();
    let notificationMessage = "";

    if (status === "confirmed") {
      // When confirmed, set payment status to pending_cash_payment
      booking.paymentStatus = "pending_cash_payment";
      
      // Create commission records for first month
      const now = new Date();
      
      // 1. Admin Commission Record (10% that admin receives)
      await Commission.create([{
        ownerId: listing.ownerId,
        bookingId: booking._id,
        listingId: listing._id,
        tenantId: booking.userId,
        commissionType: "first_month_admin",
        monthNumber: 1,
        rentMonth: booking.moveInDate,
        baseAmount: booking.amount,
        commissionRate: booking.firstMonthCommission.commissionRate,
        commissionAmount: booking.firstMonthCommission.adminAmount,
        status: "pending", // Will be "completed" when cash payment is verified
        dueDate: now,
        notes: "First month - Admin commission (10%)",
      }], { session });
      
      // 2. Owner Payout Record (90% that admin owes to owner)
      await Commission.create([{
        ownerId: listing.ownerId,
        bookingId: booking._id,
        listingId: listing._id,
        tenantId: booking.userId,
        commissionType: "first_month_owner",
        monthNumber: 1,
        rentMonth: booking.moveInDate,
        baseAmount: booking.amount,
        commissionRate: booking.firstMonthCommission.commissionRate,
        commissionAmount: booking.firstMonthCommission.ownerAmount,
        status: "pending", // Will be "completed" when admin pays owner
        dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days to pay owner
        notes: "First month - Owner payout (90%)",
      }], { session });

      // Check room availability for notification
      const Room = (await import("@/models/room")).default;
      const availableRooms = await Room.find({
        listingId: booking.listingId,
        roomType: booking.roomType,
        "beds.status": "available",
      }).countDocuments().session(session);

      responseData = {
        ...booking.toObject(),
        _roomAllocationRequired: true,
        _availableRooms: availableRooms,
      };

      notificationMessage = availableRooms > 0
        ? `Your booking request for ${listing.pgName} has been approved! Admin commission: ₹${booking.firstMonthCommission.adminAmount}, Your payout: ₹${booking.firstMonthCommission.ownerAmount}`
        : `Your booking request for ${listing.pgName} has been approved. Please complete payment to confirm.`;
    } else {
      notificationMessage = `Your booking request for ${listing.pgName} has been rejected. ${ownerNotes ? `Reason: ${ownerNotes}` : ""}`;
    }

    await booking.save({ session });

    // Create notification for user
    await Notification.create([{
      userId: booking.userId,
      type: status === "confirmed" ? "booking_approved" : "booking_rejected",
      title: status === "confirmed" ? "Booking Approved!" : "Booking Request Rejected",
      message: notificationMessage,
      relatedId: booking._id,
      relatedType: "booking",
      priority: "high",
      metadata: {
        listingName: listing.pgName,
        ownerNotes: ownerNotes || null,
        roomAllocationRequired: status === "confirmed",
        ...(status === "confirmed" && {
          adminCommission: booking.firstMonthCommission.adminAmount,
          ownerPayout: booking.firstMonthCommission.ownerAmount,
        }),
      },
    }], { session });

    await session.commitTransaction();

    return NextResponse.json({
      success: true,
      message: `Booking ${status} successfully`,
      data: responseData,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Booking update error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    session.endSession();
  }
}

// Get booking details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();

    const user = await authUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: bookingId } = await params;

    const booking = await Booking.findById(bookingId)
      .populate("listingId", "pgName location primaryImage ownerId")
      .populate("userId", "fullName email phone");

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    const listing = await Listing.findById(booking.listingId);
    const isBookingOwner = booking.userId._id.toString() === user.id;
    const isListingOwner = listing?.ownerId.toString() === user.id;
    const isAdmin = user.role === "admin";

    if (!isBookingOwner && !isListingOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error("Get booking error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Delete booking request
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();

    const user = await authUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: bookingId } = await params;

    const booking = await Booking.findById(bookingId).populate("listingId");
    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    const isBookingOwner = booking.userId.toString() === user.id;
    const isListingOwner = booking.listingId.ownerId.toString() === user.id;

    if (!isBookingOwner && !isListingOwner) {
      return NextResponse.json(
        { success: false, message: "Unauthorized to delete this booking" },
        { status: 403 }
      );
    }

    if (booking.status !== "pending") {
      return NextResponse.json(
        { success: false, message: "Only pending bookings can be deleted" },
        { status: 400 }
      );
    }

    await Booking.findByIdAndDelete(bookingId);

    const notificationUserId = isBookingOwner
      ? booking.listingId.ownerId
      : booking.userId;

    await Notification.create({
      userId: notificationUserId,
      type: "booking_cancelled",
      title: "Booking Request Cancelled",
      message: isBookingOwner
        ? `Booking request for ${booking.listingId.pgName} has been cancelled by the user.`
        : `Booking request for ${booking.listingId.pgName} has been cancelled by the owner.`,
      relatedId: bookingId,
      relatedType: "booking",
      priority: "medium",
    });

    return NextResponse.json({
      success: true,
      message: "Booking request deleted successfully",
    });
  } catch (error) {
    console.error("Delete booking error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}