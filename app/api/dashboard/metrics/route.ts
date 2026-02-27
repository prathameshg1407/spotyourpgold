import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import mongoose from "mongoose";
import User from "@/models/user";
import Listing from "@/models/listing";
import Review from "@/models/review";
import VisitRequest from "@/models/visitRequest";
import OwnerProfile from "@/models/ownerProfile";
import Booking from "@/models/booking";

export async function GET(request: NextRequest) {
  try {
    await connectToDB();

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const userId = searchParams.get("userId");

    if (!role) {
      return NextResponse.json(
        { success: false, message: "Role parameter is required" },
        { status: 400 }
      );
    }

    let metrics = {};

    if (role === "owner" && userId) {
      metrics = await getOwnerMetrics(userId);
    } else if (role === "admin") {
      metrics = await getAdminMetrics();
    } else if (role === "user" && userId) {
      metrics = await getUserMetrics(userId);
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid role or missing userId" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error("Dashboard metrics error:", error);
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

async function getOwnerMetrics(userId: string) {
  try {
    // Get owner's listings with optimized aggregation
    const listingsAggregation = await Listing.aggregate([
      { $match: { ownerId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalListings: { $sum: 1 },
          activeListings: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$isActive", true] },
                    { $eq: ["$isApproved", true] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          featuredListings: {
            $sum: { $cond: ["$isFeatured", 1, 0] },
          },
          totalRooms: {
            $sum: {
              $reduce: {
                input: "$roomTypes",
                initialValue: 0,
                in: { $add: ["$$value", "$$this.numberOfRooms"] },
              },
            },
          },
          availableRooms: {
            $sum: {
              $reduce: {
                input: "$roomTypes",
                initialValue: 0,
                in: { $add: ["$$value", "$$this.availableRooms"] },
              },
            },
          },
        },
      },
    ]);

    const listingStats = listingsAggregation[0] || {
      totalListings: 0,
      activeListings: 0,
      featuredListings: 0,
      totalRooms: 0,
      availableRooms: 0,
    };

    // Calculate occupancy rate
    const occupancyRate =
      listingStats.totalRooms > 0
        ? Math.round(
          ((listingStats.totalRooms - listingStats.availableRooms) /
            listingStats.totalRooms) *
          100
        )
        : 0;

    // Get reviews for owner's listings
    const reviewsAggregation = await Review.aggregate([
      {
        $lookup: {
          from: "listings",
          localField: "listingId",
          foreignField: "_id",
          as: "listing",
        },
      },
      {
        $match: {
          "listing.ownerId": new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: "$rating" },
        },
      },
    ]);

    const reviewStats = reviewsAggregation[0] || {
      totalReviews: 0,
      averageRating: 0,
    };

    // Get visit requests for owner's listings
    const ownerListingIds = await Listing.find({
      ownerId: new mongoose.Types.ObjectId(userId),
    }).distinct("_id");
    const visitRequestsCount = await VisitRequest.countDocuments({
      listingId: { $in: ownerListingIds },
      status: "pending",
    });

    // Get wishlist count for owner's listings
    let totalWishlist = 0;
    try {
      const wishlistCount = await User.aggregate([
        {
          $unwind: "$watchlist",
        },
        {
          $lookup: {
            from: "listings",
            localField: "watchlist",
            foreignField: "_id",
            as: "listing",
          },
        },
        {
          $match: {
            "listing.ownerId": new mongoose.Types.ObjectId(userId),
          },
        },
        {
          $count: "totalWishlist",
        },
      ]);

      totalWishlist = wishlistCount[0]?.totalWishlist || 0;
    } catch (error) {
      console.error("Error calculating wishlist count:", error);
      // Fallback: count manually
      const users = await User.find({ watchlist: { $exists: true, $ne: [] } });
      const ownerListingIds = await Listing.find({
        ownerId: new mongoose.Types.ObjectId(userId),
      }).distinct("_id");

      for (const user of users) {
        for (const watchlistItem of user.watchlist) {
          if (
            ownerListingIds.some(
              (id) => id.toString() === watchlistItem.toString()
            )
          ) {
            totalWishlist++;
          }
        }
      }
    }

    // Get pending booking requests for owner's listings
    const pendingBookingRequests = await Booking.countDocuments({
      listingId: { $in: ownerListingIds },
      status: "pending",
    });

    return {
      totalListings: listingStats.totalListings,
      activeListings: listingStats.activeListings,
      featuredListings: listingStats.featuredListings,
      totalRevenue: 0, // As requested, keeping revenue as 0 for now
      totalReviews: reviewStats.totalReviews,
      averageRating: Math.round(reviewStats.averageRating * 10) / 10 || 0,
      pendingVisitRequests: visitRequestsCount,
      pendingBookingRequests: pendingBookingRequests,
      monthlyRevenue: 0, // As requested, keeping revenue as 0 for now
      totalWishlist: totalWishlist,
    };
  } catch (error) {
    console.error("Owner metrics error:", error);
    throw error;
  }
}

async function getAdminMetrics() {
  try {
    // Get total users count
    const totalUsers = await User.countDocuments();

    // Get total owners (users with owner role and verified status)
    const totalOwners = await User.countDocuments({
      role: "owner",
      ownerStatus: "verified",
    });

    // Get pending owner requests
    const pendingRequests = await User.countDocuments({
      role: "owner",
      ownerStatus: "pending",
    });

    // Get listings statistics
    const listingsAggregation = await Listing.aggregate([
      {
        $group: {
          _id: null,
          totalListings: { $sum: 1 },
          activeListings: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$isActive", true] },
                    { $eq: ["$isApproved", true] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          featuredListings: {
            $sum: { $cond: ["$isFeatured", 1, 0] },
          },
          pendingListings: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$isActive", true] },
                    { $eq: ["$isApproved", false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          paidListings: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "completed"] }, 1, 0],
            },
          },
          listingFeeRevenue: {
            $sum: {
              $cond: [
                { $eq: ["$paymentStatus", "completed"] },
                { $ifNull: ["$listingFeePaid", 999] },
                0
              ]
            }
          },
        },
      },
    ]);

    const listingStats = listingsAggregation[0] || {
      totalListings: 0,
      activeListings: 0,
      featuredListings: 0,
      pendingListings: 0,
      paidListings: 0,
      listingFeeRevenue: 0,
    };

    // Use exact amount from database
    const listingFeeRevenue = listingStats.listingFeeRevenue;

    // Get pending visit requests
    const pendingVisitRequests = await VisitRequest.countDocuments({
      status: "pending",
    });

    // Get booking commission revenue (10% of total rent collected)
    const bookingCommissionAggregation = await Booking.aggregate([
      {
        $match: {
          status: { $in: ["active", "completed"] },
        },
      },
      {
        $group: {
          _id: null,
          totalCommission: {
            $sum: {
              $multiply: [
                { $ifNull: ["$firstMonthRent.amount", 0] },
                0.1,
              ],
            },
          },
        },
      },
    ]);

    const bookingCommission = bookingCommissionAggregation[0]?.totalCommission || 0;
    const totalRevenue = listingFeeRevenue + bookingCommission;

    return {
      totalUsers,
      totalOwners,
      totalListings: listingStats.activeListings,
      pendingRequests,
      pendingListings: listingStats.pendingListings,
      featuredListings: listingStats.featuredListings,
      pendingVisitRequests,
      listingFeeRevenue,
      bookingCommissionRevenue: Math.round(bookingCommission),
      totalRevenue: Math.round(totalRevenue),
      paidListings: listingStats.paidListings,
    };
  } catch (error) {
    console.error("Admin metrics error:", error);
    throw error;
  }
}

async function getUserMetrics(userId: string) {
  try {
    // Get user's watchlist count
    const user = await User.findById(userId).populate("watchlist");
    const watchlistCount = user?.watchlist?.length || 0;

    // Get user's reviews count
    const reviewsCount = await Review.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
    });

    // Get user's visit requests count
    const visitRequestsCount = await VisitRequest.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
    });

    // Get user's bookings count
    const bookingsCount = await Booking.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
    });

    return {
      totalWatchlist: watchlistCount,
      totalReviews: reviewsCount,
      totalVisitRequests: visitRequestsCount,
      totalBookings: bookingsCount,
    };
  } catch (error) {
    console.error("User metrics error:", error);
    throw error;
  }
}
