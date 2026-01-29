// app/api/owner/tickets/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import mongoose from "mongoose";
import SupportTicket from "@/models/supportTicket";
import Listing from "@/models/listing";
import Notification from "@/models/notification";
import User from "@/models/user";

// GET - Fetch tickets for owner's listings
export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const ownerId = searchParams.get("ownerId");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!ownerId || !mongoose.Types.ObjectId.isValid(ownerId)) {
      return NextResponse.json(
        { success: false, message: "Valid Owner ID is required" },
        { status: 400 }
      );
    }

    // First, get all listings owned by this owner
    const ownerListings = await Listing.find({
      ownerId: new mongoose.Types.ObjectId(ownerId),
    }).select("_id");

    const listingIds = ownerListings.map((listing) => listing._id);

    if (listingIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
        stats: {
          total: 0,
          open: 0,
          inProgress: 0,
          waitingResponse: 0,
          resolved: 0,
          escalated: 0,
        },
      });
    }

    // Build query for tickets related to owner's listings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {
      $or: [
        { listingId: { $in: listingIds } },
        { assignedTo: new mongoose.Types.ObjectId(ownerId) },
      ],
    };

    // Apply filters
    if (status && status !== "all") {
      query.status = status;
    }

    if (priority && priority !== "all") {
      query.priority = priority;
    }

    if (category && category !== "all") {
      query.category = category;
    }

    // Get total count for pagination
    const total = await SupportTicket.countDocuments(query);

    // Get tickets with pagination
    const tickets = await SupportTicket.find(query)
      .populate({
        path: "userId",
        select: "fullName email phone profileImage",
      })
      .populate({
        path: "listingId",
        select: "pgName location images",
      })
      .populate({
        path: "bookingId",
        select: "roomType moveInDate status",
      })
      .populate({
        path: "assignedTo",
        select: "fullName email",
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Get stats for dashboard
    const stats = await SupportTicket.aggregate([
      { $match: { $or: query.$or } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          open: {
            $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] },
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] },
          },
          waitingResponse: {
            $sum: { $cond: [{ $eq: ["$status", "waiting_response"] }, 1, 0] },
          },
          resolved: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
          },
          closed: {
            $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] },
          },
          escalated: {
            $sum: { $cond: [{ $eq: ["$isEscalated", true] }, 1, 0] },
          },
          urgent: {
            $sum: { $cond: [{ $eq: ["$priority", "urgent"] }, 1, 0] },
          },
          high: {
            $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] },
          },
        },
      },
    ]);

    // Get overdue tickets count (past expected resolution date but not resolved)
    const overdueCount = await SupportTicket.countDocuments({
      ...query,
      status: { $nin: ["resolved", "closed"] },
      expectedResolutionDate: { $lt: new Date() },
    });

    return NextResponse.json({
      success: true,
      data: tickets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      stats: stats[0] || {
        total: 0,
        open: 0,
        inProgress: 0,
        waitingResponse: 0,
        resolved: 0,
        closed: 0,
        escalated: 0,
        urgent: 0,
        high: 0,
      },
      overdueCount,
    });
  } catch (error) {
    console.error("Get owner tickets error:", error);
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

// POST - Assign ticket to self or update assignment
export async function POST(req: NextRequest) {
  try {
    await connectToDB();

    const body = await req.json();
    const { ticketId, ownerId, action } = body;

    if (!ticketId || !ownerId) {
      return NextResponse.json(
        { success: false, message: "Ticket ID and Owner ID are required" },
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

    // Verify owner owns the listing
    const listing = await Listing.findOne({
      _id: ticket.listingId,
      ownerId: new mongoose.Types.ObjectId(ownerId),
    });

    if (!listing && !ticket.assignedTo?.equals(new mongoose.Types.ObjectId(ownerId))) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access to this ticket" },
        { status: 403 }
      );
    }

    const owner = await User.findById(ownerId).select("fullName");

    switch (action) {
      case "assign_self":
        ticket.assignedTo = new mongoose.Types.ObjectId(ownerId);
        ticket.assignedToRole = "owner";
        if (ticket.status === "open") {
          ticket.status = "in_progress";
        }
        await ticket.save();

        // Notify user
        await Notification.create({
          userId: ticket.userId,
          type: "general",
          title: "Ticket Assigned",
          message: `Your ticket ${ticket.ticketNumber} has been assigned to ${owner?.fullName || "the property owner"}`,
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

    const updatedTicket = await SupportTicket.findById(ticketId)
      .populate({
        path: "userId",
        select: "fullName email phone",
      })
      .populate({
        path: "listingId",
        select: "pgName location",
      });

    return NextResponse.json({
      success: true,
      message: "Ticket updated successfully",
      data: updatedTicket,
    });
  } catch (error) {
    console.error("Update owner ticket error:", error);
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