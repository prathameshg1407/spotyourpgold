import { NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import Listing from "@/models/listing";

export async function GET(req: Request) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    
    if (!q || q.length < 2) {
      return NextResponse.json({
        success: true,
        data: { properties: [] },
      });
    }

    const search = q.toLowerCase();
    
    // Flexible Regex for DB Text Search
    const normalizedSearch = search.replace(/\s+/g, "");
    const flexiblePattern = normalizedSearch
      .split("")
      .map((char) => char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("\\s*");
    const flexibleRegex = new RegExp(flexiblePattern, "i");

    // Fetch Properties from DB
    // We strictly filter for Active, Approved, and Typed listings
    const properties = await Listing.find(
      {
        isActive: true,
        isApproved: true,
        type: { $ne: null, $exists: true },
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
      .lean();

    // Format DB Properties
    const formattedProperties = properties.map((p: any) => ({
      ...p,
      minRent:
        p.roomTypes && p.roomTypes.length
          ? Math.min(...p.roomTypes.map((r: any) => r.monthlyRent))
          : 0,
      propertyType: "property" as const,
    }));

    return NextResponse.json({
      success: true,
      data: {
        properties: formattedProperties,
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