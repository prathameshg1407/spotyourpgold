// app/api/cron/rent-reminders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import Booking from "@/models/booking";
import { sendRentReminderEmail } from "@/services/sendRentReminderEmail";

// This API should be called by a cron job service (Vercel Cron, Railway, etc.)
// Recommended: Run daily at 9 AM

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret (optional but recommended)
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
    const remindersProcessed = [];

    for (const booking of activeBookings) {
      const moveInDate = new Date(booking.moveInDate);
      
      // Calculate next rent due date
      let nextDueDate = new Date(moveInDate);
      nextDueDate.setMonth(today.getMonth());
      nextDueDate.setFullYear(today.getFullYear());
      
      if (nextDueDate < today) {
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      }

      const daysRemaining = Math.ceil(
        (nextDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Send reminders for:
      // - 7 days before
      // - 3 days before
      // - 1 day before
      // - On due date
      // - Overdue (1, 3, 7 days)
      const shouldSendReminder = [7, 3, 1, 0, -1, -3, -7].includes(daysRemaining);

      if (shouldSendReminder) {
        const listing = booking.listingId as any;
        const roomType = listing?.roomTypes?.find(
          (r: any) => r.type === booking.roomType
        );

        const result = await sendRentReminderEmail({
          to: booking.email,
          tenantName: booking.fullName,
          pgName: listing?.pgName || "Your PG",
          amount: roomType?.monthlyRent || booking.amount,
          dueDate: nextDueDate.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }),
          daysRemaining,
        });

        remindersProcessed.push({
          bookingId: booking._id,
          email: booking.email,
          daysRemaining,
          sent: result.success,
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