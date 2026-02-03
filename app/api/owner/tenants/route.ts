import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import TenantAllocation from "@/models/tenantAllocation";
import Listing from "@/models/listing";
import { authUser } from "@/actions/authUser";

// Response helpers
function jsonResponse(data: object, status: number = 200) {
  return NextResponse.json(data, { status });
}

function errorResponse(message: string, status: number = 400) {
  return jsonResponse({ success: false, message }, status);
}

/**
 * GET - Get all tenants for owner's properties
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
    const search = searchParams.get("search") || "";
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const perPage = Math.min(Number(searchParams.get("per_page") || "20"), 50);

    // Get owner's listings
    const listings = await Listing.find({ ownerId: user.id }).select("_id pgName");
    const listingIds = listingId ? [listingId] : listings.map((l) => l._id);

    // Build query
    const query: Record<string, unknown> = {
      listingId: { $in: listingIds },
    };

    if (status !== "all") {
      if (status === "current") {
        query.status = { $in: ["active", "notice_period"] };
      } else {
        query.status = status;
      }
    }

    // Get allocations with tenant details
    const allocationsQuery = TenantAllocation.find(query)
      .populate("tenantId", "fullName email phone")
      .populate("listingId", "pgName location")
      .populate("bookingId", "aadhaarNumber address phoneNumber email fullName")
      .sort({ createdAt: -1 });

    // Apply search filter
    if (search) {
      // For search, we need to fetch all and filter in memory
      // This is not ideal for large datasets - consider text index for production
      const allAllocations = await allocationsQuery.exec();

      const searchLower = search.toLowerCase();
      const filteredAllocations = allAllocations.filter((a: any) => {
        const tenant = a.tenantId || {};
        const booking = a.bookingId || {};
        return (
          tenant.fullName?.toLowerCase().includes(searchLower) ||
          tenant.email?.toLowerCase().includes(searchLower) ||
          tenant.phone?.includes(search) ||
          booking.phoneNumber?.includes(search) ||
          a.roomNumber?.toLowerCase().includes(searchLower) ||
          a.pgName?.toLowerCase().includes(searchLower)
        );
      });

      // Paginate filtered results
      const total = filteredAllocations.length;
      const paginatedAllocations = filteredAllocations.slice(
        (page - 1) * perPage,
        page * perPage
      );

      return jsonResponse({
        success: true,
        data: formatTenantData(paginatedAllocations),
        total,
        totalPages: Math.ceil(total / perPage),
        currentPage: page,
        summary: await calculateSummary(listingIds),
        listings: listings.map((l) => ({ id: l._id, name: l.pgName })),
      });
    }

    // Get total count
    const total = await TenantAllocation.countDocuments(query);
    const totalPages = Math.ceil(total / perPage);

    // Get paginated results
    const allocations = await allocationsQuery
      .skip((page - 1) * perPage)
      .limit(perPage)
      .exec();

    return jsonResponse({
      success: true,
      data: formatTenantData(allocations),
      total,
      totalPages,
      currentPage: page,
      summary: await calculateSummary(listingIds),
      listings: listings.map((l) => ({ id: l._id, name: l.pgName })),
    });
  } catch (error) {
    console.error("Get tenants error:", error);
    return errorResponse("Internal server error", 500);
  }
}

// Helper function to format tenant data
function formatTenantData(allocations: any[]) {
  return allocations.map((allocation: any) => {
    const tenant = allocation.tenantId || {};
    const booking = allocation.bookingId || {};
    const listing = allocation.listingId || {};

    // Get current month rent
    const now = new Date();
    const currentRent = allocation.rentHistory?.find((r: any) => {
      const rentMonth = new Date(r.month);
      return (
        rentMonth.getMonth() === now.getMonth() &&
        rentMonth.getFullYear() === now.getFullYear()
      );
    });

    // Calculate days until move out
    let daysUntilMoveOut = null;
    if (
      allocation.status === "notice_period" &&
      allocation.expectedVacateDate
    ) {
      const vacateDate = new Date(allocation.expectedVacateDate);
      daysUntilMoveOut = Math.ceil(
        (vacateDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    // Calculate stay duration
    const moveInDate = new Date(allocation.moveInDate);
    const stayMonths = Math.floor(
      (now.getTime() - moveInDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );

    // Calculate total paid
    const totalRentPaid =
      allocation.rentHistory
        ?.filter((r: any) => r.status === "paid" || r.status === "partial")
        .reduce((acc: number, r: any) => acc + r.paidAmount, 0) || 0;

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
        reason: allocation.vacationReason,
      },
      financial: {
        monthlyRent: allocation.monthlyRent,
        securityDeposit: allocation.securityDeposit,
        securityDepositPaid: allocation.securityDepositPaid,
        currentRentStatus: currentRent?.status || "pending",
        currentRentPaid: currentRent?.paidAmount || 0,
        totalRentPaid,
        overdueAmount: allocation.rentHistory
          ?.filter((r: any) => r.status === "overdue")
          .reduce(
            (acc: number, r: any) => acc + r.amount + r.lateFee - r.paidAmount,
            0
          ) || 0,
      },
      stayDuration: {
        months: stayMonths,
        formatted:
          stayMonths < 1
            ? "Less than a month"
            : `${stayMonths} month${stayMonths > 1 ? "s" : ""}`,
      },
    };
  });
}

// Helper function to calculate summary stats
async function calculateSummary(listingIds: any[]) {
  const allAllocations = await TenantAllocation.find({
    listingId: { $in: listingIds },
  }).lean();

  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  return {
    totalTenants: allAllocations.filter((a: any) =>
      ["active", "notice_period"].includes(a.status)
    ).length,
    activeTenants: allAllocations.filter((a: any) => a.status === "active")
      .length,
    inNoticePeriod: allAllocations.filter(
      (a: any) => a.status === "notice_period"
    ).length,
    vacatedThisMonth: allAllocations.filter((a: any) => {
      if (a.status !== "vacated" || !a.actualMoveOutDate) return false;
      const moveOut = new Date(a.actualMoveOutDate);
      return moveOut >= thisMonth;
    }).length,
    newThisMonth: allAllocations.filter((a: any) => {
      const allocatedAt = new Date(a.allocatedAt);
      return allocatedAt >= thisMonth;
    }).length,
    totalRevenue: allAllocations.reduce((acc: number, a: any) => {
      const paid =
        a.rentHistory
          ?.filter((r: any) => r.status === "paid" || r.status === "partial")
          .reduce((sum: number, r: any) => sum + r.paidAmount, 0) || 0;
      return acc + paid;
    }, 0),
    overdueRents: allAllocations.filter((a: any) =>
      a.rentHistory?.some((r: any) => r.status === "overdue")
    ).length,
  };
}