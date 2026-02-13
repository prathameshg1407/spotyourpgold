import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import mongoose from "mongoose";
import Commission from "@/models/commission";
import { createRazorpayOrder } from "@/lib/razorpay";
import { authUser } from "@/actions/authUser";

export async function POST(req: NextRequest) {
  try {
    await connectToDB();

    const user = await authUser();
    if (!user || user.role !== "owner") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { commissionIds } = await req.json();

    if (!commissionIds || commissionIds.length === 0) {
      return NextResponse.json(
        { success: false, message: "Please select at least one commission" },
        { status: 400 }
      );
    }

    // Get pending commissions
    const commissions = await Commission.find({
      _id: { $in: commissionIds },
      ownerId: user.id,
      direction: "owner_owes_admin",
      status: { $in: ["pending", "overdue"] },
    }).populate("listingId", "pgName");

    if (commissions.length === 0) {
      return NextResponse.json(
        { success: false, message: "No valid commissions found" },
        { status: 404 }
      );
    }

    // Calculate total amount
    const totalAmount = commissions.reduce((sum, c) => sum + c.amount, 0);

    // Generate a shorter receipt ID (max 40 chars)
    // Option 1: Use a shorter timestamp (last 10 digits) and shorter user ID
    const shortTimestamp = Date.now().toString().slice(-10);
    const shortUserId = user.id.toString().slice(-8);
    const receipt = `COM_${shortUserId}_${shortTimestamp}`;

    // Option 2: Alternative - use a simple counter or random string
    // const receipt = `COM_${Date.now().toString(36).toUpperCase()}`;

    // Create Razorpay order
    const razorpayOrder = await createRazorpayOrder({
      amount: totalAmount,
      receipt: receipt,
      notes: {
        ownerId: user.id,
        commissionCount: commissions.length.toString(),
        commissionIds: commissionIds.join(","),
        paymentType: "commission_payment",
        fullTimestamp: Date.now().toString(), // Store full timestamp in notes if needed
      },
    });

    // Store razorpay order ID in commissions
    await Commission.updateMany(
      { _id: { $in: commissionIds } },
      { $set: { razorpayOrderId: razorpayOrder.id } }
    );

    return NextResponse.json({
      success: true,
      data: {
        orderId: razorpayOrder.id,
        amount: totalAmount,
        currency: "INR",
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        commissionIds,
        commissionCount: commissions.length,
        description: `Commission payment for ${commissions.length} booking(s)`,
      },
    });
  } catch (error) {
    console.error("Commission payment initiation error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create payment order" },
      { status: 500 }
    );
  }
}