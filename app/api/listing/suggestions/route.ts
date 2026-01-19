// app/api/listing/suggestions/route.ts
import { connectToDB } from "@/services/connectdb";
import Listing from "@/models/listing";
import { NextResponse } from "next/server";

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
          type: { $ne: null, $exists: true }, // Exclude null types
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

    // Execute search pipeline for properties
    const propertiesPromise = Listing.aggregate(searchPipeline);

    // Fetch location suggestions dynamically from Nominatim
    const locationsPromise = fetchLocationSuggestions(q);

    // Execute both in parallel
    const [properties, locations] = await Promise.all([
      propertiesPromise,
      locationsPromise,
    ]);

    // Format properties for response
    const formattedProperties = properties.map((property) => ({
      ...property,
      propertyType: "property",
    }));

    return NextResponse.json({
      success: true,
      data: {
        properties: formattedProperties,
        locations: locations.slice(0, 8), // Limit to 8 location suggestions
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
    console.error("Search suggestions API Error:", error);
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

// Helper function to fetch location suggestions from Nominatim
async function fetchLocationSuggestions(query: string) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
        new URLSearchParams({
          q: query,
          format: "json",
          addressdetails: "1",
          limit: "10",
          countrycodes: "in", // Restrict to India
        }),
      {
        headers: {
          "User-Agent": "SpotYourPG/1.0 (spotyourpg.com)",
        },
      }
    );

    if (!response.ok) {
      console.error("Nominatim API error:", response.statusText);
      return [];
    }

    const data = await response.json();

    return data.map((item: any) => ({
      name: item.name || item.display_name.split(",")[0],
      type: item.type || "location",
      displayText: item.display_name,
      category: getCategoryFromType(item.type, item.class),
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      place_id: item.place_id,
    }));
  } catch (error) {
    console.error("Error fetching location suggestions:", error);
    return [];
  }
}

// Helper function to categorize location types
function getCategoryFromType(type: string, osmClass: string): string {
  const categoryMap: Record<string, string> = {
    // Educational
    college: "Educational Institution",
    university: "Educational Institution",
    school: "Educational Institution",

    // Healthcare
    hospital: "Healthcare",
    clinic: "Healthcare",
    doctors: "Healthcare",

    // Commercial
    mall: "Shopping & Commercial",
    supermarket: "Shopping & Commercial",
    shop: "Shopping & Commercial",

    // Transportation
    station: "Transportation",
    airport: "Transportation",
    bus_stop: "Transportation",

    // General
    city: "City",
    town: "City",
    suburb: "Area",
    neighbourhood: "Area",
  };

  return categoryMap[type] || categoryMap[osmClass] || "Location";
}