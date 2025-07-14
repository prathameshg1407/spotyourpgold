import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },

    role: {
      type: String,
      enum: ["user", "owner", "admin"],
      default: "user",
    },

    ownerStatus: {
      type: String,
      enum: ["none", "pending", "rejected", "verified"],
      default: "none",
    },

    watchlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Listing" }],
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
