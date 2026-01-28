import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import Room from "@/models/room";
import Listing from "@/models/listing";
import { authUser } from "@/actions/authUser";

// GET - Get single room details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();
    const user = await authUser();
    const { id } = await params;

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const room = await Room.findById(id)
      .populate("listingId", "pgName location ownerId")
      .populate("beds.currentTenantId", "fullName email phone");

    if (!room) {
      return NextResponse.json(
        { success: false, message: "Room not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    const listing = await Listing.findById(room.listingId);
    if (!listing || (listing.ownerId.toString() !== user.id && user.role !== "admin")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: room,
    });
  } catch (error) {
    console.error("Get room error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update room details
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();
    const user = await authUser();
    const { id } = await params;

    if (!user || (user.role !== "owner" && user.role !== "admin")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const room = await Room.findById(id);
    if (!room) {
      return NextResponse.json(
        { success: false, message: "Room not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    const listing = await Listing.findById(room.listingId);
    if (!listing || listing.ownerId.toString() !== user.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 }
      );
    }

    const updates = await req.json();
    
    // Update allowed fields
    const allowedUpdates = [
      "roomNumber",
      "floor",
      "isAC",
      "hasAttachedBathroom",
      "amenities",
      "notes",
      "monthlyRent",
      "securityDeposit",
      "status",
    ];

    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        (room as any)[field] = updates[field];
      }
    });

    await room.save();

    return NextResponse.json({
      success: true,
      message: "Room updated successfully",
      data: room,
    });
  } catch (error) {
    console.error("Update room error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a room
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();
    const user = await authUser();
    const { id } = await params;

    if (!user || (user.role !== "owner" && user.role !== "admin")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const room = await Room.findById(id);
    if (!room) {
      return NextResponse.json(
        { success: false, message: "Room not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    const listing = await Listing.findById(room.listingId);
    if (!listing || listing.ownerId.toString() !== user.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 }
      );
    }

    // Check if room has occupied beds
    const hasOccupiedBeds = room.beds.some(
      (bed: any) => bed.status === "occupied" || bed.status === "reserved"
    );

    if (hasOccupiedBeds) {
      return NextResponse.json(
        { success: false, message: "Cannot delete room with occupied beds" },
        { status: 400 }
      );
    }

    await Room.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Room deleted successfully",
    });
  } catch (error) {
    console.error("Delete room error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}