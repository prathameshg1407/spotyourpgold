// app/api/listing/progress/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import PGListingProgress from "@/models/pgListingProgress";
import authUser from "@/actions/authUser";

// Type for the lean document
interface ProgressDocument {
  _id: any;
  userId: string;
  formData: {
    pgName?: string;
    primaryLine?: string;
    type?: string;
    subType?: string;
    roomTypes?: any[];
    genderPreference?: string;
    isCoLiving?: boolean;
    additionalDetails?: string[];
    location?: {
      area?: string;
      city?: string;
      state?: string;
      pincode?: string;
      nearbyPlaces?: string[];
      nearbyPlacesInput?: string;
      coordinates?: {
        type?: string;
        coordinates?: [number, number];
        lat?: number;
        lng?: number;
      };
    };
    rulesAndRegulations?: string[];
    detailedRules?: any;
    amenities?: string[];
    customAmenities?: string;
    images?: string[];
    existingImageUrls?: string[];
    videos?: string[];
    existingVideoUrls?: string[];
    foodIncluded?: boolean;
    electricityIncluded?: boolean;
    maintenanceIncluded?: boolean;
    mealTimings?: any;
    monthlyRent?: number;
    minRent?: number;
    securityDeposit?: number;
    numberOfRooms?: number;
    capacityPerRoom?: number;
  };
  currentStep: number;
  totalSteps: number;
  isCompleted: boolean;
  lastSavedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  __v?: number;
}

// Helper function to sanitize images array
function sanitizeImages(images: unknown): string[] {
  if (!images) return [];
  
  if (typeof images === 'string') {
    try {
      images = JSON.parse(images);
    } catch {
      return [];
    }
  }
  
  if (!Array.isArray(images)) return [];
  
  return images
    .map((img) => {
      if (typeof img === 'string' && img.length > 0) return img;
      if (img && typeof img === 'object' && 'url' in img && img.url) return img.url as string;
      return null;
    })
    .filter((url): url is string => typeof url === 'string' && url.length > 0);
}

// Helper function to convert lat/lng to GeoJSON format (for SAVING)
function toGeoJSON(coordinates: any): { type: "Point"; coordinates: [number, number] } {
  let lng = 0;
  let lat = 0;

  if (coordinates) {
    // Format: { lat, lng } or { latitude, longitude }
    if (typeof coordinates.lat === 'number' || typeof coordinates.lng === 'number') {
      lng = coordinates.lng ?? coordinates.longitude ?? 0;
      lat = coordinates.lat ?? coordinates.latitude ?? 0;
    }
    // Format: { latitude, longitude }
    else if (typeof coordinates.latitude === 'number' || typeof coordinates.longitude === 'number') {
      lng = coordinates.longitude ?? 0;
      lat = coordinates.latitude ?? 0;
    }
    // Already GeoJSON format: { type: "Point", coordinates: [lng, lat] }
    else if (coordinates.type === 'Point' && Array.isArray(coordinates.coordinates)) {
      lng = coordinates.coordinates[0] ?? 0;
      lat = coordinates.coordinates[1] ?? 0;
    }
  }

  console.log("📍 toGeoJSON input:", JSON.stringify(coordinates));
  console.log("📍 toGeoJSON output:", { type: "Point", coordinates: [lng, lat] });
  
  return {
    type: "Point",
    coordinates: [lng, lat],
  };
}

// Helper function to convert GeoJSON back to lat/lng format (for RETURNING)
function fromGeoJSON(coordinates: any): { lat: number; lng: number } {
  let lat = 0;
  let lng = 0;

  if (coordinates) {
    // GeoJSON format: { type: "Point", coordinates: [lng, lat] }
    if (coordinates.type === 'Point' && Array.isArray(coordinates.coordinates)) {
      lng = coordinates.coordinates[0] ?? 0;
      lat = coordinates.coordinates[1] ?? 0;
    }
    // Already in lat/lng format
    else if (typeof coordinates.lat === 'number' || typeof coordinates.lng === 'number') {
      lat = coordinates.lat ?? 0;
      lng = coordinates.lng ?? 0;
    }
    // Array format [lng, lat]
    else if (Array.isArray(coordinates) && coordinates.length >= 2) {
      lng = coordinates[0] ?? 0;
      lat = coordinates[1] ?? 0;
    }
  }

  console.log("📍 fromGeoJSON input:", JSON.stringify(coordinates));
  console.log("📍 fromGeoJSON output:", { lat, lng });

  return { lat, lng };
}

