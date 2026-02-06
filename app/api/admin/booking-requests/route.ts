import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import Booking from "@/models/booking";
import { authUser } from "@/actions/authUser";

export async function GET(request: NextRequest) {
  try {
    await connectToDB();

    // Verify admin authentication
    const user = await authUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("per_page") || "20");
    const status = searchParams.get("status") || "all";
    const paymentMethod = searchParams.get("paymentMethod") || "all";
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * perPage;

    // Build query
    const query: any = {};

    if (status !== "all") {
      query.status = status;
    }

    if (paymentMethod !== "all") {
      query.paymentMethod = paymentMethod;
    }

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
      ];
    }

    // Get bookings with pagination
    const bookings = await Booking.find(query)
      .populate("userId", "fullName email phoneNumber")
      .populate("listingId", "pgName location primaryImage ownerId")
      .populate("ownerId", "fullName email phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(perPage);

    const total = await Booking.countDocuments(query);
    const totalPages = Math.ceil(total / perPage);

    // Get summary stats
    const stats = await Booking.aggregate([
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          pendingBookings: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          confirmedBookings: {
            $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] },
          },
          activeBookings: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
          },
          onlinePayments: {
            $sum: { $cond: [{ $eq: ["$paymentMethod", "online"] }, 1, 0] },
          },
          cashPayments: {
            $sum: { $cond: [{ $eq: ["$paymentMethod", "cash"] }, 1, 0] },
          },
          totalRevenue: {
            $sum: {
              $cond: [
                { $eq: ["$bookingFee.status", "paid"] },
                "$bookingFee.amount",
                0,
              ],
            },
          },
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      data: bookings,
      total,
      totalPages,
      currentPage: page,
      stats: stats[0] || {
        totalBookings: 0,
        pendingBookings: 0,
        confirmedBookings: 0,
        activeBookings: 0,
        onlinePayments: 0,
        cashPayments: 0,
        totalRevenue: 0,
      },
    });
  } catch (error) {
    console.error("Error fetching admin booking requests:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch booking requests" },
      { status: 500 }
    );
  }
}