import authUser from "@/actions/authUser";
import User from "@/models/user";
import { connectToDB } from "@/services/connectdb";
import { NextResponse } from "next/server";

export async function PUT(req: Request) {
  try {
    await connectToDB();

    const { id, isWishlisted } = await req.json(); // `id` = listingId

    const user = await authUser();
    if (!user) {
      return NextResponse.json({
        success: false,
        message: "Unauthorized",
      });
    }

    const wishListedUser = await User.findById(user.id);
    if (!wishListedUser) {
      return NextResponse.json({
        success: false,
        message: "User not found",
      });
    }

    if (isWishlisted) {
      // Remove from watchlist
      wishListedUser.watchlist = wishListedUser.watchlist.filter(
        (itemId:any) => itemId.toString() !== id
      );
    } else {
      // Add to watchlist if not already there
      if (!wishListedUser.watchlist.includes(id)) {
        wishListedUser.watchlist.push(id);
      }
    }

    await wishListedUser.save();

    return NextResponse.json({
      success: true,
      message: isWishlisted ? "Removed from watchlist" : "Added to watchlist",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: "Server error" });
  }
}
