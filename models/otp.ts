import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
        email: { type: String }, // Optional if phone is used
        phone: { type: String }, // Optional if email is used
        otp: { type: String, required: true },
        purpose: {
            type: String,
            enum: ["signup", "reset_password", "phone_verification"],
            required: true,
        },
        createdAt: { type: Date, default: Date.now, expires: 300 }, // TTL: 5 mins
});

const Otp = mongoose.models.Otp || mongoose.model("Otp", otpSchema);
export default Otp;
