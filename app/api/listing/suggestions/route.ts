import { NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import Listing from "@/models/listing";

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

    // Create flexible regex for better matching (handles "vijaynagar" → "Vijay Nagar")
    const normalizedSearch = search.replace(/\s+/g, "");
    const flexiblePattern = normalizedSearch
      .split("")
      .map((char) => char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("\\s*");
    const flexibleRegex = new RegExp(flexiblePattern, "i");

    // 1) Get distinct locations (city + area) from active/approved listings
    const locationsAgg = await Listing.aggregate([
      {
        $match: {
          isActive: true,
          isApproved: true,
          $or: [
            { "location.city": { $regex: flexibleRegex } },
            { "location.area": { $regex: flexibleRegex } },
          ],
        },
      },
      {
        $group: {
          _id: {
            city: "$location.city",
            area: "$location.area",
            state: "$location.state",
          },
          count: { $sum: 1 },
          // Get first listing's coordinates for this location
          sampleCoordinates: { $first: "$location.coordinates.coordinates" },
        },
      },
      { $sort: { count: -1 } }, // Sort by number of listings
      { $limit: limit },
      {
        $project: {
          _id: 0,
          city: "$_id.city",
          area: "$_id.area",
          state: "$_id.state",
          count: 1,
          coordinates: "$sampleCoordinates",
        },
      },
    ]);

    console.log("📊 Locations aggregation result:", JSON.stringify(locationsAgg, null, 2));

    // Format locations for frontend
    const locations = locationsAgg.map((loc: any) => {
      const displayText = loc.area
        ? `${loc.area}, ${loc.city}`
        : `${loc.city}, ${loc.state}`;

      const type: "city" | "area" =
        loc.area && loc.area.toLowerCase() !== loc.city.toLowerCase()
          ? "area"
          : "city";

      // Extract lat/lng from coordinates array [lng, lat]
      let lat = null;
      let lng = null;
      
      if (loc.coordinates && Array.isArray(loc.coordinates) && loc.coordinates.length === 2) {
        lng = loc.coordinates[0]; // MongoDB stores as [lng, lat]
        lat = loc.coordinates[1];
      }

      console.log(`📍 Location: ${displayText}`, { 
        rawCoords: loc.coordinates, 
        extractedLat: lat, 
        extractedLng: lng 
      });

      return {
        name: loc.city,
        displayText,
        type,
        city: loc.city,
        area: loc.area,
        state: loc.state,
        count: loc.count,
        // Include coordinates if available
        lat,
        lng,
      };
    });

    // 2) Get matching properties
    const properties = await Listing.find(
      {
        isActive: true,
        isApproved: true,
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
      .limit(limit)
      .lean();

    const formattedProperties = properties.map((p: any) => ({
      ...p,
      minRent:
        p.roomTypes && p.roomTypes.length
          ? Math.min(...p.roomTypes.map((r: any) => r.monthlyRent))
          : 0,
      propertyType: "property" as const,
    }));

    console.log("✅ Suggestions response:", {
      locationsCount: locations.length,
      propertiesCount: formattedProperties.length,
      firstLocation: locations[0],
    });

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