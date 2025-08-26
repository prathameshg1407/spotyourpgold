import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import Listing from "@/models/listing";
import authUser from "@/actions/authUser";
import User from "@/models/user";

export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const per_page = Math.max(
      1,
      Math.min(Number(searchParams.get("per_page") ?? 10), 50)
    );
    const exclude = searchParams.get("exclude");

    const user = await authUser().catch(() => null);
    let watchlistIds: string[] = [];

    if (user) {
      const dbUser = await User.findById(user.id).select("watchlist");
      watchlistIds = dbUser?.watchlist?.map((id: any) => id.toString()) || [];
    }

    // Build query
    const query: any = {
      isActive: true,
      isApproved: true,
      isFeatured: true, // Only show listings that are marked as featured
    };

    if (exclude) {
      query._id = { $ne: exclude };
    }

    let featuredListings = await Listing.find(query)
      .select(
        "_id primaryImage location pgName ownerId roomTypes images genderPreference isFeatured"
      )
      .sort({ updatedAt: -1, createdAt: -1 })
      .skip((page - 1) * per_page)
      .limit(per_page)
      .populate("ownerId", "fullName")
      .lean();

    // Add minRent to each listing
    featuredListings = featuredListings.map((listing: any) => ({
      ...listing,
      minRent: Math.min(
        ...(listing.roomTypes?.map((room: any) => room.monthlyRent) || [
          Infinity,
        ])
      ),
    }));

    // Inject isWatchlisted field
    const listingsWithWatchlist = featuredListings.map((listing: any) => ({
      ...listing,
      isWatchlisted: watchlistIds.includes(listing._id.toString()),
    }));

    return NextResponse.json({
      success: true,
      message:
        listingsWithWatchlist.length > 0
          ? "Featured listings fetched successfully"
          : "No featured listings found",
      data: listingsWithWatchlist,
      total: listingsWithWatchlist.length,
    });
  } catch (error) {
    console.error("[getFeatured_API]", error);
    return NextResponse.json(
      {
        success: false,
        message: "Server error while fetching featured listings",
      },
      { status: 500 }
    );
  }
}
