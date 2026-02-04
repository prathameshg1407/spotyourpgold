import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },

    role: {
      type: String,
      enum: ["user", "owner", "admin"],
      default: "user",
    },

    ownerStatus: {
      type: String,
      enum: ["none", "pending", "rejected", "verified"],
      default: "none",
    },

    watchlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Listing" }],

    // ============ OWNER BANK DETAILS (for settlements) ============
    bankDetails: {
      accountHolderName: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      ifscCode: { type: String, default: "" },
      bankName: { type: String, default: "" },
      branchName: { type: String, default: "" },
      upiId: { type: String, default: "" },
      isVerified: { type: Boolean, default: false },
      verifiedAt: { type: Date },
    },

    // ============ COMMISSION SETTINGS (Admin can customize per owner) ============
    commissionSettings: {
      // Custom commission rate (if different from default 10%)
      customRate: { type: Number, default: null }, // null = use default 10%
      isCustomRateActive: { type: Boolean, default: false },
      customRateApprovedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      customRateApprovedAt: { type: Date },
      notes: { type: String, default: "" },
    },

    // ============ SETTLEMENT SUMMARY (cached for quick access) ============
    settlementSummary: {
      // First month payouts (90% admin owes to owner)
      totalPayoutReceived: { type: Number, default: 0 },
      pendingPayoutAmount: { type: Number, default: 0 },
      
      // Monthly rent commissions (10% owner owes to admin)
      totalCommissionPaid: { type: Number, default: 0 },
      pendingCommissionAmount: { type: Number, default: 0 },
      
      lastSettlementDate: { type: Date },
    },
  },
  { timestamps: true }
);

// Indexes
userSchema.index({ role: 1, ownerStatus: 1 });
userSchema.index({ "settlementSummary.pendingPayoutAmount": 1 });
userSchema.index({ "settlementSummary.pendingCommissionAmount": 1 });

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;