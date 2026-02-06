// app/api/booking/[id]/verify-payment/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import mongoose from "mongoose";
import Booking, { IBooking } from "@/models/booking";
import Commission from "@/models/commission";
import Notification from "@/models/notification";
import User from "@/models/user";
import {
  verifyRazorpaySignature,
  fetchPaymentDetails,
  paiseToRupees,
  formatAmount,
  RazorpayPaymentResponse,
} from "@/lib/razorpay";
import { authUser } from "@/actions/authUser";

// ============================================
// Type Definitions
// ============================================

interface PopulatedListing {
  _id: mongoose.Types.ObjectId;
  pgName: string;
  ownerId: mongoose.Types.ObjectId;
}

interface PopulatedBooking extends Omit<IBooking, "listingId"> {
  listingId: PopulatedListing;
}

type BookingDocument = mongoose.Document & PopulatedBooking;

interface PaymentVerificationRequest {
  paymentType: "booking_fee" | "remaining";
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface SuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
}

interface PaymentBreakdown {
  bookingFee: IBooking["bookingFee"];
  securityDeposit: IBooking["securityDeposit"];
  firstMonthRent: IBooking["firstMonthRent"];
}

interface VerificationResponseData {
  booking: {
    _id: mongoose.Types.ObjectId;
    status: string;
    paymentBreakdown: PaymentBreakdown;
    totalPaid: number;
    totalDue: number;
  };
  paymentDetails: {
    id: string;
    amount: number;
    method: string;
    status: string;
  };
}

// ============================================
// Helper Functions
// ============================================

/**
 * Format date for display
 */
const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "Invalid Date";
  }
};

/**
 * Create error response
 */
const createErrorResponse = (
  message: string,
  status: number,
  error?: string
): NextResponse<ErrorResponse> => {
  const responseBody: ErrorResponse = {
    success: false,
    message,
  };

  if (error) {
    responseBody.error = error;
  }

  return NextResponse.json(responseBody, { status });
};

/**
 * Create success response
 */
const createSuccessResponse = <T>(
  message: string,
  data: T
): NextResponse<SuccessResponse<T>> => {
  return NextResponse.json({
    success: true,
    message,
    data,
  });
};

/**
 * Check if booking status is invalid for payment
 */
const isInvalidBookingStatus = (status: string): boolean => {
  const invalidStatuses = ["cancelled", "rejected", "expired"];
  return invalidStatuses.includes(status);
};

/**
 * Build response data from booking and payment details
 */
const buildResponseData = (
  booking: BookingDocument,
  paymentDetails: RazorpayPaymentResponse
): VerificationResponseData => {
  return {
    booking: {
      _id: booking._id as mongoose.Types.ObjectId,
      status: booking.status,
      paymentBreakdown: {
        bookingFee: booking.bookingFee,
        securityDeposit: booking.securityDeposit,
        firstMonthRent: booking.firstMonthRent,
      },
      totalPaid: booking.totalPaid,
      totalDue: booking.totalDue,
    },
    paymentDetails: {
      id: paymentDetails.id,
      amount: paiseToRupees(paymentDetails.amount),
      method: paymentDetails.method,
      status: paymentDetails.status,
    },
  };
};

// ============================================
// Payment Handlers
// ============================================

/**
 * Handle booking fee payment
 */
const handleBookingFeePayment = async (
  booking: BookingDocument,
  paymentId: string,
  session: mongoose.ClientSession
): Promise<void> => {
  // Update booking fee payment status
  booking.bookingFee.status = "paid";
  booking.bookingFee.paidAt = new Date();
  booking.bookingFee.paymentReference = paymentId;
  booking.bookingFee.razorpayPaymentId = paymentId;

  // Update total paid
  booking.totalPaid = (booking.totalPaid || 0) + booking.bookingFee.amount;

  // Create commission record for admin revenue (10% booking fee)
  await Commission.create(
    [
      {
        ownerId: booking.ownerId,
        bookingId: booking._id,
        listingId: booking.listingId._id,
        tenantId: booking.userId,
        allocationId: null,
        monthlyRentPaymentId: null,

        commissionType: "booking_fee_revenue",
        direction: "admin_received",
        sourcePaymentMethod: "online",

        rentMonth: null,
        monthNumber: 1,

        baseAmount: booking.monthlyRent,
        commissionRate: 0.1,
        amount: booking.bookingFee.amount,

        status: "completed",
        dueDate: new Date(),
        settledAt: new Date(),
        settledBy: null,
        settlementMethod: "auto",
        settlementReference: paymentId,
        settlementProof: "",

        notes: "Booking fee revenue collected from user via online payment",
      },
    ],
    { session, ordered: true }
  );

  // Notify owner about booking fee received
  await Notification.create(
    [
      {
        userId: booking.ownerId,
        type: "payment",
        title: "Booking Fee Received",
        message: `Booking fee of ${formatAmount(
          booking.bookingFee.amount
        )} received for ${
          booking.listingId.pgName
        }. Please review and approve the booking.`,
        relatedId: booking._id,
        relatedType: "booking",
        priority: "high",
      },
    ],
    { session, ordered: true }
  );
};

