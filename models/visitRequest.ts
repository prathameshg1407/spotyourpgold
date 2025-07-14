import mongoose from "mongoose";

const visitRequestSchema = new mongoose.Schema(
  {
    // User Information
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      match: [/^[0-9]{10}$/, "Phone number must be 10 digits"],
    },

    // Visit Details
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    preferredDate: {
      type: Date,
      required: true,
    },
    preferredTime: {
      type: String,
      required: true,
      enum: [
        "Morning (10 AM - 12 PM)",
        "Afternoon (12 PM - 3 PM)",
        "Evening (3 PM - 6 PM)",
        "Late Evening (6 PM - 8 PM)",
      ],
    },
    message: {
      type: String,
      default: "",
      maxlength: 500,
    },

    // Consent and Status
    consent: {
      type: Boolean,
      required: true,
      default: false,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },

    // Admin Management
    isMarked: {
      type: Boolean,
      default: false,
    },
    adminNotes: {
      type: String,
      default: "",
    },

    // Tracking
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Allow anonymous visits
    },
    ipAddress: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
visitRequestSchema.index({ listingId: 1, createdAt: -1 });
visitRequestSchema.index({ phone: 1, listingId: 1 });
visitRequestSchema.index({ status: 1, isMarked: 1 });

const VisitRequest =
  mongoose.models.VisitRequest ||
  mongoose.model("VisitRequest", visitRequestSchema);

export default VisitRequest;
