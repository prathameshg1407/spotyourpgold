// app/api/admin/top-properties/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import Listing from "@/models/listing";
import Booking from "@/models/booking";
import Room from "@/models/room";
import { authUser } from "@/actions/authUser";
import mongoose from "mongoose";

// GET - Get top-rated and high-performing properties
export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    const user = await authUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const metric = searchParams.get("metric") || "bookings"; // bookings, occupancy, revenue
    const period = searchParams.get("period") || "month"; // week, month, quarter, year
    const limit = Math.min(Number(searchParams.get("limit") || "20"), 50);

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "quarter":
        startDate.setMonth(now.getMonth() - 3);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    let topProperties: any[] = [];

    if (metric === "bookings") {
      // Top properties by booking count
      const bookingStats = await Booking.aggregate([
        {
          $match: {
            status: "confirmed",
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: "$listingId",
            bookingCount: { $sum: 1 },
            totalRevenue: { $sum: "$amount" },
          },
        },
        { $sort: { bookingCount: -1 } },
        { $limit: limit },
      ]);

      const listingIds = bookingStats.map((s) => s._id);
      const listings = await Listing.find({ _id: { $in: listingIds } })
        .populate("ownerId", "fullName email")
        .select("pgName type location primaryImage isFeatured");

      topProperties = bookingStats.map((stat) => {
        const listing = listings.find(
          (l: any) => l._id.toString() === stat._id.toString()
        );
        return {
          listing,
          metrics: {
            bookingCount: stat.bookingCount,
            totalRevenue: stat.totalRevenue,
          },
        };
      });
    } else if (metric === "occupancy") {
      // Top properties by occupancy rate
      const allListings = await Listing.find({
        isApproved: true,
        isActive: true,
      })
        .populate("ownerId", "fullName email")
        .select("pgName type location primaryImage isFeatured");

      const listingIds = allListings.map((l) => l._id);
      const rooms = await Room.find({ listingId: { $in: listingIds } });

      const occupancyData = allListings.map((listing: any) => {
        const listingRooms = rooms.filter(
          (r: any) => r.listingId.toString() === listing._id.toString()
        );

        const totalBeds = listingRooms.reduce(
          (acc, r: any) => acc + r.beds.length,
          0
        );
        const occupiedBeds = listingRooms.reduce(
          (acc, r: any) => acc + r.occupiedBeds,
          0
        );

        const occupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;

        return {
          listing,
          metrics: {
            occupancyRate: Math.round(occupancyRate),
            totalBeds,
            occupiedBeds,
            availableBeds: totalBeds - occupiedBeds,
          },
        };
      });

      topProperties = occupancyData
        .filter((d) => d.metrics.totalBeds > 0)
        .sort((a, b) => b.metrics.occupancyRate - a.metrics.occupancyRate)
        .slice(0, limit);
    } else if (metric === "revenue") {
      // Top properties by revenue
      const revenueStats = await Booking.aggregate([
        {
          $match: {
            status: "confirmed",
            paymentStatus: "completed_cash",
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: "$listingId",
            totalRevenue: { $sum: { $add: ["$amount", "$securityDeposit"] } },
            bookingCount: { $sum: 1 },
            avgBookingValue: { $avg: "$amount" },
          },
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: limit },
      ]);

      const listingIds = revenueStats.map((s) => s._id);
      const listings = await Listing.find({ _id: { $in: listingIds } })
        .populate("ownerId", "fullName email")
        .select("pgName type location primaryImage isFeatured");

      topProperties = revenueStats.map((stat) => {
        const listing = listings.find(
          (l: any) => l._id.toString() === stat._id.toString()
        );
        return {
          listing,
          metrics: {
            totalRevenue: stat.totalRevenue,
            bookingCount: stat.bookingCount,
            avgBookingValue: Math.round(stat.avgBookingValue),
          },
        };
      });
    }

    // Get featured properties
    const featuredProperties = await Listing.find({
      isFeatured: true,
      isApproved: true,
      isActive: true,
    })
      .populate("ownerId", "fullName email")
      .select("pgName type location primaryImage")
      .limit(10);

    // Get recently approved
    const recentlyApproved = await Listing.find({
      isApproved: true,
      isActive: true,
    })
      .populate("ownerId", "fullName email")
      .select("pgName type location primaryImage createdAt")
      .sort({ createdAt: -1 })
      .limit(10);

    return NextResponse.json({
      success: true,
      data: {
        topProperties,
        featuredProperties,
        recentlyApproved,
        filters: {
          metric,
          period,
          startDate,
          endDate: now,
        },
      },
    });
  } catch (error) {
    console.error("Get top properties error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}