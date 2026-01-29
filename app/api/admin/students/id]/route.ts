// app/api/admin/students/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import User from "@/models/user";
import Booking from "@/models/booking";
import TenantAllocation from "@/models/tenantAllocation";
import SupportTicket from "@/models/supportTicket";
import Notification from "@/models/notification";
import Listing from "@/models/listing";
import { authUser } from "@/actions/authUser";
import mongoose from "mongoose";

// GET - Get single student details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();

    const user = await authUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid student ID" },
        { status: 400 }
      );
    }

    // Get user details
    const student = await User.findById(id)
      .select("fullName email phone watchlist createdAt role")
      .lean();

    if (!student || (student as any).role !== "user") {
      return NextResponse.json(
        { success: false, message: "Student not found" },
        { status: 404 }
      );
    }

    // Cast student to any for easier access
    const studentData = student as any;

    // Get all bookings
    const bookings = await Booking.find({ userId: id })
      .populate("listingId", "pgName location primaryImage type")
      .sort({ createdAt: -1 })
      .lean();

    // Get all allocations
    const allocations = await TenantAllocation.find({ tenantId: id })
      .populate("listingId", "pgName location")
      .sort({ createdAt: -1 })
      .lean();

    // Get all support tickets
    const tickets = await SupportTicket.find({ userId: id })
      .populate("listingId", "pgName")
      .sort({ createdAt: -1 })
      .lean();

    // Get notifications count
    const unreadNotifications = await Notification.countDocuments({
      userId: id,
      isRead: false,
    });

    // Get watchlist details
    const watchlistIds = studentData.watchlist || [];
    let watchlist: any[] = [];
    if (watchlistIds.length > 0) {
      watchlist = await Listing.find({ _id: { $in: watchlistIds } })
        .select("pgName location primaryImage type")
        .lean();
    }

    // Calculate payment history
    const paymentHistory = (bookings as any[]).map((booking: any) => ({
      bookingId: booking._id,
      pgName: booking.listingId?.pgName || "N/A",
      amount: booking.amount || 0,
      securityDeposit: booking.securityDeposit || 0,
      total: (booking.amount || 0) + (booking.securityDeposit || 0),
      status: booking.paymentStatus,
      method: booking.paymentMethod,
      date: booking.createdAt,
      couponCode: booking.couponCode,
      discountAmount: booking.discountAmount,
    }));

    // Calculate rent history from allocations
    const rentHistory: any[] = [];

    (allocations as any[]).forEach((allocation: any) => {
      if (allocation.rentHistory && allocation.rentHistory.length > 0) {
        allocation.rentHistory.forEach((rent: any) => {
          rentHistory.push({
            allocationId: allocation._id,
            pgName: allocation.pgName,
            room: `${allocation.roomNumber}-${allocation.bedNumber}`,
            month: rent.month,
            amount: rent.amount,
            status: rent.status,
            paidAmount: rent.paidAmount,
            paidAt: rent.paidAt,
            dueDate: rent.dueDate,
            lateFee: rent.lateFee,
          });
        });
      }
    });

    // Sort rent history by date
    rentHistory.sort(
      (a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
    );

    // Current stay info
    const currentStay = (allocations as any[]).find(
      (a: any) => a.status === "active" || a.status === "notice_period"
    );

    // Stats summary
    const bookingsArray = bookings as any[];
    const ticketsArray = tickets as any[];

    const stats = {
      totalBookings: bookingsArray.length,
      confirmedBookings: bookingsArray.filter((b: any) => b.status === "confirmed").length,
      totalPaid: bookingsArray
        .filter((b: any) => b.paymentStatus === "completed_cash")
        .reduce((acc: number, b: any) => acc + (b.amount || 0) + (b.securityDeposit || 0), 0),
      totalRentPaid: rentHistory
        .filter((r: any) => r.status === "paid")
        .reduce((acc: number, r: any) => acc + r.paidAmount, 0),
      pendingRent: rentHistory
        .filter((r: any) => r.status === "pending" || r.status === "overdue")
        .reduce((acc: number, r: any) => acc + r.amount, 0),
      totalTickets: ticketsArray.length,
      openTickets: ticketsArray.filter((t: any) =>
        ["open", "in_progress", "waiting_response"].includes(t.status)
      ).length,
      stayDuration: currentStay
        ? Math.floor(
            (new Date().getTime() - new Date(currentStay.moveInDate).getTime()) /
              (1000 * 60 * 60 * 24 * 30)
          )
        : 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        student: {
          _id: studentData._id,
          fullName: studentData.fullName,
          email: studentData.email,
          phone: studentData.phone,
          registeredAt: studentData.createdAt,
          unreadNotifications,
        },
        currentStay: currentStay
          ? {
              allocationId: currentStay._id,
              pgName: currentStay.pgName,
              room: `Room ${currentStay.roomNumber}, Bed ${currentStay.bedNumber}`,
              roomType: currentStay.roomType,
              status: currentStay.status,
              monthlyRent: currentStay.monthlyRent,
              moveInDate: currentStay.moveInDate,
              expectedMoveOut: currentStay.expectedMoveOutDate,
              noticeGiven: currentStay.status === "notice_period",
              expectedVacateDate: currentStay.expectedVacateDate,
            }
          : null,
        bookings,
        allocations,
        tickets,
        paymentHistory,
        rentHistory,
        watchlist,
        stats,
      },
    });
  } catch (error) {
    console.error("Get student details error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete student account (soft delete or full delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();

    const user = await authUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid student ID" },
        { status: 400 }
      );
    }

    // Check if student exists
    const student = await User.findById(id).select("role").lean();
    
    if (!student || (student as any).role !== "user") {
      return NextResponse.json(
        { success: false, message: "Student not found" },
        { status: 404 }
      );
    }

    // Check if student has active allocation
    const activeAllocation = await TenantAllocation.findOne({
      tenantId: id,
      status: { $in: ["active", "notice_period"] },
    });

    if (activeAllocation) {
      return NextResponse.json(
        {
          success: false,
          message: "Cannot delete student with active stay. Process move-out first.",
        },
        { status: 400 }
      );
    }

    // Check for pending payments
    const pendingBooking = await Booking.findOne({
      userId: id,
      paymentStatus: { $in: ["pending", "pending_cash_payment"] },
    });

    if (pendingBooking) {
      return NextResponse.json(
        {
          success: false,
          message: "Cannot delete student with pending payments.",
        },
        { status: 400 }
      );
    }

    // Delete user
    await User.findByIdAndDelete(id);

    // Optionally: Clean up related data or just leave for records
    // await Notification.deleteMany({ userId: id });

    return NextResponse.json({
      success: true,
      message: "Student account deleted successfully",
    });
  } catch (error) {
    console.error("Delete student error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}