// app/api/booking/[id]/cash-payment/route.ts
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
    const { 
      paymentType, // "booking_fee" | "security_deposit" | "first_month_rent" | "all"
      proofUrl,
      amount,
      notes,
    } = await req.json();

    if (!paymentType) {
      return NextResponse.json(
        { success: false, message: "Payment type is required" },
        { status: 400 }
      );
    }

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
    if (listing.ownerId.toString() !== user.id && user.role !== "admin") {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, message: "Unauthorized - Not the owner" },
        { status: 403 }
      );
    }

    // Verify booking is for cash payment
    if (booking.paymentMethod !== "cash") {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, message: "This booking is not for cash payment" },
        { status: 400 }
      );
    }

    // Verify booking is confirmed
    if (booking.status !== "confirmed" && booking.status !== "pending") {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, message: "Invalid booking status for payment" },
        { status: 400 }
      );
    }

    const now = new Date();
    let paymentsUpdated: string[] = [];
    let totalCollected = 0;

    // Process payments based on type
    if (paymentType === "booking_fee" || paymentType === "all") {
      if (booking.bookingFee.status === "pending") {
        booking.bookingFee.status = "paid";
        booking.bookingFee.paidAt = now;
        booking.bookingFee.paymentReference = proofUrl || "";
        booking.totalPaid += booking.bookingFee.amount;
        totalCollected += booking.bookingFee.amount;
        paymentsUpdated.push("booking_fee");

        if (proofUrl) {
          booking.cashPaymentProof.bookingFeeProof = proofUrl;
        }
      }
    }

    if (paymentType === "security_deposit" || paymentType === "all") {
      if (booking.securityDeposit.status === "pending") {
        booking.securityDeposit.status = "paid";
        booking.securityDeposit.paidAt = now;
        booking.securityDeposit.paidTo = "owner";
        booking.securityDeposit.paymentReference = proofUrl || "";
        booking.totalPaid += booking.securityDeposit.amount;
        totalCollected += booking.securityDeposit.amount;
        paymentsUpdated.push("security_deposit");

        if (proofUrl) {
          booking.cashPaymentProof.securityDepositProof = proofUrl;
        }
      }
    }

    if (paymentType === "first_month_rent" || paymentType === "all") {
      if (booking.firstMonthRent.status === "pending") {
        booking.firstMonthRent.status = "paid";
        booking.firstMonthRent.paidAt = now;
        booking.firstMonthRent.paidTo = "owner";
        booking.firstMonthRent.paymentReference = proofUrl || "";
        booking.totalPaid += booking.firstMonthRent.amount;
        totalCollected += booking.firstMonthRent.amount;
        paymentsUpdated.push("first_month_rent");

        if (proofUrl) {
          booking.cashPaymentProof.firstMonthRentProof = proofUrl;
        }
      }
    }

    if (paymentsUpdated.length === 0) {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, message: "No pending payments to process" },
        { status: 400 }
      );
    }

    // Update cash collection metadata
    booking.cashCollectedBy = user.fullName;
    booking.cashCollectedAt = now;

    if (notes) {
      booking.ownerNotes = `${booking.ownerNotes || ""}\n[${now.toISOString()}] Cash payment: ${notes}`;
    }

    // Check if all payments are complete
    const allPaymentsComplete = 
      booking.bookingFee.status === "paid" &&
      booking.securityDeposit.status === "paid" &&
      booking.firstMonthRent.status === "paid";

    if (allPaymentsComplete) {
      booking.status = "active";

      // Calculate admin commission (10% of first month rent)
      const adminCommission = booking.bookingFee.amount;
      booking.firstMonthRent.adminCommissionAmount = adminCommission;
      booking.firstMonthRent.adminCommissionStatus = "pending";

      // Create commission record - owner owes admin 10%
      await Commission.create([{
        ownerId: booking.ownerId,
        bookingId: booking._id,
        listingId: booking.listingId._id,
        tenantId: booking.userId,
        commissionType: "first_month_cash_commission",
        paymentDirection: "owner_to_admin",
        monthNumber: 1,
        baseAmount: booking.monthlyRent,
        commissionRate: 0.1,
        commissionAmount: adminCommission,
        status: "pending",
        dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days
        notes: "Commission due from cash payment collection",
      }], { session });

      // Update owner's pending commission
      await User.findByIdAndUpdate(
        booking.ownerId,
        {
          $inc: {
            "settlementSummary.pendingCommissionAmount": adminCommission,
          },
        },
        { session }
      );
    }

    await booking.save({ session });

    // Notify admin about cash collection
    const admins = await User.find({ role: "admin" }).select("_id").session(session);
    for (const admin of admins) {
      await Notification.create([{
        userId: admin._id,
        type: "payment",
        title: "Cash Payment Collected",
        message: `Owner ${user.fullName} collected ₹${totalCollected.toLocaleString()} (${paymentsUpdated.join(", ")}) for ${listing.pgName}.${allPaymentsComplete ? ` Commission of ₹${booking.bookingFee.amount} pending.` : ""}`,
        relatedId: booking._id,
        relatedType: "booking",
        priority: "medium",
        metadata: {
          paymentsCollected: paymentsUpdated,
          totalCollected,
          allPaymentsComplete,
          commissionPending: allPaymentsComplete ? booking.bookingFee.amount : 0,
        },
      }], { session });
    }

    // Notify tenant
    await Notification.create([{
      userId: booking.userId,
      type: "payment",
      title: "Payment Received",
      message: `Your cash payment of ₹${totalCollected.toLocaleString()} for ${listing.pgName} has been recorded.`,
      relatedId: booking._id,
      relatedType: "booking",
      priority: "medium",
    }], { session });

    await session.commitTransaction();

    return NextResponse.json({
      success: true,
      message: "Cash payment recorded successfully",
      data: {
        booking: {
          _id: booking._id,
          status: booking.status,
          paymentBreakdown: {
            bookingFee: booking.bookingFee,
            securityDeposit: booking.securityDeposit,
            firstMonthRent: booking.firstMonthRent,
          },
          totalPaid: booking.totalPaid,
          totalDue: booking.totalDue,
        },
        paymentsUpdated,
        totalCollected,
        allPaymentsComplete,
        commissionPending: allPaymentsComplete ? booking.bookingFee.amount : 0,
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

// GET - Get cash payment status
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
      .populate("listingId", "pgName ownerId")
      .select("paymentMethod bookingFee securityDeposit firstMonthRent cashPaymentProof cashCollectedBy cashCollectedAt totalPaid totalDue status");

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Check authorization
    const isOwner = booking.listingId.ownerId.toString() === user.id;
    const isTenant = booking.userId?.toString() === user.id;
    const isAdmin = user.role === "admin";

    if (!isOwner && !isTenant && !isAdmin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        paymentMethod: booking.paymentMethod,
        status: booking.status,
        paymentBreakdown: {
          bookingFee: booking.bookingFee,
          securityDeposit: booking.securityDeposit,
          firstMonthRent: booking.firstMonthRent,
        },
        cashPaymentProof: booking.cashPaymentProof,
        cashCollectedBy: booking.cashCollectedBy,
        cashCollectedAt: booking.cashCollectedAt,
        totalPaid: booking.totalPaid,
        totalDue: booking.totalDue,
        pendingAmount: booking.totalDue - booking.totalPaid,
      },
    });
  } catch (error) {
    console.error("Get cash payment status error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}