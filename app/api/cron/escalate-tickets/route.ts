// app/api/cron/escalate-tickets/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import mongoose from "mongoose";
import SupportTicket from "@/models/supportTicket";
import Notification from "@/models/notification";
import User from "@/models/user";
import { sendTicketEmail } from "@/services/sendTicketEmail";

// Configuration
const ESCALATION_DAYS = 3;

// Define interfaces for the data we work with
interface AdminUser {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
}

interface TicketUser {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
}

interface TicketOwner {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
}

interface TicketListing {
  _id: mongoose.Types.ObjectId;
  pgName: string;
  ownerId?: TicketOwner;
}

interface TicketComment {
  userId: mongoose.Types.ObjectId;
  userRole: string;
  userName: string;
  message: string;
  createdAt: Date;
  isSystem?: boolean;
}

interface TicketDocument {
  _id: mongoose.Types.ObjectId;
  ticketNumber: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  createdAt: Date;
  isEscalated: boolean;
  escalatedAt?: Date;
  escalationReason?: string;
  assignedTo?: mongoose.Types.ObjectId;
  assignedToRole?: string;
  userId: TicketUser;
  listingId?: TicketListing;
  comments: TicketComment[];
  save: () => Promise<TicketDocument>;
}

/**
 * GET - Automatic ticket escalation (called by cron job)
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify cron secret
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.warn("Unauthorized cron attempt detected");
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectToDB();

    const now = new Date();
    const escalationThreshold = new Date(
      now.getTime() - ESCALATION_DAYS * 24 * 60 * 60 * 1000
    );

    // Find tickets eligible for escalation
    const ticketsToEscalate = (await SupportTicket.find({
      createdAt: { $lte: escalationThreshold },
      status: { $nin: ["resolved", "closed"] },
      isEscalated: { $ne: true },
      $or: [
        { assignedToRole: "owner" },
        { assignedToRole: { $exists: false } },
        { assignedToRole: null },
      ],
    })
      .populate({
        path: "userId",
        select: "fullName email",
      })
      .populate({
        path: "listingId",
        select: "pgName ownerId",
        populate: {
          path: "ownerId",
          select: "fullName email",
        },
      })
      .limit(100)) as unknown as TicketDocument[];

    if (ticketsToEscalate.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No tickets to escalate",
        escalatedCount: 0,
        executionTime: `${Date.now() - startTime}ms`,
      });
    }

    // Get active admin users
    const admins = (await User.find({
      role: "admin",
      isActive: true,
    }).select("_id fullName email")) as AdminUser[];

    if (admins.length === 0) {
      console.error("CRITICAL: No active admins found for ticket escalation");
      return NextResponse.json({
        success: false,
        message: "No active admins available for escalation",
      });
    }

    const results = {
      escalated: [] as string[],
      failed: [] as { ticketNumber: string; error: string }[],
      emailsFailed: [] as string[],
    };

    // Process tickets
    for (let i = 0; i < ticketsToEscalate.length; i++) {
      const ticket = ticketsToEscalate[i];

      try {
        // Round-robin admin assignment
        const adminIndex = i % admins.length;
        const assignedAdmin = admins[adminIndex];

        const daysElapsed = Math.floor(
          (now.getTime() - new Date(ticket.createdAt).getTime()) /
            (1000 * 60 * 60 * 24)
        );

        // Update ticket in database
        const updatedTicket = await SupportTicket.findByIdAndUpdate(
          ticket._id,
          {
            $set: {
              isEscalated: true,
              escalatedAt: now,
              escalationReason: `Automatically escalated: No resolution within ${ESCALATION_DAYS} days (${daysElapsed} days elapsed)`,
              assignedTo: assignedAdmin._id,
              assignedToRole: "admin",
              status: ticket.status === "open" ? "in_progress" : ticket.status,
            },
            $push: {
              comments: {
                userId: assignedAdmin._id,
                userRole: "admin",
                userName: "System",
                message: `⚠️ This ticket has been automatically escalated to admin support due to no resolution within ${ESCALATION_DAYS} days. Admin ${assignedAdmin.fullName} has been assigned.`,
                createdAt: now,
                isSystem: true,
              },
            },
          },
          { new: true }
        );

        if (!updatedTicket) {
          throw new Error("Failed to update ticket");
        }

        // Extract data for notifications
        const user = ticket.userId;
        const listing = ticket.listingId;
        const owner = listing?.ownerId;

        // Create notifications
        await createEscalationNotifications({
          ticketId: ticket._id,
          ticketNumber: ticket.ticketNumber,
          priority: ticket.priority,
          pgName: listing?.pgName,
          assignedAdmin,
          user,
          owner: owner || null,
        });

        // Send emails (non-blocking)
        sendEscalationEmails({
          ticket,
          assignedAdmin,
          user,
          owner: owner || null,
          listing: listing || null,
          daysElapsed,
        }).catch((err) => {
          console.error(
            `Email failed for ticket ${ticket.ticketNumber}:`,
            err
          );
          results.emailsFailed.push(ticket.ticketNumber);
        });

        results.escalated.push(ticket.ticketNumber);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error(
          `Failed to escalate ticket ${ticket.ticketNumber}:`,
          error
        );
        results.failed.push({
          ticketNumber: ticket.ticketNumber,
          error: errorMessage,
        });
      }
    }

    // Log results
    console.log(`Ticket Escalation Complete:`, {
      total: ticketsToEscalate.length,
      escalated: results.escalated.length,
      failed: results.failed.length,
      executionTime: `${Date.now() - startTime}ms`,
    });

    return NextResponse.json({
      success: true,
      message: `Escalated ${results.escalated.length} of ${ticketsToEscalate.length} tickets`,
      data: {
        escalatedCount: results.escalated.length,
        failedCount: results.failed.length,
        escalatedTickets: results.escalated,
        failedTickets: results.failed.length > 0 ? results.failed : undefined,
        emailsFailedCount: results.emailsFailed.length,
      },
      executionTime: `${Date.now() - startTime}ms`,
    });
  } catch (error) {
    console.error("Ticket escalation cron error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        executionTime: `${Date.now() - startTime}ms`,
      },
      { status: 500 }
    );
  }
}

/**
 * POST Handler - Polymorphic Route Detector
 * Handles both manual form body requests and fallback automated POST crons cleanly.
 */
