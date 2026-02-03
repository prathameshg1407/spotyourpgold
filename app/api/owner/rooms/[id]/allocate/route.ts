import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDB } from "@/services/connectdb";
import Room from "@/models/room";
import Listing from "@/models/listing";
import { authUser } from "@/actions/authUser";
import AllocationService from "@/services/allocationService";

// Response helpers
function jsonResponse(data: object, status: number = 200) {
  return NextResponse.json(data, { status });
}

function errorResponse(message: string, status: number = 400, errors?: string[]) {
  return jsonResponse({ success: false, message, errors }, status);
}

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST - Allocate tenant to a bed
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  const session = await mongoose.startSession();

  try {
    await connectToDB();
    const user = await authUser();
    const { id: roomId } = await params;

    if (!user || (user.role !== "owner" && user.role !== "admin")) {
      return errorResponse("Unauthorized", 401);
    }

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return errorResponse("Invalid room ID");
    }

    // Verify ownership
    const room = await Room.findById(roomId);
    if (!room) {
      return errorResponse("Room not found", 404);
    }

    const listing = await Listing.findById(room.listingId);
    if (!listing) {
      return errorResponse("Listing not found", 404);
    }

    if (listing.ownerId.toString() !== user.id && user.role !== "admin") {
      return errorResponse("Unauthorized", 403);
    }

    const body = await req.json();
    const {
      bookingId,
      bedNumber,
      moveInDate,
      expectedMoveOutDate,
      noticePeriodDays,
    } = body;

    // Validate required fields
    if (!bookingId) {
      return errorResponse("Booking ID is required");
    }

    if (!bedNumber) {
      return errorResponse("Bed number is required");
    }

    session.startTransaction();

    const result = await AllocationService.allocateTenant(
      {
        roomId,
        bookingId,
        bedNumber,
        moveInDate,
        expectedMoveOutDate,
        noticePeriodDays,
        allocatedBy: user.id,
      },
      session
    );

    if (!result.success) {
      await session.abortTransaction();
      return errorResponse(
        result.error || "Failed to allocate tenant",
        400,
        result.errors
      );
    }

    await session.commitTransaction();

    return jsonResponse({
      success: true,
      message: "Tenant allocated successfully",
      data: result.allocation,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Allocate tenant error:", error);
    return errorResponse("Internal server error", 500);
  } finally {
    session.endSession();
  }
}

/**
 * GET - Get available beds for allocation
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    await connectToDB();
    const user = await authUser();
    const { id: roomId } = await params;

    if (!user || (user.role !== "owner" && user.role !== "admin")) {
      return errorResponse("Unauthorized", 401);
    }

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return errorResponse("Invalid room ID");
    }

    const room = await Room.findById(roomId)
      .populate("listingId", "pgName ownerId")
      .lean();

    if (!room) {
      return errorResponse("Room not found", 404);
    }

    const listing = room.listingId as any;
    if (listing.ownerId.toString() !== user.id && user.role !== "admin") {
      return errorResponse("Unauthorized", 403);
    }

    const availableBeds = room.beds
      .filter((bed: any) => bed.status === "available")
      .map((bed: any) => ({
        bedNumber: bed.bedNumber,
        bedLabel: bed.bedLabel,
      }));

    return jsonResponse({
      success: true,
      data: {
        roomNumber: room.roomNumber,
        roomType: room.roomType,
        monthlyRent: room.monthlyRent,
        securityDeposit: room.securityDeposit,
        availableBeds,
        totalBeds: room.beds.length,
        occupiedBeds: room.occupiedBeds,
      },
    });
  } catch (error) {
    console.error("Get available beds error:", error);
    return errorResponse("Internal server error", 500);
  }
}