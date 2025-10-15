import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import Notification from "@/models/notification";
import { authUser } from "@/actions/authUser";

// Get user notifications
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
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const perPage = Math.min(Number(searchParams.get("per_page") || "20"), 50);
    const unreadOnly = searchParams.get("unread_only") === "true";

    // Build query
    const query: any = { userId: user.id };
    if (unreadOnly) {
      query.isRead = false;
    }

    // Get total count
    const total = await Notification.countDocuments(query);

    // Get notifications with pagination
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    const totalPages = Math.ceil(total / perPage);

    return NextResponse.json({
      success: true,
      data: notifications,
      total,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
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

// Create notification
export async function POST(req: NextRequest) {
  try {
    await connectToDB();

    const user = await authUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const {
      userId,
      type,
      title,
      message,
      relatedId,
      relatedType,
      priority = "medium",
      metadata = {},
    } = await req.json();

    // Validate required fields
    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const notification = new Notification({
      userId,
      type,
      title,
      message,
      relatedId,
      relatedType,
      priority,
      metadata,
    });

    await notification.save();

    return NextResponse.json({
      success: true,
      message: "Notification created successfully",
      data: notification,
    });
  } catch (error) {
    console.error("Create notification error:", error);
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
