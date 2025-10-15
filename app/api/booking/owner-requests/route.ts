import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import Booking from "@/models/booking";
import Listing from "@/models/listing";
import User from "@/models/user";
import { authUser } from "@/actions/authUser";

// Get booking requests for owner
export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    // Check if user is authenticated
    const user = await authUser();
    if (!user) {
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
    const ownerListings = await Listing.find({ ownerId: user.id }).select(
      "_id"
    );
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

    // Get total count
    const total = await Booking.countDocuments(query);

    // Get bookings with pagination
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
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
