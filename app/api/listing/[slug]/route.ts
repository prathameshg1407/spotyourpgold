// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import Listing from "@/models/listing";
import User from "@/models/user";
import authUser from "@/actions/authUser";
import OwnerProfile from "@/models/ownerProfile";
import Review from "@/models/review";
import { encryptResponse } from "@/lib/encryption";

type ListingType = {
  _id: string;
  ownerId: {
    _id: string;
    fullName: string;
    address: { city: string; state: string };
    createdAt: string;
  };
  pgName: string;
  roomTypes: any[];
  genderPreference: "male" | "female" | "unisex";
  amenities: string[];
  additionalDetails: string[];
  rentInclusions: {
    foodIncluded: boolean;
    electricityIncluded: boolean;
    maintenanceIncluded: boolean;
  };
  rulesAndRegulations: string[];
  images: { url: string; description?: string }[];
  primaryImage?: string;
  location: {
    area: string;
    city: string;
    state: string;
    pincode: string;
    coordinates: { lat?: number; lng?: number } | null;
  };
  createdAt: Date;
};

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    await connectToDB();
    const { slug } = await context.params;

    const user = await authUser().catch(() => null);

    // ✅ FIX: Check if it's a MongoDB ObjectId or a slug
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(slug);
    
    let listing;
    if (isObjectId) {
      // Search by _id if it's an ObjectId
      listing = await Listing.findById(slug)
        .select(`
          ownerId
          slug
          pgName
          primaryLine
          roomTypes
          genderPreference
          amenities
          additionalDetails
          rentInclusions
          mealTimings
          rulesAndRegulations
          detailedRules
          images.url
          images.description
          videos.url
          primaryImage
          location
          createdAt
        `) // ✅ ADDED images.description
        .populate("ownerId", "fullName")
        .lean();
    } else {
      // Search by slug
      listing = await Listing.findOne({ slug })
        .select(`
          ownerId
          slug
          pgName
          primaryLine
          roomTypes
          genderPreference
          amenities
          additionalDetails
          rentInclusions
          mealTimings
          rulesAndRegulations
          detailedRules
          images.url
          images.description
          videos.url
          primaryImage
          location
          createdAt
        `) // ✅ ADDED images.description
        .populate("ownerId", "fullName")
        .lean();
    }

    if (!listing) {
      const notFoundResponse = {
        success: false,
        message: "Listing not found",
      };
      return NextResponse.json(encryptResponse(notFoundResponse), { status: 404 });
    }

    const listingId = listing._id.toString();

    let inWatchlist = false;
    if (user) {
      const dbUser = await User.findById(user.id).select("watchlist");
      inWatchlist = dbUser?.watchlist?.some(
        (itemId: any) => itemId.toString() === listingId
      );
    }

    const ownerProfile = await OwnerProfile.findOne({
      userId: listing.ownerId._id,
    }).lean();

    const reviews = await Review.find({ listingId: listingId })
      .select("rating comment userId updatedAt")
      .populate("userId", "fullName")
      .sort({ createdAt: -1 })
      .lean();

    const minRent = Math.min(
      ...(listing.roomTypes?.map((room: any) => room.monthlyRent) || [Infinity])
    );

    const responseData = {
      success: true,
      data: {
        reviews,
        listing: {
          inWatchList: inWatchlist,
          ownerId: {
            _id: listing.ownerId._id,
            fullName: listing.ownerId.fullName,
            address: {
              city: ownerProfile?.address?.city || "",
              state: ownerProfile?.address?.state || "",
            },
            createdAt: ownerProfile?.createdAt || listing.createdAt,
          },
          _id: listing._id,
          slug: listing.slug,
          pgName: listing.pgName,
          primaryLine: listing.primaryLine || "",
          minRent,
          roomTypes: listing.roomTypes,
          genderPreference: listing.genderPreference,
          amenities: listing.amenities,
          additionalDetails: listing.additionalDetails,
          rentInclusions: listing.rentInclusions,
          mealTimings: listing.mealTimings,
          rulesAndRegulations: listing.rulesAndRegulations,
          detailedRules: listing.detailedRules,
          // ✅ FIX: Map the description so it doesn't get deleted here!
          images: listing.images?.map((img: any) => ({ 
            url: img.url, 
            description: img.description || "" 
          })) || [],
          videos: listing.videos?.map((video: any) => ({ url: video.url })) || [],
          primaryImage: listing.primaryImage || "",
          location: listing.location,
          createdAt: listing.createdAt,
        },
      },
    };

    return NextResponse.json(encryptResponse(responseData));
  } catch (err) {
    console.error("[GET_LISTING_ERROR]", err);
    const errorResponse = {
      success: false,
      message: "Server error",
    };
    return NextResponse.json(encryptResponse(errorResponse), { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    await connectToDB();
    const { slug } = await context.params;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(slug);

    const user = await authUser();

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to perform this action.",
        },
        { status: 403 }
      );
    }

    let listing;
    if (isObjectId) {
      listing = await Listing.findById(slug).select("isFeatured");
    } else {
      listing = await Listing.findOne({ slug }).select("isFeatured");
    }

    if (!listing) {
      return NextResponse.json({
        success: false,
        message: "Listing not found",
      });
    }

    listing.isFeatured = !listing.isFeatured;
    await listing.save();

    return NextResponse.json({
      success: true,
      message: listing.isFeatured
        ? "PG marked as featured"
        : "PG unmarked as featured",
    });
  } catch (error) {
    console.error("[UPDATE_LISTING_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Server error while updating PG." },
      { status: 500 }
    );
  }
}