/**
 * Handle remaining payment (security deposit + first month rent)
 */
const handleRemainingPayment = async (
  booking: BookingDocument,
  paymentId: string,
  session: mongoose.ClientSession
): Promise<void> => {
  let securityDepositAmount = 0;
  let firstMonthRentAmount = 0;

  // Update security deposit
  if (booking.securityDeposit.status === "pending") {
    booking.securityDeposit.status = "paid";
    booking.securityDeposit.paidAt = new Date();
    booking.securityDeposit.paidTo = "admin";
    booking.securityDeposit.paymentReference = paymentId;
    booking.securityDeposit.razorpayPaymentId = paymentId;
    booking.totalPaid =
      (booking.totalPaid || 0) + booking.securityDeposit.amount;
    securityDepositAmount = booking.securityDeposit.amount;
  }

  // Update first month rent
  if (booking.firstMonthRent.status === "pending") {
    booking.firstMonthRent.status = "paid";
    booking.firstMonthRent.paidAt = new Date();
    booking.firstMonthRent.paidTo = "admin";
    booking.firstMonthRent.paymentReference = paymentId;
    booking.firstMonthRent.razorpayPaymentId = paymentId;

    // Set owner payout status to pending
    booking.firstMonthRent.ownerPayoutStatus = "pending";
    booking.firstMonthRent.ownerPayoutAmount = booking.firstMonthRent.amount;

    booking.totalPaid =
      (booking.totalPaid || 0) + booking.firstMonthRent.amount;
    firstMonthRentAmount = booking.firstMonthRent.amount;
  }

  const commissions = [];
  const payoutDueDate = new Date();
  payoutDueDate.setDate(payoutDueDate.getDate() + 7);

  // Security Deposit Payout Commission
  if (securityDepositAmount > 0) {
    commissions.push({
      ownerId: booking.ownerId,
      bookingId: booking._id,
      listingId: booking.listingId._id,
      tenantId: booking.userId,
      allocationId: null,
      monthlyRentPaymentId: null,

      commissionType: "security_deposit_payout",
      direction: "admin_owes_owner",
      sourcePaymentMethod: "online",

      rentMonth: null,
      monthNumber: 1,

      baseAmount: securityDepositAmount,
      commissionRate: 0,
      amount: securityDepositAmount,

      status: "pending",
      dueDate: payoutDueDate,
      settledAt: null,
      settledBy: null,
      settlementMethod: "",
      settlementReference: "",
      settlementProof: "",

      notes: "Security deposit to be transferred to owner within 7 days",
    });
  }

  // First Month Rent Payout Commission
  if (firstMonthRentAmount > 0) {
    commissions.push({
      ownerId: booking.ownerId,
      bookingId: booking._id,
      listingId: booking.listingId._id,
      tenantId: booking.userId,
      allocationId: null,
      monthlyRentPaymentId: null,

      commissionType: "first_month_payout",
      direction: "admin_owes_owner",
      sourcePaymentMethod: "online",

      rentMonth: booking.moveInDate,
      monthNumber: 1,

      baseAmount: booking.monthlyRent,
      commissionRate: 0.9,
      amount: firstMonthRentAmount,

      status: "pending",
      dueDate: payoutDueDate,
      settledAt: null,
      settledBy: null,
      settlementMethod: "",
      settlementReference: "",
      settlementProof: "",

      notes: "First month rent (90%) to be paid to owner within 7 days",
    });
  }

  // Create all commission records
  if (commissions.length > 0) {
    await Commission.create(commissions, { session, ordered: true });
  }

  const totalPayoutAmount = securityDepositAmount + firstMonthRentAmount;

  // Update owner's pending payout
  if (totalPayoutAmount > 0) {
    await User.findByIdAndUpdate(
      booking.ownerId,
      {
        $inc: {
          "settlementSummary.pendingPayoutAmount": totalPayoutAmount,
        },
      },
      { session }
    );

    // Notify owner about payment completion
    await Notification.create(
      [
        {
          userId: booking.ownerId,
          type: "payment",
          title: "Full Payment Received",
          message: `Full payment of ${formatAmount(
            totalPayoutAmount
          )} received for ${
            booking.listingId.pgName
          }. Payout will be processed within 7 days.`,
          relatedId: booking._id,
          relatedType: "booking",
          priority: "high",
        },
      ],
      { session, ordered: true }
    );
  }

  // Update booking status to active if all payments complete
  if (
    booking.bookingFee.status === "paid" &&
    booking.securityDeposit.status === "paid" &&
    booking.firstMonthRent.status === "paid"
  ) {
    booking.status = "active";

    // Notify tenant - Using "booking_approved" instead of "booking"
    await Notification.create(
      [
        {
          userId: booking.userId,
          type: "booking_approved",
          title: "Booking Active - Ready to Move In",
          message: `Your booking for ${
            booking.listingId.pgName
          } is now active! You can move in on ${formatDate(
            booking.moveInDate.toString()
          )}. The owner will contact you shortly.`,
          relatedId: booking._id,
          relatedType: "booking",
          priority: "high",
        },
      ],
      { session, ordered: true }
    );
  }
};

