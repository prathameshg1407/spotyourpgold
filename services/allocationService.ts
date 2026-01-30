import { ClientSession } from "mongoose";
import mongoose from "mongoose";
import Room, { IRoom, IBed } from "@/models/room";
import TenantAllocation, { ITenantAllocation } from "@/models/tenantAllocation";
import Booking from "@/models/booking";
import Listing from "@/models/listing";
import { updateListingAvailability } from "@/lib/utils/roomUtils";
import {
  calculateMoveOutDate,
  generateRentHistory,
  isPaymentCompleted,
  validateAllocationData,
  calculateRefundAmount,
} from "@/lib/utils/allocationUtils";
import {
  createNotification,
  NotificationTemplates,
} from "@/lib/utils/notificationHelper";

export interface AllocateTenantInput {
  roomId: string;
  bookingId: string;
  bedNumber: string;
  moveInDate?: Date | string;
  expectedMoveOutDate?: Date | string;
  noticePeriodDays?: number;
  allocatedBy: string;
}

export interface AllocateTenantResult {
  success: boolean;
  allocation?: ITenantAllocation;
  error?: string;
  errors?: string[];
}

export interface VacateTenantInput {
  roomId: string;
  bedNumber: string;
  actualMoveOutDate?: Date | string;
  refundAmount?: number;
  deductions?: {
    pendingDues?: number;
    damages?: number;
    otherCharges?: number;
    notes?: string;
  };
  vacatedBy: string;
  notes?: string;
}

export interface VacateTenantResult {
  success: boolean;
  allocation?: ITenantAllocation;
  refundAmount?: number;
  error?: string;
}

export interface RecordNoticeInput {
  roomId: string;
  bedNumber: string;
  expectedVacateDate: Date | string;
  reason?: string;
  recordedBy: string;
}

export interface RecordNoticeResult {
  success: boolean;
  allocation?: ITenantAllocation;
  error?: string;
}

/**
 * Allocation Service - handles all tenant allocation operations
 */
