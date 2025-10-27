import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import User from "@/models/user";
import Listing from "@/models/listing";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();
    const { id } = await context.params;

    console.log("Delete owner request for ID:", id);

    if (!id) {
      console.log("No ID provided");
      return NextResponse.json(
        { success: false, message: "Owner ID is required" },
        { status: 400 }
      );
    }

    // Check if owner exists
    const owner = await User.findById(id);
    console.log("Owner found:", owner ? "Yes" : "No");
    if (!owner) {
      return NextResponse.json(
        { success: false, message: "Owner not found" },
        { status: 404 }
      );
    }

    // Check if owner has any listings
    const ownerListings = await Listing.find({ ownerId: id });
    console.log("Owner listings count:", ownerListings.length);
    if (ownerListings.length > 0) {
      console.log("Cannot delete - owner has listings");
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete owner. They have ${ownerListings.length} active listing(s). Please delete or transfer their listings first.`,
        },
        { status: 400 }
      );
    }

    // Delete the owner
    await User.findByIdAndDelete(id);

    return NextResponse.json(
      {
        success: true,
        message: "Owner deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting owner:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
