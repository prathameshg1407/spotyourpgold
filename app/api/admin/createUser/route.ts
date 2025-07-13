import { connectToDB } from "@/services/connectdb";
import { NextResponse } from "next/server";
import authUser from "@/actions/authUser";
import bcrypt from "bcryptjs";
import User from "@/models/user";

export async function POST(req: Request) {
  try {
    await connectToDB();

    const user = await authUser();

    if (!user || user.role !== "admin") {
      return NextResponse.json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { email, password, fullName } = await req.json();

    if (!email || !password || !fullName) {
      return NextResponse.json({
        success: false,
        message: "Email and password are required",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      email,
      password: hashedPassword,
      role: "owner",
      ownerStatus: "verified",
      fullName: fullName,
    });

    return NextResponse.json({
      success: true,
      message: "User created successfully",
    });
  } catch (error) {
    console.error("[ADMIN_CREATE_USER]", error);
    return NextResponse.json({
      success: false,
      message: "Failed to create user",
    });
  }
}
