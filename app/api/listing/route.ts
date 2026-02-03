import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import Listing from "@/models/listing";
import User from "@/models/user";
import authUser from "@/actions/authUser";
import { encryptResponse } from "@/lib/encryption";

export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const per_page = Math.min(
      Math.max(1, Number(searchParams.get("per_page") ?? "20")),
      100
    );
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    // Default to 10km if radius not provided
    const radiusParam = searchParams.get("radius"); 
    const radiusKm = radiusParam ? parseFloat(radiusParam) : 10; 
    
    const hasLocation = lat && lng;
    const baseQuery = { isApproved: true, isActive: true };

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

    let listings: any[] = [];
    let total = 0;

    if (hasLocation) {
      const userLat = parseFloat(lat!);
      const userLng = parseFloat(lng!);

      console.log(`[GEO_SEARCH] Lat: ${userLat}, Lng: ${userLng}, Radius: ${radiusKm}km`);

      // Geo-based listing
      listings = await Listing.aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: [userLng, userLat] },
            distanceField: "distance",
            spherical: true,
            query: baseQuery,
            maxDistance: radiusKm * 1000, // Convert km to meters (10km = 10000m)
            distanceMultiplier: 0.001,    // Convert result back to km
          },
        },
        {
          $project: {
            _id: 1,
            slug: 1,
            pgName: 1,
            primaryLine: 1,
            primaryImage: 1,
            images: 1,
            location: 1,
            roomTypes: 1,
            ownerId: 1,
            distance: 1,
            genderPreference: 1,
            type: 1,
            amenities: 1,
            rentInclusions: 1,
            mealTimings: 1,
            minRent: { $min: "$roomTypes.monthlyRent" },
          },
        },
        { $sort: { distance: 1 } }, // Closest first
        { $skip: (page - 1) * per_page },
        { $limit: per_page },
      ]);

      // Count total
      const totalResult = await Listing.aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: [userLng, userLat] },
            distanceField: "distance",
            spherical: true,
            query: baseQuery,
            maxDistance: radiusKm * 1000,
          },
        },
        { $count: "total" },
      ]);
      total = totalResult[0]?.total || 0;

    } else {
      // Fallback: Standard Search
      [listings, total] = await Promise.all([
        Listing.find(baseQuery)
          .select(
            "_id slug primaryImage images location pgName primaryLine ownerId roomTypes genderPreference type amenities rentInclusions mealTimings"
          )
          .sort({ createdAt: -1 })
          .skip((page - 1) * per_page)
          .limit(per_page)
          .populate("ownerId", "fullName")
          .lean(),
        Listing.countDocuments(baseQuery),
      ]);

      // Add minRent manually
      listings = listings.map((listing: any) => ({
        ...listing,
        minRent: Math.min(
          ...(listing.roomTypes?.map((room: any) => room.monthlyRent) || [Infinity])
        ),
      }));
    }

    // Populate owner name for aggregated (geo) listings
    if (hasLocation && listings.length > 0) {
      const ids = listings.map((l: any) => l._id);
      const populated = await Listing.find({ _id: { $in: ids } })
        .select("ownerId")
        .populate("ownerId", "fullName")
        .lean();

      const idToOwner: Record<string, string> = {};
      populated.forEach((doc: any) => {
        idToOwner[doc._id.toString()] = doc.ownerId?.fullName || "Unknown";
      });

      listings = listings.map((l: any) => ({
        ...l,
        ownerId: {
          _id: l.ownerId,
          fullName: idToOwner[l._id.toString()],
        },
      }));
    }

    // Attach watchlist flag
    const listingsWithWatchlist = listings.map((listing: any) => ({
      ...listing,
      inWatchList: userWatchlist.includes(listing._id.toString()),
    }));

    const responseData = {
      success: true,
      data: listingsWithWatchlist,
      total,
      sorted_by: hasLocation ? "distance" : "date",
      message: "Listings fetched successfully",
    };

    return NextResponse.json(encryptResponse(responseData));
  } catch (err) {
    console.error("[GET_LISTINGS_ERROR]", err);
    const errorResponse = {
      success: false,
      message: "Failed to fetch listings",
      data: [],
      total: 0,
    };
    return NextResponse.json(encryptResponse(errorResponse));
  }
}
