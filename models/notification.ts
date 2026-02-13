import mongoose from "mongoose";

// ✅ Delete the cached model first
if (mongoose.models.Notification) {
  delete mongoose.models.Notification;
}

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: [
        "booking_approved",
        "booking_rejected",
        "booking_request",
        "booking_cancelled",
        "visit_request",
        "payment_reminder",
        "payment",              // ✅ Added
        "ticket_created",   
        "booking_update",  
        "monthlyRent",
        "ticket_response",     
        "ticket_resolved",     
        "general",
        "move_out_completed",
        "room_allocated",
      ],
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },

    relatedType: {
      type: String,
      enum: ["booking", "listing", "visit_request", "ticket", "allocation"],
      required: false,
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1 });

// ✅ Create fresh model
const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;