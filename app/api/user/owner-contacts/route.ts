// app/api/user/owner-contacts/route.ts
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

    // Get user's confirmed bookings with owner details
    const bookings = await Booking.find({
      userId: new mongoose.Types.ObjectId(userId),
      status: { $in: ["confirmed", "pending"] },
    }).populate({
      path: "listingId",
      select: "pgName location ownerId",
      populate: {
        path: "ownerId",
        select: "fullName email phone",
      },
    });

    // Extract unique owner contacts
    const contactsMap = new Map();

    bookings.forEach((booking) => {
      const listing = booking.listingId as any;
      if (listing && listing.ownerId) {
        const key = listing._id.toString();
        if (!contactsMap.has(key)) {
          contactsMap.set(key, {
            listingId: listing._id,
            pgName: listing.pgName,
            ownerName: listing.ownerId.fullName,
            ownerPhone: listing.ownerId.phone,
            ownerEmail: listing.ownerId.email,
            location: `${listing.location.area}, ${listing.location.city}`,
          });
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: Array.from(contactsMap.values()),
    });
  } catch (error) {
    console.error("Get owner contacts error:", error);
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