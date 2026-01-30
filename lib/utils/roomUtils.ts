import { ClientSession } from "mongoose";
import Room from "@/models/room";
import Listing from "@/models/listing";

/**
 * Room type availability statistics
 */
export interface RoomTypeStats {
  type: string;
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  reservedBeds: number;
  occupancyRate: number;
}

/**
 * Update listing room availability counts
 */
export async function updateListingAvailability(
  listingId: string,
  session?: ClientSession
): Promise<void> {
  const rooms = await Room.find({ listingId, isActive: true }).session(
    session || null
  );

  // Calculate stats per room type
  const roomTypeStats: Record<string, RoomTypeStats> = {};

  rooms.forEach((room) => {
    if (!roomTypeStats[room.roomType]) {
      roomTypeStats[room.roomType] = {
        type: room.roomType,
        totalRooms: 0,
        totalBeds: 0,
        occupiedBeds: 0,
        availableBeds: 0,
        reservedBeds: 0,
        occupancyRate: 0,
      };
    }

    const stats = roomTypeStats[room.roomType];
    stats.totalRooms++;
    stats.totalBeds += room.beds.length;
    stats.occupiedBeds += room.occupiedBeds;
    stats.availableBeds += room.availableBeds;
    stats.reservedBeds += room.reservedBeds;
  });

  // Calculate occupancy rates
  Object.values(roomTypeStats).forEach((stats) => {
    stats.occupancyRate =
      stats.totalBeds > 0
        ? Math.round((stats.occupiedBeds / stats.totalBeds) * 100)
        : 0;
  });

  // Update listing
  const listing = await Listing.findById(listingId).session(session || null);

  if (listing && listing.roomTypes) {
    listing.roomTypes = listing.roomTypes.map((rt: any) => {
      const stats = roomTypeStats[rt.type];
      if (stats) {
        rt.numberOfRooms = stats.totalRooms;
        rt.availableRooms = rooms.filter(
          (r) => r.roomType === rt.type && r.availableBeds > 0
        ).length;
      }
      return rt;
    });

    await listing.save({ session });
  }
}

/**
 * Generate room number based on format
 */
export function generateRoomNumber(
  format: "numeric" | "alpha" | "floor-based",
  index: number,
  floor?: number,
  startNumber?: number
): string {
  const baseNumber = (startNumber || 1) + index;

  switch (format) {
    case "alpha":
      const letterIndex = Math.floor(baseNumber / 10);
      const numberPart = baseNumber % 10 || 10;
      return `${String.fromCharCode(65 + letterIndex)}${numberPart}`;

    case "floor-based":
      const floorNum = floor || Math.floor(baseNumber / 100) || 1;
      const roomNum = baseNumber % 100 || 1;
      return `${floorNum}${roomNum.toString().padStart(2, "0")}`;

    default: // numeric
      return baseNumber.toString();
  }
}

/**
 * Generate bed labels based on capacity
 */
export function generateBedLabels(capacity: number): string[] {
  if (capacity === 1) {
    return ["Single"];
  }

  return Array.from({ length: capacity }, (_, i) =>
    String.fromCharCode(65 + i)
  );
}

/**
 * Validate room data
 */
export interface RoomValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateRoomData(data: {
  roomNumber?: string;
  capacity?: number;
  monthlyRent?: number;
  securityDeposit?: number;
}): RoomValidationResult {
  const errors: string[] = [];

  if (!data.roomNumber || data.roomNumber.trim() === "") {
    errors.push("Room number is required");
  }

  if (!data.capacity || data.capacity < 1) {
    errors.push("Capacity must be at least 1");
  } else if (data.capacity > 20) {
    errors.push("Capacity cannot exceed 20");
  }

  if (data.monthlyRent !== undefined && data.monthlyRent < 0) {
    errors.push("Monthly rent cannot be negative");
  }

  if (data.securityDeposit !== undefined && data.securityDeposit < 0) {
    errors.push("Security deposit cannot be negative");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}