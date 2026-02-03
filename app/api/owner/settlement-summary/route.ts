// app/api/owner/settlement-summary/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import Commission from "@/models/commission";
import Booking from "@/models/booking";
import TenantAllocation from "@/models/tenantAllocation";
import Listing from "@/models/listing";
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

    // Get all owner's listings
    const listings = await Listing.find({ ownerId: user.id }).select("_id pgName");
    const listingIds = listings.map((l) => l._id);

    // Get all confirmed bookings for owner's listings
    const confirmedBookings = await Booking.find({
      listingId: { $in: listingIds },
      status: "confirmed",
      paymentStatus: "completed_cash",
    });

    // Get all allocations for rent tracking
    const allocations = await TenantAllocation.find({
      listingId: { $in: listingIds },
      status: { $in: ["active", "notice_period"] },
    });

    // Calculate total rent collected (from rentHistory)
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

    // Calculate security deposits collected
    const securityDeposits = confirmedBookings.reduce(
      (acc, booking) => acc + (booking.securityDeposit || 0),
      0
    );

    // First month rents
    const firstMonthRents = confirmedBookings.reduce(
      (acc, booking) => acc + (booking.amount || 0),
      0
    );

    // Get commission summary
    const commissionSummary = await Commission.aggregate([
      { $match: { ownerId: user.id } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$commissionAmount" },
          totalBookingAmount: { $sum: "$bookingAmount" },
        },
      },
    ]);

    const pendingCommission = commissionSummary.find((s) => s._id === "pending");
    const settledCommission = commissionSummary.find((s) => s._id === "settled");
    const overdueCommission = commissionSummary.find((s) => s._id === "overdue");

    // Calculate totals
    const totalEarnings = firstMonthRents + totalRentCollected + securityDeposits;
    const totalCommissionPaid = settledCommission?.totalAmount || 0;
    const totalCommissionOwed =
      (pendingCommission?.totalAmount || 0) + (overdueCommission?.totalAmount || 0);
    const netPayout = totalEarnings - totalCommissionPaid - totalCommissionOwed;

    // Get recent transactions (last 10 commission settlements)
    const recentSettlements = await Commission.find({
      ownerId: user.id,
      status: "settled",
    })
      .populate({
        path: "bookingId",
        select: "fullName roomType listingId",
        populate: {
          path: "listingId",
          select: "pgName",
        },
      })
      .sort({ settledAt: -1 })
      .limit(10);

    // Monthly breakdown (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyBreakdown = await Commission.aggregate([
      {
        $match: {
          ownerId: user.id,
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalCommission: { $sum: "$commissionAmount" },
          totalBookingAmount: { $sum: "$bookingAmount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
    ]);

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalEarnings,
          totalCommissionPaid,
          totalCommissionOwed,
          netPayout,
          securityDepositsHeld: securityDeposits,
        },
        rentSummary: {
          totalRentCollected,
          pendingRent,
          overdueRent,
          activeAllocations: allocations.length,
        },
        commissions: {
          pending: {
            count: pendingCommission?.count || 0,
            amount: pendingCommission?.totalAmount || 0,
          },
          settled: {
            count: settledCommission?.count || 0,
            amount: settledCommission?.totalAmount || 0,
          },
          overdue: {
            count: overdueCommission?.count || 0,
            amount: overdueCommission?.totalAmount || 0,
          },
        },
        recentSettlements,
        monthlyBreakdown,
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