import { NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import Listing from "@/models/listing";
import axios from "axios";

// Helper to fetch real-world locations from OpenStreetMap
async function fetchNominatimSuggestions(query: string) {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search`,
      {
        params: {
          q: query,
          countrycodes: "in",
          format: "json",
          addressdetails: 1,
          limit: 5,
        },
        headers: {
          "User-Agent": "SYPG-App/1.0",
        },
      }
    );

    return response.data.map((place: any) => ({
      name: place.name || place.display_name.split(",")[0],
      displayText: place.display_name,
      type: place.addresstype,
      city: place.address?.city || place.address?.town || place.address?.village || place.name,
      state: place.address?.state,
      lat: parseFloat(place.lat),
      lng: parseFloat(place.lon),
      isExternal: true,
    }));
  } catch (error) {
    console.error("Nominatim Fetch Error:", error);
    return [];
  }
}

export async function GET(req: Request) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    
    if (!q || q.length < 2) {
      return NextResponse.json({
        success: true,
        data: { properties: [], locations: [] },
      });
    }

    const search = q.toLowerCase();
    
    // Flexible Regex
    const normalizedSearch = search.replace(/\s+/g, "");
    const flexiblePattern = normalizedSearch
      .split("")
      .map((char) => char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("\\s*");
    const flexibleRegex = new RegExp(flexiblePattern, "i");

    // Define the EXACT base query used in search.ts to match counts
    const baseMatchQuery = {
      isActive: true,
      isApproved: true,
      type: { $ne: null, $exists: true } // This is the filter that was missing!
    };

    // 1. Parallel Fetch: Properties from DB + Locations from Maps
    const [properties, mapLocations] = await Promise.all([
      Listing.find(
        {
          ...baseMatchQuery, // Use the strict query
          $or: [
            { pgName: { $regex: flexibleRegex } },
            { "location.area": { $regex: flexibleRegex } },
            { "location.city": { $regex: flexibleRegex } },
          ],
        },
        {
          _id: 1,
          slug: 1,
          pgName: 1,
          type: 1,
          location: 1,
          primaryImage: 1,
          roomTypes: 1,
          isFeatured: 1,
        }
      )
        .sort({ isFeatured: -1, createdAt: -1 })
        .limit(3)
        .lean(),

      fetchNominatimSuggestions(q),
    ]);

    // 2. Format Properties
    const formattedProperties = properties.map((p: any) => ({
      ...p,
      minRent:
        p.roomTypes && p.roomTypes.length
          ? Math.min(...p.roomTypes.map((r: any) => r.monthlyRent))
          : 0,
      propertyType: "property" as const,
    }));

    // 3. ENRICH LOCATIONS WITH COUNTS using Aggregation (Robust & Precise)
    const enrichedLocations = await Promise.all(
      mapLocations.map(async (loc: any) => {
        try {
          if (!loc.lat || !loc.lng || isNaN(loc.lat) || isNaN(loc.lng)) {
            return { ...loc, count: 0 };
          }

          // Aggregation pipeline matching search.ts EXACTLY
          const countResult = await Listing.aggregate([
            {
              $geoNear: {
                near: { type: "Point", coordinates: [loc.lng, loc.lat] },
                distanceField: "distance",
                spherical: true,
                query: baseMatchQuery, // Using strict query (Active + Approved + HasType)
                maxDistance: 10000, // 10km in meters
              },
            },
            { $count: "total" }
          ]);

          return { ...loc, count: countResult[0]?.total || 0 };
        } catch (err) {
          console.error("Count Error for", loc.name, err);
          return { ...loc, count: 0 };
        }
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        properties: formattedProperties,
        locations: enrichedLocations,
        query: q,
        total: formattedProperties.length + enrichedLocations.length,
      },
    });
  } catch (error: any) {
    console.error("❌ Suggestions API error:", error);
    return NextResponse.json(
      { success: false, message: "Search failed" },
      { status: 500 }
    );
  }
}