import mongoose, { Schema, Document } from "mongoose";

// Rent payment record
interface IRentPayment {
  month: Date;
  amount: number;
  status: "pending" | "paid" | "overdue" | "partial";
  paidAmount: number;
  paidAt: Date | null;
  dueDate: Date;
  lateFee: number;
  paymentMethod: string;
  transactionId: string;
}

// Tenant Allocation interface
export interface ITenantAllocation extends Document {
  tenantId: mongoose.Types.ObjectId;
  bookingId: mongoose.Types.ObjectId;
  listingId: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  bedId: string;
  
  // Quick reference fields (denormalized for performance)
  roomNumber: string;
  bedNumber: string;
  roomType: string;
  pgName: string;
  
  // Dates
  allocatedAt: Date;
  moveInDate: Date;
  expectedMoveOutDate: Date;
  actualMoveOutDate: Date | null;
  
  // Status
  status: "pending" | "active" | "notice_period" | "vacated" | "extended" | "cancelled";
  
  // Notice period handling
  noticePeriodDays: number;
  noticeGivenDate: Date | null;
  expectedVacateDate: Date | null;
  
  // Financial
  monthlyRent: number;
  securityDeposit: number;
  securityDepositPaid: boolean;
  securityDepositRefunded: boolean;
  refundAmount: number;
  
  // Rent history
  rentHistory: IRentPayment[];
  
  // Extension history
  extensions: Array<{
    previousEndDate: Date;
    newEndDate: Date;
    extendedAt: Date;
    months: number;
  }>;
  
  // Notes
  ownerNotes: string;
  tenantNotes: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const RentPaymentSchema = new Schema<IRentPayment>({
  month: { type: Date, required: true },
  amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "paid", "overdue", "partial"],
    default: "pending",
  },
  paidAmount: { type: Number, default: 0 },
  paidAt: { type: Date, default: null },
  dueDate: { type: Date, required: true },
  lateFee: { type: Number, default: 0 },
  paymentMethod: { type: String, default: "" },
  transactionId: { type: String, default: "" },
});

const TenantAllocationSchema = new Schema<ITenantAllocation>(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
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
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    bedId: {
      type: String,
      required: true,
    },
    
    // Denormalized fields
    roomNumber: { type: String, required: true },
    bedNumber: { type: String, required: true },
    roomType: { type: String, required: true },
    pgName: { type: String, required: true },
    
    // Dates
    allocatedAt: { type: Date, default: Date.now },
    moveInDate: { type: Date, required: true },
    expectedMoveOutDate: { type: Date, required: true },
    actualMoveOutDate: { type: Date, default: null },
    
    // Status
    status: {
      type: String,
      enum: ["pending", "active", "notice_period", "vacated", "extended", "cancelled"],
      default: "pending",
    },
    
    // Notice period
    noticePeriodDays: { type: Number, default: 30 },
    noticeGivenDate: { type: Date, default: null },
    expectedVacateDate: { type: Date, default: null },
    
    // Financial
    monthlyRent: { type: Number, required: true },
    securityDeposit: { type: Number, default: 0 },
    securityDepositPaid: { type: Boolean, default: false },
    securityDepositRefunded: { type: Boolean, default: false },
    refundAmount: { type: Number, default: 0 },
    
    // Rent history
    rentHistory: [RentPaymentSchema],
    
    // Extensions
    extensions: [
      {
        previousEndDate: Date,
        newEndDate: Date,
        extendedAt: Date,
        months: Number,
      },
    ],
    
    // Notes
    ownerNotes: { type: String, default: "" },
    tenantNotes: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

// Indexes
TenantAllocationSchema.index({ tenantId: 1, status: 1 });
TenantAllocationSchema.index({ listingId: 1, status: 1 });
TenantAllocationSchema.index({ roomId: 1, status: 1 });
TenantAllocationSchema.index({ bookingId: 1 }, { unique: true });
TenantAllocationSchema.index({ expectedVacateDate: 1, status: 1 });
TenantAllocationSchema.index({ "rentHistory.status": 1, "rentHistory.dueDate": 1 });

const TenantAllocation =
  mongoose.models.TenantAllocation ||
  mongoose.model<ITenantAllocation>("TenantAllocation", TenantAllocationSchema);

export default TenantAllocation;