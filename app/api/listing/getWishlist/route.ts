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
        "_id pgName primaryLine type genderPreference location roomTypes primaryImage ownerId amenities images isFeatured rentInclusions"
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
      const rents = listing.roomTypes?.map((r: any) => r.monthlyRent).filter((r: number) => r > 0) || [];
      const securities =
        listing.roomTypes?.map((r: any) => r.securityDeposit).filter((s: number) => s > 0) || [];
      const types = listing.roomTypes?.map((r: any) => r.type)
        .filter((type: any) => type && type !== "0" && type !== 0 && String(type).trim() !== "") || [];

      // Calculate minRent and minSecurity
      const minRent = rents.length > 0 ? Math.min(...rents) : 0;
      const minSecurity = securities.length > 0 ? Math.min(...securities) : 0;

      return {
        _id: listing._id.toString(),
        pgName: listing.pgName,
        primaryLine: listing.primaryLine || "",
        type: listing.type || "",
        genderPreference: listing.genderPreference || "both",
        city: listing.location?.city || "Unknown",
        location: {
          area: listing.location?.area || "Unknown",
          city: listing.location?.city || "Unknown",
          state: listing.location?.state || "Unknown",
        },
        primaryImage: listing.primaryImage || listing.images?.[0]?.url || "",
        images: listing.images || [],
        roomTypes: listing.roomTypes || [],
        roomType: types, // Array of room type strings for comparison
        minRent: minRent,
        minSecurity: minSecurity,
        isFeatured: listing.isFeatured || false,
        amenities: listing.amenities || [],
        rentInclusions: listing.rentInclusions || {
          foodIncluded: false,
          electricityIncluded: false,
          maintenanceIncluded: false,
        },
        rating: ratingMap.get(listing._id.toString()) || 0,
        averageRating: ratingMap.get(listing._id.toString()) || 0, // Keep for backward compatibility
        totalReviews: 0, // We can add this later if needed
        ownerId: {
          _id: listing.ownerId?._id?.toString() || "",
          fullName: listing.ownerId?.fullName || "Unknown",
        },
        inWatchList: true,
        isWatchlisted: true, // Keep for backward compatibility
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
