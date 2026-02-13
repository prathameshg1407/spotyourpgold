// models/Payout.ts
import mongoose, { Document } from "mongoose";

interface IPayout extends Document {
  // References
  ownerId: mongoose.Types.ObjectId;
  bookingId: mongoose.Types.ObjectId | null;
  monthlyRentPaymentId: mongoose.Types.ObjectId | null;
  commissionId: mongoose.Types.ObjectId | null;
  ownerBankAccountId: mongoose.Types.ObjectId;

  // Payout type
  payoutType: "first_month_rent" | "monthly_rent" | "security_deposit" | "refund" | "adjustment";

  // Amounts
  amount: number;
  currency: string;

  // RazorpayX details
  razorpayxPayoutId: string;
  razorpayxFundAccountId: string;
  razorpayxContactId: string;

  // Status
  status: "created" | "pending" | "processing" | "processed" | "reversed" | "cancelled" | "failed";

  // Bank details snapshot
  bankDetails: {
    accountNumber: string;
    accountNumberLast4: string;
    ifscCode: string;
    bankName: string;
    accountHolderName: string;
  };

  // Processing details
  utrNumber: string;
  failureReason: string;
  processedAt: Date | null;

  // Admin actions
  initiatedBy: mongoose.Types.ObjectId;
  initiatedAt: Date;
  approvedBy: mongoose.Types.ObjectId | null;
  approvedAt: Date | null;

  // Notes
  notes: string;
  internalNotes: string;
}

const payoutSchema = new mongoose.Schema<IPayout>(
  {
    // ============ REFERENCES ============
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
    monthlyRentPaymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MonthlyRentPayment",
      default: null,
    },
    commissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Commission",
      default: null,
    },
    ownerBankAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OwnerBankAccount",
      required: true,
    },

    // ============ PAYOUT TYPE ============
    payoutType: {
      type: String,
      enum: ["first_month_rent", "monthly_rent", "security_deposit", "refund", "adjustment"],
      required: true,
    },

    // ============ AMOUNTS ============
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },

    // ============ RAZORPAYX DETAILS ============
    razorpayxPayoutId: {
      type: String,
      default: "",
    },
    razorpayxFundAccountId: {
      type: String,
      default: "",
    },
    razorpayxContactId: {
      type: String,
      default: "",
    },

    // ============ STATUS ============
    status: {
      type: String,
      enum: ["created", "pending", "processing", "processed", "reversed", "cancelled", "failed"],
      default: "created",
    },

    // ============ BANK DETAILS SNAPSHOT ============
    bankDetails: {
      accountNumber: { type: String, default: "" },
      accountNumberLast4: { type: String, default: "" },
      ifscCode: { type: String, default: "" },
      bankName: { type: String, default: "" },
      accountHolderName: { type: String, default: "" },
    },

    // ============ PROCESSING DETAILS ============
    utrNumber: {
      type: String,
      default: "",
    },
    failureReason: {
      type: String,
      default: "",
    },
    processedAt: {
      type: Date,
      default: null,
    },

    // ============ ADMIN ACTIONS ============
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    initiatedAt: {
      type: Date,
      default: Date.now,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },

    // ============ NOTES ============
    notes: {
      type: String,
      default: "",
    },
    internalNotes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// ============ INDEXES ============
payoutSchema.index({ ownerId: 1, status: 1, createdAt: -1 });
payoutSchema.index({ status: 1, createdAt: -1 });
payoutSchema.index({ razorpayxPayoutId: 1 });
payoutSchema.index({ bookingId: 1 });
payoutSchema.index({ monthlyRentPaymentId: 1 });
payoutSchema.index({ payoutType: 1, status: 1 });
payoutSchema.index({ initiatedAt: 1 });

const Payout =
  mongoose.models.Payout ||
  mongoose.model<IPayout>("Payout", payoutSchema);

export default Payout;
export type { IPayout };