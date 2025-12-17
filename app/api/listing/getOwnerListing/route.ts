import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import Listing from "@/models/listing";
import authUser from "@/actions/authUser";
import User from "@/models/user";
import { encryptResponse } from "@/lib/encryption";
import mongoose from "mongoose";

// Helper function to convert slug or ID to ObjectId for exclude queries
async function getExcludeId(exclude: string | null): Promise<string | null> {
  if (!exclude) return null;
  
  // Check if it's a valid ObjectId (24 hex characters)
  const isValidObjectId = mongoose.Types.ObjectId.isValid(exclude) && exclude.length === 24;
  if (isValidObjectId) {
    return exclude;
  }
  
  // If not a valid ObjectId, treat it as a slug and find the listing
  try {
    const listing = await Listing.findOne({ slug: exclude }).select("_id").lean();
    if (!listing || Array.isArray(listing)) {
      return null;
    }
    return listing._id?.toString() || null;
  } catch (error) {
    console.error("Error finding listing by slug for exclude:", error);
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const owner = searchParams.get("owner")?.trim() || "";
    const excludeParam = searchParams.get("exclude")?.trim() || "";
    const currListingId = await getExcludeId(excludeParam || null);

    const user = await authUser();
    let watchlistIds: string[] = [];

    if (user) {
      const dbUser = await User.findById(user.id).select("watchlist");
      watchlistIds = dbUser?.watchlist?.map((id: any) => id.toString()) || [];
    }

    let ownerListings = await Listing.find({
      ownerId: owner,
      isApproved: true,
      ...(currListingId ? { _id: { $ne: currListingId } } : {}),
    })
      .select(
        "_id slug primaryImage images location pgName ownerId roomTypes genderPreference type"
      )
      .sort({ updatedAt: -1 })
      .limit(10)
      .populate("ownerId", "fullName")
      .lean();

    // Add minRent to each listing
    ownerListings = ownerListings.map((listing: any) => ({
      ...listing,
      minRent: Math.min(
        ...(listing.roomTypes?.map((room: any) => room.monthlyRent) || [
          Infinity,
        ])
      ),
    }));

    // Inject `isWatchlisted` field
    const listingsWithWatchlist = ownerListings.map((listing) => ({
      ...listing,
      isWatchlisted: watchlistIds.includes(
        (listing._id as string | number | { toString(): string }).toString()
      ),
    }));

    const responseData = {
      success: true,
      message: "Owner listings fetched successfully",
      data: listingsWithWatchlist,
    };

    return NextResponse.json(encryptResponse(responseData));
  } catch (error) {
    console.error("[getOwnerListing_API]", error);

    const errorResponse = {
      success: false,
      message: "Server error while fetching owner listings",
    };
    return NextResponse.json(encryptResponse(errorResponse));
  }
}