export class AllocationService {
  /**
   * Allocate tenant to a bed
   */
  static async allocateTenant(
    input: AllocateTenantInput,
    session: ClientSession
  ): Promise<AllocateTenantResult> {
    try {
      // Validate input
      const validation = validateAllocationData({
        bookingId: input.bookingId,
        bedNumber: input.bedNumber,
        moveInDate: input.moveInDate,
        expectedMoveOutDate: input.expectedMoveOutDate,
      });

      if (!validation.isValid) {
        return { success: false, errors: validation.errors };
      }

      // Get room
      const room = await Room.findById(input.roomId).session(session);
      if (!room) {
        return { success: false, error: "Room not found" };
      }

      // Get listing for ownership and pgName
      const listing = await Listing.findById(room.listingId).session(session);
      if (!listing) {
        return { success: false, error: "Listing not found" };
      }

      // Get booking
      const booking = await Booking.findById(input.bookingId).session(session);
      if (!booking) {
        return { success: false, error: "Booking not found" };
      }

      // Validate booking status
      if (booking.status !== "confirmed") {
        return {
          success: false,
          error: "Booking must be confirmed before allocation",
        };
      }

      // Check for existing active allocation for this booking
      const existingAllocation = await TenantAllocation.findOne({
        bookingId: input.bookingId,
        status: { $in: ["pending", "active", "notice_period"] },
      }).session(session);

      if (existingAllocation) {
        return {
          success: false,
          error: "Booking already has an active allocation",
        };
      }

      // Check if tenant already has an active allocation
      const tenantExistingAllocation = await TenantAllocation.findActiveByTenant(
        booking.userId.toString(),
        session
      );

      if (tenantExistingAllocation) {
        return {
          success: false,
          error: "Tenant already has an active room allocation",
        };
      }

      // Find the bed
      const bed = room.getBedByNumber(input.bedNumber);
      if (!bed) {
        return { success: false, error: `Bed ${input.bedNumber} not found` };
      }

      if (bed.status !== "available") {
        return {
          success: false,
          error: `Bed ${input.bedNumber} is not available (current status: ${bed.status})`,
        };
      }

      // Calculate dates
      const moveInDate = input.moveInDate
        ? new Date(input.moveInDate)
        : new Date(booking.moveInDate);

      const durationMonths = parseInt(booking.duration) || 1;

      const expectedMoveOutDate = input.expectedMoveOutDate
        ? new Date(input.expectedMoveOutDate)
        : calculateMoveOutDate(moveInDate, durationMonths);

      // Check if payment is completed
      const paymentCompleted = isPaymentCompleted(booking.paymentStatus);

      // Generate rent history
      const rentHistory = generateRentHistory(
        moveInDate,
        durationMonths,
        room.monthlyRent,
        paymentCompleted
      );

      // Create allocation
      const allocation = new TenantAllocation({
        tenantId: booking.userId,
        bookingId: booking._id,
        listingId: room.listingId,
        roomId: room._id,
        bedId: bed._id,
        roomNumber: room.roomNumber,
        bedNumber: input.bedNumber,
        roomType: room.roomType,
        pgName: listing.pgName,
        allocatedAt: new Date(),
        moveInDate,
        expectedMoveOutDate,
        status: "active",
        noticePeriodDays: input.noticePeriodDays || 30,
        monthlyRent: room.monthlyRent,
        securityDeposit: room.securityDeposit,
        securityDepositPaid: paymentCompleted,
        rentHistory,
        createdBy: new mongoose.Types.ObjectId(input.allocatedBy),
        lastModifiedBy: new mongoose.Types.ObjectId(input.allocatedBy),
      });

      await allocation.save({ session });

      // Atomic bed allocation
      const updatedRoom = await Room.atomicAllocateBed(
        room._id.toString(),
        input.bedNumber,
        booking.userId.toString(),
        allocation._id.toString(),
        moveInDate,
        expectedMoveOutDate,
        session
      );

      if (!updatedRoom) {
        throw new Error("Failed to allocate bed - bed may have been taken");
      }

      // Update booking status
      booking.status = "completed";
      await booking.save({ session });

      // Update listing availability
      await updateListingAvailability(room.listingId.toString(), session);

      // Create notification for tenant
      const notifTemplate = NotificationTemplates.roomAllocated(
        listing.pgName,
        room.roomNumber,
        input.bedNumber,
        moveInDate
      );

      await createNotification({
        userId: booking.userId,
        type: notifTemplate.type,
        title: notifTemplate.title,
        message: notifTemplate.message,
        relatedId: allocation._id,
        relatedType: "allocation",
        priority: "high",
        metadata: {
          roomNumber: room.roomNumber,
          bedNumber: input.bedNumber,
          moveInDate,
          pgName: listing.pgName,
        },
        session,
      });

      return { success: true, allocation };
    } catch (error) {
      console.error("Allocate tenant error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to allocate tenant",
      };
    }
  }

