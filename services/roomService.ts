import { ClientSession } from "mongoose";
import mongoose from "mongoose";
import Room, { IRoom, IBed } from "@/models/room";
import Listing from "@/models/listing";
import { updateListingAvailability, generateBedLabels } from "@/lib/utils/roomUtils";

export interface CreateRoomInput {
  listingId: string;
  roomTypeId: string;
  roomType: string;
  roomNumber: string;
  floor?: number;
  capacity: number;
  isAC?: boolean;
  hasAttachedBathroom?: boolean;
  amenities?: string[];
  notes?: string;
  monthlyRent: number;
  securityDeposit?: number;
}

export interface CreateRoomResult {
  success: boolean;
  room?: IRoom;
  error?: string;
}

export interface BulkCreateRoomsInput {
  listingId: string;
  roomTypeId: string;
  roomType: string;
  startNumber: number;
  count: number;
  floor?: number;
  capacity: number;
  isAC?: boolean;
  hasAttachedBathroom?: boolean;
  monthlyRent: number;
  securityDeposit?: number;
  numberingFormat?: "numeric" | "alpha" | "floor-based";
}

export interface BulkCreateRoomsResult {
  success: boolean;
  created: number;
  skipped: number;
  rooms: IRoom[];
  errors: string[];
}

/**
 * Room Service - handles all room-related operations
 */
export class RoomService {
  /**
   * Create a single room with beds
   */
  static async createRoom(
    input: CreateRoomInput,
    session?: ClientSession
  ): Promise<CreateRoomResult> {
    try {
      // Check for duplicate room number
      const existingRoom = await Room.findOne({
        listingId: input.listingId,
        roomNumber: input.roomNumber,
      }).session(session || null);

      if (existingRoom) {
        return {
          success: false,
          error: `Room number ${input.roomNumber} already exists`,
        };
      }

      // Generate beds
      const bedLabels = generateBedLabels(input.capacity);
      const beds = bedLabels.map((label) => ({
        bedNumber: label,
        bedLabel: input.capacity === 1 ? "Single Bed" : `Bed ${label}`,
        status: "available" as const,
        currentTenantId: null,
        currentAllocationId: null,
        occupiedFrom: null,
        expectedVacateDate: null,
        noticeGiven: false,
        noticeDate: null,
      }));

      const room = new Room({
        listingId: input.listingId,
        roomTypeId: input.roomTypeId,
        roomType: input.roomType,
        roomNumber: input.roomNumber,
        floor: input.floor || 0,
        capacity: input.capacity,
        beds,
        isAC: input.isAC || false,
        hasAttachedBathroom: input.hasAttachedBathroom || false,
        amenities: input.amenities || [],
        notes: input.notes || "",
        monthlyRent: input.monthlyRent,
        securityDeposit: input.securityDeposit || 0,
        isActive: true,
      });

      await room.save({ session });

      // Update listing availability
      await updateListingAvailability(input.listingId, session);

      return { success: true, room };
    } catch (error) {
      console.error("Create room error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create room",
      };
    }
  }

  /**
   * Bulk create rooms
   */
  static async bulkCreateRooms(
    input: BulkCreateRoomsInput,
    session?: ClientSession
  ): Promise<BulkCreateRoomsResult> {
    const result: BulkCreateRoomsResult = {
      success: false,
      created: 0,
      skipped: 0,
      rooms: [],
      errors: [],
    };

    try {
      // Validate count
      if (input.count < 1 || input.count > 100) {
        result.errors.push("Count must be between 1 and 100");
        return result;
      }

      // Get existing room numbers
      const existingRooms = await Room.find({ listingId: input.listingId })
        .select("roomNumber")
        .session(session || null);
      const existingNumbers = new Set(existingRooms.map((r) => r.roomNumber));

      // Generate rooms
      const roomsToCreate: CreateRoomInput[] = [];
      let currentNumber = input.startNumber;

      for (let i = 0; i < input.count; i++) {
        let roomNumber: string;

        switch (input.numberingFormat) {
          case "alpha":
            const letterIndex = Math.floor(currentNumber / 10);
            const numPart = currentNumber % 10 || 10;
            roomNumber = `${String.fromCharCode(65 + letterIndex)}${numPart}`;
            break;
          case "floor-based":
            const floorNum = input.floor || Math.floor(currentNumber / 100) || 1;
            const roomNum = currentNumber % 100 || 1;
            roomNumber = `${floorNum}${roomNum.toString().padStart(2, "0")}`;
            break;
          default:
            roomNumber = currentNumber.toString();
        }

        currentNumber++;

        if (existingNumbers.has(roomNumber)) {
          result.skipped++;
          continue;
        }

        roomsToCreate.push({
          listingId: input.listingId,
          roomTypeId: input.roomTypeId,
          roomType: input.roomType,
          roomNumber,
          floor: input.floor || 0,
          capacity: input.capacity,
          isAC: input.isAC,
          hasAttachedBathroom: input.hasAttachedBathroom,
          monthlyRent: input.monthlyRent,
          securityDeposit: input.securityDeposit,
        });
      }

      // Create rooms
      for (const roomInput of roomsToCreate) {
        const createResult = await this.createRoom(roomInput, session);
        if (createResult.success && createResult.room) {
          result.rooms.push(createResult.room);
          result.created++;
        } else {
          result.errors.push(createResult.error || "Failed to create room");
        }
      }

      result.success = result.created > 0;
      return result;
    } catch (error) {
      console.error("Bulk create rooms error:", error);
      result.errors.push(
        error instanceof Error ? error.message : "Failed to bulk create rooms"
      );
      return result;
    }
  }

