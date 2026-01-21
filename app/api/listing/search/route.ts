import { connectToDB } from "@/services/connectdb";
import Listing from "@/models/listing";
import { NextResponse } from "next/server";
import authUser from "@/actions/authUser";
import User from "@/models/user";

// Helper function to get sort object based on sortBy parameter
function getSortObject(
  sortBy: string,
  hasLocationSearch: boolean = false
): Record<string, 1 | -1> {
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
      return hasLocationSearch
        ? { distance: 1 as 1 }
        : { isFeatured: -1 as -1, createdAt: -1 as -1 };
  }
}

export async function GET(req: Request) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);

    // Basic search parameters
    const q = searchParams.get("q")?.trim() || "";
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const per_page = Math.max(
      1,
      Math.min(Number(searchParams.get("per_page") ?? 12), 100)
    );

    // Geospatial parameters (PRIORITY)
    const lat = searchParams.get("lat")
      ? Number(searchParams.get("lat"))
      : null;
    const lng = searchParams.get("lng")
      ? Number(searchParams.get("lng"))
      : null;
    const radius = searchParams.get("radius")
      ? Number(searchParams.get("radius"))
      : 10;

    // Location parameters (from dropdown selection)
    const city = searchParams.get("city")?.trim() || "";
    const area = searchParams.get("area")?.trim() || "";
    const state = searchParams.get("state")?.trim() || "";

    // Advanced filter parameters
    const type = searchParams.get("type")?.trim() || "";
    const subType = searchParams.get("subType")?.trim() || "";
    const minPrice = searchParams.get("minPrice")
      ? Number(searchParams.get("minPrice"))
      : null;
    const maxPrice = searchParams.get("maxPrice")
      ? Number(searchParams.get("maxPrice"))
      : null;
    const genderPreference = searchParams.get("genderPreference")?.trim() || "";
    const amenities =
      searchParams.get("amenities")?.split(",").filter(Boolean) || [];
    const roomTypes =
      searchParams.get("roomTypes")?.split(",").filter(Boolean) || [];
    const nearbyPlaces =
      searchParams.get("nearbyPlaces")?.split(",").filter(Boolean) || [];
    const visible =
      searchParams.get("visible")?.split(",").filter(Boolean) || [];
    const sortBy = searchParams.get("sortBy")?.trim() || "";
    const categories =
      searchParams.get("categories")?.split(",").filter(Boolean) || [];
    const countByCategory = searchParams.get("countByCategory") === "true";

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

    // Build base query
    const query: any = {
      $and: [
        { isActive: true },
        { isApproved: true },
        { type: { $ne: null, $exists: true } },
      ],
    };

    // IMPORTANT: Determine if this is a geospatial search
    const isGeospatialSearch = lat !== null && lng !== null;

    // If NOT geospatial search, apply location text filters
    if (!isGeospatialSearch && (city || area || state)) {
      const locationConditions: any[] = [];

      if (city) {
        locationConditions.push({
          "location.city": { $regex: new RegExp(`^${city}$`, "i") },
        });
      }

      if (area) {
        locationConditions.push({
          "location.area": { $regex: new RegExp(`^${area}$`, "i") },
        });
      }

      if (state) {
        locationConditions.push({
          "location.state": { $regex: new RegExp(`^${state}$`, "i") },
        });
      }

      if (locationConditions.length > 0) {
        query.$and.push({ $or: locationConditions });
      }
    }

    // Text search (only if NOT geospatial or if explicitly searching)
    if (q && !isGeospatialSearch) {
      const searchTerms = q
        .split(/\s+/)
        .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
      const searchRegex = new RegExp(searchTerms.join("|"), "i");

      query.$and.push({
        $or: [
          { pgName: { $regex: searchRegex } },
          { type: { $regex: searchRegex } },
          { subType: { $regex: searchRegex } },
          { genderPreference: { $regex: searchRegex } },
          { "location.area": { $regex: searchRegex } },
          { "location.city": { $regex: searchRegex } },
          { "location.state": { $regex: searchRegex } },
          { "location.pincode": { $regex: searchRegex } },
          { "location.nearbyPlaces": { $elemMatch: { $regex: searchRegex } } },
          { amenities: { $elemMatch: { $regex: searchRegex } } },
          { additionalDetails: { $elemMatch: { $regex: searchRegex } } },
          { rulesAndRegulations: { $elemMatch: { $regex: searchRegex } } },
          { "roomTypes.type": { $regex: searchRegex } },
        ],
      });
    }

    // Property type filters
    if (type) query.$and.push({ type });
    if (subType) query.$and.push({ subType });

    // Price range filter
    if (minPrice !== null || maxPrice !== null) {
      const roomPriceFilter: any = {};
      if (minPrice !== null) roomPriceFilter.$gte = minPrice;
      if (maxPrice !== null) roomPriceFilter.$lte = maxPrice;

      if (Object.keys(roomPriceFilter).length > 0) {
        query.$and.push({
          $expr: {
            $allElementsTrue: {
              $map: {
                input: "$roomTypes",
                as: "room",
                in: {
                  $and: [
                    ...(minPrice !== null
                      ? [{ $gte: ["$$room.monthlyRent", minPrice] }]
                      : []),
                    ...(maxPrice !== null
                      ? [{ $lte: ["$$room.monthlyRent", maxPrice] }]
                      : []),
                  ],
                },
              },
            },
          },
        });
      }
    }

    // Gender preference filter
    if (genderPreference) {
      query.$and.push({ genderPreference });
    }

    // Amenities filter
    if (amenities.length > 0) {
      query.$and.push({ amenities: { $in: amenities } });
    }

    // Room types filter
    if (roomTypes.length > 0) {
      query.$and.push({ "roomTypes.type": { $in: roomTypes } });
    }

    // Category filter
    if (categories.length > 0) {
      query.$and.push({ type: { $in: categories } });
    }

    // Nearby places filter
    if (nearbyPlaces.length > 0) {
      query.$and.push({
        "location.nearbyPlaces": {
          $in: nearbyPlaces.map((place) => new RegExp(place, "i")),
        },
      });
    }

    // Visible/Status filters
    if (visible.length > 0) {
      const visibleConditions = [];

      if (visible.includes("approved")) visibleConditions.push({ isApproved: true });
      if (visible.includes("pending")) visibleConditions.push({ isApproved: false });
      if (visible.includes("active")) visibleConditions.push({ isActive: true });
      if (visible.includes("inactive")) visibleConditions.push({ isActive: false });
      if (visible.includes("featured")) visibleConditions.push({ isFeatured: true });
      if (visible.includes("non-featured")) visibleConditions.push({ isFeatured: false });
      if (visible.includes("free")) visibleConditions.push({ planType: "free" });
      if (visible.includes("paid")) visibleConditions.push({ planType: "paid" });
      if (visible.includes("subscription")) visibleConditions.push({ planType: "subscription" });

      if (visibleConditions.length > 0) {
        query.$and = query.$and.filter(
          (condition: any) =>
            !condition.hasOwnProperty("isActive") &&
            !condition.hasOwnProperty("isApproved")
        );
        query.$and.push({ $or: visibleConditions });
      }
    }

    // Build aggregation pipeline
    let aggregationPipeline = [];

    // Add $geoNear stage if geospatial search is active (HIGHEST PRIORITY)
    if (isGeospatialSearch) {
      aggregationPipeline.push({
        $geoNear: {
          near: {
            type: "Point" as const,
            coordinates: [lng, lat] as [number, number],
          },
          distanceField: "distance",
          spherical: true,
          query: query,
          maxDistance: radius * 1000, // Convert km to meters
          distanceMultiplier: 0.001, // Convert meters to km
        },
      });
    } else {
      aggregationPipeline.push({ $match: query });
    }

    aggregationPipeline.push(
      {
        $addFields: {
          minRent: {
            $cond: {
              if: { $gt: [{ $size: "$roomTypes" }, 0] },
              then: { $min: "$roomTypes.monthlyRent" },
              else: "$monthlyRent",
            },
          },
        },
      },
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
          "ownerId.fullName": { $arrayElemAt: ["$ownerInfo.fullName", 0] },
        },
      },
      {
        $project: {
          _id: 1,
          slug: 1,
          primaryImage: 1,
          images: 1,
          location: 1,
          pgName: 1,
          primaryLine: 1,
          "ownerId.fullName": 1,
          minRent: 1,
          type: 1,
          subType: 1,
          genderPreference: 1,
          amenities: 1,
          rentInclusions: 1,
          mealTimings: 1,
          roomTypes: 1,
          createdAt: 1,
          rating: 1,
          distance: 1,
          isFeatured: 1,
        },
      },
      { $sort: getSortObject(sortBy, isGeospatialSearch) },
      { $skip: (page - 1) * per_page },
      { $limit: per_page }
    );

    // Count pipeline
    let countPipeline = [];
    if (isGeospatialSearch) {
      countPipeline = [
        {
          $geoNear: {
            near: {
              type: "Point" as const,
              coordinates: [lng, lat] as [number, number],
            },
            distanceField: "distance",
            spherical: true,
            query: query,
            maxDistance: radius * 1000,
          },
        },
        { $count: "total" },
      ];
    } else {
      countPipeline = [{ $match: query }, { $count: "total" }];
    }

    // Category counts (if requested)
    let categoryCounts = {};
    if (countByCategory) {
      const categoryCountPipeline = isGeospatialSearch
        ? [
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
                maxDistance: radius * 1000,
              },
            },
            {
              $group: {
                _id: "$type",
                count: { $sum: 1 },
              },
            },
          ]
        : [
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

      const categoryCountResult = await Listing.aggregate(categoryCountPipeline);
      categoryCounts = categoryCountResult.reduce((acc, item) => {
        if (item._id && item._id !== null && item._id !== "") {
          acc[item._id] = item.count;
        }
        return acc;
      }, {});
    }

    // Execute queries
    const [listings, totalResult] = await Promise.all([
      Listing.aggregate(aggregationPipeline),
      Listing.aggregate(countPipeline),
    ]);

    const total = totalResult[0]?.total || 0;

    // Add watchlist info
    const listingsWithWatchlist = listings.map((listing: any) => ({
      ...listing,
      inWatchList: userWatchlist.includes(listing._id.toString()),
    }));

    const response: any = {
      success: true,
      data: listingsWithWatchlist,
      total,
      page,
      per_page,
      totalPages: Math.ceil(total / per_page),
      filters: {
        ...(isGeospatialSearch && {
          lat,
          lng,
          radius: `${radius}km`,
          searchType: "geospatial",
        }),
        ...(!isGeospatialSearch && { city, area, state }),
        type,
        subType,
        minPrice,
        maxPrice,
        genderPreference,
        amenities,
        roomTypes,
        nearbyPlaces,
        categories,
        query: q,
        sortBy,
      },
    };

    if (countByCategory) {
      response.categoryCounts = categoryCounts;
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Search API Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to search listings",
        error: error.message,
      },
      { status: 500 }
    );
  }
}