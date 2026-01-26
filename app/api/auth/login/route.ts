import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

import { connectToDB } from "@/services/connectdb";
import User from "@/models/user";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        message: "Please fill all the fields. (email, password)",
      });
    }

    // Handle admin login separately (hardcoded admin credentials)
    if (email === "admin@admin.com" && password === "admin123") {
      const JWT_SECRET = process.env.JWT_SECRET as string;
      const secret = new TextEncoder().encode(JWT_SECRET);

      const token = await new SignJWT({
        id: "admin",
        fullName: "Admin",
        role: "admin",
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("1d")
        .sign(secret);

      const res = NextResponse.json({
        success: true,
        message: "Admin login successful.",
        user: {
          id: "admin",
          email: "admin@admin.com",
          role: "admin",
          fullName: "Admin",
          ownerStatus: "verified",
        },
      });

      res.cookies.set("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24, // 1 day
      });

      return res;
    }

    // Handle wrong admin password
    if (email === "admin@admin.com" && password !== "admin123") {
      return NextResponse.json({
        success: false,
        message: "Invalid password. Please try again.",
      });
    }

    // Connect to DB for regular users
    await connectToDB();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({
        success: false,
        message: "Invalid email. Please try again.",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return NextResponse.json({
        success: false,
        message: "Invalid password. Please try again.",
      });
    }

    const JWT_SECRET = process.env.JWT_SECRET as string;
    const secret = new TextEncoder().encode(JWT_SECRET);

    const token = await new SignJWT({
      id: user._id.toString(),
      fullName: user.fullName,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1d")
      .sign(secret);

    const res = NextResponse.json({
      success: true,
      message: "Login successful.",
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        ownerStatus: user.ownerStatus,
        phone: user.phone,
      },
    });

    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });

    return res;
  } catch (error) {
    console.error("[LOGIN_API]", error);
    return NextResponse.json({
      success: false,
      message: "Failed to login. Please try again.",
    });
  }
}