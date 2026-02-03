import mongoose, { Schema, Document, ClientSession } from "mongoose";

// Rent payment record interface
export interface IRentPayment {
  _id: mongoose.Types.ObjectId;
  month: Date;
  amount: number;
  status: "pending" | "paid" | "overdue" | "partial";
  paidAmount: number;
  paidAt: Date | null;
  dueDate: Date;
  lateFee: number;
  waivedAmount: number;
  paymentMethod: "cash" | "online" | "upi" | "bank_transfer" | "";
  transactionId: string;
  receiptUrl: string;
  notes: string;
}

// Extension record interface
export interface IExtension {
  previousEndDate: Date;
  newEndDate: Date;
  extendedAt: Date;
  months: number;
  reason: string;
}

// Tenant Allocation interface
export interface ITenantAllocation extends Document {
  _id: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId;
  bookingId: mongoose.Types.ObjectId;
  listingId: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  bedId: mongoose.Types.ObjectId;

  // Quick reference fields (denormalized)
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
  status:
    | "pending"
    | "active"
    | "notice_period"
    | "vacated"
    | "extended"
    | "cancelled";

  // Notice period
  noticePeriodDays: number;
  noticeGivenDate: Date | null;
  expectedVacateDate: Date | null;
  vacationReason: string;

  // Financial
  monthlyRent: number;
  securityDeposit: number;
  securityDepositPaid: boolean;
  securityDepositRefunded: boolean;
  refundAmount: number;
  refundDate: Date | null;
  refundTransactionId: string;

  // Rent history
  rentHistory: IRentPayment[];

  // Extensions
  extensions: IExtension[];

  // Move-in checklist
  moveInChecklist: {
    completed: boolean;
    completedAt: Date | null;
    items: Array<{
      item: string;
      checked: boolean;
      condition: string;
      notes: string;
    }>;
  };

  // Notes
  ownerNotes: string;
  tenantNotes: string;
  adminNotes: string;

  // Metadata
  createdBy: mongoose.Types.ObjectId;
  lastModifiedBy: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;

  // Methods
  getCurrentRent(): IRentPayment | undefined;
  getOverdueRents(): IRentPayment[];
  getTotalPaidAmount(): number;
  getTotalDueAmount(): number;
  addRentEntry(month: Date, amount: number, dueDate: Date): IRentPayment;
  markRentPaid(
    rentId: string,
    amount: number,
    paymentMethod: IRentPayment["paymentMethod"],
    transactionId: string
  ): IRentPayment | undefined;
}

// Static methods interface
export interface ITenantAllocationModel extends mongoose.Model<ITenantAllocation> {
  findActiveByTenant(
    tenantId: string,
    session?: ClientSession
  ): Promise<ITenantAllocation | null>;
  findActiveByRoom(
    roomId: string,
    bedNumber: string,
    session?: ClientSession
  ): Promise<ITenantAllocation | null>;
  findByListing(
    listingId: string,
    status?: string | string[],
    session?: ClientSession
  ): Promise<ITenantAllocation[]>;
  getUpcomingVacancies(
    listingIds: string[],
    days?: number,
    session?: ClientSession
  ): Promise<ITenantAllocation[]>;
  getOverdueRentAllocations(
    listingIds: string[],
    session?: ClientSession
  ): Promise<ITenantAllocation[]>;
}

const RentPaymentSchema = new Schema<IRentPayment>(
  {
    month: {
      type: Date,
      required: [true, "Month is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "paid", "overdue", "partial"],
        message: "{VALUE} is not a valid payment status",
      },
      default: "pending",
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: [0, "Paid amount cannot be negative"],
    },
    paidAt: { type: Date, default: null },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    lateFee: {
      type: Number,
      default: 0,
      min: [0, "Late fee cannot be negative"],
    },
    waivedAmount: {
      type: Number,
      default: 0,
      min: [0, "Waived amount cannot be negative"],
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "online", "upi", "bank_transfer", ""],
      default: "",
    },
    transactionId: {
      type: String,
      default: "",
      trim: true,
    },
    receiptUrl: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
      default: "",
      maxlength: [200, "Notes cannot exceed 200 characters"],
    },
  },
  { _id: true }
);

const ExtensionSchema = new Schema<IExtension>(
  {
    previousEndDate: { type: Date, required: true },
    newEndDate: { type: Date, required: true },
    extendedAt: { type: Date, default: Date.now },
    months: { type: Number, required: true, min: 1 },
    reason: { type: String, default: "" },
  },
  { _id: true }
);

