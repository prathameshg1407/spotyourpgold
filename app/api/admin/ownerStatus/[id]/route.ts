import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import authUser from "@/actions/authUser"; // if using JWT/session based auth
import User from "@/models/user";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();
    const { id } = await context.params; // Await the params

    const user = await authUser(); // if you're using session or token auth

    if (!user || user.role !== "admin") {
      return NextResponse.json({
        success: false,
        message: "Unauthorized",
      });
    }

    const owner = await User.findById(id).select("_id ownerStatus role");

    if (!owner) {
      return NextResponse.json({
        success: false,
        message: "User not found",
      });
    }

    const newStatus = owner.ownerStatus === "verified" ? "pending" : "verified";
    const newRole = owner.role === "owner" ? "user" : "owner";

    owner.ownerStatus = newStatus;
    owner.role = newRole;

    await owner.save();


    return NextResponse.json({
      success: true,
      message: "Owner Status Updated",
      newStatus,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: "Server error" });
  }
}
