import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDB } from "@/services/connectdb";
import TenantAllocation from "@/models/tenantAllocation";
import Room from "@/models/room";
import Listing from "@/models/listing";
import { authUser } from "@/actions/authUser";
import AllocationService from "@/services/allocationService";
import {
  createNotification,
  NotificationTemplates,
} from "@/lib/utils/notificationHelper";

// Response helpers
function jsonResponse(data: object, status: number = 200) {
  return NextResponse.json(data, { status });
}

function errorResponse(message: string, status: number = 400) {
  return jsonResponse({ success: false, message }, status);
}

/**
 * GET - Get user's current allocation
 */
export async function GET(req: NextRequest) {
  try {
    await connectToDB();
    const user = await authUser();

    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const result = await AllocationService.getTenantAllocation(user.id);

    if (!result.allocation) {
      return jsonResponse({
        success: true,
        data: null,
        message: "No active allocation found",
      });
    }

    // Get room details
    const room = await Room.findById(result.allocation.roomId).lean();

    // Get listing details
    const listing = await Listing.findById(result.allocation.listingId)
      .select("pgName location amenities detailedRules mealTimings rentInclusions images primaryImage")
      .lean();

    return jsonResponse({
      success: true,
      data: {
        allocation: {
          ...result.allocation.toObject(),
          room: room
            ? {
                roomNumber: room.roomNumber,
                roomType: room.roomType,
                floor: room.floor,
                isAC: room.isAC,
                hasAttachedBathroom: room.hasAttachedBathroom,
                amenities: room.amenities,
              }
            : null,
          listing,
        },
        roommates: result.roommates,
        nextRentDue: result.nextRentDue,
      },
    });
  } catch (error) {
    console.error("Get allocation error:", error);
    return errorResponse("Internal server error", 500);
  }
}

/**
 * POST - Give notice (tenant initiating move-out)
 */
export async function POST(req: NextRequest) {
  const session = await mongoose.startSession();

  try {
    await connectToDB();
    const user = await authUser();

    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const { expectedVacateDate, reason } = await req.json();

    if (!expectedVacateDate) {
      return errorResponse("Expected vacate date is required");
    }

    // Get active allocation
    const allocation = await TenantAllocation.findOne({
      tenantId: user.id,
      status: "active",
    });

    if (!allocation) {
      return errorResponse("No active allocation found", 404);
    }

    // Validate notice period
    const vacateDate = new Date(expectedVacateDate);
    const today = new Date();
    const daysDifference = Math.ceil(
      (vacateDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDifference < allocation.noticePeriodDays) {
      return errorResponse(
        `Minimum notice period is ${allocation.noticePeriodDays} days. Please select a date at least ${allocation.noticePeriodDays} days from today.`
      );
    }

    session.startTransaction();

    // Update allocation
    allocation.status = "notice_period";
    allocation.noticeGivenDate = today;
    allocation.expectedVacateDate = vacateDate;
    allocation.vacationReason = reason || "";
    allocation.lastModifiedBy = new mongoose.Types.ObjectId(user.id);

    await allocation.save({ session });

    // Update room bed
    const room = await Room.findById(allocation.roomId).session(session);
    if (room) {
      const bedIndex = room.beds.findIndex(
        (b) => b.bedNumber === allocation.bedNumber
      );
      if (bedIndex !== -1) {
        room.beds[bedIndex].noticeGiven = true;
        room.beds[bedIndex].noticeDate = today;
        room.beds[bedIndex].expectedVacateDate = vacateDate;
        await room.save({ session });
      }
    }

    // Notify owner
    const listing = await Listing.findById(allocation.listingId).session(session);
    if (listing) {
      const ownerNotif = NotificationTemplates.noticeGivenToOwner(
        allocation.pgName,
        allocation.roomNumber,
        allocation.bedNumber,
        vacateDate
      );

      await createNotification({
        userId: listing.ownerId,
        type: ownerNotif.type,
        title: ownerNotif.title,
        message: ownerNotif.message,
        relatedId: allocation._id,
        relatedType: "allocation",
        priority: "high",
        metadata: {
          roomNumber: allocation.roomNumber,
          bedNumber: allocation.bedNumber,
          vacateDate,
          reason: reason || "",
          tenantId: user.id,
        },
        session,
      });
    }

    await session.commitTransaction();

    return jsonResponse({
      success: true,
      message: "Notice period recorded successfully",
      data: {
        noticeGivenDate: today,
        expectedVacateDate: vacateDate,
        noticePeriodDays: allocation.noticePeriodDays,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Give notice error:", error);
    return errorResponse("Internal server error", 500);
  } finally {
    session.endSession();
  }
}

/**
 * PUT - Cancel notice (if within allowed period)
 */
export async function PUT(req: NextRequest) {
  const session = await mongoose.startSession();

  try {
    await connectToDB();
    const user = await authUser();

    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    // Get allocation in notice period
    const allocation = await TenantAllocation.findOne({
      tenantId: user.id,
      status: "notice_period",
    });

    if (!allocation) {
      return errorResponse("No notice period to cancel", 404);
    }

    // Check if cancellation is allowed (within 48 hours of giving notice)
    const noticeDate = new Date(allocation.noticeGivenDate!);
    const hoursSinceNotice =
      (Date.now() - noticeDate.getTime()) / (1000 * 60 * 60);

    if (hoursSinceNotice > 48) {
      return errorResponse(
        "Notice can only be cancelled within 48 hours of submission"
      );
    }

    session.startTransaction();

    // Reset allocation
    allocation.status = "active";
    allocation.noticeGivenDate = null;
    allocation.expectedVacateDate = null;
    allocation.vacationReason = "";
    allocation.lastModifiedBy = new mongoose.Types.ObjectId(user.id);

    await allocation.save({ session });

    // Reset room bed
    const room = await Room.findById(allocation.roomId).session(session);
    if (room) {
      const bedIndex = room.beds.findIndex(
        (b) => b.bedNumber === allocation.bedNumber
      );
      if (bedIndex !== -1) {
        room.beds[bedIndex].noticeGiven = false;
        room.beds[bedIndex].noticeDate = null;
        room.beds[bedIndex].expectedVacateDate = null;
        await room.save({ session });
      }
    }

    // Notify owner
    const listing = await Listing.findById(allocation.listingId).session(session);
    if (listing) {
      await createNotification({
        userId: listing.ownerId,
        type: "general",
        title: "Notice Cancelled",
        message: `Tenant in Room ${allocation.roomNumber}, Bed ${allocation.bedNumber} at ${allocation.pgName} has cancelled their notice.`,
        relatedId: allocation._id,
        relatedType: "allocation",
        priority: "medium",
        session,
      });
    }

    await session.commitTransaction();

    return jsonResponse({
      success: true,
      message: "Notice cancelled successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Cancel notice error:", error);
    return errorResponse("Internal server error", 500);
  } finally {
    session.endSession();
  }
}