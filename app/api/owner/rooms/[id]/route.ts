import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDB } from "@/services/connectdb";
import Room from "@/models/room";
import Listing from "@/models/listing";
import { authUser } from "@/actions/authUser";
import RoomService from "@/services/roomService";

// Response helpers
function jsonResponse(data: object, status: number = 200) {
  return NextResponse.json(data, { status });
}

function errorResponse(message: string, status: number = 400) {
  return jsonResponse({ success: false, message }, status);
}

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET - Get single room details
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    await connectToDB();
    const user = await authUser();
    const { id } = await params;

    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid room ID");
    }

    const room = await RoomService.getRoomWithOccupancy(id);

    if (!room) {
      return errorResponse("Room not found", 404);
    }

    // Verify ownership
    const listing = room.listingId as any;
    if (
      listing.ownerId.toString() !== user.id &&
      user.role !== "admin"
    ) {
      return errorResponse("Unauthorized", 403);
    }

    return jsonResponse({
      success: true,
      data: room,
    });
  } catch (error) {
    console.error("Get room error:", error);
    return errorResponse("Internal server error", 500);
  }
}

/**
 * PUT - Update room details
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const session = await mongoose.startSession();

  try {
    await connectToDB();
    const user = await authUser();
    const { id } = await params;

    if (!user || (user.role !== "owner" && user.role !== "admin")) {
      return errorResponse("Unauthorized", 401);
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid room ID");
    }

    const updates = await req.json();

    session.startTransaction();

    const result = await RoomService.updateRoom(id, updates, user.id, session);

    if (!result.success) {
      await session.abortTransaction();
      return errorResponse(result.error || "Failed to update room");
    }

    await session.commitTransaction();

    return jsonResponse({
      success: true,
      message: "Room updated successfully",
      data: result.room,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Update room error:", error);
    return errorResponse("Internal server error", 500);
  } finally {
    session.endSession();
  }
}

/**
 * DELETE - Delete a room
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const session = await mongoose.startSession();

  try {
    await connectToDB();
    const user = await authUser();
    const { id } = await params;

    if (!user || (user.role !== "owner" && user.role !== "admin")) {
      return errorResponse("Unauthorized", 401);
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid room ID");
    }

    session.startTransaction();

    const result = await RoomService.deleteRoom(id, user.id, session);

    if (!result.success) {
      await session.abortTransaction();
      return errorResponse(result.error || "Failed to delete room");
    }

    await session.commitTransaction();

    return jsonResponse({
      success: true,
      message: "Room deleted successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Delete room error:", error);
    return errorResponse("Internal server error", 500);
  } finally {
    session.endSession();
  }
}

/**
 * PATCH - Partial updates (maintenance, etc.)
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await mongoose.startSession();

  try {
    await connectToDB();
    const user = await authUser();
    const { id } = await params;

    if (!user || (user.role !== "owner" && user.role !== "admin")) {
      return errorResponse("Unauthorized", 401);
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid room ID");
    }

    const { action, bedNumber, ...data } = await req.json();

    session.startTransaction();

    let result: { success: boolean; room?: any; error?: string };

    switch (action) {
      case "set_maintenance":
        if (!bedNumber) {
          return errorResponse("Bed number is required");
        }
        result = await RoomService.setBedMaintenance(
          id,
          bedNumber,
          true,
          user.id,
          session
        );
        break;

      case "remove_maintenance":
        if (!bedNumber) {
          return errorResponse("Bed number is required");
        }
        result = await RoomService.setBedMaintenance(
          id,
          bedNumber,
          false,
          user.id,
          session
        );
        break;

      default:
        return errorResponse(`Invalid action: ${action}`);
    }

    if (!result.success) {
      await session.abortTransaction();
      return errorResponse(result.error || "Action failed");
    }

    await session.commitTransaction();

    return jsonResponse({
      success: true,
      message: `Action '${action}' completed successfully`,
      data: result.room,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Patch room error:", error);
    return errorResponse("Internal server error", 500);
  } finally {
    session.endSession();
  }
}