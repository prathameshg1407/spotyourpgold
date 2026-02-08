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
      .populate("userId", "fullName email")
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

    // Calculate amounts
    const bookingFeeAmount = booking.bookingFee?.amount || 0;
    const firstMonthRentAmount = booking.firstMonthRent?.amount || 0;
    const securityDepositAmount = booking.securityDeposit?.amount || 0;
    const totalAmount = bookingFeeAmount + firstMonthRentAmount + securityDepositAmount;
    const monthlyRent = bookingFeeAmount * 10; // Booking fee is 10% of monthly rent

    // Update booking payment status
    booking.paymentStatus = "fully_paid";
    booking.paymentMethod = "cash";
    
    // Update individual payment statuses
    if (booking.bookingFee) {
      booking.bookingFee.status = "paid";
      booking.bookingFee.paidTo = "owner";
      booking.bookingFee.paymentMethod = "cash";
      booking.bookingFee.ownerCommissionStatus = "pending"; // Owner owes this to admin
      booking.bookingFee.paidAt = new Date();
    }
    
    if (booking.firstMonthRent) {
      booking.firstMonthRent.status = "paid";
      booking.firstMonthRent.paidTo = "owner";
      booking.firstMonthRent.paymentMethod = "cash";
      booking.firstMonthRent.paidAt = new Date();
    }
    
    if (booking.securityDeposit) {
      booking.securityDeposit.status = "paid";
      booking.securityDeposit.paidTo = "owner";
      booking.securityDeposit.transferredToOwner = true;
      booking.securityDeposit.transferredAt = new Date();
      booking.securityDeposit.paidAt = new Date();
    }
    
    // Cash payment tracking
    booking.cashPayment = {
      collectedBy: cashCollectedBy || user.fullName,
      collectedAt: new Date(),
      verifiedByAdmin: false,
    };
    
    // Update totals
    booking.totalPaid = totalAmount;
    
    if (notes) {
      booking.ownerNotes = booking.ownerNotes 
        ? `${booking.ownerNotes}\nPayment: ${notes}`
        : `Payment: ${notes}`;
    }

    await booking.save({ session });

    // Create commission record for booking fee that owner owes to admin
    if (bookingFeeAmount > 0) {
      const commissionData = {
        // Required references
        ownerId: listing.ownerId,
        bookingId: booking._id,
        listingId: booking.listingId._id,
        tenantId: booking.userId?._id || null,
        
        // Commission type for cash payment where owner owes admin
        commissionType: "booking_fee_receivable",
        
        // Direction - owner owes admin the booking fee
        direction: "owner_owes_admin",
        
        // Source payment method
        sourcePaymentMethod: "cash",
        
        // Amounts
        baseAmount: monthlyRent, // Base monthly rent amount
        commissionRate: 0.1, // 10% commission rate
        amount: bookingFeeAmount, // The commission amount (10% of monthly rent)
        
        // Status
        status: "pending",
        
        // Due date - 7 days from now
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        
        // Notes
        notes: `Cash payment collected by ${cashCollectedBy || user.fullName}. Commission due to admin. ${notes || ''}`.trim(),
        
        // Month tracking (for first month)
        monthNumber: 1,
        rentMonth: null, // Not a recurring monthly payment
        
        // Settlement details (to be filled when owner pays)
        settledAt: null,
        settledBy: null,
        settlementMethod: "",
        settlementReference: "",
        settlementProof: "",
        
        // Related IDs
        allocationId: null,
        monthlyRentPaymentId: null,
      };

      await Commission.create([commissionData], { session });
    }

    // Update owner's pending commission amount
    await User.findByIdAndUpdate(
      listing.ownerId,
      {
        $inc: {
          "settlementSummary.pendingCommissionAmount": bookingFeeAmount,
        },
      },
      { session }
    );

    // Notify admin about cash payment
    const admins = await User.find({ role: "admin" }).select("_id").session(session);
    for (const admin of admins) {
      await Notification.create([{
        userId: admin._id,
        type: "payment",
        title: "Cash Payment Collected - Commission Due",
        message: `Owner ${user.fullName} collected ₹${totalAmount.toLocaleString()} cash for ${listing.pgName}. Commission due: ₹${bookingFeeAmount.toLocaleString()}`,
        relatedId: booking._id,
        relatedType: "booking",
        priority: "high",
        metadata: {
          totalCollected: totalAmount,
          commissionDue: bookingFeeAmount,
          ownerId: listing.ownerId,
          bookingId: booking._id.toString(),
          pgName: listing.pgName,
          tenantName: booking.fullName,
        },
      }], { session });
    }

    // Notify tenant about payment confirmation
    if (booking.userId) {
      await Notification.create([{
        userId: booking.userId._id,
        type: "payment",
        title: "Payment Confirmed",
        message: `Your cash payment of ₹${totalAmount.toLocaleString()} for ${listing.pgName} has been received by the owner.`,
        relatedId: booking._id,
        relatedType: "booking",
        priority: "medium",
        metadata: {
          amount: totalAmount,
          pgName: listing.pgName,
          ownerName: user.fullName,
        },
      }], { session });
    }

    await session.commitTransaction();

    return NextResponse.json({
      success: true,
      message: "Cash payment recorded successfully",
      data: {
        booking: {
          _id: booking._id,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          totalCollected: totalAmount,
          bookingFee: booking.bookingFee,
          firstMonthRent: booking.firstMonthRent,
          securityDeposit: booking.securityDeposit,
        },
        commission: {
          amount: bookingFeeAmount,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: "pending",
          type: "booking_fee_receivable",
        },
        totalCollected: totalAmount,
        commissionCreated: bookingFeeAmount,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Cash payment error:", error);
    
    // More detailed error logging
    if (error instanceof mongoose.Error.ValidationError) {
      console.error("Validation errors:", error.errors);
      return NextResponse.json(
        {
          success: false,
          message: "Validation error",
          errors: Object.keys(error.errors).map(key => ({
            field: key,
            message: error.errors[key].message
          }))
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        message: "Failed to record cash payment",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    session.endSession();
  }
}