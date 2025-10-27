import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import mongoose from "mongoose";
import Booking from "@/models/booking";
import Listing from "@/models/listing";
import Notification from "@/models/notification";
import Coupon from "@/models/coupon";

export async function POST(req: NextRequest) {
  try {
    await connectToDB();

    const body = await req.json();
    const {
      userId,
      listingId,
      roomType,
      moveInDate,
      duration,
      fullName,
      phoneNumber,
      email,
      address,
      aadhaarNumber,
      additionalRequirements,
      termsAccepted,
      couponCode,
    } = body;

    // Validate required fields
    if (!userId || !listingId || !roomType || !moveInDate || !duration) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!fullName || !phoneNumber || !email || !address) {
      return NextResponse.json(
        { success: false, message: "Missing personal information" },
        { status: 400 }
      );
    }

    if (!termsAccepted) {
      return NextResponse.json(
        { success: false, message: "Terms and conditions must be accepted" },
        { status: 400 }
      );
    }

    // Get listing details to calculate amount
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return NextResponse.json(
        { success: false, message: "Listing not found" },
        { status: 404 }
      );
    }

    // Find the selected room type
    const selectedRoom = listing.roomTypes.find(
      (room: any) => room.type === roomType
    );
    if (!selectedRoom) {
      return NextResponse.json(
        { success: false, message: "Selected room type not found" },
        { status: 400 }
      );
    }

    // Validate and apply coupon if provided
    let discountAmount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        name: couponCode.toUpperCase(),
        isActive: true,
      });

      if (!coupon) {
        return NextResponse.json(
          { success: false, message: "Invalid coupon code" },
          { status: 400 }
        );
      }

      // Check if coupon is expired
      if (coupon.validUntil && new Date() > new Date(coupon.validUntil)) {
        return NextResponse.json(
          { success: false, message: "Coupon has expired" },
          { status: 400 }
        );
      }

      // Check if coupon is not yet valid
      if (coupon.validFrom && new Date() < new Date(coupon.validFrom)) {
        return NextResponse.json(
          { success: false, message: "Coupon is not yet valid" },
          { status: 400 }
        );
      }

      // Check usage limit
      if (coupon.maxUsage && coupon.usageCount >= coupon.maxUsage) {
        return NextResponse.json(
          { success: false, message: "Coupon usage limit exceeded" },
          { status: 400 }
        );
      }

      // Calculate discount
      discountAmount = Math.round(
        (selectedRoom.monthlyRent * coupon.percentage) / 100
      );
      appliedCoupon = coupon;
    }

    // Calculate amounts - only charge first month's rent
    const durationMonths = parseInt(duration);
    const originalAmount = selectedRoom.monthlyRent;
    const amount = originalAmount - discountAmount; // Apply discount
    const securityDeposit = selectedRoom.securityDeposit;

    // Create booking request (pending owner approval)
    const booking = new Booking({
      userId: new mongoose.Types.ObjectId(userId),
      listingId: new mongoose.Types.ObjectId(listingId),
      roomType,
      moveInDate: new Date(moveInDate),
      duration,
      fullName,
      phoneNumber,
      email,
      address,
      aadhaarNumber: aadhaarNumber || "",
      additionalRequirements: additionalRequirements || "",
      termsAccepted,
      amount,
      securityDeposit,
      status: "pending", // Booking request pending owner approval
      paymentStatus: "pending", // Payment will be pending until approved
      paymentMethod: "cash", // Cash payment only
      couponCode: couponCode || null,
      discountAmount: discountAmount,
      originalAmount: originalAmount,
    });

    await booking.save();

    // Increment coupon usage count if coupon was applied
    if (appliedCoupon) {
      await Coupon.findByIdAndUpdate(appliedCoupon._id, {
        $inc: { usageCount: 1 },
      });
    }

    // Create notification for owner
    await Notification.create({
      userId: listing.ownerId,
      type: "booking_request",
      title: "New Booking Request",
      message: `You have a new booking request for ${listing.pgName} from ${fullName}.`,
      relatedId: booking._id,
      relatedType: "booking",
      priority: "high",
      metadata: {
        listingName: listing.pgName,
        tenantName: fullName,
        tenantPhone: phoneNumber,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Booking request submitted successfully",
      data: booking,
    });
  } catch (error) {
    console.error("Booking creation error:", error);
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

export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    // Get user's bookings with listing details
    const bookings = await Booking.find({
      userId: new mongoose.Types.ObjectId(userId),
    })
      .populate("listingId", "pgName location images roomTypes")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error("Get bookings error:", error);
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
