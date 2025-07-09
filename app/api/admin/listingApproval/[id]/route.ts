import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import authUser from "@/actions/authUser"; // if using JWT/session based auth
import User from "@/models/user";
import Listing from "@/models/listing";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();
    const { id } = await context.params; // Await the params

    const user = await authUser(); // if you're using session or token auth

    if (!user || user.role !== "admin") {
      return NextResponse.json({
        success: false,
        message: "Unauthorized",
      });
    }

    const listing = await Listing.findById(id).select("isApproved");

    if (!listing) {
      return NextResponse.json({
        success: false,
        message: "Listing not found",
      });
    }

    const newStatus = listing.isApproved ? false : true;
    listing.isApproved = newStatus;
    await listing.save();


    return NextResponse.json({
      success: true,
      message: "Listing Status Updated",
      newStatus,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: "Server error" });
  }
}
