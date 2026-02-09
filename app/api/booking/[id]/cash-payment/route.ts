import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import mongoose from "mongoose";
import Booking from "@/models/booking";
import Commission from "@/models/commission";
import User from "@/models/user";
import Notification from "@/models/notification";
import { authUser } from "@/actions/authUser";

// Owner records cash payment collected from tenant
export async function POST(
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

    // Parse body
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is fine
    }

    const { notes } = body;

    session.startTransaction();

    const booking = await Booking.findById(bookingId)
      .populate("listingId", "ownerId pgName")
      .session(session);

    if (!booking) {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    const listing = booking.listingId as any;

    // Verify user is the owner
    if (listing.ownerId.toString() !== user.id) {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, message: "Unauthorized - Not the owner" },
        { status: 403 }
      );
    }

    // Check if payment method is cash
    if (booking.paymentMethod !== "cash") {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, message: "This booking is not a cash payment" },
        { status: 400 }
      );
    }

    // Check if already paid
    if (booking.bookingFee?.status === "paid" && 
        booking.securityDeposit?.status === "paid" && 
        booking.firstMonthRent?.status === "paid") {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, message: "Payment already recorded" },
        { status: 400 }
      );
    }

    // Calculate amounts from stored booking data
    const bookingFeeAmount = booking.bookingFee?.amount || 0;
    const firstMonthRentAmount = booking.firstMonthRent?.amount || 0;
    const securityDepositAmount = booking.securityDeposit?.amount || 0;
    const totalAmount = bookingFeeAmount + firstMonthRentAmount + securityDepositAmount;

    const now = new Date();

    // Update payment statuses
    if (booking.bookingFee) {
      booking.bookingFee.status = "paid";
      booking.bookingFee.paidAt = now;
      booking.bookingFee.paymentReference = `CASH_${bookingId}_${Date.now()}`;
    }

    if (booking.firstMonthRent) {
      booking.firstMonthRent.status = "paid";
      booking.firstMonthRent.paidAt = now;
      booking.firstMonthRent.paymentReference = `CASH_${bookingId}_${Date.now()}`;
    }

    if (booking.securityDeposit) {
      booking.securityDeposit.status = "paid";
      booking.securityDeposit.paidAt = now;
      booking.securityDeposit.paymentReference = `CASH_${bookingId}_${Date.now()}`;
    }

    // Update booking status and totals
    booking.status = "confirmed";
    booking.totalPaid = totalAmount;

    if (notes) {
      booking.additionalRequirements = booking.additionalRequirements
        ? `${booking.additionalRequirements}\nOwner Note: ${notes}`
        : `Owner Note: ${notes}`;
    }

    await booking.save({ session });

    // Create commission record - owner owes booking fee to admin
    if (bookingFeeAmount > 0) {
      await Commission.create(
        [
          {
            ownerId: listing.ownerId,
            bookingId: booking._id,
            listingId: listing._id,
            tenantId: booking.userId,
            allocationId: null,
            monthlyRentPaymentId: null,

            commissionType: "booking_fee_receivable",
            direction: "owner_owes_admin",
            sourcePaymentMethod: "cash",

            rentMonth: null,
            monthNumber: 1,

            baseAmount: booking.monthlyRent,
            commissionRate: 0.1,
            amount: bookingFeeAmount,

            status: "pending",
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            notes: `Cash payment - Commission due from owner. ${notes || ""}`.trim(),
          },
        ],
        { session }
      );
    }

    // Notify admin about cash payment
    const admins = await User.find({ role: "admin" }).select("_id").session(session);
    
    const adminNotifications = admins.map((admin) => ({
      userId: admin._id,
      type: "payment",
      title: "Cash Payment Collected",
      message: `Owner collected ₹${totalAmount.toLocaleString()} cash for ${listing.pgName}. Commission due: ₹${bookingFeeAmount.toLocaleString()}`,
      relatedId: booking._id,
      relatedType: "booking",
      priority: "high",
      metadata: {
        totalCollected: totalAmount,
        commissionDue: bookingFeeAmount,
        ownerId: listing.ownerId.toString(),
        pgName: listing.pgName,
        tenantName: booking.fullName,
      },
    }));

    if (adminNotifications.length > 0) {
      await Notification.create(adminNotifications, { session });
    }

    // Notify tenant
    await Notification.create(
      [
        {
          userId: booking.userId,
          type: "payment",
          title: "Payment Confirmed",
          message: `Your payment of ₹${totalAmount.toLocaleString()} for ${listing.pgName} has been confirmed.`,
          relatedId: booking._id,
          relatedType: "booking",
          priority: "medium",
        },
      ],
      { session }
    );

    await session.commitTransaction();

    return NextResponse.json({
      success: true,
      message: "Cash payment recorded successfully",
      data: {
        bookingId: booking._id,
        status: booking.status,
        totalCollected: totalAmount,
        commissionDue: bookingFeeAmount,
        paymentBreakdown: {
          bookingFee: booking.bookingFee,
          securityDeposit: booking.securityDeposit,
          firstMonthRent: booking.firstMonthRent,
        },
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Cash payment error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to record cash payment",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    session.endSession();
  }
}
