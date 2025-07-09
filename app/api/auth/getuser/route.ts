import { NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import authUser from "@/actions/authUser";
import User from "@/models/user";

interface LeanUser {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  ownerStatus: string;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

export async function GET() {
  try {
    await connectToDB();

    const auth = await authUser();


    if (!auth) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
      );
    }

    const user = await User.findById(auth.id)
      .select("-password")
      .lean<LeanUser>();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
      );
    }


    return NextResponse.json({
      success: true,
      user: {
        ...user,
        id: user._id.toString(),
      },
    });
  } catch (error) {
    console.error("[GET_USER_API]", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to get user. (error)",
      },
    );
  }
}
