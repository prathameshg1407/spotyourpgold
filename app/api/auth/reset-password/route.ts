
import { NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import User from "@/models/user";
import bcrypt from "bcryptjs";


export async function POST(req: Request) {
  try {
    await connectToDB();

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Please fill all the fields. (email, password)" },
      );
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid email. Please try again." },
      );
    }

    const isSamePassword = await bcrypt.compare(password, user.password);
    if (isSamePassword) {
      return NextResponse.json(
        {
          success: false,
          message: "New password must be different from the current one.",
        },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.updateOne({ email }, { password: hashedPassword });

    return NextResponse.json({ success: true, message: "Password reset successfully." });
  } catch (error) {
    console.error("[RESET_PASSWORD_API]", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to reset password. (error)",
      },
    );
  }
}
