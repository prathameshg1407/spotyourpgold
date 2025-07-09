import { connectToDB } from "@/services/connectdb";
import OwnerProfile from "@/models/ownerProfile";
import User from "@/models/user"; // ✅ Add this line
import { NextResponse } from "next/server";
import authUser from "@/actions/authUser";

export async function POST(req: Request) {
  try {
    await connectToDB();
    const {
      accountNumber,
      ifscCode,
      accountHolderName,
      bankName,
      upiId,
    } = await req.json();

    const user = await authUser();

    if (!accountNumber || !ifscCode || !accountHolderName || !bankName) {
      return NextResponse.json({
        success: false,
        message: "Missing required bank details.",
      });
    }

    const profile = await OwnerProfile.findOne({ userId: user?.id });
    if (!profile) {
      return NextResponse.json({
        success: false,
        message: "Owner profile not found.",
      });
    }

    profile.paymentDetails = {
      accountNumber,
      ifscCode,
      accountHolderName,
      bankName,
      upiId: upiId || "",
    };
    await profile.save();

   await User.findByIdAndUpdate(user?.id, {
      ownerStatus: "pending",
    });


    return NextResponse.json({
      success: true,
      message: "Bank details updated",
    });
  } catch (error) {
    console.error("[BANK_DETAILS_API]", error);
    return NextResponse.json({
      success: false,
      message: "Server error while updating bank details.",
    });
  }
}
