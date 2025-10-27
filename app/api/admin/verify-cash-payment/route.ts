import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import Booking from "@/models/booking";
import Commission from "@/models/commission";
import Listing from "@/models/listing";
import User from "@/models/user";
import Notification from "@/models/notification";
import { authUser } from "@/actions/authUser";

// Admin verifies cash payment
export async function POST(req: NextRequest) {
  try {
    await connectToDB();

    const user = await authUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const { bookingId, action, notes } = await req.json();

    if (!bookingId || !action) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get booking
    const booking = await Booking.findById(bookingId).populate("listingId");
    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Check if booking is completed cash
    if (booking.paymentStatus !== "completed_cash") {
      return NextResponse.json(
        { success: false, message: "Booking is not in completed cash status" },
        { status: 400 }
      );
    }

    if (action === "verify") {
      // Mark as admin verified
      booking.adminVerifiedAt = new Date();
      await booking.save();

      // Create notification for user
      await Notification.create({
        userId: booking.userId,
        type: "payment_reminder",
        title: "Payment Verified",
        message: `Your cash payment has been verified by admin. Your booking is now fully confirmed.`,
        relatedId: booking._id,
        relatedType: "booking",
        priority: "medium",
        metadata: {
          listingName: booking.listingId.pgName,
          amount: booking.amount,
        },
      });

      // Create notification for owner
      const listing = await Listing.findById(booking.listingId);
      if (listing) {
        await Notification.create({
          userId: listing.ownerId,
          type: "payment_reminder",
          title: "Payment Verified by Admin",
          message: `Cash payment for ${listing.pgName} has been verified by admin.`,
          relatedId: booking._id,
          relatedType: "booking",
          priority: "medium",
          metadata: {
            listingName: listing.pgName,
            amount: booking.amount,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: "Cash payment verified successfully",
        data: booking,
      });
    } else if (action === "reject") {
      // Reject the cash payment
      booking.paymentStatus = "pending_cash_payment";
      booking.adminVerifiedAt = null;
      await booking.save();

      // Update commission status
      await Commission.findOneAndUpdate(
        { bookingId: booking._id },
        { status: "pending" }
      );

      // Create notification for user
      await Notification.create({
        userId: booking.userId,
        type: "payment_reminder",
        title: "Payment Verification Failed",
        message: `Your cash payment verification failed. Please contact the owner for clarification. ${
          notes ? `Reason: ${notes}` : ""
        }`,
        relatedId: booking._id,
        relatedType: "booking",
        priority: "high",
        metadata: {
          listingName: booking.listingId.pgName,
          amount: booking.amount,
          reason: notes,
        },
      });

      // Create notification for owner
      const listing = await Listing.findById(booking.listingId);
      if (listing) {
        await Notification.create({
          userId: listing.ownerId,
          type: "payment_reminder",
          title: "Payment Verification Failed",
          message: `Cash payment verification failed for ${
            listing.pgName
          }. Please provide additional proof or contact admin. ${
            notes ? `Reason: ${notes}` : ""
          }`,
          relatedId: booking._id,
          relatedType: "booking",
          priority: "high",
          metadata: {
            listingName: listing.pgName,
            amount: booking.amount,
            reason: notes,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: "Cash payment rejected",
        data: booking,
      });
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid action" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Admin verify cash payment error:", error);
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

// Get pending cash payments for admin verification
export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    const user = await authUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const perPage = Math.min(Number(searchParams.get("per_page") || "10"), 50);

    // Get bookings with completed cash payment but not admin verified
    const query = {
      paymentStatus: "completed_cash",
      adminVerifiedAt: null,
    };

    const total = await Booking.countDocuments(query);

    const bookings = await Booking.find(query)
      .populate("userId", "fullName email phoneNumber")
      .populate("listingId", "pgName location primaryImage ownerId")
      .sort({ cashCollectedAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    const totalPages = Math.ceil(total / perPage);

    return NextResponse.json({
      success: true,
      data: bookings,
      total,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error("Get pending cash payments error:", error);
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
