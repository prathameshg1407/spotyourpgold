// app/api/user/checklist/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import mongoose from "mongoose";
import MoveInChecklist from "@/models/moveInChecklist";

// GET - Fetch checklist for a booking
export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("bookingId");

    if (!bookingId) {
      return NextResponse.json(
        { success: false, message: "Booking ID is required" },
        { status: 400 }
      );
    }

    const checklist = await MoveInChecklist.findOne({
      bookingId: new mongoose.Types.ObjectId(bookingId),
    });

    return NextResponse.json({
      success: true,
      data: checklist,
    });
  } catch (error) {
    console.error("Get checklist error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST - Save/Update checklist
export async function POST(req: NextRequest) {
  try {
    await connectToDB();

    const body = await req.json();
    const { userId, bookingId, items } = body;

    if (!userId || !bookingId || !items) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Calculate completion percentage
    const completedCount = items.filter((item: any) => item.completed).length;
    const completionPercentage = Math.round((completedCount / items.length) * 100);

    // Upsert checklist
    const checklist = await MoveInChecklist.findOneAndUpdate(
      {
        userId: new mongoose.Types.ObjectId(userId),
        bookingId: new mongoose.Types.ObjectId(bookingId),
      },
      {
        userId: new mongoose.Types.ObjectId(userId),
        bookingId: new mongoose.Types.ObjectId(bookingId),
        items,
        completionPercentage,
      },
      {
        upsert: true,
        new: true,
      }
    );

    return NextResponse.json({
      success: true,
      data: checklist,
      message: "Checklist saved successfully",
    });
  } catch (error) {
    console.error("Save checklist error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}