  /**
   * Get room with occupancy details
   */
  static async getRoomWithOccupancy(
    roomId: string,
    session?: ClientSession
  ): Promise<IRoom | null> {
    return Room.findById(roomId)
      .populate("listingId", "pgName location ownerId")
      .populate("beds.currentTenantId", "fullName email phone")
      .session(session || null);
  }

  /**
   * Get rooms by listing with filters
   */
  static async getRoomsByListing(
    listingId: string,
    filters?: {
      status?: string;
      roomType?: string;
      floor?: number;
      hasAvailableBeds?: boolean;
    },
    session?: ClientSession
  ): Promise<IRoom[]> {
    const query: Record<string, unknown> = {
      listingId,
      isActive: true,
    };

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.roomType) {
      query.roomType = filters.roomType;
    }

    if (filters?.floor !== undefined) {
      query.floor = filters.floor;
    }

    if (filters?.hasAvailableBeds) {
      query.availableBeds = { $gt: 0 };
    }

    return Room.find(query)
      .populate("beds.currentTenantId", "fullName email phone")
      .sort({ floor: 1, roomNumber: 1 })
      .session(session || null);
  }

  /**
   * Update room details (non-occupancy related)
   */
  static async updateRoom(
    roomId: string,
    updates: Partial<{
      roomNumber: string;
      floor: number;
      isAC: boolean;
      hasAttachedBathroom: boolean;
      amenities: string[];
      notes: string;
      monthlyRent: number;
      securityDeposit: number;
      isActive: boolean;
    }>,
    ownerId: string,
    session?: ClientSession
  ): Promise<{ success: boolean; room?: IRoom; error?: string }> {
    try {
      const room = await Room.findById(roomId).session(session || null);

      if (!room) {
        return { success: false, error: "Room not found" };
      }

      // Verify ownership
      const listing = await Listing.findById(room.listingId).session(session || null);
      if (!listing || listing.ownerId.toString() !== ownerId) {
        return { success: false, error: "Unauthorized" };
      }

      // Check for duplicate room number if changing
      if (updates.roomNumber && updates.roomNumber !== room.roomNumber) {
        const existingRoom = await Room.findOne({
          listingId: room.listingId,
          roomNumber: updates.roomNumber,
          _id: { $ne: roomId },
        }).session(session || null);

        if (existingRoom) {
          return {
            success: false,
            error: `Room number ${updates.roomNumber} already exists`,
          };
        }
      }

      // Apply updates
      const allowedFields = [
        "roomNumber",
        "floor",
        "isAC",
        "hasAttachedBathroom",
        "amenities",
        "notes",
        "monthlyRent",
        "securityDeposit",
        "isActive",
      ] as const;

      allowedFields.forEach((field) => {
        if (updates[field] !== undefined) {
          (room as any)[field] = updates[field];
        }
      });

      await room.save({ session });

      // Update listing if active status changed
      if (updates.isActive !== undefined) {
        await updateListingAvailability(room.listingId.toString(), session);
      }

      return { success: true, room };
    } catch (error) {
      console.error("Update room error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update room",
      };
    }
  }

  /**
   * Delete room (only if no occupied beds)
   */
  static async deleteRoom(
    roomId: string,
    ownerId: string,
    session?: ClientSession
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const room = await Room.findById(roomId).session(session || null);

      if (!room) {
        return { success: false, error: "Room not found" };
      }

      // Verify ownership
      const listing = await Listing.findById(room.listingId).session(session || null);
      if (!listing || listing.ownerId.toString() !== ownerId) {
        return { success: false, error: "Unauthorized" };
      }

      // Check for occupied/reserved beds
      const hasOccupiedBeds = room.beds.some(
        (bed) => bed.status === "occupied" || bed.status === "reserved"
      );

      if (hasOccupiedBeds) {
        return { success: false, error: "Cannot delete room with occupied or reserved beds" };
      }

      await Room.findByIdAndDelete(roomId).session(session || null);

      // Update listing availability
      await updateListingAvailability(room.listingId.toString(), session);

      return { success: true };
    } catch (error) {
      console.error("Delete room error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete room",
      };
    }
  }

  /**
   * Set bed to maintenance status
   */
  static async setBedMaintenance(
    roomId: string,
    bedNumber: string,
    inMaintenance: boolean,
    ownerId: string,
    session?: ClientSession
  ): Promise<{ success: boolean; room?: IRoom; error?: string }> {
    try {
      const room = await Room.findById(roomId).session(session || null);

      if (!room) {
        return { success: false, error: "Room not found" };
      }

      // Verify ownership
      const listing = await Listing.findById(room.listingId).session(session || null);
      if (!listing || listing.ownerId.toString() !== ownerId) {
        return { success: false, error: "Unauthorized" };
      }

      const bedIndex = room.beds.findIndex((b) => b.bedNumber === bedNumber);
      if (bedIndex === -1) {
        return { success: false, error: "Bed not found" };
      }

      const bed = room.beds[bedIndex];

      // Can't set maintenance on occupied bed
      if (inMaintenance && bed.status === "occupied") {
        return { success: false, error: "Cannot set maintenance on occupied bed" };
      }

      room.beds[bedIndex].status = inMaintenance ? "maintenance" : "available";
      await room.save({ session });

      // Update listing
      await updateListingAvailability(room.listingId.toString(), session);

      return { success: true, room };
    } catch (error) {
      console.error("Set bed maintenance error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update bed",
      };
    }
  }
}

export default RoomService;