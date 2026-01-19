// app/api/listing/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import {connectToDB} from "@/services/connectdb";
import Listing from "@/models/listing";

export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    const searchParams = req.nextUrl.searchParams;
    const lat = parseFloat(searchParams.get("lat") || "0");
    const lng = parseFloat(searchParams.get("lng") || "0");
    const radius = parseFloat(searchParams.get("radius") || "50"); // km
    const page = parseInt(searchParams.get("page") || "1");
    const per_page = parseInt(searchParams.get("per_page") || "12");
    const categories = searchParams.get("categories")?.split(",") || [];
    const countByCategory = searchParams.get("countByCategory") === "true";
    const query = searchParams.get("q") || "";

    // Build base query - only active and approved listings
    const baseQuery: any = {
      isActive: true,
      isApproved: true,
    };

    // Add category filter if provided
    if (categories.length > 0) {
      baseQuery.type = { $in: categories };
    }

    // Add text search if query provided
    if (query) {
      baseQuery.$text = { $search: query };
    }

    // Location-based search if coordinates provided
    if (lat && lng) {
      // Convert radius from km to meters
      const radiusInMeters = radius * 1000;

      baseQuery["location.coordinates"] = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat], // [longitude, latitude]
          },
          $maxDistance: radiusInMeters,
        },
      };
    }

    // Get category counts if requested
    if (countByCategory) {
      const categoryCounts = await Listing.aggregate([
        {
          $match: {
            isActive: true,
            isApproved: true,
            ...(lat && lng
              ? {
                  "location.coordinates": {
                    $near: {
                      $geometry: {
                        type: "Point",
                        coordinates: [lng, lat],
                      },
                      $maxDistance: radius * 1000,
                    },
                  },
                }
              : {}),
          },
        },
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 },
          },
        },
      ]);

      const counts = categoryCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {} as Record<string, number>);

      return NextResponse.json({
        success: true,
        categoryCounts: counts,
      });
    }

    // Calculate skip for pagination
    const skip = (page - 1) * per_page;

    // Execute query with pagination
    const [listings, total] = await Promise.all([
      Listing.find(baseQuery)
        .select(
          "pgName type subType genderPreference location primaryImage roomTypes amenities rentInclusions isWishlisted isFeatured"
        )
        .populate("ownerId", "name")
        .skip(skip)
        .limit(per_page)
        .lean(),
      Listing.countDocuments(baseQuery),
    ]);

    // Calculate distance for each listing if coordinates provided
    const listingsWithDistance = lat && lng
      ? listings.map((listing: any) => {
          const distance = calculateDistance(
            lat,
            lng,
            listing.location.coordinates.coordinates[1],
            listing.location.coordinates.coordinates[0]
          );
          return {
            ...listing,
            distance: parseFloat(distance.toFixed(2)),
            minRent: Math.min(
              ...listing.roomTypes.map((rt: any) => rt.monthlyRent)
            ),
            ownerName: listing.ownerId?.name || "Unknown",
          };
        })
      : listings.map((listing: any) => ({
          ...listing,
          minRent: Math.min(...listing.roomTypes.map((rt: any) => rt.monthlyRent)),
          ownerName: listing.ownerId?.name || "Unknown",
        }));

    return NextResponse.json({
      success: true,
      data: listingsWithDistance,
      total,
      page,
      totalPages: Math.ceil(total / per_page),
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { success: false, message: "Search failed", error: String(error) },
      { status: 500 }
    );
  }
}

// Haversine formula to calculate distance between two coordinates
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}