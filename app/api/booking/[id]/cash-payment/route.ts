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
    const { paymentProof, notes } = await req.json();

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

    // Verify user is the owner
    const listing = booking.listingId as any;
    if (listing.ownerId.toString() !== user.id) {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, message: "Unauthorized - Not the owner" },
        { status: 403 }
      );
    }

    if (booking.paymentStatus !== "pending_cash_payment") {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, message: "Invalid payment status" },
        { status: 400 }
      );
    }

    // Update booking
    booking.paymentStatus = "completed_cash";
    booking.cashPaymentProof = paymentProof || "";
    booking.cashCollectedBy = user.fullName;
    booking.cashCollectedAt = new Date();
    
    // Mark admin commission as received
    booking.firstMonthCommission.adminAmountStatus = "received";
    booking.firstMonthCommission.adminAmountReceivedAt = new Date();
    
    if (notes) {
      booking.ownerNotes = `${booking.ownerNotes || ""}\nPayment: ${notes}`;
    }

    await booking.save({ session });

    // Update commission records
    // 1. Mark admin commission as completed
    await Commission.findOneAndUpdate(
      {
        bookingId: booking._id,
        commissionType: "first_month_admin",
      },
      {
        status: "completed",
        settledAt: new Date(),
        settlementMethod: "auto",
        notes: "Auto-completed when cash payment recorded",
      },
      { session }
    );

    // 2. Owner payout is still pending (admin needs to pay)
    // Update owner's pending payout amount
    await User.findByIdAndUpdate(
      booking.ownerId,
      {
        $inc: {
          "settlementSummary.pendingPayoutAmount": booking.firstMonthCommission.ownerAmount,
        },
      },
      { session }
    );

    // Notify admin about payment received
    const admins = await User.find({ role: "admin" }).select("_id").session(session);
    for (const admin of admins) {
      await Notification.create([{
        userId: admin._id,
        type: "payment",
        title: "Cash Payment Received",
        message: `Owner ${user.fullName} collected ₹${booking.amount + booking.securityDeposit} for ${listing.pgName}. Admin share: ₹${booking.firstMonthCommission.adminAmount}, Owner payout pending: ₹${booking.firstMonthCommission.ownerAmount}`,
        relatedId: booking._id,
        relatedType: "booking",
        priority: "high",
        metadata: {
          totalCollected: booking.amount + booking.securityDeposit,
          adminShare: booking.firstMonthCommission.adminAmount,
          ownerPayoutPending: booking.firstMonthCommission.ownerAmount,
        },
      }], { session });
    }

    // Notify tenant
    await Notification.create([{
      userId: booking.userId,
      type: "payment",
      title: "Payment Received",
      message: `Your payment of ₹${booking.amount + booking.securityDeposit} for ${listing.pgName} has been received.`,
      relatedId: booking._id,
      relatedType: "booking",
      priority: "medium",
    }], { session });

    await session.commitTransaction();

    return NextResponse.json({
      success: true,
      message: "Cash payment recorded successfully",
      data: {
        booking: booking.toObject(),
        commissionSplit: {
          adminReceived: booking.firstMonthCommission.adminAmount,
          ownerPayoutPending: booking.firstMonthCommission.ownerAmount,
        },
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Cash payment error:", error);
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