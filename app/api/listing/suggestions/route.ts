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

    /**
     * 1. Standard Regex: For partial word matches (e.g., "Vijay")
     */
    const searchRegex = new RegExp(
      q.split(/\s+/)
        .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("|"),
      "i"
    );

    /**
     * 2. Fuzzy Space Regex: Specifically for "vijaynagar" matching "Vijay Nagar"
     * It inserts an optional whitespace check \s* between every character.
     */
    const fuzzySpaceRegex = new RegExp(q.split("").join("\\s*"), "i");

    /**
     * 3. Normalized Query for JSON filtering
     */
    const normalizedQuery = q.toLowerCase().replace(/[^a-z0-9]/g, "");

    const searchPipeline = [
      {
        $match: {
          isActive: true,
          isApproved: true,
          $or: [
            // Standard and Fuzzy checks for Names and Areas
            { pgName: { $regex: searchRegex } },
            { pgName: { $regex: fuzzySpaceRegex } },
            { "location.area": { $regex: searchRegex } },
            { "location.area": { $regex: fuzzySpaceRegex } },
            { "location.city": { $regex: searchRegex } },
            { "location.city": { $regex: fuzzySpaceRegex } },

            // Other fields
            { type: { $regex: searchRegex } },
            { subType: { $regex: searchRegex } },
            { genderPreference: { $regex: searchRegex } },
            { "location.state": { $regex: searchRegex } },
            { "location.pincode": { $regex: searchRegex } },
            {
              $and: [
                { "location.nearbyPlaces": { $type: "array" } },
                { "location.nearbyPlaces": { $elemMatch: { $regex: searchRegex } } },
              ],
            },
            {
              $and: [
                { amenities: { $type: "array" } },
                { amenities: { $elemMatch: { $regex: searchRegex } } },
              ],
            },
            { "roomTypes.type": { $regex: searchRegex } },
          ],
        },
      },
      {
        $addFields: {
          relevanceScore: {
            $add: [
              // Exact name matches get highest priority
              { $cond: [{ $regexMatch: { input: "$pgName", regex: searchRegex } }, 15, 0] },
              // Fuzzy area matches (like vijaynagar) get high priority
              { $cond: [{ $regexMatch: { input: "$location.area", regex: fuzzySpaceRegex } }, 12, 0] },
              { $cond: [{ $regexMatch: { input: "$location.city", regex: searchRegex } }, 8, 0] },
              { $cond: [{ $regexMatch: { input: "$type", regex: searchRegex } }, 6, 0] },
            ],
          },
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

    // Execute Mongo Search
    const properties = await Listing.aggregate(searchPipeline);

    // 4. Smart Filtering for Indore Locations (JSON)
    const locations = indoreLocations
      .filter((location) => {
        const normalizedName = location.name.toLowerCase().replace(/[^a-z0-9]/g, "");
        const smartMatch = normalizedName.includes(normalizedQuery);
        const nameMatch = searchRegex.test(location.name);
        const aliasMatch = location.aliases?.some((alias) =>
          searchRegex.test(alias)
        );
        return smartMatch || nameMatch || aliasMatch;
      })
      .slice(0, 8)
      .map((location) => ({
        name: location.name,
        type: "indore",
        displayText: location.displayName,
        category: "Indore Locations",
        lat: location.lat,
        lng: location.lng,
      }));

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
    });
  } catch (error: any) {
    console.error("Search API Error:", error);
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