// app/api/admin/tickets/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import mongoose from "mongoose";
import SupportTicket from "@/models/supportTicket";
import Notification from "@/models/notification";
import User from "@/models/user";

// GET - Fetch all tickets for admin (with escalated filter)
export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get("adminId");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const category = searchParams.get("category");
    const escalatedOnly = searchParams.get("escalated") === "true";
    const assignedToMe = searchParams.get("assignedToMe") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (priority && priority !== "all") {
      query.priority = priority;
    }

    if (category && category !== "all") {
      query.category = category;
    }

    if (escalatedOnly) {
      query.isEscalated = true;
    }

    if (assignedToMe && adminId) {
      query.assignedTo = new mongoose.Types.ObjectId(adminId);
    }

    if (search) {
      query.$or = [
        { ticketNumber: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
      ];
    }

    // Get total count
    const total = await SupportTicket.countDocuments(query);

    // Get tickets with pagination
    const tickets = await SupportTicket.find(query)
      .populate({
        path: "userId",
        select: "fullName email phone profileImage",
      })
      .populate({
        path: "listingId",
        select: "pgName location ownerId",
        populate: {
          path: "ownerId",
          select: "fullName email phone",
        },
      })
      .populate({
        path: "bookingId",
        select: "roomType moveInDate status",
      })
      .populate({
        path: "assignedTo",
        select: "fullName email role",
      })
      .populate({
        path: "resolvedBy",
        select: "fullName email",
      })
      .sort({ isEscalated: -1, priority: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Get comprehensive stats
    const stats = await SupportTicket.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          open: { $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] } },
          waitingResponse: { $sum: { $cond: [{ $eq: ["$status", "waiting_response"] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] } },
          closed: { $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] } },
          escalated: { $sum: { $cond: [{ $eq: ["$isEscalated", true] }, 1, 0] } },
          urgent: { $sum: { $cond: [{ $eq: ["$priority", "urgent"] }, 1, 0] } },
          high: { $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] } },
          unassigned: { $sum: { $cond: [{ $eq: ["$assignedTo", null] }, 1, 0] } },
        },
      },
    ]);

    // Get overdue count
    const overdueCount = await SupportTicket.countDocuments({
      status: { $nin: ["resolved", "closed"] },
      expectedResolutionDate: { $lt: new Date() },
    });

    // Get assigned to current admin count
    let assignedToMeCount = 0;
    if (adminId) {
      assignedToMeCount = await SupportTicket.countDocuments({
        assignedTo: new mongoose.Types.ObjectId(adminId),
        status: { $nin: ["resolved", "closed"] },
      });
    }

    // Category breakdown
    const categoryStats = await SupportTicket.aggregate([
      { $match: { status: { $nin: ["resolved", "closed"] } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    return NextResponse.json({
      success: true,
      data: tickets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        ...(stats[0] || {
          total: 0,
          open: 0,
          inProgress: 0,
          waitingResponse: 0,
          resolved: 0,
          closed: 0,
          escalated: 0,
          urgent: 0,
          high: 0,
          unassigned: 0,
        }),
        overdue: overdueCount,
        assignedToMe: assignedToMeCount,
      },
      categoryStats,
    });
  } catch (error) {
    console.error("Admin get tickets error:", error);
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

// POST - Admin assign ticket to self or another admin
export async function POST(req: NextRequest) {
  try {
    await connectToDB();

    const body = await req.json();
    const { ticketId, adminId, action, assignToId, message } = body;

    if (!ticketId || !adminId) {
      return NextResponse.json(
        { success: false, message: "Ticket ID and Admin ID are required" },
        { status: 400 }
      );
    }

    const ticket = await SupportTicket.findById(ticketId);

    if (!ticket) {
      return NextResponse.json(
        { success: false, message: "Ticket not found" },
        { status: 404 }
      );
    }

    const admin = await User.findById(adminId).select("fullName email role");

    if (!admin || admin.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Invalid admin user" },
        { status: 403 }
      );
    }

    switch (action) {
      case "assign_self":
        ticket.assignedTo = new mongoose.Types.ObjectId(adminId);
        ticket.assignedToRole = "admin";
        if (ticket.status === "open") {
          ticket.status = "in_progress";
        }
        await ticket.save();

        // Notify user
        await Notification.create({
          userId: ticket.userId,
          type: "general",
          title: "Admin Assigned",
          message: `An admin has been assigned to your ticket ${ticket.ticketNumber}`,
          relatedId: ticket._id,
          priority: "low",
        });
        break;

      case "assign_to":
        if (!assignToId) {
          return NextResponse.json(
            { success: false, message: "Assign to ID is required" },
            { status: 400 }
          );
        }

        const assignee = await User.findById(assignToId).select("fullName role");
        if (!assignee) {
          return NextResponse.json(
            { success: false, message: "Assignee not found" },
            { status: 404 }
          );
        }

        ticket.assignedTo = new mongoose.Types.ObjectId(assignToId);
        ticket.assignedToRole = assignee.role as "owner" | "admin" | "support";
        await ticket.save();

        // Notify new assignee
        await Notification.create({
          userId: assignToId,
          type: "general",
          title: "Ticket Assigned to You",
          message: `Ticket ${ticket.ticketNumber} has been assigned to you by admin`,
          relatedId: ticket._id,
          priority: "medium",
        });
        break;

      case "add_internal_note":
        if (!message) {
          return NextResponse.json(
            { success: false, message: "Message is required" },
            { status: 400 }
          );
        }

        ticket.comments.push({
          userId: new mongoose.Types.ObjectId(adminId),
          userRole: "admin",
          userName: `${admin.fullName} (Admin)`,
          message: `[Internal Note] ${message}`,
          createdAt: new Date(),
        });
        await ticket.save();
        break;

      default:
        return NextResponse.json(
          { success: false, message: "Invalid action" },
          { status: 400 }
        );
    }

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