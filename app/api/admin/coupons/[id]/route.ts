import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import Coupon from "@/models/coupon";
import { authUser } from "@/actions/authUser";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const { name, percentage, isActive, maxUsage, validUntil } = body;

    // Find the coupon
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return NextResponse.json(
        { success: false, message: "Coupon not found" },
        { status: 404 }
      );
    }

    // Validate percentage if provided
    if (percentage && (percentage < 1 || percentage > 100)) {
      return NextResponse.json(
        { success: false, message: "Percentage must be between 1 and 100" },
        { status: 400 }
      );
    }

    // Check if coupon name already exists (excluding current coupon)
    if (name && name.toUpperCase() !== coupon.name) {
      const existingCoupon = await Coupon.findOne({
        name: name.toUpperCase(),
        _id: { $ne: id },
      });
      if (existingCoupon) {
        return NextResponse.json(
          { success: false, message: "Coupon with this name already exists" },
          { status: 400 }
        );
      }
    }

    // Update coupon
    const updateData: any = {};
    if (name) updateData.name = name.toUpperCase();
    if (percentage !== undefined) updateData.percentage = percentage;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (maxUsage !== undefined) updateData.maxUsage = maxUsage;
    if (validUntil !== undefined) updateData.validUntil = validUntil;

    const updatedCoupon = await Coupon.findByIdAndUpdate(id, updateData, {
      new: true,
    }).populate("createdBy", "fullName email");

    return NextResponse.json({
      success: true,
      message: "Coupon updated successfully",
      data: updatedCoupon,
    });
  } catch (error) {
    console.error("Error updating coupon:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update coupon" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Find and delete the coupon
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      return NextResponse.json(
        { success: false, message: "Coupon not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete coupon" },
      { status: 500 }
    );
  }
}
