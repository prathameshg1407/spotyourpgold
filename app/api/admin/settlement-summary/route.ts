import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import mongoose from "mongoose";
import Commission from "@/models/commission";
import Booking from "@/models/booking";
import MonthlyRentPayment from "@/models/MonthlyRentPayment";
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

    // ============ REVENUE: LISTING FEES ============
    const listingFeerevenueData = await Listing.aggregate([
      {
        $match: {
          paymentStatus: "completed",
        },
      },
      {
        $group: {
          _id: null,
          totalCollected: {
            $sum: { $ifNull: ["$listingFeePaid", 999] },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    // ============ REVENUE: BOOKING FEES (10% from online bookings) ============
    const bookingFeeRevenue = await Booking.aggregate([
      {
        $match: {
          paymentMethod: "online",
          "bookingFee.status": "paid",
        },
      },
      {
        $group: {
          _id: null,
          totalCollected: { $sum: "$bookingFee.amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    // ============ RECEIVABLES: BOOKING FEES FROM CASH (10% owner owes) ============
    const cashBookingFeeReceivables = await Booking.aggregate([
      {
        $match: {
          paymentMethod: "cash",
          "bookingFee.status": "paid",
        },
      },
      {
        $group: {
          _id: "$bookingFee.ownerCommissionStatus",
          amount: { $sum: "$bookingFee.amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    // ============ RECEIVABLES: MONTHLY RENT COMMISSIONS (10% from cash) ============
    const monthlyCommissionReceivables = await MonthlyRentPayment.aggregate([
      {
        $match: {
          paymentMethod: "cash",
          paymentStatus: "paid",
        },
      },
      {
        $group: {
          _id: "$cashPayment.adminCommissionStatus",
          amount: { $sum: "$cashPayment.adminCommissionOwed" },
          count: { $sum: 1 },
        },
      },
    ]);

    // ============ PAYABLES: FIRST MONTH PAYOUTS (90% to owners) ============
    const firstMonthPayouts = await Booking.aggregate([
      {
        $match: {
          paymentMethod: "online",
          "firstMonthRent.status": "paid",
        },
      },
      {
        $group: {
          _id: "$firstMonthRent.ownerPayoutStatus",
          amount: { $sum: "$firstMonthRent.ownerPayoutAmount" },
          count: { $sum: 1 },
        },
      },
    ]);

    // ============ PAYABLES: SECURITY DEPOSITS (to owners) ============
    const depositPayouts = await Booking.aggregate([
      {
        $match: {
          paymentMethod: "online",
          "securityDeposit.status": "paid",
        },
      },
      {
        $group: {
          _id: "$securityDeposit.transferredToOwner",
          amount: { $sum: "$securityDeposit.amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    // ============ PAYABLES: MONTHLY RENT PAYOUTS (90% to owners) ============
    const monthlyPayouts = await MonthlyRentPayment.aggregate([
      {
        $match: {
          paymentMethod: "online",
          paymentStatus: "paid",
        },
      },
      {
        $group: {
          _id: "$onlinePayment.ownerPayoutStatus",
          amount: { $sum: "$onlinePayment.ownerPayoutAmount" },
          count: { $sum: 1 },
        },
      },
    ]);

    // ============ TOP OWNERS WITH PENDING PAYOUTS ============
    const pendingOwnerPayouts = await Booking.aggregate([
      {
        $match: {
          paymentMethod: "online",
          $or: [
            { "firstMonthRent.ownerPayoutStatus": "pending" },
            {
              "securityDeposit.status": "paid",
              "securityDeposit.transferredToOwner": false,
            },
          ],
        },
      },
      {
        $group: {
          _id: "$ownerId",
          firstMonthPending: {
            $sum: {
              $cond: [
                { $eq: ["$firstMonthRent.ownerPayoutStatus", "pending"] },
                "$firstMonthRent.ownerPayoutAmount",
                0,
              ],
            },
          },
          depositPending: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$securityDeposit.status", "paid"] },
                    { $eq: ["$securityDeposit.transferredToOwner", false] },
                  ],
                },
                "$securityDeposit.amount",
                0,
              ],
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $addFields: {
          totalPending: { $add: ["$firstMonthPending", "$depositPending"] },
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
          firstMonthPending: 1,
          depositPending: 1,
          totalPending: 1,
          count: 1,
        },
      },
      { $sort: { totalPending: -1 } },
      { $limit: 10 },
    ]);

    // ============ TOP OWNERS OWING COMMISSIONS ============
    const topOwnersPendingCommissions = await Commission.aggregate([
      {
        $match: {
          direction: "owner_owes_admin",
          status: { $in: ["pending", "overdue"] },
        },
      },
      {
        $group: {
          _id: "$ownerId",
          totalPending: { $sum: "$amount" },
          count: { $sum: 1 },
          overdueCount: {
            $sum: { $cond: [{ $eq: ["$status", "overdue"] }, 1, 0] },
          },
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
          overdueCount: 1,
        },
      },
      { $sort: { totalPending: -1 } },
      { $limit: 10 },
    ]);

    // ============ MONTHLY TREND (Last 6 months) ============
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrend = await Commission.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            direction: "$direction",
          },
          amount: { $sum: "$amount" },
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

    // ============ CALCULATE OVERVIEW ============
    const getAmount = (arr: any[], key: string | boolean) =>
      arr.find((a) => a._id === key)?.amount || 0;

    // Revenue (Admin receives)
    const onlineBookingFees = bookingFeeRevenue[0]?.totalCollected || 0;
    const listingFees = listingFeerevenueData[0]?.totalCollected || 0;

    // Receivables (Owner owes Admin)
    const cashBookingFeePending = getAmount(cashBookingFeeReceivables, "pending");
    const cashBookingFeeCollected = getAmount(cashBookingFeeReceivables, "paid");
    const monthlyCommissionPending = getAmount(monthlyCommissionReceivables, "pending");
    const monthlyCommissionOverdue = getAmount(monthlyCommissionReceivables, "overdue");
    const monthlyCommissionCollected = getAmount(monthlyCommissionReceivables, "paid");

    // Payables (Admin owes Owner)
    const firstMonthPayoutPending = getAmount(firstMonthPayouts, "pending");
    const firstMonthPayoutCompleted = getAmount(firstMonthPayouts, "completed");
    const depositPending = getAmount(depositPayouts, false);
    const depositCompleted = getAmount(depositPayouts, true);
    const monthlyPayoutPending = getAmount(monthlyPayouts, "pending");
    const monthlyPayoutCompleted = getAmount(monthlyPayouts, "completed");

    // Totals
    const totalRevenue = onlineBookingFees + cashBookingFeeCollected + monthlyCommissionCollected + listingFees;
    const totalReceivables = cashBookingFeePending + monthlyCommissionPending + monthlyCommissionOverdue;
    const totalPayables = firstMonthPayoutPending + depositPending + monthlyPayoutPending;

    // Booking stats
    const bookingStats = await Booking.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          confirmed: {
            $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] },
          },
          active: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
          },
          online: {
            $sum: { $cond: [{ $eq: ["$paymentMethod", "online"] }, 1, 0] },
          },
          cash: {
            $sum: { $cond: [{ $eq: ["$paymentMethod", "cash"] }, 1, 0] },
          },
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalRevenue,
          totalReceivables,
          totalPayables,
          netPosition: totalRevenue + totalReceivables - totalPayables,

          // Revenue breakdown
          revenue: {
            onlineBookingFees,
            cashBookingFeeCollected,
            monthlyCommissionCollected,
            listingFees,
          },

          // Receivables breakdown (Owner owes Admin)
          receivables: {
            cashBookingFeePending,
            monthlyCommissionPending,
            monthlyCommissionOverdue,
          },

          // Payables breakdown (Admin owes Owner)
          payables: {
            firstMonthPayoutPending,
            firstMonthPayoutCompleted,
            depositPending,
            depositCompleted,
            monthlyPayoutPending,
            monthlyPayoutCompleted,
          },
        },

        pendingOwnerPayouts,
        topOwnersPendingCommissions,
        monthlyTrend,
        recentActivity,

        bookingStats: bookingStats[0] || {
          total: 0,
          confirmed: 0,
          active: 0,
          online: 0,
          cash: 0,
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