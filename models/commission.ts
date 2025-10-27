import mongoose from "mongoose";

const commissionSchema = new mongoose.Schema(
  {
    // Owner who owes commission
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Related booking
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },

    // Commission details
    bookingAmount: {
      type: Number,
      required: true,
    },
    commissionRate: {
      type: Number,
      required: true,
      default: 0.1, // 10% default commission
    },
    commissionAmount: {
      type: Number,
      required: true,
    },

    // Status tracking
    status: {
      type: String,
      enum: ["pending", "settled", "overdue"],
      default: "pending",
    },

    // Settlement details
    settledAt: {
      type: Date,
      default: null,
    },
    settledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Admin who marked as settled
      default: null,
    },
    settlementMethod: {
      type: String,
      enum: ["cash", "bank_transfer", "upi"],
      default: null,
    },
    settlementReference: {
      type: String, // Transaction reference, receipt number, etc.
      default: "",
    },

    // Due date for settlement
    dueDate: {
      type: Date,
      required: true,
    },

    // Additional notes
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
commissionSchema.index({ ownerId: 1, status: 1, dueDate: 1 });
commissionSchema.index({ bookingId: 1 });
commissionSchema.index({ status: 1, dueDate: 1 });

const Commission =
  mongoose.models.Commission || mongoose.model("Commission", commissionSchema);

export default Commission;
