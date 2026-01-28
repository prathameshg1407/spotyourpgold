import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import TenantAllocation from "@/models/tenantAllocation";
import Notification from "@/models/notification";
import Listing from "@/models/listing";
import { authUser } from "@/actions/authUser";

// GET - Get rent history
export async function GET(req: NextRequest) {
  try {
    await connectToDB();
    const user = await authUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const allocationId = searchParams.get("allocationId");

    let query: any = { tenantId: user.id };
    if (allocationId) {
      query._id = allocationId;
    }

    const allocations = await TenantAllocation.find(query)
      .select("pgName roomNumber bedNumber monthlyRent rentHistory status")
      .sort({ createdAt: -1 });

    // Flatten rent history across all allocations
    const rentHistory = allocations.flatMap((allocation: any) =>
      allocation.rentHistory.map((rent: any) => ({
        ...rent.toObject(),
        allocationId: allocation._id,
        pgName: allocation.pgName,
        roomNumber: allocation.roomNumber,
        bedNumber: allocation.bedNumber,
      }))
    );

    // Sort by due date descending
    rentHistory.sort(
      (a: any, b: any) =>
        new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
    );

    // Calculate summary
    const summary = {
      totalPaid: rentHistory
        .filter((r: any) => r.status === "paid")
        .reduce((acc: number, r: any) => acc + r.paidAmount, 0),
      totalPending: rentHistory
        .filter((r: any) => r.status === "pending")
        .reduce((acc: number, r: any) => acc + r.amount, 0),
      totalOverdue: rentHistory
        .filter((r: any) => r.status === "overdue")
        .reduce((acc: number, r: any) => acc + r.amount + (r.lateFee || 0), 0),
      overdueCount: rentHistory.filter((r: any) => r.status === "overdue").length,
    };

    return NextResponse.json({
      success: true,
      data: {
        rentHistory,
        summary,
      },
    });
  } catch (error) {
    console.error("Get rent history error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Mark rent as paid (for owner)
export async function POST(req: NextRequest) {
  try {
    await connectToDB();
    const user = await authUser();

    if (!user || (user.role !== "owner" && user.role !== "admin")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const {
      allocationId,
      rentMonth, // Date of the rent month
      paidAmount,
      paymentMethod,
      transactionId,
    } = await req.json();

    if (!allocationId || !rentMonth || !paidAmount) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const allocation = await TenantAllocation.findById(allocationId);
    if (!allocation) {
      return NextResponse.json(
        { success: false, message: "Allocation not found" },
        { status: 404 }
      );
    }

    // Verify owner
    const listing = await Listing.findById(allocation.listingId);
    if (!listing || listing.ownerId.toString() !== user.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 }
      );
    }

    // Find the rent entry
    const rentIndex = allocation.rentHistory.findIndex((r: any) => {
      const rentDate = new Date(r.month);
      const targetDate = new Date(rentMonth);
      return (
        rentDate.getMonth() === targetDate.getMonth() &&
        rentDate.getFullYear() === targetDate.getFullYear()
      );
    });

    if (rentIndex === -1) {
      return NextResponse.json(
        { success: false, message: "Rent entry not found" },
        { status: 404 }
      );
    }

    // Update rent entry
    const rent = allocation.rentHistory[rentIndex];
    rent.paidAmount = paidAmount;
    rent.paidAt = new Date();
    rent.paymentMethod = paymentMethod || "cash";
    rent.transactionId = transactionId || "";
    rent.status = paidAmount >= rent.amount + (rent.lateFee || 0) ? "paid" : "partial";

    await allocation.save();

    // Notify tenant
    await Notification.create({
      userId: allocation.tenantId,
      type: "rent_received",
      title: "Rent Payment Received",
      message: `Your rent payment of ₹${paidAmount} for ${allocation.pgName}, Room ${allocation.roomNumber} has been recorded.`,
      relatedId: allocation._id,
      relatedType: "allocation",
      priority: "low",
    });

    return NextResponse.json({
      success: true,
      message: "Rent payment recorded",
      data: allocation.rentHistory[rentIndex],
    });
  } catch (error) {
    console.error("Record rent payment error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}