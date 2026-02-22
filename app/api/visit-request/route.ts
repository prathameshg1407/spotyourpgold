// app/api/visit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import VisitRequest from "@/models/visitRequest";
import authUser from "@/actions/authUser";
import { sendVisitRequestToOwner } from "@/services/sendWhatsAppNotification"; // ✅ IMPORT NEW FUNCTION
import Listing from "@/models/listing";
import User from "@/models/user";

// Create a new visit request
export async function POST(req: NextRequest) {
  try {
    await connectToDB();

    const {
      name,
      phone,
      listingId,
      preferredDate,
      preferredTime,
      message,
      consent,
    } = await req.json();

    // Validate required fields
    if (
      !name ||
      !phone ||
      !listingId ||
      !preferredDate ||
      !preferredTime ||
      !consent
    ) {
      return NextResponse.json({
        success: false,
        message:
          "All required fields must be provided and consent must be given.",
      });
    }

    // Validate phone number format
    if (!/^[0-9]{10}$/.test(phone)) {
      return NextResponse.json({
        success: false,
        message: "Phone number must be exactly 10 digits.",
      });
    }

    // Validate date (should be in future)
    const visitDate = new Date(preferredDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (visitDate < today) {
      return NextResponse.json({
        success: false,
        message: "Visit date must be today or in the future.",
      });
    }

    // Get user if authenticated
    let userId = null;
    try {
      const user = await authUser();
      userId = user?.id || null;
    } catch (error) {
      // User not authenticated, continue as anonymous
    }

    // Get IP address
    const forwarded = req.headers.get("x-forwarded-for");
    const ipAddress = forwarded
      ? forwarded.split(",")[0]
      : req.headers.get("x-real-ip") || "unknown";

    // Create visit request
    const visitRequest = new VisitRequest({
      name,
      phone,
      listingId,
      preferredDate: visitDate,
      preferredTime,
      message: message || "",
      consent,
      userId,
      ipAddress,
    });

    await visitRequest.save();

    // ✅ Notify Owner via AiSensy WhatsApp
    try {
      const listing = await Listing.findById(listingId).populate("ownerId", "fullName phone");
      
      if (listing && listing.ownerId?.phone) {
        
        await sendVisitRequestToOwner({
          ownerPhone: listing.ownerId.phone,
          ownerName: listing.ownerId.fullName || "Owner",
          ownerId: listing.ownerId._id.toString(),
          pgName: listing.pgName || "Your Property",
          visitorName: name,
          visitorPhone: phone,
          visitDate: visitDate,
          visitTime: preferredTime
        });

      } else {
        console.warn(`Could not send WhatsApp: Owner phone missing for listing ${listingId}`);
      }
    } catch (notifyError) {
      console.error("Failed to send WhatsApp notification:", notifyError);
      // Don't modify response, notification failure shouldn't fail the request
    }

    return NextResponse.json({
      success: true,
      message:
        "Visit request submitted successfully! The property owner will contact you soon.",
      data: {
        id: visitRequest._id,
        preferredDate: visitRequest.preferredDate,
        preferredTime: visitRequest.preferredTime,
      },
    });
  } catch (error) {
    console.error("Visit request error:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to submit visit request. Please try again later.",
    });
  }
}

// Check if user has visited this property before
export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");
    const listingId = searchParams.get("listingId");

    if (!phone || !listingId) {
      return NextResponse.json({
        success: false,
        message: "Phone number and listing ID are required.",
      });
    }

    // Check if this phone number has visited this property before
    const existingVisit = await VisitRequest.findOne({
      phone,
      listingId,
      status: { $in: ["confirmed", "completed"] }, // Only count confirmed/completed visits
    });

    return NextResponse.json({
      success: true,
      hasVisited: !!existingVisit,
      message: existingVisit
        ? "You have visited this property before."
        : "This would be your first visit to this property.",
    });
  } catch (error) {
    console.error("Visit check error:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to check visit history.",
    });
  }
}