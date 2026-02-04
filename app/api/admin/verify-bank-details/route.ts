// app/api/admin/verify-bank-details/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import User from "@/models/user";
import Notification from "@/models/notification";
import { authUser } from "@/actions/authUser";

// POST: Verify owner's bank details
export async function POST(req: NextRequest) {
  try {
    await connectToDB();

    const user = await authUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    const { ownerId, isVerified } = await req.json();

    if (!ownerId) {
      return NextResponse.json(
        { success: false, message: "Owner ID is required" },
        { status: 400 }
      );
    }

    const owner = await User.findById(ownerId);
    if (!owner) {
      return NextResponse.json(
        { success: false, message: "Owner not found" },
        { status: 404 }
      );
    }

    // Update verification status
    owner.bankDetails.isVerified = isVerified;
    owner.bankDetails.verifiedAt = isVerified ? new Date() : null;
    await owner.save();

    // Notify owner
    await Notification.create({
      userId: ownerId,
      type: "general",
      title: isVerified ? "Bank Details Verified" : "Bank Details Rejected",
      message: isVerified
        ? "Your bank details have been verified. You can now receive payouts."
        : "Your bank details verification was rejected. Please update and resubmit.",
      priority: "high",
    });

    return NextResponse.json({
      success: true,
      message: isVerified
        ? "Bank details verified successfully"
        : "Bank details marked as unverified",
    });
  } catch (error) {
    console.error("Verify bank details error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}