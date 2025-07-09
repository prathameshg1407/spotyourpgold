
import authUser from "@/actions/authUser";
import Listing from "@/models/listing";
import { connectToDB } from "@/services/connectdb";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    await connectToDB();

    const user = await authUser();


    if (!user) {
      return NextResponse.json(
        { success: false, message: "Missing userId" },
      );
    }

    const rawListings = await Listing.find({ ownerId: user?.id }).select("_id pgName location.area roomTypes isActive isFeatured isApproved createdAt paymentStatus").lean();


  if (!rawListings || rawListings.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Owner listings not found",
      });
    }

    const listings = rawListings.map((listing) => {
      const minRent = Math.min(
        ...(listing.roomTypes?.map((room: any) => room.monthlyRent) || [0])
      );

      return {
        _id: (listing._id as string | number | { toString(): string }).toString(),
        pgName: listing.pgName,
        area: listing.location.area,
        monthlyRent: minRent,
        isActive: listing.isActive,
        isFeatured: listing.isFeatured,
        isApproved: listing.isApproved,
        createdAt: listing.createdAt,
        paymentStatus: listing.paymentStatus,
      };
    });


    return NextResponse.json({
      success: true,
      message: "owner listings fetched successfully",
      data: listings,
    });
  } catch (error) {
    console.error("[GET_OWNER_LISTINGS]", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch owner listings" },
    );
  }
}
