import authUser from "@/actions/authUser";
import Listing from "@/models/listing";
import { connectToDB } from "@/services/connectdb";
import { NextResponse } from "next/server";

export async function PUT(req: Request) {
  try {
    await connectToDB();
    const user = await authUser();

    if (user?.role !== "owner") {
      return NextResponse.json({
        success: false,
        message: "You are not authorized to perform this action.",
      });
    }

    const { pgId, roomTypeId, availableRooms } = await req.json();

    if (
      !pgId ||
      !roomTypeId ||
      typeof availableRooms !== "number" ||
      availableRooms < 0
    ) {
      return NextResponse.json({
        success: false,
        message: "Missing or invalid fields.",
      });
    }

    const updateRes = await Listing.updateOne(
      { _id: pgId, "roomTypes._id": roomTypeId },
      {
        $set: {
          "roomTypes.$.availableRooms": availableRooms,
        },
      }
    );

    if (updateRes.modifiedCount === 0) {
      return NextResponse.json({
        success: false,
        message: "Room type not found or no changes made.",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Room availability updated successfully.",
    });
  } catch (error) {
    console.error("[updatePg_API]", error);
    return NextResponse.json({
      success: false,
      message: "Server error while updating PG.",
    });
  }
}
