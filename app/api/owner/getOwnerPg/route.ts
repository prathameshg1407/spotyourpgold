// app/api/owner/getOwnerPg/route.ts
import { NextResponse } from "next/server";
import authUser from "@/actions/authUser";
import Listing from "@/models/listing";
import { connectToDB } from "@/services/connectdb";

// Types
interface RoomType {
  _id: string;
  type: string;
  isAC: boolean;
  numberOfRooms: number;
  availableRooms: number;
  capacityPerRoom: number;
  monthlyRent: number;
  securityDeposit: number;
}

interface ListingDocument {
  _id: string | { toString(): string };
  pgName: string;
  location: {
    area: string;
    city: string;
  };
  roomTypes?: RoomType[];
  isActive: boolean;
  isFeatured: boolean;
  isApproved: boolean;
  createdAt: Date;
  paymentStatus: string;
}

interface TransformedListing {
  _id: string;
  pgName: string;
  location: {
    area: string;
    city: string;
  };
  area: string;
  monthlyRent: number;
  roomTypes: RoomType[];
  isActive: boolean;
  isFeatured: boolean;
  isApproved: boolean;
  createdAt: Date;
  paymentStatus: string;
}

// Helper function to calculate minimum rent
function getMinimumRent(roomTypes?: RoomType[]): number {
  if (!roomTypes || roomTypes.length === 0) {
    return 0;
  }
  
  const rents = roomTypes
    .map((room) => room.monthlyRent)
    .filter((rent) => typeof rent === "number" && rent > 0);
  
  return rents.length > 0 ? Math.min(...rents) : 0;
}

// Helper function to transform listing document
function transformListing(listing: ListingDocument): TransformedListing {
  const listingId = typeof listing._id === "object" 
    ? listing._id.toString() 
    : String(listing._id);

  // Ensure roomTypes is always an array
  const roomTypes = Array.isArray(listing.roomTypes) ? listing.roomTypes : [];

  return {
    _id: listingId,
    pgName: listing.pgName,
    location: {
      area: listing.location?.area || "",
      city: listing.location?.city || "",
    },
    area: listing.location?.area || "",
    monthlyRent: getMinimumRent(roomTypes),
    roomTypes: roomTypes,
    isActive: listing.isActive ?? false,
    isFeatured: listing.isFeatured ?? false,
    isApproved: listing.isApproved ?? false,
    createdAt: listing.createdAt,
    paymentStatus: listing.paymentStatus || "pending",
  };
}

export async function GET() {
  try {
    // Connect to database
    await connectToDB();

    // Authenticate user
    const user = await authUser();

    if (!user?.id) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Unauthorized: Please login to continue",
          data: [] 
        },
        { status: 401 }
      );
    }

    // Fetch listings with required fields
    const rawListings = await Listing.find({ ownerId: user.id })
      .select(
        "_id pgName location.area location.city roomTypes isActive isFeatured isApproved createdAt paymentStatus"
      )
      .sort({ createdAt: -1 })
      .lean<ListingDocument[]>();

    // Handle no listings found
    if (!rawListings || rawListings.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No listings found",
        data: [],
      });
    }

    // Transform listings
    const listings = rawListings.map(transformListing);

    return NextResponse.json({
      success: true,
      message: "Owner listings fetched successfully",
      data: listings,
      count: listings.length,
    });

  } catch (error) {
    console.error("[GET_OWNER_LISTINGS] Error:", error);
    
    // Return proper error response
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to fetch owner listings",
        data: [],
        error: process.env.NODE_ENV === "development" 
          ? (error as Error).message 
          : undefined
      },
      { status: 500 }
    );
  }
}