import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import Booking from "@/models/booking";
import Commission from "@/models/commission";
import Notification from "@/models/notification";
import { authUser } from "@/actions/authUser";

// Admin delete booking request
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();

    // Verify admin authentication
    const user = await authUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const { id: bookingId } = await params;

    // Get booking details before deletion
    const booking = await Booking.findById(bookingId)
      .populate("userId", "fullName email")
      .populate("listingId", "pgName ownerId");

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Delete associated commission if exists
    await Commission.deleteMany({ bookingId: booking._id });

    // Delete associated notifications
    await Notification.deleteMany({
      relatedId: booking._id,
      relatedType: "booking",
    });

    // Delete the booking
    await Booking.findByIdAndDelete(bookingId);

    // Create notification for user about booking deletion
    await Notification.create({
      userId: booking.userId._id,
      type: "booking_cancelled",
      title: "Booking Request Deleted",
      message: `Your booking request for ${booking.listingId.pgName} has been deleted by admin.`,
      relatedId: booking._id,
      relatedType: "booking",
      priority: "high",
      metadata: {
        listingName: booking.listingId.pgName,
        reason: "Admin deletion",
        deletedBy: user.fullName,
      },
    });

    // Create notification for owner about booking deletion
    await Notification.create({
      userId: booking.listingId.ownerId,
      type: "general",
      title: "Booking Request Deleted",
      message: `A booking request for ${booking.listingId.pgName} has been deleted by admin.`,
      relatedId: booking._id,
      relatedType: "booking",
      priority: "medium",
      metadata: {
        listingName: booking.listingId.pgName,
        tenantName: booking.fullName,
        reason: "Admin deletion",
        deletedBy: user.fullName,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Booking request deleted successfully",
      data: {
        bookingId: booking._id,
        listingName: booking.listingId.pgName,
        tenantName: booking.fullName,
        deletedBy: user.fullName,
      },
    });
  } catch (error) {
    console.error("Admin delete booking error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete booking request",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
