import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import VisitRequest from "@/models/visitRequest";
import Listing from "@/models/listing";
import authUser from "@/actions/authUser";

// Update visit request (only for owner's listings)
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();
    const { id } = await context.params;

    const user = await authUser();
    if (!user || (user.role !== "owner" && user.role !== "admin")) {
      return NextResponse.json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { status, ownerNotes } = await req.json();

    const visitRequest = await VisitRequest.findById(id).populate(
      "listingId",
      "ownerId"
    );
    if (!visitRequest) {
      return NextResponse.json({
        success: false,
        message: "Visit request not found",
      });
    }

    // Check if the listing belongs to this owner
    if (visitRequest.listingId.ownerId.toString() !== user.id) {
      return NextResponse.json({
        success: false,
        message: "Unauthorized: This visit request is not for your listing",
      });
    }

    // Update fields if provided
    if (status) {
      visitRequest.status = status;
    }
    if (ownerNotes !== undefined) {
      visitRequest.adminNotes = ownerNotes; // Reusing adminNotes field for owner notes
    }

    await visitRequest.save();

    return NextResponse.json({
      success: true,
      message: "Visit request updated successfully",
      data: visitRequest,
    });
  } catch (error) {
    console.error("Update owner visit request error:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to update visit request",
    });
  }
}
