import { NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import authUser from "@/actions/authUser";
import { getRazorpayInstance, getRazorpayKeyId } from "@/lib/razorpay";
import Listing from "@/models/listing";

const LISTING_FEE = 99900; // ₹999 in paise

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

    const { listingId } = await req.json();

    if (!listingId) {
      return NextResponse.json(
        { success: false, message: "Listing ID is required" },
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

    // Check if already paid
    if (listing.paymentStatus === "completed") {
      return NextResponse.json(
        { success: false, message: "Listing fee already paid" },
        { status: 400 }
      );
    }

    const razorpay = getRazorpayInstance();
    const keyId = getRazorpayKeyId();

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: LISTING_FEE,
      currency: "INR",
      receipt: `lst_${listingId.slice(-20)}_${Date.now().toString().slice(-10)}`,
      notes: {
        listingId: listingId,
        ownerId: user.id,
        ownerEmail: user.email,
        purpose: "listing_fee",
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: LISTING_FEE,
      currency: "INR",
      keyId: keyId,
      listingId: listingId,
    });
  } catch (error) {
    console.error("[initiate-listing-payment]", error);
    return NextResponse.json(
      { success: false, message: "Failed to initiate payment" },
      { status: 500 }
    );
  }
}
