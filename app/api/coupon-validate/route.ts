import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import Coupon from "@/models/coupon";

export async function POST(request: NextRequest) {
  try {
    await connectToDB();

    const body = await request.json();
    const { couponCode } = body;

    if (!couponCode) {
      return NextResponse.json(
        { success: false, message: "Coupon code is required" },
        { status: 400 }
      );
    }

    // Find the coupon
    const coupon = await Coupon.findOne({
      name: couponCode.toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      return NextResponse.json(
        { success: false, message: "Invalid coupon code" },
        { status: 404 }
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

    return NextResponse.json({
      success: true,
      data: {
        name: coupon.name,
        percentage: coupon.percentage,
        usageCount: coupon.usageCount,
        maxUsage: coupon.maxUsage,
        validUntil: coupon.validUntil,
      },
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    return NextResponse.json(
      { success: false, message: "Failed to validate coupon" },
      { status: 500 }
    );
  }
}
