import mongoose, { Schema, Document } from "mongoose";

// Bed interface
interface IBed {
  bedNumber: string;
  status: "available" | "occupied" | "reserved" | "maintenance";
  currentTenantId: mongoose.Types.ObjectId | null;
  currentAllocationId: mongoose.Types.ObjectId | null;
  occupiedFrom: Date | null;
  expectedVacateDate: Date | null;
  noticeGiven: boolean;
  noticeDate: Date | null;
}

// Room interface
export interface IRoom extends Document {
  listingId: mongoose.Types.ObjectId;
  roomTypeId: mongoose.Types.ObjectId;
  roomType: string; // "single", "double", "triple", etc.
  roomNumber: string; // "101", "102", "A1", etc.
  floor: number;
  capacity: number;
  beds: IBed[];
  status: "available" | "partial" | "full" | "maintenance";
  occupiedBeds: number;
  availableBeds: number;
  isAC: boolean;
  hasAttachedBathroom: boolean;
  amenities: string[];
  notes: string;
  monthlyRent: number;
  securityDeposit: number;
  createdAt: Date;
  updatedAt: Date;
}

const BedSchema = new Schema<IBed>({
  bedNumber: { type: String, required: true }, // "A", "B", "C" or "1", "2"
  status: {
    type: String,
    enum: ["available", "occupied", "reserved", "maintenance"],
    default: "available",
  },
  currentTenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  currentAllocationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TenantAllocation",
    default: null,
  },
  occupiedFrom: { type: Date, default: null },
  expectedVacateDate: { type: Date, default: null },
  noticeGiven: { type: Boolean, default: false },
  noticeDate: { type: Date, default: null },
});

const RoomSchema = new Schema<IRoom>(
  {
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    roomTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    roomType: {
      type: String,
      required: true,
    },
    roomNumber: {
      type: String,
      required: true,
      trim: true,
    },
    floor: {
      type: Number,
      default: 0,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    beds: [BedSchema],
    status: {
      type: String,
      enum: ["available", "partial", "full", "maintenance"],
      default: "available",
    },
    occupiedBeds: {
      type: Number,
      default: 0,
    },
    availableBeds: {
      type: Number,
      default: 0,
    },
    isAC: {
      type: Boolean,
      default: false,
    },
    hasAttachedBathroom: {
      type: Boolean,
      default: false,
    },
    amenities: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      default: "",
    },
    monthlyRent: {
      type: Number,
      required: true,
    },
    securityDeposit: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
RoomSchema.index({ listingId: 1, status: 1 });
RoomSchema.index({ listingId: 1, roomType: 1 });
RoomSchema.index({ listingId: 1, roomNumber: 1 }, { unique: true });
RoomSchema.index({ "beds.status": 1 });
RoomSchema.index({ "beds.expectedVacateDate": 1 });

// Virtual to calculate occupied/available beds
RoomSchema.pre("save", function (next) {
  const occupiedCount = this.beds.filter(
    (bed) => bed.status === "occupied" || bed.status === "reserved"
  ).length;
  const availableCount = this.beds.filter(
    (bed) => bed.status === "available"
  ).length;

  this.occupiedBeds = occupiedCount;
  this.availableBeds = availableCount;

  // Update room status based on beds
  if (this.beds.every((bed) => bed.status === "maintenance")) {
    this.status = "maintenance";
  } else if (availableCount === 0) {
    this.status = "full";
  } else if (occupiedCount === 0) {
    this.status = "available";
  } else {
    this.status = "partial";
  }

  next();
});

// Static method to get upcoming vacancies
RoomSchema.statics.getUpcomingVacancies = async function (
  listingId: string,
  days: number = 30
) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  return this.find({
    listingId,
    "beds.expectedVacateDate": {
      $gte: new Date(),
      $lte: futureDate,
    },
  }).populate("beds.currentTenantId", "fullName email phone");
};

const Room = mongoose.models.Room || mongoose.model<IRoom>("Room", RoomSchema);

export default Room;