// models/OwnerSettlement.ts
import mongoose from "mongoose";

const ownerSettlementSchema = new mongoose.Schema(
  {
    // Owner
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ============ SETTLEMENT PERIOD ============
    settlementPeriod: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      month: { type: String, required: true },
    },

    // ============ FIRST PAYMENT SUMMARY ============
    firstPaymentSummary: {
      totalBookings: { type: Number, default: 0 },
      totalFirstMonthRent: { type: Number, default: 0 },
      adminCommissionCollected: { type: Number, default: 0 },
      ownerPayoutDue: { type: Number, default: 0 },
      ownerPayoutCompleted: { type: Number, default: 0 },
      bookingIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Booking" }],
    },

    // ============ MONTHLY RENT COMMISSION SUMMARY ============
    monthlyRentSummary: {
      totalRentCollections: { type: Number, default: 0 },
      totalRentAmount: { type: Number, default: 0 },
      commissionRate: { type: Number, default: 0.10 },
      commissionDueToAdmin: { type: Number, default: 0 },
      commissionPaidToAdmin: { type: Number, default: 0 },
      rentPaymentIds: [
        { type: mongoose.Schema.Types.ObjectId, ref: "MonthlyRentPayment" },
      ],
    },

    // ============ NET SETTLEMENT ============
    netSettlement: {
      adminOwesToOwner: { type: Number, default: 0 },
      ownerOwesToAdmin: { type: Number, default: 0 },
      netAmount: { type: Number, default: 0 },
      settledAmount: { type: Number, default: 0 },
      remainingAmount: { type: Number, default: 0 },
    },

    // ============ STATUS ============
    status: {
      type: String,
      enum: ["pending", "partially_settled", "fully_settled", "disputed"],
      default: "pending",
    },

    // ============ SETTLEMENT TRANSACTIONS ============
    transactions: [
      {
        date: { type: Date, required: true },
        type: {
          type: String,
          enum: ["admin_to_owner", "owner_to_admin"],
          required: true,
        },
        amount: { type: Number, required: true },
        method: {
          type: String,
          enum: ["cash", "bank_transfer", "upi", "cheque", "adjusted", "razorpayx"],
        },
        reference: { type: String, default: "" },
        // RazorpayX fields
        razorpayxPayoutId: { type: String, default: "" },
        razorpayxFundAccountId: { type: String, default: "" },
        utrNumber: { type: String, default: "" },
        // Audit
        processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        notes: { type: String, default: "" },
      },
    ],

    // ============ ADMIN ACTIONS ============
    generatedAt: { type: Date, default: Date.now },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    finalizedAt: { type: Date },
    finalizedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    notes: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

// ============ INDEXES ============
ownerSettlementSchema.index({ ownerId: 1, "settlementPeriod.month": 1 });
ownerSettlementSchema.index({ status: 1, createdAt: -1 });
ownerSettlementSchema.index({ "settlementPeriod.month": 1 });
ownerSettlementSchema.index({ "transactions.razorpayxPayoutId": 1 });

const OwnerSettlement =
  mongoose.models.OwnerSettlement ||
  mongoose.model("OwnerSettlement", ownerSettlementSchema);

export default OwnerSettlement;