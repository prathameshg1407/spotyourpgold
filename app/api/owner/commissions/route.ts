import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import mongoose from "mongoose";
import Commission from "@/models/commission";
import { authUser } from "@/actions/authUser";

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
    const type = searchParams.get("type") || "all";
    const status = searchParams.get("status") || "all";
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const perPage = Math.min(Number(searchParams.get("per_page") || "20"), 50);

    // Build query
    const query: any = {
      ownerId: new mongoose.Types.ObjectId(user.id),
    };

    // Filter by commission direction
    if (type === "receivable") {
      // Money owner will receive from admin (90% payouts)
      query.commissionType = { $in: ["first_month_payout", "monthly_rent_payout", "security_deposit_payout"] };
      query.direction = "admin_owes_owner";
    } else if (type === "payable") {
      // Money owner owes to admin (10% commissions)
      query.commissionType = { $in: ["booking_fee_receivable", "monthly_rent_commission"] };
      query.direction = "owner_owes_admin";
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
        select: "fullName roomType moveInDate monthlyRent paymentMethod",
      })
      .populate("listingId", "pgName")
      .populate("tenantId", "fullName email phone")
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    const totalPages = Math.ceil(total / perPage);

    // Summary statistics
    const summary = await Commission.aggregate([
      {
        $match: { ownerId: new mongoose.Types.ObjectId(user.id) },
      },
      {
        $group: {
          _id: {
            direction: "$direction",
            status: "$status",
          },
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    // Organize summary
    const receivables = {
      pending: summary.find(s => s._id.direction === "admin_owes_owner" && s._id.status === "pending")?.totalAmount || 0,
      completed: summary.find(s => s._id.direction === "admin_owes_owner" && s._id.status === "completed")?.totalAmount || 0,
    };

    const payables = {
      pending: summary.find(s => s._id.direction === "owner_owes_admin" && s._id.status === "pending")?.totalAmount || 0,
      overdue: summary.find(s => s._id.direction === "owner_owes_admin" && s._id.status === "overdue")?.totalAmount || 0,
      completed: summary.find(s => s._id.direction === "owner_owes_admin" && s._id.status === "completed")?.totalAmount || 0,
    };

    return NextResponse.json({
      success: true,
      data: commissions,
      total,
      totalPages,
      currentPage: page,
      summary: {
        receivables,
        payables,
        netPosition: receivables.pending - (payables.pending + payables.overdue),
      },
    });
  } catch (error) {
    console.error("Get owner commissions error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}