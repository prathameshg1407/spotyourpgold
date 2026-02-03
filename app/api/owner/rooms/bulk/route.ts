import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDB } from "@/services/connectdb";
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

/**
 * POST - Bulk create rooms
 */
export async function POST(req: NextRequest) {
  const session = await mongoose.startSession();

  try {
    await connectToDB();
    const user = await authUser();

    if (!user || (user.role !== "owner" && user.role !== "admin")) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await req.json();
    const {
      listingId,
      roomTypeId,
      startNumber,
      count,
      floor,
      capacity,
      isAC,
      hasAttachedBathroom,
      monthlyRent,
      securityDeposit,
      numberingFormat,
    } = body;

    // Validate required fields
    if (!listingId) {
      return errorResponse("Listing ID is required");
    }

    if (!roomTypeId) {
      return errorResponse("Room type ID is required");
    }

    if (!count || count < 1) {
      return errorResponse("Count must be at least 1");
    }

    if (count > 100) {
      return errorResponse("Cannot create more than 100 rooms at once");
    }

    // Verify ownership
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return errorResponse("Listing not found", 404);
    }

    if (listing.ownerId.toString() !== user.id && user.role !== "admin") {
      return errorResponse("Unauthorized", 403);
    }

    // Find room type configuration
    const roomTypeConfig = listing.roomTypes?.find(
      (rt: any) => rt._id.toString() === roomTypeId
    );

    if (!roomTypeConfig) {
      return errorResponse("Room type not found in listing");
    }

    session.startTransaction();

    const result = await RoomService.bulkCreateRooms(
      {
        listingId,
        roomTypeId,
        roomType: roomTypeConfig.type,
        startNumber: startNumber || 1,
        count,
        floor,
        capacity: capacity || roomTypeConfig.capacityPerRoom,
        isAC: isAC ?? roomTypeConfig.isAC,
        hasAttachedBathroom,
        monthlyRent: monthlyRent || roomTypeConfig.monthlyRent,
        securityDeposit: securityDeposit || roomTypeConfig.securityDeposit,
        numberingFormat: numberingFormat || "numeric",
      },
      session
    );

    if (!result.success) {
      await session.abortTransaction();
      return errorResponse(
        result.errors.length > 0
          ? result.errors.join(", ")
          : "Failed to create rooms"
      );
    }

    await session.commitTransaction();

    return jsonResponse({
      success: true,
      message: `Created ${result.created} rooms${
        result.skipped > 0 ? `, skipped ${result.skipped} duplicates` : ""
      }`,
      data: {
        created: result.created,
        skipped: result.skipped,
        rooms: result.rooms,
        errors: result.errors.length > 0 ? result.errors : undefined,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Bulk create rooms error:", error);
    return errorResponse("Internal server error", 500);
  } finally {
    session.endSession();
  }
}