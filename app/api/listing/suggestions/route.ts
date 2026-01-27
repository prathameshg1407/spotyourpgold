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
          q: `${query}, India`, // Focused on India
          format: "json",
          addressdetails: 1,
          limit: 5,
          featuretype: "settlement", // Prefer cities/towns/villages
        },
        headers: {
          "User-Agent": "SYPG-App/1.0", // Required by Nominatim
        },
      }
    );

    return response.data.map((place: any) => ({
      name: place.name || place.display_name.split(",")[0],
      displayText: place.display_name,
      type: place.addresstype === "city" ? "city" : "area",
      city: place.address?.city || place.address?.town || place.address?.village || place.name,
      state: place.address?.state,
      count: 0, // External location, count unknown until clicked
      lat: parseFloat(place.lat),
      lng: parseFloat(place.lon),
      isExternal: true, // Flag to identify map results
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
    const limit = Math.min(Number(searchParams.get("limit") || 8), 20);

    if (!q || q.length < 2) {
      return NextResponse.json({
        success: true,
        data: { properties: [], locations: [] },
      });
    }

    const search = q.toLowerCase();
    
    // Create flexible regex
    const normalizedSearch = search.replace(/\s+/g, "");
    const flexiblePattern = normalizedSearch
      .split("")
      .map((char) => char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("\\s*");
    const flexibleRegex = new RegExp(flexiblePattern, "i");

    // PARALLEL EXECUTION: 
    // 1. Search DB for matching Property Names
    // 2. Search OpenStreetMap for matching Location Names
    const [properties, mapLocations] = await Promise.all([
      Listing.find(
        {
          isActive: true,
          isApproved: true,
          $or: [
            { pgName: { $regex: flexibleRegex } },
            { "location.area": { $regex: flexibleRegex } }, // Also match DB areas
          ],
        },
        {
          _id: 1,
          slug: 1,
          pgName: 1,
          type: 1,
          subType: 1,
          genderPreference: 1,
          location: 1,
          primaryImage: 1,
          roomTypes: 1,
          isFeatured: 1,
          createdAt: 1,
        }
      )
        .sort({ isFeatured: -1, createdAt: -1 })
        .limit(5)
        .lean(),

      fetchNominatimSuggestions(q),
    ]);

    // Format Properties
    const formattedProperties = properties.map((p: any) => ({
      ...p,
      minRent:
        p.roomTypes && p.roomTypes.length
          ? Math.min(...p.roomTypes.map((r: any) => r.monthlyRent))
          : 0,
      propertyType: "property" as const,
    }));

    // Combine Map Locations (Priority) + Existing DB Locations (Fallback)
    // We prioritize Map results because they have real coordinates
    const combinedLocations = [...mapLocations];

    return NextResponse.json({
      success: true,
      data: {
        properties: formattedProperties,
        locations: combinedLocations,
        query: q,
        total: formattedProperties.length + combinedLocations.length,
      },
    });
  } catch (error: any) {
    console.error("❌ Suggestions API error:", error);
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