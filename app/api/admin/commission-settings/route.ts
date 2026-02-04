import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import User from "@/models/user";
import { authUser } from "@/actions/authUser";

// GET: Get commission settings
export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    const user = await authUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const ownerId = searchParams.get("ownerId");

    if (ownerId) {
      const owner = await User.findById(ownerId).select(
        "fullName email phone commissionSettings settlementSummary"
      );

      if (!owner) {
        return NextResponse.json(
          { success: false, message: "Owner not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          owner,
          effectiveRate: owner.commissionSettings?.isCustomRateActive
            ? owner.commissionSettings.customRate
            : 0.10,
          effectiveRatePercent: owner.commissionSettings?.isCustomRateActive
            ? owner.commissionSettings.customRate * 100
            : 10,
        },
      });
    }

    // Get all owners with their commission settings
    const owners = await User.find({ role: "owner" }).select(
      "fullName email phone commissionSettings settlementSummary"
    );

    return NextResponse.json({
      success: true,
      data: {
        owners,
        defaultRate: 0.10,
        defaultRatePercent: 10,
      },
    });
  } catch (error) {
    console.error("Get commission settings error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT: Update owner's commission rate
export async function PUT(req: NextRequest) {
  try {
    await connectToDB();

    const user = await authUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    const { ownerId, customRatePercent, isActive, notes } = await req.json();

    if (!ownerId) {
      return NextResponse.json(
        { success: false, message: "Owner ID required" },
        { status: 400 }
      );
    }

    // Convert percentage to decimal
    const customRate = customRatePercent !== undefined ? customRatePercent / 100 : null;

    if (customRate !== null && (customRate < 0 || customRate > 0.5)) {
      return NextResponse.json(
        { success: false, message: "Commission rate must be between 0% and 50%" },
        { status: 400 }
      );
    }

    const updateData: any = {
      "commissionSettings.isCustomRateActive": isActive,
    };

    if (customRate !== null) {
      updateData["commissionSettings.customRate"] = customRate;
    }

    if (isActive) {
      updateData["commissionSettings.customRateApprovedBy"] = user.id;
      updateData["commissionSettings.customRateApprovedAt"] = new Date();
    }

    if (notes !== undefined) {
      updateData["commissionSettings.notes"] = notes;
    }

    const owner = await User.findByIdAndUpdate(ownerId, updateData, {
      new: true,
    }).select("fullName email commissionSettings");

    if (!owner) {
      return NextResponse.json(
        { success: false, message: "Owner not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Commission settings updated",
      data: {
        owner,
        effectiveRate: owner.commissionSettings?.isCustomRateActive
          ? owner.commissionSettings.customRate
          : 0.10,
        effectiveRatePercent: owner.commissionSettings?.isCustomRateActive
          ? owner.commissionSettings.customRate * 100
          : 10,
      },
    });
  } catch (error) {
    console.error("Update commission settings error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}