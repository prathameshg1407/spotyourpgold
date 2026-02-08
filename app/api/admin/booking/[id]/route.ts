import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import Booking from "@/models/booking";
import Commission from "@/models/commission";
import { authUser } from "@/actions/authUser";

// GET single booking details (VIEW ONLY for Admin)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();

    const user = await authUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const { id: bookingId } = await params;

    const booking = await Booking.findById(bookingId)
      .populate("userId", "fullName email phoneNumber")
      .populate("listingId", "pgName location primaryImage rooms")
      .populate("ownerId", "fullName email phone bankDetails");

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Get related commissions
    const commissions = await Commission.find({ bookingId: booking._id })
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: {
        booking,
        commissions,
      },
    });
  } catch (error) {
    console.error("Get booking error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch booking" },
      { status: 500 }
    );
  }
}