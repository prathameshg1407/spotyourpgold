import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import PGListingProgress from "@/models/pgListingProgress";
import authUser from "@/actions/authUser";

// GET - Fetch user's PG listing progress
export async function GET(req: NextRequest) {
  try {
    console.log("🔍 GET /api/listing/progress - Fetching progress...");
    await connectToDB();
    const user = await authUser();
    console.log("👤 User:", user ? "authenticated" : "not authenticated");

    if (!user) {
      console.log("❌ No user found, returning 401");
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required",
        },
        { status: 401 }
      );
    }

    // Get the most recent progress for the user
    console.log("🔍 Searching for progress for user:", user.id);
    const progress = await PGListingProgress.findOne({
      userId: user.id,
      isCompleted: false,
    })
      .sort({ lastSavedAt: -1 })
      .lean();

    console.log("📊 Found progress:", progress);

    if (!progress) {
      console.log("ℹ️ No progress found for user");
      return NextResponse.json({
        success: true,
        message: "No saved progress found",
        data: null,
      });
    }

    console.log("✅ Returning progress:", progress);
    return NextResponse.json({
      success: true,
      message: "Progress fetched successfully",
      data: progress,
    });
  } catch (error: any) {
    console.error("[GET_PROGRESS_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch progress",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// POST - Save PG listing progress
export async function POST(req: NextRequest) {
  try {
    console.log("💾 POST /api/listing/progress - Saving progress...");
    await connectToDB();
    const user = await authUser();
    console.log("👤 User:", user ? "authenticated" : "not authenticated");

    if (!user) {
      console.log("❌ No user found, returning 401");
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required",
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { formData, currentStep, totalSteps, isCompleted = false } = body;
    console.log("📥 Received data:", {
      formData,
      currentStep,
      totalSteps,
      isCompleted,
    });

    if (!formData || !currentStep || !totalSteps) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields",
        },
        { status: 400 }
      );
    }

    // Sanitize and validate form data to prevent validation errors
    const sanitizedFormData = {
      ...formData,
      // Ensure roomTypes has proper structure - keep original data but ensure defaults
      roomTypes: (formData.roomTypes || []).map((room: any) => ({
        type: room.type || "",
        numberOfRooms: room.numberOfRooms || 0,
        availableRooms: room.availableRooms || 0,
        capacityPerRoom: room.capacityPerRoom || 0,
        monthlyRent: room.monthlyRent || 0,
        securityDeposit: room.securityDeposit || 0,
      })),
      // Ensure other required fields have defaults
      pgName: formData.pgName || "",
      primaryLine: formData.primaryLine || "",
      type: formData.type || "",
      subType: formData.subType || "",
      genderPreference: formData.genderPreference || "both",
      additionalDetails: formData.additionalDetails || [],
      location: {
        area: formData.location?.area || "",
        city: formData.location?.city || "",
        state: formData.location?.state || "",
        pincode: formData.location?.pincode || "",
        nearbyPlaces: formData.location?.nearbyPlaces || [],
        nearbyPlacesInput: formData.location?.nearbyPlacesInput || "",
        coordinates: formData.location?.coordinates || {
          lat: 30.7333,
          lng: 76.7794,
        },
      },
      rulesAndRegulations: formData.rulesAndRegulations || [],
      newRuleInput: formData.newRuleInput || "",
      detailedRules: {
        lockInPeriod: formData.detailedRules?.lockInPeriod || "",
        noticePeriod: formData.detailedRules?.noticePeriod || "",
        maintenanceCharges: formData.detailedRules?.maintenanceCharges || "",
        entryTiming: formData.detailedRules?.entryTiming || "",
        exitTiming: formData.detailedRules?.exitTiming || "",
        guestStayPolicy: formData.detailedRules?.guestStayPolicy || "",
        smokingAlcoholPolicy:
          formData.detailedRules?.smokingAlcoholPolicy || "",
      },
      amenities: formData.amenities || [],
      customAmenities: formData.customAmenities || "",
      images: formData.images || [],
      existingImageUrls: formData.existingImageUrls || [],
      videos: formData.videos || [],
      existingVideoUrls: formData.existingVideoUrls || [],
      foodIncluded: formData.foodIncluded || false,
      electricityIncluded: formData.electricityIncluded || false,
      maintenanceIncluded: formData.maintenanceIncluded || false,
      mealTimings: {
        morning: { enabled: false, from: "07:00", to: "09:00" },
        noon: { enabled: false, from: "12:00", to: "14:00" },
        evening: { enabled: false, from: "18:00", to: "20:00" },
        night: { enabled: false, from: "21:00", to: "23:00" },
        ...formData.mealTimings,
      },
      monthlyRent: formData.monthlyRent || 0,
      minRent: formData.minRent || 0,
      securityDeposit: formData.securityDeposit || 0,
      numberOfRooms: formData.numberOfRooms || 0,
      capacityPerRoom: formData.capacityPerRoom || 0,
    };

    console.log("🧹 Sanitized form data:", sanitizedFormData);

    // Check if there's existing progress for this user
    const existingProgress = await PGListingProgress.findOne({
      userId: user.id,
      isCompleted: false,
    });

    let progress;

    if (existingProgress) {
      // Update existing progress
      progress = await PGListingProgress.findByIdAndUpdate(
        existingProgress._id,
        {
          formData: sanitizedFormData,
          currentStep,
          totalSteps,
          isCompleted,
          lastSavedAt: new Date(),
        },
        { new: true, runValidators: false } // Disable validation for progress saving
      );
    } else {
      // Create new progress
      progress = await PGListingProgress.create({
        userId: user.id,
        formData: sanitizedFormData,
        currentStep,
        totalSteps,
        isCompleted,
        lastSavedAt: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      message: "Progress saved successfully",
      data: progress,
    });
  } catch (error: any) {
    console.error("[SAVE_PROGRESS_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to save progress",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// DELETE - Clear user's PG listing progress
export async function DELETE(req: NextRequest) {
  try {
    await connectToDB();
    const user = await authUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required",
        },
        { status: 401 }
      );
    }

    // Delete all incomplete progress for this user
    await PGListingProgress.deleteMany({
      userId: user.id,
      isCompleted: false,
    });

    return NextResponse.json({
      success: true,
      message: "Progress cleared successfully",
    });
  } catch (error: any) {
    console.error("[CLEAR_PROGRESS_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to clear progress",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
