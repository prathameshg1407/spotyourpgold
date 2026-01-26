// app/api/user/tickets/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import mongoose from "mongoose";
import SupportTicket from "@/models/supportTicket";
import Notification from "@/models/notification";
import Listing from "@/models/listing";
import { sendTicketEmail } from "@/services/sendTicketEmail";

// Helper function to generate ticket number
async function generateTicketNumber(): Promise<string> {
  const prefix = "TKT";
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  
  // Get count of tickets created today for sequential numbering
  const startOfDay = new Date(date.setHours(0, 0, 0, 0));
  const endOfDay = new Date(date.setHours(23, 59, 59, 999));
  
  const todayCount = await SupportTicket.countDocuments({
    createdAt: { $gte: startOfDay, $lte: endOfDay },
  });
  
  const sequence = (todayCount + 1).toString().padStart(4, "0");
  
  return `${prefix}-${year}${month}-${sequence}`;
}

// GET - Fetch user's tickets
export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    const tickets = await SupportTicket.find({
      userId: new mongoose.Types.ObjectId(userId),
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
        select: "roomType moveInDate",
      })
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: tickets,
    });
  } catch (error) {
    console.error("Get tickets error:", error);
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

// POST - Create new ticket
export async function POST(req: NextRequest) {
  try {
    await connectToDB();

    const body = await req.json();
    const {
      userId,
      category,
      priority,
      subject,
      description,
      listingId,
      bookingId,
      userEmail,
    } = body;

    // Validation
    if (!userId || !category || !subject || !description) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate unique ticket number
    const ticketNumber = await generateTicketNumber();

    // Create ticket with ticketNumber
    const ticket = new SupportTicket({
      ticketNumber, // Add the generated ticket number
      userId: new mongoose.Types.ObjectId(userId),
      category,
      priority: priority || "medium",
      subject,
      description,
      listingId: listingId ? new mongoose.Types.ObjectId(listingId) : null,
      bookingId: bookingId ? new mongoose.Types.ObjectId(bookingId) : null,
      status: "open",
    });

    await ticket.save();

    // If related to a listing, notify the owner
    if (listingId) {
      const listing = await Listing.findById(listingId).select("ownerId pgName");
      if (listing?.ownerId) {
        // Assign to owner
        ticket.assignedTo = listing.ownerId;
        ticket.assignedToRole = "owner";
        await ticket.save();

        // Create notification for owner
        await Notification.create({
          userId: listing.ownerId,
          type: "general",
          title: "New Support Ticket",
          message: `A tenant has raised a ${category.replace("_", " ")} issue for ${listing.pgName}`,
          relatedId: ticket._id,
          relatedType: "ticket",
          priority: priority === "urgent" ? "high" : "medium",
        });
      }
    }

    // Send email confirmation to user
    if (userEmail) {
      try {
        await sendTicketEmail({
          type: "ticket_created",
          to: userEmail,
          ticketNumber: ticket.ticketNumber,
          subject,
          category,
          priority: priority || "medium",
        });
      } catch (emailError) {
        console.error("Failed to send ticket email:", emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: "Ticket created successfully",
      data: ticket,
    });
  } catch (error) {
    console.error("Create ticket error:", error);
    
    // Handle duplicate ticket number (race condition)
    if (error instanceof Error && error.message.includes("duplicate key")) {
      // Retry with new ticket number
      return NextResponse.json(
        { success: false, message: "Please try again" },
        { status: 409 }
      );
    }
    
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