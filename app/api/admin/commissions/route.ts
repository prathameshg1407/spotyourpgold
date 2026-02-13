import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import mongoose from "mongoose";
import Commission from "@/models/commission";
import Booking from "@/models/booking";
import MonthlyRentPayment from "@/models/MonthlyRentPayment";
import User from "@/models/user";
import Notification from "@/models/notification";
import { authUser } from "@/actions/authUser";

// GET: Get all commissions (receivables from owners)
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

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const perPage = Math.min(Number(searchParams.get("per_page") || "20"), 50);
    const type = searchParams.get("type") || "all"; // booking_fee_receivable, monthly_rent_commission, all
    const status = searchParams.get("status") || "all";
    const direction = searchParams.get("direction") || "owner_owes_admin"; // Focus on receivables
    const ownerId = searchParams.get("ownerId");

    // Build query
    const query: any = {};

    // By default, show receivables (owner owes admin)
    if (direction !== "all") {
      query.direction = direction;
    }

    if (type !== "all") {
      query.commissionType = type;
    }

    if (status !== "all") {
      query.status = status;
    }

    if (ownerId) {
      query.ownerId = new mongoose.Types.ObjectId(ownerId);
    }

    const total = await Commission.countDocuments(query);

    const commissions = await Commission.find(query)
      .populate("ownerId", "fullName email phone")
      .populate({
        path: "bookingId",
        select: "fullName phoneNumber email monthlyRent paymentMethod",
      })
      .populate("listingId", "pgName")
      .populate("tenantId", "fullName email")
      .populate("settledBy", "fullName")
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    const totalPages = Math.ceil(total / perPage);

    // Summary by type
    const typeSummary = await Commission.aggregate([
      { $match: { direction: "owner_owes_admin" } },
      {
        $group: {
          _id: "$commissionType",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          pending: {
            $sum: {
              $cond: [{ $eq: ["$status", "pending"] }, "$amount", 0],
            },
          },
          overdue: {
            $sum: {
              $cond: [{ $eq: ["$status", "overdue"] }, "$amount", 0],
            },
          },
          completed: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, "$amount", 0],
            },
          },
        },
      },
    ]);

    // Owner-wise pending summary
    const ownerSummary = await Commission.aggregate([
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

    // Overall stats
    const overallStats = await Commission.aggregate([
      { $match: { direction: "owner_owes_admin" } },
      {
        $group: {
          _id: null,
          totalReceivables: { $sum: "$amount" },
          pendingAmount: {
            $sum: {
              $cond: [{ $eq: ["$status", "pending"] }, "$amount", 0],
            },
          },
          overdueAmount: {
            $sum: {
              $cond: [{ $eq: ["$status", "overdue"] }, "$amount", 0],
            },
          },
          collectedAmount: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, "$amount", 0],
            },
          },
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      data: commissions,
      total,
      totalPages,
      currentPage: page,
      typeSummary,
      ownerSummary,
      stats: overallStats[0] || {
        totalReceivables: 0,
        pendingAmount: 0,
        overdueAmount: 0,
        collectedAmount: 0,
      },
    });
  } catch (error) {
    console.error("Get commissions error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH: Mark commission(s) as settled (owner paid to admin)
export async function PATCH(req: NextRequest) {
  const session = await mongoose.startSession();

  try {
    await connectToDB();

    const user = await authUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const {
      commissionIds,
      settlementMethod,
      settlementReference,
      settlementProof,
      notes,
    } = await req.json();

    if (!commissionIds || commissionIds.length === 0) {
      return NextResponse.json(
        { success: false, message: "Commission ID(s) required" },
        { status: 400 }
      );
    }

    session.startTransaction();

    const commissions = await Commission.find({
      _id: { $in: commissionIds },
      direction: "owner_owes_admin",
      status: { $in: ["pending", "overdue"] },
    })
      .populate("ownerId", "fullName email phone")
      .populate("bookingId")
      .session(session);

    if (commissions.length === 0) {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, message: "No pending commissions found" },
        { status: 404 }
      );
    }

    let totalSettled = 0;
    const ownerUpdates: { [key: string]: number } = {};

    for (const commission of commissions) {
      commission.status = "completed";
      commission.settledAt = new Date();
      commission.settledBy = new mongoose.Types.ObjectId(user.id);
      commission.settlementMethod = settlementMethod || "cash";
      commission.settlementReference = settlementReference || "";
      commission.settlementProof = settlementProof || "";
      commission.notes = notes || "";

      await commission.save({ session });

      totalSettled += commission.amount;

      const ownerId = commission.ownerId._id.toString();
      ownerUpdates[ownerId] = (ownerUpdates[ownerId] || 0) + commission.amount;

      // Update booking's commission status if it's a booking fee
      if (commission.commissionType === "booking_fee_receivable" && commission.bookingId) {
        await Booking.findByIdAndUpdate(
          commission.bookingId._id,
          {
            $set: {
              "bookingFee.ownerCommissionStatus": "paid",
              "bookingFee.ownerCommissionPaidAt": new Date(),
              "bookingFee.ownerCommissionMethod": settlementMethod,
              "bookingFee.ownerCommissionReference": settlementReference,
            },
          },
          { session }
        );
      }

      // Update monthly rent payment if it's monthly commission
      if (commission.commissionType === "monthly_rent_commission" && commission.monthlyRentPaymentId) {
        await MonthlyRentPayment.findByIdAndUpdate(
          commission.monthlyRentPaymentId,
          {
            $set: {
              "cashPayment.adminCommissionStatus": "paid",
              "cashPayment.adminCommissionPaidAt": new Date(),
              "cashPayment.adminCommissionMethod": settlementMethod,
              "cashPayment.adminCommissionReference": settlementReference,
            },
          },
          { session }
        );
      }
    }

    // Send notifications to owners
    for (const [ownerId, amount] of Object.entries(ownerUpdates)) {
      await Notification.create(
        [
          {
            userId: ownerId,
            type: "payment",
            title: "Commission Payment Recorded",
            message: `Your commission payment of ₹${amount.toLocaleString("en-IN")} has been recorded. Thank you!`,
            priority: "low",
          },
        ],
        { session }
      );
    }

    await session.commitTransaction();

    return NextResponse.json({
      success: true,
      message: `${commissions.length} commission(s) marked as settled`,
      data: {
        totalSettled,
        commissionsSettled: commissions.length,
        ownerWise: ownerUpdates,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Settle commission error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  } finally {
    session.endSession();
  }
}

// POST: Create commission record manually (rare use case)
export async function POST(req: NextRequest) {
  try {
    await connectToDB();

    const user = await authUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const {
      ownerId,
      bookingId,
      listingId,
      commissionType,
      baseAmount,
      amount,
      dueDate,
      notes,
    } = body;

    if (!ownerId || !listingId || !commissionType || !amount) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Determine direction based on type
    let direction: string;
    let sourcePaymentMethod: string;

    switch (commissionType) {
      case "booking_fee_receivable":
      case "monthly_rent_commission":
        direction = "owner_owes_admin";
        sourcePaymentMethod = "cash";
        break;
      case "first_month_payout":
      case "security_deposit_payout":
      case "monthly_rent_payout":
        direction = "admin_owes_owner";
        sourcePaymentMethod = "online";
        break;
      default:
        direction = "owner_owes_admin";
        sourcePaymentMethod = "cash";
    }

    const commission = await Commission.create({
      ownerId,
      bookingId: bookingId || null,
      listingId,
      commissionType,
      direction,
      sourcePaymentMethod,
      baseAmount: baseAmount || amount,
      commissionRate: 0.1,
      amount,
      status: "pending",
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      notes: notes || "Manually created by admin",
    });

    return NextResponse.json({
      success: true,
      message: "Commission record created",
      data: commission,
    });
  } catch (error) {
    console.error("Create commission error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}