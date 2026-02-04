import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import mongoose from "mongoose";
import Commission from "@/models/commission";
import User from "@/models/user";
import Notification from "@/models/notification";
import { authUser } from "@/actions/authUser";
import { sendWhatsAppNotification } from "@/services/sendWhatsAppNotification";

// Get commission ledger for admin
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
    const status = searchParams.get("status") || "all";
    const commissionType = searchParams.get("type") || "all";
    const ownerId = searchParams.get("ownerId");

    // Build query
    const query: any = {};
    if (status !== "all") {
      query.status = status;
    }
    if (commissionType !== "all") {
      query.commissionType = commissionType;
    }
    if (ownerId) {
      query.ownerId = new mongoose.Types.ObjectId(ownerId);
    }

    const total = await Commission.countDocuments(query);

    const commissions = await Commission.find(query)
      .populate("ownerId", "fullName email phone")
      .populate({
        path: "bookingId",
        select: "amount securityDeposit moveInDate fullName phoneNumber email",
        populate: {
          path: "userId",
          select: "fullName email phone",
        },
      })
      .populate("listingId", "pgName")
      .populate("settledBy", "fullName")
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    const totalPages = Math.ceil(total / perPage);

    // Calculate summary by type and status
    const summary = await Commission.aggregate([
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

    // Simplified summary
    const typeSummary = await Commission.aggregate([
      {
        $group: {
          _id: "$commissionType",
          count: { $sum: 1 },
          totalAmount: { $sum: "$commissionAmount" },
          pending: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, "$commissionAmount", 0] },
          },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$commissionAmount", 0] },
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
      summary,
      typeSummary,
    });
  } catch (error) {
    console.error("Get commissions error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Mark monthly rent commission as settled (owner paid to admin)
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

    const { commissionIds, settlementMethod, settlementReference, notes } =
      await req.json();

    if (!commissionIds || commissionIds.length === 0) {
      return NextResponse.json(
        { success: false, message: "Commission ID(s) required" },
        { status: 400 }
      );
    }

    session.startTransaction();

    const commissions = await Commission.find({
      _id: { $in: commissionIds },
      commissionType: "monthly_rent", // Only monthly rent commissions can be settled this way
      status: { $in: ["pending", "overdue"] },
    })
      .populate("ownerId", "fullName email phone")
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
      commission.notes = notes || "";

      await commission.save({ session });

      totalSettled += commission.commissionAmount;

      const ownerId = commission.ownerId._id.toString();
      ownerUpdates[ownerId] =
        (ownerUpdates[ownerId] || 0) + commission.commissionAmount;
    }

    // Update owner settlement summaries
    for (const [ownerId, amount] of Object.entries(ownerUpdates)) {
      await User.findByIdAndUpdate(
        ownerId,
        {
          $inc: {
            "settlementSummary.totalCommissionPaid": amount,
            "settlementSummary.pendingCommissionAmount": -amount,
          },
          $set: {
            "settlementSummary.lastSettlementDate": new Date(),
          },
        },
        { session }
      );
    }

    // Send notifications
    for (const commission of commissions) {
      const owner = commission.ownerId as any;

      // Create notification
      await Notification.create([{
        userId: owner._id,
        type: "payment",
        title: "Commission Settled",
        message: `Your commission of ₹${commission.commissionAmount.toLocaleString("en-IN")} has been marked as settled.`,
        relatedId: commission.bookingId,
        relatedType: "booking",
        priority: "low",
      }], { session });

      // Send WhatsApp (outside session)
      if (owner.phone) {
        try {
          await sendWhatsAppNotification({
            to: owner.phone,
            campaignName: "commission_settlement",
            userName: owner.fullName || "Owner",
            templateParams: [
              owner.fullName || "Owner",
              `₹${commission.commissionAmount.toLocaleString("en-IN")}`,
              settlementMethod || "cash",
              settlementReference || "N/A",
              new Date().toLocaleDateString("en-IN"),
            ],
          });
        } catch (whatsappError) {
          console.error("WhatsApp notification failed:", whatsappError);
        }
      }
    }

    await session.commitTransaction();

    return NextResponse.json({
      success: true,
      message: `${commissions.length} commission(s) marked as settled`,
      data: {
        totalSettled,
        commissionsSettled: commissions.length,
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