import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import mongoose from "mongoose";
import User from "@/models/user";
import OwnerProfile from "@/models/ownerProfile";

export async function PUT(req: NextRequest) {
  try {
    await connectToDB();

    const body = await req.json();
    const { userId, fullName, phone, aadhaarNumber, address, paymentDetails } =
      body;

    // Validate required fields
    if (!userId || !fullName || !phone || !aadhaarNumber) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate phone number format
    if (!/^[0-9]{10}$/.test(phone)) {
      return NextResponse.json(
        { success: false, message: "Phone number must be 10 digits" },
        { status: 400 }
      );
    }

    // Check if phone number is already taken by another user
    const existingUser = await User.findOne({
      phone,
      _id: { $ne: new mongoose.Types.ObjectId(userId) },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "Phone number is already in use" },
        { status: 400 }
      );
    }

    // Update user basic information
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        fullName: fullName.trim(),
        phone: phone.trim(),
      },
      { new: true, select: "-password" }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Update or create owner profile
    const ownerProfileData = {
      phone: phone.trim(),
      aadhaarNumber: aadhaarNumber.trim(),
      address: {
        street: address?.street?.trim() || "",
        city: address?.city?.trim() || "",
        state: address?.state?.trim() || "",
        pincode: address?.pincode?.trim() || "",
        country: address?.country?.trim() || "India",
      },
      paymentDetails: {
        accountNumber: paymentDetails?.accountNumber?.trim() || "",
        ifscCode: paymentDetails?.ifscCode?.trim() || "",
        accountHolderName: paymentDetails?.accountHolderName?.trim() || "",
        bankName: paymentDetails?.bankName?.trim() || "",
        upiId: paymentDetails?.upiId?.trim() || "",
      },
    };

    const ownerProfile = await OwnerProfile.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      ownerProfileData,
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
      ownerProfile,
    });
  } catch (error) {
    console.error("Update owner profile error:", error);
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
