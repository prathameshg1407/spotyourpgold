import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import mongoose from "mongoose";
import Booking from "@/models/booking";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();

    const { id: bookingId } = await params;

    if (!bookingId) {
      return NextResponse.json(
        { success: false, message: "Booking ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const {
      fullName,
      phoneNumber,
      email,
      address,
      aadhaarNumber,
      additionalRequirements,
      moveInDate,
      duration,
      roomType,
    } = body;

    // Validate required fields
    if (
      !fullName ||
      !phoneNumber ||
      !email ||
      !address ||
      !moveInDate ||
      !duration ||
      !roomType
    ) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get current booking to check if room type or duration changed
    const currentBooking = await Booking.findById(bookingId).populate(
      "listingId"
    );
    if (!currentBooking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Calculate new amount if room type or duration changed
    let newAmount = currentBooking.amount;
    let newSecurityDeposit = currentBooking.securityDeposit;

    if (
      roomType !== currentBooking.roomType ||
      duration !== currentBooking.duration
    ) {
      const listing = currentBooking.listingId as any;
      const selectedRoom = listing.roomTypes.find(
        (room: any) => room.type === roomType
      );

      if (selectedRoom) {
        const durationMonths = parseInt(duration);
        newAmount = selectedRoom.monthlyRent * durationMonths;
        newSecurityDeposit = selectedRoom.securityDeposit;
      }
    }

    // Update booking
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        fullName,
        phoneNumber,
        email,
        address,
        aadhaarNumber: aadhaarNumber || "",
        additionalRequirements: additionalRequirements || "",
        moveInDate: new Date(moveInDate),
        duration,
        roomType,
        amount: newAmount,
        securityDeposit: newSecurityDeposit,
      },
      { new: true }
    ).populate("listingId", "pgName location images roomTypes");

    if (!updatedBooking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Booking updated successfully",
      data: updatedBooking,
    });
  } catch (error) {
    console.error("Update booking error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
