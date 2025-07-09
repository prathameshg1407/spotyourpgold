import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import authUser from "@/actions/authUser";
import User from "@/models/user";
import Listing from "@/models/listing";
import Review from "@/models/review";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    const user = await authUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const dbUser = (await User.findById(user.id)
      .select("watchlist")
      .lean()) as { watchlist?: any[] } | null;

    const watchlistIds =
      dbUser?.watchlist?.map((id: any) => id.toString()) || [];

    if (!watchlistIds.length) {
      return NextResponse.json({
        success: true,
        message: "Your watchlist is empty",
        data: [],
      });
    }

    const listings = await Listing.find({ _id: { $in: watchlistIds } })
      .select(
        "_id pgName location.city roomTypes primaryImage ownerId amenities"
      )
      .populate("ownerId", "fullName")
      .lean();

    // Fetch average ratings for all listingIds in one go
    const ratings = await Review.aggregate([
      {
        $match: {
          listingId: {
            $in: watchlistIds.map((id) => new mongoose.Types.ObjectId(id)),
          },
        },
      },
      {
        $group: {
          _id: "$listingId",
          avgRating: { $avg: "$rating" },
        },
      },
    ]);

    const ratingMap = new Map<string, number>();
    ratings.forEach((r) => {
      ratingMap.set(r._id.toString(), Math.round(r.avgRating * 10) / 10); // 1 decimal precision
    });

    const formattedListings = listings.map((listing: any) => {
      const rents = listing.roomTypes?.map((r: any) => r.monthlyRent) || [];
      const securities =
        listing.roomTypes?.map((r: any) => r.securityDeposit) || [];
      const types = listing.roomTypes?.map((r: any) => r.type) || [];

      return {
        _id: listing._id.toString(),
        pgName: listing.pgName,
        city: listing.location?.city || "Unknown",
        minRent: rents.length ? Math.min(...rents) : undefined,
        minSecurity: securities.length ? Math.min(...securities) : undefined,
        roomType: types,
        ownerId: {
          _id: listing.ownerId?._id?.toString() || "",
          fullName: listing.ownerId?.fullName || "Unknown",
        },
        amenities: listing.amenities || [],
        rating: ratingMap.get(listing._id.toString()) || 0,
        isWatchlisted: true,
      };
    });

    return NextResponse.json({
      success: true,
      message: "Wishlisted listings fetched successfully",
      data: formattedListings,
    });
  } catch (error) {
    console.error("[GET_USER_WISHLIST]", error);
    return NextResponse.json(
      {
        success: false,
        message: "Server error while fetching wishlist",
        data: [],
      },
      { status: 500 }
    );
  }
}
