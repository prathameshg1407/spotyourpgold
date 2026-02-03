// app/api/admin/property-verification/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import Listing from "@/models/listing";
import User from "@/models/user";
import Notification from "@/models/notification";
import { authUser } from "@/actions/authUser";

// GET - Get all listings for verification
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
    const status = searchParams.get("status") || "pending"; // pending, approved, rejected, all
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const perPage = Math.min(Number(searchParams.get("per_page") || "20"), 50);
    const type = searchParams.get("type"); // pgs, hostels, flats, etc.
    const city = searchParams.get("city");

    // Build query
    const query: any = {};

    if (status === "pending") {
      query.isApproved = false;
      query.isActive = true;
    } else if (status === "approved") {
      query.isApproved = true;
    } else if (status === "rejected") {
      query.isActive = false;
      query.isApproved = false;
    }

    if (type) query.type = type;
    if (city) query["location.city"] = { $regex: city, $options: "i" };

    const total = await Listing.countDocuments(query);

    const listings = await Listing.find(query)
      .populate("ownerId", "fullName email phone ownerStatus")
      .select(
        "pgName type subType location images primaryImage roomTypes genderPreference amenities isApproved isActive isFeatured planType paymentStatus createdAt"
      )
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    const totalPages = Math.ceil(total / perPage);

    // Get summary
    const summary = await Listing.aggregate([
      {
        $group: {
          _id: {
            isApproved: "$isApproved",
            isActive: "$isActive",
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const summaryData = {
      pending: summary.find((s) => !s._id.isApproved && s._id.isActive)?.count || 0,
      approved: summary.find((s) => s._id.isApproved)?.count || 0,
      rejected: summary.find((s) => !s._id.isApproved && !s._id.isActive)?.count || 0,
      total: await Listing.countDocuments({}),
    };

    // Get city-wise breakdown
    const cityBreakdown = await Listing.aggregate([
      { $match: { isApproved: true, isActive: true } },
      {
        $group: {
          _id: "$location.city",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Get type-wise breakdown
    const typeBreakdown = await Listing.aggregate([
      { $match: { isApproved: true, isActive: true } },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      data: listings,
      total,
      totalPages,
      currentPage: page,
      summary: summaryData,
      analytics: {
        cityBreakdown,
        typeBreakdown,
      },
    });
  } catch (error) {
    console.error("Get property verification list error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Approve/Reject/Feature property
export async function PATCH(req: NextRequest) {
  try {
    await connectToDB();

    const user = await authUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const { listingId, action, rejectionReason, featureUntil } = await req.json();

    if (!listingId || !action) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const listing = await Listing.findById(listingId).populate(
      "ownerId",
      "fullName email"
    );

    if (!listing) {
      return NextResponse.json(
        { success: false, message: "Listing not found" },
        { status: 404 }
      );
    }

    const owner = listing.ownerId as any;

    switch (action) {
      case "approve":
        listing.isApproved = true;
        listing.isActive = true;
        await listing.save();

        // Notify owner
        await Notification.create({
          userId: owner._id,
          type: "general",
          title: "Property Approved! 🎉",
          message: `Your property "${listing.pgName}" has been approved and is now live on SpotYourPG.`,
          relatedId: listing._id,
          relatedType: "listing",
          priority: "high",
        });

        return NextResponse.json({
          success: true,
          message: "Property approved successfully",
        });

      case "reject":
        listing.isApproved = false;
        listing.isActive = false;
        await listing.save();

        // Notify owner
        await Notification.create({
          userId: owner._id,
          type: "general",
          title: "Property Not Approved",
          message: `Your property "${listing.pgName}" was not approved. ${
            rejectionReason ? `Reason: ${rejectionReason}` : "Please contact support for details."
          }`,
          relatedId: listing._id,
          relatedType: "listing",
          priority: "high",
          metadata: { rejectionReason },
        });

        return NextResponse.json({
          success: true,
          message: "Property rejected",
        });

      case "feature":
        listing.isFeatured = true;
        await listing.save();

        // Notify owner
        await Notification.create({
          userId: owner._id,
          type: "general",
          title: "Property Featured! ⭐",
          message: `Great news! Your property "${listing.pgName}" is now featured on SpotYourPG.`,
          relatedId: listing._id,
          relatedType: "listing",
          priority: "medium",
        });

        return NextResponse.json({
          success: true,
          message: "Property featured successfully",
        });

      case "unfeature":
        listing.isFeatured = false;
        await listing.save();

        return NextResponse.json({
          success: true,
          message: "Property unfeatured",
        });

      case "deactivate":
        listing.isActive = false;
        await listing.save();

        // Notify owner
        await Notification.create({
          userId: owner._id,
          type: "general",
          title: "Property Deactivated",
          message: `Your property "${listing.pgName}" has been deactivated. Please contact support for more information.`,
          relatedId: listing._id,
          relatedType: "listing",
          priority: "high",
        });

        return NextResponse.json({
          success: true,
          message: "Property deactivated",
        });

      case "reactivate":
        listing.isActive = true;
        await listing.save();

        return NextResponse.json({
          success: true,
          message: "Property reactivated",
        });

      default:
        return NextResponse.json(
          { success: false, message: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Property verification action error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}