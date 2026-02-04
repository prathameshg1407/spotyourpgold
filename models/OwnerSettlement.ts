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
      month: { type: String, required: true }, // "2024-02" format
    },

    // ============ FIRST PAYMENT SUMMARY ============
    // (Admin collected 10%, owes 90% to owner)
    firstPaymentSummary: {
      totalBookings: { type: Number, default: 0 },
      totalFirstMonthRent: { type: Number, default: 0 },
      adminCommissionCollected: { type: Number, default: 0 }, // 10%
      ownerPayoutDue: { type: Number, default: 0 }, // 90%
      ownerPayoutCompleted: { type: Number, default: 0 },
      bookingIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Booking" }],
    },

    // ============ MONTHLY RENT COMMISSION SUMMARY ============
    // (Owner collected 100%, owes 10% to admin)
    monthlyRentSummary: {
      totalRentCollections: { type: Number, default: 0 },
      totalRentAmount: { type: Number, default: 0 },
      commissionRate: { type: Number, default: 0.10 },
      commissionDueToAdmin: { type: Number, default: 0 }, // 10%
      commissionPaidToAdmin: { type: Number, default: 0 },
      rentPaymentIds: [
        { type: mongoose.Schema.Types.ObjectId, ref: "MonthlyRentPayment" },
      ],
    },

    // ============ NET SETTLEMENT ============
    // Positive = Admin pays owner
    // Negative = Owner pays admin
    netSettlement: {
      adminOwesToOwner: { type: Number, default: 0 }, // From first payments (90%)
      ownerOwesToAdmin: { type: Number, default: 0 }, // From monthly rent (10%)
      netAmount: { type: Number, default: 0 }, // Difference
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
          enum: ["cash", "bank_transfer", "upi", "cheque", "adjusted"],
        },
        reference: { type: String },
        processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        notes: { type: String },
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

// Indexes
ownerSettlementSchema.index({ ownerId: 1, "settlementPeriod.month": 1 });
ownerSettlementSchema.index({ status: 1, createdAt: -1 });
ownerSettlementSchema.index({ "settlementPeriod.month": 1 });

const OwnerSettlement =
  mongoose.models.OwnerSettlement ||
  mongoose.model("OwnerSettlement", ownerSettlementSchema);

export default OwnerSettlement;