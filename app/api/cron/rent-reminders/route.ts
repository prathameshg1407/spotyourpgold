// app/api/cron/rent-reminders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import Booking from "@/models/booking";
import { sendRentReminderEmail } from "@/services/sendRentReminderEmail";
import { sendWhatsAppRentReminder } from "@/services/sendWhatsAppNotification";
import Notification from "@/models/notification";

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

      // Calculate next rent due date based on move-in day
      let nextDueDate = new Date(today);
      nextDueDate.setDate(moveInDate.getDate());

      // If the due date this month has passed, set to next month
      if (nextDueDate < today) {
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
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

        const reminderData = {
          to: booking.email,
          tenantName: booking.fullName,
          pgName: listing?.pgName || "Your PG",
          amount: roomType?.monthlyRent || booking.amount,
          dueDate: nextDueDate.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
          daysRemaining,
        };

        // Send Email
        const emailResult = await sendRentReminderEmail(reminderData);

        // Send WhatsApp
        let whatsappResult = { success: false, message: "Not sent" };
        if (booking.phoneNumber) {
          whatsappResult = await sendWhatsAppRentReminder({
            ...reminderData,
            to: booking.phoneNumber,
          });
        }

        // Create in-app notification
        const notificationType = daysRemaining < 0 ? "payment_reminder" : "payment_reminder";
        const notificationTitle = daysRemaining < 0
          ? `⚠️ Rent Overdue by ${Math.abs(daysRemaining)} days`
          : daysRemaining === 0
          ? `🔔 Rent Due Today`
          : `📅 Rent Due in ${daysRemaining} days`;

        await Notification.create({
          userId: booking.userId,
          type: notificationType,
          title: notificationTitle,
          message: `Your rent of ₹${reminderData.amount.toLocaleString()} for ${reminderData.pgName} is ${
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
            amount: reminderData.amount,
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