// ============================================
// Main API Handler
// ============================================

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await mongoose.startSession();

  try {
    await connectToDB();

    const user = await authUser();
    if (!user) {
      return createErrorResponse("Unauthorized", 401);
    }

    const { id: bookingId } = await params;
    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return createErrorResponse("Invalid booking ID", 400);
    }

    let body: PaymentVerificationRequest;
    try {
      body = await req.json();
    } catch {
      return createErrorResponse("Invalid request body", 400);
    }

    const {
      paymentType,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;

    if (
      !paymentType ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return createErrorResponse(
        "Missing required payment verification fields",
        400
      );
    }

    if (!["booking_fee", "remaining"].includes(paymentType)) {
      return createErrorResponse("Invalid payment type", 400);
    }

    const isValidSignature = verifyRazorpaySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValidSignature) {
      return createErrorResponse("Invalid payment signature", 400);
    }

    session.startTransaction();

    const booking = (await Booking.findById(bookingId)
      .populate<{ listingId: PopulatedListing }>("listingId", "pgName ownerId")
      .session(session)) as BookingDocument | null;

    if (!booking) {
      await session.abortTransaction();
      return createErrorResponse("Booking not found", 404);
    }

    if (booking.userId.toString() !== user.id) {
      await session.abortTransaction();
      return createErrorResponse(
        "You are not authorized to verify this payment",
        403
      );
    }

    if (isInvalidBookingStatus(booking.status as string)) {
      await session.abortTransaction();
      return createErrorResponse(
        `Cannot process payment for ${booking.status} booking`,
        400
      );
    }

    const paymentDetails = await fetchPaymentDetails(razorpay_payment_id);

    if (paymentDetails.status !== "captured") {
      await session.abortTransaction();
      return createErrorResponse(
        `Payment not captured. Current status: ${paymentDetails.status}`,
        400
      );
    }

    if (paymentType === "booking_fee") {
      if (booking.bookingFee.status === "paid") {
        await session.abortTransaction();
        return createErrorResponse("Booking fee is already paid", 400);
      }
      await handleBookingFeePayment(booking, razorpay_payment_id, session);
    } else if (paymentType === "remaining") {
      if (
        booking.securityDeposit.status === "paid" &&
        booking.firstMonthRent.status === "paid"
      ) {
        await session.abortTransaction();
        return createErrorResponse(
          "Remaining payment is already completed",
          400
        );
      }
      await handleRemainingPayment(booking, razorpay_payment_id, session);
    }

    await booking.save({ session });
    await session.commitTransaction();

    const responseData = buildResponseData(booking, paymentDetails);

    return createSuccessResponse("Payment verified successfully", responseData);
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    console.error("Payment verification error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return createErrorResponse(
      "Payment verification failed",
      500,
      errorMessage
    );
  } finally {
    await session.endSession();
  }
}