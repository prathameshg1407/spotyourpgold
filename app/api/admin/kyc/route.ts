// app/api/admin/kyc/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import User from "@/models/user";
import OwnerProfile from "@/models/ownerProfile";
import Notification from "@/models/notification";
import { authUser } from "@/actions/authUser";

// GET - Get all pending KYC verifications
export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    const user = await authUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "pending"; // pending, verified, rejected, all
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const perPage = Math.min(Number(searchParams.get("per_page") || "20"), 50);

    // Build user query
    const userQuery: any = { role: "owner" };
    if (status !== "all") {
      userQuery.ownerStatus = status;
    }

    const total = await User.countDocuments(userQuery);
    const users = await User.find(userQuery)
      .select("fullName email phone ownerStatus createdAt")
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    // Get owner profiles for these users
    const userIds = users.map((u) => u._id);
    const profiles = await OwnerProfile.find({ userId: { $in: userIds } });

    // Combine user and profile data
    const owners = users.map((user: any) => {
      const profile = profiles.find(
        (p: any) => p.userId.toString() === user._id.toString()
      );

      return {
        userId: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone || profile?.phone,
        ownerStatus: user.ownerStatus,
        registeredAt: user.createdAt,
        profile: profile
          ? {
              aadhaarNumber: profile.aadhaarNumber,
              phoneVerified: profile.phoneVerified,
              address: profile.address,
              documents: {
                aadhaarFront: profile.documents?.aadhaarFrontUrl,
                aadhaarBack: profile.documents?.aadhaarBackUrl,
                additionalDocuments: profile.documents?.additionalDocuments || [],
              },
              paymentDetails: profile.paymentDetails,
            }
          : null,
      };
    });

    // Get summary counts
    const summary = await User.aggregate([
      { $match: { role: "owner" } },
      {
        $group: {
          _id: "$ownerStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    const summaryData = {
      pending: summary.find((s) => s._id === "pending")?.count || 0,
      verified: summary.find((s) => s._id === "verified")?.count || 0,
      rejected: summary.find((s) => s._id === "rejected")?.count || 0,
      none: summary.find((s) => s._id === "none")?.count || 0,
    };

    return NextResponse.json({
      success: true,
      data: owners,
      total,
      totalPages: Math.ceil(total / perPage),
      currentPage: page,
      summary: summaryData,
    });
  } catch (error) {
    console.error("Get KYC list error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Approve/Reject KYC
export async function PATCH(req: NextRequest) {
  try {
    await connectToDB();

    const user = await authUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const { userId, action, rejectionReason } = await req.json();

    if (!userId || !action) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const owner = await User.findById(userId);
    if (!owner) {
      return NextResponse.json(
        { success: false, message: "Owner not found" },
        { status: 404 }
      );
    }

    if (action === "approve") {
      owner.ownerStatus = "verified";
      await owner.save();

      // Notify owner
      await Notification.create({
        userId: owner._id,
        type: "general",
        title: "KYC Verified! 🎉",
        message:
          "Congratulations! Your KYC verification has been approved. You can now list your properties on SpotYourPG.",
        priority: "high",
      });

      return NextResponse.json({
        success: true,
        message: "Owner KYC approved successfully",
      });
    } else if (action === "reject") {
      owner.ownerStatus = "rejected";
      await owner.save();

      // Notify owner
      await Notification.create({
        userId: owner._id,
        type: "general",
        title: "KYC Verification Update",
        message: `Your KYC verification was not approved. ${
          rejectionReason ? `Reason: ${rejectionReason}` : "Please contact support for more details."
        }`,
        priority: "high",
        metadata: { rejectionReason },
      });

      return NextResponse.json({
        success: true,
        message: "Owner KYC rejected",
      });
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid action" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("KYC action error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}