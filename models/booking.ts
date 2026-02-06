import mongoose, { Document } from "mongoose";

// Define the interface for the Booking document
interface IBooking extends Document {
  userId: mongoose.Types.ObjectId;
  listingId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  roomType: string;
  moveInDate: Date;
  duration: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  aadhaarNumber?: string;
  additionalRequirements: string;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "active";
  paymentMethod: "cash" | "online";
  monthlyRent: number;

  // ============ BOOKING FEE (10% of monthly rent) ============
  bookingFee: {
    amount: number;
    status: "pending" | "paid" | "failed" | "refunded";
    paidAt: Date | null;
    paidTo: "admin" | "owner" | "";
    paymentReference: string;
    // Online payment fields
    razorpayOrderId: string;
    razorpayPaymentId: string;
    // Cash payment - owner owes admin
    ownerCommissionStatus: "not_applicable" | "pending" | "paid";
    ownerCommissionPaidAt: Date | null;
    ownerCommissionMethod: "cash" | "bank_transfer" | "upi" | "";
    ownerCommissionReference: string;
  };

  // ============ SECURITY DEPOSIT ============
  securityDeposit: {
    amount: number;
    status: "pending" | "paid" | "refunded" | "partially_refunded";
    paidAt: Date | null;
    paidTo: "admin" | "owner" | "";
    paymentReference: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    // Online - admin transfers to owner
    transferredToOwner: boolean;
    transferredAt: Date | null;
    transferMethod: "bank_transfer" | "upi" | "";
    transferReference: string;
    // Refund tracking
    refundAmount: number;
    refundDate: Date | null;
    refundReason: string;
    refundReference: string;
  };

  // ============ FIRST MONTH RENT (90% remaining after booking fee) ============
  firstMonthRent: {
    amount: number;
    status: "pending" | "paid" | "failed";
    paidAt: Date | null;
    paidTo: "admin" | "owner" | "";
    paymentReference: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    // Online - admin owes owner 90%
    ownerPayoutStatus: "not_applicable" | "pending" | "processing" | "completed";
    ownerPayoutAmount: number;
    ownerPayoutDate: Date | null;
    ownerPayoutMethod: "bank_transfer" | "upi" | "";
    ownerPayoutReference: string;
    ownerPayoutBy: mongoose.Types.ObjectId | null;
  };

  // ============ COUPON/DISCOUNT ============
  originalAmount: number;
  discountAmount: number;
  couponCode: string | null;

  // ============ CASH PAYMENT TRACKING ============
  cashPaymentProof: {
    bookingFeeProof: string;
    securityDepositProof: string;
    firstMonthRentProof: string;
  };
  cashCollectedBy: string;
  cashCollectedAt: Date | null;
  adminVerifiedAt: Date | null;
  adminVerifiedBy: mongoose.Types.ObjectId | null;

  // ============ TOTAL AMOUNTS ============
  totalPaid: number;
  totalDue: number;

  // Terms and Conditions
  termsAccepted: boolean;

  // Notes
  adminNotes: string;
  ownerNotes: string;
}

const bookingSchema = new mongoose.Schema<IBooking>(
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

    // Owner Information
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

    // ============ PAYMENT METHOD ============
    paymentMethod: {
      type: String,
      enum: ["cash", "online"],
      default: "online",
    },

    // ============ PRICING ============
    monthlyRent: {
      type: Number,
      required: true,
    },

    // ============ 1. BOOKING FEE (10% of monthly rent) ============
    bookingFee: {
      amount: { type: Number, required: true },
      status: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending",
      },
      paidAt: { type: Date, default: null },
      paidTo: {
        type: String,
        enum: ["admin", "owner", ""],
        default: "",
      },
      paymentReference: { type: String, default: "" },
      razorpayOrderId: { type: String, default: "" },
      razorpayPaymentId: { type: String, default: "" },
      // Cash - owner owes admin 10%
      ownerCommissionStatus: {
        type: String,
        enum: ["not_applicable", "pending", "paid"],
        default: "not_applicable",
      },
      ownerCommissionPaidAt: { type: Date, default: null },
      ownerCommissionMethod: {
        type: String,
        enum: ["cash", "bank_transfer", "upi", ""],
        default: "",
      },
      ownerCommissionReference: { type: String, default: "" },
    },

    // ============ 2. SECURITY DEPOSIT ============
    securityDeposit: {
      amount: { type: Number, required: true },
      status: {
        type: String,
        enum: ["pending", "paid", "refunded", "partially_refunded"],
        default: "pending",
      },
      paidAt: { type: Date, default: null },
      paidTo: {
        type: String,
        enum: ["admin", "owner", ""],
        default: "",
      },
      paymentReference: { type: String, default: "" },
      razorpayOrderId: { type: String, default: "" },
      razorpayPaymentId: { type: String, default: "" },
      // Online - admin transfers to owner
      transferredToOwner: { type: Boolean, default: false },
      transferredAt: { type: Date, default: null },
      transferMethod: {
        type: String,
        enum: ["bank_transfer", "upi", ""],
        default: "",
      },
      transferReference: { type: String, default: "" },
      // Refund
      refundAmount: { type: Number, default: 0 },
      refundDate: { type: Date, default: null },
      refundReason: { type: String, default: "" },
      refundReference: { type: String, default: "" },
    },

    // ============ 3. FIRST MONTH RENT (90%) ============
    firstMonthRent: {
      amount: { type: Number, required: true },
      status: {
        type: String,
        enum: ["pending", "paid", "failed"],
        default: "pending",
      },
      paidAt: { type: Date, default: null },
      paidTo: {
        type: String,
        enum: ["admin", "owner", ""],
        default: "",
      },
      paymentReference: { type: String, default: "" },
      razorpayOrderId: { type: String, default: "" },
      razorpayPaymentId: { type: String, default: "" },
      // Online - admin pays 90% to owner
      ownerPayoutStatus: {
        type: String,
        enum: ["not_applicable", "pending", "processing", "completed"],
        default: "not_applicable",
      },
      ownerPayoutAmount: { type: Number, default: 0 },
      ownerPayoutDate: { type: Date, default: null },
      ownerPayoutMethod: {
        type: String,
        enum: ["bank_transfer", "upi", ""],
        default: "",
      },
      ownerPayoutReference: { type: String, default: "" },
      ownerPayoutBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    },

    // ============ COUPON/DISCOUNT ============
    originalAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    couponCode: { type: String, default: null },

    // ============ CASH PAYMENT PROOF ============
    cashPaymentProof: {
      bookingFeeProof: { type: String, default: "" },
      securityDepositProof: { type: String, default: "" },
      firstMonthRentProof: { type: String, default: "" },
    },
    cashCollectedBy: { type: String, default: "" },
    cashCollectedAt: { type: Date, default: null },
    adminVerifiedAt: { type: Date, default: null },
    adminVerifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ============ TOTAL AMOUNTS ============
    totalPaid: { type: Number, default: 0 },
    totalDue: { type: Number, default: 0 },

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

