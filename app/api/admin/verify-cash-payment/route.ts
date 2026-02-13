import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import mongoose from "mongoose";
import Booking from "@/models/booking";
import Commission from "@/models/commission";
import Notification from "@/models/notification";
import { authUser } from "@/actions/authUser";

// GET: Get pending cash payments for admin verification
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
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const perPage = Math.min(Number(searchParams.get("per_page") || "20"), 50);
    const status = searchParams.get("status") || "pending"; // pending, verified, all

    // Build query for cash bookings
    const query: any = {
      paymentMethod: "cash",
      "bookingFee.status": "paid",
    };

    if (status === "pending") {
      query.adminVerifiedAt = null;
    } else if (status === "verified") {
      query.adminVerifiedAt = { $ne: null };
    }

    const total = await Booking.countDocuments(query);

    const bookings = await Booking.find(query)
      .populate("userId", "fullName email phoneNumber")
      .populate("listingId", "pgName location primaryImage")
      .populate("ownerId", "fullName email phone")
      .sort({ cashCollectedAt: -1, createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    const totalPages = Math.ceil(total / perPage);

    // Summary stats
    const stats = await Booking.aggregate([
      { $match: { paymentMethod: "cash", "bookingFee.status": "paid" } },
      {
        $group: {
          _id: null,
          totalCashPayments: { $sum: 1 },
          pendingVerification: {
            $sum: { $cond: [{ $eq: ["$adminVerifiedAt", null] }, 1, 0] },
          },
          verified: {
            $sum: { $cond: [{ $ne: ["$adminVerifiedAt", null] }, 1, 0] },
          },
          totalAmount: { $sum: "$totalPaid" },
          pendingCommission: {
            $sum: {
              $cond: [
                { $eq: ["$bookingFee.ownerCommissionStatus", "pending"] },
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
        totalCashPayments: 0,
        pendingVerification: 0,
        verified: 0,
        totalAmount: 0,
        pendingCommission: 0,
      },
    });
  } catch (error) {
    console.error("Get pending cash payments error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Verify or reject cash payment
export async function POST(req: NextRequest) {
  const session = await mongoose.startSession();

  try {
    await connectToDB();

    const user = await authUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const { bookingId, action, notes } = await req.json();

    if (!bookingId || !action) {
      return NextResponse.json(
        { success: false, message: "Booking ID and action are required" },
        { status: 400 }
      );
    }

    if (!["verify", "reject"].includes(action)) {
      return NextResponse.json(
        { success: false, message: "Invalid action. Use 'verify' or 'reject'" },
        { status: 400 }
      );
    }

    session.startTransaction();

    const booking = await Booking.findById(bookingId)
      .populate("listingId", "pgName ownerId")
      .session(session);

    if (!booking) {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    if (booking.paymentMethod !== "cash") {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, message: "This is not a cash payment booking" },
        { status: 400 }
      );
    }

    if (action === "verify") {
      // Mark as verified
      booking.adminVerifiedAt = new Date();
      booking.adminVerifiedBy = new mongoose.Types.ObjectId(user.id);

      if (notes) {
        booking.adminNotes = `${booking.adminNotes || ""}\n[Verified] ${notes}`.trim();
      }

      // Create commission record for owner owing 10% to admin
      const existingCommission = await Commission.findOne({
        bookingId: booking._id,
        commissionType: "booking_fee_receivable",
      }).session(session);

      if (!existingCommission) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7); // 7 days to pay commission

        await Commission.create(
          [
            {
              ownerId: booking.ownerId,
              bookingId: booking._id,
              listingId: booking.listingId._id,
              tenantId: booking.userId,
              commissionType: "booking_fee_receivable",
              direction: "owner_owes_admin",
              sourcePaymentMethod: "cash",
              monthNumber: 1,
              baseAmount: booking.monthlyRent,
              commissionRate: 0.1,
              amount: booking.bookingFee.amount,
              status: "pending",
              dueDate,
              notes: `Cash booking fee commission - ${(booking.listingId as any).pgName}`,
            },
          ],
          { session }
        );
      }

      await booking.save({ session });

      // Notify user
      await Notification.create(
        [
          {
            userId: booking.userId,
            type: "payment",
            title: "Cash Payment Verified",
            message: `Your cash payment of ₹${booking.totalPaid.toLocaleString("en-IN")} has been verified.`,
            relatedId: booking._id,
            relatedType: "booking",
            priority: "medium",
          },
        ],
        { session }
      );

      // Notify owner about pending commission
      await Notification.create(
        [
          {
            userId: booking.ownerId,
            type: "payment",
            title: "Commission Due",
            message: `Cash payment verified for ${(booking.listingId as any).pgName}. Please pay ₹${booking.bookingFee.amount.toLocaleString("en-IN")} (10% commission) to admin within 7 days.`,
            relatedId: booking._id,
            relatedType: "booking",
            priority: "high",
          },
        ],
        { session }
      );

      await session.commitTransaction();

      return NextResponse.json({
        success: true,
        message: "Cash payment verified successfully",
        data: {
          bookingId: booking._id,
          verifiedAt: booking.adminVerifiedAt,
          commissionDue: booking.bookingFee.amount,
        },
      });
    } else if (action === "reject") {
      // Reject the cash payment
      booking.adminVerifiedAt = null;
      booking.adminVerifiedBy = null;

      if (notes) {
        booking.adminNotes = `${booking.adminNotes || ""}\n[Rejected] ${notes}`.trim();
      }

      await booking.save({ session });

      // Notify user
      await Notification.create(
        [
          {
            userId: booking.userId,
            type: "payment",
            title: "Payment Verification Failed",
            message: `Your cash payment verification failed. ${notes ? `Reason: ${notes}` : "Please contact support."}`,
            relatedId: booking._id,
            relatedType: "booking",
            priority: "high",
          },
        ],
        { session }
      );

      // Notify owner
      await Notification.create(
        [
          {
            userId: booking.ownerId,
            type: "payment",
            title: "Payment Verification Failed",
            message: `Cash payment verification failed for ${(booking.listingId as any).pgName}. ${notes ? `Reason: ${notes}` : "Please provide valid payment proof."}`,
            relatedId: booking._id,
            relatedType: "booking",
            priority: "high",
          },
        ],
        { session }
      );

      await session.commitTransaction();

      return NextResponse.json({
        success: true,
        message: "Cash payment rejected",
        data: {
          bookingId: booking._id,
          reason: notes || "No reason provided",
        },
      });
    }

    await session.abortTransaction();
    return NextResponse.json(
      { success: false, message: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    await session.abortTransaction();
    console.error("Verify cash payment error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  } finally {
    session.endSession();
  }
}