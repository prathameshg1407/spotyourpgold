import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDB } from "@/services/connectdb";
import MonthlyRentPayment from "@/models/MonthlyRentPayment";
import Booking from "@/models/booking";
import Listing from "@/models/listing";
import Commission from "@/models/commission";
import User from "@/models/user";
import Notification from "@/models/notification";
import { authUser } from "@/actions/authUser";

// Response helpers
function jsonResponse(data: object, status: number = 200) {
  return NextResponse.json(data, { status });
}

function errorResponse(message: string, status: number = 400) {
  return jsonResponse({ success: false, message }, status);
}

/**
 * GET - Get rent collection data for owner
 */
export async function GET(req: NextRequest) {
  try {
    await connectToDB();
    const user = await authUser();

    if (!user || (user.role !== "owner" && user.role !== "admin")) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";
    const listingId = searchParams.get("listingId");
    const month = searchParams.get("month"); // YYYY-MM format

    // Get owner's listings
    const listings = await Listing.find({ ownerId: user.id }).select("_id pgName");
    const listingIds = listingId ? [new mongoose.Types.ObjectId(listingId)] : listings.map((l) => l._id);

    // Build query
    const query: any = {
      ownerId: new mongoose.Types.ObjectId(user.id),
    };

    if (listingIds.length > 0) {
      query.listingId = { $in: listingIds };
    }

    if (status !== "all") {
      query.paymentStatus = status;
    }

    if (month) {
      const [year, monthNum] = month.split("-");
      const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(monthNum), 0, 23, 59, 59);
      query.rentMonth = { $gte: startDate, $lte: endDate };
    }

    // Get rent payments
    const rentPayments = await MonthlyRentPayment.find(query)
      .populate("tenantId", "fullName email phone")
      .populate("listingId", "pgName")
      .populate("allocationId", "roomNumber bedNumber roomType")
      .sort({ rentMonth: -1, dueDate: 1 })
      .lean();

    // Calculate summary
    const summary = {
      totalPending: 0,
      totalOverdue: 0,
      totalPaid: 0,
      pendingCount: 0,
      overdueCount: 0,
      paidCount: 0,
    };

    rentPayments.forEach((payment: any) => {
      const due = payment.rentAmount - payment.paidAmount;

      switch (payment.paymentStatus) {
        case "pending":
          summary.totalPending += due;
          summary.pendingCount++;
          break;
        case "overdue":
          summary.totalOverdue += due + (payment.lateFee || 0);
          summary.overdueCount++;
          break;
        case "paid":
          summary.totalPaid += payment.paidAmount;
          summary.paidCount++;
          break;
        case "partially_paid":
          summary.totalPending += due;
          summary.pendingCount++;
          break;
      }
    });

    return jsonResponse({
      success: true,
      data: rentPayments,
      summary,
      listings: listings.map((l) => ({ id: l._id, name: l.pgName })),
    });
  } catch (error) {
    console.error("Get rent collection error:", error);
    return errorResponse("Internal server error", 500);
  }
}

/**
 * POST - Record rent payment
 */
