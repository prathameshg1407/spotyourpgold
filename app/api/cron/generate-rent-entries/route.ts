// app/api/cron/generate-rent-entries/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import TenantAllocation from "@/models/tenantAllocation";
import Notification from "@/models/notification";

export async function GET(req: NextRequest) {
  try {
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
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const dueDate = new Date(now.getFullYear(), now.getMonth(), 5);

    const activeAllocations = await TenantAllocation.find({
      status: { $in: ["active", "notice_period"] },
    }).populate("listingId", "ownerId");

    let entriesCreated = 0;
    const notifications: any[] = [];

    for (const allocation of activeAllocations) {
      const existingEntry = allocation.rentHistory.find((rent: any) => {
        const rentMonth = new Date(rent.month);
        return (
          rentMonth.getMonth() === currentMonth.getMonth() &&
          rentMonth.getFullYear() === currentMonth.getFullYear()
        );
      });

      if (existingEntry) {
        continue;
      }

      // ✅ Use the existing method instead of manual push
      allocation.addRentEntry(currentMonth, allocation.monthlyRent, dueDate);

      await allocation.save();
      entriesCreated++;

      notifications.push({
        userId: allocation.tenantId,
        type: "rent_reminder",
        title: "Monthly Rent Due",
        message: `Your rent of ₹${allocation.monthlyRent.toLocaleString("en-IN")} for ${currentMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" })} is due by ${dueDate.toLocaleDateString("en-IN")}.`,
        relatedId: allocation._id,
        relatedType: "allocation",
        priority: "high",
      });
    }

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${entriesCreated} rent entries for ${currentMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}`,
      entriesCreated,
      notificationsSent: notifications.length,
    });
  } catch (error) {
    console.error("Generate rent entries error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}