  /**
   * Vacate tenant from a bed
   */
  static async vacateTenant(
    input: VacateTenantInput,
    session: ClientSession
  ): Promise<VacateTenantResult> {
    try {
      // Get room
      const room = await Room.findById(input.roomId).session(session);
      if (!room) {
        return { success: false, error: "Room not found" };
      }

      // Get listing
      const listing = await Listing.findById(room.listingId).session(session);
      if (!listing) {
        return { success: false, error: "Listing not found" };
      }

      // Find the bed
      const bed = room.getBedByNumber(input.bedNumber);
      if (!bed) {
        return { success: false, error: `Bed ${input.bedNumber} not found` };
      }

      if (bed.status !== "occupied") {
        return {
          success: false,
          error: `Bed ${input.bedNumber} is not occupied`,
        };
      }

      // Get the allocation
      const allocation = await TenantAllocation.findActiveByRoom(
        room._id.toString(),
        input.bedNumber,
        session
      );

      if (!allocation) {
        return {
          success: false,
          error: "No active allocation found for this bed",
        };
      }

      // Calculate refund
      const pendingDues =
        input.deductions?.pendingDues || allocation.getTotalDueAmount();
      const damages = input.deductions?.damages || 0;
      const otherCharges = input.deductions?.otherCharges || 0;

      const refundAmount =
        input.refundAmount !== undefined
          ? input.refundAmount
          : calculateRefundAmount(
              allocation.securityDeposit,
              pendingDues + otherCharges,
              damages
            );

      const moveOutDate = input.actualMoveOutDate
        ? new Date(input.actualMoveOutDate)
        : new Date();

      // Update allocation
      allocation.status = "vacated";
      allocation.actualMoveOutDate = moveOutDate;
      allocation.refundAmount = refundAmount;
      allocation.refundDate = new Date();
      allocation.securityDepositRefunded = refundAmount > 0;
      allocation.ownerNotes = input.notes || allocation.ownerNotes;
      allocation.lastModifiedBy = new mongoose.Types.ObjectId(input.vacatedBy);

      if (input.deductions?.notes) {
        allocation.adminNotes = `Deductions: Pending dues: ₹${pendingDues}, Damages: ₹${damages}, Other: ₹${otherCharges}. Notes: ${input.deductions.notes}`;
      }

      await allocation.save({ session });

      // Atomic bed vacation
      const updatedRoom = await Room.atomicVacateBed(
        room._id.toString(),
        input.bedNumber,
        session
      );

      if (!updatedRoom) {
        throw new Error("Failed to vacate bed");
      }

      // Update listing availability
      await updateListingAvailability(room.listingId.toString(), session);

      // Notify tenant
      const notifTemplate = NotificationTemplates.moveOutProcessed(
        listing.pgName,
        room.roomNumber,
        input.bedNumber,
        refundAmount
      );

      await createNotification({
        userId: allocation.tenantId,
        type: notifTemplate.type,
        title: notifTemplate.title,
        message: notifTemplate.message,
        relatedId: allocation._id,
        relatedType: "allocation",
        priority: "high",
        metadata: {
          roomNumber: room.roomNumber,
          bedNumber: input.bedNumber,
          moveOutDate,
          refundAmount,
        },
        session,
      });

      return { success: true, allocation, refundAmount };
    } catch (error) {
      console.error("Vacate tenant error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to vacate tenant",
      };
    }
  }

