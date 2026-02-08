// app/api/booking/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import mongoose from "mongoose";
import Booking from "@/models/booking";
import Listing from "@/models/listing";
import Notification from "@/models/notification";
import Coupon from "@/models/coupon";
import User from "@/models/user";
import { createRazorpayOrder } from "@/lib/razorpay";

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
      paymentMethod = "online", // Default to online
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

    // Get listing details
    const listing = await Listing.findById(listingId).session(session);
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
    if (!selectedRoom) {
      await session.abortTransaction();
      return NextResponse.json(
        { success: false, message: "Selected room type not found" },
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

      if (!coupon) {
        await session.abortTransaction();
        return NextResponse.json(
          { success: false, message: "Invalid coupon code" },
          { status: 400 }
        );
      }

      if (coupon.validUntil && new Date() > new Date(coupon.validUntil)) {
        await session.abortTransaction();
        return NextResponse.json(
          { success: false, message: "Coupon has expired" },
          { status: 400 }
        );
      }

      if (coupon.validFrom && new Date() < new Date(coupon.validFrom)) {
        await session.abortTransaction();
        return NextResponse.json(
          { success: false, message: "Coupon is not yet valid" },
          { status: 400 }
        );
      }

      if (coupon.maxUsage && coupon.usageCount >= coupon.maxUsage) {
        await session.abortTransaction();
        return NextResponse.json(
          { success: false, message: "Coupon usage limit exceeded" },
          { status: 400 }
        );
      }

      discountAmount = Math.round((monthlyRent * coupon.percentage) / 100);
      appliedCoupon = coupon;
    }

    // Calculate final amounts for 3-part payment
    const finalMonthlyRent = monthlyRent - discountAmount;
    const bookingFeeAmount = Math.round(finalMonthlyRent * 0.1); // 10% booking fee
    const firstMonthRentAmount = Math.round(finalMonthlyRent * 0.9); // 90% first month rent

    // Create booking with 3-part payment structure
    const booking = new Booking({
      userId: new mongoose.Types.ObjectId(userId),
      listingId: new mongoose.Types.ObjectId(listingId),
      ownerId: listing.ownerId,
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
      
      // Payment method
      paymentMethod,
      
      // Pricing
      monthlyRent: finalMonthlyRent,
      
      // 3-Part Payment Structure
      bookingFee: {
        amount: bookingFeeAmount,
        status: "pending",
        paidAt: null,
        paymentReference: "",
      },
      
      securityDeposit: {
        amount: securityDeposit,
        status: "pending",
        paidAt: null,
        paidTo: "",
        paymentReference: "",
        transferredToOwner: false,
      },
      
      firstMonthRent: {
        amount: firstMonthRentAmount,
        status: "pending",
        paidAt: null,
        paidTo: "",
        paymentReference: "",
        
        // For online payments
        ownerPayoutStatus: paymentMethod === "online" ? "pending" : "not_applicable",
        ownerPayoutAmount: paymentMethod === "online" ? firstMonthRentAmount : 0,
        
        // For cash payments
        adminCommissionStatus: paymentMethod === "cash" ? "pending" : "not_applicable",
        adminCommissionAmount: paymentMethod === "cash" ? bookingFeeAmount : 0,
      },
      
      // Discount details
      originalAmount: monthlyRent,
      discountAmount,
      couponCode: couponCode || null,
      
      // Totals
      totalDue: bookingFeeAmount + securityDeposit + firstMonthRentAmount,
      totalPaid: 0,
      
      // Status
      status: "pending",
    });

    await booking.save({ session });

    // Increment coupon usage count if coupon was applied
    if (appliedCoupon) {
      await Coupon.findByIdAndUpdate(
        appliedCoupon._id,
        { $inc: { usageCount: 1 } },
        { session }
      );
    }

    let razorpayOrder = null;

    // Create Razorpay order for booking fee (online payment)
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
    await Notification.create([{
      userId: listing.ownerId,
      type: "booking_request",
      title: "New Booking Request",
      message: `You have a new booking request for ${listing.pgName} from ${fullName}.`,
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
    }], { session });

    await session.commitTransaction();

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
        razorpayOrder: paymentMethod === "online" ? {
          orderId: razorpayOrder?.id,
          amount: bookingFeeAmount,
          currency: "INR",
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        } : null,
        nextStep: paymentMethod === "online" 
          ? "PAY_BOOKING_FEE" 
          : "WAIT_FOR_APPROVAL",
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

// GET - Fetch user bookings with owner details
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

    const bookings = await Booking.find({
      userId: new mongoose.Types.ObjectId(userId),
    })
      .populate({
        path: "listingId",
        select: "pgName location primaryImage roomTypes ownerId",
        populate: {
          path: "ownerId",
          model: "User",
          select: "fullName email phone",
        }
      })
      .populate({
        path: "ownerId",
        model: "User",
        select: "fullName email phone",
      })
      .sort({ createdAt: -1 });

    // Format bookings with payment breakdown and owner details
    const formattedBookings = bookings.map((booking) => {
      const bookingObj = booking.toObject();
      
      // Extract owner from ownerId field or from listing
      let ownerInfo = null;
      
      // First priority: direct ownerId field
      if (bookingObj.ownerId) {
        ownerInfo = bookingObj.ownerId;
      }
      // Second priority: owner from listing
      else if (bookingObj.listingId && bookingObj.listingId.ownerId) {
        ownerInfo = bookingObj.listingId.ownerId;
      }

      return {
        ...bookingObj,
        ownerId: ownerInfo, // Ensure owner is at root level
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
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedBookings,
      total: formattedBookings.length,
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

// DELETE - Cancel/Delete booking
export async function DELETE(req: NextRequest) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("id");

    if (!bookingId) {
      return NextResponse.json(
        { success: false, message: "Booking ID is required" },
        { status: 400 }
      );
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Only allow deletion if booking is pending
    if (booking.status !== "pending") {
      return NextResponse.json(
        { 
          success: false, 
          message: "Only pending bookings can be deleted. Please contact support for confirmed bookings." 
        },
        { status: 400 }
      );
    }

    await Booking.findByIdAndDelete(bookingId);

    return NextResponse.json({
      success: true,
      message: "Booking deleted successfully",
    });
  } catch (error) {
    console.error("Delete booking error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete booking",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// PUT - Update booking details
export async function PUT(req: NextRequest) {
  try {
    await connectToDB();

    const body = await req.json();
    const { bookingId, ...updateData } = body;

    if (!bookingId) {
      return NextResponse.json(
        { success: false, message: "Booking ID is required" },
        { status: 400 }
      );
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Only allow updates for pending bookings
    if (booking.status !== "pending") {
      return NextResponse.json(
        { 
          success: false, 
          message: "Only pending bookings can be edited" 
        },
        { status: 400 }
      );
    }

    // Update allowed fields
    const allowedFields = [
      'fullName',
      'phoneNumber',
      'email',
      'address',
      'aadhaarNumber',
      'additionalRequirements',
      'moveInDate',
      'duration',
      'roomType'
    ];

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        booking[field] = updateData[field];
      }
    });

    await booking.save();

    // Fetch updated booking with populated fields
    const updatedBooking = await Booking.findById(bookingId)
      .populate({
        path: "listingId",
        select: "pgName location primaryImage roomTypes ownerId",
        populate: {
          path: "ownerId",
          model: "User",
          select: "fullName email phone",
        }
      })
      .populate({
        path: "ownerId",
        model: "User",
        select: "fullName email phone",
      });

    return NextResponse.json({
      success: true,
      message: "Booking updated successfully",
      data: updatedBooking,
    });
  } catch (error) {
    console.error("Update booking error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update booking",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}