import { ClientSession } from "mongoose";
import TenantAllocation, { IRentPayment } from "@/models/tenantAllocation";

/**
 * Calculate expected move-out date based on move-in and duration
 */
export function calculateMoveOutDate(moveInDate: Date, durationMonths: number): Date {
  const moveOut = new Date(moveInDate);
  moveOut.setMonth(moveOut.getMonth() + durationMonths);
  return moveOut;
}

/**
 * Calculate rent due date based on move-in day
 */
export function calculateRentDueDate(month: Date, moveInDay: number): Date {
  const dueDate = new Date(month);
  dueDate.setDate(Math.min(moveInDay, 28)); // Cap at 28 for February
  return dueDate;
}

/**
 * Generate rent history entries for allocation
 */
export function generateRentHistory(
  moveInDate: Date,
  durationMonths: number,
  monthlyRent: number,
  isFirstMonthPaid: boolean
): Omit<IRentPayment, "_id">[] {
  const rentHistory: Omit<IRentPayment, "_id">[] = [];
  const moveInDay = moveInDate.getDate();

  for (let i = 0; i < durationMonths; i++) {
    const monthDate = new Date(moveInDate);
    monthDate.setMonth(monthDate.getMonth() + i);
    monthDate.setDate(1); // First of the month

    const dueDate = calculateRentDueDate(monthDate, moveInDay);
    const now = new Date();
    const isOverdue = dueDate < now;

    rentHistory.push({
      month: new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
      amount: monthlyRent,
      status:
        i === 0 && isFirstMonthPaid
          ? "paid"
          : isOverdue
            ? "overdue"
            : "pending",
      paidAmount: i === 0 && isFirstMonthPaid ? monthlyRent : 0,
      paidAt: i === 0 && isFirstMonthPaid ? new Date() : null,
      dueDate,
      lateFee: isOverdue && !(i === 0 && isFirstMonthPaid) ? Math.round(monthlyRent * 0.05) : 0,
      waivedAmount: 0,
      paymentMethod: i === 0 && isFirstMonthPaid ? "cash" : "",
      transactionId: "",
      receiptUrl: "",
      notes: "",
    });
  }

  return rentHistory;
}

/**
 * Check if booking payment is completed
 */
export function isPaymentCompleted(paymentStatus: string): boolean {
  return ["completed_cash", "completed", "paid"].includes(paymentStatus);
}

/**
 * Validate allocation request data
 */
export interface AllocationValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateAllocationData(data: {
  bookingId?: string;
  bedNumber?: string;
  moveInDate?: Date | string;
  expectedMoveOutDate?: Date | string;
}): AllocationValidationResult {
  const errors: string[] = [];

  if (!data.bookingId || data.bookingId.trim() === "") {
    errors.push("Booking ID is required");
  }

  if (!data.bedNumber || data.bedNumber.trim() === "") {
    errors.push("Bed number is required");
  }

  if (data.moveInDate) {
    const moveIn = new Date(data.moveInDate);
    if (isNaN(moveIn.getTime())) {
      errors.push("Invalid move-in date format");
    }
  }

  if (data.expectedMoveOutDate) {
    const moveOut = new Date(data.expectedMoveOutDate);
    if (isNaN(moveOut.getTime())) {
      errors.push("Invalid expected move-out date format");
    }

    if (data.moveInDate) {
      const moveIn = new Date(data.moveInDate);
      if (moveOut <= moveIn) {
        errors.push("Expected move-out date must be after move-in date");
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate refund amount
 */
export function calculateRefundAmount(
  securityDeposit: number,
  pendingDues: number,
  damages: number = 0
): number {
  const refund = securityDeposit - pendingDues - damages;
  return Math.max(0, refund);
}