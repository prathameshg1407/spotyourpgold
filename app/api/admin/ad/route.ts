import authUser from "@/actions/authUser";
import Ad from "@/models/ad";
import { connectToDB } from "@/services/connectdb";
import { NextRequest, NextResponse } from "next/server";

// POST /dashboard/admin/ad
export async function POST(req: NextRequest) {
  try {
    await connectToDB();
    const data = await req.json();

    const user = await authUser();

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" });
    }

    if (!data.title) {
      return NextResponse.json({ error: "Missing required fields" });
    }

    // Remove existing ad if any
    await Ad.deleteMany({});

    // Create new ad
    const newAd = await Ad.create({
      title: data.title,
    });

    return NextResponse.json({
      success: true,
      message: "Ad created successfully",
    });
  } catch (error) {
    console.error("[POST_AD_ERROR]", error);
    return NextResponse.json({ error: "Failed to create ad" });
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    const ad = await Ad.findOne({});

    if (!ad) {
      return NextResponse.json({ success: false, message: "No ad found" });
    }

    return NextResponse.json({
      success: true,
      message: "Ad gotten successfully",
      data: ad,
    });
  } catch (error) {
    console.error("[POST_AD_ERROR]", error);
    return NextResponse.json({ error: "Failed to create ad" });
  }
}
