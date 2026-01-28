import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import Room from "@/models/room";
import Listing from "@/models/listing";
import { authUser } from "@/actions/authUser";

// POST - Bulk create rooms
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

    const {
      listingId,
      roomType,
      startNumber,
      count,
      floor,
      capacity,
      isAC,
      hasAttachedBathroom,
      monthlyRent,
      securityDeposit,
      numberingFormat, // "numeric" (101, 102) or "alpha" (A1, A2) or "floor-based" (101, 102, 201, 202)
    } = await req.json();

    // Validate
    if (!listingId || !roomType || !count || count < 1 || count > 100) {
      return NextResponse.json(
        { success: false, message: "Invalid parameters. Count must be 1-100." },
        { status: 400 }
      );
    }

    // Verify ownership
    const listing = await Listing.findById(listingId);
    if (!listing || listing.ownerId.toString() !== user.id) {
      return NextResponse.json(
        { success: false, message: "Listing not found or unauthorized" },
        { status: 404 }
      );
    }

    // Find room type config
    const roomTypeConfig = listing.roomTypes.find(
      (rt: any) => rt.type.toLowerCase() === roomType.toLowerCase()
    );

    if (!roomTypeConfig) {
      return NextResponse.json(
        { success: false, message: "Room type not found in listing" },
        { status: 400 }
      );
    }

    // Get existing room numbers
    const existingRooms = await Room.find({ listingId }).select("roomNumber");
    const existingNumbers = new Set(existingRooms.map((r) => r.roomNumber));

    // Generate room numbers
    const roomsToCreate = [];
    let created = 0;
    let skipped = 0;
    let currentNumber = parseInt(startNumber) || 1;

    for (let i = 0; i < count && created < count; i++) {
      let roomNumber: string;

      switch (numberingFormat) {
        case "alpha":
          roomNumber = `${String.fromCharCode(65 + Math.floor(currentNumber / 10))}${currentNumber % 10 || 10}`;
          break;
        case "floor-based":
          const floorNum = floor || Math.floor(currentNumber / 100) || 1;
          const roomNum = currentNumber % 100 || 1;
          roomNumber = `${floorNum}${roomNum.toString().padStart(2, "0")}`;
          break;
        default: // numeric
          roomNumber = currentNumber.toString();
      }

      currentNumber++;

      if (existingNumbers.has(roomNumber)) {
        skipped++;
        continue;
      }

      // Generate beds
      const roomCapacity = capacity || roomTypeConfig.capacityPerRoom || 1;
      const beds = [];
      for (let j = 0; j < roomCapacity; j++) {
        beds.push({
          bedNumber: roomCapacity === 1 ? "Single" : String.fromCharCode(65 + j),
          status: "available",
          currentTenantId: null,
          currentAllocationId: null,
          occupiedFrom: null,
          expectedVacateDate: null,
          noticeGiven: false,
          noticeDate: null,
        });
      }

      roomsToCreate.push({
        listingId,
        roomTypeId: roomTypeConfig._id,
        roomType: roomTypeConfig.type,
        roomNumber,
        floor: floor || Math.floor(parseInt(roomNumber) / 100) || 0,
        capacity: roomCapacity,
        beds,
        isAC: isAC ?? roomTypeConfig.isAC ?? false,
        hasAttachedBathroom: hasAttachedBathroom ?? false,
        amenities: [],
        notes: "",
        monthlyRent: monthlyRent || roomTypeConfig.monthlyRent,
        securityDeposit: securityDeposit || roomTypeConfig.securityDeposit,
      });

      created++;
    }

    // Bulk insert
    const createdRooms = await Room.insertMany(roomsToCreate);

    // Update listing room counts
    const allRooms = await Room.find({ listingId });
    const roomTypeCounts: Record<string, { total: number; available: number }> = {};

    allRooms.forEach((room) => {
      if (!roomTypeCounts[room.roomType]) {
        roomTypeCounts[room.roomType] = { total: 0, available: 0 };
      }
      roomTypeCounts[room.roomType].total++;
      if (room.availableBeds > 0) {
        roomTypeCounts[room.roomType].available++;
      }
    });

    listing.roomTypes = listing.roomTypes.map((rt: any) => {
      const counts = roomTypeCounts[rt.type];
      if (counts) {
        rt.numberOfRooms = counts.total;
        rt.availableRooms = counts.available;
      }
      return rt;
    });
    await listing.save();

    return NextResponse.json({
      success: true,
      message: `Created ${created} rooms${skipped > 0 ? `, skipped ${skipped} duplicates` : ""}`,
      data: {
        created: createdRooms.length,
        skipped,
        rooms: createdRooms,
      },
    });
  } catch (error) {
    console.error("Bulk create rooms error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}