import { connectToDB } from "@/services/connectdb";
import Listing from "@/models/listing";
import { NextResponse } from "next/server";

async function getLocations(q: string) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=8&addressdetails=1&countrycodes=in`
    );
    const data = await response.json();
    if (!data || !Array.isArray(data)) return [];

    return data
      .filter((item: any) => item.address && (item.address.city || item.address.town || item.address.suburb || item.address.neighbourhood || item.address.village))
      .map((item: any) => {
        const locType: "city" | "area" = item.address.city || item.address.town || item.address.village ? "city" : "area";
        const city = item.address.city || item.address.town || item.address.village || item.address.state_district || "";
        const area = item.address.suburb || item.address.neighbourhood || item.address.road || item.address.hamlet || "";
        const state = item.address.state || "India";
        const displayText = locType === "city" ? `${city}, ${state}` : `${area}, ${city || state}`;

        return {
          name: item.display_name,
          type: locType,
          displayText,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        };
      });
  } catch (error) {
    return [];
  }
}

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

    // Create search terms
    const searchTerms = q.toLowerCase();
    const searchWords = searchTerms.split(/\s+/);

    // Create exact regex for word-level matching
    const exactRegex = new RegExp(
      searchWords
        .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("|"),
      "i"
    );

    // ✅ FIXED: Create BIDIRECTIONAL flexible regex
    // This handles both "vijaynagar" → "Vijay Nagar" and "Vijay Nagar" → "vijaynagar"
    const normalizedSearch = searchTerms.replace(/\s+/g, ""); // Remove all spaces
    const flexiblePattern = normalizedSearch
      .split("")
      .map((char) => char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("\\s*"); // Allow optional space between each character
    
    const flexibleRegex = new RegExp(flexiblePattern, "i");

    // Ultra-fast aggregation pipeline for comprehensive search
    const searchPipeline = [
      {
        $match: {
          isActive: true,
          isApproved: true,
          $or: [
            // Basic info fields - using flexible regex
            { pgName: { $regex: flexibleRegex } },
            { type: { $regex: exactRegex } },
            { subType: { $regex: exactRegex } },
            { genderPreference: { $regex: exactRegex } },

            // Location fields - using flexible regex for better matching
            { "location.area": { $regex: flexibleRegex } },
            { "location.city": { $regex: flexibleRegex } },
            { "location.state": { $regex: flexibleRegex } },
            { "location.pincode": { $regex: exactRegex } },
            {
              $and: [
                { "location.nearbyPlaces": { $type: "array" } },
                {
                  "location.nearbyPlaces": {
                    $elemMatch: { $regex: flexibleRegex },
                  },
                },
              ],
            },

            // Amenities and details with array safety
            {
              $and: [
                { amenities: { $type: "array" } },
                { amenities: { $elemMatch: { $regex: exactRegex } } },
              ],
            },
            {
              $and: [
                { additionalDetails: { $type: "array" } },
                { additionalDetails: { $elemMatch: { $regex: exactRegex } } },
              ],
            },
            {
              $and: [
                { rulesAndRegulations: { $type: "array" } },
                {
                  rulesAndRegulations: { $elemMatch: { $regex: exactRegex } },
                },
              ],
            },

            // Room types
            { "roomTypes.type": { $regex: exactRegex } },

            // Enhanced rules
            { "detailedRules.lockInPeriod": { $regex: exactRegex } },
            { "detailedRules.noticePeriod": { $regex: exactRegex } },
            { "detailedRules.maintenanceCharges": { $regex: exactRegex } },
            { "detailedRules.entryTiming": { $regex: exactRegex } },
            { "detailedRules.exitTiming": { $regex: exactRegex } },
            { "detailedRules.guestStayPolicy": { $regex: exactRegex } },
            { "detailedRules.smokingAlcoholPolicy": { $regex: exactRegex } },

            // Plan and payment
            { planType: { $regex: exactRegex } },
            { paymentStatus: { $regex: exactRegex } },
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
                  { $regexMatch: { input: "$pgName", regex: flexibleRegex } },
                  10,
                  0,
                ],
              },
              {
                $cond: [
                  {
                    $regexMatch: {
                      input: "$location.area",
                      regex: flexibleRegex,
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
                      regex: flexibleRegex,
                    },
                  },
                  8,
                  0,
                ],
              },
              {
                $cond: [
                  { $regexMatch: { input: "$type", regex: exactRegex } },
                  6,
                  0,
                ],
              },
              {
                $cond: [
                  {
                    $regexMatch: {
                      input: "$genderPreference",
                      regex: exactRegex,
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
                                    regex: exactRegex,
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
                                    regex: flexibleRegex,
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

    // Get dynamic locations
    const locations = await getLocations(q);

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