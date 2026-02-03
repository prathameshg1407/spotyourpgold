import { connectToDB } from "@/services/connectdb";
import Listing from "@/models/listing";
import { NextRequest, NextResponse } from "next/server";
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
      return hasLocationSearch ? { distance: 1 as 1 } : { createdAt: -1 as -1 };
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category")?.trim();
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const per_page = Math.min(
      Math.max(1, Number(searchParams.get("per_page") ?? "20")),
      100
    );
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const hasLocation = lat && lng;

    // Advanced filter parameters
    const q = searchParams.get("q")?.trim() || "";
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
    const sortBy = searchParams.get("sortBy")?.trim() || "";

    if (!category) {
      return NextResponse.json({
        success: false,
        message: "Category parameter is required",
        data: [],
        total: 0,
      });
    }

    // Map category IDs to actual property types
    const categoryMapping: Record<string, string> = {
      hostels: "hostels",
      pgs: "pgs",
      rooms: "rooms",
      flats: "flats",
      commercial: "commercial",
    };

    const propertyType = categoryMapping[category];
    if (!propertyType) {
      return NextResponse.json({
        success: false,
        message: "Invalid category",
        data: [],
        total: 0,
      });
    }

    // Build base query with category filter
    const baseQuery: any = {
      $and: [{ isApproved: true }, { isActive: true }, { type: propertyType }],
    };

    // Add advanced filters to the query
    if (q) {
      const searchTerms = q
        .split(/\s+/)
        .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
      const searchRegex = new RegExp(searchTerms.join("|"), "i");

      baseQuery.$and.push({
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
          { "roomTypes.type": { $regex: searchRegex } },
        ],
      });
    }

    if (subType) {
      baseQuery.$and.push({ subType: subType });
    }

    // Price range filter
    if (minPrice !== null || maxPrice !== null) {
      const priceConditions = [];

      const directPriceFilter: any = {};
      if (minPrice !== null) directPriceFilter.$gte = minPrice;
      if (maxPrice !== null) directPriceFilter.$lte = maxPrice;
      if (Object.keys(directPriceFilter).length > 0) {
        priceConditions.push({ monthlyRent: directPriceFilter });
      }

      const roomPriceFilter: any = {};
      if (minPrice !== null) roomPriceFilter.$gte = minPrice;
      if (maxPrice !== null) roomPriceFilter.$lte = maxPrice;
      if (Object.keys(roomPriceFilter).length > 0) {
        priceConditions.push({ "roomTypes.monthlyRent": roomPriceFilter });
      }

      if (priceConditions.length > 0) {
        baseQuery.$and.push({ $or: priceConditions });
      }
    }

    if (genderPreference) {
      if (genderPreference === "unisex") {
        baseQuery.$and.push({ genderPreference: "unisex" });
      } else {
        baseQuery.$and.push({
          $or: [
            { genderPreference: genderPreference },
            { genderPreference: "unisex" },
          ],
        });
      }
    }

    if (amenities.length > 0) {
      baseQuery.$and.push({
        amenities: { $in: amenities },
      });
    }

    if (roomTypes.length > 0) {
      baseQuery.$and.push({
        "roomTypes.type": { $in: roomTypes },
      });
    }

    if (location) {
      baseQuery.$and.push({
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
      baseQuery.$and.push({ "location.city": { $regex: city, $options: "i" } });
    }

    if (area) {
      baseQuery.$and.push({ "location.area": { $regex: area, $options: "i" } });
    }

    if (nearbyPlaces.length > 0) {
      baseQuery.$and.push({
        "location.nearbyPlaces": {
          $in: nearbyPlaces.map((place) => new RegExp(place, "i")),
        },
      });
    }

    const user = await authUser().catch(() => null);
    let userWatchlist: string[] = [];

    if (user) {
      const dbUser = (await User.findById(user.id)
        .select("watchlist")
        .lean()) as { watchlist?: any[] };
      if (dbUser?.watchlist) {
        userWatchlist = dbUser.watchlist.map((id) => id.toString());
      }
    }

    // Build aggregation pipeline
    let aggregationPipeline = [];
    let countPipeline = [];

    if (hasLocation) {
      const userLat = parseFloat(lat!);
      const userLng = parseFloat(lng!);

      aggregationPipeline.push({
        $geoNear: {
          near: {
            type: "Point" as const,
            coordinates: [userLng, userLat] as [number, number],
          },
          distanceField: "distance",
          spherical: true,
          query: baseQuery,
          distanceMultiplier: 0.001,
        },
      });

      countPipeline.push({
        $geoNear: {
          near: {
            type: "Point" as const,
            coordinates: [userLng, userLat] as [number, number],
          },
          distanceField: "distance",
          spherical: true,
          query: baseQuery,
        },
      });
    } else {
      aggregationPipeline.push({ $match: baseQuery });
      countPipeline.push({ $match: baseQuery });
    }

    // Add common pipeline stages
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
        },
      },
      { $sort: getSortObject(sortBy, !!hasLocation) },
      { $skip: (page - 1) * per_page },
      { $limit: per_page }
    );

    countPipeline.push({ $count: "total" });

    const [listings, totalResult] = await Promise.all([
      Listing.aggregate(aggregationPipeline),
      Listing.aggregate(countPipeline),
    ]);

    const total = totalResult[0]?.total || 0;

    // Attach watchlist flag
    const listingsWithWatchlist = listings.map((listing: any) => ({
      ...listing,
      inWatchList: userWatchlist.includes(listing._id.toString()),
    }));

    return NextResponse.json({
      success: true,
      data: listingsWithWatchlist,
      total,
      page,
      per_page,
      totalPages: Math.ceil(total / per_page),
      category,
      sorted_by: hasLocation ? "distance" : "date",
      message: `${propertyType} listings fetched successfully`,
      filters: {
        type: propertyType,
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
        query: q,
        sortBy,
      },
    });
  } catch (err) {
    console.error("[GET_CATEGORY_LISTINGS_ERROR]", err);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch category listings",
      data: [],
      total: 0,
    });
  }
}
