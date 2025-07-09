import Otp from "@/models/otp";
import PendingUser from "@/models/pendingUser";
import User from "@/models/user";
import bcrypt from "bcryptjs";
import { connectToDB } from "@/services/connectdb";
import { sendOtpEmail } from "@/services/sendOtpEmail";
import { NextResponse } from "next/server";

const generateOtp = (length = 5) =>
  Math.floor(100000 + Math.random() * 900000)
    .toString()
    .slice(0, length);

export async function POST(req: Request) {
  try {
    await connectToDB();
    const { fullName, email, password } = await req.json();

    if (!email || !password || !fullName)
      return NextResponse.json(
        { success: false, message: "Please fill all the fields. (email, password, fullName)" },
      );

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User already exists.",
        },
     
      );
    }

    // Throttle OTP resend
    const recentOtp = await Otp.findOne({ email, purpose: "signup" }).sort({
      createdAt: -1,
    });
    if (recentOtp && Date.now() - recentOtp.createdAt.getTime() < 60 * 1000) {
      return NextResponse.json({
        success: true,
        message: "OTP already sent. Please wait before trying again.",
      });
    }

    // Delete previous pending user and stale OTPs (if any)
    await Promise.all([
      PendingUser.deleteOne({ email }),
      Otp.deleteMany({ email, purpose: "signup" }),
    ]);

    const hashedPassword = await bcrypt.hash(password, 10);

    await PendingUser.create({
      fullName,
      email,
      password: hashedPassword,
    });

    const otp = generateOtp();
    await Otp.create({ email, otp, purpose: "signup" });

    const res = await sendOtpEmail({
      to: email,
      otp,
      purpose: "signup",
    });

    return NextResponse.json(res);
  } catch (error) {
    console.error("[REGISTER_API]", error);
    return NextResponse.json(
      { success: false, message: "Failed to register. (error)" },
    );
  }
}
