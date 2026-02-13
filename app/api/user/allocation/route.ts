// app/api/user/allocation/route.ts
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDB } from "@/services/connectdb";
import TenantAllocation from "@/models/tenantAllocation";
import MonthlyRentPayment from "@/models/MonthlyRentPayment";
import Booking from "@/models/booking";
import Room from "@/models/room";
import Listing from "@/models/listing";
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
 * GET - Get user's current allocation with payment details
 */
export async function GET(req: NextRequest) {
  try {
    await connectToDB();
    const user = await authUser();

    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    // Get active allocation
    const allocation = await TenantAllocation.findOne({
      tenantId: user.id,
      status: { $in: ["pending", "active", "notice_period"] },
    })
      .populate("listingId", "pgName location amenities detailedRules mealTimings rentInclusions images primaryImage")
      .populate("bookingId");

    if (!allocation) {
      return jsonResponse({
        success: true,
        data: null,
        message: "No active allocation found",
      });
    }

    // Get room details
    const room = await Room.findById(allocation.roomId).lean();

    // Get booking with payment details
    const booking = await Booking.findById(allocation.bookingId);

    // Get monthly rent payments
    const rentPayments = await MonthlyRentPayment.find({
      allocationId: allocation._id,
    }).sort({ rentMonth: -1 });

    // Get roommates (other tenants in same room)
    const roommates = await TenantAllocation.find({
      roomId: allocation.roomId,
      _id: { $ne: allocation._id },
      status: { $in: ["active", "notice_period"] },
    })
      .populate("tenantId", "fullName")
      .select("bedNumber tenantId");

    // Calculate next rent due
    const today = new Date();
    let nextRentDue = null;

    const pendingRent = rentPayments.find(
      (r) => ["pending", "overdue", "upcoming"].includes(r.paymentStatus)
    );

    if (pendingRent) {
      const dueDate = new Date(pendingRent.dueDate);
      const daysRemaining = Math.ceil(
        (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      nextRentDue = {
        rentId: pendingRent._id,
        amount: pendingRent.rentAmount + (pendingRent.lateFee || 0),
        dueDate: pendingRent.dueDate,
        daysRemaining,
        isOverdue: daysRemaining < 0,
        monthNumber: pendingRent.monthNumber,
        status: pendingRent.paymentStatus,
      };
    }

    // Payment summary
    const paymentSummary = {
      booking: booking ? {
        bookingFee: booking.bookingFee,
        securityDeposit: booking.securityDeposit,
        firstMonthRent: booking.firstMonthRent,
        totalPaid: booking.totalPaid,
        totalDue: booking.totalDue,
        isComplete: booking.totalPaid >= booking.totalDue,
      } : null,
      
      monthlyRent: {
        totalPaid: rentPayments
          .filter((r) => r.paymentStatus === "paid")
          .reduce((acc, r) => acc + r.paidAmount, 0),
        totalPending: rentPayments
          .filter((r) => ["pending", "overdue"].includes(r.paymentStatus))
          .reduce((acc, r) => acc + r.rentAmount + (r.lateFee || 0) - (r.paidAmount || 0), 0),
        overdueMonths: rentPayments.filter((r) => r.paymentStatus === "overdue").length,
      },

      nextDue: nextRentDue,
    };

    return jsonResponse({
      success: true,
      data: {
        allocation: {
          ...allocation.toObject(),
          room: room
            ? {
                roomNumber: room.roomNumber,
                roomType: room.roomType,
                floor: room.floor,
                isAC: room.isAC,
                hasAttachedBathroom: room.hasAttachedBathroom,
                amenities: room.amenities,
              }
            : null,
        },
        roommates: roommates.map((r) => ({
          name: (r.tenantId as any)?.fullName || "Unknown",
          bedNumber: r.bedNumber,
        })),
        paymentSummary,
        rentHistory: rentPayments.slice(0, 6).map((r) => ({
          _id: r._id,
          rentMonth: r.rentMonth,
          monthNumber: r.monthNumber,
          amount: r.rentAmount,
          lateFee: r.lateFee || 0,
          paidAmount: r.paidAmount || 0,
          status: r.paymentStatus,
          dueDate: r.dueDate,
          paidAt: r.paidAt,
        })),
      },
    });
  } catch (error) {
    console.error("Get allocation error:", error);
    return errorResponse("Internal server error", 500);
  }
}

/**
 * POST - Give notice (tenant initiating move-out)
 */
export async function POST(req: NextRequest) {
  const session = await mongoose.startSession();

  try {
    await connectToDB();
    const user = await authUser();

    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const { expectedVacateDate, reason } = await req.json();

    if (!expectedVacateDate) {
      return errorResponse("Expected vacate date is required");
    }

    // Get active allocation
    const allocation = await TenantAllocation.findOne({
      tenantId: user.id,
      status: "active",
    });

    if (!allocation) {
      return errorResponse("No active allocation found", 404);
    }

    // Validate notice period
    const vacateDate = new Date(expectedVacateDate);
    const today = new Date();
    const daysDifference = Math.ceil(
      (vacateDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDifference < allocation.noticePeriodDays) {
      return errorResponse(
        `Minimum notice period is ${allocation.noticePeriodDays} days.`
      );
    }

    session.startTransaction();

    // Update allocation
    allocation.status = "notice_period";
    allocation.noticeGivenDate = today;
    allocation.expectedVacateDate = vacateDate;
    allocation.vacationReason = reason || "";
    allocation.lastModifiedBy = new mongoose.Types.ObjectId(user.id);

    await allocation.save({ session });

    // Update room bed
    const room = await Room.findById(allocation.roomId).session(session);
    if (room) {
      const bedIndex = room.beds.findIndex(
        (b: any) => b.bedNumber === allocation.bedNumber
      );
      if (bedIndex !== -1) {
        room.beds[bedIndex].noticeGiven = true;
        room.beds[bedIndex].noticeDate = today;
        room.beds[bedIndex].expectedVacateDate = vacateDate;
        await room.save({ session });
      }
    }

    // Notify owner
    const listing = await Listing.findById(allocation.listingId).session(session);
    if (listing) {
      await Notification.create([{
        userId: listing.ownerId,
        type: "general",
        title: "Notice Period Started",
        message: `Tenant in Room ${allocation.roomNumber}, Bed ${allocation.bedNumber} at ${allocation.pgName} has given notice. Expected vacate date: ${vacateDate.toLocaleDateString()}.`,
        relatedId: allocation._id,
        relatedType: "allocation",
        priority: "high",
        metadata: {
          roomNumber: allocation.roomNumber,
          bedNumber: allocation.bedNumber,
          vacateDate,
          reason: reason || "",
        },
      }], { session });
    }

    await session.commitTransaction();

    return jsonResponse({
      success: true,
      message: "Notice period recorded successfully",
      data: {
        noticeGivenDate: today,
        expectedVacateDate: vacateDate,
        noticePeriodDays: allocation.noticePeriodDays,
        securityDepositRefund: allocation.securityDeposit,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Give notice error:", error);
    return errorResponse("Internal server error", 500);
  } finally {
    session.endSession();
  }
}

/**
 * PUT - Cancel notice (if within allowed period)
 */
export async function PUT(req: NextRequest) {
  const session = await mongoose.startSession();

  try {
    await connectToDB();
    const user = await authUser();

    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    // Get allocation in notice period
    const allocation = await TenantAllocation.findOne({
      tenantId: user.id,
      status: "notice_period",
    });

    if (!allocation) {
      return errorResponse("No notice period to cancel", 404);
    }

    // Check if cancellation is allowed (within 48 hours)
    const noticeDate = new Date(allocation.noticeGivenDate!);
    const hoursSinceNotice =
      (Date.now() - noticeDate.getTime()) / (1000 * 60 * 60);

    if (hoursSinceNotice > 48) {
      return errorResponse(
        "Notice can only be cancelled within 48 hours of submission"
      );
    }

    session.startTransaction();

    // Reset allocation
    allocation.status = "active";
    allocation.noticeGivenDate = null;
    allocation.expectedVacateDate = null;
    allocation.vacationReason = "";
    allocation.lastModifiedBy = new mongoose.Types.ObjectId(user.id);

    await allocation.save({ session });

    // Reset room bed
    const room = await Room.findById(allocation.roomId).session(session);
    if (room) {
      const bedIndex = room.beds.findIndex(
        (b: any) => b.bedNumber === allocation.bedNumber
      );
      if (bedIndex !== -1) {
        room.beds[bedIndex].noticeGiven = false;
        room.beds[bedIndex].noticeDate = null;
        room.beds[bedIndex].expectedVacateDate = null;
        await room.save({ session });
      }
    }

    // Notify owner
    const listing = await Listing.findById(allocation.listingId).session(session);
    if (listing) {
      await Notification.create([{
        userId: listing.ownerId,
        type: "general",
        title: "Notice Cancelled",
        message: `Tenant in Room ${allocation.roomNumber}, Bed ${allocation.bedNumber} at ${allocation.pgName} has cancelled their notice.`,
        relatedId: allocation._id,
        relatedType: "allocation",
        priority: "medium",
      }], { session });
    }

    await session.commitTransaction();

    return jsonResponse({
      success: true,
      message: "Notice cancelled successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Cancel notice error:", error);
    return errorResponse("Internal server error", 500);
  } finally {
    session.endSession();
  }
}