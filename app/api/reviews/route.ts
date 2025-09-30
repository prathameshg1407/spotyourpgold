// app/api/reviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import Review from "@/models/review";
import authUser from "@/actions/authUser";

export async function GET(req: NextRequest) {
  try {
    await connectToDB();
    const user = await authUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    // If userId is provided and matches the authenticated user, or if no userId provided, get current user's reviews
    const targetUserId = userId && userId === user.id ? userId : user.id;

    const reviews = await Review.find({ userId: targetUserId })
      .populate("listingId", "pgName images")
      .populate("userId", "fullName")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      message: "Reviews fetched successfully",
      data: reviews,
    });
  } catch (error) {
    console.error("[GET_REVIEWS_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch reviews",
        data: [],
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDB();
    const user = await authUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" });
    }

    const { listingId, rating, comment } = await req.json();

    if (!listingId || !rating) {
      return NextResponse.json({ error: "Missing required fields" });
    }

    const review = await Review.findOneAndUpdate(
      { listingId, userId: user.id },
      { rating, comment },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
      .select("rating comment userId updatedAt")
      .populate("userId", "fullName")
      .lean();

    return NextResponse.json({ success: true, data: review });
  } catch (err) {
    console.error("[REVIEW_POST_ERROR]", err);
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 }
    );
  }
}
