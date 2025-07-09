// app/api/reviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import Review from "@/models/review";
import authUser from "@/actions/authUser";

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
    ).select("rating comment userId updatedAt").populate("userId", "fullName").lean();

    return NextResponse.json({ success: true, data: review });
  } catch (err) {
    console.error("[REVIEW_POST_ERROR]", err);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
