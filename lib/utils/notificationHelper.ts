import { ClientSession } from "mongoose";
import Notification from "@/models/notification";
import mongoose from "mongoose";

// Notification types matching schema
export type NotificationType =
  | "booking"
  | "payment"
  | "listing"
  | "visit"
  | "review"
  | "general"
  | "ticket"
  | "room_allocated"
  | "move_out_processed"
  | "notice_period_recorded"
  | "notice_given"
  | "rent_reminder"
  | "rent_overdue";

export type NotificationPriority = "low" | "medium" | "high";
export type RelatedType =
  | "booking"
  | "listing"
  | "visit"
  | "ticket"
  | "allocation"
  | "payment";

export interface CreateNotificationParams {
  userId: string | mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string | mongoose.Types.ObjectId;
  relatedType?: RelatedType;
  priority?: NotificationPriority;
  metadata?: Record<string, unknown>;
  session?: ClientSession;
}

/**
 * Create a notification with proper error handling
 */
export async function createNotification(
  params: CreateNotificationParams
): Promise<boolean> {
  try {
    const notificationData = {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      relatedId: params.relatedId,
      relatedType: params.relatedType,
      priority: params.priority || "medium",
      isRead: false,
      metadata: params.metadata || {},
    };

    if (params.session) {
      await Notification.create([notificationData], { session: params.session });
    } else {
      await Notification.create(notificationData);
    }

    return true;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return false;
  }
}

/**
 * Create multiple notifications in batch
 */
export async function createBatchNotifications(
  notifications: CreateNotificationParams[],
  session?: ClientSession
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  const notificationsData = notifications.map((n) => ({
    userId: n.userId,
    type: n.type,
    title: n.title,
    message: n.message,
    relatedId: n.relatedId,
    relatedType: n.relatedType,
    priority: n.priority || "medium",
    isRead: false,
    metadata: n.metadata || {},
  }));

  try {
    if (session) {
      await Notification.insertMany(notificationsData, { session });
    } else {
      await Notification.insertMany(notificationsData);
    }
    success = notifications.length;
  } catch (error) {
    console.error("Failed to create batch notifications:", error);
    failed = notifications.length;
  }

  return { success, failed };
}

/**
 * Notification templates
 */
export const NotificationTemplates = {
  roomAllocated: (
    pgName: string,
    roomNumber: string,
    bedNumber: string,
    moveInDate: Date
  ) => ({
    type: "room_allocated" as NotificationType,
    title: "Room Allocated!",
    message: `You have been allocated Room ${roomNumber}, Bed ${bedNumber} at ${pgName}. Move-in date: ${moveInDate.toLocaleDateString("en-IN")}.`,
  }),

  moveOutProcessed: (
    pgName: string,
    roomNumber: string,
    bedNumber: string,
    refundAmount: number
  ) => ({
    type: "move_out_processed" as NotificationType,
    title: "Move-out Processed",
    message: `Your move-out from Room ${roomNumber}, Bed ${bedNumber} at ${pgName} has been processed.${
      refundAmount > 0 ? ` Security deposit refund: ₹${refundAmount.toLocaleString("en-IN")}` : ""
    }`,
  }),

  noticePeriodRecorded: (
    pgName: string,
    roomNumber: string,
    bedNumber: string,
    vacateDate: Date
  ) => ({
    type: "notice_period_recorded" as NotificationType,
    title: "Notice Period Recorded",
    message: `Notice period has been recorded for your stay at ${pgName}, Room ${roomNumber}, Bed ${bedNumber}. Expected move-out date: ${vacateDate.toLocaleDateString("en-IN")}`,
  }),

  noticeGivenToOwner: (
    pgName: string,
    roomNumber: string,
    bedNumber: string,
    vacateDate: Date
  ) => ({
    type: "notice_given" as NotificationType,
    title: "Tenant Notice Period",
    message: `Tenant in Room ${roomNumber}, Bed ${bedNumber} at ${pgName} has given notice. Expected vacate date: ${vacateDate.toLocaleDateString("en-IN")}.`,
  }),

  rentReminder: (pgName: string, amount: number, dueDate: Date) => ({
    type: "rent_reminder" as NotificationType,
    title: "Rent Due Reminder",
    message: `Your rent of ₹${amount.toLocaleString("en-IN")} for ${pgName} is due on ${dueDate.toLocaleDateString("en-IN")}. Please pay on time to avoid late fees.`,
  }),

  rentOverdue: (pgName: string, amount: number, lateFee: number) => ({
    type: "rent_overdue" as NotificationType,
    title: "Rent Overdue",
    message: `Your rent of ₹${amount.toLocaleString("en-IN")} for ${pgName} is overdue. Late fee: ₹${lateFee.toLocaleString("en-IN")}. Please pay immediately.`,
  }),

  upcomingVacancy: (
    pgName: string,
    roomNumber: string,
    bedNumber: string,
    daysUntil: number
  ) => ({
    type: "general" as NotificationType,
    title: `Upcoming Vacancy - ${daysUntil} days`,
    message: `Room ${roomNumber}, Bed ${bedNumber} at ${pgName} will be vacant in ${daysUntil} days. Consider listing it for new tenants.`,
  }),
};