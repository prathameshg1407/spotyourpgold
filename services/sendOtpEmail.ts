"use server";

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // e.g., your Gmail
    pass: process.env.EMAIL_PASS, // App password if using Gmail
  },
});

export const sendOtpEmail = async ({
  to,
  otp,
  purpose,
}: {
  to: string;
  otp: string;
  purpose: "signup" | "reset_password" ;
}) => {
  const subjectMap = {
    signup: "Complete Your Signup – OTP Verification",
    reset_password: "Reset Password – OTP Verification",
    phone_verification: "Verify Your Phone Number",
  };

  const subject = subjectMap[purpose];

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #4F46E5;">Spot Your PG</h2>
      <p>Your OTP for <strong>${purpose.replace("_", " ")}</strong> is:</p>
      <h3 style="font-size: 24px; color: #111;">${otp}</h3>
      <p>This OTP will expire in 5 minutes. Do not share it with anyone.</p>
      <hr />
      <small style="color: #888;">If you did not request this, please ignore this email.</small>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Spot Your PG" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    return { success: true, message: "OTP sent successfully." };
  } catch (error) {
    console.error("Error sending OTP email:", error);
    return { success: false, message: "Failed to send OTP." };
  }
};
