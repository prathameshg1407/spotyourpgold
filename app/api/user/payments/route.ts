// app/api/user/payments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import mongoose from "mongoose";
import Booking from "@/models/booking";

import TenantAllocation from "@/models/tenantAllocation";
import { authUser } from "@/actions/authUser";
import MonthlyRentPayment from "@/models/MonthlyRentPayment";

export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    const user = await authUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || user.id;

    // Verify user can access this data
    if (userId !== user.id && user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 }
      );
    }

    // Get all bookings with payment details
    const bookings = await Booking.find({
      userId: new mongoose.Types.ObjectId(userId),
    })
      .populate({
        path: "listingId",
        select: "pgName location images roomTypes ownerId",
      })
      .sort({ createdAt: -1 });

    // Get monthly rent payments
    const monthlyRents = await MonthlyRentPayment.find({
      tenantId: new mongoose.Types.ObjectId(userId),
    })
      .populate("listingId", "pgName location")
      .sort({ rentMonth: -1 });

    // Get active allocation for rent due info
    const activeAllocation = await TenantAllocation.findOne({
      tenantId: userId,
      status: { $in: ["active", "notice_period"] },
    });

    // Format bookings with 3-part payment breakdown
    const formattedBookings = bookings.map((booking) => {
      const listing = booking.listingId as any;

      return {
        _id: booking._id,
        type: "booking",
        listingId: listing,
        pgName: listing?.pgName || "N/A",
        location: listing?.location,
        roomType: booking.roomType,
        moveInDate: booking.moveInDate,
        duration: booking.duration,
        status: booking.status,
        paymentMethod: booking.paymentMethod,
        createdAt: booking.createdAt,

        // 3-Part Payment Breakdown
        paymentBreakdown: {
          bookingFee: {
            label: "Booking Fee (10%)",
            amount: booking.bookingFee?.amount || 0,
            status: booking.bookingFee?.status || "pending",
            paidAt: booking.bookingFee?.paidAt,
            paymentReference: booking.bookingFee?.paymentReference,
          },
          securityDeposit: {
            label: "Security Deposit",
            amount: booking.securityDeposit?.amount || 0,
            status: booking.securityDeposit?.status || "pending",
            paidAt: booking.securityDeposit?.paidAt,
            paymentReference: booking.securityDeposit?.paymentReference,
            refundAmount: booking.securityDeposit?.refundAmount || 0,
            refundDate: booking.securityDeposit?.refundDate,
          },
          firstMonthRent: {
            label: "First Month Rent (90%)",
            amount: booking.firstMonthRent?.amount || 0,
            status: booking.firstMonthRent?.status || "pending",
            paidAt: booking.firstMonthRent?.paidAt,
            paymentReference: booking.firstMonthRent?.paymentReference,
          },
        },

        // Discount
        originalAmount: booking.originalAmount || booking.monthlyRent,
        discountAmount: booking.discountAmount || 0,
        couponCode: booking.couponCode,

        // Totals
        totalDue: booking.totalDue,
        totalPaid: booking.totalPaid,
        pendingAmount: (booking.totalDue || 0) - (booking.totalPaid || 0),

        // Payment progress
        paymentProgress: {
          bookingFeePaid: booking.bookingFee?.status === "paid",
          approved: ["confirmed", "active", "completed"].includes(booking.status),
          remainingPaid: 
            booking.securityDeposit?.status === "paid" && 
            booking.firstMonthRent?.status === "paid",
          isComplete: 
            booking.bookingFee?.status === "paid" &&
            booking.securityDeposit?.status === "paid" &&
            booking.firstMonthRent?.status === "paid",
        },

        // Can take action
        canPayBookingFee: 
          booking.bookingFee?.status === "pending" && 
          booking.paymentMethod === "online",
        canPayRemaining:
          booking.status === "confirmed" &&
          booking.bookingFee?.status === "paid" &&
          booking.paymentMethod === "online" &&
          (booking.securityDeposit?.status === "pending" ||
           booking.firstMonthRent?.status === "pending"),
      };
    });

    // Format monthly rent payments
    const formattedMonthlyRents = monthlyRents.map((rent) => ({
      _id: rent._id,
      type: "monthly_rent",
      listingId: rent.listingId,
      pgName: (rent.listingId as any)?.pgName || "N/A",
      rentMonth: rent.rentMonth,
      monthNumber: rent.monthNumber,
      amount: rent.rentAmount,
      dueDate: rent.dueDate,
      status: rent.paymentStatus,
      paidAmount: rent.paidAmount,
      paidAt: rent.paidAt,
      paymentMethod: rent.paymentMethod,
      paymentReference: rent.paymentReference,
      lateFee: rent.lateFee || 0,
      totalDue: rent.rentAmount + (rent.lateFee || 0),
    }));

    // Calculate summary
    const summary = {
      // Booking payments
      totalBookingFeesPaid: formattedBookings
        .filter((b) => b.paymentBreakdown.bookingFee.status === "paid")
        .reduce((acc, b) => acc + b.paymentBreakdown.bookingFee.amount, 0),

      totalSecurityDepositsPaid: formattedBookings
        .filter((b) => b.paymentBreakdown.securityDeposit.status === "paid")
        .reduce((acc, b) => acc + b.paymentBreakdown.securityDeposit.amount, 0),

      totalFirstMonthRentPaid: formattedBookings
        .filter((b) => b.paymentBreakdown.firstMonthRent.status === "paid")
        .reduce((acc, b) => acc + b.paymentBreakdown.firstMonthRent.amount, 0),

      // Monthly rent payments
      totalMonthlyRentPaid: formattedMonthlyRents
        .filter((r) => r.status === "paid")
        .reduce((acc, r) => acc + r.paidAmount, 0),

      totalMonthlyRentPending: formattedMonthlyRents
        .filter((r) => ["pending", "overdue"].includes(r.status))
        .reduce((acc, r) => acc + r.totalDue - (r.paidAmount || 0), 0),

      // Overall
      totalPaid: formattedBookings.reduce((acc, b) => acc + b.totalPaid, 0) +
        formattedMonthlyRents
          .filter((r) => r.status === "paid")
          .reduce((acc, r) => acc + r.paidAmount, 0),

      totalPending: formattedBookings.reduce((acc, b) => acc + b.pendingAmount, 0) +
        formattedMonthlyRents
          .filter((r) => ["pending", "overdue"].includes(r.status))
          .reduce((acc, r) => acc + r.totalDue - (r.paidAmount || 0), 0),

      overdueCount: formattedMonthlyRents.filter((r) => r.status === "overdue").length,
    };

    // Calculate next rent due
    let rentDueInfo = null;
    if (activeAllocation) {
      const today = new Date();
      const moveInDate = new Date(activeAllocation.moveInDate);
      
      // Find next pending/upcoming rent
      const nextRent = formattedMonthlyRents.find(
        (r) => r.status === "pending" || r.status === "upcoming"
      );

      if (nextRent) {
        const dueDate = new Date(nextRent.dueDate);
        const daysRemaining = Math.ceil(
          (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        rentDueInfo = {
          rentId: nextRent._id,
          nextDueDate: nextRent.dueDate,
          daysRemaining,
          amount: nextRent.amount + (nextRent.lateFee || 0),
          isOverdue: daysRemaining < 0,
          monthNumber: nextRent.monthNumber,
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        bookings: formattedBookings,
        monthlyRents: formattedMonthlyRents,
        summary,
        rentDueInfo,
        hasActiveAllocation: !!activeAllocation,
      },
    });
  } catch (error) {
    console.error("Get payment history error:", error);
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