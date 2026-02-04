import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import mongoose from "mongoose";
import Booking from "@/models/booking";
import Listing from "@/models/listing";
import Notification from "@/models/notification";
import Coupon from "@/models/coupon";
import User from "@/models/user";

// Helper to get commission rate for an owner
async function getOwnerCommissionRate(ownerId: string): Promise<number> {
  const owner = await User.findById(ownerId).select("commissionSettings");
  if (owner?.commissionSettings?.isCustomRateActive && owner.commissionSettings.customRate !== null) {
    return owner.commissionSettings.customRate;
  }
  return 0.10; // Default 10%
}

// Helper to calculate first month commission split
function calculateFirstMonthSplit(firstMonthRent: number, commissionRate: number) {
  const adminAmount = Math.round(firstMonthRent * commissionRate); // 10% to admin
  const ownerAmount = firstMonthRent - adminAmount; // 90% to owner
  
  return {
    commissionRate,
    adminAmount,
    ownerAmount,
  };
}

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

    // Get listing details
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

      if (coupon.validUntil && new Date() > new Date(coupon.validUntil)) {
        return NextResponse.json(
          { success: false, message: "Coupon has expired" },
          { status: 400 }
        );
      }

      if (coupon.validFrom && new Date() < new Date(coupon.validFrom)) {
        return NextResponse.json(
          { success: false, message: "Coupon is not yet valid" },
          { status: 400 }
        );
      }

      if (coupon.maxUsage && coupon.usageCount >= coupon.maxUsage) {
        return NextResponse.json(
          { success: false, message: "Coupon usage limit exceeded" },
          { status: 400 }
        );
      }

      discountAmount = Math.round(
        (selectedRoom.monthlyRent * coupon.percentage) / 100
      );
      appliedCoupon = coupon;
    }

    // Calculate amounts
    const originalAmount = selectedRoom.monthlyRent;
    const firstMonthRent = originalAmount - discountAmount; // After discount
    const securityDeposit = selectedRoom.securityDeposit;

    // Get owner's commission rate
    const commissionRate = await getOwnerCommissionRate(listing.ownerId.toString());

    // Calculate first month commission split
    const commissionSplit = calculateFirstMonthSplit(firstMonthRent, commissionRate);

    // Create booking request
    const booking = new Booking({
      userId: new mongoose.Types.ObjectId(userId),
      listingId: new mongoose.Types.ObjectId(listingId),
      ownerId: listing.ownerId, // Store owner ID for easy queries
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
      
      // Amounts
      amount: firstMonthRent, // First month rent after discount
      securityDeposit,
      originalAmount,
      discountAmount,
      couponCode: couponCode || null,
      
      // First month commission split (calculated but not processed yet)
      firstMonthCommission: {
        commissionRate: commissionSplit.commissionRate,
        adminAmount: commissionSplit.adminAmount,
        ownerAmount: commissionSplit.ownerAmount,
        adminAmountStatus: "pending",
        ownerPayoutStatus: "pending",
      },
      
      // Status
      status: "pending",
      paymentStatus: "pending",
      paymentMethod: "cash",
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
        firstMonthRent,
        adminCommission: commissionSplit.adminAmount,
        ownerPayout: commissionSplit.ownerAmount,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Booking request submitted successfully",
      data: {
        ...booking.toObject(),
        // Include split info in response
        commissionSplit: {
          adminReceives: commissionSplit.adminAmount,
          ownerReceives: commissionSplit.ownerAmount,
          totalFirstMonth: firstMonthRent,
        },
      },
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