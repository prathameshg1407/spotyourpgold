import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import Booking from "@/models/booking";
import Listing from "@/models/listing";
import User from "@/models/user";
import Notification from "@/models/notification";
import { authUser } from "@/actions/authUser";

// Update booking status (approve/reject)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();

    // Check if user is authenticated and is the owner
    const user = await authUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { status, ownerNotes } = await req.json();
    const { id: bookingId } = await params;

    // Validate status
    if (!["confirmed", "rejected"].includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status" },
        { status: 400 }
      );
    }

    // Get booking with listing details
    const booking = await Booking.findById(bookingId).populate("listingId");
    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Check if user is the owner of the listing
    const listing = await Listing.findById(booking.listingId);
    if (!listing || listing.ownerId.toString() !== user.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Not the owner" },
        { status: 403 }
      );
    }

    // Check if booking is still pending
    if (booking.status !== "pending") {
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

    await booking.save();

    // Get user details for notification
    const userDetails = await User.findById(booking.userId).select(
      "fullName email phoneNumber"
    );

    // Room allocation logic for confirmed bookings
    let responseData = booking.toObject();
    let notificationMessage = "";

    if (status === "confirmed") {
      // Check if rooms are set up for this listing
      const Room = (await import("@/models/room")).default;
      const availableRooms = await Room.find({
        listingId: booking.listingId._id || booking.listingId,
        roomType: booking.roomType,
        "beds.status": "available",
      }).countDocuments();

      // Add room allocation metadata to response
      responseData = {
        ...booking.toObject(),
        _roomAllocationRequired: true,
        _availableRooms: availableRooms,
      };

      // Set notification message based on room availability
      notificationMessage =
        availableRooms > 0
          ? `Your booking request for ${listing.pgName} has been approved. The owner will allocate you a room shortly.`
          : `Your booking request for ${listing.pgName} has been approved. Please complete payment to confirm your booking.`;
    } else {
      // Rejected booking message
      notificationMessage = `Your booking request for ${listing.pgName} has been rejected. ${
        ownerNotes ? `Reason: ${ownerNotes}` : ""
      }`;
    }

    // Create notification for user
    const notificationType =
      status === "confirmed" ? "booking_approved" : "booking_rejected";
    const notificationTitle =
      status === "confirmed" ? "Booking Approved!" : "Booking Request Rejected";

    await Notification.create({
      userId: booking.userId,
      type: notificationType,
      title: notificationTitle,
      message: notificationMessage,
      relatedId: booking._id,
      relatedType: "booking",
      priority: "high",
      metadata: {
        listingName: listing.pgName,
        ownerNotes: ownerNotes || null,
        roomAllocationRequired: status === "confirmed",
      },
    });

    // TODO: Send notification email/SMS to user
    // This would be implemented with your email/SMS service
    if (status === "confirmed") {
      console.log(`Booking approved for user: ${userDetails?.email}`);
      // Send email: "Your booking is approved. Please complete payment to confirm."
    } else {
      console.log(`Booking rejected for user: ${userDetails?.email}`);
      // Send email: "Your booking request has been rejected."
    }

    return NextResponse.json({
      success: true,
      message: `Booking ${status} successfully`,
      data: responseData,
    });
  } catch (error) {
    console.error("Booking update error:", error);
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
      .populate("userId", "fullName email phoneNumber");

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Check if user is either the booking owner or the listing owner
    const listing = await Listing.findById(booking.listingId);
    const isBookingOwner = booking.userId.toString() === user.id;
    const isListingOwner = listing?.ownerId.toString() === user.id;

    if (!isBookingOwner && !isListingOwner) {
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

// Delete booking request (User can delete their own pending requests)
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

    // Find the booking
    const booking = await Booking.findById(bookingId).populate("listingId");
    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Check if user is the owner of the booking or the owner of the listing
    const isBookingOwner = booking.userId.toString() === user.id;
    const isListingOwner = booking.listingId.ownerId.toString() === user.id;

    if (!isBookingOwner && !isListingOwner) {
      return NextResponse.json(
        { success: false, message: "Unauthorized to delete this booking" },
        { status: 403 }
      );
    }

    // Only allow deletion of pending bookings
    if (booking.status !== "pending") {
      return NextResponse.json(
        { success: false, message: "Only pending bookings can be deleted" },
        { status: 400 }
      );
    }

    // Delete the booking
    await Booking.findByIdAndDelete(bookingId);

    // Create notification for the other party
    const notificationUserId = isBookingOwner
      ? booking.listingId.ownerId
      : booking.userId;
    const notificationMessage = isBookingOwner
      ? `Booking request for ${booking.listingId.pgName} has been cancelled by the user.`
      : `Booking request for ${booking.listingId.pgName} has been cancelled by the owner.`;

    await Notification.create({
      userId: notificationUserId,
      type: "booking_cancelled",
      title: "Booking Request Cancelled",
      message: notificationMessage,
      relatedId: bookingId,
      relatedType: "booking",
      priority: "medium",
      metadata: {
        listingName: booking.listingId.pgName,
        cancelledBy: user.fullName,
      },
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