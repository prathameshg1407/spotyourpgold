import { NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import authUser from "@/actions/authUser";
import { getRazorpayInstance } from "@/lib/razorpay";
import Listing from "@/models/listing";
import Coupon from "@/models/coupon";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    await connectToDB();

    const user = await authUser();
    if (!user || user.role === "user") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      listingId
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !listingId) {
      return NextResponse.json(
        { success: false, message: "Missing payment details" },
        { status: 400 }
      );
    }

    // Verify listing exists and belongs to user
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return NextResponse.json(
        { success: false, message: "Listing not found" },
        { status: 404 }
      );
    }

    if (listing.ownerId.toString() !== user.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access to listing" },
        { status: 403 }
      );
    }

    // Verify Razorpay signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      throw new Error("Razorpay key secret not configured");
    }

    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json(
        { success: false, message: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // Fetch payment details from Razorpay
    const razorpay = getRazorpayInstance();
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    const order = await razorpay.orders.fetch(razorpay_order_id);

    if (payment.status !== "captured" && payment.status !== "authorized") {
      return NextResponse.json(
        { success: false, message: "Payment not successful" },
        { status: 400 }
      );
    }

    // Increment coupon usage if an applied coupon code is present in order notes
    const appliedCouponCode = order.notes?.couponCode;
    if (appliedCouponCode && appliedCouponCode !== "none") {
      const coupon = await Coupon.findOne({ name: String(appliedCouponCode).toUpperCase() });
      if (coupon) {
        coupon.usageCount = (coupon.usageCount || 0) + 1;
        await coupon.save();
      }
    }

    // Update listing with payment details
    listing.paymentStatus = "completed";
    listing.paymentId = razorpay_payment_id;
    listing.paymentProof = `razorpay_${razorpay_payment_id}`;
    listing.listingFeePaid = Number(payment.amount) / 100; // Store the exact amount paid
    if (appliedCouponCode && appliedCouponCode !== "none") {
      listing.listingFeeCoupon = String(appliedCouponCode).toUpperCase();
    }
    await listing.save();

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      listing: {
        id: listing._id,
        paymentStatus: listing.paymentStatus,
      },
    });
  } catch (error) {
    console.error("[verify-listing-payment]", error);
    return NextResponse.json(
      { success: false, message: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
