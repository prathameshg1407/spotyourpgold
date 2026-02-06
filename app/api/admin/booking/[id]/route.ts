import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import mongoose from "mongoose";
import Booking from "@/models/booking";
import Commission from "@/models/commission";
import Notification from "@/models/notification";
import { authUser } from "@/actions/authUser";

// GET single booking details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();

    const user = await authUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const { id: bookingId } = await params;

    const booking = await Booking.findById(bookingId)
      .populate("userId", "fullName email phoneNumber")
      .populate("listingId", "pgName location primaryImage rooms")
      .populate("ownerId", "fullName email phone bankDetails");

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Get related commissions
    const commissions = await Commission.find({ bookingId: booking._id })
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: {
        booking,
        commissions,
      },
    });
  } catch (error) {
    console.error("Get booking error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch booking" },
      { status: 500 }
    );
  }
}

// UPDATE booking (status, notes, etc.)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();

    const user = await authUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const { id: bookingId } = await params;
    const updates = await req.json();

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Apply updates
    const allowedUpdates = ["status", "adminNotes"];
    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        (booking as any)[key] = updates[key];
      }
    }

    await booking.save();

    // Send notification if status changed
    if (updates.status) {
      const statusMessages: Record<string, string> = {
        confirmed: "Your booking has been confirmed!",
        cancelled: "Your booking has been cancelled.",
        completed: "Your booking has been marked as completed.",
        active: "Your booking is now active. Welcome to your new PG!",
      };

      if (statusMessages[updates.status]) {
        await Notification.create({
          userId: booking.userId,
          type: updates.status === "confirmed" ? "booking_approved" : 
                updates.status === "cancelled" ? "booking_cancelled" : "general",
          title: `Booking ${updates.status.charAt(0).toUpperCase() + updates.status.slice(1)}`,
          message: statusMessages[updates.status],
          relatedId: booking._id,
          relatedType: "booking",
          priority: updates.status === "cancelled" ? "high" : "medium",
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Booking updated successfully",
      data: booking,
    });
  } catch (error) {
    console.error("Update booking error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update booking" },
      { status: 500 }
    );
  }
}

// DELETE booking
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await mongoose.startSession();

  try {
    await connectToDB();

    const user = await authUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const { id: bookingId } = await params;

    session.startTransaction();

    // Get booking details before deletion
    const booking = await Booking.findById(bookingId)
      .populate("userId", "fullName email")
      .populate("listingId", "pgName ownerId")
      .session(session);

    if (!booking) {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Delete associated commissions
    await Commission.deleteMany({ bookingId: booking._id }).session(session);

    // Delete associated notifications
    await Notification.deleteMany({
      relatedId: booking._id,
      relatedType: "booking",
    }).session(session);

    // Delete the booking
    await Booking.findByIdAndDelete(bookingId).session(session);

    // Create notification for user about booking deletion
    await Notification.create(
      [
        {
          userId: booking.userId._id,
          type: "booking_cancelled",
          title: "Booking Request Deleted",
          message: `Your booking request for ${(booking.listingId as any).pgName} has been deleted by admin.`,
          relatedId: booking._id,
          relatedType: "booking",
          priority: "high",
          metadata: {
            listingName: (booking.listingId as any).pgName,
            reason: "Admin deletion",
            deletedBy: user.fullName,
          },
        },
      ],
      { session }
    );

    // Create notification for owner
    if ((booking.listingId as any).ownerId) {
      await Notification.create(
        [
          {
            userId: (booking.listingId as any).ownerId,
            type: "general",
            title: "Booking Request Deleted",
            message: `A booking request for ${(booking.listingId as any).pgName} has been deleted by admin.`,
            relatedId: booking._id,
            relatedType: "booking",
            priority: "medium",
            metadata: {
              listingName: (booking.listingId as any).pgName,
              tenantName: booking.fullName,
              deletedBy: user.fullName,
            },
          },
        ],
        { session }
      );
    }

    await session.commitTransaction();

    return NextResponse.json({
      success: true,
      message: "Booking request deleted successfully",
      data: {
        bookingId: booking._id,
        listingName: (booking.listingId as any).pgName,
        tenantName: booking.fullName,
        deletedBy: user.fullName,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Admin delete booking error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete booking request",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    session.endSession();
  }
}