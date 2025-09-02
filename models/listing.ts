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
      enum: ["hostels", "flats", "pgs", "rooms", "commercial"],
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
      required: false,
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

// ===== ULTRA-FAST SEARCH INDEXES =====

// 1. Geospatial index for location-based queries
listingSchema.index({ "location.coordinates": "2dsphere" });

// 2. Compound index for status and featured listings (most common query)
listingSchema.index({
  isActive: 1,
  isApproved: 1,
  isFeatured: -1,
  createdAt: -1,
});

// 3. Text index for full-text search across all text fields
listingSchema.index(
  {
    pgName: "text",
    type: "text",
    subType: "text",
    genderPreference: "text",
    "location.area": "text",
    "location.city": "text",
    "location.state": "text",
    "location.pincode": "text",
    "location.nearbyPlaces": "text",
    amenities: "text",
    additionalDetails: "text",
    rulesAndRegulations: "text",
    "roomTypes.type": "text",
    "detailedRules.lockInPeriod": "text",
    "detailedRules.noticePeriod": "text",
    "detailedRules.maintenanceCharges": "text",
    "detailedRules.entryTiming": "text",
    "detailedRules.exitTiming": "text",
    "detailedRules.guestStayPolicy": "text",
    "detailedRules.smokingAlcoholPolicy": "text",
    planType: "text",
    paymentStatus: "text",
  },
  {
    weights: {
      pgName: 10,
      "location.area": 8,
      "location.city": 8,
      type: 6,
      genderPreference: 4,
      amenities: 3,
      "location.nearbyPlaces": 2,
    },
    name: "comprehensive_search_index",
  }
);

// 4. Individual field indexes for specific searches
listingSchema.index({ pgName: 1 });
listingSchema.index({ "location.city": 1 });
listingSchema.index({ "location.area": 1 });
listingSchema.index({ type: 1 });
listingSchema.index({ genderPreference: 1 });
listingSchema.index({ "roomTypes.monthlyRent": 1 });
listingSchema.index({ amenities: 1 });

// 5. Compound index for filtered searches
listingSchema.index({
  isActive: 1,
  isApproved: 1,
  type: 1,
  genderPreference: 1,
  "location.city": 1,
});

// 6. Index for price-based queries
listingSchema.index({
  isActive: 1,
  isApproved: 1,
  "roomTypes.monthlyRent": 1,
});

// 7. Owner-based queries
listingSchema.index({ ownerId: 1, isActive: 1 });

const Listing =
  mongoose.models.Listing || mongoose.model("Listing", listingSchema);

export default Listing;
