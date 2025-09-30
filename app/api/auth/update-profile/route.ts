import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import mongoose from "mongoose";
import User from "@/models/user";

export async function PUT(req: NextRequest) {
  try {
    await connectToDB();

    const body = await req.json();
    const { userId, fullName, phone } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    // Get existing user
    const existingUser = await User.findById(userId).select("-password");
    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (fullName && fullName.trim()) {
      updateData.fullName = fullName.trim();
    }

    if (phone && phone.trim()) {
      // Validate phone number format
      if (!/^[0-9]{10}$/.test(phone.trim())) {
        return NextResponse.json(
          { success: false, message: "Phone number must be 10 digits" },
          { status: 400 }
        );
      }

      // Check if phone number is already taken by another user
      const trimmedPhone = phone.trim();
      const phoneExists = await User.findOne({
        phone: trimmedPhone,
        _id: { $ne: new mongoose.Types.ObjectId(userId) },
      });

      if (phoneExists) {
        return NextResponse.json(
          { success: false, message: "Phone number is already in use" },
          { status: 400 }
        );
      }

      updateData.phone = phone.trim();
    }

    // Update user profile if there's data to update
    if (Object.keys(updateData).length > 0) {
      await User.findByIdAndUpdate(userId, updateData);
    } else {
      return NextResponse.json(
        { success: false, message: "No data provided to update" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Update profile error:", error);
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
