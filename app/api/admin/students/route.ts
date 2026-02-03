// app/api/admin/students/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import User from "@/models/user";
import Booking from "@/models/booking";
import TenantAllocation from "@/models/tenantAllocation";
import SupportTicket from "@/models/supportTicket";
import { authUser } from "@/actions/authUser";
import mongoose from "mongoose";

// GET - Get all students with their details
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
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all"; // all, active, inactive
    const hasBooking = searchParams.get("hasBooking"); // true, false

    // Build query for users with role "user"
    const query: any = { role: "user" };

    // Search by name, email, or phone
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const total = await User.countDocuments(query);
    const totalPages = Math.ceil(total / perPage);

    // Get users
    const users = await User.find(query)
      .select("fullName email phone watchlist createdAt")
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean();

    const userIds = users.map((u) => u._id);

    // Get bookings for these users
    const bookings = await Booking.find({ userId: { $in: userIds } })
      .populate("listingId", "pgName location")
      .lean();

    // Get allocations for these users
    const allocations = await TenantAllocation.find({
      tenantId: { $in: userIds },
    })
      .select("tenantId pgName roomNumber bedNumber status monthlyRent moveInDate")
      .lean();

    // Get support tickets for these users
    const tickets = await SupportTicket.find({ userId: { $in: userIds } })
      .select("userId status priority category createdAt")
      .lean();

    // Combine data
    const students = users.map((user: any) => {
      const userBookings = bookings.filter(
        (b: any) => b.userId.toString() === user._id.toString()
      );
      const userAllocations = allocations.filter(
        (a: any) => a.tenantId.toString() === user._id.toString()
      );
      const userTickets = tickets.filter(
        (t: any) => t.userId.toString() === user._id.toString()
      );

      // Calculate booking stats
      const confirmedBookings = userBookings.filter((b: any) => b.status === "confirmed");
      const pendingBookings = userBookings.filter((b: any) => b.status === "pending");
      const cancelledBookings = userBookings.filter((b: any) => b.status === "cancelled");

      // Calculate payment stats
      const totalPaid = userBookings
        .filter((b: any) => b.paymentStatus === "completed_cash")
        .reduce((acc: number, b: any) => acc + (b.amount || 0) + (b.securityDeposit || 0), 0);

      const pendingPayment = userBookings
        .filter((b: any) => ["pending", "pending_cash_payment"].includes(b.paymentStatus))
        .reduce((acc: number, b: any) => acc + (b.amount || 0), 0);

      // Current stay
      const activeAllocation = userAllocations.find(
        (a: any) => a.status === "active" || a.status === "notice_period"
      );

      // Ticket stats
      const openTickets = userTickets.filter(
        (t: any) => ["open", "in_progress", "waiting_response"].includes(t.status)
      ).length;
      const resolvedTickets = userTickets.filter(
        (t: any) => ["resolved", "closed"].includes(t.status)
      ).length;

      return {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        registeredAt: user.createdAt,
        watchlistCount: user.watchlist?.length || 0,
        bookings: {
          total: userBookings.length,
          confirmed: confirmedBookings.length,
          pending: pendingBookings.length,
          cancelled: cancelledBookings.length,
          recent: userBookings[0] || null,
        },
        payments: {
          totalPaid,
          pendingPayment,
        },
        currentStay: activeAllocation
          ? {
              pgName: activeAllocation.pgName,
              room: `${activeAllocation.roomNumber}-${activeAllocation.bedNumber}`,
              status: activeAllocation.status,
              monthlyRent: activeAllocation.monthlyRent,
              moveInDate: activeAllocation.moveInDate,
            }
          : null,
        tickets: {
          total: userTickets.length,
          open: openTickets,
          resolved: resolvedTickets,
        },
        isActive: !!activeAllocation,
      };
    });

    // Filter by status if needed
    let filteredStudents = students;
    if (status === "active") {
      filteredStudents = students.filter((s) => s.isActive);
    } else if (status === "inactive") {
      filteredStudents = students.filter((s) => !s.isActive);
    }

    if (hasBooking === "true") {
      filteredStudents = filteredStudents.filter((s) => s.bookings.total > 0);
    } else if (hasBooking === "false") {
      filteredStudents = filteredStudents.filter((s) => s.bookings.total === 0);
    }

    // Calculate summary stats
    const allStudentsCount = await User.countDocuments({ role: "user" });
    const activeStudentsCount = await TenantAllocation.distinct("tenantId", {
      status: { $in: ["active", "notice_period"] },
    });
    const studentsWithBookings = await Booking.distinct("userId");

    const summary = {
      totalStudents: allStudentsCount,
      activeStudents: activeStudentsCount.length,
      studentsWithBookings: studentsWithBookings.length,
      newThisMonth: await User.countDocuments({
        role: "user",
        createdAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      }),
    };

    return NextResponse.json({
      success: true,
      data: filteredStudents,
      total: filteredStudents.length,
      totalPages,
      currentPage: page,
      summary,
    });
  } catch (error) {
    console.error("Get students error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}