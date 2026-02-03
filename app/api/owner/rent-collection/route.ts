// app/api/owner/rent-collection/route.ts
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDB } from "@/services/connectdb";
import TenantAllocation from "@/models/tenantAllocation";
import Listing from "@/models/listing";
import Commission from "@/models/commission";
import { authUser } from "@/actions/authUser";
import { createNotification } from "@/lib/utils/notificationHelper";

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
    const listingIds = listingId ? [listingId] : listings.map((l) => l._id);

    // Get allocations with rent history
    const allocations = await TenantAllocation.find({
      listingId: { $in: listingIds },
      status: { $in: ["active", "notice_period", "vacated"] },
    })
      .populate("tenantId", "fullName email phone")
      .populate("listingId", "pgName")
      .lean();

    // Extract rent records
    const rentRecords: any[] = [];

    allocations.forEach((allocation: any) => {
      allocation.rentHistory?.forEach((rent: any) => {
        // Filter by month if specified
        if (month) {
          const rentMonth = new Date(rent.month);
          const filterMonth = new Date(month + "-01");
          if (
            rentMonth.getMonth() !== filterMonth.getMonth() ||
            rentMonth.getFullYear() !== filterMonth.getFullYear()
          ) {
            return;
          }
        }

        // Filter by status
        if (status !== "all" && rent.status !== status) {
          return;
        }

        rentRecords.push({
          allocationId: allocation._id,
          rentId: rent._id,
          tenant: {
            id: allocation.tenantId?._id,
            name: allocation.tenantId?.fullName || "Unknown",
            email: allocation.tenantId?.email,
            phone: allocation.tenantId?.phone,
          },
          pg: {
            id: allocation.listingId?._id,
            name: allocation.listingId?.pgName || allocation.pgName,
          },
          room: {
            number: allocation.roomNumber,
            bed: allocation.bedNumber,
            type: allocation.roomType,
          },
          rent: {
            month: rent.month,
            amount: rent.amount,
            status: rent.status,
            paidAmount: rent.paidAmount,
            paidAt: rent.paidAt,
            dueDate: rent.dueDate,
            lateFee: rent.lateFee || 0,
            waivedAmount: rent.waivedAmount || 0,
            paymentMethod: rent.paymentMethod,
            transactionId: rent.transactionId,
          },
          monthlyRent: allocation.monthlyRent,
        });
      });
    });

    // Sort by due date (most recent first for paid, earliest first for pending/overdue)
    rentRecords.sort((a, b) => {
      if (a.rent.status === "paid" && b.rent.status === "paid") {
        return new Date(b.rent.paidAt).getTime() - new Date(a.rent.paidAt).getTime();
      }
      return new Date(a.rent.dueDate).getTime() - new Date(b.rent.dueDate).getTime();
    });

    // Calculate summary
    const summary = {
      totalPending: 0,
      totalOverdue: 0,
      totalPaid: 0,
      pendingCount: 0,
      overdueCount: 0,
      paidCount: 0,
    };

    rentRecords.forEach((record) => {
      const due = record.rent.amount + record.rent.lateFee - record.rent.paidAmount;
      
      switch (record.rent.status) {
        case "pending":
          summary.totalPending += due;
          summary.pendingCount++;
          break;
        case "overdue":
          summary.totalOverdue += due;
          summary.overdueCount++;
          break;
        case "paid":
          summary.totalPaid += record.rent.paidAmount;
          summary.paidCount++;
          break;
        case "partial":
          summary.totalPending += due;
          summary.pendingCount++;
          break;
      }
    });

    return jsonResponse({
      success: true,
      data: rentRecords,
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
      allocationId,
      rentMonth, // ISO date string
      paidAmount,
      paymentMethod = "cash",
      transactionId = "",
      waiveLateFee = false,
      notes = "",
    } = body;

    if (!allocationId || !rentMonth || paidAmount === undefined) {
      return errorResponse("Allocation ID, rent month, and paid amount are required");
    }

    if (paidAmount <= 0) {
      return errorResponse("Paid amount must be greater than 0");
    }

    session.startTransaction();

    // Get allocation
    const allocation = await TenantAllocation.findById(allocationId)
      .populate("listingId", "ownerId pgName")
      .session(session);

    if (!allocation) {
      await session.abortTransaction();
      return errorResponse("Allocation not found", 404);
    }

    // Verify ownership
    const listing = allocation.listingId as any;
    if (listing.ownerId.toString() !== user.id && user.role !== "admin") {
      await session.abortTransaction();
      return errorResponse("Unauthorized", 403);
    }

    // Find the rent entry
    const rentMonth_ = new Date(rentMonth);
    const rentIndex = allocation.rentHistory.findIndex((r: any) => {
      const rMonth = new Date(r.month);
      return (
        rMonth.getMonth() === rentMonth_.getMonth() &&
        rMonth.getFullYear() === rentMonth_.getFullYear()
      );
    });

    if (rentIndex === -1) {
      await session.abortTransaction();
      return errorResponse("Rent entry not found for the specified month");
    }

    const rent = allocation.rentHistory[rentIndex];

    // Waive late fee if requested
    if (waiveLateFee && rent.lateFee > 0) {
      rent.waivedAmount = (rent.waivedAmount || 0) + rent.lateFee;
      rent.lateFee = 0;
    }

    // Update rent entry
    const previousPaid = rent.paidAmount || 0;
    rent.paidAmount = previousPaid + paidAmount;
    rent.paymentMethod = paymentMethod;
    rent.transactionId = transactionId;
    rent.paidAt = new Date();

    if (notes) {
      rent.notes = notes;
    }

    // Determine new status
    const totalDue = rent.amount + (rent.lateFee || 0) - (rent.waivedAmount || 0);
    if (rent.paidAmount >= totalDue) {
      rent.status = "paid";
    } else if (rent.paidAmount > 0) {
      rent.status = "partial";
    }

    allocation.rentHistory[rentIndex] = rent;
    await allocation.save({ session });

    // Create commission entry (10% of collected amount)
    const commissionAmount = Math.round(paidAmount * 0.1);
    const commissionDueDate = new Date();
    commissionDueDate.setDate(commissionDueDate.getDate() + 7); // Due in 7 days

    const commission = new Commission({
      ownerId: listing.ownerId,
      listingId: listing._id,
      allocationId: allocation._id,
      type: "rent_collection",
      rentMonth: rentMonth_,
      rentAmount: paidAmount,
      commissionRate: 10,
      commissionAmount,
      status: "pending",
      dueDate: commissionDueDate,
      notes: `Commission for rent collection - ${allocation.pgName}, Room ${allocation.roomNumber}`,
    });

    await commission.save({ session });

    // Notify tenant
    await createNotification({
      userId: allocation.tenantId,
      type: "rent_paid" as any,
      title: "Rent Payment Recorded",
      message: `Your rent payment of ₹${paidAmount.toLocaleString()} for ${rentMonth_.toLocaleDateString("en-IN", { month: "long", year: "numeric" })} has been recorded.`,
      relatedId: allocation._id,
      relatedType: "allocation",
      priority: "medium",
      session,
    });

    await session.commitTransaction();

    return jsonResponse({
      success: true,
      message: "Rent payment recorded successfully",
      data: {
        rent: allocation.rentHistory[rentIndex],
        commissionCreated: commissionAmount,
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
    const { allocationId, rentMonth, action, data } = body;

    if (!allocationId || !rentMonth || !action) {
      return errorResponse("Allocation ID, rent month, and action are required");
    }

    // Get allocation
    const allocation = await TenantAllocation.findById(allocationId).populate(
      "listingId",
      "ownerId"
    );

    if (!allocation) {
      return errorResponse("Allocation not found", 404);
    }

    // Verify ownership
    const listing = allocation.listingId as any;
    if (listing.ownerId.toString() !== user.id && user.role !== "admin") {
      return errorResponse("Unauthorized", 403);
    }

    // Find the rent entry
    const rentMonth_ = new Date(rentMonth);
    const rentIndex = allocation.rentHistory.findIndex((r: any) => {
      const rMonth = new Date(r.month);
      return (
        rMonth.getMonth() === rentMonth_.getMonth() &&
        rMonth.getFullYear() === rentMonth_.getFullYear()
      );
    });

    if (rentIndex === -1) {
      return errorResponse("Rent entry not found for the specified month");
    }

    const rent = allocation.rentHistory[rentIndex];

    switch (action) {
      case "waive_late_fee":
        if (rent.lateFee > 0) {
          rent.waivedAmount = (rent.waivedAmount || 0) + rent.lateFee;
          rent.lateFee = 0;
        }
        break;

      case "add_late_fee":
        const lateFeeAmount = data?.amount || Math.round(rent.amount * 0.05);
        rent.lateFee = (rent.lateFee || 0) + lateFeeAmount;
        if (rent.status === "pending") {
          rent.status = "overdue";
        }
        break;

      case "update_notes":
        rent.notes = data?.notes || "";
        break;

      default:
        return errorResponse(`Invalid action: ${action}`);
    }

    allocation.rentHistory[rentIndex] = rent;
    await allocation.save();

    return jsonResponse({
      success: true,
      message: `Action '${action}' completed successfully`,
      data: rent,
    });
  } catch (error) {
    console.error("Update rent entry error:", error);
    return errorResponse("Internal server error", 500);
  }
}