import mongoose, { Schema, Document, ClientSession } from "mongoose";

// Bed interface
export interface IBed {
  _id: mongoose.Types.ObjectId;
  bedNumber: string;
  bedLabel: string; // "Bed A", "Single Bed", etc.
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
  _id: mongoose.Types.ObjectId;
  listingId: mongoose.Types.ObjectId;
  roomTypeId: mongoose.Types.ObjectId;
  roomType: string;
  roomNumber: string;
  floor: number;
  capacity: number;
  beds: IBed[];
  status: "available" | "partial" | "full" | "maintenance";
  occupiedBeds: number;
  availableBeds: number;
  reservedBeds: number;
  isAC: boolean;
  hasAttachedBathroom: boolean;
  amenities: string[];
  notes: string;
  monthlyRent: number;
  securityDeposit: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  getBedByNumber(bedNumber: string): IBed | undefined;
  getBedById(bedId: string): IBed | undefined;
  getAvailableBeds(): IBed[];
  updateBedStatus(
    bedNumber: string,
    status: IBed["status"],
    tenantData?: Partial<IBed>
  ): Promise<IRoom>;
  recalculateOccupancy(): void;
}

// Static methods interface
export interface IRoomModel extends mongoose.Model<IRoom> {
  findByListingWithOccupancy(
    listingId: string,
    session?: ClientSession
  ): Promise<IRoom[]>;
  getUpcomingVacancies(
    listingId: string,
    days?: number,
    session?: ClientSession
  ): Promise<IRoom[]>;
  findAvailableBed(
    listingId: string,
    roomType: string,
    session?: ClientSession
  ): Promise<{ room: IRoom; bed: IBed } | null>;
  atomicAllocateBed(
    roomId: string,
    bedNumber: string,
    tenantId: string,
    allocationId: string,
    moveInDate: Date,
    expectedVacateDate: Date,
    session: ClientSession
  ): Promise<IRoom | null>;
  atomicVacateBed(
    roomId: string,
    bedNumber: string,
    session: ClientSession
  ): Promise<IRoom | null>;
}

const BedSchema = new Schema<IBed>(
  {
    bedNumber: {
      type: String,
      required: [true, "Bed number is required"],
      trim: true,
    },
    bedLabel: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ["available", "occupied", "reserved", "maintenance"],
        message: "{VALUE} is not a valid bed status",
      },
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
  },
  { _id: true }
);

