// app/api/cron/mark-overdue-commissions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import Commission from "@/models/commission";
import User from "@/models/user";
import Notification from "@/models/notification";

// This should be called by a cron service (e.g., Vercel Cron, Railway, etc.)
// Recommended: Run daily at midnight

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret (optional but recommended)
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectToDB();

    const now = new Date();

    // Find all pending commissions that are past due date
    const overdueCommissions = await Commission.find({
      status: "pending",
      commissionType: "monthly_rent", // Only monthly rent can be overdue
      dueDate: { $lt: now },
    });

    if (overdueCommissions.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No overdue commissions found",
        count: 0,
      });
    }

    // Group by owner for notifications
    const ownerCommissions: { [key: string]: typeof overdueCommissions } = {};

    for (const commission of overdueCommissions) {
      const ownerId = commission.ownerId.toString();
      if (!ownerCommissions[ownerId]) {
        ownerCommissions[ownerId] = [];
      }
      ownerCommissions[ownerId].push(commission);
    }

    // Update commissions to overdue
    await Commission.updateMany(
      {
        _id: { $in: overdueCommissions.map((c) => c._id) },
      },
      {
        $set: { status: "overdue" },
      }
    );

    // Send notifications to owners
    const notifications = [];

    for (const [ownerId, commissions] of Object.entries(ownerCommissions)) {
      const totalAmount = commissions.reduce(
        (sum, c) => sum + c.commissionAmount,
        0
      );

      notifications.push({
        userId: ownerId,
        type: "payment_reminder",
        title: "Commission Overdue",
        message: `You have ${commissions.length} overdue commission payment(s) totaling ₹${totalAmount.toLocaleString("en-IN")}. Please settle immediately.`,
        priority: "high",
        metadata: {
          overdueCount: commissions.length,
          totalAmount,
        },
      });
    }

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    // Also notify admins
    const admins = await User.find({ role: "admin" }).select("_id");
    const adminNotifications = admins.map((admin) => ({
      userId: admin._id,
      type: "general",
      title: "Overdue Commissions Alert",
      message: `${overdueCommissions.length} commission(s) from ${Object.keys(ownerCommissions).length} owner(s) are now overdue.`,
      priority: "high",
    }));

    if (adminNotifications.length > 0) {
      await Notification.insertMany(adminNotifications);
    }

    return NextResponse.json({
      success: true,
      message: `Marked ${overdueCommissions.length} commissions as overdue`,
      count: overdueCommissions.length,
      ownersAffected: Object.keys(ownerCommissions).length,
    });
  } catch (error) {
    console.error("Mark overdue commissions error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Also support POST for flexibility
export async function POST(req: NextRequest) {
  return GET(req);
}