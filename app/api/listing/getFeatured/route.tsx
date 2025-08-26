import { NextRequest, NextResponse } from "next/server";
import { withDatabaseConnection } from "@/services/withTimeout";
import Listing from "@/models/listing";
import authUser from "@/actions/authUser";
import User from "@/models/user";

export async function GET(req: NextRequest) {
  return withDatabaseConnection(async () => {
    try {
      const { searchParams } = new URL(req.url);
      const page = Math.max(1, Number(searchParams.get("page") ?? 1));
      const per_page = Math.max(
        1,
        Math.min(Number(searchParams.get("per_page") ?? 10), 20) // Reduced max
      );
      const exclude = searchParams.get("exclude");

      // ✅ Parallel execution for user auth and listings
      const [user, featuredListings] = await Promise.all([
        authUser().catch(() => null),
        fetchFeaturedListingsOptimized(page, per_page, exclude),
      ]);

      let watchlistIds: string[] = [];

      // ✅ Only fetch watchlist if user exists
      if (user) {
        try {
          const dbUser = (await User.findById(user.id)
            .select("watchlist")
            .lean()
            .maxTimeMS(2000)) as { watchlist?: any[] } | null; // 2s timeout for user query
          watchlistIds =
            dbUser?.watchlist?.map((id: any) => id.toString()) || [];
        } catch (error: any) {
          console.warn("Failed to fetch user watchlist:", error?.message);
          // Continue without watchlist data
        }
      }

      // ✅ Inject watchlist status efficiently
      const listingsWithWatchlist = featuredListings.map((listing: any) => ({
        ...listing,
        inWatchList: watchlistIds.includes(listing._id.toString()),
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
    } catch (error: any) {
      console.error("[getFeatured_API]", error);

      // ✅ Specific error handling for timeouts
      if (
        error?.message?.includes("timed out") ||
        error?.message?.includes("timeout")
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Request timeout - please try again",
            data: [],
          },
          { status: 408 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: "Server error while fetching featured listings",
          data: [],
        },
        { status: 500 }
      );
    }
  });
}

// ✅ Optimized featured listings query
async function fetchFeaturedListingsOptimized(
  page: number,
  per_page: number,
  exclude?: string | null
) {
  const query: any = {
    isActive: true,
    isApproved: true,
    isFeatured: true,
  };

  if (exclude) {
    query._id = { $ne: exclude };
  }

  // ✅ Single aggregation pipeline for better performance
  const pipeline = [
    { $match: query },
    {
      $lookup: {
        from: "users",
        localField: "ownerId",
        foreignField: "_id",
        as: "owner",
        pipeline: [{ $project: { fullName: 1 } }], // Only get fullName
      },
    },
    {
      $addFields: {
        minRent: {
          $cond: {
            if: { $gt: [{ $size: "$roomTypes" }, 0] },
            then: { $min: "$roomTypes.monthlyRent" },
            else: 0,
          },
        },
        "ownerId.fullName": { $arrayElemAt: ["$owner.fullName", 0] },
      },
    },
    {
      $project: {
        _id: 1,
        primaryImage: 1,
        "location.area": 1,
        pgName: 1,
        "ownerId.fullName": 1,
        genderPreference: 1,
        minRent: 1,
        updatedAt: 1,
      },
    },
    { $sort: { updatedAt: -1 as -1, _id: -1 as -1 } }, // Added _id for consistent sorting
    { $skip: (page - 1) * per_page },
    { $limit: per_page },
  ];

  return await Listing.aggregate(pipeline).option({
    maxTimeMS: 6000, // 6s timeout for aggregation
  });
}
