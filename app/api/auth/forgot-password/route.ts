import { NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import Otp from "@/models/otp";
import User from "@/models/user";
import { sendOtpEmail } from "@/services/sendOtpEmail";

function generateOtp(length = 5) {
  return Math.floor(100000 + Math.random() * 900000)
    .toString()
    .slice(0, length);
}

export async function POST(req: Request) {
  try {
    await connectToDB();

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Please fill all the fields. (email)" },
      );
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid email. Please try again." },
      );
    }

    const recentOtp = await Otp.findOne({
      email,
      purpose: "reset_password",
    }).sort({ createdAt: -1 });

    if (recentOtp && Date.now() - recentOtp.createdAt.getTime() < 60 * 1000) {
      return NextResponse.json(
        {
          success: true,
          message: "OTP already sent. Please check your email.",
        },
      );
    }

    await Otp.deleteMany({ email, purpose: "reset_password" });

    const otp = generateOtp();

    await Otp.create({ email, otp, purpose: "reset_password" });

    const res = await sendOtpEmail({
      to: email,
      otp,
      purpose: "reset_password",
    });

    return NextResponse.json(res);
  } catch (error) {
    console.error("[FORGOT_PASSWORD_API]", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to process forgot password. (error)",
      },
    );
  }
}
