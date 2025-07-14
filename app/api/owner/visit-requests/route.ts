import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import VisitRequest from "@/models/visitRequest";
import Listing from "@/models/listing";
import authUser from "@/actions/authUser";

// Get visit requests for owner's listings
export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    const user = await authUser();
    if (!user || (user.role !== "owner" && user.role !== "admin")) {
      return NextResponse.json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const isMarked = searchParams.get("isMarked");

    // Get all listings owned by this user
    const ownerListings = await Listing.find({ ownerId: user.id }).select(
      "_id"
    );
    const listingIds = ownerListings.map((listing) => listing._id);

    if (listingIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
        message: "No listings found for this owner",
      });
    }

    // Build filter query
    const filter: any = {
      listingId: { $in: listingIds },
    };

    if (status && status !== "all") {
      filter.status = status;
    }
    if (isMarked !== null && isMarked !== "all") {
      filter.isMarked = isMarked === "true";
    }

    const skip = (page - 1) * limit;

    const visitRequests = await VisitRequest.find(filter)
      .populate("listingId", "pgName location.area location.city")
      .populate("userId", "fullName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await VisitRequest.countDocuments(filter);

    return NextResponse.json({
      success: true,
      data: visitRequests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get owner visit requests error:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch visit requests.",
    });
  }
}
