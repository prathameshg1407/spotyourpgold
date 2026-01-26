// app/api/user/move-in/route.ts
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

    // Get confirmed/active bookings with full listing details
    const bookings = await Booking.find({
      userId: new mongoose.Types.ObjectId(userId),
      status: { $in: ["confirmed", "pending"] },
    })
      .populate({
        path: "listingId",
        select: `
          pgName location genderPreference amenities 
          rulesAndRegulations detailedRules mealTimings 
          rentInclusions ownerId images
        `,
        populate: {
          path: "ownerId",
          select: "fullName email phone",
        },
      })
      .sort({ moveInDate: -1 });

    return NextResponse.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error("Get move-in details error:", error);
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