import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import authUser from "@/actions/authUser"; // if using JWT/session based auth
import OwnerProfile from "@/models/ownerProfile";
import User from "@/models/user";


export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();
    const { id } = await context.params; // Await the params

    const user = await authUser(); // if you're using session or token auth

    if(!user || user.role !== "admin") {
      return NextResponse.json({
        success: false,
        message: "Unauthorized",
      });
    }

    const owner = await User.findById(id).select("_id fullName email ownerStatus").lean();

    if(!owner) {
      return NextResponse.json({
        success: false,
        message: "Owner not found",
      });
    }

    const ownerProfile = await OwnerProfile.findOne({userId:id}).select("_id phone aadhaarNumber address documents paymentDetails").lean();

    if(!ownerProfile) {
      return NextResponse.json({
        success: false,
        message: "Owner profile not found",
      });   
    }


    return NextResponse.json({
      success: true,
      message: "Owner profile fetched successfully",
      data: {
        ...owner,
        ownerDetails: ownerProfile,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: "Server error" });
  }
}