const RoomSchema = new Schema<IRoom, IRoomModel>(
  {
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: [true, "Listing ID is required"],
      index: true,
    },
    roomTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Room type ID is required"],
    },
    roomType: {
      type: String,
      required: [true, "Room type is required"],
      trim: true,
    },
    roomNumber: {
      type: String,
      required: [true, "Room number is required"],
      trim: true,
    },
    floor: {
      type: Number,
      default: 0,
      min: [0, "Floor cannot be negative"],
    },
    capacity: {
      type: Number,
      required: [true, "Capacity is required"],
      min: [1, "Capacity must be at least 1"],
      max: [20, "Capacity cannot exceed 20"],
    },
    beds: {
      type: [BedSchema],
      validate: {
        validator: function (beds: IBed[]) {
          return beds.length > 0 && beds.length <= 20;
        },
        message: "Room must have between 1 and 20 beds",
      },
    },
    status: {
      type: String,
      enum: {
        values: ["available", "partial", "full", "maintenance"],
        message: "{VALUE} is not a valid room status",
      },
      default: "available",
    },
    occupiedBeds: {
      type: Number,
      default: 0,
      min: 0,
    },
    availableBeds: {
      type: Number,
      default: 0,
      min: 0,
    },
    reservedBeds: {
      type: Number,
      default: 0,
      min: 0,
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
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
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
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
RoomSchema.index({ listingId: 1, status: 1 });
RoomSchema.index({ listingId: 1, roomType: 1 });
RoomSchema.index({ listingId: 1, roomNumber: 1 }, { unique: true });
RoomSchema.index({ listingId: 1, isActive: 1, status: 1 });
RoomSchema.index({ "beds.status": 1 });
RoomSchema.index({ "beds._id": 1 });
RoomSchema.index({ "beds.expectedVacateDate": 1, "beds.status": 1 });
RoomSchema.index({ "beds.currentTenantId": 1 });

// Instance Methods
RoomSchema.methods.getBedByNumber = function (bedNumber: string): IBed | undefined {
  return this.beds.find((bed: IBed) => bed.bedNumber === bedNumber);
};

RoomSchema.methods.getBedById = function (bedId: string): IBed | undefined {
  return this.beds.find((bed: IBed) => bed._id.toString() === bedId);
};

RoomSchema.methods.getAvailableBeds = function (): IBed[] {
  return this.beds.filter((bed: IBed) => bed.status === "available");
};

RoomSchema.methods.recalculateOccupancy = function (): void {
  const occupied = this.beds.filter((bed: IBed) => bed.status === "occupied").length;
  const available = this.beds.filter((bed: IBed) => bed.status === "available").length;
  const reserved = this.beds.filter((bed: IBed) => bed.status === "reserved").length;
  const maintenance = this.beds.filter((bed: IBed) => bed.status === "maintenance").length;

  this.occupiedBeds = occupied;
  this.availableBeds = available;
  this.reservedBeds = reserved;

  // Determine room status
  if (maintenance === this.beds.length) {
    this.status = "maintenance";
  } else if (available === 0 && reserved === 0) {
    this.status = "full";
  } else if (occupied === 0 && reserved === 0) {
    this.status = "available";
  } else {
    this.status = "partial";
  }
};

// Pre-save middleware to recalculate occupancy
RoomSchema.pre("save", function (next) {
  this.recalculateOccupancy();
  next();
});

// Static Methods
RoomSchema.statics.findByListingWithOccupancy = async function (
  listingId: string,
  session?: ClientSession
): Promise<IRoom[]> {
  const query = this.find({ listingId, isActive: true })
    .populate("beds.currentTenantId", "fullName email phone")
    .sort({ floor: 1, roomNumber: 1 });

  if (session) {
    query.session(session);
  }

  return query.exec();
};

RoomSchema.statics.getUpcomingVacancies = async function (
  listingId: string,
  days: number = 30,
  session?: ClientSession
): Promise<IRoom[]> {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  const query = this.find({
    listingId,
    isActive: true,
    beds: {
      $elemMatch: {
        status: "occupied",
        expectedVacateDate: {
          $gte: new Date(),
          $lte: futureDate,
        },
      },
    },
  }).populate("beds.currentTenantId", "fullName email phone");

  if (session) {
    query.session(session);
  }

  return query.exec();
};

RoomSchema.statics.findAvailableBed = async function (
  listingId: string,
  roomType: string,
  session?: ClientSession
): Promise<{ room: IRoom; bed: IBed } | null> {
  const query = this.findOne({
    listingId,
    roomType,
    isActive: true,
    "beds.status": "available",
  });

  if (session) {
    query.session(session);
  }

  const room = await query.exec();

  if (!room) {
    return null;
  }

  const availableBed = room.beds.find((bed: IBed) => bed.status === "available");

  if (!availableBed) {
    return null;
  }

  return { room, bed: availableBed };
};

// Atomic bed allocation with optimistic locking
RoomSchema.statics.atomicAllocateBed = async function (
  roomId: string,
  bedNumber: string,
  tenantId: string,
  allocationId: string,
  moveInDate: Date,
  expectedVacateDate: Date,
  session: ClientSession
): Promise<IRoom | null> {
  const result = await this.findOneAndUpdate(
    {
      _id: roomId,
      "beds.bedNumber": bedNumber,
      "beds.status": "available",
    },
    {
      $set: {
        "beds.$.status": "occupied",
        "beds.$.currentTenantId": new mongoose.Types.ObjectId(tenantId),
        "beds.$.currentAllocationId": new mongoose.Types.ObjectId(allocationId),
        "beds.$.occupiedFrom": moveInDate,
        "beds.$.expectedVacateDate": expectedVacateDate,
        "beds.$.noticeGiven": false,
        "beds.$.noticeDate": null,
      },
    },
    {
      new: true,
      session,
      runValidators: true,
    }
  );

  if (result) {
    result.recalculateOccupancy();
    await result.save({ session });
  }

  return result;
};

// Atomic bed vacation
RoomSchema.statics.atomicVacateBed = async function (
  roomId: string,
  bedNumber: string,
  session: ClientSession
): Promise<IRoom | null> {
  const result = await this.findOneAndUpdate(
    {
      _id: roomId,
      "beds.bedNumber": bedNumber,
      "beds.status": { $in: ["occupied", "reserved"] },
    },
    {
      $set: {
        "beds.$.status": "available",
        "beds.$.currentTenantId": null,
        "beds.$.currentAllocationId": null,
        "beds.$.occupiedFrom": null,
        "beds.$.expectedVacateDate": null,
        "beds.$.noticeGiven": false,
        "beds.$.noticeDate": null,
      },
    },
    {
      new: true,
      session,
      runValidators: true,
    }
  );

  if (result) {
    result.recalculateOccupancy();
    await result.save({ session });
  }

  return result;
};

const Room =
  (mongoose.models.Room as IRoomModel) ||
  mongoose.model<IRoom, IRoomModel>("Room", RoomSchema);

export default Room;