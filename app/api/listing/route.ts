// import Listing from "@/models/listing";
// import { connectToDB } from "@/services/connectdb";
// import { NextRequest, NextResponse } from "next/server";

// export async function GET(req: NextRequest) {
//   try {
//     await connectToDB();

//     const { searchParams } = new URL(req.url);

//     // Parse pagination
//     const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
//     const per_page = Math.min(
//       Math.max(1, Number(searchParams.get("per_page") ?? "20")),
//       100
//     );

//     // Parse coordinates
//     const lat = searchParams.get("lat");
//     const lng = searchParams.get("lng");
//     const hasLocation = lat && lng;

//     const baseQuery = { isApproved: true, isActive: true };

//     // 🎯 GeoNear if coordinates exist
//     let pipeline: any[];
//     let countPipeline: any[];

//     if (hasLocation) {
//       const userLat = parseFloat(lat!);
//       const userLng = parseFloat(lng!);

//       pipeline = [
//         {
//           $geoNear: {
//             near: { type: "Point", coordinates: [userLng, userLat] },
//             distanceField: "distance",
//             spherical: true,
//             query: baseQuery,
//             maxDistance: 100000, // optional: 100km radius
//             distanceMultiplier: 0.001, // meters -> km
//           },
//         },
//         { $skip: (page - 1) * per_page },
//         { $limit: per_page },
//       ];

//       countPipeline = [
//         {
//           $geoNear: {
//             near: { type: "Point", coordinates: [userLng, userLat] },
//             distanceField: "distance",
//             spherical: true,
//             query: baseQuery,
//           },
//         },
//         { $count: "total" },
//       ];
//     } else {
//       // ⏳ Default: Latest Listings
//       pipeline = [
//         { $match: baseQuery },
//         { $sort: { createdAt: -1 } },
//         { $skip: (page - 1) * per_page },
//         { $limit: per_page },
//       ];

//       countPipeline = [{ $match: baseQuery }, { $count: "total" }];
//     }

//     const [listings, totalResult] = await Promise.all([
//       Listing.aggregate(pipeline),
//       Listing.aggregate(countPipeline),
//     ]);

//     const total = totalResult[0]?.total || 0;

//     return NextResponse.json({
//       success: true,
//       data: listings,
//       total,
//       sorted_by: hasLocation ? "distance" : "date",
//       message: "Listing fetched successfully",
//     });
//   } catch (error) {
//     console.error("[GET_LISTINGS]", error);
//     return NextResponse.json({
//       success: false,
//       message: "Failed to fetch listings",
//       data: [],
//       total: 0,
//     });
//   }
// }

// one call in the above one and 2 calls in the one below one additoial for tatal count because the one above was giving the total in db not the near me basis

// import Listing from "@/models/listing";
// import { connectToDB } from "@/services/connectdb";
// import { NextRequest, NextResponse } from "next/server";

// export async function GET(req: NextRequest) {
//   try {
//     await connectToDB();

//     const { searchParams } = new URL(req.url);
//     const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
//     const per_page = Math.min(Math.max(1, Number(searchParams.get("per_page") ?? "20")), 100);
//     const lat = searchParams.get("lat");
//     const lng = searchParams.get("lng");

//     const baseQuery = { isApproved: true, isActive: true };
//     const hasLocation = lat && lng;
//     let listings = [];
//     let total = 0;

//     if (hasLocation) {
//       const userLat = parseFloat(lat!);
//       const userLng = parseFloat(lng!);

//       // 🔹 Step 1: Get paginated results
//       listings = await Listing.aggregate([
//         {
//           $geoNear: {
//             near: { type: "Point", coordinates: [userLng, userLat] },
//             distanceField: "distance",
//             spherical: true,
//             query: baseQuery,
//             maxDistance: 100000,
//             distanceMultiplier: 0.001,
//           },
//         },
//         { $sort: { distance: 1 } },
//         { $skip: (page - 1) * per_page },
//         { $limit: per_page },
//       ]);

//       // 🔹 Step 2: Get accurate total (not parallel)
//       const totalResult = await Listing.aggregate([
//         {
//           $geoNear: {
//             near: { type: "Point", coordinates: [userLng, userLat] },
//             distanceField: "distance",
//             spherical: true,
//             query: baseQuery,
//             maxDistance: 100000,
//           },
//         },
//         { $count: "total" },
//       ]);

//       total = totalResult[0]?.total || 0;
//     } else {
//       // No location, simple $match + $count
//       [listings, total] = await Promise.all([
//         Listing.aggregate([
//           { $match: baseQuery },
//           { $sort: { createdAt: -1 } },
//           { $skip: (page - 1) * per_page },
//           { $limit: per_page },
//         ]),
//         Listing.countDocuments(baseQuery),
//       ]);
//     }

//     return NextResponse.json({
//       success: true,
//       data: listings,
//       total,
//       sorted_by: hasLocation ? "distance" : "date",
//       message: "Listings fetched successfully",
//     });
//   } catch (error) {
//     console.error("[GET_LISTINGS_ERROR]", error);
//     return NextResponse.json(
//       {
//         success: false,
//         message: "Failed to fetch listings",
//         data: [],
//         total: 0,
//       },
//       { status: 500 }
//     );
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import Listing from "@/models/listing";
import User from "@/models/user";
import authUser from "@/actions/authUser";

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

      // Geo-based listing with minRent
      listings = await Listing.aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: [userLng, userLat] },
            distanceField: "distance",
            spherical: true,
            query: baseQuery,
            distanceMultiplier: 0.001,
          },
        },
        {
          $project: {
            _id: 1,
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
            minRent: { $min: "$roomTypes.monthlyRent" }, // ✅ minRent from array
          },
        },
        { $sort: { distance: 1 } },
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
          },
        },
        { $count: "total" },
      ]);
      total = totalResult[0]?.total || 0;

      // Debug log for primaryLine in listings
      if (process.env.NODE_ENV === "development" && listings.length > 0) {
        console.log(
          "API Debug - Sample listing primaryLine:",
          listings[0].primaryLine
        );
        listings.forEach((listing, index) => {
          if (listing.primaryLine) {
            console.log(
              `Listing ${index} - ${listing.pgName}: "${listing.primaryLine}"`
            );
          }
        });
      }
    } else {
      // Fallback to createdAt ordering
      [listings, total] = await Promise.all([
        Listing.find(baseQuery)
          .select(
            "_id primaryImage images location pgName primaryLine ownerId roomTypes genderPreference type amenities rentInclusions mealTimings"
          )
          .sort({ createdAt: -1 })
          .skip((page - 1) * per_page)
          .limit(per_page)
          .populate("ownerId", "fullName")
          .lean(),
        Listing.countDocuments(baseQuery),
      ]);

      // ✅ Add minRent manually
      listings = listings.map((listing: any) => ({
        ...listing,
        minRent: Math.min(
          ...(listing.roomTypes?.map((room: any) => room.monthlyRent) || [
            Infinity,
          ])
        ),
      }));
    }

    // Populate owner name manually for aggregated listings
    if (hasLocation) {
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

    return NextResponse.json({
      success: true,
      data: listingsWithWatchlist,
      total,
      sorted_by: hasLocation ? "distance" : "date",
      message: "Listings fetched successfully",
    });
  } catch (err) {
    console.error("[GET_LISTINGS_ERROR]", err);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch listings",
      data: [],
      total: 0,
    });
  }
}
