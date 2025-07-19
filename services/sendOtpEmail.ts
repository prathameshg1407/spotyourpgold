"use server";

import nodemailer from "nodemailer";

// Check if email configuration is properly set
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error(
    "Email configuration missing. Please set EMAIL_USER and EMAIL_PASS in your environment variables."
  );
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // e.g., your Gmail
    pass: process.env.EMAIL_PASS, // App password if using Gmail
  },
  tls: {
    rejectUnauthorized: false, // Allow self-signed certificates
  },
});

export const sendOtpEmail = async ({
  to,
  otp,
  purpose,
}: {
  to: string;
  otp: string;
  purpose: "signup" | "reset_password";
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
    // Check if email configuration is available
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error(
        "Email configuration is missing. Please set EMAIL_USER and EMAIL_PASS environment variables."
      );
    }

    // Verify the transporter connection
    await transporter.verify();
    console.log("Email transporter verified successfully");

    const mailOptions = {
      from: `"Spot Your PG" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    console.log("Sending email to:", to);
    const result = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", result.messageId);

    return { success: true, message: "OTP sent successfully." };
  } catch (error: any) {
    console.error("Error sending OTP email:", error);

    // Provide specific error messages
    if (error.message?.includes("Email configuration is missing")) {
      return {
        success: false,
        message: "Email service is not configured. Please contact support.",
      };
    }

    if (error.code === "EAUTH" || error.responseCode === 535) {
      return {
        success: false,
        message: "Email authentication failed. Please check email credentials.",
      };
    }

    if (error.code === "ECONNECTION" || error.code === "ETIMEDOUT") {
      return {
        success: false,
        message:
          "Email service is temporarily unavailable. Please try again later.",
      };
    }

    if (error.message?.includes("verify")) {
      return {
        success: false,
        message: "Email service verification failed. Please check email configuration.",
      };
    }

    return {
      success: false,
      message: "Failed to send OTP. Please try again or contact support.",
    };
  }
};