// Helper function to normalize location data for frontend
function normalizeLocationForFrontend(location: any): any {
  if (!location) {
    return {
      area: '',
      city: '',
      state: '',
      pincode: '',
      nearbyPlaces: [],
      nearbyPlacesInput: '',
      coordinates: { lat: 0, lng: 0 },
    };
  }

  return {
    area: location.area || '',
    city: location.city || '',
    state: location.state || '',
    pincode: location.pincode || '',
    nearbyPlaces: Array.isArray(location.nearbyPlaces) ? location.nearbyPlaces : [],
    nearbyPlacesInput: location.nearbyPlacesInput || '',
    coordinates: fromGeoJSON(location.coordinates),
  };
}

// Helper function to normalize full formData for frontend
function normalizeFormDataForFrontend(formData: any): any {
  if (!formData) return null;

  return {
    ...formData,
    location: normalizeLocationForFrontend(formData.location),
    roomTypes: Array.isArray(formData.roomTypes) ? formData.roomTypes : [],
    additionalDetails: Array.isArray(formData.additionalDetails) ? formData.additionalDetails : [],
    rulesAndRegulations: Array.isArray(formData.rulesAndRegulations) ? formData.rulesAndRegulations : [],
    amenities: Array.isArray(formData.amenities) ? formData.amenities : [],
    images: Array.isArray(formData.images) ? formData.images : [],
    existingImageUrls: Array.isArray(formData.existingImageUrls) ? formData.existingImageUrls : [],
    videos: Array.isArray(formData.videos) ? formData.videos : [],
    existingVideoUrls: Array.isArray(formData.existingVideoUrls) ? formData.existingVideoUrls : [],
  };
}

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

    console.log("🔍 Searching for progress for user:", user.id);
    
    // ✅ FIX: Type cast the lean result properly
    const progress = await PGListingProgress.findOne({
      userId: user.id,
      isCompleted: false,
    })
      .sort({ lastSavedAt: -1 })
      .lean<ProgressDocument>()
      .exec();

    if (!progress) {
      console.log("ℹ️ No progress found for user");
      return NextResponse.json({
        success: true,
        message: "No saved progress found",
        data: null,
      });
    }

    // ✅ DEBUG: Log raw coordinates from database
    console.log("📍 RAW coordinates from DB:", JSON.stringify(progress.formData?.location?.coordinates, null, 2));

    // ✅ Normalize formData for frontend (converts GeoJSON to lat/lng)
    const normalizedProgress = {
      ...progress,
      formData: normalizeFormDataForFrontend(progress.formData),
    };

    // ✅ DEBUG: Log converted coordinates
    console.log("📍 CONVERTED coordinates for frontend:", JSON.stringify(normalizedProgress.formData?.location?.coordinates, null, 2));

    console.log("✅ Returning normalized progress");
    
    return NextResponse.json({
      success: true,
      message: "Progress fetched successfully",
      data: normalizedProgress,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[GET_PROGRESS_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch progress",
        error: errorMessage,
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
    
    console.log("📥 Received currentStep:", currentStep);
    console.log("📍 Received coordinates:", JSON.stringify(formData?.location?.coordinates, null, 2));

    if (!formData || !currentStep || !totalSteps) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields",
        },
        { status: 400 }
      );
    }

    // ✅ Convert coordinates to GeoJSON for storage
    const geoJSONCoordinates = toGeoJSON(formData.location?.coordinates);
    console.log("📍 Converted to GeoJSON:", JSON.stringify(geoJSONCoordinates, null, 2));

    // Sanitize and validate form data
    const sanitizedFormData = {
      pgName: formData.pgName || "",
      primaryLine: formData.primaryLine || "",
      type: formData.type || "",
      subType: formData.subType || "",
      roomTypes: (formData.roomTypes || []).map((room: any) => ({
        type: room.type || "",
        isAC: room.isAC || false,
        numberOfRooms: room.numberOfRooms || 0,
        availableRooms: room.availableRooms || 0,
        capacityPerRoom: room.capacityPerRoom || 0,
        monthlyRent: room.monthlyRent || 0,
        securityDeposit: room.securityDeposit || 0,
      })),
      genderPreference: formData.genderPreference || "unisex",
      isCoLiving: formData.isCoLiving || false,
      additionalDetails: formData.additionalDetails || [],
      location: {
        area: formData.location?.area || "",
        city: formData.location?.city || "",
        state: formData.location?.state || "",
        pincode: formData.location?.pincode || "",
        nearbyPlaces: formData.location?.nearbyPlaces || [],
        coordinates: geoJSONCoordinates,
      },
      rulesAndRegulations: formData.rulesAndRegulations || [],
      detailedRules: {
        lockInPeriod: formData.detailedRules?.lockInPeriod || "",
        noticePeriod: formData.detailedRules?.noticePeriod || "",
        maintenanceCharges: formData.detailedRules?.maintenanceCharges || "",
        entryTiming: formData.detailedRules?.entryTiming || "",
        exitTiming: formData.detailedRules?.exitTiming || "",
        guestStayPolicy: formData.detailedRules?.guestStayPolicy || "",
        smokingAlcoholPolicy: formData.detailedRules?.smokingAlcoholPolicy || "",
      },
      amenities: formData.amenities || [],
      customAmenities: formData.customAmenities || "",
      images: sanitizeImages(formData.images),
      existingImageUrls: sanitizeImages(formData.existingImageUrls),
      videos: sanitizeImages(formData.videos),
      existingVideoUrls: sanitizeImages(formData.existingVideoUrls),
      foodIncluded: formData.foodIncluded || false,
      electricityIncluded: formData.electricityIncluded || false,
      maintenanceIncluded: formData.maintenanceIncluded || false,
      mealTimings: {
        morning: { 
          enabled: formData.mealTimings?.morning?.enabled || false, 
          from: formData.mealTimings?.morning?.from || "", 
          to: formData.mealTimings?.morning?.to || "" 
        },
        noon: { 
          enabled: formData.mealTimings?.noon?.enabled || false, 
          from: formData.mealTimings?.noon?.from || "", 
          to: formData.mealTimings?.noon?.to || "" 
        },
        evening: { 
          enabled: formData.mealTimings?.evening?.enabled || false, 
          from: formData.mealTimings?.evening?.from || "", 
          to: formData.mealTimings?.evening?.to || "" 
        },
        night: { 
          enabled: formData.mealTimings?.night?.enabled || false, 
          from: formData.mealTimings?.night?.from || "", 
          to: formData.mealTimings?.night?.to || "" 
        },
      },
      monthlyRent: formData.monthlyRent || 0,
      minRent: formData.minRent || 0,
      securityDeposit: formData.securityDeposit || 0,
      numberOfRooms: formData.numberOfRooms || 0,
      capacityPerRoom: formData.capacityPerRoom || 0,
    };

    console.log("🧹 Sanitized coordinates:", JSON.stringify(sanitizedFormData.location.coordinates, null, 2));

    const existingProgress = await PGListingProgress.findOne({
      userId: user.id,
      isCompleted: false,
    });

    let progress;

    if (existingProgress) {
      progress = await PGListingProgress.findByIdAndUpdate(
        existingProgress._id,
        {
          formData: sanitizedFormData,
          currentStep,
          totalSteps,
          isCompleted,
          lastSavedAt: new Date(),
        },
        { new: true, runValidators: false }
      );
      console.log("✅ Updated existing progress");
    } else {
      progress = await PGListingProgress.create({
        userId: user.id,
        formData: sanitizedFormData,
        currentStep,
        totalSteps,
        isCompleted,
        lastSavedAt: new Date(),
      });
      console.log("✅ Created new progress");
    }

    // ✅ Return normalized data with lat/lng format for frontend
    const responseData = progress?.toObject ? progress.toObject() : progress;
    
    if (responseData) {
      responseData.formData = normalizeFormDataForFrontend(responseData.formData);
    }

    return NextResponse.json({
      success: true,
      message: "Progress saved successfully",
      data: responseData,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[SAVE_PROGRESS_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to save progress",
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

// DELETE - Clear user's PG listing progress
export async function DELETE(req: NextRequest) {
  try {
    console.log("🗑️ DELETE /api/listing/progress - Clearing progress...");
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

    const result = await PGListingProgress.deleteMany({
      userId: user.id,
      isCompleted: false,
    });

    console.log("✅ Deleted", result.deletedCount, "progress records");

    return NextResponse.json({
      success: true,
      message: "Progress cleared successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[CLEAR_PROGRESS_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to clear progress",
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}