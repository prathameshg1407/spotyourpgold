import { connectToDB } from "@/services/connectdb";
import { NextResponse } from "next/server";
import authUser from "@/actions/authUser";
import Listing from "@/models/listing";

export async function GET(req: Request) {
  try {
    await connectToDB();

    const user = await authUser();

    if (!user || user.role !== "admin") {
      return NextResponse.json({
        success: false,
        message: "Unauthorized",
      });
    }

    const listings = await Listing.find({})
      .select("_id ownerId pgName isApproved isFeatured paymentProof")
      .populate("ownerId", "_id fullName")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      message: "All Listing fetched successfully",
      data: listings,
    });
  } catch (error) {
    console.error("[GET_LISTINGS]", error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch listings",
    });
  }
}
