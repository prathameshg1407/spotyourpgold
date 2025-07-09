import mongoose from "mongoose";

const documentsSchema = new mongoose.Schema(
  {
    aadhaarFrontUrl: { type: String, required: true },
    aadhaarBackUrl: { type: String, required: true },
    aadhaarFrontPublicId: { type: String },
    aadhaarBackPublicId: { type: String },
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
      unique: true,
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
      required: true,
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

ownerProfileSchema.index({ user: 1 });
ownerProfileSchema.index({ aadhaarNumber: 1 }, { unique: true });

const OwnerProfile =
  mongoose.models.OwnerProfile ||
  mongoose.model("OwnerProfile", ownerProfileSchema);

export default OwnerProfile;
