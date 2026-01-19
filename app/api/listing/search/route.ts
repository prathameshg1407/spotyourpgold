// app/api/listing/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import Listing from "@/models/listing";
import authUser from "@/actions/authUser";
import User from "@/models/user";
    // Helper function for sort
    function getSortObject(sortBy: string, hasLocationSearch: boolean = false): Record<string, 1 | -1> {
      switch (sortBy) {
        case "price-low-high":
          return { minRent: 1 as 1 };
        case "price-high-low":
          return { minRent: -1 as -1 };
        case "rating-high-low":
          return { rating: -1 as -1, createdAt: -1 as -1 };
        case "rating-low-high":
          return { rating: 1 as 1, createdAt: -1 as -1 };
        default:
          return hasLocationSearch ? { distance: 1 as 1 } : { createdAt: -1 as -1 };
      }
    }

export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    const searchParams = req.nextUrl.searchParams;
    const lat = parseFloat(searchParams.get("lat") || "0");
    const lng = parseFloat(searchParams.get("lng") || "0");
    const radius = parseFloat(searchParams.get("radius") || "10"); // km
    const page = parseInt(searchParams.get("page") || "1");
    const per_page = parseInt(searchParams.get("per_page") || "12");
    const categories = searchParams.get("categories")?.split(",").filter(Boolean) || [];
    const countByCategory = searchParams.get("countByCategory") === "true";
    const query = searchParams.get("q") || "";
    const sortBy = searchParams.get("sortBy")?.trim() || "";

    // Get user watchlist
    const user = await authUser().catch(() => null);
    let userWatchlist: string[] = [];
    if (user) {
      const dbUser = (await User.findById(user.id)
        .select("watchlist")
        .lean()) as { watchlist?: string[] } | null;
      if (dbUser?.watchlist) {
        userWatchlist = dbUser.watchlist.map((id) => id.toString());
      }
    }


    // Build base match query - ONLY LISTED PGs
    const baseMatchQuery: any = {
      isActive: true,
      isApproved: true,
      type: { $ne: null, $exists: true },
    };

    // Add category filter
    if (categories.length > 0) {
      baseMatchQuery.type = { $in: categories };
    }

    // Add text search if query provided
    if (query) {
      const searchRegex = new RegExp(
        query
          .split(/\s+/)
          .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
          .join("|"),
        "i"
      );

      baseMatchQuery.$or = [
        { pgName: { $regex: searchRegex } },
        { type: { $regex: searchRegex } },
        { subType: { $regex: searchRegex } },
        { "location.area": { $regex: searchRegex } },
        { "location.city": { $regex: searchRegex } },
        { "location.state": { $regex: searchRegex } },
        { amenities: { $elemMatch: { $regex: searchRegex } } },
      ];
    }

    // Get category counts if requested (BEFORE returning)
    if (countByCategory) {
      let categoryCountPipeline: any[] = [];

      if (lat && lng) {
        categoryCountPipeline = [
          {
            $geoNear: {
              near: {
                type: "Point" as const,
                coordinates: [lng, lat] as [number, number],
              },
              distanceField: "distance",
              spherical: true,
              query: {
                isActive: true,
                isApproved: true,
                type: { $ne: null, $exists: true },
              },
              maxDistance: radius * 1000, // km to meters
            },
          },
          {
            $group: {
              _id: "$type",
              count: { $sum: 1 },
            },
          },
        ];
      } else {
        categoryCountPipeline = [
          {
            $match: {
              isActive: true,
              isApproved: true,
              type: { $ne: null, $exists: true },
            },
          },
          {
            $group: {
              _id: "$type",
              count: { $sum: 1 },
            },
          },
        ];
      }

      const categoryCountResult = await Listing.aggregate(categoryCountPipeline);
      const counts = categoryCountResult.reduce((acc, item) => {
        if (item._id && item._id !== null && item._id !== "") {
          acc[item._id] = item.count;
        }
        return acc;
      }, {} as Record<string, number>);

      return NextResponse.json({
        success: true,
        categoryCounts: counts,
      });
    }

    // Build main aggregation pipeline
    let aggregationPipeline: any[] = [];

    // MUST use $geoNear as FIRST stage when doing geospatial search
    if (lat && lng) {
      aggregationPipeline.push({
        $geoNear: {
          near: {
            type: "Point" as const,
            coordinates: [lng, lat] as [number, number],
          },
          distanceField: "distance",
          spherical: true,
          query: baseMatchQuery,
          maxDistance: radius * 1000, // Convert km to meters
          distanceMultiplier: 0.001, // Convert result back to km
        },
      });
    } else {
      aggregationPipeline.push({ $match: baseMatchQuery });
    }

    // Calculate minRent from roomTypes
    aggregationPipeline.push({
      $addFields: {
        minRent: {
          $cond: {
            if: {
              $and: [
                { $ne: ["$roomTypes", null] },
                { $isArray: "$roomTypes" },
                { $gt: [{ $size: { $ifNull: ["$roomTypes", []] } }, 0] },
              ],
            },
            then: { $min: "$roomTypes.monthlyRent" },
            else: 0,
          },
        },
      },
    });

    // Lookup owner information
    aggregationPipeline.push(
      {
        $lookup: {
          from: "users",
          localField: "ownerId",
          foreignField: "_id",
          as: "ownerInfo",
        },
      },
      {
        $addFields: {
          ownerName: { $arrayElemAt: ["$ownerInfo.fullName", 0] },
        },
      }
    );

    // Project only needed fields
    aggregationPipeline.push({
      $project: {
        _id: 1,
        pgName: 1,
        type: 1,
        subType: 1,
        genderPreference: 1,
        location: 1,
        primaryImage: 1,
        images: 1,
        roomTypes: 1,
        amenities: 1,
        rentInclusions: 1,
        mealTimings: 1,
        minRent: 1,
        ownerName: 1,
        distance: 1,
        isFeatured: 1,
        createdAt: 1,
        rating: 1,
      },
    });

    // Sort results
    aggregationPipeline.push({
      $sort: getSortObject(sortBy, lat !== 0 && lng !== 0),
    });

    // Create count pipeline (clone before adding pagination)
    const countPipeline = [...aggregationPipeline, { $count: "total" }];

    // Add pagination to main pipeline
    aggregationPipeline.push(
      { $skip: (page - 1) * per_page },
      { $limit: per_page }
    );

    // Execute both pipelines in parallel
    const [listings, totalResult] = await Promise.all([
      Listing.aggregate(aggregationPipeline),
      Listing.aggregate(countPipeline),
    ]);

    const total = totalResult[0]?.total || 0;

    // Add watchlist information to each listing
    const listingsWithWatchlist = listings.map((listing: any) => ({
      ...listing,
      inWatchList: userWatchlist.includes(listing._id.toString()),
      isWishlisted: userWatchlist.includes(listing._id.toString()),
    }));

    return NextResponse.json({
      success: true,
      data: listingsWithWatchlist,
      total,
      page,
      per_page,
      totalPages: Math.ceil(total / per_page),
      filters: {
        query,
        categories,
        sortBy,
        ...(lat && lng && {
          radius: `${radius}km`,
          location: { lat, lng },
        }),
      },
    });
  } catch (error) {
    console.error("Location search error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Search failed",
        error: String(error),
      },
      { status: 500 }
    );
  }
}