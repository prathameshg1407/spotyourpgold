import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import mongoose from "mongoose";
import Commission from "@/models/commission";
import Booking from "@/models/booking";
import MonthlyRentPayment from "@/models/monthlyRentPayment";
import User from "@/models/user";
import Notification from "@/models/notification";
import { verifyRazorpaySignature, fetchPaymentDetails } from "@/lib/razorpay";
import { authUser } from "@/actions/authUser";

export async function POST(req: NextRequest) {
  const session = await mongoose.startSession();

  try {
    await connectToDB();

    const user = await authUser();
    if (!user || user.role !== "owner") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const {
      commissionIds,
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

    // Fetch payment details from Razorpay
    const paymentDetails = await fetchPaymentDetails(razorpay_payment_id);

    if (paymentDetails.status !== "captured") {
      return NextResponse.json(
        { success: false, message: "Payment not captured" },
        { status: 400 }
      );
    }

    session.startTransaction();

    // Update commissions as paid
    const commissions = await Commission.find({
      _id: { $in: commissionIds },
      ownerId: user.id,
    }).session(session);

    const totalAmount = commissions.reduce((sum, c) => sum + c.amount, 0);

    for (const commission of commissions) {
      commission.status = "completed";
      commission.settledAt = new Date();
      commission.settlementMethod = "online_razorpay";
      commission.settlementReference = razorpay_payment_id;
      commission.razorpayPaymentId = razorpay_payment_id;
      await commission.save({ session });

      // Update related booking/rent payment
      if (commission.bookingId) {
        await Booking.findByIdAndUpdate(
          commission.bookingId,
          {
            "bookingFee.ownerCommissionStatus": "paid",
            "bookingFee.ownerCommissionPaidAt": new Date(),
          },
          { session }
        );
      }

      if (commission.monthlyRentPaymentId) {
        await MonthlyRentPayment.findByIdAndUpdate(
          commission.monthlyRentPaymentId,
          {
            "cashPayment.adminCommissionStatus": "paid",
            "cashPayment.adminCommissionPaidAt": new Date(),
          },
          { session }
        );
      }
    }

    // Update owner's settlement summary
    await User.findByIdAndUpdate(
      user.id,
      {
        $inc: {
          "settlementSummary.pendingCommissionAmount": -totalAmount,
          "settlementSummary.paidCommissionAmount": totalAmount,
        },
      },
      { session }
    );

    // Create notification for admin
    await Notification.create(
      [
        {
          userId: null,
          userRole: "admin",
          type: "payment",
          title: "Commission Payment Received",
          message: `Owner paid commission of ₹${totalAmount.toLocaleString()} via Razorpay for ${
            commissions.length
          } booking(s).`,
          relatedId: commissions[0]._id,
          relatedType: "commission",
          priority: "high",
        },
      ],
      { session }
    );

    await session.commitTransaction();

    return NextResponse.json({
      success: true,
      message: "Commission payment successful",
      data: {
        totalAmount,
        commissionsCount: commissions.length,
        paymentId: razorpay_payment_id,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Commission payment verification error:", error);
    return NextResponse.json(
      { success: false, message: "Payment verification failed" },
      { status: 500 }
    );
  } finally {
    session.endSession();
  }
}