import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import Coupon from "@/models/coupon";
import { authUser } from "@/actions/authUser";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
  try {
    await connectToDB();

    // Verify admin authentication
    const user = await authUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const per_page = parseInt(searchParams.get("per_page") || "20");
    const skip = (page - 1) * per_page;

    // Get coupons with pagination
    const coupons = await Coupon.find()
      .populate("createdBy", "fullName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(per_page);

    const total = await Coupon.countDocuments();
    const totalPages = Math.ceil(total / per_page);

    return NextResponse.json({
      success: true,
      data: coupons,
      total,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch coupons" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDB();

    // Verify admin authentication
    const user = await authUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, percentage, maxUsage, validUntil } = body;

    // Validate required fields
    if (!name || !percentage) {
      return NextResponse.json(
        { success: false, message: "Coupon name and percentage are required" },
        { status: 400 }
      );
    }

    // Validate percentage
    if (percentage < 1 || percentage > 100) {
      return NextResponse.json(
        { success: false, message: "Percentage must be between 1 and 100" },
        { status: 400 }
      );
    }

    // Check if coupon name already exists
    const existingCoupon = await Coupon.findOne({ name: name.toUpperCase() });
    if (existingCoupon) {
      return NextResponse.json(
        { success: false, message: "Coupon with this name already exists" },
        { status: 400 }
      );
    }

    // Create new coupon
    const coupon = await Coupon.create({
      name: name.toUpperCase(),
      percentage,
      maxUsage: maxUsage || null,
      validUntil: validUntil || null,
      createdBy: new mongoose.Types.ObjectId(user.id),
    });

    await coupon.populate("createdBy", "fullName email");

    return NextResponse.json({
      success: true,
      message: "Coupon created successfully",
      data: coupon,
    });
  } catch (error) {
    console.error("Error creating coupon:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create coupon" },
      { status: 500 }
    );
  }
}
