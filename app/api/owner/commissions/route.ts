// app/api/owner/commissions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import Commission from "@/models/commission";
import Booking from "@/models/booking";
import Listing from "@/models/listing";
import { authUser } from "@/actions/authUser";

// Get commissions for an owner
export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    const user = await authUser();
    if (!user || (user.role !== "owner" && user.role !== "admin")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const perPage = Math.min(Number(searchParams.get("per_page") || "20"), 50);
    const status = searchParams.get("status") || "all";

    // Build query for owner's commissions
    const query: any = { ownerId: user.id };
    if (status !== "all") {
      query.status = status;
    }

    const total = await Commission.countDocuments(query);

    const commissions = await Commission.find(query)
      .populate({
        path: "bookingId",
        select: "fullName phoneNumber email roomType moveInDate amount listingId",
        populate: {
          path: "listingId",
          select: "pgName location",
        },
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    const totalPages = Math.ceil(total / perPage);

    // Calculate summary for this owner
    const summary = await Commission.aggregate([
      { $match: { ownerId: user.id } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$commissionAmount" },
        },
      },
    ]);

    // Calculate overall stats
    const pendingCommission = summary.find((s) => s._id === "pending");
    const settledCommission = summary.find((s) => s._id === "settled");
    const overdueCommission = summary.find((s) => s._id === "overdue");

    const stats = {
      pendingAmount: pendingCommission?.totalAmount || 0,
      pendingCount: pendingCommission?.count || 0,
      settledAmount: settledCommission?.totalAmount || 0,
      settledCount: settledCommission?.count || 0,
      overdueAmount: overdueCommission?.totalAmount || 0,
      overdueCount: overdueCommission?.count || 0,
      totalOwed: (pendingCommission?.totalAmount || 0) + (overdueCommission?.totalAmount || 0),
    };

    return NextResponse.json({
      success: true,
      data: commissions,
      total,
      totalPages,
      currentPage: page,
      stats,
    });
  } catch (error) {
    console.error("Get owner commissions error:", error);
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