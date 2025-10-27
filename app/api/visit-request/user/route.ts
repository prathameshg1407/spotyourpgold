import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import VisitRequest from "@/models/visitRequest";
import Listing from "@/models/listing";
import authUser from "@/actions/authUser";

// Get user's visit requests
export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    // Get authenticated user
    const user = await authUser();
    if (!user) {
      return NextResponse.json({
        success: false,
        message: "Authentication required",
      });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status"); // Filter by status if provided

    // Build query
    const query: any = { userId: user.id };
    if (status) {
      query.status = status;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch visit requests with listing details
    const visitRequests = await VisitRequest.find(query)
      .populate({
        path: "listingId",
        select: "pgName primaryImage location city type amenities",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await VisitRequest.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: visitRequests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Fetch user visit requests error:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch visit requests",
    });
  }
}

// Delete a visit request
export async function DELETE(req: NextRequest) {
  try {
    await connectToDB();

    // Get authenticated user
    const user = await authUser();
    if (!user) {
      return NextResponse.json({
        success: false,
        message: "Authentication required",
      });
    }

    const { searchParams } = new URL(req.url);
    const visitRequestId = searchParams.get("id");

    if (!visitRequestId) {
      return NextResponse.json({
        success: false,
        message: "Visit request ID is required",
      });
    }

    // Find and delete the visit request
    const visitRequest = await VisitRequest.findOneAndDelete({
      _id: visitRequestId,
      userId: user.id, // Ensure user can only delete their own requests
    });

    if (!visitRequest) {
      return NextResponse.json({
        success: false,
        message:
          "Visit request not found or you don't have permission to delete it",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Visit request deleted successfully",
    });
  } catch (error) {
    console.error("Delete visit request error:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to delete visit request",
    });
  }
}
