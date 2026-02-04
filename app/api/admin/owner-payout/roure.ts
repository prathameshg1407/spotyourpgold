import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import mongoose from "mongoose";
import Booking from "@/models/booking";
import Commission from "@/models/commission";
import User from "@/models/user";
import Notification from "@/models/notification";
import { authUser } from "@/actions/authUser";

// GET: Get all pending owner payouts
export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    const user = await authUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "pending";
    const ownerId = searchParams.get("ownerId");

    // Build query for bookings with pending payouts
    const bookingQuery: any = {
      "firstMonthCommission.ownerPayoutStatus": status,
      paymentStatus: "completed_cash",
    };
    
    if (ownerId) {
      bookingQuery.ownerId = new mongoose.Types.ObjectId(ownerId);
    }

    const pendingPayouts = await Booking.find(bookingQuery)
      .populate("ownerId", "fullName email phone bankDetails")
      .populate("listingId", "pgName")
      .populate("userId", "fullName email")
      .sort({ cashCollectedAt: 1 });

    // Owner-wise summary
    const ownerWiseSummary = await Booking.aggregate([
      {
        $match: {
          "firstMonthCommission.ownerPayoutStatus": "pending",
          paymentStatus: "completed_cash",
        },
      },
      {
        $group: {
          _id: "$ownerId",
          totalPendingPayout: { $sum: "$firstMonthCommission.ownerAmount" },
          bookingCount: { $sum: 1 },
          bookings: { $push: "$_id" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "owner",
        },
      },
      { $unwind: "$owner" },
      {
        $project: {
          ownerId: "$_id",
          ownerName: "$owner.fullName",
          ownerEmail: "$owner.email",
          ownerPhone: "$owner.phone",
          bankDetails: "$owner.bankDetails",
          totalPendingPayout: 1,
          bookingCount: 1,
          bookings: 1,
        },
      },
      { $sort: { totalPendingPayout: -1 } },
    ]);

    const totalPending = ownerWiseSummary.reduce(
      (sum, owner) => sum + owner.totalPendingPayout,
      0
    );

    // Get completed payouts for reference
    const completedPayouts = await Booking.find({
      "firstMonthCommission.ownerPayoutStatus": "completed",
    })
      .populate("ownerId", "fullName")
      .populate("listingId", "pgName")
      .sort({ "firstMonthCommission.ownerPayoutDate": -1 })
      .limit(20);

    return NextResponse.json({
      success: true,
      data: {
        pendingPayouts,
        ownerWiseSummary,
        totalPending,
        completedPayouts,
      },
    });
  } catch (error) {
    console.error("Get pending payouts error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Process owner payout (admin pays 90% to owner)
export async function POST(req: NextRequest) {
  const session = await mongoose.startSession();

  try {
    await connectToDB();

    const user = await authUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    const {
      bookingIds,
      payoutMethod,
      payoutReference,
      notes,
    } = await req.json();

    if (!bookingIds || bookingIds.length === 0) {
      return NextResponse.json(
        { success: false, message: "No bookings selected" },
        { status: 400 }
      );
    }

    session.startTransaction();

    const bookings = await Booking.find({
      _id: { $in: bookingIds },
      "firstMonthCommission.ownerPayoutStatus": "pending",
      paymentStatus: "completed_cash",
    })
      .populate("listingId", "pgName")
      .session(session);

    if (bookings.length === 0) {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, message: "No pending payouts found" },
        { status: 404 }
      );
    }

    let totalPaidOut = 0;
    const ownerUpdates: { [key: string]: number } = {};

    for (const booking of bookings) {
      booking.firstMonthCommission.ownerPayoutStatus = "completed";
      booking.firstMonthCommission.ownerPayoutDate = new Date();
      booking.firstMonthCommission.ownerPayoutMethod = payoutMethod;
      booking.firstMonthCommission.ownerPayoutReference = payoutReference;
      booking.firstMonthCommission.ownerPayoutBy = new mongoose.Types.ObjectId(user.id);

      if (notes) {
        booking.adminNotes = `${booking.adminNotes || ""}\nPayout: ${notes}`;
      }

      await booking.save({ session });

      totalPaidOut += booking.firstMonthCommission.ownerAmount;

      const ownerId = booking.ownerId.toString();
      ownerUpdates[ownerId] =
        (ownerUpdates[ownerId] || 0) + booking.firstMonthCommission.ownerAmount;

      // Update commission record
      await Commission.findOneAndUpdate(
        {
          bookingId: booking._id,
          commissionType: "first_month_owner",
        },
        {
          status: "completed",
          settledAt: new Date(),
          settledBy: user.id,
          settlementMethod: payoutMethod,
          settlementReference: payoutReference,
          notes: notes || "",
        },
        { session }
      );
    }

    // Update owner settlement summaries
    for (const [ownerId, amount] of Object.entries(ownerUpdates)) {
      await User.findByIdAndUpdate(
        ownerId,
        {
          $inc: {
            "settlementSummary.totalPayoutReceived": amount,
            "settlementSummary.pendingPayoutAmount": -amount,
          },
          $set: {
            "settlementSummary.lastSettlementDate": new Date(),
          },
        },
        { session }
      );

      // Notify owner
      await Notification.create([{
        userId: ownerId,
        type: "payment",
        title: "Payout Received",
        message: `You have received a payout of ₹${amount.toLocaleString("en-IN")} via ${payoutMethod}. Reference: ${payoutReference || "N/A"}`,
        relatedId: bookings.find(b => b.ownerId.toString() === ownerId)?._id,
        relatedType: "booking",
        priority: "high",
      }], { session });
    }

    await session.commitTransaction();

    return NextResponse.json({
      success: true,
      message: `Payout processed for ${bookings.length} booking(s)`,
      data: {
        totalPaidOut,
        bookingsProcessed: bookings.length,
        ownerWise: ownerUpdates,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Process payout error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  } finally {
    session.endSession();
  }
}