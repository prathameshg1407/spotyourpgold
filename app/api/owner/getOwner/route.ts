
import { connectToDB } from "@/services/connectdb";
import OwnerProfile from "@/models/ownerProfile";
import { NextResponse } from "next/server";
import authUser from "@/actions/authUser";

export async function GET(req: Request) {
  try {
    await connectToDB();

    const user = await authUser();


    if (!user) {
      return NextResponse.json({
        success: false,
        message: "Unauthorized",
      });
    }

    const profile = await OwnerProfile.findOne({ userId: user?.id }).lean();

    if (!profile) {
      return NextResponse.json({
        success: false,
        message: "Owner profile not found",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Owner profile fetched successfully",
      data: profile,
    });
  } catch (error) {
    console.error("[GET_OWNER_PROFILE]", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch owner profile" },
    );
  }
}
