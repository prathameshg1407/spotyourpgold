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
        ? { distance: 1 as 1 } // sort by closest first
        : { createdAt: -1 as -1 };
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
      Math.min(Number(searchParams.get("per_page") ?? 20), 100)
    );

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
    const location = searchParams.get("location")?.trim() || "";
    const city = searchParams.get("city")?.trim() || "";
    const area = searchParams.get("area")?.trim() || "";
    const nearbyPlaces =
      searchParams.get("nearbyPlaces")?.split(",").filter(Boolean) || [];
    const visible =
      searchParams.get("visible")?.split(",").filter(Boolean) || [];
    const sortBy = searchParams.get("sortBy")?.trim() || "";
    const categories =
      searchParams.get("categories")?.split(",").filter(Boolean) || [];
    const countByCategory = searchParams.get("countByCategory") === "true";

    // Location-based search (lat/lng for proximity)
    const lat = searchParams.get("lat")
      ? Number(searchParams.get("lat"))
      : null;
    const lng = searchParams.get("lng")
      ? Number(searchParams.get("lng"))
      : null;
    const radius = searchParams.get("radius")
      ? Number(searchParams.get("radius"))
      : 10; // Default 10km radius

    // Extract keywords from "near" queries
    const processSearchQuery = (query: string) => {
      const keywords = query
        .toLowerCase()
        .replace(/\b(near|close to|around|beside|next to)\b/g, "")
        .split(/\s+/)
        .filter((word) => word.length > 1)
        .join("|");

      return keywords || query;
    };

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

    // Build query object
    const query: any = {
      $and: [{ isActive: true }, { isApproved: true }],
    };

    // Check if any search criteria is provided
    const hasSearchCriteria =
      q ||
      type ||
      subType ||
      minPrice !== null ||
      maxPrice !== null ||
      genderPreference ||
      amenities.length > 0 ||
      roomTypes.length > 0 ||
      location ||
      city ||
      area ||
      nearbyPlaces.length > 0 ||
      visible.length > 0 ||
      categories.length > 0 ||
      (lat !== null && lng !== null);

    // If no search criteria, we still want to return all approved and active listings
    // This ensures "View All" functionality works

    // Enhanced text search across ALL fields for ultra-fast comprehensive results
    if (q) {
      const searchTerms = q
        .split(/\s+/)
        .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
      const searchRegex = new RegExp(searchTerms.join("|"), "i");

      query.$and.push({
        $or: [
          // Basic info fields (highest priority)
          { pgName: { $regex: searchRegex } },
          { type: { $regex: searchRegex } },
          { subType: { $regex: searchRegex } },
          { genderPreference: { $regex: searchRegex } },

          // Location fields (high priority)
          { "location.area": { $regex: searchRegex } },
          { "location.city": { $regex: searchRegex } },
          { "location.state": { $regex: searchRegex } },
          { "location.pincode": { $regex: searchRegex } },
          { "location.nearbyPlaces": { $elemMatch: { $regex: searchRegex } } },

          // Amenities and features
          { amenities: { $elemMatch: { $regex: searchRegex } } },
          { additionalDetails: { $elemMatch: { $regex: searchRegex } } },
          { rulesAndRegulations: { $elemMatch: { $regex: searchRegex } } },

          // Room types
          { "roomTypes.type": { $regex: searchRegex } },

          // Enhanced rules and policies
          { "detailedRules.lockInPeriod": { $regex: searchRegex } },
          { "detailedRules.noticePeriod": { $regex: searchRegex } },
          { "detailedRules.maintenanceCharges": { $regex: searchRegex } },
          { "detailedRules.entryTiming": { $regex: searchRegex } },
          { "detailedRules.exitTiming": { $regex: searchRegex } },
          { "detailedRules.guestStayPolicy": { $regex: searchRegex } },
          { "detailedRules.smokingAlcoholPolicy": { $regex: searchRegex } },

          // Plan and payment fields
          { planType: { $regex: searchRegex } },
          { paymentStatus: { $regex: searchRegex } },

          // Rent inclusions
          {
            "rentInclusions.foodIncluded":
              q.toLowerCase().includes("food") ||
              q.toLowerCase().includes("meal"),
          },
          {
            "rentInclusions.electricityIncluded":
              q.toLowerCase().includes("electricity") ||
              q.toLowerCase().includes("power"),
          },
          {
            "rentInclusions.maintenanceIncluded": q
              .toLowerCase()
              .includes("maintenance"),
          },
        ],
      });
    }

    // Property type filters
    if (type) {
      query.$and.push({ type: type });
    }

    if (subType) {
      query.$and.push({ subType: subType });
    }

    // Price range filter (check roomTypes.monthlyRent)
    if (minPrice !== null || maxPrice !== null) {
      const roomPriceFilter: any = {};
      if (minPrice !== null) roomPriceFilter.$gte = minPrice;
      if (maxPrice !== null) roomPriceFilter.$lte = maxPrice;

      if (Object.keys(roomPriceFilter).length > 0) {
        // Filter properties where ALL room types meet the price criteria
        // This ensures that properties with mixed price ranges are properly filtered
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
      if (genderPreference === "both" || genderPreference === "unisex") {
        query.$and.push({ genderPreference: "both" });
      } else {
        // For specific gender preferences (male/female), only show properties with that exact preference
        // This gives users more precise control over their search
        query.$and.push({ genderPreference: genderPreference });
      }
    }

    // Amenities filter
    if (amenities.length > 0) {
      query.$and.push({
        amenities: { $in: amenities },
      });
    }

    // Room types filter
    if (roomTypes.length > 0) {
      query.$and.push({
        "roomTypes.type": { $in: roomTypes },
      });
    }

    // Category filter
    if (categories.length > 0) {
      query.$and.push({
        type: { $in: categories },
      });
    }

    // Location filters
    if (location) {
      query.$and.push({
        $or: [
          { "location.area": { $regex: location, $options: "i" } },
          { "location.city": { $regex: location, $options: "i" } },
          { "location.state": { $regex: location, $options: "i" } },
          {
            "location.nearbyPlaces": {
              $elemMatch: { $regex: location, $options: "i" },
            },
          },
        ],
      });
    }

    if (city) {
      query.$and.push({ "location.city": { $regex: city, $options: "i" } });
    }

    if (area) {
      query.$and.push({ "location.area": { $regex: area, $options: "i" } });
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

      if (visible.includes("approved")) {
        visibleConditions.push({ isApproved: true });
      }
      if (visible.includes("pending")) {
        visibleConditions.push({ isApproved: false });
      }
      if (visible.includes("active")) {
        visibleConditions.push({ isActive: true });
      }
      if (visible.includes("inactive")) {
        visibleConditions.push({ isActive: false });
      }
      if (visible.includes("featured")) {
        visibleConditions.push({ isFeatured: true });
      }
      if (visible.includes("non-featured")) {
        visibleConditions.push({ isFeatured: false });
      }
      if (visible.includes("free")) {
        visibleConditions.push({ planType: "free" });
      }
      if (visible.includes("paid")) {
        visibleConditions.push({ planType: "paid" });
      }
      if (visible.includes("subscription")) {
        visibleConditions.push({ planType: "subscription" });
      }
      if (visible.includes("payment-pending")) {
        visibleConditions.push({ paymentStatus: "pending" });
      }
      if (visible.includes("payment-completed")) {
        visibleConditions.push({ paymentStatus: "completed" });
      }
      if (visible.includes("payment-failed")) {
        visibleConditions.push({ paymentStatus: "failed" });
      }

      if (visibleConditions.length > 0) {
        // Remove the default isActive and isApproved filters if visible filters are applied
        query.$and = query.$and.filter(
          (condition: any) =>
            !condition.hasOwnProperty("isActive") &&
            !condition.hasOwnProperty("isApproved")
        );

        // Add the OR condition for visible filters
        query.$and.push({ $or: visibleConditions });
      }
    }

    // Geospatial query for proximity search
    if (lat !== null && lng !== null) {
      // Use $geoNear in aggregation pipeline instead of $near in query
      // This will be handled in the aggregation pipeline
    }

    // Execute query with aggregation to get min rent from roomTypes
    let aggregationPipeline = [];

    // Add $geoNear stage if location search is active
    if (lat !== null && lng !== null) {
      aggregationPipeline.push({
        $geoNear: {
          near: {
            type: "Point" as const,
            coordinates: [lng, lat] as [number, number],
          },
          distanceField: "distance",
          spherical: true,
          query: query,
          maxDistance: radius * 1000,
          distanceMultiplier: 0.001, // Convert meters to kilometers
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
              else: "$monthlyRent", // Fallback to direct monthlyRent field
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
        },
      },
      { $sort: getSortObject(sortBy, lat !== null && lng !== null) },
      { $skip: (page - 1) * per_page },
      { $limit: per_page }
    );

    // Build count pipeline
    let countPipeline = [];
    if (lat !== null && lng !== null) {
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

    // If countByCategory is requested, get category counts
    let categoryCounts = {};
    if (countByCategory) {
      const categoryCountPipeline =
        lat !== null && lng !== null
          ? [
              {
                $geoNear: {
                  near: {
                    type: "Point" as const,
                    coordinates: [lng, lat] as [number, number],
                  },
                  distanceField: "distance",
                  spherical: true,
                  query: { isActive: true, isApproved: true },
                  maxDistance: radius * 1000, // Convert km to meters
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
              { $match: { isActive: true, isApproved: true } },
              {
                $group: {
                  _id: "$type",
                  count: { $sum: 1 },
                },
              },
            ];

      const categoryCountResult = await Listing.aggregate(
        categoryCountPipeline
      );
      categoryCounts = categoryCountResult.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {});
    }

    const [listings, totalResult] = await Promise.all([
      Listing.aggregate(aggregationPipeline),
      Listing.aggregate(countPipeline),
    ]);

    const total = totalResult[0]?.total || 0;

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
        type,
        subType,
        minPrice,
        maxPrice,
        genderPreference,
        amenities,
        roomTypes,
        location,
        city,
        area,
        nearbyPlaces,
        categories,
        query: q,
        sortBy,
        ...(lat !== null && lng !== null && { radius: `${radius}km` }),
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
