import mongoose from "mongoose";

const commissionSchema = new mongoose.Schema(
  {
    // Owner who is involved in this commission
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

    // Related listing
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },

    // Tenant information (for monthly rent commissions)
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Allocation (for monthly rent commissions)
    allocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TenantAllocation",
      default: null,
    },

    // ============ COMMISSION TYPE ============
    commissionType: {
      type: String,
      enum: [
        "first_month_admin",   // 10% that admin receives from first payment
        "first_month_owner",   // 90% that admin owes to owner from first payment
        "monthly_rent",        // 10% that owner owes to admin from monthly rent
      ],
      required: true,
    },

    // ============ MONTH TRACKING ============
    rentMonth: {
      type: Date, // The month for which this commission is due
    },
    monthNumber: {
      type: Number, // 1 = first month, 2 = second month, etc.
      default: 1,
    },

    // ============ AMOUNTS ============
    // Base amount (first month rent OR monthly rent collected)
    baseAmount: {
      type: Number,
      required: true,
    },
    commissionRate: {
      type: Number,
      required: true,
      default: 0.10, // 10%
    },
    commissionAmount: {
      type: Number,
      required: true,
    },

    // ============ STATUS ============
    status: {
      type: String,
      enum: [
        "pending",          // Awaiting action
        "completed",        // Commission received/paid
        "overdue",          // Past due date (for monthly_rent type)
        "waived",           // Commission waived by admin
      ],
      default: "pending",
    },

    // ============ SETTLEMENT DETAILS ============
    dueDate: {
      type: Date,
      required: true,
    },
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
      enum: ["cash", "bank_transfer", "upi", "adjusted", "auto", ""],
      default: "",
    },
    settlementReference: {
      type: String,
      default: "",
    },

    // ============ ADDITIONAL INFO ============
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
commissionSchema.index({ ownerId: 1, commissionType: 1, status: 1 });
commissionSchema.index({ bookingId: 1, commissionType: 1 });
commissionSchema.index({ commissionType: 1, status: 1, dueDate: 1 });
commissionSchema.index({ status: 1, dueDate: 1 });
commissionSchema.index({ rentMonth: 1, ownerId: 1 });
commissionSchema.index({ allocationId: 1, rentMonth: 1 });

const Commission =
  mongoose.models.Commission || mongoose.model("Commission", commissionSchema);

export default Commission;