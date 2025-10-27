import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import Review from "@/models/review";
import authUser from "@/actions/authUser";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();
    const user = await authUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: reviewId } = await params;
    const { rating, comment } = await req.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, message: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Find the review and check if it belongs to the current user
    const review = await Review.findById(reviewId);

    if (!review) {
      return NextResponse.json(
        { success: false, message: "Review not found" },
        { status: 404 }
      );
    }

    if (review.userId.toString() !== user.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized to edit this review" },
        { status: 403 }
      );
    }

    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      { rating, comment },
      { new: true }
    )
      .populate("listingId", "pgName images")
      .populate("userId", "fullName")
      .lean();

    return NextResponse.json({
      success: true,
      message: "Review updated successfully",
      data: updatedReview,
    });
  } catch (error) {
    console.error("[UPDATE_REVIEW_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update review",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();
    const user = await authUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: reviewId } = await params;

    // Find the review and check if it belongs to the current user
    const review = await Review.findById(reviewId);

    if (!review) {
      return NextResponse.json(
        { success: false, message: "Review not found" },
        { status: 404 }
      );
    }

    if (review.userId.toString() !== user.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized to delete this review" },
        { status: 403 }
      );
    }

    await Review.findByIdAndDelete(reviewId);

    return NextResponse.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("[DELETE_REVIEW_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete review",
      },
      { status: 500 }
    );
  }
}
