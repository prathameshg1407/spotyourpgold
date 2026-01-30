import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDB } from "@/services/connectdb";
import Room from "@/models/room";
import Listing from "@/models/listing";
import { authUser } from "@/actions/authUser";
import RoomService from "@/services/roomService";

// Response helper
function jsonResponse(data: object, status: number = 200) {
  return NextResponse.json(data, { status });
}

// Error response helper
function errorResponse(message: string, status: number = 400) {
  return jsonResponse({ success: false, message }, status);
}

/**
 * GET - Get all rooms for owner's listings
 */
export async function GET(req: NextRequest) {
  try {
    await connectToDB();
    const user = await authUser();

    if (!user || (user.role !== "owner" && user.role !== "admin")) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(req.url);
    const listingId = searchParams.get("listingId");
    const status = searchParams.get("status");
    const roomType = searchParams.get("roomType");
    const floor = searchParams.get("floor");
    const hasAvailableBeds = searchParams.get("hasAvailableBeds") === "true";

    // Build listing filter
    let listingIds: string[];

    if (listingId) {
      // Verify ownership of specific listing
      const listing = await Listing.findById(listingId);
      if (!listing) {
        return errorResponse("Listing not found", 404);
      }
      if (listing.ownerId.toString() !== user.id && user.role !== "admin") {
        return errorResponse("Unauthorized", 403);
      }
      listingIds = [listingId];
    } else {
      // Get all owner's listings
      const ownerListings = await Listing.find({ ownerId: user.id }).select("_id");
      listingIds = ownerListings.map((l) => l._id.toString());
    }

    // Get rooms with filters
    const rooms = await Promise.all(
      listingIds.map((lid) =>
        RoomService.getRoomsByListing(lid, {
          status: status || undefined,
          roomType: roomType || undefined,
          floor: floor ? parseInt(floor) : undefined,
          hasAvailableBeds,
        })
      )
    );

    const allRooms = rooms.flat();

    // Calculate summary
    const summary = {
      totalRooms: allRooms.length,
      totalBeds: allRooms.reduce((acc, r) => acc + r.beds.length, 0),
      occupiedBeds: allRooms.reduce((acc, r) => acc + r.occupiedBeds, 0),
      availableBeds: allRooms.reduce((acc, r) => acc + r.availableBeds, 0),
      reservedBeds: allRooms.reduce((acc, r) => acc + r.reservedBeds, 0),
      maintenanceBeds: allRooms.reduce(
        (acc, r) => acc + r.beds.filter((b) => b.status === "maintenance").length,
        0
      ),
      occupancyRate: 0,
      upcomingVacancies: 0,
    };

    // Calculate occupancy rate
    const occupiableBeads = summary.totalBeds - summary.maintenanceBeds;
    summary.occupancyRate =
      occupiableBeads > 0
        ? Math.round((summary.occupiedBeds / occupiableBeads) * 100)
        : 0;

    // Count upcoming vacancies (next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    allRooms.forEach((room) => {
      room.beds.forEach((bed) => {
        if (
          bed.expectedVacateDate &&
          new Date(bed.expectedVacateDate) <= thirtyDaysFromNow &&
          bed.status === "occupied"
        ) {
          summary.upcomingVacancies++;
        }
      });
    });

    return jsonResponse({
      success: true,
      data: allRooms,
      summary,
    });
  } catch (error) {
    console.error("Get rooms error:", error);
    return errorResponse("Internal server error", 500);
  }
}

/**
 * POST - Create rooms for a listing
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
    const { listingId, roomTypeId, rooms } = body;

    // Validate required fields
    if (!listingId) {
      return errorResponse("Listing ID is required");
    }

    if (!roomTypeId) {
      return errorResponse("Room type ID is required");
    }

    if (!rooms || !Array.isArray(rooms) || rooms.length === 0) {
      return errorResponse("At least one room configuration is required");
    }

    if (rooms.length > 50) {
      return errorResponse("Cannot create more than 50 rooms at once");
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
      return errorResponse(
        "Room type not found. Please select a valid room type from the listing."
      );
    }

    session.startTransaction();

    const createdRooms: any[] = [];
    const errors: string[] = [];

    for (const roomConfig of rooms) {
      const result = await RoomService.createRoom(
        {
          listingId,
          roomTypeId,
          roomType: roomTypeConfig.type,
          roomNumber: roomConfig.roomNumber,
          floor: roomConfig.floor,
          capacity: roomConfig.capacity || roomTypeConfig.capacityPerRoom,
          isAC: roomConfig.isAC ?? roomTypeConfig.isAC,
          hasAttachedBathroom: roomConfig.hasAttachedBathroom,
          amenities: roomConfig.amenities,
          notes: roomConfig.notes,
          monthlyRent: roomConfig.monthlyRent || roomTypeConfig.monthlyRent,
          securityDeposit: roomConfig.securityDeposit || roomTypeConfig.securityDeposit,
        },
        session
      );

      if (result.success && result.room) {
        createdRooms.push(result.room);
      } else {
        errors.push(result.error || `Failed to create room ${roomConfig.roomNumber}`);
      }
    }

    if (createdRooms.length === 0) {
      await session.abortTransaction();
      return errorResponse(`No rooms created. Errors: ${errors.join(", ")}`);
    }

    await session.commitTransaction();

    return jsonResponse({
      success: true,
      message: `${createdRooms.length} room(s) created successfully${
        errors.length > 0 ? `. ${errors.length} failed.` : ""
      }`,
      data: {
        created: createdRooms,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Create rooms error:", error);
    return errorResponse("Internal server error", 500);
  } finally {
    session.endSession();
  }
}