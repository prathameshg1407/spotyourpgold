import { NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import authUser from "@/actions/authUser";
import User from "@/models/user";
import Listing from "@/models/listing";

export async function GET() {
  try {
    await connectToDB();

    const user = await authUser();

    if (!user || user.role !== "admin") {
      return NextResponse.json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Get all users with their watchlists populated
    const users = await User.find({ role: "user" })
      .select("_id fullName email phone watchlist createdAt updatedAt")
      .populate({
        path: "watchlist",
        select: "_id pgName location.city location.area primaryImage ownerId",
        populate: {
          path: "ownerId",
          select: "fullName",
        },
      })
      .sort({ createdAt: -1 })
      .lean();

    // Calculate listing popularity (how many users have favorited each listing)
    const listingPopularity = await User.aggregate([
      {
        $match: { role: "user", watchlist: { $exists: true, $ne: [] } },
      },
      {
        $unwind: "$watchlist",
      },
      {
        $group: {
          _id: "$watchlist",
          favoriteCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "listings",
          localField: "_id",
          foreignField: "_id",
          as: "listingInfo",
        },
      },
      {
        $unwind: "$listingInfo",
      },
      {
        $lookup: {
          from: "users",
          localField: "listingInfo.ownerId",
          foreignField: "_id",
          as: "ownerInfo",
        },
      },
      {
        $unwind: "$ownerInfo",
      },
      {
        $project: {
          _id: 1,
          favoriteCount: 1,
          pgName: "$listingInfo.pgName",
          location: "$listingInfo.location",
          primaryImage: "$listingInfo.primaryImage",
          owner: {
            _id: "$ownerInfo._id",
            fullName: "$ownerInfo.fullName",
          },
        },
      },
      {
        $sort: { favoriteCount: -1 },
      },
    ]);

    // Format the response
    const formattedUsers = users.map((user) => ({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      watchlistCount: user.watchlist?.length || 0,
      watchlist: user.watchlist || [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      message: "Users with watchlists fetched successfully",
      data: formattedUsers,
      listingPopularity: listingPopularity,
    });
  } catch (error) {
    console.error("[GET_USERS_WITH_WATCHLIST]", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch users with watchlists" },
      { status: 500 }
    );
  }
}
