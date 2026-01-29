// app/api/owner/tenants/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import TenantAllocation from "@/models/tenantAllocation";
import Booking from "@/models/booking";
import Listing from "@/models/listing";
import User from "@/models/user";
import Room from "@/models/room";
import { authUser } from "@/actions/authUser";

// GET - Get all tenants for owner's properties
export async function GET(req: NextRequest) {
  try {
    await connectToDB();
    const user = await authUser();

    if (!user || (user.role !== "owner" && user.role !== "admin")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all"; // all, active, notice_period, vacated
    const listingId = searchParams.get("listingId");
    const search = searchParams.get("search") || "";
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const perPage = Math.min(Number(searchParams.get("per_page") || "20"), 50);

    // Get owner's listings
    const listings = await Listing.find({ ownerId: user.id }).select("_id pgName");
    const listingIds = listingId ? [listingId] : listings.map((l) => l._id);

    // Build query
    const query: any = {
      listingId: { $in: listingIds },
    };

    if (status !== "all") {
      query.status = status;
    }

    // Get allocations with tenant details
    let allocations = await TenantAllocation.find(query)
      .populate("tenantId", "fullName email phone")
      .populate("listingId", "pgName location")
      .populate("bookingId", "aadhaarNumber address phoneNumber email fullName")
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    // Filter by search if provided
    if (search) {
      const searchLower = search.toLowerCase();
      allocations = allocations.filter((a: any) => {
        const tenant = a.tenantId;
        const booking = a.bookingId;
        return (
          tenant?.fullName?.toLowerCase().includes(searchLower) ||
          tenant?.email?.toLowerCase().includes(searchLower) ||
          tenant?.phone?.includes(search) ||
          booking?.phoneNumber?.includes(search) ||
          a.roomNumber?.toLowerCase().includes(searchLower)
        );
      });
    }

    const total = await TenantAllocation.countDocuments(query);
    const totalPages = Math.ceil(total / perPage);

    // Format tenant data
    const tenants = allocations.map((allocation: any) => {
      const tenant = allocation.tenantId || {};
      const booking = allocation.bookingId || {};
      const listing = allocation.listingId || {};

      // Calculate rent status
      const currentRent = allocation.rentHistory?.find((r: any) => {
        const rentMonth = new Date(r.month);
        const now = new Date();
        return (
          rentMonth.getMonth() === now.getMonth() &&
          rentMonth.getFullYear() === now.getFullYear()
        );
      });

      // Calculate days until move out (if in notice period)
      let daysUntilMoveOut = null;
      if (allocation.status === "notice_period" && allocation.expectedVacateDate) {
        const vacateDate = new Date(allocation.expectedVacateDate);
        const today = new Date();
        daysUntilMoveOut = Math.ceil(
          (vacateDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
      }

      return {
        allocationId: allocation._id,
        tenant: {
          id: tenant._id,
          name: tenant.fullName || booking.fullName || "Unknown",
          email: tenant.email || booking.email,
          phone: tenant.phone || booking.phoneNumber,
        },
        booking: {
          id: booking._id,
          aadhaarNumber: booking.aadhaarNumber,
          address: booking.address,
        },
        property: {
          id: listing._id,
          name: allocation.pgName || listing.pgName,
          location: listing.location,
        },
        room: {
          id: allocation.roomId,
          number: allocation.roomNumber,
          bed: allocation.bedNumber,
          type: allocation.roomType,
        },
        dates: {
          moveIn: allocation.moveInDate,
          expectedMoveOut: allocation.expectedMoveOutDate,
          actualMoveOut: allocation.actualMoveOutDate,
          allocatedAt: allocation.allocatedAt,
        },
        status: allocation.status,
        noticePeriod: {
          inNotice: allocation.status === "notice_period",
          noticeGivenDate: allocation.noticeGivenDate,
          expectedVacateDate: allocation.expectedVacateDate,
          daysUntilMoveOut,
        },
        financial: {
          monthlyRent: allocation.monthlyRent,
          securityDeposit: allocation.securityDeposit,
          securityDepositPaid: allocation.securityDepositPaid,
          currentRentStatus: currentRent?.status || "pending",
          currentRentPaid: currentRent?.paidAmount || 0,
          totalRentPaid: allocation.rentHistory
            ?.filter((r: any) => r.status === "paid")
            .reduce((acc: number, r: any) => acc + r.paidAmount, 0) || 0,
        },
        stayDuration: {
          months: Math.floor(
            (new Date().getTime() - new Date(allocation.moveInDate).getTime()) /
              (1000 * 60 * 60 * 24 * 30)
          ),
        },
      };
    });

    // Calculate summary stats
    const allAllocations = await TenantAllocation.find({
      listingId: { $in: listingIds },
    });

    const summary = {
      totalTenants: allAllocations.filter((a: any) =>
        ["active", "notice_period"].includes(a.status)
      ).length,
      activeTenants: allAllocations.filter((a: any) => a.status === "active").length,
      inNoticePeriod: allAllocations.filter((a: any) => a.status === "notice_period")
        .length,
      vacatedThisMonth: allAllocations.filter((a: any) => {
        if (a.status !== "vacated" || !a.actualMoveOutDate) return false;
        const moveOut = new Date(a.actualMoveOutDate);
        const now = new Date();
        return (
          moveOut.getMonth() === now.getMonth() &&
          moveOut.getFullYear() === now.getFullYear()
        );
      }).length,
      totalRevenue: allAllocations.reduce((acc: number, a: any) => {
        const paid = a.rentHistory
          ?.filter((r: any) => r.status === "paid")
          .reduce((sum: number, r: any) => sum + r.paidAmount, 0) || 0;
        return acc + paid;
      }, 0),
    };

    return NextResponse.json({
      success: true,
      data: tenants,
      total,
      totalPages,
      currentPage: page,
      summary,
      listings: listings.map((l) => ({ id: l._id, name: l.pgName })),
    });
  } catch (error) {
    console.error("Get tenants error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}