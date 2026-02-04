// app/api/owner/commissions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import mongoose from "mongoose";
import Commission from "@/models/commission";
import { authUser } from "@/actions/authUser";

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

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "all"; // first_month_owner, monthly_rent, all
    const status = searchParams.get("status") || "all";
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const perPage = Math.min(Number(searchParams.get("per_page") || "20"), 50);

    // Build query
    const query: any = {
      ownerId: new mongoose.Types.ObjectId(user.id),
    };

    // Filter by type
    if (type === "payouts") {
      query.commissionType = "first_month_owner";
    } else if (type === "owed") {
      query.commissionType = "monthly_rent";
    } else if (type !== "all") {
      query.commissionType = type;
    }

    // Filter by status
    if (status !== "all") {
      query.status = status;
    }

    const total = await Commission.countDocuments(query);

    const commissions = await Commission.find(query)
      .populate({
        path: "bookingId",
        select: "fullName roomType listingId moveInDate",
        populate: {
          path: "listingId",
          select: "pgName",
        },
      })
      .populate("listingId", "pgName")
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    const totalPages = Math.ceil(total / perPage);

    // Summary by type
    const summary = await Commission.aggregate([
      {
        $match: { ownerId: new mongoose.Types.ObjectId(user.id) },
      },
      {
        $group: {
          _id: {
            type: "$commissionType",
            status: "$status",
          },
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
    console.error("Get owner commissions error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}