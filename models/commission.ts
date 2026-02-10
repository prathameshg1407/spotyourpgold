// models/Commission.ts
import mongoose, { Document } from "mongoose";

interface ICommission extends Document {
  ownerId: mongoose.Types.ObjectId;
  bookingId: mongoose.Types.ObjectId;
  listingId: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId | null;
  allocationId: mongoose.Types.ObjectId | null;
  monthlyRentPaymentId: mongoose.Types.ObjectId | null;

  // Commission Type
  commissionType:
    | "booking_fee_revenue"
    | "booking_fee_receivable"
    | "first_month_payout"
    | "security_deposit_payout"
    | "monthly_rent_payout"
    | "monthly_rent_commission";

  // Payment flow direction
  direction: "admin_received" | "admin_owes_owner" | "owner_owes_admin";

  // Source payment method
  sourcePaymentMethod: "online" | "cash";

  // Month tracking (for monthly rent)
  rentMonth: Date | null;
  monthNumber: number;

  // Amounts
  baseAmount: number;
  commissionRate: number;
  amount: number;

  // Status
  status: "pending" | "processing" | "completed" | "overdue" | "waived" | "failed";

  // Settlement details
  dueDate: Date;
  settledAt: Date | null;
  settledBy: mongoose.Types.ObjectId | null;
  settlementMethod: "cash" | "bank_transfer" | "upi" | "razorpay" | "razorpayx" | "auto" | "";
  settlementReference: string;
  settlementProof: string;

  // RazorpayX fields
  razorpayxPayoutId: string;
  razorpayxFundAccountId: string;
  utrNumber: string;
  payoutFailureReason: string;

  // Additional
  notes: string;
}

const commissionSchema = new mongoose.Schema<ICommission>(
  {
    // Owner involved
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

    // Tenant
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Tenant Allocation (for monthly rent)
    allocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TenantAllocation",
      default: null,
    },

    // Monthly Rent Payment reference
    monthlyRentPaymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MonthlyRentPayment",
      default: null,
    },

    // ============ COMMISSION TYPE ============
    commissionType: {
      type: String,
      enum: [
        "booking_fee_revenue",
        "booking_fee_receivable",
        "first_month_payout",
        "security_deposit_payout",
        "monthly_rent_payout",
        "monthly_rent_commission",
      ],
      required: true,
    },

    // ============ DIRECTION ============
    direction: {
      type: String,
      enum: ["admin_received", "admin_owes_owner", "owner_owes_admin"],
      required: true,
    },

    // ============ SOURCE PAYMENT METHOD ============
    sourcePaymentMethod: {
      type: String,
      enum: ["online", "cash"],
      required: true,
    },

    // ============ MONTH TRACKING ============
    rentMonth: {
      type: Date,
      default: null,
    },
    monthNumber: {
      type: Number,
      default: 1,
    },

    // ============ AMOUNTS ============
    baseAmount: {
      type: Number,
      required: true,
    },
    commissionRate: {
      type: Number,
      required: true,
      default: 0.1,
    },
    amount: {
      type: Number,
      required: true,
    },

    // ============ STATUS ============
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "overdue", "waived", "failed"],
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
      ref: "User",
      default: null,
    },
    settlementMethod: {
      type: String,
      enum: ["cash", "bank_transfer", "upi", "razorpay", "razorpayx", "auto", ""],
      default: "",
    },
    settlementReference: {
      type: String,
      default: "",
    },
    settlementProof: {
      type: String,
      default: "",
    },

    // ============ RAZORPAYX FIELDS ============
    razorpayxPayoutId: {
      type: String,
      default: "",
    },
    razorpayxFundAccountId: {
      type: String,
      default: "",
    },
    utrNumber: {
      type: String,
      default: "",
    },
    payoutFailureReason: {
      type: String,
      default: "",
    },

    // ============ NOTES ============
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// ============ INDEXES ============
commissionSchema.index({ ownerId: 1, status: 1, commissionType: 1 });
commissionSchema.index({ bookingId: 1, commissionType: 1 });
commissionSchema.index({ commissionType: 1, status: 1 });
commissionSchema.index({ direction: 1, status: 1 });
commissionSchema.index({ status: 1, dueDate: 1 });
commissionSchema.index({ sourcePaymentMethod: 1, status: 1 });
commissionSchema.index({ rentMonth: 1, ownerId: 1 });
commissionSchema.index({ monthlyRentPaymentId: 1 });
commissionSchema.index({ allocationId: 1, rentMonth: 1 });
commissionSchema.index({ razorpayxPayoutId: 1 });

const Commission =
  mongoose.models.Commission ||
  mongoose.model<ICommission>("Commission", commissionSchema);

export default Commission;
export type { ICommission };