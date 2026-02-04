// app/api/owner/bank-details/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import User from "@/models/user";
import { authUser } from "@/actions/authUser";

// GET: Get owner's bank details
export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    const user = await authUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const owner = await User.findById(user.id).select("bankDetails");

    if (!owner) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: owner.bankDetails || null,
    });
  } catch (error) {
    console.error("Get bank details error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Save/Update bank details
export async function POST(req: NextRequest) {
  try {
    await connectToDB();

    const user = await authUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      accountHolderName,
      accountNumber,
      ifscCode,
      bankName,
      branchName,
      upiId,
    } = body;

    // Validation
    if (!accountHolderName?.trim()) {
      return NextResponse.json(
        { success: false, message: "Account holder name is required" },
        { status: 400 }
      );
    }

    if (!accountNumber?.trim()) {
      return NextResponse.json(
        { success: false, message: "Account number is required" },
        { status: 400 }
      );
    }

    if (!ifscCode?.trim()) {
      return NextResponse.json(
        { success: false, message: "IFSC code is required" },
        { status: 400 }
      );
    }

    // IFSC validation
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(ifscCode.toUpperCase())) {
      return NextResponse.json(
        { success: false, message: "Invalid IFSC code format" },
        { status: 400 }
      );
    }

    // Update bank details
    const updatedUser = await User.findByIdAndUpdate(
      user.id,
      {
        $set: {
          "bankDetails.accountHolderName": accountHolderName.trim(),
          "bankDetails.accountNumber": accountNumber.trim(),
          "bankDetails.ifscCode": ifscCode.toUpperCase().trim(),
          "bankDetails.bankName": bankName?.trim() || "",
          "bankDetails.branchName": branchName?.trim() || "",
          "bankDetails.upiId": upiId?.trim() || "",
          // Reset verification when details change
          "bankDetails.isVerified": false,
          "bankDetails.verifiedAt": null,
        },
      },
      { new: true }
    ).select("bankDetails");

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Bank details saved successfully",
      data: updatedUser.bankDetails,
    });
  } catch (error) {
    console.error("Save bank details error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}