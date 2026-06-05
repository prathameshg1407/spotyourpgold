// app/api/cron/rent-reminders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import Booking from "@/models/booking";
import { sendRentReminderEmail } from "@/services/sendRentReminderEmail";
import { sendRentReminderToTenant } from "@/services/sendWhatsAppNotification";
import Notification from "@/models/notification";

/**
 * GET - Core logic execution for rent reminders
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectToDB();

    // Find all confirmed bookings with completed payments
    const activeBookings = await Booking.find({
      status: "confirmed",
      paymentStatus: "completed_cash",
    }).populate({
      path: "listingId",
      select: "pgName roomTypes",
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const remindersProcessed = [];

    for (const booking of activeBookings) {
      const moveInDate = new Date(booking.moveInDate);
      const targetDate = moveInDate.getDate();

      // Calculate next rent due date based on move-in day
      let nextDueDate = new Date(today.getFullYear(), today.getMonth(), targetDate);

      // Fix for months with fewer days (e.g., Move-in 31st, current month is Feb)
      // Caps the date to the last day of the current month
      if (nextDueDate.getMonth() !== today.getMonth()) {
        nextDueDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      }

      // If the due date this month has passed, set to next month
      if (nextDueDate < today) {
        nextDueDate = new Date(today.getFullYear(), today.getMonth() + 1, targetDate);
        // Cap again for the next month just in case
        if (nextDueDate.getMonth() !== (today.getMonth() + 1) % 12) {
          nextDueDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
        }
      }

      const daysRemaining = Math.ceil(
        (nextDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Send reminders for specific days
      const shouldSendReminder = [7, 3, 1, 0, -1, -3, -7].includes(daysRemaining);

      if (shouldSendReminder) {
        const listing = booking.listingId as any;
        const roomType = listing?.roomTypes?.find(
          (r: any) => r.type === booking.roomType
        );

        const amountToPay = roomType?.monthlyRent || booking.amount;
        const pgNameStr = listing?.pgName || "Your PG";

        // 1. Prepare Email Data
        const reminderData = {
          to: booking.email,
          tenantName: booking.fullName,
          pgName: pgNameStr,
          amount: amountToPay,
          dueDate: nextDueDate.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
          daysRemaining,
        };

        // Send Email
        const emailResult = await sendRentReminderEmail(reminderData);

        // 2. Prepare and Send WhatsApp (✅ FIXED PARAMETER NAMES)
        let whatsappResult = { success: false, message: "Not sent" };
        if (booking.phoneNumber) {
          whatsappResult = await sendRentReminderToTenant({
            tenantPhone: booking.phoneNumber,
            tenantName: booking.fullName,
            tenantId: booking.userId,
            pgName: pgNameStr,
            amount: amountToPay,
            dueDate: nextDueDate, // WhatsApp service formats this inside the function
            daysRemaining: daysRemaining,
          });
        }

        // 3. Create in-app notification
        const notificationType = "payment_reminder";
        const notificationTitle = daysRemaining < 0
          ? `⚠️ Rent Overdue by ${Math.abs(daysRemaining)} days`
          : daysRemaining === 0
          ? `🔔 Rent Due Today`
          : `📅 Rent Due in ${daysRemaining} days`;

        await Notification.create({
          userId: booking.userId,
          type: notificationType,
          title: notificationTitle,
          message: `Your rent of ₹${amountToPay.toLocaleString()} for ${pgNameStr} is ${
            daysRemaining < 0
              ? `overdue by ${Math.abs(daysRemaining)} days`
              : daysRemaining === 0
              ? "due today"
              : `due on ${reminderData.dueDate}`
          }. Please make the payment to avoid any inconvenience.`,
          relatedId: booking._id,
          relatedType: "booking",
          priority: daysRemaining <= 0 ? "high" : daysRemaining <= 3 ? "medium" : "low",
          metadata: {
            amount: amountToPay,
            dueDate: nextDueDate,
            daysRemaining,
          },
        });

        remindersProcessed.push({
          bookingId: booking._id,
          email: booking.email,
          phone: booking.phoneNumber,
          daysRemaining,
          emailSent: emailResult.success,
          whatsappSent: whatsappResult.success,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${remindersProcessed.length} reminders`,
      data: remindersProcessed,
    });
  } catch (error) {
    console.error("Rent reminder cron error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to process reminders",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST Handler Fallback
 * Catches incoming default POST calls from cron-job.org and targets the validation logic smoothly.
 */
export async function POST(req: NextRequest) {
  return GET(req);
}