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

function errorResponse(message: string, status: number = 400) {
  return jsonResponse({ success: false, message }, status);
}

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST - Vacate tenant from a bed
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
      bedNumber,
      actualMoveOutDate,
      refundAmount,
      deductions,
      notes,
    } = body;

    if (!bedNumber) {
      return errorResponse("Bed number is required");
    }

    session.startTransaction();

    const result = await AllocationService.vacateTenant(
      {
        roomId,
        bedNumber,
        actualMoveOutDate,
        refundAmount,
        deductions,
        vacatedBy: user.id,
        notes,
      },
      session
    );

    if (!result.success) {
      await session.abortTransaction();
      return errorResponse(result.error || "Failed to vacate tenant");
    }

    await session.commitTransaction();

    return jsonResponse({
      success: true,
      message: "Tenant vacated successfully",
      data: {
        allocation: result.allocation,
        refundAmount: result.refundAmount,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Vacate tenant error:", error);
    return errorResponse("Internal server error", 500);
  } finally {
    session.endSession();
  }
}

/**
 * PUT - Record notice period
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
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
    const { bedNumber, expectedVacateDate, reason } = body;

    if (!bedNumber) {
      return errorResponse("Bed number is required");
    }

    if (!expectedVacateDate) {
      return errorResponse("Expected vacate date is required");
    }

    session.startTransaction();

    const result = await AllocationService.recordNotice(
      {
        roomId,
        bedNumber,
        expectedVacateDate,
        reason,
        recordedBy: user.id,
      },
      session
    );

    if (!result.success) {
      await session.abortTransaction();
      return errorResponse(result.error || "Failed to record notice");
    }

    await session.commitTransaction();

    return jsonResponse({
      success: true,
      message: "Notice period recorded successfully",
      data: result.allocation,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Record notice error:", error);
    return errorResponse("Internal server error", 500);
  } finally {
    session.endSession();
  }
}