export async function POST(req: NextRequest) {
  try {
    // Clone the request stream so we can safely read the body without consuming it
    const cloneReq = req.clone();
    const body = await cloneReq.json().catch(() => null);

    // If payload details match a manual dashboard action, trigger internal logic
    if (body && (body.ticketId || body.adminId)) {
      return handleManualEscalation(req, body);
    }
  } catch (e) {
    // Fail-safe wrapper for empty/non-JSON requests
  }

  // If there is no specific dashboard layout structure, evaluate as automated cron request
  return GET(req);
}

/**
 * Isolated logic block for processing manual target ticket escalations
 */
async function handleManualEscalation(req: NextRequest, body: any) {
  try {
    await connectToDB();

    const { ticketId, adminId, reason } = body;

    // Validate required fields
    if (!ticketId || !adminId) {
      return NextResponse.json(
        { success: false, message: "Ticket ID and Admin ID are required" },
        { status: 400 }
      );
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      return NextResponse.json(
        { success: false, message: "Invalid ticket ID format" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      return NextResponse.json(
        { success: false, message: "Invalid admin ID format" },
        { status: 400 }
      );
    }

    // Find ticket with populated fields
    const ticket = (await SupportTicket.findById(ticketId)
      .populate({
        path: "userId",
        select: "fullName email",
      })
      .populate({
        path: "listingId",
        select: "pgName ownerId",
        populate: {
          path: "ownerId",
          select: "fullName email",
        },
      })) as TicketDocument | null;

    if (!ticket) {
      return NextResponse.json(
        { success: false, message: "Ticket not found" },
        { status: 404 }
      );
    }

    if (ticket.isEscalated) {
      return NextResponse.json(
        { success: false, message: "Ticket is already escalated" },
        { status: 400 }
      );
    }

    if (["resolved", "closed"].includes(ticket.status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Cannot escalate a resolved or closed ticket",
        },
        { status: 400 }
      );
    }

    // Find admin
    const admin = (await User.findOne({
      _id: adminId,
      role: "admin",
      isActive: true,
    }).select("_id fullName email")) as AdminUser | null;

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Admin not found or inactive" },
        { status: 404 }
      );
    }

    const now = new Date();
    const escalationReason = reason || "Manually escalated by owner/support";

    // Update ticket
    ticket.isEscalated = true;
    ticket.escalatedAt = now;
    ticket.escalationReason = escalationReason;
    ticket.assignedTo = new mongoose.Types.ObjectId(adminId);
    ticket.assignedToRole = "admin";

    if (ticket.status === "open") {
      ticket.status = "in_progress";
    }

    ticket.comments.push({
      userId: new mongoose.Types.ObjectId(adminId),
      userRole: "admin",
      userName: "System",
      message: `⚠️ This ticket has been manually escalated. Reason: ${escalationReason}`,
      createdAt: now,
    });

    await ticket.save();

    // Get populated data for notifications
    const user = ticket.userId;
    const listing = ticket.listingId;
    const owner = listing?.ownerId || null;

    // Create notifications
    await createEscalationNotifications({
      ticketId: ticket._id,
      ticketNumber: ticket.ticketNumber,
      priority: ticket.priority,
      pgName: listing?.pgName,
      assignedAdmin: admin,
      user,
      owner,
      isManual: true,
    });

    // Send emails
    const daysElapsed = Math.floor(
      (now.getTime() - new Date(ticket.createdAt).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    await sendEscalationEmails({
      ticket,
      assignedAdmin: admin,
      user,
      owner,
      listing: listing || null,
      daysElapsed,
    });

    return NextResponse.json({
      success: true,
      message: "Ticket escalated successfully",
      data: {
        ticketNumber: ticket.ticketNumber,
        assignedTo: admin.fullName,
        escalatedAt: now,
        escalationReason,
      },
    });
  } catch (error) {
    console.error("Manual escalation error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Helper function to create escalation notifications
 */
async function createEscalationNotifications({
  ticketId,
  ticketNumber,
  priority,
  pgName,
  assignedAdmin,
  user,
  owner,
  isManual = false,
}: {
  ticketId: mongoose.Types.ObjectId;
  ticketNumber: string;
  priority: string;
  pgName?: string;
  assignedAdmin: AdminUser;
  user: TicketUser;
  owner: TicketOwner | null;
  isManual?: boolean;
}) {
  const notifications = [];
  const escalationType = isManual ? "manually" : "automatically";

  // Notify assigned admin
  notifications.push({
    userId: assignedAdmin._id,
    type: "ticket_escalated",
    title: "🚨 Escalated Ticket Assigned",
    message: `Ticket ${ticketNumber} has been ${escalationType} escalated and assigned to you. Priority: ${priority}`,
    relatedId: ticketId,
    relatedModel: "SupportTicket",
    priority: "high",
    isRead: false,
  });

  // Notify user
  notifications.push({
    userId: user._id,
    type: "ticket_update",
    title: "Ticket Escalated to Admin",
    message: `Your ticket ${ticketNumber} has been escalated to our admin team for faster resolution.`,
    relatedId: ticketId,
    relatedModel: "SupportTicket",
    priority: "medium",
    isRead: false,
  });

  // Notify owner if exists
  if (owner?._id) {
    notifications.push({
      userId: owner._id,
      type: "ticket_escalated",
      title: "⚠️ Ticket Escalated",
      message: `Ticket ${ticketNumber} for ${pgName || "your property"} has been escalated to admin due to delayed resolution.`,
      relatedId: ticketId,
      relatedModel: "SupportTicket",
      priority: "high",
      isRead: false,
    });
  }

  await Notification.insertMany(notifications);
}

/**
 * Helper function to send escalation emails
 */
async function sendEscalationEmails({
  ticket,
  assignedAdmin,
  user,
  owner,
  listing,
  daysElapsed,
}: {
  ticket: TicketDocument;
  assignedAdmin: AdminUser;
  user: TicketUser;
  owner: TicketOwner | null;
  listing: TicketListing | null;
  daysElapsed: number;
}) {
  const emailPromises = [];

  // Email to admin
  emailPromises.push(
    sendTicketEmail({
      type: "ticket_escalated_admin",
      to: assignedAdmin.email,
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      category: ticket.category,
      priority: ticket.priority,
      userName: user?.fullName || "User",
      pgName: listing?.pgName || "N/A",
      daysElapsed,
    })
  );

  // Email to user
  if (user?.email) {
    emailPromises.push(
      sendTicketEmail({
        type: "ticket_escalated_user",
        to: user.email,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
      })
    );
  }

  // Email to owner
  if (owner?.email) {
    emailPromises.push(
      sendTicketEmail({
        type: "ticket_escalated_owner",
        to: owner.email,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        pgName: listing?.pgName,
      })
    );
  }

  // Wait for all emails (with individual error handling)
  const results = await Promise.allSettled(emailPromises);

  const failures = results.filter((r) => r.status === "rejected");
  if (failures.length > 0) {
    console.warn(`${failures.length} escalation emails failed to send`);
  }

  return results;
}