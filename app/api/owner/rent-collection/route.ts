// app/api/owner/rent-collection/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import TenantAllocation from "@/models/tenantAllocation";
import Commission from "@/models/commission";
import Notification from "@/models/notification";
import Listing from "@/models/listing";
import User from "@/models/user";
import { authUser } from "@/actions/authUser";

// GET - Get all rent collection status for owner
export async function GET(req: NextRequest) {
  try {
    await connectToDB();
    const user = await authUser();

    if (!user || (user.role !== "owner" && user.role !== "admin")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all"; // all, pending, paid, overdue
    const listingId = searchParams.get("listingId");

    // Get owner's listings
    const listings = await Listing.find({ ownerId: user.id }).select("_id pgName");
    const listingIds = listingId ? [listingId] : listings.map((l) => l._id);

    // Get all active allocations
    const allocations = await TenantAllocation.find({
      listingId: { $in: listingIds },
      status: { $in: ["active", "notice_period"] },
    })
      .populate("tenantId", "fullName email phone")
      .populate("listingId", "pgName location")
      .sort({ createdAt: -1 });

    // Process and flatten rent history
    const rentRecords: any[] = [];

    allocations.forEach((allocation: any) => {
      allocation.rentHistory.forEach((rent: any, index: number) => {
        // Filter by status if specified
        if (status !== "all" && rent.status !== status) return;

        rentRecords.push({
          allocationId: allocation._id,
          rentId: rent._id || `${allocation._id}-${index}`,
          tenant: {
            id: allocation.tenantId?._id,
            name: allocation.tenantId?.fullName || "Unknown",
            email: allocation.tenantId?.email,
            phone: allocation.tenantId?.phone,
          },
          pg: {
            id: allocation.listingId?._id,
            name: allocation.pgName || allocation.listingId?.pgName,
          },
          room: {
            number: allocation.roomNumber,
            bed: allocation.bedNumber,
            type: allocation.roomType,
          },
          rent: {
            month: rent.month,
            amount: rent.amount,
            status: rent.status,
            paidAmount: rent.paidAmount,
            paidAt: rent.paidAt,
            dueDate: rent.dueDate,
            lateFee: rent.lateFee || 0,
            paymentMethod: rent.paymentMethod,
            transactionId: rent.transactionId,
          },
          monthlyRent: allocation.monthlyRent,
        });
      });
    });

    // Sort by due date (most recent first)
    rentRecords.sort(
      (a, b) => new Date(b.rent.dueDate).getTime() - new Date(a.rent.dueDate).getTime()
    );

    // Calculate summary
    const summary = {
      totalPending: rentRecords
        .filter((r) => r.rent.status === "pending")
        .reduce((acc, r) => acc + r.rent.amount, 0),
      totalOverdue: rentRecords
        .filter((r) => r.rent.status === "overdue")
        .reduce((acc, r) => acc + r.rent.amount + (r.rent.lateFee || 0), 0),
      totalPaid: rentRecords
        .filter((r) => r.rent.status === "paid")
        .reduce((acc, r) => acc + r.rent.paidAmount, 0),
      pendingCount: rentRecords.filter((r) => r.rent.status === "pending").length,
      overdueCount: rentRecords.filter((r) => r.rent.status === "overdue").length,
      paidCount: rentRecords.filter((r) => r.rent.status === "paid").length,
    };

    return NextResponse.json({
      success: true,
      data: rentRecords,
      summary,
      listings: listings.map((l) => ({ id: l._id, name: l.pgName })),
    });
  } catch (error) {
    console.error("Get rent collection error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Mark rent as collected (creates commission)
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
      rentMonth,
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

    const rent = allocation.rentHistory[rentIndex];
    const totalDue = rent.amount + (rent.lateFee || 0);

    // Update rent entry
    rent.paidAmount = paidAmount;
    rent.paidAt = new Date();
    rent.paymentMethod = paymentMethod || "cash";
    rent.transactionId = transactionId || "";
    rent.status = paidAmount >= totalDue ? "paid" : "partial";

    await allocation.save();

    // Create commission record (10% of rent collected)
    const commissionRate = 0.10; // 10%
    const commissionAmount = paidAmount * commissionRate;

    // Calculate due date (7 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    await Commission.create({
      ownerId: user.id,
      bookingId: allocation.bookingId,
      bookingAmount: paidAmount,
      commissionRate,
      commissionAmount,
      status: "pending",
      dueDate,
      notes: `Monthly rent for ${new Date(rentMonth).toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      })} - ${allocation.pgName}, Room ${allocation.roomNumber}`,
    });

    // Notify tenant
    await Notification.create({
      userId: allocation.tenantId,
      type: "rent_paid",
      title: "Rent Payment Recorded",
      message: `Your rent payment of ₹${paidAmount.toLocaleString()} for ${allocation.pgName}, Room ${allocation.roomNumber} has been recorded.`,
      relatedId: allocation._id,
      relatedType: "allocation",
      priority: "low",
    });

    // Notify admin about new commission
    const admins = await User.find({ role: "admin" }).select("_id");
    for (const admin of admins) {
      await Notification.create({
        userId: admin._id,
        type: "payment_reminder",
        title: "New Commission Pending",
        message: `Commission of ₹${commissionAmount.toLocaleString()} pending from ${user.fullName || "Owner"} for rent collection.`,
        relatedId: allocation.bookingId,
        relatedType: "booking",
        priority: "medium",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Rent payment recorded successfully",
      data: {
        rentStatus: rent.status,
        commissionCreated: commissionAmount,
      },
    });
  } catch (error) {
    console.error("Record rent collection error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}