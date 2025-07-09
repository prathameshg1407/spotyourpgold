import mongoose from "mongoose";

const pendingUserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed
  createdAt: { type: Date, default: Date.now, expires: 1800 }, // 30 minutes TTL
});

const PendingUser = mongoose.models.PendingUser || mongoose.model("PendingUser", pendingUserSchema);

export default PendingUser;
