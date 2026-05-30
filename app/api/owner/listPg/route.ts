import authUser from "@/actions/authUser";
import Listing from "@/models/listing";
import User from "@/models/user";
import {
  deleteFromS3,
  uploadDataUriToS3,
} from "@/services/s3";
import { connectToDB } from "@/services/connectdb";
import { NextResponse } from "next/server";
import { generateListingSlug } from "@/lib/slug";
import mongoose from "mongoose";

export async function POST(req: Request) {
  let uploadedImages: any[] = [];
  let uploadedVideos: any[] = [];

  try {
    await connectToDB();
    const user = await authUser();

    if (user?.role == "user") {
      return NextResponse.json({
        success: false,
        message: "You are not authorized to perform this action.",
      });
    }

    // Parse request body with error handling
    let requestData;
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid request data. The request may be too large or malformed.",
        },
        { status: 400 }
      );
    }

    const {
      pgName,
      primaryLine,
      type,
      subType,
      roomTypes,
      genderPreference,
      additionalDetails,
      location,
      rulesAndRegulations,
      detailedRules,
      amenities,
      foodIncluded,
      electricityIncluded,
      maintenanceIncluded,
      mealTimings,
      images,
      videos = [],
    } = requestData;

    // Debug log for primaryLine
    if (process.env.NODE_ENV === "development") {
      console.log("API Debug - Received Primary Line:", primaryLine);
      console.log("API Debug - Primary Line Type:", typeof primaryLine);
      console.log("API Debug - Images count:", images?.length || 0);
      console.log("API Debug - Videos count:", videos?.length || 0);
    }

    // Validate payload size
    const payloadSize = JSON.stringify(requestData).length;
    const payloadSizeMB = payloadSize / (1024 * 1024);

    if (payloadSizeMB > 50) {
      console.error("Payload too large:", payloadSizeMB.toFixed(2), "MB");
      return NextResponse.json(
        {
          success: false,
          message: `Request payload is too large (${payloadSizeMB.toFixed(
            2
          )}MB). Please reduce the number or size of images/videos.`,
        },
        { status: 413 }
      );
    }

    // ✅ Basic validation
    if (
      !pgName?.trim() ||
      !Array.isArray(roomTypes) ||
      roomTypes.length === 0 ||
      !location?.city ||
      !location?.state ||
      !location?.pincode ||
      !location?.area ||
      !Array.isArray(images) ||
      images.length === 0 ||
      additionalDetails.length > 10 ||
      rulesAndRegulations.length > 10
    ) {
      return NextResponse.json({
        success: false,
        message: "Missing or invalid fields.",
      });
    }

    // Validate coordinates if provided
    if (location?.coordinates?.lat || location?.coordinates?.lng) {
      const lat = location.coordinates.lat;
      const lng = location.coordinates.lng;

      if (
        isNaN(lat) ||
        lat < -90 ||
        lat > 90 ||
        isNaN(lng) ||
        lng < -180 ||
        lng > 180
      ) {
        return NextResponse.json({
          success: false,
          message:
            "Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.",
        });
      }
    }

    // ✅ Validate roomTypes
    for (const room of roomTypes) {
      if (
        !room.type?.trim() ||
        typeof room.numberOfRooms !== "number" ||
        room.numberOfRooms < 1 ||
        typeof room.capacityPerRoom !== "number" ||
        room.capacityPerRoom < 1 ||
        typeof room.monthlyRent !== "number" ||
        room.monthlyRent < 0 ||
        typeof room.securityDeposit !== "number" ||
        room.securityDeposit < 0
      ) {
        return NextResponse.json({
          success: false,
          message: "Invalid room type details.",
        });
      }
    }

    if (pgName.length > 100 || images.length > 10) {
      return NextResponse.json({ success: false, message: "Input too long." });
    }

    const existingListing = await Listing.findOne({
      ownerId: user?.id,
      pgName,
    });

    if (existingListing) {
      return NextResponse.json({
        success: false,
        message: "PG already exists.",
      });
    }

    // ✅ Upload images to S3
        uploadedImages = await Promise.all(
            images.map(async (img: any) => {
                const imageString = typeof img === 'string' ? img : img.base64;
                const description = typeof img === 'string' ? '' : img.description;

                const { url, public_id } = await uploadDataUriToS3(
                    imageString,
                    "sypg/listing-images",
                    "sypgListingImages"
                );
                return { url, public_id, description };
            })
        );

    // ✅ Upload videos to S3 (if any)
    if (videos.length > 0) {
      uploadedVideos = await Promise.all(
        videos.map(async (video: string) => {
          const { url, public_id } = await uploadDataUriToS3(
            video,
            "sypg/listing-videos",
            "sypgListingVideos"
          );
          return { url, public_id };
        })
      );
    }

    const newLocation = {
      ...location,
      nearbyPlaces: location.nearbyPlaces || [],
      coordinates: {
        type: "Point",
        coordinates: [location.coordinates.lng, location.coordinates.lat],
      },
    };

    const updatedRoomTypes = roomTypes.map((room) => ({
      ...room,
      availableRooms: room.numberOfRooms,
    }));

    // Get owner details for slug generation
    const owner = await User.findById(user?.id).select("fullName").lean();
    const ownerName = (!owner || Array.isArray(owner)) ? "owner" : (owner.fullName || "owner");

    // Generate slug: pg-name-owner-name-area-city
    // We'll use a temporary ID first, then update after creation if needed
    const tempId = new mongoose.Types.ObjectId().toString();
    const slug = await generateListingSlug(
      pgName,
      ownerName,
      location.area,
      location.city,
      tempId
    );

    // ✅ Create new listing
    const pg = await Listing.create({
      ownerId: user?.id,
      slug, // Add slug
      pgName,
      primaryLine: primaryLine || undefined,
      type: type || undefined,
      subType: subType || undefined,
      roomTypes: updatedRoomTypes,
      genderPreference,
      additionalDetails,
      location: newLocation,
      rulesAndRegulations,
      detailedRules: detailedRules || {
        lockInPeriod: "",
        noticePeriod: "",
        maintenanceCharges: "",
        entryTiming: "",
        exitTiming: "",
        guestStayPolicy: "",
        smokingAlcoholPolicy: "",
      },
      amenities,
      paymentStatus: user?.role === "owner" ? "pending" : "completed",
      isApproved: user?.role === "owner" ? false : true,
      rentInclusions: {
        foodIncluded,
        electricityIncluded,
        maintenanceIncluded,
      },
      mealTimings: mealTimings || {
        morning: { enabled: false, from: "07:00", to: "09:00" },
        noon: { enabled: false, from: "12:00", to: "14:00" },
        evening: { enabled: false, from: "18:00", to: "20:00" },
        night: { enabled: false, from: "21:00", to: "23:00" },
      },
      images: uploadedImages,
      primaryImage: uploadedImages[0]?.url,
      videos: uploadedVideos,
    });

    // Update slug with actual listing ID if needed (for better uniqueness)
    if (pg._id) {
      const finalSlug = await generateListingSlug(
        pgName,
        ownerName,
        location.area,
        location.city,
        pg._id.toString()
      );
      // Only update if different (to avoid unnecessary database write)
      if (finalSlug !== slug) {
        pg.slug = finalSlug;
        await pg.save();
      }
    }

    return NextResponse.json({
      success: true,
      message: "PG added successfully.",
      data: pg?._id,
    });
  } catch (error: any) {
    console.error("[listPg_API]", error);

    // ❌ Cleanup uploaded images and videos on failure
    await Promise.all([
      ...uploadedImages.map(async (img) => {
        try {
          await deleteFromS3(img.public_id);
        } catch (err) {
          console.warn(`Failed to delete image ${img.public_id}:`, err);
        }
      }),
      ...uploadedVideos.map(async (video) => {
        try {
          await deleteFromS3(video.public_id);
        } catch (err) {
          console.warn(`Failed to delete video ${video.public_id}:`, err);
        }
      }),
    ]);

    let errorMessage = "Server error while adding PG.";
    let statusCode = 500;

    if (
      error?.message?.includes("too large") ||
      error?.message?.includes("413")
    ) {
      errorMessage =
        "Request payload is too large. Please reduce the number or size of images/videos.";
      statusCode = 413;
    } else if (error?.message?.includes("JSON")) {
      errorMessage = "Invalid request data format.";
      statusCode = 400;
    } else if (error?.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
      },
      { status: statusCode }
    );
  }
}
