import authUser from "@/actions/authUser";
import Listing from "@/models/listing";
import {
  deleteFromCloudinary,
  uploadToCloudinary,
} from "@/services/cloudinary";
import { connectToDB } from "@/services/connectdb";
import { NextResponse } from "next/server";

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
    } = await req.json();

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

    // ✅ Upload images to Cloudinary
    uploadedImages = await Promise.all(
      images.map(async (img: string) => {
        const { url, public_id } = await uploadToCloudinary(
          img,
          "sypg/listing-images",
          "sypgListingImages"
        );
        return { url, public_id };
      })
    );

    // ✅ Upload videos to Cloudinary (if any)
    if (videos.length > 0) {
      uploadedVideos = await Promise.all(
        videos.map(async (video: string) => {
          const { url, public_id } = await uploadToCloudinary(
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

    // ✅ Create new listing
    const pg = await Listing.create({
      ownerId: user?.id,
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

    return NextResponse.json({
      success: true,
      message: "PG added successfully.",
      data: pg?._id,
    });
  } catch (error) {
    console.error("[listPg_API]", error);

    // ❌ Cleanup uploaded images and videos on failure
    await Promise.all([
      ...uploadedImages.map(async (img) => {
        try {
          await deleteFromCloudinary(img.public_id);
        } catch (err) {
          console.warn(`Failed to delete image ${img.public_id}:`, err);
        }
      }),
      ...uploadedVideos.map(async (video) => {
        try {
          await deleteFromCloudinary(video.public_id);
        } catch (err) {
          console.warn(`Failed to delete video ${video.public_id}:`, err);
        }
      }),
    ]);

    return NextResponse.json({
      success: false,
      message: "Server error while adding PG.",
    });
  }
}
