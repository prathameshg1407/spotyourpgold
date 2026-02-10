// models/OwnerProfile.ts
import mongoose from "mongoose";

const documentsSchema = new mongoose.Schema(
  {
    aadhaarFrontUrl: { type: String, required: false },
    aadhaarBackUrl: { type: String, required: false },
    aadhaarFrontPublicId: { type: String, required: false },
    aadhaarBackPublicId: { type: String, required: false },
    additionalDocuments: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    ],
  },
  { _id: false }
);

// ============ UPDATED PAYMENT DETAILS SCHEMA ============
const paymentDetailsSchema = new mongoose.Schema(
  {
    // Bank Account Details
    accountNumber: { type: String, default: "" },
    accountNumberLast4: { type: String, default: "" },
    ifscCode: { type: String, default: "" },
    accountHolderName: { type: String, default: "" },
    bankName: { type: String, default: "" },
    branchName: { type: String, default: "" },
    accountType: {
      type: String,
      enum: ["savings", "current", ""],
      default: "savings",
    },

    // UPI
    upiId: { type: String, default: "" },

    // ============ RAZORPAYX INTEGRATION ============
    razorpayxContactId: { type: String, default: "" },
    razorpayxFundAccountId: { type: String, default: "" },

    // ============ VERIFICATION ============
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "failed", "not_added"],
      default: "not_added",
    },
    verifiedAt: { type: Date, default: null },
    verificationMethod: {
      type: String,
      enum: ["penny_drop", "manual", "razorpayx", ""],
      default: "",
    },
    verificationFailureReason: { type: String, default: "" },

    // ============ AUDIT ============
    lastUpdatedAt: { type: Date, default: null },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: "India" },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  { _id: false }
);

// ============ PAYOUT PREFERENCES SCHEMA ============
const payoutPreferencesSchema = new mongoose.Schema(
  {
    autoPayoutEnabled: { type: Boolean, default: false },
    minimumPayoutAmount: { type: Number, default: 100 },
    payoutSchedule: {
      type: String,
      enum: ["immediate", "daily", "weekly", "monthly"],
      default: "immediate",
    },
    preferredPayoutDay: { type: Number, default: 1 }, // 1-31 for monthly, 1-7 for weekly
    notifyOnPayout: { type: Boolean, default: true },
  },
  { _id: false }
);

// ============ PAYOUT SUMMARY SCHEMA ============
const payoutSummarySchema = new mongoose.Schema(
  {
    totalPayoutsReceived: { type: Number, default: 0 },
    totalPayoutAmount: { type: Number, default: 0 },
    lastPayoutDate: { type: Date, default: null },
    lastPayoutAmount: { type: Number, default: 0 },
    pendingPayoutAmount: { type: Number, default: 0 },
    failedPayoutsCount: { type: Number, default: 0 },
  },
  { _id: false }
);

const ownerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    phone: {
      type: String,
      required: true,
    },

    phoneVerified: {
      type: Boolean,
      default: false,
    },

    aadhaarNumber: {
      type: String,
      required: false,
      default: "",
    },

    address: {
      type: addressSchema,
      required: true,
    },

    documents: {
      type: documentsSchema,
    },

    // ============ UPDATED PAYMENT DETAILS ============
    paymentDetails: {
      type: paymentDetailsSchema,
      default: () => ({}),
    },

    // ============ NEW: PAYOUT PREFERENCES ============
    payoutPreferences: {
      type: payoutPreferencesSchema,
      default: () => ({}),
    },

    // ============ NEW: PAYOUT SUMMARY ============
    payoutSummary: {
      type: payoutSummarySchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

// Sparse unique index for aadhaarNumber
ownerProfileSchema.index(
  { aadhaarNumber: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { aadhaarNumber: { $ne: "" } },
  }
);

// ============ NEW INDEXES FOR RAZORPAYX ============
ownerProfileSchema.index({ "paymentDetails.razorpayxFundAccountId": 1 });
ownerProfileSchema.index({ "paymentDetails.verificationStatus": 1 });

const OwnerProfile =
  mongoose.models.OwnerProfile ||
  mongoose.model("OwnerProfile", ownerProfileSchema);

export default OwnerProfile;