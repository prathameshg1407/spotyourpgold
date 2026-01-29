// app/api/owner/tickets/[ticketId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import mongoose from "mongoose";
import SupportTicket from "@/models/supportTicket";
import Listing from "@/models/listing";
import Notification from "@/models/notification";
import User from "@/models/user";
import { sendTicketEmail } from "@/services/sendTicketEmail";

// GET - Get single ticket details for owner
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    await connectToDB();

    const { ticketId } = await params;
    const { searchParams } = new URL(req.url);
    const ownerId = searchParams.get("ownerId");

    if (!ticketId || !mongoose.Types.ObjectId.isValid(ticketId)) {
      return NextResponse.json(
        { success: false, message: "Valid Ticket ID is required" },
        { status: 400 }
      );
    }

    if (!ownerId || !mongoose.Types.ObjectId.isValid(ownerId)) {
      return NextResponse.json(
        { success: false, message: "Valid Owner ID is required" },
        { status: 400 }
      );
    }

    const ticket = await SupportTicket.findById(ticketId)
      .populate({
        path: "userId",
        select: "fullName email phone profileImage createdAt",
      })
      .populate({
        path: "listingId",
        select: "pgName location images ownerId",
      })
      .populate({
        path: "bookingId",
        select: "roomType moveInDate status totalAmount",
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

    // Verify owner has access to this ticket
    const ownerObjectId = new mongoose.Types.ObjectId(ownerId);
    
    // Check if owner owns the listing or is assigned to the ticket
    const hasAccess =
      ticket.listingId?.ownerId?.equals(ownerObjectId) ||
      ticket.assignedTo?._id?.equals(ownerObjectId);

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access to this ticket" },
        { status: 403 }
      );
    }

    // Calculate time metrics
    const createdAt = new Date(ticket.createdAt);
    const now = new Date();
    const hoursElapsed = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60));
    const daysElapsed = Math.floor(hoursElapsed / 24);
    
    const expectedResolution = new Date(ticket.expectedResolutionDate);
    const isOverdue = now > expectedResolution && !["resolved", "closed"].includes(ticket.status);
    const hoursOverdue = isOverdue 
      ? Math.floor((now.getTime() - expectedResolution.getTime()) / (1000 * 60 * 60))
      : 0;

    // Time until escalation (3 days from creation)
    const escalationTime = new Date(createdAt.getTime() + 3 * 24 * 60 * 60 * 1000);
    const hoursUntilEscalation = Math.max(
      0,
      Math.floor((escalationTime.getTime() - now.getTime()) / (1000 * 60 * 60))
    );

    return NextResponse.json({
      success: true,
      data: ticket,
      metrics: {
        hoursElapsed,
        daysElapsed,
        isOverdue,
        hoursOverdue,
        hoursUntilEscalation,
        willEscalateAt: escalationTime,
      },
    });
  } catch (error) {
    console.error("Get owner ticket details error:", error);
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

// POST - Owner actions on ticket (comment, resolve, etc.)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    await connectToDB();

    const { ticketId } = await params;
    const body = await req.json();
    const { action, ownerId, ownerName, message, resolution, status } = body;

    if (!ticketId || !mongoose.Types.ObjectId.isValid(ticketId)) {
      return NextResponse.json(
        { success: false, message: "Valid Ticket ID is required" },
        { status: 400 }
      );
    }

    if (!ownerId || !mongoose.Types.ObjectId.isValid(ownerId)) {
      return NextResponse.json(
        { success: false, message: "Valid Owner ID is required" },
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

    // Verify owner has access
    const listing = await Listing.findOne({
      _id: ticket.listingId,
      ownerId: new mongoose.Types.ObjectId(ownerId),
    });

    const ownerObjectId = new mongoose.Types.ObjectId(ownerId);
    if (!listing && !ticket.assignedTo?.equals(ownerObjectId)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access to this ticket" },
        { status: 403 }
      );
    }

    const owner = await User.findById(ownerId).select("fullName email");
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
          userId: ownerObjectId,
          userRole: "owner",
          userName: ownerName || owner?.fullName || "Property Owner",
          message,
          createdAt: new Date(),
        });

        // Update first response time if this is first response
        if (!ticket.firstResponseAt) {
          ticket.firstResponseAt = new Date();
        }

        // Update status
        ticket.status = "in_progress";

        // Assign to self if not assigned
        if (!ticket.assignedTo) {
          ticket.assignedTo = ownerObjectId;
          ticket.assignedToRole = "owner";
        }

        await ticket.save();

        // Notify user
        await Notification.create({
          userId: ticket.userId._id,
          type: "general",
          title: "New Response on Your Ticket",
          message: `The property owner has responded to your ticket ${ticket.ticketNumber}`,
          relatedId: ticket._id,
          priority: "medium",
        });

        // Send email to user
        if (user?.email) {
          try {
            await sendTicketEmail({
              type: "ticket_response",
              to: user.email,
              ticketNumber: ticket.ticketNumber,
              subject: ticket.subject,
              message: `Owner responded: ${message.substring(0, 100)}...`,
            });
          } catch (emailError) {
            console.error("Failed to send ticket response email:", emailError);
          }
        }
        break;

      case "resolve":
        if (!resolution) {
          return NextResponse.json(
            { success: false, message: "Resolution details are required" },
            { status: 400 }
          );
        }

        ticket.status = "resolved";
        ticket.resolution = resolution;
        ticket.resolvedAt = new Date();
        ticket.resolvedBy = ownerObjectId;

        // Add resolution as a comment
        ticket.comments.push({
          userId: ownerObjectId,
          userRole: "owner",
          userName: ownerName || owner?.fullName || "Property Owner",
          message: `✅ Ticket Resolved: ${resolution}`,
          createdAt: new Date(),
        });

        await ticket.save();

        // Notify user
        await Notification.create({
          userId: ticket.userId._id,
          type: "general",
          title: "Ticket Resolved",
          message: `Your ticket ${ticket.ticketNumber} has been resolved. Please rate your experience.`,
          relatedId: ticket._id,
          priority: "high",
        });

        // Send email
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
            console.error("Failed to send ticket resolved email:", emailError);
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

        const validStatuses = ["open", "in_progress", "waiting_response", "resolved", "closed"];
        if (!validStatuses.includes(status)) {
          return NextResponse.json(
            { success: false, message: "Invalid status" },
            { status: 400 }
          );
        }

        ticket.status = status;

        if (status === "resolved" && resolution) {
          ticket.resolution = resolution;
          ticket.resolvedAt = new Date();
          ticket.resolvedBy = ownerObjectId;
        }

        await ticket.save();

        // Notify user of status change
        await Notification.create({
          userId: ticket.userId._id,
          type: "general",
          title: "Ticket Status Updated",
          message: `Your ticket ${ticket.ticketNumber} status changed to: ${status.replace("_", " ")}`,
          relatedId: ticket._id,
          priority: "low",
        });
        break;

      case "request_more_info":
        ticket.status = "waiting_response";
        
        ticket.comments.push({
          userId: ownerObjectId,
          userRole: "owner",
          userName: ownerName || owner?.fullName || "Property Owner",
          message: message || "Please provide more information to help us resolve your issue.",
          createdAt: new Date(),
        });

        if (!ticket.firstResponseAt) {
          ticket.firstResponseAt = new Date();
        }

        await ticket.save();

        // Notify user
        await Notification.create({
          userId: ticket.userId._id,
          type: "general",
          title: "More Information Required",
          message: `The property owner needs more information for ticket ${ticket.ticketNumber}`,
          relatedId: ticket._id,
          priority: "medium",
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
        select: "pgName location",
      })
      .populate({
        path: "bookingId",
        select: "roomType moveInDate",
      })
      .populate({
        path: "assignedTo",
        select: "fullName email",
      });

    return NextResponse.json({
      success: true,
      message: `Ticket ${action.replace("_", " ")} successful`,
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