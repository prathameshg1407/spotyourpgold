import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
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
      street: {
        type: String,
        required: true,
        trim: true,
      },
      city: {
        type: String,
        required: true,
        trim: true,
      },
      state: {
        type: String,
        required: true,
        trim: true,
      },
      pincode: {
        type: String,
        required: true,
        trim: true,
      },
    },

    // Identity Verification
    aadhaarNumber: {
      type: String,
      required: false, // Made optional as per previous request
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
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },

    // Payment Information
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    amount: {
      type: Number,
      required: true,
    },
    securityDeposit: {
      type: Number,
      required: true,
    },

    // Terms and Conditions
    termsAccepted: {
      type: Boolean,
      required: true,
      default: false,
    },

    // Admin/Owner Notes
    adminNotes: {
      type: String,
      default: "",
    },
    ownerNotes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ listingId: 1, status: 1 });
bookingSchema.index({ status: 1, createdAt: -1 });

const Booking =
  mongoose.models.Booking || mongoose.model("Booking", bookingSchema);

export default Booking;