// ============ PRE-SAVE HOOK ============
bookingSchema.pre("save", function (this: IBooking, next) {
  // Calculate booking fee (10% of monthly rent)
  if (!this.bookingFee.amount) {
    this.bookingFee.amount = Math.round(this.monthlyRent * 0.1);
  }

  // Calculate first month rent (90% of monthly rent)
  if (!this.firstMonthRent.amount) {
    this.firstMonthRent.amount = Math.round(this.monthlyRent * 0.9);
  }

  // Set payment destination and commission tracking based on payment method
  if (this.paymentMethod === "cash") {
    // Cash: User pays owner directly
    this.bookingFee.paidTo = "owner";
    this.securityDeposit.paidTo = "owner";
    this.firstMonthRent.paidTo = "owner";

    // Owner owes 10% booking fee to admin
    if (this.bookingFee.status === "paid" && this.bookingFee.ownerCommissionStatus === "not_applicable") {
      this.bookingFee.ownerCommissionStatus = "pending";
    }

    // No payout needed (owner already has the money)
    this.firstMonthRent.ownerPayoutStatus = "not_applicable";
    this.firstMonthRent.ownerPayoutAmount = 0;
  } else {
    // Online: User pays admin
    this.bookingFee.paidTo = "admin";
    this.securityDeposit.paidTo = "admin";
    this.firstMonthRent.paidTo = "admin";

    // Admin owes 90% to owner
    this.firstMonthRent.ownerPayoutAmount = this.firstMonthRent.amount;
    if (this.firstMonthRent.status === "paid" && this.firstMonthRent.ownerPayoutStatus === "not_applicable") {
      this.firstMonthRent.ownerPayoutStatus = "pending";
    }

    // No commission to collect (admin already keeps 10%)
    this.bookingFee.ownerCommissionStatus = "not_applicable";
  }

  // Calculate totals
  this.totalDue =
    this.bookingFee.amount +
    this.securityDeposit.amount +
    this.firstMonthRent.amount;

  this.totalPaid =
    (this.bookingFee.status === "paid" ? this.bookingFee.amount : 0) +
    (this.securityDeposit.status === "paid" ? this.securityDeposit.amount : 0) +
    (this.firstMonthRent.status === "paid" ? this.firstMonthRent.amount : 0);

  next();
});

// Indexes
bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ listingId: 1, status: 1 });
bookingSchema.index({ ownerId: 1, status: 1 });
bookingSchema.index({ status: 1, createdAt: -1 });
bookingSchema.index({ paymentMethod: 1, status: 1 });
bookingSchema.index({ "bookingFee.status": 1 });
bookingSchema.index({ "bookingFee.ownerCommissionStatus": 1, paymentMethod: 1 });
bookingSchema.index({ "securityDeposit.status": 1 });
bookingSchema.index({ "securityDeposit.transferredToOwner": 1, paymentMethod: 1 });
bookingSchema.index({ "firstMonthRent.status": 1 });
bookingSchema.index({ "firstMonthRent.ownerPayoutStatus": 1, ownerId: 1 });

const Booking =
  mongoose.models.Booking || mongoose.model<IBooking>("Booking", bookingSchema);

export default Booking;
export type { IBooking };