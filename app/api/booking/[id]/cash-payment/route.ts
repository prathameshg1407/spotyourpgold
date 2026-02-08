import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import mongoose from "mongoose";
import Booking from "@/models/booking";
import Commission from "@/models/commission";
import User from "@/models/user";
import Notification from "@/models/notification";
import { authUser } from "@/actions/authUser";

// Owner records cash payment collected from tenant
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await mongoose.startSession();

  try {
    await connectToDB();

    const user = await authUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: bookingId } = await params;
    
    // Parse body - handle empty body case
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is fine
    }
    
    const { cashCollectedBy, notes } = body;

    session.startTransaction();

    const booking = await Booking.findById(bookingId)
      .populate("listingId", "ownerId pgName")
      .session(session);

    if (!booking) {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Verify user is the owner
    const listing = booking.listingId as any;
    if (listing.ownerId.toString() !== user.id) {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, message: "Unauthorized - Not the owner" },
        { status: 403 }
      );
    }

    // Check if booking is in a valid state for cash payment
    // Allow: pending_cash_payment, pending, confirmed (with cash payment method)
    const validStatuses = ["pending_cash_payment", "pending", "confirmed"];
    const isValidStatus = validStatuses.includes(booking.paymentStatus) || 
                          (booking.status === "confirmed" && booking.paymentMethod === "cash");
    
    if (!isValidStatus) {
      await session.abortTransaction();
      return NextResponse.json(
        { 
          success: false, 
          message: `Cannot record payment. Current status: ${booking.paymentStatus}, Booking status: ${booking.status}` 
        },
        { status: 400 }
      );
    }

    // Calculate total amount
    const totalAmount = (booking.bookingFee?.amount || 0) + 
                        (booking.firstMonthRent?.amount || 0) + 
                        (booking.securityDeposit?.amount || 0);

    // Update booking payment status
    booking.paymentStatus = "fully_paid";
    booking.paymentMethod = "cash";
    
    // Update individual payment statuses
    if (booking.bookingFee) {
      booking.bookingFee.status = "paid";
      booking.bookingFee.paidTo = "owner";
      booking.bookingFee.paymentMethod = "cash";
      booking.bookingFee.ownerCommissionStatus = "pending"; // Owner owes this to admin
    }
    
    if (booking.firstMonthRent) {
      booking.firstMonthRent.status = "paid";
      booking.firstMonthRent.paidTo = "owner";
      booking.firstMonthRent.paymentMethod = "cash";
    }
    
    if (booking.securityDeposit) {
      booking.securityDeposit.status = "paid";
      booking.securityDeposit.paidTo = "owner";
      booking.securityDeposit.transferredToOwner = true;
      booking.securityDeposit.transferredAt = new Date();
    }
    
    // Cash payment tracking
    booking.cashPayment = {
      collectedBy: cashCollectedBy || user.fullName,
      collectedAt: new Date(),
      verifiedByAdmin: false,
    };
    
    if (notes) {
      booking.ownerNotes = booking.ownerNotes 
        ? `${booking.ownerNotes}\nPayment: ${notes}`
        : `Payment: ${notes}`;
    }

    await booking.save({ session });

    // Create commission record - owner owes booking fee to admin
    const commissionAmount = booking.bookingFee?.amount || 0;
    
    if (commissionAmount > 0) {
      await Commission.create([{
        bookingId: booking._id,
        ownerId: listing.ownerId,
        amount: commissionAmount,
        commissionType: "booking_fee",
        status: "pending",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        notes: "Commission due from cash payment collection",
      }], { session });
    }

    // Notify admin about cash payment
    const admins = await User.find({ role: "admin" }).select("_id").session(session);
    for (const admin of admins) {
      await Notification.create([{
        userId: admin._id,
        type: "payment",
        title: "Cash Payment Collected",
        message: `Owner ${user.fullName} collected ₹${totalAmount.toLocaleString()} cash for ${listing.pgName}. Commission pending: ₹${commissionAmount.toLocaleString()}`,
        relatedId: booking._id,
        relatedType: "booking",
        priority: "high",
        metadata: {
          totalCollected: totalAmount,
          commissionPending: commissionAmount,
          ownerId: listing.ownerId,
        },
      }], { session });
    }

    // Notify tenant
    await Notification.create([{
      userId: booking.userId,
      type: "payment",
      title: "Payment Received",
      message: `Your payment of ₹${totalAmount.toLocaleString()} for ${listing.pgName} has been received.`,
      relatedId: booking._id,
      relatedType: "booking",
      priority: "medium",
    }], { session });

    await session.commitTransaction();

    return NextResponse.json({
      success: true,
      message: "Cash payment recorded successfully",
      data: {
        booking: booking.toObject(),
        totalCollected: totalAmount,
        commissionCreated: commissionAmount,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Cash payment error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    session.endSession();
  }
}