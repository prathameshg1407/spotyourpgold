import { NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import authUser from "@/actions/authUser";
import User from "@/models/user";
import OwnerProfile from "@/models/ownerProfile";

interface LeanUser {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
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
      return NextResponse.json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await User.findById(auth.id)
      .select("-password")
      .lean<LeanUser>();

    if (!user) {
      return NextResponse.json({
        success: false,
        message: "User not found",
      });
    }

    // Get owner profile if user is an owner
    let ownerProfile = null;
    if (user.role === "owner") {
      ownerProfile = await OwnerProfile.findOne({ userId: user._id }).lean();
    }

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        id: user._id.toString(),
        ownerProfile,
      },
    });
  } catch (error) {
    console.error("[GET_USER_API]", error);
    return NextResponse.json({
      success: false,
      message: "Failed to get user. (error)",
    });
  }
}
