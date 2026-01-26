// app/api/user/tickets/[ticketId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import mongoose from "mongoose";
import SupportTicket from "@/models/supportTicket";
import Notification from "@/models/notification";
import { sendTicketEmail } from "@/services/sendTicketEmail";

// GET - Get single ticket details
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
        path: "listingId",
        select: "pgName location ownerId",
        populate: {
          path: "ownerId",
          select: "fullName email phone",
        },
      })
      .populate({
        path: "bookingId",
        select: "roomType moveInDate",
      })
      .populate({
        path: "assignedTo",
        select: "fullName email",
      });

    if (!ticket) {
      return NextResponse.json(
        { success: false, message: "Ticket not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    console.error("Get ticket error:", error);
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

// POST - Update ticket (add comment, change status, rate)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    await connectToDB();

    const { ticketId } = await params;
    const body = await req.json();
    const { action, userId, userName, userRole, message, rating, status, resolution } = body;

    if (!ticketId || !mongoose.Types.ObjectId.isValid(ticketId)) {
      return NextResponse.json(
        { success: false, message: "Valid Ticket ID is required" },
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
      case "add_comment":
        if (!message) {
          return NextResponse.json(
            { success: false, message: "Message is required" },
            { status: 400 }
          );
        }

        ticket.comments.push({
          userId: new mongoose.Types.ObjectId(userId),
          userRole,
          userName,
          message,
          createdAt: new Date(),
        });

        // Update first response time if this is first non-user response
        if (userRole !== "user" && !ticket.firstResponseAt) {
          ticket.firstResponseAt = new Date();
        }

        // Update status based on who responded
        if (userRole === "user") {
          ticket.status = "waiting_response";
        } else {
          ticket.status = "in_progress";
        }

        await ticket.save();

        // Notify relevant party
        if (userRole === "user" && ticket.assignedTo) {
          await Notification.create({
            userId: ticket.assignedTo,
            type: "general",
            title: "New Reply on Ticket",
            message: `User replied to ticket ${ticket.ticketNumber}`,
            relatedId: ticket._id,
            priority: "medium",
          });
        } else if (userRole !== "user") {
          await Notification.create({
            userId: ticket.userId,
            type: "general",
            title: "Response on Your Ticket",
            message: `You have a new response on ticket ${ticket.ticketNumber}`,
            relatedId: ticket._id,
            priority: "medium",
          });
        }
        break;

      case "rate":
        if (!rating || rating < 1 || rating > 5) {
          return NextResponse.json(
            { success: false, message: "Valid rating (1-5) is required" },
            { status: 400 }
          );
        }

        ticket.satisfactionRating = rating;
        ticket.status = "closed";
        await ticket.save();
        break;

      case "update_status":
        if (!status) {
          return NextResponse.json(
            { success: false, message: "Status is required" },
            { status: 400 }
          );
        }

        ticket.status = status;

        if (status === "resolved") {
          ticket.resolvedAt = new Date();
          ticket.resolvedBy = new mongoose.Types.ObjectId(userId);
          ticket.resolution = resolution || "";

          // Notify user
          await Notification.create({
            userId: ticket.userId,
            type: "general",
            title: "Ticket Resolved",
            message: `Your ticket ${ticket.ticketNumber} has been resolved`,
            relatedId: ticket._id,
            priority: "medium",
          });
        }

        await ticket.save();
        break;

      case "reopen":
        ticket.status = "reopened";
        ticket.resolvedAt = null;
        ticket.resolvedBy = null;
        ticket.resolution = "";
        await ticket.save();
        break;

      default:
        return NextResponse.json(
          { success: false, message: "Invalid action" },
          { status: 400 }
        );
    }

    // Fetch updated ticket with populated fields
    const updatedTicket = await SupportTicket.findById(ticketId)
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
        select: "roomType moveInDate",
      });

    return NextResponse.json({
      success: true,
      message: "Ticket updated successfully",
      data: updatedTicket,
    });
  } catch (error) {
    console.error("Update ticket error:", error);
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