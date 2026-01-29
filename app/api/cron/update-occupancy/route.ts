import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import Room from "@/models/room";
import TenantAllocation from "@/models/tenantAllocation";
import Listing from "@/models/listing";
import Notification from "@/models/notification";

// This cron job runs daily to:
// 1. Auto-mark overdue rents
// 2. Update occupancy status for upcoming vacancies
// 3. Send vacancy alerts to owners
// 4. Process auto move-outs for completed allocations

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret (for Vercel Cron or similar)
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDB();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const results = {
      overdueRentsMarked: 0,
      vacancyAlertsGenerated: 0,
      allocationsProcessed: 0,
      roomsUpdated: 0,
    };

    // 1. Mark overdue rents
    const allocationsWithRent = await TenantAllocation.find({
      status: { $in: ["active", "notice_period"] },
      "rentHistory.status": "pending",
    });

    for (const allocation of allocationsWithRent) {
      let updated = false;
      allocation.rentHistory.forEach((rent: any) => {
        if (rent.status === "pending" && new Date(rent.dueDate) < today) {
          rent.status = "overdue";
          // Calculate late fee (e.g., 2% per day, max 10%)
          const daysLate = Math.floor(
            (today.getTime() - new Date(rent.dueDate).getTime()) / (1000 * 60 * 60 * 24)
          );
          rent.lateFee = Math.min(rent.amount * 0.02 * daysLate, rent.amount * 0.1);
          updated = true;
          results.overdueRentsMarked++;
        }
      });

      if (updated) {
        await allocation.save();

        // Send notification to tenant
        await Notification.create({
          userId: allocation.tenantId,
          type: "rent_overdue",
          title: "Rent Payment Overdue",
          message: `Your rent payment for ${allocation.pgName}, Room ${allocation.roomNumber} is overdue. Please pay immediately to avoid additional late fees.`,
          relatedId: allocation._id,
          relatedType: "allocation",
          priority: "high",
        });
      }
    }

    // 2. Generate vacancy alerts (7 days before expected vacate)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const upcomingVacancies = await TenantAllocation.find({
      status: "notice_period",
      expectedVacateDate: {
        $gte: today,
        $lte: sevenDaysFromNow,
      },
    }).populate("listingId", "ownerId pgName");

    for (const allocation of upcomingVacancies) {
      const listing = allocation.listingId as any;
      
      // Check if we already sent a notification today
      const existingNotification = await Notification.findOne({
        userId: listing.ownerId,
        type: "upcoming_vacancy",
        "metadata.allocationId": allocation._id.toString(),
        createdAt: { $gte: today },
      });

      if (!existingNotification) {
        await Notification.create({
          userId: listing.ownerId,
          type: "upcoming_vacancy",
          title: "Upcoming Vacancy Alert",
          message: `Room ${allocation.roomNumber}, Bed ${allocation.bedNumber} at ${allocation.pgName} will be vacant on ${new Date(allocation.expectedVacateDate!).toLocaleDateString()}.`,
          relatedId: allocation._id,
          relatedType: "allocation",
          priority: "medium",
          metadata: {
            allocationId: allocation._id.toString(),
            roomNumber: allocation.roomNumber,
            bedNumber: allocation.bedNumber,
            vacateDate: allocation.expectedVacateDate,
          },
        });
        results.vacancyAlertsGenerated++;
      }
    }

    // 3. Process completed allocations (auto move-out for expired allocations)
    const expiredAllocations = await TenantAllocation.find({
      status: { $in: ["active", "notice_period"] },
      expectedMoveOutDate: { $lt: today },
    });

    for (const allocation of expiredAllocations) {
      // Update room bed status
      const room = await Room.findById(allocation.roomId);
      if (room) {
        const bedIndex = room.beds.findIndex(
          (b: any) => b.bedNumber === allocation.bedNumber
        );
        if (bedIndex !== -1 && room.beds[bedIndex].status === "occupied") {
          room.beds[bedIndex].status = "available";
          room.beds[bedIndex].currentTenantId = null;
          room.beds[bedIndex].currentAllocationId = null;
          room.beds[bedIndex].occupiedFrom = null;
          room.beds[bedIndex].expectedVacateDate = null;
          room.beds[bedIndex].noticeGiven = false;
          room.beds[bedIndex].noticeDate = null;
          await room.save();
          results.roomsUpdated++;
        }
      }

      // Update allocation status
      allocation.status = "vacated";
      allocation.actualMoveOutDate = allocation.expectedMoveOutDate;
      await allocation.save();
      results.allocationsProcessed++;

      // Notify owner
      const listing = await Listing.findById(allocation.listingId);
      if (listing) {
        await Notification.create({
          userId: listing.ownerId,
          type: "auto_checkout",
          title: "Tenant Auto Checkout",
          message: `Tenant has been automatically checked out from Room ${allocation.roomNumber}, Bed ${allocation.bedNumber} at ${allocation.pgName} as the lease period has ended.`,
          relatedId: allocation._id,
          relatedType: "allocation",
          priority: "medium",
        });
      }
    }

    // 4. Update listing availability counts
    const listings = await Listing.find({});
    for (const listing of listings) {
      await updateListingAvailability(listing._id.toString());
    }

    return NextResponse.json({
      success: true,
      message: "Occupancy update cron completed",
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Occupancy update cron error:", error);
    return NextResponse.json(
      { success: false, message: "Cron job failed" },
      { status: 500 }
    );
  }
}

async function updateListingAvailability(listingId: string) {
  const rooms = await Room.find({ listingId });

  const roomTypeAvailability: Record<string, number> = {};

  rooms.forEach((room) => {
    if (!roomTypeAvailability[room.roomType]) {
      roomTypeAvailability[room.roomType] = 0;
    }
    roomTypeAvailability[room.roomType] += room.availableBeds;
  });

  const listing = await Listing.findById(listingId);
  if (listing) {
    listing.roomTypes = listing.roomTypes.map((rt: any) => {
      const roomsWithAvailability = rooms.filter(
        (r) => r.roomType === rt.type && r.availableBeds > 0
      ).length;
      rt.availableRooms = roomsWithAvailability;
      return rt;
    });
    await listing.save();
  }
}