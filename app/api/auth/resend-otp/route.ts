import { NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import Otp from "@/models/otp";
import PendingUser from "@/models/pendingUser";
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
    const { email, purpose } = await req.json();

    if (!email || !purpose) {
      return NextResponse.json(
        {
          success: false,
          message: "Please fill all the fields. (email,purpose)",
        },
      );
    }

    if (purpose === "signup") {
      const pendingUser = await PendingUser.findOne({ email });
      if (!pendingUser) {
        return NextResponse.json(
          {
            success: false,
            message: "No email found , enter email again",
          },        );
      }
    }

    if (purpose === "reset_password") {
      const user = await User.findOne({ email });
      if (!user) {
        return NextResponse.json(
          {
            success: false,
            message: "Email not found. Please check and try again.",
          },
        );
      }
    }

    const recentOtp = await Otp.findOne({ email, purpose }).sort({
      createdAt: -1,
    });
    if (recentOtp && Date.now() - recentOtp.createdAt.getTime() < 60 * 1000) {
      return NextResponse.json(
        {
          success: false,
          message: "OTP already sent. Please wait a minute before retrying.",
        },
      );
    }

    await Otp.deleteMany({ email, purpose });

    const otp = generateOtp();
    await Otp.create({ email, otp, purpose });

    const res = await sendOtpEmail({ to: email, otp, purpose });

    return NextResponse.json(res);
  } catch (error) {
    console.error("[RESEND_OTP_API]", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to resend OTP. (error)",
      },
    );
  }
}
