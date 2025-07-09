
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

    const rawListings = await Listing.find({ ownerId: user?.id , isApproved: true }).select("_id pgName roomTypes").lean();


  if (!rawListings || rawListings.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Owner listings not found",
      });
    }


    return NextResponse.json({
      success: true,
      message: "owner listings fetched successfully",
      data: rawListings,
    });
  } catch (error) {
    console.error("[GET_OWNER_LISTINGS]", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch owner listings" },
    );
  }
}
