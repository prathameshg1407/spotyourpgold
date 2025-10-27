import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import Booking from "@/models/booking";
import User from "@/models/user";
import Listing from "@/models/listing";
import { authUser } from "@/actions/authUser";

export async function GET(request: NextRequest) {
  try {
    await connectToDB();

    // Verify admin authentication
    const user = await authUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const per_page = parseInt(searchParams.get("per_page") || "20");
    const status = searchParams.get("status") || "all";
    const skip = (page - 1) * per_page;

    // Build query
    const query: any = {};
    if (status !== "all") {
      query.status = status;
    }

    // Get bookings with pagination
    const bookings = await Booking.find(query)
      .populate("userId", "fullName email phoneNumber")
      .populate("listingId", "pgName location primaryImage ownerId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(per_page);

    const total = await Booking.countDocuments(query);
    const totalPages = Math.ceil(total / per_page);

    return NextResponse.json({
      success: true,
      data: bookings,
      total,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching admin booking requests:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch booking requests" },
      { status: 500 }
    );
  }
}

