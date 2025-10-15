import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import Commission from "@/models/commission";
import Booking from "@/models/booking";
import User from "@/models/user";
import { authUser } from "@/actions/authUser";

// Get commission ledger for admin
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
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const perPage = Math.min(Number(searchParams.get("per_page") || "20"), 50);
    const status = searchParams.get("status") || "all";
    const ownerId = searchParams.get("ownerId");

    // Build query
    const query: any = {};
    if (status !== "all") {
      query.status = status;
    }
    if (ownerId) {
      query.ownerId = ownerId;
    }

    const total = await Commission.countDocuments(query);

    const commissions = await Commission.find(query)
      .populate("ownerId", "fullName email phoneNumber")
      .populate({
        path: "bookingId",
        select:
          "amount securityDeposit moveInDate fullName phoneNumber email address aadhaarNumber additionalRequirements",
        populate: {
          path: "userId",
          select: "fullName email phoneNumber",
        },
      })
      .populate("settledBy", "fullName")
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    const totalPages = Math.ceil(total / perPage);

    // Calculate summary
    const summary = await Commission.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$commissionAmount" },
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      data: commissions,
      total,
      totalPages,
      currentPage: page,
      summary,
    });
  } catch (error) {
    console.error("Get commissions error:", error);
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

// Mark commission as settled
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

    const { commissionId, settlementMethod, settlementReference, notes } =
      await req.json();

    if (!commissionId) {
      return NextResponse.json(
        { success: false, message: "Commission ID is required" },
        { status: 400 }
      );
    }

    const commission = await Commission.findById(commissionId);
    if (!commission) {
      return NextResponse.json(
        { success: false, message: "Commission not found" },
        { status: 404 }
      );
    }

    // Update commission
    commission.status = "settled";
    commission.settledAt = new Date();
    commission.settledBy = user.id;
    commission.settlementMethod = settlementMethod || "cash";
    commission.settlementReference = settlementReference || "";
    commission.notes = notes || "";

    await commission.save();

    return NextResponse.json({
      success: true,
      message: "Commission marked as settled",
      data: commission,
    });
  } catch (error) {
    console.error("Settle commission error:", error);
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
