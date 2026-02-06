// app/api/booking/[id]/initiate-payment/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import mongoose from "mongoose";
import Booking from "@/models/booking";
import { createRazorpayOrder } from "@/lib/razorpay";
import { authUser } from "@/actions/authUser";

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
    const { paymentType } = await req.json();

    if (!["booking_fee", "remaining"].includes(paymentType)) {
      return NextResponse.json(
        { success: false, message: "Invalid payment type" },
        { status: 400 }
      );
    }

    const booking = await Booking.findById(bookingId)
      .populate("listingId", "pgName location");

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Verify user owns this booking
    if (booking.userId.toString() !== user.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 }
      );
    }

    let amount = 0;
    let receipt = "";
    let notes = {};

    if (paymentType === "booking_fee") {
      // Check if booking fee already paid
      if (booking.bookingFee.status === "paid") {
        return NextResponse.json(
          { success: false, message: "Booking fee already paid" },
          { status: 400 }
        );
      }

      amount = booking.bookingFee.amount;
      receipt = `BOOKING_FEE_${booking._id}`;
      notes = {
        bookingId: booking._id.toString(),
        userId: user.id,
        paymentType: "booking_fee",
        pgName: booking.listingId.pgName,
      };
    } else if (paymentType === "remaining") {
      // Check if booking is confirmed
      if (booking.status !== "confirmed") {
        return NextResponse.json(
          { success: false, message: "Booking not yet confirmed by owner" },
          { status: 400 }
        );
      }

      // Check if booking fee is paid
      if (booking.bookingFee.status !== "paid") {
        return NextResponse.json(
          { success: false, message: "Please pay booking fee first" },
          { status: 400 }
        );
      }

      // Calculate remaining amount (security deposit + first month rent)
      const unpaidDeposit = booking.securityDeposit.status === "pending" 
        ? booking.securityDeposit.amount 
        : 0;
      const unpaidRent = booking.firstMonthRent.status === "pending" 
        ? booking.firstMonthRent.amount 
        : 0;

      amount = unpaidDeposit + unpaidRent;

      if (amount === 0) {
        return NextResponse.json(
          { success: false, message: "No pending payment" },
          { status: 400 }
        );
      }

      receipt = `REMAINING_${booking._id}`;
      notes = {
        bookingId: booking._id.toString(),
        userId: user.id,
        paymentType: "remaining",
        includesDeposit: unpaidDeposit > 0,
        includesRent: unpaidRent > 0,
        pgName: booking.listingId.pgName,
      };
    }

    // Create Razorpay order
    try {
      const razorpayOrder = await createRazorpayOrder({
        amount,
        receipt,
        notes,
      });

      // Store order ID based on payment type
      if (paymentType === "booking_fee") {
        booking.bookingFee.razorpayOrderId = razorpayOrder.id;
      } else {
        // For remaining payment, store in both if applicable
        if (booking.securityDeposit.status === "pending") {
          booking.securityDeposit.razorpayOrderId = razorpayOrder.id;
        }
        if (booking.firstMonthRent.status === "pending") {
          booking.firstMonthRent.razorpayOrderId = razorpayOrder.id;
        }
      }

      await booking.save();

      return NextResponse.json({
        success: true,
        data: {
          orderId: razorpayOrder.id,
          amount,
          currency: "INR",
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          paymentType,
          bookingId: booking._id,
        },
      });
    } catch (error) {
      console.error("Razorpay order creation error:", error);
      return NextResponse.json(
        { success: false, message: "Failed to create payment order" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Payment initiation error:", error);
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