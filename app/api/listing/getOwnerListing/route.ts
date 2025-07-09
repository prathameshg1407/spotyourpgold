import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import Listing from "@/models/listing";
import authUser from "@/actions/authUser";
import User from "@/models/user";

export async function GET(req: NextRequest) {
  try {
    await connectToDB();

      const { searchParams } = new URL(req.url);
    const owner = searchParams.get("owner")?.trim() || "";
    const currListingId = searchParams.get("exclude")?.trim() || "";

    const user = await authUser();
    let watchlistIds: string[] = [];

    if (user) {
      const dbUser = await User.findById(user.id).select("watchlist");
      watchlistIds = dbUser?.watchlist?.map((id: any) => id.toString()) || [];
    }

    const ownerListings = await Listing.find({ ownerId: owner, isApproved: true ,  _id: { $ne: currListingId }, })
      .select("_id primaryImage location pgName ownerId monthlyRent")
      .sort({ updatedAt: -1 })
      .limit(10)
      .populate("ownerId", "fullName")
      .lean();

    // Inject `isWatchlisted` field
    const listingsWithWatchlist = ownerListings.map((listing) => ({
      ...listing,
      isWatchlisted: watchlistIds.includes((listing._id as string | number | { toString(): string }).toString()),
    }));

    return NextResponse.json({
      success: true,
      message: "Owner listings fetched successfully",
      data: listingsWithWatchlist,
    });
  } catch (error) {
    console.error("[getOwnerListing_API]", error);

    return NextResponse.json({
      success: false,
      message: "Server error while fetching owner listings",
    });
  }
}
