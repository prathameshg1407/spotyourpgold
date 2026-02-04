// models/MonthlyRentPayment.ts
import mongoose from "mongoose";

const monthlyRentPaymentSchema = new mongoose.Schema(
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

    // ============ RENT DETAILS ============
    rentMonth: {
      type: Date, // First day of the month (e.g., 2024-02-01)
      required: true,
    },
    monthNumber: {
      type: Number, // 2, 3, 4... (starts from 2, as month 1 is booking)
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
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "online", "bank_transfer", "upi"],
    },
    paymentReference: {
      type: String,
      default: "",
    },

    // Who collected the payment
    collectedBy: {
      type: String, // Owner's name or "Platform"
      default: "",
    },

    // ============ COMMISSION TO ADMIN ============
    commissionRate: {
      type: Number,
      default: 0.10, // 10%
    },
    commissionAmount: {
      type: Number,
      required: true,
    },
    commissionStatus: {
      type: String,
      enum: ["not_applicable", "pending", "paid", "overdue", "waived"],
      default: "pending",
    },
    commissionPaidAt: {
      type: Date,
    },
    commissionPaidMethod: {
      type: String,
      enum: ["cash", "bank_transfer", "upi", "adjusted"],
    },
    commissionReference: {
      type: String,
      default: "",
    },

    // Linked commission record
    commissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Commission",
    },

    // ============ REMINDERS ============
    remindersSent: {
      type: Number,
      default: 0,
    },
    lastReminderSentAt: {
      type: Date,
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

// Indexes
monthlyRentPaymentSchema.index({ bookingId: 1, rentMonth: 1 });
monthlyRentPaymentSchema.index({ ownerId: 1, paymentStatus: 1 });
monthlyRentPaymentSchema.index({ tenantId: 1, paymentStatus: 1 });
monthlyRentPaymentSchema.index({ dueDate: 1, paymentStatus: 1 });
monthlyRentPaymentSchema.index({ commissionStatus: 1, ownerId: 1 });
monthlyRentPaymentSchema.index({ rentMonth: 1, ownerId: 1 });

const MonthlyRentPayment =
  mongoose.models.MonthlyRentPayment ||
  mongoose.model("MonthlyRentPayment", monthlyRentPaymentSchema);

export default MonthlyRentPayment;