// app/api/admin/tickets/[ticketId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import mongoose from "mongoose";
import SupportTicket from "@/models/supportTicket";
import Notification from "@/models/notification";
import User from "@/models/user";
import { sendTicketEmail } from "@/services/sendTicketEmail";

// GET - Get single ticket for admin
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    await connectToDB();

    const { ticketId } = await params;

    if (!ticketId || !mongoose.Types.ObjectId.isValid(ticketId)) {
      return NextResponse.json(
        { success: false, message: "Valid Ticket ID is required" },
        { status: 400 }
      );
    }

    const ticket = await SupportTicket.findById(ticketId)
      .populate({
        path: "userId",
        select: "fullName email phone profileImage createdAt role",
      })
      .populate({
        path: "listingId",
        select: "pgName location images ownerId",
        populate: {
          path: "ownerId",
          select: "fullName email phone",
        },
      })
      .populate({
        path: "bookingId",
        select: "roomType moveInDate status totalAmount paymentStatus",
      })
      .populate({
        path: "assignedTo",
        select: "fullName email role",
      })
      .populate({
        path: "resolvedBy",
        select: "fullName email",
      });

    if (!ticket) {
      return NextResponse.json(
        { success: false, message: "Ticket not found" },
        { status: 404 }
      );
    }

    // Get user's other tickets for context
    const userTicketHistory = await SupportTicket.find({
      userId: ticket.userId._id,
      _id: { $ne: ticket._id },
    })
      .select("ticketNumber subject status createdAt category")
      .sort({ createdAt: -1 })
      .limit(5);

    // Calculate metrics
    const createdAt = new Date(ticket.createdAt);
    const now = new Date();
    const hoursElapsed = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60));
    const daysElapsed = Math.floor(hoursElapsed / 24);

    const expectedResolution = new Date(ticket.expectedResolutionDate);
    const isOverdue = now > expectedResolution && !["resolved", "closed"].includes(ticket.status);
    
    let responseTime = null;
    if (ticket.firstResponseAt) {
      responseTime = Math.floor(
        (new Date(ticket.firstResponseAt).getTime() - createdAt.getTime()) / (1000 * 60 * 60)
      );
    }

    return NextResponse.json({
      success: true,
      data: ticket,
      userHistory: userTicketHistory,
      metrics: {
        hoursElapsed,
        daysElapsed,
        isOverdue,
        responseTimeHours: responseTime,
        isEscalated: ticket.isEscalated,
        escalatedDaysAgo: ticket.escalatedAt
          ? Math.floor((now.getTime() - new Date(ticket.escalatedAt).getTime()) / (1000 * 60 * 60 * 24))
          : null,
      },
    });
  } catch (error) {
    console.error("Admin get ticket error:", error);
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

// POST - Admin actions on ticket
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    await connectToDB();

    const { ticketId } = await params;
    const body = await req.json();
    const { action, adminId, adminName, message, resolution, status, priority } = body;

    if (!ticketId || !mongoose.Types.ObjectId.isValid(ticketId)) {
      return NextResponse.json(
        { success: false, message: "Valid Ticket ID is required" },
        { status: 400 }
      );
    }

    if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) {
      return NextResponse.json(
        { success: false, message: "Valid Admin ID is required" },
        { status: 400 }
      );
    }

    const ticket = await SupportTicket.findById(ticketId).populate({
      path: "userId",
      select: "fullName email",
    });

    if (!ticket) {
      return NextResponse.json(
        { success: false, message: "Ticket not found" },
        { status: 404 }
      );
    }

    const admin = await User.findById(adminId).select("fullName email role");

    if (!admin || admin.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = ticket.userId as any;

    switch (action) {
      case "add_comment":
        if (!message) {
          return NextResponse.json(
            { success: false, message: "Message is required" },
            { status: 400 }
          );
        }

        ticket.comments.push({
          userId: new mongoose.Types.ObjectId(adminId),
          userRole: "admin",
          userName: adminName || `${admin.fullName} (Admin)`,
          message,
          createdAt: new Date(),
        });

        if (!ticket.firstResponseAt) {
          ticket.firstResponseAt = new Date();
        }

        if (ticket.status === "open") {
          ticket.status = "in_progress";
        }

        if (!ticket.assignedTo) {
          ticket.assignedTo = new mongoose.Types.ObjectId(adminId);
          ticket.assignedToRole = "admin";
        }

        await ticket.save();

        // Notify user
        await Notification.create({
          userId: ticket.userId._id,
          type: "general",
          title: "Admin Response on Your Ticket",
          message: `Admin has responded to your ticket ${ticket.ticketNumber}`,
          relatedId: ticket._id,
          priority: "high",
        });

        // Email user
        if (user?.email) {
          try {
            await sendTicketEmail({
              type: "ticket_response",
              to: user.email,
              ticketNumber: ticket.ticketNumber,
              subject: ticket.subject,
              message: `Admin responded: ${message.substring(0, 100)}...`,
            });
          } catch (emailError) {
            console.error("Email error:", emailError);
          }
        }
        break;

      case "resolve":
        if (!resolution) {
          return NextResponse.json(
            { success: false, message: "Resolution is required" },
            { status: 400 }
          );
        }

        ticket.status = "resolved";
        ticket.resolution = resolution;
        ticket.resolvedAt = new Date();
        ticket.resolvedBy = new mongoose.Types.ObjectId(adminId);

        ticket.comments.push({
          userId: new mongoose.Types.ObjectId(adminId),
          userRole: "admin",
          userName: adminName || `${admin.fullName} (Admin)`,
          message: `✅ Ticket Resolved by Admin: ${resolution}`,
          createdAt: new Date(),
        });

        await ticket.save();

        // Notify user
        await Notification.create({
          userId: ticket.userId._id,
          type: "general",
          title: "Ticket Resolved by Admin",
          message: `Your ticket ${ticket.ticketNumber} has been resolved. Please rate your experience.`,
          relatedId: ticket._id,
          priority: "high",
        });

        // Email
        if (user?.email) {
          try {
            await sendTicketEmail({
              type: "ticket_resolved",
              to: user.email,
              ticketNumber: ticket.ticketNumber,
              subject: ticket.subject,
              resolution,
            });
          } catch (emailError) {
            console.error("Email error:", emailError);
          }
        }
        break;

      case "update_status":
        if (!status) {
          return NextResponse.json(
            { success: false, message: "Status is required" },
            { status: 400 }
          );
        }

        ticket.status = status;

        if (status === "resolved" && resolution) {
          ticket.resolution = resolution;
          ticket.resolvedAt = new Date();
          ticket.resolvedBy = new mongoose.Types.ObjectId(adminId);
        }

        await ticket.save();

        // Notify user
        await Notification.create({
          userId: ticket.userId._id,
          type: "general",
          title: "Ticket Status Updated",
          message: `Your ticket ${ticket.ticketNumber} status: ${status.replace("_", " ")}`,
          relatedId: ticket._id,
          priority: "low",
        });
        break;

      case "update_priority":
        if (!priority) {
          return NextResponse.json(
            { success: false, message: "Priority is required" },
            { status: 400 }
          );
        }

        const oldPriority = ticket.priority;
        ticket.priority = priority;

        // Recalculate expected resolution
        const now = new Date();
        switch (priority) {
          case "urgent":
            ticket.expectedResolutionDate = new Date(now.getTime() + 4 * 60 * 60 * 1000);
            break;
          case "high":
            ticket.expectedResolutionDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            break;
          case "medium":
            ticket.expectedResolutionDate = new Date(now.getTime() + 48 * 60 * 60 * 1000);
            break;
          case "low":
            ticket.expectedResolutionDate = new Date(now.getTime() + 72 * 60 * 60 * 1000);
            break;
        }

        ticket.comments.push({
          userId: new mongoose.Types.ObjectId(adminId),
          userRole: "admin",
          userName: "System",
          message: `Priority changed from ${oldPriority} to ${priority} by admin`,
          createdAt: new Date(),
        });

        await ticket.save();
        break;

      case "close":
        ticket.status = "closed";
        
        ticket.comments.push({
          userId: new mongoose.Types.ObjectId(adminId),
          userRole: "admin",
          userName: adminName || `${admin.fullName} (Admin)`,
          message: message || "Ticket closed by admin",
          createdAt: new Date(),
        });

        await ticket.save();

        // Notify user
        await Notification.create({
          userId: ticket.userId._id,
          type: "general",
          title: "Ticket Closed",
          message: `Your ticket ${ticket.ticketNumber} has been closed`,
          relatedId: ticket._id,
          priority: "low",
        });
        break;

      default:
        return NextResponse.json(
          { success: false, message: "Invalid action" },
          { status: 400 }
        );
    }

    // Fetch updated ticket
    const updatedTicket = await SupportTicket.findById(ticketId)
      .populate({
        path: "userId",
        select: "fullName email phone",
      })
      .populate({
        path: "listingId",
        select: "pgName location ownerId",
        populate: {
          path: "ownerId",
          select: "fullName email",
        },
      })
      .populate({
        path: "assignedTo",
        select: "fullName email role",
      });

    return NextResponse.json({
      success: true,
      message: `Ticket ${action.replace("_", " ")} successful`,
      data: updatedTicket,
    });
  } catch (error) {
    console.error("Admin ticket action error:", error);
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