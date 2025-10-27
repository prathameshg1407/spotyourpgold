import mongoose, { Schema, Document } from "mongoose";

// Interface for PG Listing Progress
export interface IPGListingProgress extends Document {
  userId: string;
  formData: {
    // Basic Info
    pgName?: string;
    primaryLine?: string;
    type?: string;
    subType?: string;
    roomTypes?: Array<{
      type: string;
      numberOfRooms: number;
      availableRooms: number;
      capacityPerRoom: number;
      monthlyRent: number;
      securityDeposit: number;
    }>;
    genderPreference?: "male" | "female" | "both";
    additionalDetails?: string[];

    // Location
    location?: {
      area: string;
      city: string;
      state: string;
      pincode: string;
      coordinates: {
        type: "Point";
        coordinates: [number, number]; // [longitude, latitude]
      };
      nearbyPlaces?: string[];
    };

    // Rules and Regulations
    rulesAndRegulations?: string[];
    detailedRules?: {
      lockInPeriod: string;
      noticePeriod: string;
      maintenanceCharges: string;
      entryTiming: string;
      exitTiming: string;
      guestStayPolicy: string;
      smokingAlcoholPolicy: string;
    };

    // Amenities
    amenities?: string[];

    // Rent Inclusions
    rentInclusions?: {
      foodIncluded: boolean;
      electricityIncluded: boolean;
      maintenanceIncluded: boolean;
    };

    // Meal Timings
    mealTimings?: {
      morning: { enabled: boolean; from: string; to: string };
      noon: { enabled: boolean; from: string; to: string };
      evening: { enabled: boolean; from: string; to: string };
      night: { enabled: boolean; from: string; to: string };
    };

    // Images and Videos
    images?: string[]; // Array of image URLs
    videos?: string[]; // Array of video URLs
    existingImageUrls?: string[]; // For edit mode
    existingVideoUrls?: string[]; // For edit mode

    // Additional fields
    monthlyRent?: number;
    minRent?: number;
    securityDeposit?: number;
    numberOfRooms?: number;
    capacityPerRoom?: number;
  };
  currentStep: number;
  totalSteps: number;
  isCompleted: boolean;
  lastSavedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// PG Listing Progress Schema
const PGListingProgressSchema = new Schema<IPGListingProgress>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    formData: {
      // Basic Info
      pgName: { type: String, default: "" },
      primaryLine: { type: String, default: "" },
      type: { type: String, default: "" },
      subType: { type: String, default: "" },
      roomTypes: [
        {
          type: { type: String, default: "" },
          numberOfRooms: { type: Number, default: 0 },
          availableRooms: { type: Number, default: 0 },
          capacityPerRoom: { type: Number, default: 0 },
          monthlyRent: { type: Number, default: 0 },
          securityDeposit: { type: Number, default: 0 },
        },
      ],
      genderPreference: {
        type: String,
        enum: ["male", "female", "both"],
        default: "both",
      },
      additionalDetails: [String],

      // Location
      location: {
        area: { type: String, default: "" },
        city: { type: String, default: "" },
        state: { type: String, default: "" },
        pincode: { type: String, default: "" },
        coordinates: {
          type: { type: String, enum: ["Point"], default: "Point" },
          coordinates: { type: [Number], default: [0, 0] },
        },
        nearbyPlaces: [String],
      },

      // Rules and Regulations
      rulesAndRegulations: [String],
      detailedRules: {
        lockInPeriod: { type: String, default: "" },
        noticePeriod: { type: String, default: "" },
        maintenanceCharges: { type: String, default: "" },
        entryTiming: { type: String, default: "" },
        exitTiming: { type: String, default: "" },
        guestStayPolicy: { type: String, default: "" },
        smokingAlcoholPolicy: { type: String, default: "" },
      },

      // Amenities
      amenities: [String],

      // Rent Inclusions
      rentInclusions: {
        foodIncluded: { type: Boolean, default: false },
        electricityIncluded: { type: Boolean, default: false },
        maintenanceIncluded: { type: Boolean, default: false },
      },

      // Meal Timings
      mealTimings: {
        morning: {
          enabled: { type: Boolean, default: false },
          from: { type: String, default: "" },
          to: { type: String, default: "" },
        },
        noon: {
          enabled: { type: Boolean, default: false },
          from: { type: String, default: "" },
          to: { type: String, default: "" },
        },
        evening: {
          enabled: { type: Boolean, default: false },
          from: { type: String, default: "" },
          to: { type: String, default: "" },
        },
        night: {
          enabled: { type: Boolean, default: false },
          from: { type: String, default: "" },
          to: { type: String, default: "" },
        },
      },

      // Images and Videos
      images: [String],
      videos: [String],
      existingImageUrls: [String],
      existingVideoUrls: [String],

      // Additional fields
      monthlyRent: { type: Number, default: 0 },
      minRent: { type: Number, default: 0 },
      securityDeposit: { type: Number, default: 0 },
      numberOfRooms: { type: Number, default: 0 },
      capacityPerRoom: { type: Number, default: 0 },
    },
    currentStep: {
      type: Number,
      required: true,
      min: 1,
      max: 6,
      default: 1,
    },
    totalSteps: {
      type: Number,
      required: true,
      default: 6,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    lastSavedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
PGListingProgressSchema.index({ userId: 1, createdAt: -1 });
PGListingProgressSchema.index({ isCompleted: 1 });
PGListingProgressSchema.index({ lastSavedAt: -1 });

// Create the model
const PGListingProgress =
  mongoose.models.PGListingProgress ||
  mongoose.model<IPGListingProgress>(
    "PGListingProgress",
    PGListingProgressSchema
  );

export default PGListingProgress;
