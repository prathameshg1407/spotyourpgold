import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDB } from "@/services/connectdb";
import TenantAllocation from "@/models/tenantAllocation";
import Room from "@/models/room";
import Listing from "@/models/listing";
import { authUser } from "@/actions/authUser";
import AllocationService from "@/services/allocationService";
import { createNotification } from "@/lib/utils/notificationHelper";

// Response helpers
function jsonResponse(data: object, status: number = 200) {
  return NextResponse.json(data, { status });
}

function errorResponse(message: string, status: number = 400) {
  return jsonResponse({ success: false, message }, status);
}

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET - Get single tenant allocation details
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    await connectToDB();
    const user = await authUser();
    const { id } = await params;

    if (!user || (user.role !== "owner" && user.role !== "admin")) {
      return errorResponse("Unauthorized", 401);
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid allocation ID");
    }

    const allocation = await AllocationService.getAllocationDetails(id);

    if (!allocation) {
      return errorResponse("Allocation not found", 404);
    }

    // Verify ownership
    const listing = allocation.listingId as any;
    if (listing.ownerId.toString() !== user.id && user.role !== "admin") {
      return errorResponse("Unauthorized", 403);
    }

    // Get room details
    const room = await Room.findById(allocation.roomId);

    return jsonResponse({
      success: true,
      data: {
        allocation,
        room: room
          ? {
              roomNumber: room.roomNumber,
              roomType: room.roomType,
              floor: room.floor,
              isAC: room.isAC,
              hasAttachedBathroom: room.hasAttachedBathroom,
              amenities: room.amenities,
              monthlyRent: room.monthlyRent,
              capacity: room.capacity,
              occupiedBeds: room.occupiedBeds,
              availableBeds: room.availableBeds,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Get tenant details error:", error);
    return errorResponse("Internal server error", 500);
  }
}

/**
 * PATCH - Update tenant allocation (record notice, extend stay, etc.)
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
      return errorResponse("Invalid allocation ID");
    }

    const { action, ...data } = await req.json();

    if (!action) {
      return errorResponse("Action is required");
    }

    // Get allocation and verify ownership
    const allocation = await TenantAllocation.findById(id).populate(
      "listingId",
      "ownerId pgName"
    );

    if (!allocation) {
      return errorResponse("Allocation not found", 404);
    }

    const listing = allocation.listingId as any;
    if (listing.ownerId.toString() !== user.id && user.role !== "admin") {
      return errorResponse("Unauthorized", 403);
    }

    session.startTransaction();

    let result: { success: boolean; allocation?: any; error?: string };

    switch (action) {
      case "record_notice":
        if (!data.expectedVacateDate) {
          return errorResponse("Expected vacate date is required");
        }
        result = await AllocationService.recordNotice(
          {
            roomId: allocation.roomId.toString(),
            bedNumber: allocation.bedNumber,
            expectedVacateDate: data.expectedVacateDate,
            reason: data.reason,
            recordedBy: user.id,
          },
          session
        );
        break;

      case "extend_stay":
        if (!data.months || data.months < 1) {
          return errorResponse("Extension months must be at least 1");
        }
        result = await AllocationService.extendStay(
          id,
          data.months,
          data.reason || "",
          user.id,
          session
        );
        break;

      case "transfer":
        if (!data.newRoomId || !data.newBedNumber) {
          return errorResponse("New room ID and bed number are required");
        }
        result = await AllocationService.transferTenant(
          id,
          data.newRoomId,
          data.newBedNumber,
          data.transferDate ? new Date(data.transferDate) : new Date(),
          data.reason || "",
          user.id,
          session
        );
        break;

      case "update_notes":
        allocation.ownerNotes = data.notes || "";
        allocation.lastModifiedBy = new mongoose.Types.ObjectId(user.id);
        await allocation.save({ session });
        result = { success: true, allocation };
        break;

      case "process_move_out":
        result = await AllocationService.vacateTenant(
          {
            roomId: allocation.roomId.toString(),
            bedNumber: allocation.bedNumber,
            actualMoveOutDate: data.moveOutDate,
            refundAmount: data.refundAmount,
            deductions: data.deductions,
            vacatedBy: user.id,
            notes: data.notes,
          },
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
      data: result.allocation,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Update tenant error:", error);
    return errorResponse("Internal server error", 500);
  } finally {
    session.endSession();
  }
}