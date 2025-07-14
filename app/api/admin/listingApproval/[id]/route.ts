import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import authUser from "@/actions/authUser"; // if using JWT/session based auth
import User from "@/models/user";
import Listing from "@/models/listing";
import { sendListingApprovalEmail } from "@/services/sendListingApprovalEmail";

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

    const listing = await Listing.findById(id)
      .select("isApproved pgName location ownerId")
      .populate("ownerId", "fullName email");

    if (!listing) {
      return NextResponse.json({
        success: false,
        message: "Listing not found",
      });
    }

    const newStatus = listing.isApproved ? false : true;
    listing.isApproved = newStatus;
    await listing.save();

    // Send email notification when listing is approved (not when disapproved)
    if (newStatus === true && listing.ownerId) {
      try {
        await sendListingApprovalEmail({
          to: listing.ownerId.email,
          ownerName: listing.ownerId.fullName,
          pgName: listing.pgName,
          location: {
            area: listing.location.area,
            city: listing.location.city,
            state: listing.location.state,
          },
          listingId: listing._id.toString(),
        });
        console.log("Listing approval email sent successfully");
      } catch (emailError) {
        console.error("Failed to send listing approval email:", emailError);
        // Don't fail the API call if email fails
      }
    }

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
