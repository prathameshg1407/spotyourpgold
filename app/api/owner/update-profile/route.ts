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

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    // Get existing user and owner profile
    const existingUser = await User.findById(userId).select("-password");
    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const existingOwnerProfile = await OwnerProfile.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    });

    // Update user basic information if provided
    if (fullName || phone) {
      if (phone && !/^[0-9]{10}$/.test(phone)) {
        return NextResponse.json(
          { success: false, message: "Phone number must be 10 digits" },
          { status: 400 }
        );
      }

      // Check if phone number is already taken by another user
      if (phone) {
        const phoneExists = await User.findOne({
          phone,
          _id: { $ne: new mongoose.Types.ObjectId(userId) },
        });

        if (phoneExists) {
          return NextResponse.json(
            { success: false, message: "Phone number is already in use" },
            { status: 400 }
          );
        }
      }

      const userUpdateData: any = {};
      if (fullName) userUpdateData.fullName = fullName.trim();
      if (phone) userUpdateData.phone = phone.trim();

      await User.findByIdAndUpdate(userId, userUpdateData);
    }

    // Update owner profile if provided
    if (aadhaarNumber || address || paymentDetails) {
      const ownerProfileData: any = {};

      if (aadhaarNumber) ownerProfileData.aadhaarNumber = aadhaarNumber.trim();
      if (phone) ownerProfileData.phone = phone.trim();

      if (address) {
        ownerProfileData.address = {
          street:
            address?.street?.trim() ||
            existingOwnerProfile?.address?.street ||
            "",
          city:
            address?.city?.trim() || existingOwnerProfile?.address?.city || "",
          state:
            address?.state?.trim() ||
            existingOwnerProfile?.address?.state ||
            "",
          pincode:
            address?.pincode?.trim() ||
            existingOwnerProfile?.address?.pincode ||
            "",
          country:
            address?.country?.trim() ||
            existingOwnerProfile?.address?.country ||
            "India",
        };
      }

      if (paymentDetails) {
        ownerProfileData.paymentDetails = {
          accountNumber:
            paymentDetails?.accountNumber?.trim() ||
            existingOwnerProfile?.paymentDetails?.accountNumber ||
            "",
          ifscCode:
            paymentDetails?.ifscCode?.trim() ||
            existingOwnerProfile?.paymentDetails?.ifscCode ||
            "",
          accountHolderName:
            paymentDetails?.accountHolderName?.trim() ||
            existingOwnerProfile?.paymentDetails?.accountHolderName ||
            "",
          bankName:
            paymentDetails?.bankName?.trim() ||
            existingOwnerProfile?.paymentDetails?.bankName ||
            "",
          upiId:
            paymentDetails?.upiId?.trim() ||
            existingOwnerProfile?.paymentDetails?.upiId ||
            "",
        };
      }

      await OwnerProfile.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(userId) },
        ownerProfileData,
        { upsert: true, new: true }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
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
