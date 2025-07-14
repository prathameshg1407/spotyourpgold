import Otp from "@/models/otp";
import PendingUser from "@/models/pendingUser";
import { connectToDB } from "@/services/connectdb";
import { NextResponse } from "next/server";
// import jwt from "jsonwebtoken";
import User from "@/models/user";
import { SignJWT } from "jose";
// import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    await connectToDB();

    const { email, otp, purpose } = await req.json();

    if (!email || !otp || !purpose) {
      return NextResponse.json({
        success: false,
        message: "Please fill all required fields (email, otp, purpose).",
      });
    }

    const latestOtp = await Otp.findOne({ email, purpose }).sort({
      createdAt: -1,
    });
    if (!latestOtp || latestOtp.otp !== otp) {
      return NextResponse.json({
        success: false,
        message: "Invalid OTP. Please try again.",
      });
    }

    const isExpired =
      Date.now() - latestOtp.createdAt.getTime() > 5 * 60 * 1000;
    if (isExpired) {
      return NextResponse.json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    if (purpose === "signup") {
      const pendingUser = await PendingUser.findOne({ email });
      if (!pendingUser) {
        return NextResponse.json({
          success: false,
          message: "Invalid OTP. Try again.",
        });
      }

      const createdUser = await User.create({
        fullName: pendingUser.fullName,
        email: pendingUser.email,
        password: pendingUser.password,
        mobile: pendingUser.mobile,
        role:
          email == "rajatsharma13feb04@gmail.com" ||
          email == process.env.ADMIN_EMAIL
            ? "admin"
            : "user",
      });

      await Promise.all([
        Otp.deleteMany({ email, purpose }),
        PendingUser.deleteOne({ email }),
      ]);

      // const token = jwt.sign(
      //   {
      //     id: createdUser._id.toString(),
      //     fullName: createdUser.fullName,
      //     role: createdUser.role,
      //   },
      //   process.env.JWT_SECRET as string,
      //   { expiresIn: "1d" }
      // );

      // const cookieStore = await cookies();

      // cookieStore.set("token", token, {
      //   httpOnly: true,
      //   secure: process.env.NODE_ENV === "production",
      //   sameSite: "strict",
      //   path: "/",
      //   maxAge: 60 * 60 * 24,
      // });

      const JWT_SECRET = process.env.JWT_SECRET as string;
      const secret = new TextEncoder().encode(JWT_SECRET);

      const token = await new SignJWT({
        id: createdUser._id.toString(),
        fullName: createdUser.fullName,
        role: createdUser.role,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("1d")
        .sign(secret);

      const res = NextResponse.json({
        success: true,
        message: "Registration successful.",
        user: {
          id: createdUser._id.toString(),
          email: createdUser.email,
          role: createdUser.role,
          fullName: createdUser.fullName,
          ownerStatus: createdUser.ownerStatus,
        },
      });

      res.cookies.set("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24,
      });

      return res;
    }

    if (purpose === "reset_password") {
      await Otp.deleteMany({ email, purpose });
      return NextResponse.json({
        success: true,
        message: "OTP verified. You can now reset your password.",
      });
    }

    return NextResponse.json({
      success: false,
      message: "Invalid purpose.",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      message: "Failed to verify registration. (error)",
    });
  }
}
