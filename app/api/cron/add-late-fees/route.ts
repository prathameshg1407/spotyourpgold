// app/api/cron/add-late-fees/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import TenantAllocation from "@/models/tenantAllocation";
import Notification from "@/models/notification";

// This should be called by a cron service
// Recommended: Run daily after 10th of each month

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret
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

    // Find allocations with pending/overdue rent past due date
    const allocations = await TenantAllocation.find({
      status: { $in: ["active", "notice_period"] },
      "rentHistory.status": { $in: ["pending", "partial"] },
      "rentHistory.dueDate": { $lt: now },
    });

    let feesAdded = 0;
    const notifications: any[] = [];

    for (const allocation of allocations) {
      let updated = false;

      for (const rent of allocation.rentHistory) {
        if (
          (rent.status === "pending" || rent.status === "partial") &&
          new Date(rent.dueDate) < now &&
          rent.lateFee === 0 // Only add if no late fee yet
        ) {
          // Add 5% late fee
          const lateFee = Math.round(rent.amount * 0.05);
          rent.lateFee = lateFee;
          rent.status = "overdue";
          updated = true;
          feesAdded++;

          // Notify tenant
          notifications.push({
            userId: allocation.tenantId,
            type: "rent_overdue",
            title: "Late Fee Added",
            message: `A late fee of ₹${lateFee.toLocaleString("en-IN")} has been added to your overdue rent for ${new Date(rent.month).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}. Total due: ₹${(rent.amount + lateFee - rent.paidAmount).toLocaleString("en-IN")}.`,
            relatedId: allocation._id,
            relatedType: "allocation",
            priority: "high",
          });
        }
      }

      if (updated) {
        await allocation.save();
      }
    }

    // Create notifications
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    return NextResponse.json({
      success: true,
      message: `Added late fees to ${feesAdded} rent entries`,
      feesAdded,
      notificationsSent: notifications.length,
    });
  } catch (error) {
    console.error("Add late fees error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}