export async function POST(req: NextRequest) {
  const session = await mongoose.startSession();

  try {
    await connectToDB();
    const user = await authUser();

    if (!user || (user.role !== "owner" && user.role !== "admin")) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await req.json();
    const {
      rentPaymentId,
      paidAmount,
      paymentMethod = "cash",
      transactionId = "",
      waiveLateFee = false,
      notes = "",
    } = body;

    if (!rentPaymentId || paidAmount === undefined) {
      return errorResponse("Rent payment ID and paid amount are required");
    }

    if (paidAmount <= 0) {
      return errorResponse("Paid amount must be greater than 0");
    }

    session.startTransaction();

    // Get rent payment
    const rentPayment = await MonthlyRentPayment.findById(rentPaymentId)
      .populate("listingId", "ownerId pgName")
      .populate("bookingId")
      .session(session);

    if (!rentPayment) {
      await session.abortTransaction();
      return errorResponse("Rent payment not found", 404);
    }

    // Verify ownership
    const listing = rentPayment.listingId as any;
    if (listing.ownerId.toString() !== user.id && user.role !== "admin") {
      await session.abortTransaction();
      return errorResponse("Unauthorized", 403);
    }

    // Waive late fee if requested
    if (waiveLateFee && rentPayment.lateFee > 0) {
      rentPayment.lateFee = 0;
      rentPayment.lateFeeWaived = true;
    }

    // Update rent payment
    const previousPaid = rentPayment.paidAmount || 0;
    rentPayment.paidAmount = previousPaid + paidAmount;
    rentPayment.paidAt = new Date();

    // Set payment method based on how it was paid
    if (paymentMethod === "online") {
      rentPayment.paymentMethod = "online";
      rentPayment.onlinePayment.razorpayPaymentId = transactionId;
      rentPayment.onlinePayment.paidToAdmin = true;
      rentPayment.onlinePayment.paidToAdminAt = new Date();
      
      // Calculate commission for admin
      const adminCommission = Math.round(paidAmount * 0.1);
      rentPayment.onlinePayment.adminCommission = adminCommission;
      
      // Owner gets 90%
      const ownerAmount = Math.round(paidAmount * 0.9);
      rentPayment.onlinePayment.ownerPayoutAmount = ownerAmount;
      rentPayment.onlinePayment.ownerPayoutStatus = "pending";
    } else {
      // Cash payment
      rentPayment.paymentMethod = "cash";
      rentPayment.cashPayment.collectedByOwner = true;
      rentPayment.cashPayment.collectedAt = new Date();
      
      // Calculate commission owner owes to admin
      const commissionOwed = Math.round(paidAmount * 0.1);
      rentPayment.cashPayment.adminCommissionOwed = commissionOwed;
      rentPayment.cashPayment.adminCommissionStatus = "pending";
    }

    if (notes) {
      rentPayment.notes = notes;
    }

    // Determine new status
    const totalDue = rentPayment.rentAmount + rentPayment.lateFee;
    if (rentPayment.paidAmount >= totalDue) {
      rentPayment.paymentStatus = "paid";
    } else if (rentPayment.paidAmount > 0) {
      rentPayment.paymentStatus = "partially_paid";
    }

    await rentPayment.save({ session });

    let commissionCreated = 0;

    // Create commission record only for cash payments
    if (paymentMethod === "cash" && rentPayment.paymentStatus === "paid") {
      const commissionAmount = Math.round(paidAmount * 0.1);
      const commissionDueDate = new Date();
      commissionDueDate.setDate(commissionDueDate.getDate() + 7); // Due in 7 days

      const commission = new Commission({
        ownerId: listing.ownerId,
        bookingId: rentPayment.bookingId,
        listingId: listing._id,
        tenantId: rentPayment.tenantId,
        monthlyRentPaymentId: rentPayment._id,
        commissionType: "monthly_rent_commission",
        direction: "owner_owes_admin",
        sourcePaymentMethod: "cash",
        rentMonth: rentPayment.rentMonth,
        monthNumber: rentPayment.monthNumber,
        baseAmount: paidAmount,
        commissionRate: 0.1,
        amount: commissionAmount,
        status: "pending",
        dueDate: commissionDueDate,
        notes: `Monthly rent commission - Month ${rentPayment.monthNumber}, ${listing.pgName}`,
      });

      await commission.save({ session });
      rentPayment.commissionId = commission._id;
      await rentPayment.save({ session });

      commissionCreated = commissionAmount;

      // Update owner's pending commission
      await User.findByIdAndUpdate(
        listing.ownerId,
        {
          $inc: {
            "settlementSummary.pendingCommissionAmount": commissionAmount,
          },
        },
        { session }
      );
    }

    // For online payments, create payout commission
    if (paymentMethod === "online" && rentPayment.paymentStatus === "paid") {
      const ownerPayoutAmount = rentPayment.onlinePayment.ownerPayoutAmount;
      
      const payoutCommission = new Commission({
        ownerId: listing.ownerId,
        bookingId: rentPayment.bookingId,
        listingId: listing._id,
        tenantId: rentPayment.tenantId,
        monthlyRentPaymentId: rentPayment._id,
        commissionType: "monthly_rent_payout",
        direction: "admin_owes_owner",
        sourcePaymentMethod: "online",
        rentMonth: rentPayment.rentMonth,
        monthNumber: rentPayment.monthNumber,
        baseAmount: paidAmount,
        commissionRate: 0.9,
        amount: ownerPayoutAmount,
        status: "pending",
        dueDate: new Date(),
        notes: `Monthly rent payout (90%) - Month ${rentPayment.monthNumber}, ${listing.pgName}`,
      });

      await payoutCommission.save({ session });
    }

    // Notify tenant
    await Notification.create(
      [
        {
          userId: rentPayment.tenantId,
          type: "payment",
          title: "Rent Payment Recorded",
          message: `Your rent payment of ₹${paidAmount.toLocaleString("en-IN")} has been recorded successfully.`,
          relatedId: rentPayment._id,
          relatedType: "booking",
          priority: "medium",
        },
      ],
      { session }
    );

    await session.commitTransaction();

    return jsonResponse({
      success: true,
      message: "Rent payment recorded successfully",
      data: {
        rentPayment,
        commissionCreated,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Record rent payment error:", error);
    return errorResponse("Internal server error", 500);
  } finally {
    session.endSession();
  }
}

/**
 * PATCH - Update rent entry (waive late fee, add notes, etc.)
 */
export async function PATCH(req: NextRequest) {
  try {
    await connectToDB();
    const user = await authUser();

    if (!user || (user.role !== "owner" && user.role !== "admin")) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await req.json();
    const { rentPaymentId, action, data } = body;

    if (!rentPaymentId || !action) {
      return errorResponse("Rent payment ID and action are required");
    }

    // Get rent payment
    const rentPayment = await MonthlyRentPayment.findById(rentPaymentId).populate(
      "listingId",
      "ownerId"
    );

    if (!rentPayment) {
      return errorResponse("Rent payment not found", 404);
    }

    // Verify ownership
    const listing = rentPayment.listingId as any;
    if (listing.ownerId.toString() !== user.id && user.role !== "admin") {
      return errorResponse("Unauthorized", 403);
    }

    switch (action) {
      case "waive_late_fee":
        if (rentPayment.lateFee > 0) {
          rentPayment.lateFee = 0;
          rentPayment.lateFeeWaived = true;
        }
        break;

      case "add_late_fee":
        const lateFeeAmount = data?.amount || Math.round(rentPayment.rentAmount * 0.05);
        rentPayment.lateFee = (rentPayment.lateFee || 0) + lateFeeAmount;
        if (rentPayment.paymentStatus === "pending") {
          rentPayment.paymentStatus = "overdue";
        }
        break;

      case "update_notes":
        rentPayment.notes = data?.notes || "";
        break;

      default:
        return errorResponse(`Invalid action: ${action}`);
    }

    await rentPayment.save();

    return jsonResponse({
      success: true,
      message: `Action '${action}' completed successfully`,
      data: rentPayment,
    });
  } catch (error) {
    console.error("Update rent entry error:", error);
    return errorResponse("Internal server error", 500);
  }
}