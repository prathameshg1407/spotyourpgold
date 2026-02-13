// app/api/user/rent/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import mongoose from "mongoose";
import MonthlyRentPayment from "@/models/MonthlyRentPayment";
import Commission from "@/models/commission";
import Notification from "@/models/notification";
import User from "@/models/user";
import { verifyRazorpaySignature, fetchPaymentDetails } from "@/lib/razorpay";
import { authUser } from "@/actions/authUser";

export async function POST(req: NextRequest) {
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

    const {
      rentId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await req.json();

    // Verify signature
    const isValidSignature = verifyRazorpaySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValidSignature) {
      return NextResponse.json(
        { success: false, message: "Invalid payment signature" },
        { status: 400 }
      );
    }

    session.startTransaction();

    const rent = await MonthlyRentPayment.findById(rentId)
      .populate("listingId", "pgName ownerId")
      .session(session);

    if (!rent) {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, message: "Rent payment not found" },
        { status: 404 }
      );
    }

    // Verify tenant
    if (rent.tenantId.toString() !== user.id) {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 }
      );
    }

    // Fetch payment details
    const paymentDetails = await fetchPaymentDetails(razorpay_payment_id);
    const paidAmount = paymentDetails.amount / 100;

    // Update rent payment
    rent.paidAmount = (rent.paidAmount || 0) + paidAmount;
    rent.paidAt = new Date();
    rent.paymentMethod = "online";
    rent.paymentReference = razorpay_payment_id;
    rent.collectedBy = "Platform";

    // Determine payment status
    const totalDue = rent.rentAmount + (rent.lateFee || 0);
    if (rent.paidAmount >= totalDue) {
      rent.paymentStatus = "paid";
    } else {
      rent.paymentStatus = "partially_paid";
    }

    // Calculate commission (10% of rent)
    const commissionAmount = Math.round(rent.rentAmount * rent.commissionRate);
    rent.commissionAmount = commissionAmount;
    rent.commissionStatus = "pending";
    rent.commissionDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Create commission record
    const commissionRecord = await Commission.create([{
      ownerId: rent.ownerId,
      bookingId: rent.bookingId,
      listingId: rent.listingId._id,
      tenantId: rent.tenantId,
      allocationId: rent.allocationId,
      commissionType: "monthly_rent_commission",
      paymentDirection: "owner_to_admin",
      rentMonth: rent.rentMonth,
      monthNumber: rent.monthNumber,
      baseAmount: rent.rentAmount,
      commissionRate: rent.commissionRate,
      commissionAmount: commissionAmount,
      status: "pending",
      dueDate: rent.commissionDueDate,
      notes: `Month ${rent.monthNumber} rent commission`,
    }], { session });

    rent.commissionId = commissionRecord[0]._id;
    await rent.save({ session });

    // Update owner's pending commission
    await User.findByIdAndUpdate(
      rent.ownerId,
      {
        $inc: {
          "settlementSummary.pendingCommissionAmount": commissionAmount,
        },
      },
      { session }
    );

    // Notify owner
    await Notification.create([{
      userId: rent.ownerId,
      type: "payment",
      title: "Rent Payment Received",
      message: `Rent payment of ₹${paidAmount.toLocaleString()} received for ${(rent.listingId as any).pgName}, Month ${rent.monthNumber}. Commission of ₹${commissionAmount} will be deducted.`,
      relatedId: rent._id,
      relatedType: "rent_payment",
      priority: "medium",
      metadata: {
        rentAmount: paidAmount,
        commissionAmount,
        monthNumber: rent.monthNumber,
      },
    }], { session });

    await session.commitTransaction();

    return NextResponse.json({
      success: true,
      message: "Rent payment verified successfully",
      data: {
        rent: {
          _id: rent._id,
          rentMonth: rent.rentMonth,
          monthNumber: rent.monthNumber,
          rentAmount: rent.rentAmount,
          paidAmount: rent.paidAmount,
          paymentStatus: rent.paymentStatus,
          paidAt: rent.paidAt,
        },
        commissionAmount,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Rent payment verification error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Payment verification failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    session.endSession();
  }
}