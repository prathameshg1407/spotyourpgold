import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import mongoose from "mongoose";
import Booking from "@/models/booking";
import Listing from "@/models/listing";
import { authUser } from "@/actions/authUser";

export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    const user = await authUser();
    if (!user || (user.role !== "owner" && user.role !== "admin")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "pending";
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const perPage = Math.min(Number(searchParams.get("per_page") || "20"), 50);

    // Get owner's listings
    const ownerListings = await Listing.find({ ownerId: user.id }).select("_id");
    const listingIds = ownerListings.map((listing) => listing._id);

    if (listingIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        totalPages: 0,
        currentPage: page,
      });
    }

    // Build query
    const query: any = { listingId: { $in: listingIds } };
    if (status !== "all") {
      query.status = status;
    }

    const total = await Booking.countDocuments(query);

    // Get bookings
    const bookings = await Booking.find(query)
      .populate("userId", "fullName email phoneNumber")
      .populate("listingId", "pgName location primaryImage")
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    const totalPages = Math.ceil(total / perPage);

    return NextResponse.json({
      success: true,
      data: bookings,
      total,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error("Get owner booking requests error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}