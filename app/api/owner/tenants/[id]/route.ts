// app/api/owner/tenants/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import TenantAllocation from "@/models/tenantAllocation";
import Booking from "@/models/booking";
import Listing from "@/models/listing";
import Room from "@/models/room";
import Notification from "@/models/notification";
import { authUser } from "@/actions/authUser";

// GET - Get single tenant details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();
    const user = await authUser();
    const { id } = await params;

    if (!user || (user.role !== "owner" && user.role !== "admin")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const allocation = await TenantAllocation.findById(id)
      .populate("tenantId", "fullName email phone createdAt")
      .populate("listingId", "pgName location ownerId")
      .populate("bookingId", "aadhaarNumber address phoneNumber email fullName moveInDate duration amount securityDeposit couponCode discountAmount additionalRequirements");

    if (!allocation) {
      return NextResponse.json(
        { success: false, message: "Tenant allocation not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    const listing = allocation.listingId as any;
    if (listing.ownerId.toString() !== user.id && user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 }
      );
    }

    // Get room details
    const room = await Room.findById(allocation.roomId);

    return NextResponse.json({
      success: true,
      data: {
        allocation,
        room: room
          ? {
              roomNumber: room.roomNumber,
              roomType: room.roomType,
              floor: room.floor,
              isAC: room.isAC,
              hasAttachedBathroom: room.hasAttachedBathroom,
              amenities: room.amenities,
              monthlyRent: room.monthlyRent,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Get tenant details error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update tenant (record notice, extend stay, add notes)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();
    const user = await authUser();
    const { id } = await params;

    if (!user || (user.role !== "owner" && user.role !== "admin")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { action, data } = await req.json();

    const allocation = await TenantAllocation.findById(id).populate(
      "listingId",
      "ownerId pgName"
    );

    if (!allocation) {
      return NextResponse.json(
        { success: false, message: "Allocation not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    const listing = allocation.listingId as any;
    if (listing.ownerId.toString() !== user.id && user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 }
      );
    }

    switch (action) {
      case "record_notice":
        // Tenant has given notice to vacate
        const noticeDays = data.noticePeriodDays || 30;
        const expectedVacateDate = new Date();
        expectedVacateDate.setDate(expectedVacateDate.getDate() + noticeDays);

        allocation.status = "notice_period";
        allocation.noticeGivenDate = new Date();
        allocation.expectedVacateDate = expectedVacateDate;
        allocation.ownerNotes = data.notes || allocation.ownerNotes;

        // Update bed status
        const room = await Room.findById(allocation.roomId);
        if (room) {
          const bed = room.beds.find(
            (b: any) => b.bedNumber === allocation.bedNumber
          );
          if (bed) {
            bed.noticeGiven = true;
            bed.noticeDate = new Date();
            bed.expectedVacateDate = expectedVacateDate;
          }
          await room.save();
        }

        // Notify tenant
        await Notification.create({
          userId: allocation.tenantId,
          type: "notice_period_recorded",
          title: "Notice Period Recorded",
          message: `Your notice to vacate ${listing.pgName} has been recorded. Expected move-out date: ${expectedVacateDate.toLocaleDateString("en-IN")}`,
          relatedId: allocation._id,
          relatedType: "allocation",
          priority: "high",
        });

        break;

      case "extend_stay":
        // Extend tenant's stay
        const extensionMonths = data.months || 1;
        const previousEndDate = new Date(allocation.expectedMoveOutDate);
        const newEndDate = new Date(previousEndDate);
        newEndDate.setMonth(newEndDate.getMonth() + extensionMonths);

        allocation.expectedMoveOutDate = newEndDate;
        allocation.status = "active"; // Reset from notice_period if applicable
        allocation.noticeGivenDate = null;
        allocation.expectedVacateDate = null;

        // Add to extensions history
        allocation.extensions.push({
          previousEndDate,
          newEndDate,
          extendedAt: new Date(),
          months: extensionMonths,
        });

        // Update bed status
        const roomForExtend = await Room.findById(allocation.roomId);
        if (roomForExtend) {
          const bed = roomForExtend.beds.find(
            (b: any) => b.bedNumber === allocation.bedNumber
          );
          if (bed) {
            bed.noticeGiven = false;
            bed.noticeDate = null;
            bed.expectedVacateDate = null;
          }
          await roomForExtend.save();
        }

        // Notify tenant
        await Notification.create({
          userId: allocation.tenantId,
          type: "general",
          title: "Stay Extended",
          message: `Your stay at ${listing.pgName} has been extended by ${extensionMonths} month(s). New end date: ${newEndDate.toLocaleDateString("en-IN")}`,
          relatedId: allocation._id,
          relatedType: "allocation",
          priority: "medium",
        });

        break;

      case "update_notes":
        allocation.ownerNotes = data.notes;
        break;

      case "process_move_out":
        // Process tenant move out
        allocation.status = "vacated";
        allocation.actualMoveOutDate = new Date();

        // Calculate refund
        const refundAmount = data.refundAmount || allocation.securityDeposit;
        allocation.securityDepositRefunded = true;
        allocation.refundAmount = refundAmount;

        // Update room/bed status
        const roomForMoveOut = await Room.findById(allocation.roomId);
        if (roomForMoveOut) {
          const bedIndex = roomForMoveOut.beds.findIndex(
            (b: any) => b.bedNumber === allocation.bedNumber
          );
          if (bedIndex !== -1) {
            roomForMoveOut.beds[bedIndex].status = "available";
            roomForMoveOut.beds[bedIndex].currentTenantId = null;
            roomForMoveOut.beds[bedIndex].currentAllocationId = null;
            roomForMoveOut.beds[bedIndex].occupiedFrom = null;
            roomForMoveOut.beds[bedIndex].expectedVacateDate = null;
            roomForMoveOut.beds[bedIndex].noticeGiven = false;
            roomForMoveOut.beds[bedIndex].noticeDate = null;
          }
          await roomForMoveOut.save();
        }

        // Notify tenant
        await Notification.create({
          userId: allocation.tenantId,
          type: "move_out_processed",
          title: "Move-out Processed",
          message: `Your move-out from ${listing.pgName} has been processed. Security deposit refund: ₹${refundAmount.toLocaleString()}`,
          relatedId: allocation._id,
          relatedType: "allocation",
          priority: "high",
        });

        break;

      default:
        return NextResponse.json(
          { success: false, message: "Invalid action" },
          { status: 400 }
        );
    }

    await allocation.save();

    return NextResponse.json({
      success: true,
      message: `Action '${action}' completed successfully`,
      data: allocation,
    });
  } catch (error) {
    console.error("Update tenant error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}