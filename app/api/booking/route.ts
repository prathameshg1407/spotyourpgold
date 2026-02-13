import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import mongoose from "mongoose";
import Booking from "@/models/booking";
import Listing from "@/models/listing";
import User from "@/models/user";
import Notification from "@/models/notification";
import Coupon from "@/models/coupon";
import { createRazorpayOrder } from "@/lib/razorpay";
import {
  sendNewBookingRequestToOwner,
  sendBookingConfirmationToTenant,
} from "@/services/sendWhatsAppNotification";

export async function POST(req: NextRequest) {
  const session = await mongoose.startSession();

  try {
    await connectToDB();

    const body = await req.json();
    const {
      userId,
      listingId,
      roomType,
      moveInDate,
      duration,
      fullName,
      phoneNumber,
      email,
      address,
      aadhaarNumber,
      additionalRequirements,
      termsAccepted,
      couponCode,
      paymentMethod = "online",
    } = body;

    // Validate required fields
    if (!userId || !listingId || !roomType || !moveInDate || !duration) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!fullName || !phoneNumber || !email || !address) {
      return NextResponse.json(
        { success: false, message: "Missing personal information" },
        { status: 400 }
      );
    }

    if (!termsAccepted) {
      return NextResponse.json(
        { success: false, message: "Terms and conditions must be accepted" },
        { status: 400 }
      );
    }

    session.startTransaction();

    // Get listing details with owner information
    const listing = await Listing.findById(listingId)
      .populate("ownerId", "fullName email phone")
      .session(session);
      
    if (!listing) {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, message: "Listing not found" },
        { status: 404 }
      );
    }

    // Find the selected room type
    const selectedRoom = listing.roomTypes.find(
      (room: any) => room.type === roomType
    );
    if (!selectedRoom || selectedRoom.availableRooms < 1) {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, message: "Selected room type not available" },
        { status: 400 }
      );
    }

    // Calculate amounts
    const monthlyRent = selectedRoom.monthlyRent;
    const securityDeposit = selectedRoom.securityDeposit;

    // Validate and apply coupon if provided
    let discountAmount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        name: couponCode.toUpperCase(),
        isActive: true,
      }).session(session);

      if (coupon) {
        if (!coupon.validUntil || new Date() <= new Date(coupon.validUntil)) {
          if (!coupon.maxUsage || coupon.usageCount < coupon.maxUsage) {
            discountAmount = Math.round((monthlyRent * coupon.percentage) / 100);
            appliedCoupon = coupon;
          }
        }
      }
    }

    // Calculate final amounts
    const finalMonthlyRent = monthlyRent - discountAmount;
    const bookingFeeAmount = Math.round(finalMonthlyRent * 0.1);
    const firstMonthRentAmount = Math.round(finalMonthlyRent * 0.9);

    // Create booking
    const booking = new Booking({
      userId: new mongoose.Types.ObjectId(userId),
      listingId: new mongoose.Types.ObjectId(listingId),
      ownerId: listing.ownerId._id,
      roomType,
      moveInDate: new Date(moveInDate),
      duration,
      fullName,
      phoneNumber,
      email,
      address,
      aadhaarNumber: aadhaarNumber || "",
      additionalRequirements: additionalRequirements || "",
      termsAccepted,
      paymentMethod,
      monthlyRent: finalMonthlyRent,
      
      // Payment Structure
      bookingFee: {
        amount: bookingFeeAmount,
        status: "pending",
      },
      
      securityDeposit: {
        amount: securityDeposit,
        status: "pending",
      },
      
      firstMonthRent: {
        amount: firstMonthRentAmount,
        status: "pending",
      },
      
      // Discount details
      originalAmount: monthlyRent,
      discountAmount,
      couponCode: couponCode || null,
      
      // Totals
      totalDue: bookingFeeAmount + securityDeposit + firstMonthRentAmount,
      totalPaid: 0,
      status: "pending",
    });

    await booking.save({ session });

    // Increment coupon usage if applied
    if (appliedCoupon) {
      await Coupon.findByIdAndUpdate(
        appliedCoupon._id,
        { $inc: { usageCount: 1 } },
        { session }
      );
    }

    let razorpayOrder = null;

    // Create Razorpay order only for online payment
    if (paymentMethod === "online") {
      try {
        razorpayOrder = await createRazorpayOrder({
          amount: bookingFeeAmount,
          receipt: `BOOKING_FEE_${booking._id}`,
          notes: {
            bookingId: booking._id.toString(),
            userId: userId,
            listingId: listingId,
            paymentType: "booking_fee",
            pgName: listing.pgName,
          },
        });

        // Store Razorpay order ID
        booking.bookingFee.razorpayOrderId = razorpayOrder.id;
        await booking.save({ session });
      } catch (error) {
        await session.abortTransaction();
        console.error("Razorpay order creation error:", error);
        return NextResponse.json(
          { success: false, message: "Failed to create payment order" },
          { status: 500 }
        );
      }
    }

    // Create notification for owner
    await Notification.create(
      [
        {
          userId: listing.ownerId._id,
          type: "booking_request",
          title: "New Booking Request",
          message: `New ${paymentMethod === "cash" ? "cash" : "online"} booking request for ${
            listing.pgName
          } from ${fullName}.`,
          relatedId: booking._id,
          relatedType: "booking",
          priority: "high",
          metadata: {
            listingName: listing.pgName,
            tenantName: fullName,
            tenantPhone: phoneNumber,
            paymentMethod,
            bookingFee: bookingFeeAmount,
            securityDeposit,
            firstMonthRent: firstMonthRentAmount,
            totalAmount: booking.totalDue,
          },
        },
      ],
      { session }
    );

    // Commit transaction before sending WhatsApp (non-critical operation)
    await session.commitTransaction();

    // Send WhatsApp notifications (non-blocking)
    const sendNotifications = async () => {
      try {
        // Send to owner
        if (listing.ownerId?.phone) {
          await sendNewBookingRequestToOwner({
            ownerPhone: listing.ownerId.phone,
            ownerName: listing.ownerId.fullName || "Owner",
            ownerId: listing.ownerId._id.toString(),
            pgLocation: listing.location?.area || listing.location?.city || "Your PG",
            tenantName: fullName,
            tenantPhone: phoneNumber,
            roomType: roomType,
            moveInDate: moveInDate,
            bookingFee: bookingFeeAmount,
            paymentMethod: paymentMethod,
          });
          console.log("[WhatsApp] Owner notification sent successfully");
        }

        // Send to tenant
        await sendBookingConfirmationToTenant({
          tenantPhone: phoneNumber,
          tenantName: fullName,
          tenantId: userId,
          pgName: listing.pgName,
          roomType: roomType,
          moveInDate: moveInDate,
          totalAmount: booking.totalDue,
          bookingId: booking._id.toString(),
          paymentMethod: paymentMethod,
        });
        console.log("[WhatsApp] Tenant confirmation sent successfully");
      } catch (error) {
        console.error("[WhatsApp] Failed to send notifications:", error);
        // Don't throw - notifications are non-critical
      }
    };

    // Send notifications asynchronously
    sendNotifications();

    return NextResponse.json({
      success: true,
      message: "Booking request submitted successfully",
      data: {
        booking: {
          _id: booking._id,
          status: booking.status,
          paymentBreakdown: {
            bookingFee: booking.bookingFee,
            securityDeposit: booking.securityDeposit,
            firstMonthRent: booking.firstMonthRent,
          },
          totalDue: booking.totalDue,
          totalPaid: booking.totalPaid,
        },
        razorpayOrder:
          paymentMethod === "online"
            ? {
                orderId: razorpayOrder?.id,
                amount: bookingFeeAmount,
                currency: "INR",
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
              }
            : null,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Booking creation error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    session.endSession();
  }
}

// GET - Fetch user bookings
export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    const query: any = { userId: new mongoose.Types.ObjectId(userId) };
    
    if (status && status !== "all") {
      query.status = status;
    }

    const totalCount = await Booking.countDocuments(query);
    
    const bookings = await Booking.find(query)
      .populate({
        path: "listingId",
        select: "pgName location primaryImage roomTypes amenities",
      })
      .populate({
        path: "ownerId",
        model: "User",
        select: "fullName email phone",
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Format bookings with payment breakdown
    const formattedBookings = bookings.map((booking) => ({
      ...booking.toObject(),
      paymentBreakdown: {
        bookingFee: booking.bookingFee || {},
        securityDeposit: booking.securityDeposit || {},
        firstMonthRent: booking.firstMonthRent || {},
      },
      canPayRemaining:
        booking.status === "confirmed" &&
        booking.bookingFee?.status === "paid" &&
        (booking.securityDeposit?.status === "pending" ||
          booking.firstMonthRent?.status === "pending"),
    }));

    return NextResponse.json({
      success: true,
      data: formattedBookings,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Get bookings error:", error);
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

// DELETE - Cancel booking
export async function DELETE(req: NextRequest) {
  const session = await mongoose.startSession();

  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("id");
    const userId = searchParams.get("userId");

    if (!bookingId || !userId) {
      return NextResponse.json(
        { success: false, message: "Booking ID and User ID are required" },
        { status: 400 }
      );
    }

    session.startTransaction();

    const booking = await Booking.findOne({
      _id: bookingId,
      userId: userId,
    }).session(session);

    if (!booking) {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Only allow cancellation if booking is pending and no payment made
    if (booking.status !== "pending" || booking.totalPaid > 0) {
      await session.abortTransaction();
      return NextResponse.json(
        {
          success: false,
          message: "Only pending bookings without payment can be cancelled",
        },
        { status: 400 }
      );
    }

    // Update booking status
    booking.status = "cancelled";
    booking.cancelledAt = new Date();
    booking.cancellationReason = "Cancelled by user";
    await booking.save({ session });

    // Create notification for owner
    await Notification.create(
      [
        {
          userId: booking.ownerId,
          type: "booking_cancelled",
          title: "Booking Cancelled",
          message: `Booking for ${booking.fullName} has been cancelled.`,
          relatedId: booking._id,
          relatedType: "booking",
          priority: "medium",
        },
      ],
      { session }
    );

    await session.commitTransaction();

    return NextResponse.json({
      success: true,
      message: "Booking cancelled successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Delete booking error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to cancel booking",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    session.endSession();
  }
}