const MoveInChecklistItemSchema = new Schema(
  {
    item: { type: String, required: true },
    checked: { type: Boolean, default: false },
    condition: {
      type: String,
      enum: ["good", "fair", "poor", "not_applicable", ""],
      default: "",
    },
    notes: { type: String, default: "" },
  },
  { _id: true }
);

const TenantAllocationSchema = new Schema<ITenantAllocation, ITenantAllocationModel>(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Tenant ID is required"],
      index: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: [true, "Booking ID is required"],
      unique: true,
    },
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: [true, "Listing ID is required"],
      index: true,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: [true, "Room ID is required"],
      index: true,
    },
    bedId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Bed ID is required"],
    },

    // Denormalized fields
    roomNumber: {
      type: String,
      required: [true, "Room number is required"],
      trim: true,
    },
    bedNumber: {
      type: String,
      required: [true, "Bed number is required"],
      trim: true,
    },
    roomType: {
      type: String,
      required: [true, "Room type is required"],
      trim: true,
    },
    pgName: {
      type: String,
      required: [true, "PG name is required"],
      trim: true,
    },

    // Dates
    allocatedAt: { type: Date, default: Date.now },
    moveInDate: {
      type: Date,
      required: [true, "Move-in date is required"],
    },
    expectedMoveOutDate: {
      type: Date,
      required: [true, "Expected move-out date is required"],
    },
    actualMoveOutDate: { type: Date, default: null },

    // Status
    status: {
      type: String,
      enum: {
        values: ["pending", "active", "notice_period", "vacated", "extended", "cancelled"],
        message: "{VALUE} is not a valid allocation status",
      },
      default: "pending",
    },

    // Notice period
    noticePeriodDays: {
      type: Number,
      default: 30,
      min: [0, "Notice period cannot be negative"],
      max: [90, "Notice period cannot exceed 90 days"],
    },
    noticeGivenDate: { type: Date, default: null },
    expectedVacateDate: { type: Date, default: null },
    vacationReason: {
      type: String,
      default: "",
      maxlength: [500, "Vacation reason cannot exceed 500 characters"],
    },

    // Financial
    monthlyRent: {
      type: Number,
      required: [true, "Monthly rent is required"],
      min: [0, "Monthly rent cannot be negative"],
    },
    securityDeposit: {
      type: Number,
      default: 0,
      min: [0, "Security deposit cannot be negative"],
    },
    securityDepositPaid: { type: Boolean, default: false },
    securityDepositRefunded: { type: Boolean, default: false },
    refundAmount: {
      type: Number,
      default: 0,
      min: [0, "Refund amount cannot be negative"],
    },
    refundDate: { type: Date, default: null },
    refundTransactionId: { type: String, default: "" },

    // Rent history
    rentHistory: [RentPaymentSchema],

    // Extensions
    extensions: [ExtensionSchema],

    // Move-in checklist
    moveInChecklist: {
      completed: { type: Boolean, default: false },
      completedAt: { type: Date, default: null },
      items: [MoveInChecklistItemSchema],
    },

    // Notes
    ownerNotes: {
      type: String,
      default: "",
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
    },
    tenantNotes: {
      type: String,
      default: "",
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
    },
    adminNotes: {
      type: String,
      default: "",
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
    },

    // Metadata
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
TenantAllocationSchema.index({ tenantId: 1, status: 1 });
TenantAllocationSchema.index({ listingId: 1, status: 1 });
TenantAllocationSchema.index({ roomId: 1, bedNumber: 1, status: 1 });
TenantAllocationSchema.index({ expectedVacateDate: 1, status: 1 });
TenantAllocationSchema.index({ "rentHistory.status": 1, "rentHistory.dueDate": 1 });
TenantAllocationSchema.index({ status: 1, createdAt: -1 });

// Instance Methods
TenantAllocationSchema.methods.getCurrentRent = function (): IRentPayment | undefined {
  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  return this.rentHistory.find((r: IRentPayment) => {
    const rentMonth = new Date(r.month);
    return (
      rentMonth.getMonth() === currentMonth.getMonth() &&
      rentMonth.getFullYear() === currentMonth.getFullYear()
    );
  });
};

TenantAllocationSchema.methods.getOverdueRents = function (): IRentPayment[] {
  return this.rentHistory.filter((r: IRentPayment) => r.status === "overdue");
};

TenantAllocationSchema.methods.getTotalPaidAmount = function (): number {
  return this.rentHistory
    .filter((r: IRentPayment) => r.status === "paid" || r.status === "partial")
    .reduce((acc: number, r: IRentPayment) => acc + r.paidAmount, 0);
};

