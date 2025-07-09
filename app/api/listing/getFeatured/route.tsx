import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import Listing from "@/models/listing";
import authUser from "@/actions/authUser";
import User from "@/models/user";

export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    const user = await authUser().catch(() => null);
    let watchlistIds: string[] = [];

    if (user) {
      const dbUser = await User.findById(user.id).select("watchlist");
      watchlistIds = dbUser?.watchlist?.map((id: any) => id.toString()) || [];
    }

    let featuredListings = await Listing.find({ isFeatured: true })
      .select("_id primaryImage location pgName ownerId roomTypes")
      .sort({ updatedAt: -1 })
      .limit(10)
      .populate("ownerId", "fullName")
      .lean();

    // Add minRent to each listing
    featuredListings = featuredListings.map((listing: any) => ({
      ...listing,
      minRent: Math.min(
        ...(listing.roomTypes?.map((room: any) => room.monthlyRent) || [Infinity])
      ),
    }));

    // Inject isWatchlisted field
    const listingsWithWatchlist = featuredListings.map((listing: any) => ({
      ...listing,
      isWatchlisted: watchlistIds.includes(listing._id.toString()),
    }));

    return NextResponse.json({
      success: true,
      message: "Featured listings fetched successfully",
      data: listingsWithWatchlist,
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
