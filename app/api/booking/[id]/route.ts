// app/api/booking/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import mongoose from "mongoose";
import Booking from "@/models/booking";
import Listing from "@/models/listing";
import Notification from "@/models/notification";
import User from "@/models/user";
import { authUser } from "@/actions/authUser";

// PATCH - Update booking status (owner approval/rejection)
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

    const { id: bookingId } = await params;
    const { status, ownerNotes } = await req.json();

    // Validate status
    if (!status || !["confirmed", "rejected", "cancelled"].includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status" },
        { status: 400 }
      );
    }

    session.startTransaction();

    // Find booking with listing details
    const booking = await Booking.findById(bookingId)
      .populate("listingId", "pgName ownerId location primaryImage roomTypes")
      .populate("userId", "fullName email phone")
      .session(session);

    if (!booking) {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Verify user is the owner of the listing
    const listing = booking.listingId as any;
    if (listing.ownerId.toString() !== user.id) {
      await session.abortTransaction();
      return NextResponse.json(
        { 
          success: false, 
          message: "Unauthorized - You can only manage bookings for your own properties" 
        },
        { status: 403 }
      );
    }

    // Check current booking status
    if (booking.status !== "pending") {
      await session.abortTransaction();
      return NextResponse.json(
        { 
          success: false, 
          message: `Cannot ${status} booking. Current status: ${booking.status}` 
        },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: any = {
      status: status,
      updatedAt: new Date(),
    };

    // Add owner notes if provided
    if (ownerNotes) {
      updateData.ownerNotes = ownerNotes;
    }

    // Handle confirmed booking
    if (status === "confirmed") {
      // Create notification for tenant
      await Notification.create([{
        userId: booking.userId._id,
        type: "booking_update",
        title: "Booking Approved!",
        message: `Your booking for ${listing.pgName} has been approved by the owner.${
          booking.paymentMethod === "online" 
            ? " Please proceed with the payment." 
            : " The owner will contact you for cash payment collection."
        }`,
        relatedId: booking._id,
        relatedType: "booking",
        priority: "high",
        metadata: {
          listingName: listing.pgName,
          ownerName: user.fullName,
          paymentMethod: booking.paymentMethod,
          bookingId: booking._id.toString(),
        },
      }], { session });

      // Create notification for admins
      const admins = await User.find({ role: "admin" }).select("_id").session(session);
      for (const admin of admins) {
        await Notification.create([{
          userId: admin._id,
          type: "booking_update",
          title: "Booking Confirmed",
          message: `Owner ${user.fullName} has confirmed a booking for ${listing.pgName}. ${
            booking.paymentMethod === "online"
              ? "Payment will be collected online."
              : "Cash payment will be collected by owner."
          }`,
          relatedId: booking._id,
          relatedType: "booking",
          priority: "medium",
          metadata: {
            ownerId: user.id,
            ownerName: user.fullName,
            listingName: listing.pgName,
            tenantName: booking.fullName,
            paymentMethod: booking.paymentMethod,
            bookingFee: booking.bookingFee?.amount || 0,
            totalAmount: booking.totalDue || 0,
          },
        }], { session });
      }

      // Update listing availability if needed
      if (booking.roomType) {
        await Listing.findByIdAndUpdate(
          listing._id,
          {
            $inc: {
              "roomTypes.$[room].availableRooms": -1,
            },
          },
          {
            arrayFilters: [{ "room.type": booking.roomType }],
            session,
          }
        );
      }
    }

    // Handle rejected booking
    if (status === "rejected") {
      // Create notification for tenant
      await Notification.create([{
        userId: booking.userId._id,
        type: "booking_update",
        title: "Booking Rejected",
        message: `Your booking for ${listing.pgName} has been rejected by the owner.${
          ownerNotes ? ` Reason: ${ownerNotes}` : ""
        }`,
        relatedId: booking._id,
        relatedType: "booking",
        priority: "high",
        metadata: {
          listingName: listing.pgName,
          ownerName: user.fullName,
          reason: ownerNotes || "No reason provided",
        },
      }], { session });

      // If any payment was made, it needs to be refunded (handled separately)
      if (booking.totalPaid > 0) {
        updateData.refundStatus = "pending";
        updateData.refundAmount = booking.totalPaid;
        
        // Notify admins about pending refund
        const admins = await User.find({ role: "admin" }).select("_id").session(session);
        for (const admin of admins) {
          await Notification.create([{
            userId: admin._id,
            type: "payment",
            title: "Refund Required",
            message: `Booking for ${listing.pgName} was rejected. Refund of ₹${booking.totalPaid.toLocaleString()} is pending.`,
            relatedId: booking._id,
            relatedType: "booking",
            priority: "high",
            metadata: {
              bookingId: booking._id.toString(),
              refundAmount: booking.totalPaid,
              tenantName: booking.fullName,
              listingName: listing.pgName,
            },
          }], { session });
        }
      }
    }

    // Use findByIdAndUpdate instead of save() to avoid validation issues
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { $set: updateData },
      { 
        new: true, 
        session,
        runValidators: false // Disable validators for partial update
      }
    )
    .populate("listingId", "pgName primaryImage location")
    .populate("userId", "fullName email phone");

    await session.commitTransaction();

    return NextResponse.json({
      success: true,
      message: `Booking ${status} successfully`,
      data: updatedBooking,
    });

  } catch (error) {
    await session.abortTransaction();
    console.error("Update booking error:", error);
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

// GET - Get single booking details
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
      .populate("listingId", "pgName primaryImage location ownerId roomTypes")
      .populate("userId", "fullName email phone")
      .populate("ownerId", "fullName email phone");

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Check authorization
    const listing = booking.listingId as any;
    const isOwner = listing?.ownerId?.toString() === user.id;
    const isTenant = booking.userId?._id?.toString() === user.id;
    const isAdmin = user.role === "admin";

    if (!isOwner && !isTenant && !isAdmin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized to view this booking" },
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

// DELETE - Cancel booking (by tenant or owner)
export async function DELETE(
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

    const { id: bookingId } = await params;
    
    let reason = "";
    try {
      const body = await req.json();
      reason = body.reason || "";
    } catch {
      // No body provided
    }

    session.startTransaction();

    const booking = await Booking.findById(bookingId)
      .populate("listingId", "pgName ownerId")
      .session(session);

    if (!booking) {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Check authorization
    const listing = booking.listingId as any;
    const isOwner = listing?.ownerId?.toString() === user.id;
    const isTenant = booking.userId?.toString() === user.id;

    if (!isOwner && !isTenant) {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, message: "Unauthorized to cancel this booking" },
        { status: 403 }
      );
    }

    // Check if booking can be cancelled
    if (!["pending", "confirmed"].includes(booking.status)) {
      await session.abortTransaction();
      return NextResponse.json(
        { 
          success: false, 
          message: `Cannot cancel booking with status: ${booking.status}` 
        },
        { status: 400 }
      );
    }

    const previousStatus = booking.status;

    // Build update object
    const updateData: any = {
      status: "cancelled",
      cancelledBy: user.id,
      cancelledAt: new Date(),
      cancellationReason: reason || "No reason provided",
    };

    // Handle refunds if payment was made
    if (booking.totalPaid > 0) {
      updateData.refundStatus = "pending";
      updateData.refundAmount = booking.totalPaid;

      // Notify admins about pending refund
      const admins = await User.find({ role: "admin" }).select("_id").session(session);
      for (const admin of admins) {
        await Notification.create([{
          userId: admin._id,
          type: "payment",
          title: "Refund Required - Booking Cancelled",
          message: `Booking for ${listing.pgName} was cancelled. Refund of ₹${booking.totalPaid.toLocaleString()} is pending.`,
          relatedId: booking._id,
          relatedType: "booking",
          priority: "high",
          metadata: {
            bookingId: booking._id.toString(),
            refundAmount: booking.totalPaid,
            cancelledBy: isOwner ? "owner" : "tenant",
            tenantName: booking.fullName,
            listingName: listing.pgName,
          },
        }], { session });
      }
    }

    // Update room availability if booking was confirmed
    if (previousStatus === "confirmed" && booking.roomType) {
      await Listing.findByIdAndUpdate(
        listing._id,
        {
          $inc: {
            "roomTypes.$[room].availableRooms": 1,
          },
        },
        {
          arrayFilters: [{ "room.type": booking.roomType }],
          session,
        }
      );
    }

    // Update booking using findByIdAndUpdate
    await Booking.findByIdAndUpdate(
      bookingId,
      { $set: updateData },
      { session, runValidators: false }
    );

    // Send notifications
    const notificationRecipient = isOwner ? booking.userId : listing.ownerId;
    await Notification.create([{
      userId: notificationRecipient,
      type: "booking_cancelled",
      title: "Booking Cancelled",
      message: `Booking for ${listing.pgName} has been cancelled${reason ? `: ${reason}` : "."}`,
      relatedId: booking._id,
      relatedType: "booking",
      priority: "high",
    }], { session });

    await session.commitTransaction();

    return NextResponse.json({
      success: true,
      message: "Booking cancelled successfully",
      data: {
        bookingId: booking._id,
        status: "cancelled",
        refundPending: booking.totalPaid > 0,
        refundAmount: booking.totalPaid > 0 ? booking.totalPaid : 0,
      },
    });

  } catch (error) {
    await session.abortTransaction();
    console.error("Cancel booking error:", error);
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