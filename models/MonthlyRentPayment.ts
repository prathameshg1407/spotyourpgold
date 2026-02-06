import mongoose, { Document } from "mongoose";

interface IMonthlyRentPayment extends Document {
  bookingId: mongoose.Types.ObjectId;
  listingId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId;
  allocationId: mongoose.Types.ObjectId;

  // Rent details
  rentMonth: Date;
  monthNumber: number;
  rentAmount: number;
  dueDate: Date;

  // Payment method for this month
  paymentMethod: "online" | "cash" | "";

  // Payment status
  paymentStatus: "upcoming" | "pending" | "paid" | "overdue" | "partially_paid";
  paidAmount: number;
  paidAt: Date | null;

  // ============ ONLINE PAYMENT (User → Admin → Owner) ============
  onlinePayment: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    paidToAdmin: boolean;
    paidToAdminAt: Date | null;
    // Admin keeps 10%
    adminCommission: number;
    // Admin owes 90% to owner
    ownerPayoutAmount: number;
    ownerPayoutStatus: "not_applicable" | "pending" | "processing" | "completed";
    ownerPayoutDate: Date | null;
    ownerPayoutMethod: "bank_transfer" | "upi" | "";
    ownerPayoutReference: string;
    ownerPayoutBy: mongoose.Types.ObjectId | null;
  };

  // ============ CASH PAYMENT (User → Owner → Admin) ============
  cashPayment: {
    collectedByOwner: boolean;
    collectedAt: Date | null;
    paymentProof: string;
    // Owner owes 10% to admin
    adminCommissionOwed: number;
    adminCommissionStatus: "not_applicable" | "pending" | "paid" | "overdue";
    adminCommissionPaidAt: Date | null;
    adminCommissionMethod: "cash" | "bank_transfer" | "upi" | "";
    adminCommissionReference: string;
  };

  // Commission record link
  commissionId: mongoose.Types.ObjectId | null;

  // Late fees
  lateFee: number;
  lateFeeWaived: boolean;

  // Reminders
  remindersSent: number;
  lastReminderSentAt: Date | null;

  // Notes
  notes: string;
  adminNotes: string;
}

const monthlyRentPaymentSchema = new mongoose.Schema<IMonthlyRentPayment>(
  {
    // References
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    allocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TenantAllocation",
      required: true,
    },

    // ============ RENT DETAILS ============
    rentMonth: {
      type: Date,
      required: true,
    },
    monthNumber: {
      type: Number,
      required: true,
    },
    rentAmount: {
      type: Number,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },

    // ============ PAYMENT METHOD ============
    paymentMethod: {
      type: String,
      enum: ["online", "cash", ""],
      default: "",
    },

    // ============ PAYMENT STATUS ============
    paymentStatus: {
      type: String,
      enum: ["upcoming", "pending", "paid", "overdue", "partially_paid"],
      default: "upcoming",
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    paidAt: {
      type: Date,
      default: null,
    },

    // ============ ONLINE PAYMENT ============
    onlinePayment: {
      razorpayOrderId: { type: String, default: "" },
      razorpayPaymentId: { type: String, default: "" },
      paidToAdmin: { type: Boolean, default: false },
      paidToAdminAt: { type: Date, default: null },
      adminCommission: { type: Number, default: 0 },
      ownerPayoutAmount: { type: Number, default: 0 },
      ownerPayoutStatus: {
        type: String,
        enum: ["not_applicable", "pending", "processing", "completed"],
        default: "not_applicable",
      },
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

    // ============ CASH PAYMENT ============
    cashPayment: {
      collectedByOwner: { type: Boolean, default: false },
      collectedAt: { type: Date, default: null },
      paymentProof: { type: String, default: "" },
      adminCommissionOwed: { type: Number, default: 0 },
      adminCommissionStatus: {
        type: String,
        enum: ["not_applicable", "pending", "paid", "overdue"],
        default: "not_applicable",
      },
      adminCommissionPaidAt: { type: Date, default: null },
      adminCommissionMethod: {
        type: String,
        enum: ["cash", "bank_transfer", "upi", ""],
        default: "",
      },
      adminCommissionReference: { type: String, default: "" },
    },

    // Commission record
    commissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Commission",
      default: null,
    },

    // ============ LATE FEES ============
    lateFee: {
      type: Number,
      default: 0,
    },
    lateFeeWaived: {
      type: Boolean,
      default: false,
    },

    // ============ REMINDERS ============
    remindersSent: {
      type: Number,
      default: 0,
    },
    lastReminderSentAt: {
      type: Date,
      default: null,
    },

    // ============ NOTES ============
    notes: {
      type: String,
      default: "",
    },
    adminNotes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// ============ PRE-SAVE HOOK ============
monthlyRentPaymentSchema.pre("save", function (next) {
  const COMMISSION_RATE = 0.1;

  if (this.paymentMethod === "online" && this.paymentStatus === "paid") {
    // Online: Admin keeps 10%, owes 90% to owner
    this.onlinePayment.adminCommission = Math.round(this.rentAmount * COMMISSION_RATE);
    this.onlinePayment.ownerPayoutAmount = Math.round(this.rentAmount * (1 - COMMISSION_RATE));

    if (this.onlinePayment.ownerPayoutStatus === "not_applicable") {
      this.onlinePayment.ownerPayoutStatus = "pending";
    }

    // Reset cash fields
    this.cashPayment.adminCommissionStatus = "not_applicable";
  } else if (this.paymentMethod === "cash" && this.paymentStatus === "paid") {
    // Cash: Owner owes 10% to admin
    this.cashPayment.adminCommissionOwed = Math.round(this.rentAmount * COMMISSION_RATE);

    if (this.cashPayment.adminCommissionStatus === "not_applicable") {
      this.cashPayment.adminCommissionStatus = "pending";
    }

    // Reset online fields
    this.onlinePayment.ownerPayoutStatus = "not_applicable";
  }

  next();
});

// Indexes
monthlyRentPaymentSchema.index({ bookingId: 1, rentMonth: 1 });
monthlyRentPaymentSchema.index({ allocationId: 1, rentMonth: 1 });
monthlyRentPaymentSchema.index({ ownerId: 1, paymentStatus: 1 });
monthlyRentPaymentSchema.index({ tenantId: 1, paymentStatus: 1 });
monthlyRentPaymentSchema.index({ dueDate: 1, paymentStatus: 1 });
monthlyRentPaymentSchema.index({ paymentMethod: 1, paymentStatus: 1 });
monthlyRentPaymentSchema.index({ "onlinePayment.ownerPayoutStatus": 1, ownerId: 1 });
monthlyRentPaymentSchema.index({ "cashPayment.adminCommissionStatus": 1, ownerId: 1 });
monthlyRentPaymentSchema.index({ rentMonth: 1, ownerId: 1 });

const MonthlyRentPayment =
  mongoose.models.MonthlyRentPayment ||
  mongoose.model<IMonthlyRentPayment>("MonthlyRentPayment", monthlyRentPaymentSchema);

export default MonthlyRentPayment;
export type { IMonthlyRentPayment };