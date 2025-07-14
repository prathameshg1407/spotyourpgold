import mongoose from "mongoose";

const listingSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Basic Info
    pgName: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["hostels", "flats", "pgs", "rooms"],
      required: false,
    },
    subType: {
      type: String,
      required: false,
    },
    roomTypes: [
      {
        type: { type: String, required: true, trim: true },
        numberOfRooms: { type: Number, required: true, min: 1 },
        availableRooms: { type: Number, required: true, min: 0 },
        capacityPerRoom: { type: Number, required: true, min: 1 },
        monthlyRent: { type: Number, required: true, min: 0 },
        securityDeposit: { type: Number, required: true, min: 0 },
      },
    ],
    genderPreference: {
      type: String,
      enum: ["male", "female", "both"],
      required: true,
    },

    // Amenities
    amenities: { type: [String], default: [] },
    additionalDetails: { type: [String], default: [] },
    rentInclusions: {
      foodIncluded: { type: Boolean, default: false },
      electricityIncluded: { type: Boolean, default: false },
      maintenanceIncluded: { type: Boolean, default: false },
    },

    // Rules
    rulesAndRegulations: { type: [String], default: [] },

    // Enhanced Rules Structure (optional - for backward compatibility)
    detailedRules: {
      lockInPeriod: { type: String, default: "" },
      noticePeriod: { type: String, default: "" },
      maintenanceCharges: { type: String, default: "" },
      entryTiming: { type: String, default: "" },
      exitTiming: { type: String, default: "" },
      guestStayPolicy: {
        type: String,
        enum: ["allowed", "not-allowed", "limited-access", ""],
        default: "",
      },
      smokingAlcoholPolicy: {
        type: String,
        enum: ["allowed", "not-allowed", "limited-access", ""],
        default: "",
      },
    },

    // Images
    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    ],
    primaryImage: { type: String }, // one of the image URLs

    // Videos
    videos: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    ],

    // Location
    location: {
      area: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      nearbyPlaces: { type: [String], default: [] }, // Array of nearby places
      coordinates: {
        type: {
          type: String,
          enum: ["Point"],
          required: true,
          default: "Point",
        },
        coordinates: {
          type: [Number], // [lng, lat]
          required: true,
          validate: {
            validator: (val: number[]) => val.length === 2,
            message: "Coordinates must be [lng, lat]",
          },
        },
      },
    },

    // Status Flags
    isApproved: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },

    // Monetization
    planType: {
      type: String,
      enum: ["free", "paid", "subscription"],
      default: "free",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    paymentId: { type: String }, // Razorpay/Stripe TXN ID
    paymentProof: { type: String }, // ✅ New field to store uploaded proof URL
  },
  {
    timestamps: true,
  }
);

listingSchema.index({ "location.coordinates": "2dsphere" });

const Listing =
  mongoose.models.Listing || mongoose.model("Listing", listingSchema);

export default Listing;
