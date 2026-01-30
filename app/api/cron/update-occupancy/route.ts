import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDB } from "@/services/connectdb";
import Listing from "@/models/listing";
import Room from "@/models/room";
import TenantAllocation from "@/models/tenantAllocation";
import Commission from "@/models/commission";
import {
  createNotification,
  createBatchNotifications,
  NotificationTemplates,
} from "@/lib/utils/notificationHelper";
import { updateListingAvailability } from "@/lib/utils/roomUtils";

interface CronResults {
  listingsUpdated: number;
  roomsChecked: number;
  rentEntriesCreated: number;
  overdueRentsMarked: number;
  overdueCommissionsMarked: number;
  upcomingVacanciesNotified: number;
  rentRemindersSet: number;
  errors: string[];
}

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

    const results: CronResults = {
      listingsUpdated: 0,
      roomsChecked: 0,
      rentEntriesCreated: 0,
      overdueRentsMarked: 0,
      overdueCommissionsMarked: 0,
      upcomingVacanciesNotified: 0,
      rentRemindersSet: 0,
      errors: [],
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      // 1. Update listing room availability counts
      const listings = await Listing.find({ isActive: true })
        .select("_id")
        .session(session);

      for (const listing of listings) {
        try {
          await updateListingAvailability(listing._id.toString(), session);
          results.listingsUpdated++;
        } catch (error) {
          results.errors.push(
            `Failed to update listing ${listing._id}: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      }

      // 2. Process active allocations - create rent entries and mark overdue
      const activeAllocations = await TenantAllocation.find({
        status: { $in: ["active", "notice_period"] },
      }).session(session);

      const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const notificationsToCreate: any[] = [];

      for (const allocation of activeAllocations) {
        try {
          // Check if rent entry exists for current month
          const hasCurrentMonthRent = allocation.rentHistory.some((r: any) => {
            const rentMonth = new Date(r.month);
            return (
              rentMonth.getMonth() === currentMonth.getMonth() &&
              rentMonth.getFullYear() === currentMonth.getFullYear()
            );
          });

          if (!hasCurrentMonthRent) {
            // Create rent entry for current month
            const moveInDay = new Date(allocation.moveInDate).getDate();
            const dueDate = new Date(
              today.getFullYear(),
              today.getMonth(),
              Math.min(moveInDay, 28) // Cap at 28 for February
            );

            const isOverdue = dueDate < today;
            const lateFee = isOverdue
              ? Math.round(allocation.monthlyRent * 0.05)
              : 0;

            // ✅ FIX: Add _id when pushing to rentHistory
            allocation.rentHistory.push({
              _id: new mongoose.Types.ObjectId(),
              month: currentMonth,
              amount: allocation.monthlyRent,
              status: isOverdue ? "overdue" : "pending",
              paidAmount: 0,
              paidAt: null,
              dueDate,
              lateFee,
              waivedAmount: 0,
              paymentMethod: "",
              transactionId: "",
              receiptUrl: "",
              notes: "",
            });

            results.rentEntriesCreated++;

            if (isOverdue) {
              results.overdueRentsMarked++;

              // Queue overdue notification
              const notif = NotificationTemplates.rentOverdue(
                allocation.pgName,
                allocation.monthlyRent,
                lateFee
              );

              notificationsToCreate.push({
                userId: allocation.tenantId,
                type: notif.type,
                title: notif.title,
                message: notif.message,
                relatedId: allocation._id,
                relatedType: "allocation",
                priority: "high",
                metadata: {
                  month: currentMonth,
                  amount: allocation.monthlyRent,
                  lateFee,
                },
              });
            }
          }

          // Mark existing pending rents as overdue if past due date
          let hasUpdates = false;
          for (const rent of allocation.rentHistory) {
            if (rent.status === "pending" && new Date(rent.dueDate) < today) {
              rent.status = "overdue";
              if (!rent.lateFee) {
                rent.lateFee = Math.round(rent.amount * 0.05);
              }
              hasUpdates = true;
              results.overdueRentsMarked++;

              // Queue overdue notification
              const notif = NotificationTemplates.rentOverdue(
                allocation.pgName,
                rent.amount,
                rent.lateFee
              );

              notificationsToCreate.push({
                userId: allocation.tenantId,
                type: notif.type,
                title: notif.title,
                message: notif.message,
                relatedId: allocation._id,
                relatedType: "allocation",
                priority: "high",
                metadata: {
                  month: rent.month,
                  amount: rent.amount,
                  lateFee: rent.lateFee,
                },
              });
            }

            // Send reminder 3 days before due date
            const threeDaysBeforeDue = new Date(rent.dueDate);
            threeDaysBeforeDue.setDate(threeDaysBeforeDue.getDate() - 3);

            if (
              rent.status === "pending" &&
              today.toDateString() === threeDaysBeforeDue.toDateString()
            ) {
              const notif = NotificationTemplates.rentReminder(
                allocation.pgName,
                rent.amount,
                rent.dueDate
              );

              notificationsToCreate.push({
                userId: allocation.tenantId,
                type: notif.type,
                title: notif.title,
                message: notif.message,
                relatedId: allocation._id,
                relatedType: "allocation",
                priority: "medium",
                metadata: {
                  month: rent.month,
                  amount: rent.amount,
                  dueDate: rent.dueDate,
                },
              });

              results.rentRemindersSet++;
            }
          }

          if (hasUpdates || !hasCurrentMonthRent) {
            await allocation.save({ session });
          }
        } catch (error) {
          results.errors.push(
            `Failed to process allocation ${allocation._id}: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      }

      results.roomsChecked = activeAllocations.length;

      // 3. Mark overdue commissions
      try {
        const pendingCommissions = await Commission.find({
          status: "pending",
          dueDate: { $lt: today },
        }).session(session);

        for (const commission of pendingCommissions) {
          commission.status = "overdue";
          await commission.save({ session });
          results.overdueCommissionsMarked++;
        }
      } catch (error) {
        results.errors.push(
          `Failed to process commissions: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }

      // 4. Notify owners about upcoming vacancies (7 days before)
      const sevenDaysFromNow = new Date(today);
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      try {
        const upcomingVacancies = await TenantAllocation.find({
          status: "notice_period",
          expectedVacateDate: {
            $gte: today,
            $lte: sevenDaysFromNow,
          },
        })
          .populate("listingId", "ownerId pgName")
          .session(session);

        for (const vacancy of upcomingVacancies) {
          const listing = vacancy.listingId as any;
          const vacateDate = new Date(vacancy.expectedVacateDate!);
          const daysUntilVacate = Math.ceil(
            (vacateDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );

          const notif = NotificationTemplates.upcomingVacancy(
            listing.pgName,
            vacancy.roomNumber,
            vacancy.bedNumber,
            daysUntilVacate
          );

          notificationsToCreate.push({
            userId: listing.ownerId,
            type: notif.type,
            title: notif.title,
            message: notif.message,
            relatedId: vacancy._id,
            relatedType: "allocation",
            priority: daysUntilVacate <= 3 ? "high" : "medium",
            metadata: {
              allocationId: vacancy._id.toString(),
              expectedVacateDate: vacancy.expectedVacateDate,
              roomNumber: vacancy.roomNumber,
              bedNumber: vacancy.bedNumber,
            },
          });

          results.upcomingVacanciesNotified++;
        }
      } catch (error) {
        results.errors.push(
          `Failed to process vacancies: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }

      // 5. Create all notifications in batch
      if (notificationsToCreate.length > 0) {
        try {
          await createBatchNotifications(notificationsToCreate, session);
        } catch (error) {
          results.errors.push(
            `Failed to create notifications: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      }

      await session.commitTransaction();

      return NextResponse.json({
        success: true,
        message: "Occupancy update completed",
        results,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
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

export async function POST(req: NextRequest) {
  return GET(req);
}