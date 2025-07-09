import { connectToDB } from "@/services/connectdb";
import { NextResponse } from "next/server";
import authUser from "@/actions/authUser";
import User from "@/models/user";

export async function GET(req: Request) {
  try {
    await connectToDB();

    const user = await authUser();


    if (!user || user.role !== "admin") {
      return NextResponse.json({
        success: false,
        message: "Unauthorized",
      });
    }

    const owners = await User.find({ownerStatus:{$in:["verified","pending"]}}).select("_id fullName email ownerStatus").sort({createdAt:-1}).lean();


    return NextResponse.json({
      success: true,
      message: "Owner profile fetched successfully",
      data: owners,
    });
  } catch (error) {
    console.error("[GET_OWNER_PROFILE]", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch owner profile" },
    );
  }
}