TenantAllocationSchema.methods.getTotalDueAmount = function (): number {
  return this.rentHistory
    .filter((r: IRentPayment) => r.status === "pending" || r.status === "overdue")
    .reduce((acc: number, r: IRentPayment) => acc + (r.amount + r.lateFee - r.paidAmount), 0);
};

TenantAllocationSchema.methods.addRentEntry = function (
  month: Date,
  amount: number,
  dueDate: Date
): IRentPayment {
  const rentEntry = {
    month,
    amount,
    status: "pending" as const,
    paidAmount: 0,
    paidAt: null,
    dueDate,
    lateFee: 0,
    waivedAmount: 0,
    paymentMethod: "" as const,
    transactionId: "",
    receiptUrl: "",
    notes: "",
  };

  this.rentHistory.push(rentEntry);
  return this.rentHistory[this.rentHistory.length - 1];
};

TenantAllocationSchema.methods.markRentPaid = function (
  rentId: string,
  amount: number,
  paymentMethod: IRentPayment["paymentMethod"],
  transactionId: string
): IRentPayment | undefined {
  const rentIndex = this.rentHistory.findIndex(
    (r: IRentPayment) => r._id.toString() === rentId
  );

  if (rentIndex === -1) {
    return undefined;
  }

  const rent = this.rentHistory[rentIndex];
  rent.paidAmount += amount;
  rent.paymentMethod = paymentMethod;
  rent.transactionId = transactionId;
  rent.paidAt = new Date();

  const totalDue = rent.amount + rent.lateFee - rent.waivedAmount;
  if (rent.paidAmount >= totalDue) {
    rent.status = "paid";
  } else if (rent.paidAmount > 0) {
    rent.status = "partial";
  }

  return rent;
};

// Static Methods
TenantAllocationSchema.statics.findActiveByTenant = async function (
  tenantId: string,
  session?: ClientSession
): Promise<ITenantAllocation | null> {
  const query = this.findOne({
    tenantId,
    status: { $in: ["pending", "active", "notice_period"] },
  })
    .populate("listingId", "pgName location amenities")
    .populate("roomId");

  if (session) {
    query.session(session);
  }

  return query.exec();
};

TenantAllocationSchema.statics.findActiveByRoom = async function (
  roomId: string,
  bedNumber: string,
  session?: ClientSession
): Promise<ITenantAllocation | null> {
  const query = this.findOne({
    roomId,
    bedNumber,
    status: { $in: ["active", "notice_period"] },
  });

  if (session) {
    query.session(session);
  }

  return query.exec();
};

TenantAllocationSchema.statics.findByListing = async function (
  listingId: string,
  status?: string | string[],
  session?: ClientSession
): Promise<ITenantAllocation[]> {
  const filter: Record<string, unknown> = { listingId };

  if (status) {
    filter.status = Array.isArray(status) ? { $in: status } : status;
  }

  const query = this.find(filter)
    .populate("tenantId", "fullName email phone")
    .populate("bookingId")
    .sort({ createdAt: -1 });

  if (session) {
    query.session(session);
  }

  return query.exec();
};

TenantAllocationSchema.statics.getUpcomingVacancies = async function (
  listingIds: string[],
  days: number = 30,
  session?: ClientSession
): Promise<ITenantAllocation[]> {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  const query = this.find({
    listingId: { $in: listingIds },
    status: "notice_period",
    expectedVacateDate: {
      $gte: new Date(),
      $lte: futureDate,
    },
  })
    .populate("tenantId", "fullName email phone")
    .populate("listingId", "pgName");

  if (session) {
    query.session(session);
  }

  return query.exec();
};

TenantAllocationSchema.statics.getOverdueRentAllocations = async function (
  listingIds: string[],
  session?: ClientSession
): Promise<ITenantAllocation[]> {
  const query = this.find({
    listingId: { $in: listingIds },
    status: { $in: ["active", "notice_period"] },
    "rentHistory.status": "overdue",
  })
    .populate("tenantId", "fullName email phone")
    .populate("listingId", "pgName");

  if (session) {
    query.session(session);
  }

  return query.exec();
};

const TenantAllocation =
  (mongoose.models.TenantAllocation as ITenantAllocationModel) ||
  mongoose.model<ITenantAllocation, ITenantAllocationModel>(
    "TenantAllocation",
    TenantAllocationSchema
  );

export default TenantAllocation;