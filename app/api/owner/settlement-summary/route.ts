import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import mongoose from "mongoose";
import Commission from "@/models/commission";
import Booking from "@/models/booking";
import MonthlyRentPayment from "@/models/MonthlyRentPayment";
import Listing from "@/models/listing";
import User from "@/models/user";
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

    // Get owner's data
    const owner = await User.findById(user.id).select("commissionSettings settlementSummary");

    // Get all owner's listings
    const listings = await Listing.find({ ownerId: user.id }).select("_id pgName");
    const listingIds = listings.map((l) => l._id);

    // ============ PAYOUTS FROM ADMIN (90%) ============
    const payouts = await Commission.aggregate([
      {
        $match: {
          ownerId: new mongoose.Types.ObjectId(user.id),
          direction: "admin_owes_owner",
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    const payoutReceived = payouts.find((p) => p._id === "completed")?.totalAmount || 0;
    const payoutPending = payouts.find((p) => p._id === "pending")?.totalAmount || 0;

    // ============ COMMISSIONS TO ADMIN (10%) ============
    const commissions = await Commission.aggregate([
      {
        $match: {
          ownerId: new mongoose.Types.ObjectId(user.id),
          direction: "owner_owes_admin",
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    const commissionPaid = commissions.find((c) => c._id === "completed")?.totalAmount || 0;
    const commissionPending = commissions.find((c) => c._id === "pending")?.totalAmount || 0;
    const commissionOverdue = commissions.find((c) => c._id === "overdue")?.totalAmount || 0;

    // ============ RENT COLLECTION SUMMARY ============
    const rentSummary = await MonthlyRentPayment.aggregate([
      {
        $match: {
          ownerId: new mongoose.Types.ObjectId(user.id),
        },
      },
      {
        $group: {
          _id: "$paymentStatus",
          count: { $sum: 1 },
          totalAmount: { $sum: "$paidAmount" },
          totalDue: {
            $sum: {
              $subtract: [
                { $add: ["$rentAmount", "$lateFee"] },
                "$paidAmount",
              ],
            },
          },
        },
      },
    ]);

    const totalRentCollected = rentSummary.find((r) => r._id === "paid")?.totalAmount || 0;
    const pendingRent = rentSummary.find((r) => r._id === "pending")?.totalDue || 0;
    const overdueRent = rentSummary.find((r) => r._id === "overdue")?.totalDue || 0;

    const activeAllocations = await MonthlyRentPayment.countDocuments({
      ownerId: user.id,
      paymentStatus: { $in: ["pending", "paid", "overdue"] },
    });

    // ============ SECURITY DEPOSITS ============
    const confirmedBookings = await Booking.find({
      ownerId: user.id,
      status: { $in: ["confirmed", "active"] },
    });

    const securityDepositsHeld = confirmedBookings.reduce(
      (acc, booking) => acc + (booking.securityDeposit.amount || 0),
      0
    );

    // ============ RECENT TRANSACTIONS ============
    const recentPayouts = await Commission.find({
      ownerId: user.id,
      direction: "admin_owes_owner",
      status: "completed",
    })
      .populate({
        path: "bookingId",
        select: "fullName roomType",
        populate: { path: "listingId", select: "pgName" },
      })
      .sort({ settledAt: -1 })
      .limit(10);

    const recentCommissionPayments = await Commission.find({
      ownerId: user.id,
      direction: "owner_owes_admin",
      status: "completed",
    })
      .populate("listingId", "pgName")
      .sort({ settledAt: -1 })
      .limit(10);

    // ============ MONTHLY BREAKDOWN ============
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyBreakdown = await Commission.aggregate([
      {
        $match: {
          ownerId: new mongoose.Types.ObjectId(user.id),
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            direction: "$direction",
          },
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
    ]);

    // ============ NET POSITION ============
    const netPosition = payoutPending - (commissionPending + commissionOverdue);

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          payoutReceived,
          payoutPending,
          commissionPaid,
          commissionPending: commissionPending + commissionOverdue,
          netPosition,
          netPositionLabel: netPosition >= 0 ? "Admin owes you" : "You owe Admin",
          securityDepositsHeld,
        },

        rentSummary: {
          totalRentCollected,
          pendingRent,
          overdueRent,
          activeAllocations,
        },

        commissions: {
          payouts: {
            received: {
              count: payouts.find((p) => p._id === "completed")?.count || 0,
              amount: payoutReceived,
            },
            pending: {
              count: payouts.find((p) => p._id === "pending")?.count || 0,
              amount: payoutPending,
            },
          },
          owed: {
            paid: {
              count: commissions.find((c) => c._id === "completed")?.count || 0,
              amount: commissionPaid,
            },
            pending: {
              count: commissions.find((c) => c._id === "pending")?.count || 0,
              amount: commissionPending,
            },
            overdue: {
              count: commissions.find((c) => c._id === "overdue")?.count || 0,
              amount: commissionOverdue,
            },
          },
        },

        recentPayouts,
        recentCommissionPayments,
        monthlyBreakdown,

        commissionRate: owner?.commissionSettings?.isCustomRateActive
          ? owner.commissionSettings.customRate * 100
          : 10,

        listingsCount: listings.length,
      },
    });
  } catch (error) {
    console.error("Get settlement summary error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}