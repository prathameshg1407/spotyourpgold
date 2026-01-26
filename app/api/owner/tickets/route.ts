// app/api/owner/tickets/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import mongoose from "mongoose";
import SupportTicket from "@/models/supportTicket";
import Listing from "@/models/listing";

// GET - Fetch tickets assigned to owner
export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const ownerId = searchParams.get("ownerId");

    if (!ownerId) {
      return NextResponse.json(
        { success: false, message: "Owner ID is required" },
        { status: 400 }
      );
    }

    // Get owner's listings
    const ownerListings = await Listing.find({
      ownerId: new mongoose.Types.ObjectId(ownerId),
    }).select("_id");

    const listingIds = ownerListings.map((l) => l._id);

    // Get tickets related to owner's listings or assigned to owner
    const tickets = await SupportTicket.find({
      $or: [
        { listingId: { $in: listingIds } },
        { assignedTo: new mongoose.Types.ObjectId(ownerId) },
      ],
    })
      .populate({
        path: "userId",
        select: "fullName email phone",
      })
      .populate({
        path: "listingId",
        select: "pgName location",
      })
      .populate({
        path: "bookingId",
        select: "roomType moveInDate",
      })
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: tickets,
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

// POST - Owner responds to ticket
export async function POST(req: NextRequest) {
  try {
    await connectToDB();

    const body = await req.json();
    const { ticketId, ownerId, ownerName, message, action, resolution } = body;

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

    switch (action) {
      case "respond":
        if (!message) {
          return NextResponse.json(
            { success: false, message: "Message is required" },
            { status: 400 }
          );
        }

        ticket.comments.push({
          userId: new mongoose.Types.ObjectId(ownerId),
          userRole: "owner",
          userName: ownerName,
          message,
          createdAt: new Date(),
        });

        if (!ticket.firstResponseAt) {
          ticket.firstResponseAt = new Date();
        }

        ticket.status = "in_progress";
        break;

      case "resolve":
        ticket.status = "resolved";
        ticket.resolvedAt = new Date();
        ticket.resolvedBy = new mongoose.Types.ObjectId(ownerId);
        ticket.resolution = resolution || "Issue resolved by PG owner.";

        if (message) {
          ticket.comments.push({
            userId: new mongoose.Types.ObjectId(ownerId),
            userRole: "owner",
            userName: ownerName,
            message,
            createdAt: new Date(),
          });
        }
        break;

      case "escalate":
        ticket.isEscalated = true;
        ticket.escalatedAt = new Date();
        ticket.escalationReason = message || "Escalated by owner";
        ticket.assignedToRole = "admin";
        break;

      default:
        return NextResponse.json(
          { success: false, message: "Invalid action" },
          { status: 400 }
        );
    }

    await ticket.save();

    // Fetch updated ticket
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
    console.error("Owner ticket action error:", error);
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