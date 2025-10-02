import { connectToDB } from "@/services/connectdb";
import Listing from "@/models/listing";
import { NextResponse } from "next/server";
import indoreLocations from "@/data/indore-locations.json";

export async function GET(req: Request) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";
    const limit = Math.min(Number(searchParams.get("limit") || 8), 20);

    if (!q || q.length < 2) {
      return NextResponse.json({
        success: true,
        data: { properties: [], locations: [] },
      });
    }

    // Create comprehensive search regex for all fields
    const searchRegex = new RegExp(
      q
        .split(/\s+/)
        .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("|"),
      "i"
    );

    // Ultra-fast aggregation pipeline for comprehensive search
    const searchPipeline = [
      {
        $match: {
          isActive: true,
          isApproved: true,
          $or: [
            // Basic info fields
            { pgName: { $regex: searchRegex } },
            { type: { $regex: searchRegex } },
            { subType: { $regex: searchRegex } },
            { genderPreference: { $regex: searchRegex } },

            // Location fields
            { "location.area": { $regex: searchRegex } },
            { "location.city": { $regex: searchRegex } },
            { "location.state": { $regex: searchRegex } },
            { "location.pincode": { $regex: searchRegex } },
            {
              $and: [
                { "location.nearbyPlaces": { $type: "array" } },
                {
                  "location.nearbyPlaces": {
                    $elemMatch: { $regex: searchRegex },
                  },
                },
              ],
            },

            // Amenities and details with array safety
            {
              $and: [
                { amenities: { $type: "array" } },
                { amenities: { $elemMatch: { $regex: searchRegex } } },
              ],
            },
            {
              $and: [
                { additionalDetails: { $type: "array" } },
                { additionalDetails: { $elemMatch: { $regex: searchRegex } } },
              ],
            },
            {
              $and: [
                { rulesAndRegulations: { $type: "array" } },
                {
                  rulesAndRegulations: { $elemMatch: { $regex: searchRegex } },
                },
              ],
            },

            // Room types
            { "roomTypes.type": { $regex: searchRegex } },

            // Enhanced rules
            { "detailedRules.lockInPeriod": { $regex: searchRegex } },
            { "detailedRules.noticePeriod": { $regex: searchRegex } },
            { "detailedRules.maintenanceCharges": { $regex: searchRegex } },
            { "detailedRules.entryTiming": { $regex: searchRegex } },
            { "detailedRules.exitTiming": { $regex: searchRegex } },
            { "detailedRules.guestStayPolicy": { $regex: searchRegex } },
            { "detailedRules.smokingAlcoholPolicy": { $regex: searchRegex } },

            // Plan and payment
            { planType: { $regex: searchRegex } },
            { paymentStatus: { $regex: searchRegex } },
          ],
        },
      },
      {
        $addFields: {
          // Calculate relevance score based on field matches
          relevanceScore: {
            $add: [
              {
                $cond: [
                  { $regexMatch: { input: "$pgName", regex: searchRegex } },
                  10,
                  0,
                ],
              },
              {
                $cond: [
                  {
                    $regexMatch: {
                      input: "$location.area",
                      regex: searchRegex,
                    },
                  },
                  8,
                  0,
                ],
              },
              {
                $cond: [
                  {
                    $regexMatch: {
                      input: "$location.city",
                      regex: searchRegex,
                    },
                  },
                  8,
                  0,
                ],
              },
              {
                $cond: [
                  { $regexMatch: { input: "$type", regex: searchRegex } },
                  6,
                  0,
                ],
              },
              {
                $cond: [
                  {
                    $regexMatch: {
                      input: "$genderPreference",
                      regex: searchRegex,
                    },
                  },
                  4,
                  0,
                ],
              },
              {
                $cond: [
                  {
                    $and: [
                      { $ne: ["$amenities", null] },
                      { $isArray: "$amenities" },
                      {
                        $gt: [
                          {
                            $size: {
                              $filter: {
                                input: { $ifNull: ["$amenities", []] },
                                cond: {
                                  $regexMatch: {
                                    input: "$$this",
                                    regex: searchRegex,
                                  },
                                },
                              },
                            },
                          },
                          0,
                        ],
                      },
                    ],
                  },
                  3,
                  0,
                ],
              },
              {
                $cond: [
                  {
                    $and: [
                      { $ne: ["$location.nearbyPlaces", null] },
                      { $isArray: "$location.nearbyPlaces" },
                      {
                        $gt: [
                          {
                            $size: {
                              $filter: {
                                input: {
                                  $ifNull: ["$location.nearbyPlaces", []],
                                },
                                cond: {
                                  $regexMatch: {
                                    input: "$$this",
                                    regex: searchRegex,
                                  },
                                },
                              },
                            },
                          },
                          0,
                        ],
                      },
                    ],
                  },
                  2,
                  0,
                ],
              },
            ],
          },
          // Calculate minimum rent from roomTypes
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
      },
      {
        $lookup: {
          from: "users",
          localField: "ownerId",
          foreignField: "_id",
          as: "owner",
          pipeline: [{ $project: { fullName: 1 } }],
        },
      },
      {
        $addFields: {
          ownerName: { $arrayElemAt: ["$owner.fullName", 0] },
        },
      },
      {
        $project: {
          _id: 1,
          pgName: 1,
          type: 1,
          subType: 1,
          genderPreference: 1,
          location: 1,
          primaryImage: 1,
          minRent: 1,
          amenities: 1,
          roomTypes: 1,
          ownerName: 1,
          relevanceScore: 1,
          isFeatured: 1,
          createdAt: 1,
        },
      },
      {
        $sort: {
          relevanceScore: -1 as -1,
          isFeatured: -1 as -1,
          createdAt: -1 as -1,
        },
      },
      { $limit: limit },
    ];

    // Execute search pipeline
    const properties = await Listing.aggregate(searchPipeline);

    // Fast location aggregation for unique suggestions
    const locationPipeline = [
      {
        $match: {
          isActive: true,
          isApproved: true,
          $or: [
            { "location.city": { $regex: searchRegex } },
            { "location.area": { $regex: searchRegex } },
            { "location.state": { $regex: searchRegex } },
            {
              $and: [
                { "location.nearbyPlaces": { $type: "array" } },
                {
                  "location.nearbyPlaces": {
                    $elemMatch: { $regex: searchRegex },
                  },
                },
              ],
            },
          ],
        },
      },
      {
        $project: {
          cities: ["$location.city"],
          areas: ["$location.area"],
          states: ["$location.state"],
          nearbyPlaces: "$location.nearbyPlaces",
        },
      },
      {
        $group: {
          _id: null,
          allCities: { $addToSet: "$cities" },
          allAreas: { $addToSet: "$areas" },
          allStates: { $addToSet: "$states" },
          allNearbyPlaces: { $addToSet: "$nearbyPlaces" },
        },
      },
    ];

    const [locationResults] = await Listing.aggregate(locationPipeline);

    // Process and filter locations
    let locations: any[] = [];

    // First, search Indore locations for fast results
    const indoreMatches = indoreLocations
      .filter((location) => {
        const nameMatch = searchRegex.test(location.name);
        const aliasMatch = location.aliases.some((alias) =>
          searchRegex.test(alias)
        );
        return nameMatch || aliasMatch;
      })
      .slice(0, 5)
      .map((location) => ({
        name: location.name,
        type: "indore",
        displayText: location.displayName,
        category: "Indore Locations",
        lat: location.lat,
        lng: location.lng,
      }));

    if (locationResults) {
      const { allCities, allAreas, allStates, allNearbyPlaces } =
        locationResults;

      // Process cities
      const cities = allCities
        .flat()
        .filter((city: string) => city && searchRegex.test(city))
        .slice(0, 3)
        .map((city: string) => ({
          name: city,
          type: "city",
          displayText: city,
          category: "Cities",
        }));

      // Process areas
      const areas = allAreas
        .flat()
        .filter((area: string) => area && searchRegex.test(area))
        .slice(0, 3)
        .map((area: string) => ({
          name: area,
          type: "area",
          displayText: area,
          category: "Areas",
        }));

      // Process nearby places
      const nearbyPlaces = allNearbyPlaces
        .flat()
        .flat()
        .filter((place: string) => place && searchRegex.test(place))
        .slice(0, 2)
        .map((place: string) => ({
          name: place,
          type: "nearby",
          displayText: place,
          category: "Nearby Places",
        }));

      locations = [...indoreMatches, ...cities, ...areas, ...nearbyPlaces];
    } else {
      locations = indoreMatches;
    }

    // Format properties for response
    const formattedProperties = properties.map((property) => ({
      ...property,
      propertyType: "property",
    }));

    return NextResponse.json({
      success: true,
      data: {
        properties: formattedProperties,
        locations,
        query: q,
        total: formattedProperties.length + locations.length,
      },
      performance: {
        searchFields: [
          "pgName",
          "type",
          "subType",
          "genderPreference",
          "location",
          "amenities",
          "roomTypes",
          "rules",
          "nearbyPlaces",
        ],
        optimized: true,
      },
    });
  } catch (error: any) {
    console.error("Ultra-fast search API Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Search failed",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
