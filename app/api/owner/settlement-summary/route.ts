import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import Commission from "@/models/commission";
import Booking from "@/models/booking";
import TenantAllocation from "@/models/tenantAllocation";
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

    // ============ FIRST MONTH PAYOUTS (90% admin owes to owner) ============
    const firstMonthPayouts = await Commission.aggregate([
      {
        $match: {
          ownerId: new (require("mongoose").Types.ObjectId)(user.id),
          commissionType: "first_month_owner",
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$commissionAmount" },
        },
      },
    ]);

    const payoutReceived = firstMonthPayouts.find(p => p._id === "completed")?.totalAmount || 0;
    const payoutPending = firstMonthPayouts.find(p => p._id === "pending")?.totalAmount || 0;

    // ============ MONTHLY RENT COMMISSIONS (10% owner owes to admin) ============
    const monthlyCommissions = await Commission.aggregate([
      {
        $match: {
          ownerId: new (require("mongoose").Types.ObjectId)(user.id),
          commissionType: "monthly_rent",
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$commissionAmount" },
        },
      },
    ]);

    const commissionPaid = monthlyCommissions.find(c => c._id === "completed")?.totalAmount || 0;
    const commissionPending = monthlyCommissions.find(c => c._id === "pending")?.totalAmount || 0;
    const commissionOverdue = monthlyCommissions.find(c => c._id === "overdue")?.totalAmount || 0;

    // ============ RENT COLLECTION SUMMARY ============
    const allocations = await TenantAllocation.find({
      listingId: { $in: listingIds },
      status: { $in: ["active", "notice_period"] },
    });

    let totalRentCollected = 0;
    let pendingRent = 0;
    let overdueRent = 0;

    allocations.forEach((allocation: any) => {
      allocation.rentHistory.forEach((rent: any) => {
        if (rent.status === "paid") {
          totalRentCollected += rent.paidAmount;
        } else if (rent.status === "pending") {
          pendingRent += rent.amount;
        } else if (rent.status === "overdue") {
          overdueRent += rent.amount + (rent.lateFee || 0);
        }
      });
    });

    // ============ BOOKING SUMMARY ============
    const confirmedBookings = await Booking.find({
      ownerId: user.id,
      paymentStatus: "completed_cash",
    });

    const firstMonthRents = confirmedBookings.reduce(
      (acc, booking) => acc + (booking.amount || 0),
      0
    );
    const securityDeposits = confirmedBookings.reduce(
      (acc, booking) => acc + (booking.securityDeposit || 0),
      0
    );

    // ============ RECENT TRANSACTIONS ============
    const recentPayouts = await Commission.find({
      ownerId: user.id,
      commissionType: "first_month_owner",
      status: "completed",
    })
      .populate({
        path: "bookingId",
        select: "fullName roomType listingId",
        populate: { path: "listingId", select: "pgName" },
      })
      .sort({ settledAt: -1 })
      .limit(10);

    const recentCommissionPayments = await Commission.find({
      ownerId: user.id,
      commissionType: "monthly_rent",
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
          ownerId: new (require("mongoose").Types.ObjectId)(user.id),
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            type: "$commissionType",
          },
          totalAmount: { $sum: "$commissionAmount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
    ]);

    // ============ NET POSITION ============
    // Positive = Admin owes owner more than owner owes admin
    const netPosition = payoutPending - (commissionPending + commissionOverdue);

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          // What admin owes to owner (90% from first payments)
          payoutReceived,
          payoutPending,
          
          // What owner owes to admin (10% from monthly rent)
          commissionPaid,
          commissionPending: commissionPending + commissionOverdue,
          
          // Net position
          netPosition,
          netPositionLabel: netPosition >= 0 ? "Admin owes you" : "You owe Admin",
          
          // Other earnings
          securityDepositsHeld: securityDeposits,
        },
        
        rentSummary: {
          totalRentCollected,
          pendingRent,
          overdueRent,
          activeAllocations: allocations.length,
        },
        
        commissions: {
          // Payouts from admin (90%)
          payouts: {
            received: { count: firstMonthPayouts.find(p => p._id === "completed")?.count || 0, amount: payoutReceived },
            pending: { count: firstMonthPayouts.find(p => p._id === "pending")?.count || 0, amount: payoutPending },
          },
          // Commissions to admin (10%)
          owed: {
            paid: { count: monthlyCommissions.find(c => c._id === "completed")?.count || 0, amount: commissionPaid },
            pending: { count: monthlyCommissions.find(c => c._id === "pending")?.count || 0, amount: commissionPending },
            overdue: { count: monthlyCommissions.find(c => c._id === "overdue")?.count || 0, amount: commissionOverdue },
          },
        },
        
        recentPayouts,
        recentCommissionPayments,
        monthlyBreakdown,
        
        commissionRate: owner?.commissionSettings?.isCustomRateActive
          ? owner.commissionSettings.customRate * 100
          : 10, // Default 10%
        
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