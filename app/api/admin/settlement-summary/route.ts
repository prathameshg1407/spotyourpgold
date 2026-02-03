// app/api/admin/settlement-summary/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import Commission from "@/models/commission";
import Booking from "@/models/booking";
import User from "@/models/user";
import Listing from "@/models/listing";
import { authUser } from "@/actions/authUser";

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

    // Overall commission stats
    const commissionStats = await Commission.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$commissionAmount" },
          totalBookingAmount: { $sum: "$bookingAmount" },
        },
      },
    ]);

    const pending = commissionStats.find((s) => s._id === "pending");
    const settled = commissionStats.find((s) => s._id === "settled");
    const overdue = commissionStats.find((s) => s._id === "overdue");

    // Top owners by pending commission
    const topOwnersPending = await Commission.aggregate([
      { $match: { status: { $in: ["pending", "overdue"] } } },
      {
        $group: {
          _id: "$ownerId",
          totalPending: { $sum: "$commissionAmount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalPending: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "owner",
        },
      },
      { $unwind: "$owner" },
      {
        $project: {
          ownerId: "$_id",
          ownerName: "$owner.fullName",
          ownerEmail: "$owner.email",
          ownerPhone: "$owner.phone",
          totalPending: 1,
          count: 1,
        },
      },
    ]);

    // Monthly trend (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyTrend = await Commission.aggregate([
      { $match: { createdAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            status: "$status",
          },
          amount: { $sum: "$commissionAmount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Recent settlements
    const recentSettlements = await Commission.find({ status: "settled" })
      .populate("ownerId", "fullName email phone")
      .populate({
        path: "bookingId",
        select: "fullName listingId",
        populate: {
          path: "listingId",
          select: "pgName",
        },
      })
      .populate("settledBy", "fullName")
      .sort({ settledAt: -1 })
      .limit(20);

    // Overdue commissions (priority list)
    const overdueList = await Commission.find({ status: "overdue" })
      .populate("ownerId", "fullName email phone")
      .populate({
        path: "bookingId",
        select: "fullName listingId amount",
        populate: {
          path: "listingId",
          select: "pgName",
        },
      })
      .sort({ dueDate: 1 })
      .limit(20);

    // Platform revenue
    const totalRevenue = settled?.totalAmount || 0;
    const pendingRevenue = (pending?.totalAmount || 0) + (overdue?.totalAmount || 0);

    // Booking stats
    const totalBookings = await Booking.countDocuments({ status: "confirmed" });
    const cashPaymentsCount = await Booking.countDocuments({
      status: "confirmed",
      paymentStatus: "completed_cash",
    });

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalRevenue,
          pendingRevenue,
          totalCommissionsCollected: settled?.count || 0,
          pendingCommissions: (pending?.count || 0) + (overdue?.count || 0),
          overdueCommissions: overdue?.count || 0,
        },
        commissionBreakdown: {
          pending: {
            count: pending?.count || 0,
            amount: pending?.totalAmount || 0,
          },
          settled: {
            count: settled?.count || 0,
            amount: settled?.totalAmount || 0,
          },
          overdue: {
            count: overdue?.count || 0,
            amount: overdue?.totalAmount || 0,
          },
        },
        topOwnersPending,
        monthlyTrend,
        recentSettlements,
        overdueList,
        bookingStats: {
          totalBookings,
          cashPaymentsCount,
        },
      },
    });
  } catch (error) {
    console.error("Get admin settlement summary error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}