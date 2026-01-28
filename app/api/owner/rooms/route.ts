import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import Room from "@/models/room";
import Listing from "@/models/listing";
import { authUser } from "@/actions/authUser";

// GET - Get all rooms for owner's listings
export async function GET(req: NextRequest) {
  try {
    await connectToDB();
    const user = await authUser();

    if (!user || (user.role !== "owner" && user.role !== "admin")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const listingId = searchParams.get("listingId");
    const status = searchParams.get("status");
    const roomType = searchParams.get("roomType");

    // Build query
    let query: any = {};

    if (listingId) {
      // Get specific listing rooms
      const listing = await Listing.findById(listingId);
      if (!listing || listing.ownerId.toString() !== user.id) {
        return NextResponse.json(
          { success: false, message: "Listing not found or unauthorized" },
          { status: 404 }
        );
      }
      query.listingId = listingId;
    } else {
      // Get all owner's listings' rooms
      const ownerListings = await Listing.find({ ownerId: user.id }).select("_id");
      query.listingId = { $in: ownerListings.map((l) => l._id) };
    }

    if (status) {
      query.status = status;
    }

    if (roomType) {
      query.roomType = roomType;
    }

    const rooms = await Room.find(query)
      .populate("listingId", "pgName location")
      .populate("beds.currentTenantId", "fullName email phone")
      .sort({ roomNumber: 1 });

    // Calculate summary stats
    const totalRooms = rooms.length;
    const totalBeds = rooms.reduce((acc, room) => acc + room.beds.length, 0);
    const occupiedBeds = rooms.reduce((acc, room) => acc + room.occupiedBeds, 0);
    const availableBeds = rooms.reduce((acc, room) => acc + room.availableBeds, 0);

    // Get upcoming vacancies (next 30 days)
    const upcomingVacancyDate = new Date();
    upcomingVacancyDate.setDate(upcomingVacancyDate.getDate() + 30);

    const upcomingVacancies = rooms.reduce((acc, room) => {
      const vacatingBeds = room.beds.filter(
        (bed: any) =>
          bed.expectedVacateDate &&
          new Date(bed.expectedVacateDate) <= upcomingVacancyDate &&
          bed.status === "occupied"
      );
      return acc + vacatingBeds.length;
    }, 0);

    return NextResponse.json({
      success: true,
      data: rooms,
      summary: {
        totalRooms,
        totalBeds,
        occupiedBeds,
        availableBeds,
        upcomingVacancies,
        occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
      },
    });
  } catch (error) {
    console.error("Get rooms error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create rooms for a listing
export async function POST(req: NextRequest) {
  try {
    await connectToDB();
    const user = await authUser();

    if (!user || (user.role !== "owner" && user.role !== "admin")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      listingId,
      roomTypeId,
      roomType,
      rooms, // Array of room configurations
    } = body;

    // Verify ownership
    const listing = await Listing.findById(listingId);
    if (!listing || listing.ownerId.toString() !== user.id) {
      return NextResponse.json(
        { success: false, message: "Listing not found or unauthorized" },
        { status: 404 }
      );
    }

    // Find the room type configuration
    const roomTypeConfig = listing.roomTypes.find(
      (rt: any) => rt._id.toString() === roomTypeId || rt.type === roomType
    );

    if (!roomTypeConfig) {
      return NextResponse.json(
        { success: false, message: "Room type not found in listing" },
        { status: 400 }
      );
    }

    // Create rooms with beds
    const createdRooms = [];

    for (const roomConfig of rooms) {
      // Check if room number already exists
      const existingRoom = await Room.findOne({
        listingId,
        roomNumber: roomConfig.roomNumber,
      });

      if (existingRoom) {
        continue; // Skip duplicate room numbers
      }

      // Generate beds based on capacity
      const beds = [];
      const capacity = roomConfig.capacity || roomTypeConfig.capacityPerRoom;
      
      for (let i = 0; i < capacity; i++) {
        beds.push({
          bedNumber: capacity === 1 ? "Single" : String.fromCharCode(65 + i), // A, B, C...
          status: "available",
          currentTenantId: null,
          currentAllocationId: null,
          occupiedFrom: null,
          expectedVacateDate: null,
          noticeGiven: false,
          noticeDate: null,
        });
      }

      const room = new Room({
        listingId,
        roomTypeId: roomTypeConfig._id,
        roomType: roomTypeConfig.type,
        roomNumber: roomConfig.roomNumber,
        floor: roomConfig.floor || 0,
        capacity,
        beds,
        isAC: roomConfig.isAC || roomTypeConfig.isAC || false,
        hasAttachedBathroom: roomConfig.hasAttachedBathroom || false,
        amenities: roomConfig.amenities || [],
        notes: roomConfig.notes || "",
        monthlyRent: roomConfig.monthlyRent || roomTypeConfig.monthlyRent,
        securityDeposit: roomConfig.securityDeposit || roomTypeConfig.securityDeposit,
      });

      await room.save();
      createdRooms.push(room);
    }

    // Update listing's room count
    await updateListingRoomCounts(listingId);

    return NextResponse.json({
      success: true,
      message: `${createdRooms.length} room(s) created successfully`,
      data: createdRooms,
    });
  } catch (error) {
    console.error("Create rooms error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to update listing room counts
async function updateListingRoomCounts(listingId: string) {
  const rooms = await Room.find({ listingId });

  // Group by room type
  const roomTypeStats: Record<string, { total: number; available: number }> = {};

  rooms.forEach((room) => {
    if (!roomTypeStats[room.roomType]) {
      roomTypeStats[room.roomType] = { total: 0, available: 0 };
    }
    roomTypeStats[room.roomType].total++;
    if (room.status === "available" || room.status === "partial") {
      roomTypeStats[room.roomType].available++;
    }
  });

  // Update listing
  const listing = await Listing.findById(listingId);
  if (listing) {
    listing.roomTypes = listing.roomTypes.map((rt: any) => {
      const stats = roomTypeStats[rt.type];
      if (stats) {
        rt.numberOfRooms = stats.total;
        rt.availableRooms = stats.available;
      }
      return rt;
    });
    await listing.save();
  }
}