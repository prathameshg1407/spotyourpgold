import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    // User Information
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Listing Information
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },

    // Owner Information (denormalized for easy queries)
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Booking Details
    roomType: {
      type: String,
      required: true,
    },
    moveInDate: {
      type: Date,
      required: true,
    },
    duration: {
      type: String,
      required: true,
    },

    // Personal Information
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },

    // Address Information
    address: {
      street: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      pincode: { type: String, required: true, trim: true },
    },

    // Identity Verification
    aadhaarNumber: {
      type: String,
      required: false,
      trim: true,
    },

    // Additional Information
    additionalRequirements: {
      type: String,
      default: "",
      trim: true,
    },

    // Booking Status
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed", "active"],
      default: "pending",
    },

    // ============ PAYMENT INFORMATION ============
    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "pending_cash_payment",
        "completed",
        "completed_cash",
        "failed",
        "refunded",
      ],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "online"],
      default: "cash",
    },

    // ============ AMOUNTS ============
    // First month rent (base amount before discount)
    amount: {
      type: Number,
      required: true,
    },
    // Security Deposit (goes fully to owner)
    securityDeposit: {
      type: Number,
      required: true,
    },

    // ============ FIRST MONTH COMMISSION SPLIT ============
    firstMonthCommission: {
      // Commission rate (default 10%)
      commissionRate: { type: Number, default: 0.10 },
      
      // Admin's portion (10% of first month rent)
      adminAmount: { type: Number, default: 0 },
      
      // Owner's portion (90% of first month rent)
      ownerAmount: { type: Number, default: 0 },
      
      // Admin commission status
      adminAmountStatus: {
        type: String,
        enum: ["pending", "received"],
        default: "pending",
      },
      adminAmountReceivedAt: { type: Date, default: null },
      
      // Owner payout status (admin pays 90% to owner)
      ownerPayoutStatus: {
        type: String,
        enum: ["pending", "processing", "completed"],
        default: "pending",
      },
      ownerPayoutDate: { type: Date, default: null },
      ownerPayoutMethod: {
        type: String,
        enum: ["cash", "bank_transfer", "upi", ""],
        default: "",
      },
      ownerPayoutReference: { type: String, default: "" },
      ownerPayoutBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    },

    // ============ COUPON/DISCOUNT (Keeping as is) ============
    originalAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    couponCode: { type: String, default: null },

    // ============ CASH PAYMENT DETAILS ============
    cashPaymentProof: { type: String, default: "" },
    cashCollectedBy: { type: String, default: "" },
    cashCollectedAt: { type: Date, default: null },
    adminVerifiedAt: { type: Date, default: null },

    // Terms and Conditions
    termsAccepted: {
      type: Boolean,
      required: true,
      default: false,
    },

    // Notes
    adminNotes: { type: String, default: "" },
    ownerNotes: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

// Indexes
bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ listingId: 1, status: 1 });
bookingSchema.index({ ownerId: 1, status: 1 });
bookingSchema.index({ status: 1, createdAt: -1 });
bookingSchema.index({ "firstMonthCommission.ownerPayoutStatus": 1, ownerId: 1 });
bookingSchema.index({ "firstMonthCommission.adminAmountStatus": 1 });

const Booking =
  mongoose.models.Booking || mongoose.model("Booking", bookingSchema);

export default Booking;