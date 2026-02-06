// app/api/user/rent/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import mongoose from "mongoose";
import TenantAllocation from "@/models/tenantAllocation";
import MonthlyRentPayment from "@/models/MonthlyRentPayment";
import Listing from "@/models/listing";
import { authUser } from "@/actions/authUser";
import { createRazorpayOrder } from "@/lib/razorpay";

// GET - Get rent history for user
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
    const allocationId = searchParams.get("allocationId");

    // Get active allocation
    const allocationQuery: any = { 
      tenantId: user.id,
      status: { $in: ["active", "notice_period"] },
    };
    
    if (allocationId) {
      allocationQuery._id = allocationId;
    }

    const allocation = await TenantAllocation.findOne(allocationQuery)
      .populate("listingId", "pgName location ownerId");

    if (!allocation) {
      return NextResponse.json({
        success: true,
        data: {
          allocation: null,
          rentHistory: [],
          summary: {
            totalPaid: 0,
            totalPending: 0,
            totalOverdue: 0,
            overdueCount: 0,
          },
          nextDue: null,
        },
      });
    }

    // Get monthly rent payments
    const rentPayments = await MonthlyRentPayment.find({
      tenantId: user.id,
      allocationId: allocation._id,
    }).sort({ rentMonth: -1 });

    // Format rent history
    const rentHistory = rentPayments.map((rent) => ({
      _id: rent._id,
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
      pendingAmount: rent.rentAmount + (rent.lateFee || 0) - (rent.paidAmount || 0),
      canPay: ["pending", "overdue", "partially_paid"].includes(rent.paymentStatus),
    }));

    // Calculate summary
    const summary = {
      totalPaid: rentHistory
        .filter((r) => r.status === "paid")
        .reduce((acc, r) => acc + r.paidAmount, 0),
      totalPending: rentHistory
        .filter((r) => r.status === "pending")
        .reduce((acc, r) => acc + r.amount, 0),
      totalOverdue: rentHistory
        .filter((r) => r.status === "overdue")
        .reduce((acc, r) => acc + r.totalDue - r.paidAmount, 0),
      overdueCount: rentHistory.filter((r) => r.status === "overdue").length,
    };

    // Find next due rent
    const today = new Date();
    const nextDueRent = rentPayments.find(
      (r) => ["pending", "overdue", "upcoming"].includes(r.paymentStatus)
    );

    let nextDue = null;
    if (nextDueRent) {
      const dueDate = new Date(nextDueRent.dueDate);
      const daysRemaining = Math.ceil(
        (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      nextDue = {
        rentId: nextDueRent._id,
        rentMonth: nextDueRent.rentMonth,
        monthNumber: nextDueRent.monthNumber,
        amount: nextDueRent.rentAmount + (nextDueRent.lateFee || 0),
        dueDate: nextDueRent.dueDate,
        daysRemaining,
        isOverdue: daysRemaining < 0,
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        allocation: {
          _id: allocation._id,
          pgName: allocation.pgName,
          roomNumber: allocation.roomNumber,
          bedNumber: allocation.bedNumber,
          monthlyRent: allocation.monthlyRent,
          moveInDate: allocation.moveInDate,
          status: allocation.status,
          listing: allocation.listingId,
        },
        rentHistory,
        summary,
        nextDue,
      },
    });
  } catch (error) {
    console.error("Get rent history error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Initiate online rent payment
export async function POST(req: NextRequest) {
  try {
    await connectToDB();
    const user = await authUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { rentId } = await req.json();

    if (!rentId) {
      return NextResponse.json(
        { success: false, message: "Rent ID is required" },
        { status: 400 }
      );
    }

    const rent = await MonthlyRentPayment.findById(rentId)
      .populate("listingId", "pgName");

    if (!rent) {
      return NextResponse.json(
        { success: false, message: "Rent payment not found" },
        { status: 404 }
      );
    }

    // Verify tenant
    if (rent.tenantId.toString() !== user.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 }
      );
    }

    // Check if already paid
    if (rent.paymentStatus === "paid") {
      return NextResponse.json(
        { success: false, message: "Rent already paid" },
        { status: 400 }
      );
    }

    // Calculate amount due
    const amountDue = rent.rentAmount + (rent.lateFee || 0) - (rent.paidAmount || 0);

    if (amountDue <= 0) {
      return NextResponse.json(
        { success: false, message: "No amount due" },
        { status: 400 }
      );
    }

    // Create Razorpay order
    const razorpayOrder = await createRazorpayOrder({
      amount: amountDue,
      receipt: `RENT_${rent._id}_${Date.now()}`,
      notes: {
        rentId: rent._id.toString(),
        userId: user.id,
        monthNumber: rent.monthNumber.toString(),
        pgName: (rent.listingId as any).pgName,
        type: "monthly_rent",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        orderId: razorpayOrder.id,
        amount: amountDue,
        currency: "INR",
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        rentId: rent._id,
        monthNumber: rent.monthNumber,
      },
    });
  } catch (error) {
    console.error("Initiate rent payment error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}