  /**
   * Record notice period
   */
  static async recordNotice(
    input: RecordNoticeInput,
    session: ClientSession
  ): Promise<RecordNoticeResult> {
    try {
      // Get room
      const room = await Room.findById(input.roomId).session(session);
      if (!room) {
        return { success: false, error: "Room not found" };
      }

      // Get listing
      const listing = await Listing.findById(room.listingId).session(session);
      if (!listing) {
        return { success: false, error: "Listing not found" };
      }

      // Find the bed
      const bed = room.getBedByNumber(input.bedNumber);
      if (!bed) {
        return { success: false, error: `Bed ${input.bedNumber} not found` };
      }

      if (bed.status !== "occupied") {
        return {
          success: false,
          error: `Bed ${input.bedNumber} is not occupied`,
        };
      }

      // Get the allocation
      const allocation = await TenantAllocation.findOne({
        roomId: room._id,
        bedNumber: input.bedNumber,
        status: "active",
      }).session(session);

      if (!allocation) {
        return {
          success: false,
          error: "No active allocation found for this bed",
        };
      }

      const expectedVacateDate = new Date(input.expectedVacateDate);
      const today = new Date();

      // Validate notice period
      const daysDifference = Math.ceil(
        (expectedVacateDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDifference < allocation.noticePeriodDays) {
        return {
          success: false,
          error: `Minimum notice period is ${allocation.noticePeriodDays} days. Please select a later date.`,
        };
      }

           allocation.noticeGivenDate = today;
      allocation.expectedVacateDate = expectedVacateDate;
      allocation.vacationReason = input.reason || "";
      allocation.lastModifiedBy = new mongoose.Types.ObjectId(input.recordedBy);

      await allocation.save({ session });

      // Update bed notice status
      const bedIndex = room.beds.findIndex((b) => b.bedNumber === input.bedNumber);
      if (bedIndex !== -1) {
        room.beds[bedIndex].noticeGiven = true;
        room.beds[bedIndex].noticeDate = today;
        room.beds[bedIndex].expectedVacateDate = expectedVacateDate;
        await room.save({ session });
      }

      // Notify tenant
      const tenantNotif = NotificationTemplates.noticePeriodRecorded(
        listing.pgName,
        room.roomNumber,
        input.bedNumber,
        expectedVacateDate
      );

      await createNotification({
        userId: allocation.tenantId,
        type: tenantNotif.type,
        title: tenantNotif.title,
        message: tenantNotif.message,
        relatedId: allocation._id,
        relatedType: "allocation",
        priority: "high",
        metadata: {
          roomNumber: room.roomNumber,
          bedNumber: input.bedNumber,
          expectedVacateDate,
        },
        session,
      });

      return { success: true, allocation };
    } catch (error) {
      console.error("Record notice error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to record notice",
      };
    }
  }

  /**
   * Extend tenant stay
   */
  static async extendStay(
    allocationId: string,
    extensionMonths: number,
    reason: string,
    extendedBy: string,
    session: ClientSession
  ): Promise<{ success: boolean; allocation?: ITenantAllocation; error?: string }> {
    try {
      const allocation = await TenantAllocation.findById(allocationId).session(session);

      if (!allocation) {
        return { success: false, error: "Allocation not found" };
      }

      if (!["active", "notice_period"].includes(allocation.status)) {
        return { success: false, error: "Can only extend active allocations" };
      }

      const previousEndDate = new Date(allocation.expectedMoveOutDate);
      const newEndDate = new Date(previousEndDate);
      newEndDate.setMonth(newEndDate.getMonth() + extensionMonths);

      // Add extension record
      allocation.extensions.push({
        previousEndDate,
        newEndDate,
        extendedAt: new Date(),
        months: extensionMonths,
        reason,
      });

      // Update allocation
      allocation.expectedMoveOutDate = newEndDate;
      allocation.status = "active"; // Reset from notice_period if applicable
      allocation.noticeGivenDate = null;
      allocation.expectedVacateDate = null;
      allocation.lastModifiedBy = new mongoose.Types.ObjectId(extendedBy);

      // Generate additional rent entries
      for (let i = 0; i < extensionMonths; i++) {
        const monthDate = new Date(previousEndDate);
        monthDate.setMonth(monthDate.getMonth() + i);

        const dueDate = new Date(monthDate);
        dueDate.setDate(new Date(allocation.moveInDate).getDate());

        allocation.addRentEntry(
          new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
          allocation.monthlyRent,
          dueDate
        );
      }

      await allocation.save({ session });

      // Update room bed if was in notice period
      const room = await Room.findById(allocation.roomId).session(session);
      if (room) {
        const bedIndex = room.beds.findIndex(
          (b) => b.bedNumber === allocation.bedNumber
        );
        if (bedIndex !== -1) {
          room.beds[bedIndex].noticeGiven = false;
          room.beds[bedIndex].noticeDate = null;
          room.beds[bedIndex].expectedVacateDate = newEndDate;
          await room.save({ session });
        }
      }

      // Notify tenant
      await createNotification({
        userId: allocation.tenantId,
        type: "general",
        title: "Stay Extended",
        message: `Your stay at ${allocation.pgName} has been extended by ${extensionMonths} month(s). New end date: ${newEndDate.toLocaleDateString("en-IN")}`,
        relatedId: allocation._id,
        relatedType: "allocation",
        priority: "medium",
        session,
      });

      return { success: true, allocation };
    } catch (error) {
      console.error("Extend stay error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to extend stay",
      };
    }
  }

  /**
   * Transfer tenant to different bed/room
   */
  static async transferTenant(
    allocationId: string,
    newRoomId: string,
    newBedNumber: string,
    transferDate: Date,
    reason: string,
    transferredBy: string,
    session: ClientSession
  ): Promise<{ success: boolean; allocation?: ITenantAllocation; error?: string }> {
    try {
      // Get current allocation
      const currentAllocation = await TenantAllocation.findById(allocationId).session(session);

      if (!currentAllocation) {
        return { success: false, error: "Allocation not found" };
      }

      if (!["active", "notice_period"].includes(currentAllocation.status)) {
        return { success: false, error: "Can only transfer active tenants" };
      }

      // Get new room
      const newRoom = await Room.findById(newRoomId).session(session);
      if (!newRoom) {
        return { success: false, error: "New room not found" };
      }

      // Check new bed availability
      const newBed = newRoom.getBedByNumber(newBedNumber);
      if (!newBed) {
        return { success: false, error: `Bed ${newBedNumber} not found in new room` };
      }

      if (newBed.status !== "available") {
        return { success: false, error: `Bed ${newBedNumber} is not available` };
      }

      // Get listing for pgName
      const listing = await Listing.findById(newRoom.listingId).session(session);
      if (!listing) {
        return { success: false, error: "Listing not found" };
      }

      // Vacate old bed
      const oldRoom = await Room.atomicVacateBed(
        currentAllocation.roomId.toString(),
        currentAllocation.bedNumber,
        session
      );

      if (!oldRoom) {
        throw new Error("Failed to vacate old bed");
      }

      // Allocate new bed
      const allocatedRoom = await Room.atomicAllocateBed(
        newRoomId,
        newBedNumber,
        currentAllocation.tenantId.toString(),
        currentAllocation._id.toString(),
        transferDate,
        currentAllocation.expectedMoveOutDate,
        session
      );

      if (!allocatedRoom) {
        throw new Error("Failed to allocate new bed");
      }

      // Update allocation with new room details
      currentAllocation.roomId = newRoom._id;
      currentAllocation.bedId = newBed._id;
      currentAllocation.roomNumber = newRoom.roomNumber;
      currentAllocation.bedNumber = newBedNumber;
      currentAllocation.roomType = newRoom.roomType;
      currentAllocation.monthlyRent = newRoom.monthlyRent;
      currentAllocation.lastModifiedBy = new mongoose.Types.ObjectId(transferredBy);
      currentAllocation.ownerNotes = `${currentAllocation.ownerNotes}\n[${new Date().toISOString()}] Transferred from Room ${oldRoom.roomNumber} to Room ${newRoom.roomNumber}, Bed ${newBedNumber}. Reason: ${reason}`.trim();

      await currentAllocation.save({ session });

      // Update listing availability
      await updateListingAvailability(currentAllocation.listingId.toString(), session);

      // Notify tenant
      await createNotification({
        userId: currentAllocation.tenantId,
        type: "general",
        title: "Room Transfer",
        message: `You have been transferred to Room ${newRoom.roomNumber}, Bed ${newBedNumber} at ${listing.pgName}. Effective from: ${transferDate.toLocaleDateString("en-IN")}`,
        relatedId: currentAllocation._id,
        relatedType: "allocation",
        priority: "high",
        session,
      });

      return { success: true, allocation: currentAllocation };
    } catch (error) {
      console.error("Transfer tenant error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to transfer tenant",
      };
    }
  }

  /**
   * Get allocation with full details
   */
  static async getAllocationDetails(
    allocationId: string,
    session?: ClientSession
  ): Promise<ITenantAllocation | null> {
    return TenantAllocation.findById(allocationId)
      .populate("tenantId", "fullName email phone createdAt")
      .populate("listingId", "pgName location amenities")
      .populate("bookingId")
      .populate("roomId")
      .session(session || null);
  }

  /**
   * Get tenant's current allocation
   */
  static async getTenantAllocation(
    tenantId: string,
    session?: ClientSession
  ): Promise<{
    allocation: ITenantAllocation | null;
    roommates: Array<{ name: string; bedNumber: string; moveInDate: Date }>;
    nextRentDue: { amount: number; dueDate: Date; status: string; lateFee: number } | null;
  }> {
    const allocation = await TenantAllocation.findActiveByTenant(tenantId, session);

    if (!allocation) {
      return { allocation: null, roommates: [], nextRentDue: null };
    }

    // Get roommates
    const roommates: Array<{ name: string; bedNumber: string; moveInDate: Date }> = [];

    const roommateAllocations = await TenantAllocation.find({
      roomId: allocation.roomId,
      tenantId: { $ne: tenantId },
      status: { $in: ["active", "notice_period"] },
    })
      .populate("tenantId", "fullName")
      .session(session || null);

    roommateAllocations.forEach((a: any) => {
      roommates.push({
        name: a.tenantId?.fullName || "Unknown",
        bedNumber: a.bedNumber,
        moveInDate: a.moveInDate,
      });
    });

    // Get next rent due
    const pendingRent = allocation.rentHistory.find(
      (r) => r.status === "pending" || r.status === "overdue"
    );

    const nextRentDue = pendingRent
      ? {
          amount: pendingRent.amount + (pendingRent.lateFee || 0),
          dueDate: pendingRent.dueDate,
          status: pendingRent.status,
          lateFee: pendingRent.lateFee || 0,
        }
      : null;

    return { allocation, roommates, nextRentDue };
  }
}

export default AllocationService;