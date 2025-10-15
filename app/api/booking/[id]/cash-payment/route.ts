import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import Booking from "@/models/booking";
import Commission from "@/models/commission";
import Listing from "@/models/listing";
import User from "@/models/user";
import Notification from "@/models/notification";
import { authUser } from "@/actions/authUser";

// Mark booking as cash payment (User action)
export async function POST(
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

    // Get booking
    const booking = await Booking.findById(bookingId).populate("listingId");
    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Check if user is the booking owner
    if (booking.userId.toString() !== user.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Not your booking" },
        { status: 403 }
      );
    }

    // Check if booking is confirmed
    if (booking.status !== "confirmed") {
      return NextResponse.json(
        { success: false, message: "Booking must be confirmed first" },
        { status: 400 }
      );
    }

    // Check if already marked for cash payment
    if (booking.paymentStatus === "pending_cash_payment") {
      return NextResponse.json(
        { success: false, message: "Already marked for cash payment" },
        { status: 400 }
      );
    }

    // Update booking status
    booking.paymentStatus = "pending_cash_payment";
    await booking.save();

    // Create notification for owner
    const listing = await Listing.findById(booking.listingId);
    if (listing) {
      await Notification.create({
        userId: listing.ownerId,
        type: "payment_reminder",
        title: "Cash Payment Pending",
        message: `Cash payment of ₹${booking.amount.toLocaleString()} is pending for booking at ${
          listing.pgName
        }. Please collect payment and confirm.`,
        relatedId: booking._id,
        relatedType: "booking",
        priority: "high",
        metadata: {
          listingName: listing.pgName,
          amount: booking.amount,
          tenantName: booking.fullName,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Booking marked for cash payment",
      data: booking,
    });
  } catch (error) {
    console.error("Mark cash payment error:", error);
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

// Owner confirms cash collection
export async function PATCH(
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
    const { cashPaymentProof, cashCollectedBy } = await req.json();

    // Get booking with listing
    const booking = await Booking.findById(bookingId).populate("listingId");
    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Check if user is the listing owner
    const listing = await Listing.findById(booking.listingId);
    if (!listing || listing.ownerId.toString() !== user.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Not the owner" },
        { status: 403 }
      );
    }

    // Check if booking is pending cash payment
    if (booking.paymentStatus !== "pending_cash_payment") {
      return NextResponse.json(
        { success: false, message: "Booking is not pending cash payment" },
        { status: 400 }
      );
    }

    // Update booking with cash collection details
    booking.paymentStatus = "completed_cash";
    booking.cashPaymentProof = cashPaymentProof || "";
    booking.cashCollectedBy = cashCollectedBy || user.fullName;
    booking.cashCollectedAt = new Date();
    await booking.save();

    // Check if this is the first payment for this user at this property
    const existingCompletedBookings = await Booking.find({
      userId: booking.userId,
      listingId: booking.listingId,
      paymentStatus: "completed_cash",
      _id: { $ne: booking._id }, // Exclude current booking
    });

    // Only create commission if this is the first payment for this user at this property
    if (existingCompletedBookings.length === 0) {
      // Create commission record
      const commissionRate = 0.1; // 10% commission for first payment only
      const commissionAmount = Math.round(booking.amount * commissionRate);
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30); // 30 days to settle

      await Commission.create({
        ownerId: listing.ownerId,
        bookingId: booking._id,
        bookingAmount: booking.amount,
        commissionRate,
        commissionAmount,
        status: "pending",
        dueDate,
      });
    }

    // Create notification for user
    await Notification.create({
      userId: booking.userId,
      type: "payment_reminder",
      title: "Payment Confirmed",
      message: `Your cash payment of ₹${booking.amount.toLocaleString()} has been confirmed by the owner. Your booking is now active.`,
      relatedId: booking._id,
      relatedType: "booking",
      priority: "medium",
      metadata: {
        listingName: listing.pgName,
        amount: booking.amount,
      },
    });

    // Create notification for admin
    const adminUsers = await User.find({ role: "admin" });
    for (const admin of adminUsers) {
      const isFirstPayment = existingCompletedBookings.length === 0;
      const notificationMessage = isFirstPayment
        ? `Cash payment of ₹${booking.amount.toLocaleString()} confirmed for ${
            listing.pgName
          }. First payment commission of ₹${Math.round(
            booking.amount * 0.1
          )} is pending settlement.`
        : `Cash payment of ₹${booking.amount.toLocaleString()} confirmed for ${
            listing.pgName
          }. No commission (not first payment).`;

      await Notification.create({
        userId: admin._id,
        type: "payment_reminder",
        title: "Cash Payment Confirmed",
        message: notificationMessage,
        relatedId: booking._id,
        relatedType: "booking",
        priority: "medium",
        metadata: {
          listingName: listing.pgName,
          amount: booking.amount,
          commissionAmount: isFirstPayment
            ? Math.round(booking.amount * 0.1)
            : 0,
          ownerName: user.fullName,
          isFirstPayment,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Cash payment confirmed successfully",
      data: booking,
    });
  } catch (error) {
    console.error("Confirm cash payment error:", error);
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
