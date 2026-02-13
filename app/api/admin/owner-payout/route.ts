import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import mongoose from "mongoose";
import Booking from "@/models/booking";
import MonthlyRentPayment from "@/models/MonthlyRentPayment";
import Commission from "@/models/commission";
import User from "@/models/user";
import Notification from "@/models/notification";
import { authUser } from "@/actions/authUser";

// GET: Get all pending owner payouts (ONLINE payments only)
export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    const user = await authUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "all"; // all, first_month, monthly, security_deposit
    const status = searchParams.get("status") || "pending";
    const ownerId = searchParams.get("ownerId");

    // ============ FIRST MONTH RENT PAYOUTS (90%) ============
    const firstMonthQuery: any = {
      paymentMethod: "online",
      "firstMonthRent.status": "paid",
      "firstMonthRent.ownerPayoutStatus": status,
    };
    if (ownerId) {
      firstMonthQuery.ownerId = new mongoose.Types.ObjectId(ownerId);
    }

    const pendingFirstMonthPayouts = await Booking.find(firstMonthQuery)
      .populate("ownerId", "fullName email phone bankDetails")
      .populate("listingId", "pgName")
      .populate("userId", "fullName email")
      .sort({ "firstMonthRent.paidAt": 1 });

    // ============ SECURITY DEPOSIT TRANSFERS ============
    const depositQuery: any = {
      paymentMethod: "online",
      "securityDeposit.status": "paid",
      "securityDeposit.transferredToOwner": false,
    };
    if (ownerId) {
      depositQuery.ownerId = new mongoose.Types.ObjectId(ownerId);
    }

    const pendingDepositTransfers = await Booking.find(depositQuery)
      .populate("ownerId", "fullName email phone bankDetails")
      .populate("listingId", "pgName")
      .populate("userId", "fullName email")
      .sort({ "securityDeposit.paidAt": 1 });

    // ============ MONTHLY RENT PAYOUTS (90%) ============
    const monthlyQuery: any = {
      paymentMethod: "online",
      paymentStatus: "paid",
      "onlinePayment.ownerPayoutStatus": status,
    };
    if (ownerId) {
      monthlyQuery.ownerId = new mongoose.Types.ObjectId(ownerId);
    }

    const pendingMonthlyPayouts = await MonthlyRentPayment.find(monthlyQuery)
      .populate("ownerId", "fullName email phone bankDetails")
      .populate("listingId", "pgName")
      .populate("tenantId", "fullName email")
      .sort({ rentMonth: 1 });

    // ============ OWNER-WISE SUMMARY ============
    const ownerWiseSummary = await Booking.aggregate([
      {
        $match: {
          paymentMethod: "online",
          $or: [
            { "firstMonthRent.ownerPayoutStatus": "pending" },
            { "securityDeposit.transferredToOwner": false, "securityDeposit.status": "paid" },
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
          bookingCount: { $sum: 1 },
          bookingIds: { $push: "$_id" },
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
          bankDetails: "$owner.bankDetails",
          firstMonthPending: 1,
          depositPending: 1,
          totalPending: { $add: ["$firstMonthPending", "$depositPending"] },
          bookingCount: 1,
          bookingIds: 1,
        },
      },
      { $sort: { totalPending: -1 } },
    ]);

    // Add monthly rent to owner summary
    const monthlyOwnerSummary = await MonthlyRentPayment.aggregate([
      {
        $match: {
          paymentMethod: "online",
          paymentStatus: "paid",
          "onlinePayment.ownerPayoutStatus": "pending",
        },
      },
      {
        $group: {
          _id: "$ownerId",
          monthlyPending: { $sum: "$onlinePayment.ownerPayoutAmount" },
          monthlyCount: { $sum: 1 },
        },
      },
    ]);

    // Merge monthly data into owner summary
    const monthlyMap = new Map(
      monthlyOwnerSummary.map((m) => [m._id.toString(), m])
    );
    
    for (const owner of ownerWiseSummary) {
      const monthly = monthlyMap.get(owner.ownerId.toString());
      if (monthly) {
        owner.monthlyPending = monthly.monthlyPending;
        owner.monthlyCount = monthly.monthlyCount;
        owner.totalPending += monthly.monthlyPending;
      } else {
        owner.monthlyPending = 0;
        owner.monthlyCount = 0;
      }
    }

    // Calculate totals
    const totalPendingFirstMonth = pendingFirstMonthPayouts.reduce(
      (sum, b) => sum + (b.firstMonthRent.ownerPayoutAmount || 0),
      0
    );
    const totalPendingDeposit = pendingDepositTransfers.reduce(
      (sum, b) => sum + (b.securityDeposit.amount || 0),
      0
    );
    const totalPendingMonthly = pendingMonthlyPayouts.reduce(
      (sum, m) => sum + (m.onlinePayment.ownerPayoutAmount || 0),
      0
    );

    // Get recent completed payouts
    const recentPayouts = await Booking.find({
      "firstMonthRent.ownerPayoutStatus": "completed",
    })
      .populate("ownerId", "fullName")
      .populate("listingId", "pgName")
      .select("firstMonthRent ownerId listingId")
      .sort({ "firstMonthRent.ownerPayoutDate": -1 })
      .limit(20);

    return NextResponse.json({
      success: true,
      data: {
        pendingFirstMonthPayouts,
        pendingDepositTransfers,
        pendingMonthlyPayouts,
        ownerWiseSummary,
        totals: {
          firstMonth: totalPendingFirstMonth,
          deposit: totalPendingDeposit,
          monthly: totalPendingMonthly,
          total: totalPendingFirstMonth + totalPendingDeposit + totalPendingMonthly,
        },
        recentPayouts,
      },
    });
  } catch (error) {
    console.error("Get pending payouts error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Process owner payout (admin pays to owner)
export async function POST(req: NextRequest) {
  const session = await mongoose.startSession();

  try {
    await connectToDB();

    const user = await authUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    const {
      payoutType, // "first_month" | "security_deposit" | "monthly_rent"
      ids, // booking IDs or monthly rent payment IDs
      payoutMethod,
      payoutReference,
      notes,
    } = await req.json();

    if (!payoutType || !ids || ids.length === 0) {
      return NextResponse.json(
        { success: false, message: "Payout type and IDs are required" },
        { status: 400 }
      );
    }

    if (!payoutMethod || !payoutReference) {
      return NextResponse.json(
        { success: false, message: "Payment method and reference are required" },
        { status: 400 }
      );
    }

    session.startTransaction();

    let totalPaidOut = 0;
    let processedCount = 0;
    const ownerUpdates: { [key: string]: number } = {};

    if (payoutType === "first_month") {
      // Process first month rent payouts (90%)
      const bookings = await Booking.find({
        _id: { $in: ids },
        paymentMethod: "online",
        "firstMonthRent.ownerPayoutStatus": "pending",
      })
        .populate("listingId", "pgName")
        .populate("ownerId", "fullName email phone")
        .session(session);

      for (const booking of bookings) {
        booking.firstMonthRent.ownerPayoutStatus = "completed";
        booking.firstMonthRent.ownerPayoutDate = new Date();
        booking.firstMonthRent.ownerPayoutMethod = payoutMethod;
        booking.firstMonthRent.ownerPayoutReference = payoutReference;
        booking.firstMonthRent.ownerPayoutBy = new mongoose.Types.ObjectId(user.id);

        if (notes) {
          booking.adminNotes = `${booking.adminNotes || ""}\n[Payout] ${notes}`.trim();
        }

        await booking.save({ session });

        const amount = booking.firstMonthRent.ownerPayoutAmount;
        totalPaidOut += amount;
        processedCount++;

        const ownerId = booking.ownerId._id.toString();
        ownerUpdates[ownerId] = (ownerUpdates[ownerId] || 0) + amount;

        // Update/create commission record
        await Commission.findOneAndUpdate(
          {
            bookingId: booking._id,
            commissionType: "first_month_payout",
          },
          {
            $set: {
              status: "completed",
              settledAt: new Date(),
              settledBy: user.id,
              settlementMethod: payoutMethod,
              settlementReference: payoutReference,
            },
          },
          { upsert: false, session }
        );
      }
    } else if (payoutType === "security_deposit") {
      // Process security deposit transfers
      const bookings = await Booking.find({
        _id: { $in: ids },
        paymentMethod: "online",
        "securityDeposit.status": "paid",
        "securityDeposit.transferredToOwner": false,
      })
        .populate("listingId", "pgName")
        .populate("ownerId", "fullName email phone")
        .session(session);

      for (const booking of bookings) {
        booking.securityDeposit.transferredToOwner = true;
        booking.securityDeposit.transferredAt = new Date();
        booking.securityDeposit.transferMethod = payoutMethod;
        booking.securityDeposit.transferReference = payoutReference;

        if (notes) {
          booking.adminNotes = `${booking.adminNotes || ""}\n[Deposit Transfer] ${notes}`.trim();
        }

        await booking.save({ session });

        const amount = booking.securityDeposit.amount;
        totalPaidOut += amount;
        processedCount++;

        const ownerId = booking.ownerId._id.toString();
        ownerUpdates[ownerId] = (ownerUpdates[ownerId] || 0) + amount;
      }
    } else if (payoutType === "monthly_rent") {
      // Process monthly rent payouts (90%)
      const payments = await MonthlyRentPayment.find({
        _id: { $in: ids },
        paymentMethod: "online",
        paymentStatus: "paid",
        "onlinePayment.ownerPayoutStatus": "pending",
      })
        .populate("listingId", "pgName")
        .populate("ownerId", "fullName email phone")
        .session(session);

      for (const payment of payments) {
        payment.onlinePayment.ownerPayoutStatus = "completed";
        payment.onlinePayment.ownerPayoutDate = new Date();
        payment.onlinePayment.ownerPayoutMethod = payoutMethod;
        payment.onlinePayment.ownerPayoutReference = payoutReference;
        payment.onlinePayment.ownerPayoutBy = new mongoose.Types.ObjectId(user.id);

        if (notes) {
          payment.adminNotes = `${payment.adminNotes || ""}\n[Payout] ${notes}`.trim();
        }

        await payment.save({ session });

        const amount = payment.onlinePayment.ownerPayoutAmount;
        totalPaidOut += amount;
        processedCount++;

        const ownerId = payment.ownerId._id.toString();
        ownerUpdates[ownerId] = (ownerUpdates[ownerId] || 0) + amount;

        // Update commission record if exists
        if (payment.commissionId) {
          await Commission.findByIdAndUpdate(
            payment.commissionId,
            {
              $set: {
                status: "completed",
                settledAt: new Date(),
                settledBy: user.id,
                settlementMethod: payoutMethod,
                settlementReference: payoutReference,
              },
            },
            { session }
          );
        }
      }
    }

    if (processedCount === 0) {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, message: "No eligible payouts found" },
        { status: 404 }
      );
    }

    // Send notifications to owners
    for (const [ownerId, amount] of Object.entries(ownerUpdates)) {
      await Notification.create(
        [
          {
            userId: ownerId,
            type: "payment",
            title: "Payout Received",
            message: `You have received a payout of ₹${amount.toLocaleString("en-IN")} via ${payoutMethod.replace("_", " ")}. Reference: ${payoutReference}`,
            priority: "high",
          },
        ],
        { session }
      );
    }

    await session.commitTransaction();

    return NextResponse.json({
      success: true,
      message: `Payout processed for ${processedCount} item(s)`,
      data: {
        payoutType,
        totalPaidOut,
        processedCount,
        payoutMethod,
        payoutReference,
        ownerWise: ownerUpdates,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Process payout error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  } finally {
    session.endSession();
  }
}