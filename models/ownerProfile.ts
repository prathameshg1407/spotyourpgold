import mongoose from "mongoose";

const documentsSchema = new mongoose.Schema(
  {
    aadhaarFrontUrl: { type: String, required: false },
    aadhaarBackUrl: { type: String, required: false },
    aadhaarFrontPublicId: { type: String, required: false },
    aadhaarBackPublicId: { type: String, required: false },
    additionalDocuments: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    ],
  },
  { _id: false }
);

const paymentDetailsSchema = new mongoose.Schema(
  {
    accountNumber: { type: String },
    ifscCode: { type: String },
    accountHolderName: { type: String },
    bankName: { type: String },
    upiId: { type: String },
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: "India" },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  { _id: false }
);

const ownerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // ✅ Only declare unique HERE, not in index below
    },

    phone: {
      type: String,
      required: true,
    },

    phoneVerified: {
      type: Boolean,
      default: false,
    },

    aadhaarNumber: {
      type: String,
      required: false, // ✅ OPTIONAL
      default: "", // ✅ Default to empty string
    },

    address: {
      type: addressSchema,
      required: true,
    },

    documents: {
      type: documentsSchema,
    },

    paymentDetails: {
      type: paymentDetailsSchema,
    },
  },
  { timestamps: true }
);

// ✅ REMOVED duplicate userId index

// ✅ Sparse unique index for aadhaarNumber (allows multiple empty values)
ownerProfileSchema.index(
  { aadhaarNumber: 1 },
  { 
    unique: true, 
    sparse: true, // Only enforce uniqueness when value exists
    partialFilterExpression: { aadhaarNumber: { $ne: "" } } // Extra safety
  }
);

const OwnerProfile =
  mongoose.models.OwnerProfile ||
  mongoose.model("OwnerProfile", ownerProfileSchema);

export default OwnerProfile;