import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    // User who will receive the notification
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Notification type
    type: {
      type: String,
      enum: [
        "booking_approved",
        "booking_rejected",
        "booking_request",
        "booking_cancelled",
        "visit_request",
        "payment_reminder",
        "ticket_created",
        "ticket_response",
        "ticket_resolved",
        "general",
        "move_out_completed",
        "room_allocated", // <--- Added this to fix the error
      ],
      required: true,
    },

    // Notification title
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // Notification message
    message: {
      type: String,
      required: true,
      trim: true,
    },

    // Related data (booking ID, listing ID, etc.)
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },

    // Related type (booking, listing, etc.)
    relatedType: {
      type: String,
      enum: ["booking", "listing", "visit_request", "ticket", "allocation"], // <--- Added "allocation" here
      required: false,
    },

    // Read status
    isRead: {
      type: Boolean,
      default: false,
    },

    // Priority level
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    // Additional data
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });

const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);

export default Notification;