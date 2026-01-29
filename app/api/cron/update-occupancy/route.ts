// app/api/cron/update-occupancy/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import Listing from "@/models/listing";
import Room from "@/models/room";
import TenantAllocation from "@/models/tenantAllocation";
import Commission from "@/models/commission";
import Notification from "@/models/notification";
import User from "@/models/user";

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectToDB();

    const results = {
      listingsUpdated: 0,
      roomsUpdated: 0,
      rentEntriesCreated: 0,
      overdueRentsMarked: 0,
      overdueCommissionsMarked: 0,
      upcomingVacanciesNotified: 0,
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Update room occupancy status
    const rooms = await Room.find({});
    for (const room of rooms) {
      let hasChanges = false;

      // Update bed statuses based on expected vacate dates
      for (const bed of room.beds) {
        if (
          bed.expectedVacateDate &&
          new Date(bed.expectedVacateDate) < today &&
          bed.status === "occupied"
        ) {
          // Tenant should have vacated - mark as available if move-out not processed
          // Note: In production, you might want to send a reminder instead of auto-vacating
          bed.status = "available";
          bed.currentTenantId = null;
          bed.currentAllocationId = null;
          bed.occupiedFrom = null;
          bed.expectedVacateDate = null;
          bed.noticeGiven = false;
          bed.noticeDate = null;
          hasChanges = true;
        }
      }

      if (hasChanges) {
        await room.save();
        results.roomsUpdated++;
      }
    }

    // 2. Update listing room availability counts
    const listings = await Listing.find({ isActive: true });
    for (const listing of listings) {
      const listingRooms = await Room.find({ listingId: listing._id });

      // Update roomTypes with actual availability
      for (const roomType of listing.roomTypes) {
        const matchingRooms = listingRooms.filter(
          (r: any) => r.roomType === roomType.type
        );

        const totalBeds = matchingRooms.reduce(
          (acc: number, r: any) => acc + r.capacity,
          0
        );
        const availableBeds = matchingRooms.reduce(
          (acc: number, r: any) => acc + r.availableBeds,
          0
        );

        // Update available rooms count (rooms with at least one available bed)
        roomType.availableRooms = matchingRooms.filter(
          (r: any) => r.availableBeds > 0
        ).length;
      }

      await listing.save();
      results.listingsUpdated++;
    }

    // 3. Create monthly rent entries for active allocations
    const activeAllocations = await TenantAllocation.find({
      status: { $in: ["active", "notice_period"] },
    });

    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    for (const allocation of activeAllocations) {
      // Check if rent entry exists for current month
      const hasCurrentMonthRent = allocation.rentHistory.some((r: any) => {
        const rentMonth = new Date(r.month);
        return (
          rentMonth.getMonth() === currentMonth.getMonth() &&
          rentMonth.getFullYear() === currentMonth.getFullYear()
        );
      });

      if (!hasCurrentMonthRent) {
        // Get move-in date day for due date calculation
        const moveInDay = new Date(allocation.moveInDate).getDate();
        const dueDate = new Date(
          today.getFullYear(),
          today.getMonth(),
          moveInDay
        );

        // If due date has passed, add late fee
        const isOverdue = dueDate < today;
        const lateFee = isOverdue ? Math.round(allocation.monthlyRent * 0.05) : 0; // 5% late fee

        allocation.rentHistory.push({
          month: currentMonth,
          amount: allocation.monthlyRent,
          status: isOverdue ? "overdue" : "pending",
          paidAmount: 0,
          paidAt: null,
          dueDate,
          lateFee,
          paymentMethod: "",
          transactionId: "",
        });

        await allocation.save();
        results.rentEntriesCreated++;

        if (isOverdue) {
          results.overdueRentsMarked++;
        }
      }

      // 4. Mark existing pending rents as overdue if past due date
      let hasUpdates = false;
      for (const rent of allocation.rentHistory) {
        if (rent.status === "pending" && new Date(rent.dueDate) < today) {
          rent.status = "overdue";
          if (!rent.lateFee) {
            rent.lateFee = Math.round(rent.amount * 0.05);
          }
          hasUpdates = true;
          results.overdueRentsMarked++;
        }
      }
      if (hasUpdates) {
        await allocation.save();
      }
    }

    // 5. Mark overdue commissions
    const pendingCommissions = await Commission.find({
      status: "pending",
      dueDate: { $lt: today },
    });

    for (const commission of pendingCommissions) {
      commission.status = "overdue";
      await commission.save();
      results.overdueCommissionsMarked++;
    }

    // 6. Notify owners about upcoming vacancies (7 days before)
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const upcomingVacancies = await TenantAllocation.find({
      status: "notice_period",
      expectedVacateDate: {
        $gte: today,
        $lte: sevenDaysFromNow,
      },
    }).populate("listingId", "ownerId pgName");

    for (const vacancy of upcomingVacancies) {
      const listing = vacancy.listingId as any;

      // Check if notification already sent today
      const existingNotification = await Notification.findOne({
        userId: listing.ownerId,
        type: "general",
        "metadata.allocationId": vacancy._id.toString(),
        createdAt: { $gte: today },
      });

      if (!existingNotification) {
        const daysUntilVacate = Math.ceil(
          (new Date(vacancy.expectedVacateDate!).getTime() - today.getTime()) /
            (1000 * 60 * 60 * 24)
        );

        await Notification.create({
          userId: listing.ownerId,
          type: "general",
          title: `Upcoming Vacancy - ${daysUntilVacate} days`,
          message: `${vacancy.roomNumber}, Bed ${vacancy.bedNumber} at ${listing.pgName} will be vacant in ${daysUntilVacate} days. Consider listing it for new tenants.`,
          relatedId: vacancy._id,
          relatedType: "allocation",
          priority: daysUntilVacate <= 3 ? "high" : "medium",
          metadata: {
            allocationId: vacancy._id.toString(),
            expectedVacateDate: vacancy.expectedVacateDate,
          },
        });

        results.upcomingVacanciesNotified++;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Occupancy update completed",
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Update occupancy cron error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update occupancy",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}