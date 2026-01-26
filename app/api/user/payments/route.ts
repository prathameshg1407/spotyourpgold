// app/api/user/payments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import mongoose from "mongoose";
import Booking from "@/models/booking";

export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    // Get all bookings for user with listing details
    const bookings = await Booking.find({
      userId: new mongoose.Types.ObjectId(userId),
    })
      .populate({
        path: "listingId",
        select: "pgName location images roomTypes ownerId",
      })
      .sort({ createdAt: -1 });

    // Calculate next rent due date for active/confirmed bookings
    let rentDueInfo = null;
    const activeBooking = bookings.find(
      (b) => b.status === "confirmed" && b.paymentStatus === "completed_cash"
    );

    if (activeBooking) {
      const moveInDate = new Date(activeBooking.moveInDate);
      const today = new Date();
      
      // Calculate next rent due date (same day of month as move-in date)
      let nextDueDate = new Date(moveInDate);
      nextDueDate.setMonth(today.getMonth());
      nextDueDate.setFullYear(today.getFullYear());
      
      // If the due date has passed this month, move to next month
      if (nextDueDate < today) {
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      }

      const daysRemaining = Math.ceil(
        (nextDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Get room rent amount
      const listing = activeBooking.listingId as any;
      const roomType = listing?.roomTypes?.find(
        (r: any) => r.type === activeBooking.roomType
      );

      rentDueInfo = {
        nextDueDate: nextDueDate.toISOString(),
        daysRemaining,
        amount: roomType?.monthlyRent || activeBooking.amount,
        isOverdue: daysRemaining < 0,
        bookingId: activeBooking._id,
      };
    }

    return NextResponse.json({
      success: true,
      data: bookings,
      rentDueInfo,
    });
  } catch (error) {
    console.error("Get payment history error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}