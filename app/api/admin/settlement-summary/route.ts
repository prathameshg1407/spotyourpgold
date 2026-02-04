import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import Commission from "@/models/commission";
import Booking from "@/models/booking";
import User from "@/models/user";
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

    // ============ FIRST MONTH COMMISSION SUMMARY ============
    // Admin's 10% from first payments
    const firstMonthAdminCommissions = await Commission.aggregate([
      { $match: { commissionType: "first_month_admin" } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$commissionAmount" },
        },
      },
    ]);

    // 90% that admin owes to owners
    const firstMonthOwnerPayouts = await Commission.aggregate([
      { $match: { commissionType: "first_month_owner" } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$commissionAmount" },
        },
      },
    ]);

    // ============ MONTHLY RENT COMMISSION SUMMARY ============
    // 10% that owners owe to admin
    const monthlyRentCommissions = await Commission.aggregate([
      { $match: { commissionType: "monthly_rent" } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$commissionAmount" },
        },
      },
    ]);

    // ============ PENDING OWNER PAYOUTS (90%) ============
    const pendingOwnerPayouts = await Booking.aggregate([
      {
        $match: {
          "firstMonthCommission.ownerPayoutStatus": "pending",
          paymentStatus: "completed_cash",
        },
      },
      {
        $group: {
          _id: "$ownerId",
          totalPending: { $sum: "$firstMonthCommission.ownerAmount" },
          count: { $sum: 1 },
        },
      },
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
          totalPending: 1,
          count: 1,
        },
      },
      { $sort: { totalPending: -1 } },
      { $limit: 10 },
    ]);

    // ============ TOP OWNERS WITH PENDING COMMISSIONS (10%) ============
    const topOwnersPendingCommissions = await Commission.aggregate([
      { $match: { commissionType: "monthly_rent", status: { $in: ["pending", "overdue"] } } },
      {
        $group: {
          _id: "$ownerId",
          totalPending: { $sum: "$commissionAmount" },
          count: { $sum: 1 },
        },
      },
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
      { $sort: { totalPending: -1 } },
      { $limit: 10 },
    ]);

    // ============ MONTHLY TREND ============
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrend = await Commission.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            type: "$commissionType",
          },
          amount: { $sum: "$commissionAmount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // ============ RECENT ACTIVITY ============
    const recentActivity = await Commission.find()
      .populate("ownerId", "fullName email")
      .populate("listingId", "pgName")
      .sort({ createdAt: -1 })
      .limit(20);

    // ============ CALCULATE TOTALS ============
    const getAmount = (arr: any[], status: string) => 
      arr.find(a => a._id === status)?.totalAmount || 0;
    const getCount = (arr: any[], status: string) => 
      arr.find(a => a._id === status)?.count || 0;

    // Revenue from first month admin commissions (10%)
    const adminRevenue = {
      received: getAmount(firstMonthAdminCommissions, "completed"),
      pending: getAmount(firstMonthAdminCommissions, "pending"),
    };

    // Payouts to owners from first month (90%)
    const ownerPayouts = {
      paid: getAmount(firstMonthOwnerPayouts, "completed"),
      pending: getAmount(firstMonthOwnerPayouts, "pending"),
    };

    // Monthly rent commissions (10% owner owes admin)
    const monthlyCommissions = {
      collected: getAmount(monthlyRentCommissions, "completed"),
      pending: getAmount(monthlyRentCommissions, "pending"),
      overdue: getAmount(monthlyRentCommissions, "overdue"),
    };

    // Total platform revenue
    const totalRevenue = adminRevenue.received + monthlyCommissions.collected;
    const pendingRevenue = adminRevenue.pending + monthlyCommissions.pending + monthlyCommissions.overdue;

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalRevenue,
          pendingRevenue,
          pendingOwnerPayouts: ownerPayouts.pending,
          
          // First month breakdown
          firstMonth: {
            adminReceived: adminRevenue.received,
            adminPending: adminRevenue.pending,
            ownerPaid: ownerPayouts.paid,
            ownerPending: ownerPayouts.pending,
          },
          
          // Monthly rent breakdown
          monthlyRent: {
            collected: monthlyCommissions.collected,
            pending: monthlyCommissions.pending,
            overdue: monthlyCommissions.overdue,
          },
        },
        
        pendingOwnerPayouts,
        topOwnersPendingCommissions,
        monthlyTrend,
        recentActivity,
        
        // Booking stats
        bookingStats: {
          totalConfirmed: await Booking.countDocuments({ status: "confirmed" }),
          cashPaymentsCompleted: await Booking.countDocuments({ paymentStatus: "completed_cash" }),
          pendingPayouts: await Booking.countDocuments({ "firstMonthCommission.ownerPayoutStatus": "pending" }),
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