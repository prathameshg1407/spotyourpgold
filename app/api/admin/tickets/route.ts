// app/api/admin/tickets/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import mongoose from "mongoose";
import SupportTicket from "@/models/supportTicket";
import User from "@/models/user";
import { sendTicketEmail } from "@/services/sendTicketEmail";

// GET - Fetch all tickets (with filters)
export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const category = searchParams.get("category");
    const escalated = searchParams.get("escalated");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Build filter
    const filter: any = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    if (priority && priority !== "all") {
      filter.priority = priority;
    }

    if (category && category !== "all") {
      filter.category = category;
    }

    if (escalated === "true") {
      filter.isEscalated = true;
    }

    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      SupportTicket.find(filter)
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
          select: "fullName email",
        })
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      SupportTicket.countDocuments(filter),
    ]);

    // Get stats
    const stats = await SupportTicket.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const priorityStats = await SupportTicket.aggregate([
      {
        $match: { status: { $nin: ["resolved", "closed"] } },
      },
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      data: tickets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        byStatus: stats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
        byPriority: priorityStats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
      },
    });
  } catch (error) {
    console.error("Get admin tickets error:", error);
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
export async function POST(req: NextRequest) {
  try {
    await connectToDB();

    const body = await req.json();
    const { ticketId, adminId, adminName, action, message, resolution, assignTo } = body;

    if (!ticketId || !adminId) {
      return NextResponse.json(
        { success: false, message: "Ticket ID and Admin ID are required" },
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

    const user = ticket.userId as any;

    switch (action) {
      case "respond":
        if (!message) {
          return NextResponse.json(
            { success: false, message: "Message is required" },
            { status: 400 }
          );
        }

        ticket.comments.push({
          userId: new mongoose.Types.ObjectId(adminId),
          userRole: "admin",
          userName: adminName || "Admin",
          message,
          createdAt: new Date(),
        });

        if (!ticket.firstResponseAt) {
          ticket.firstResponseAt = new Date();
        }

        ticket.status = "in_progress";

        // Send email notification to user
        if (user?.email) {
          await sendTicketEmail({
            type: "new_response",
            to: user.email,
            ticketNumber: ticket.ticketNumber,
            subject: ticket.subject,
            message,
          });
        }
        break;

      case "resolve":
        ticket.status = "resolved";
        ticket.resolvedAt = new Date();
        ticket.resolvedBy = new mongoose.Types.ObjectId(adminId);
        ticket.resolution = resolution || "Issue resolved by admin.";

        if (message) {
          ticket.comments.push({
            userId: new mongoose.Types.ObjectId(adminId),
            userRole: "admin",
            userName: adminName || "Admin",
            message,
            createdAt: new Date(),
          });
        }

        // Send resolution email
        if (user?.email) {
          await sendTicketEmail({
            type: "ticket_resolved",
            to: user.email,
            ticketNumber: ticket.ticketNumber,
            subject: ticket.subject,
            resolution: ticket.resolution,
          });
        }
        break;

      case "assign":
        if (!assignTo) {
          return NextResponse.json(
            { success: false, message: "Assignee is required" },
            { status: 400 }
          );
        }

        const assignee = await User.findById(assignTo);
        if (!assignee) {
          return NextResponse.json(
            { success: false, message: "Assignee not found" },
            { status: 404 }
          );
        }

        ticket.assignedTo = new mongoose.Types.ObjectId(assignTo);
        ticket.assignedToRole = assignee.role;
        break;

      case "change_priority":
        const { priority } = body;
        if (!priority) {
          return NextResponse.json(
            { success: false, message: "Priority is required" },
            { status: 400 }
          );
        }

        ticket.priority = priority;

        // Recalculate expected resolution date
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
        break;

      case "close":
        ticket.status = "closed";
        break;

      case "reopen":
        ticket.status = "reopened";
        ticket.resolvedAt = null;
        ticket.resolvedBy = null;
        break;

      default:
        return NextResponse.json(
          { success: false, message: "Invalid action" },
          { status: 400 }
        );
    }

    await ticket.save();

    // Fetch updated ticket with all populated fields
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
        select: "fullName email",
      });

    return NextResponse.json({
      success: true,
      message: "Ticket updated successfully",
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