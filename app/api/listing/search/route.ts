import { connectToDB } from "@/services/connectdb";
import Listing from "@/models/listing";
import { NextResponse } from "next/server";
import authUser from "@/actions/authUser";
import User from "@/models/user";

export async function GET(req: Request) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";
    const type = searchParams.get("type")?.trim() || "";
    const subType = searchParams.get("subType")?.trim() || "";
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const per_page = Math.max(
      1,
      Math.min(Number(searchParams.get("per_page") ?? 20), 100)
    );

    if (!q) {
      return NextResponse.json(
        { success: false, message: "Query required" },
        { status: 400 }
      );
    }

    const user = await authUser().catch(() => null);

    let userWatchlist: string[] = [];
    if (user) {
      const dbUser = (await User.findById(user.id)
        .select("watchlist")
        .lean()) as { watchlist?: string[] } | null;
      if (dbUser?.watchlist) {
        userWatchlist = dbUser.watchlist.map((id) => id.toString());
      }
    }

       const query: any = {
  $and: [
    {
      $or: [
        { pgName: { $regex: q, $options: "i" } },
        { "location.area": { $regex: q, $options: "i" } },
        { "location.city": { $regex: q, $options: "i" } },
        // Remove this line: { "ownerId.fullName": { $regex: q, $options: "i" } },
      ],
    },
    { isActive: true },
    { isApproved: true },
  ],
};

// Add type filter if provided
if (type) {
  query.$and.push({ type: type });
}

// Add subType filter if provided
if (subType) {
  query.$and.push({ subType: subType });
}

    const [listings, total] = await Promise.all([
      Listing.find(query)
        .select("_id primaryImage location pgName ownerId monthlyRent")
        .sort({ createdAt: -1 })
        .skip((page - 1) * per_page)
        .limit(per_page)
        .populate("ownerId", "fullName")
        .lean(),

      Listing.countDocuments(query),
    ]);

    const listingsWithWatchlist = listings.map((listing: any) => ({
      ...listing,
      inWatchList: userWatchlist.includes(listing._id.toString()),
    }));

    return NextResponse.json({
      success: true,
      data: listingsWithWatchlist,
      page,
      per_page,
      total,
    });
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json(
      { success: false, message: "Search failed" },
      { status: 500 }
    );
  }
}
