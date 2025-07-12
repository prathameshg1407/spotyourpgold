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
      roomTypes,
      genderPreference,
      additionalDetails,
      location,
      rulesAndRegulations,
      amenities,
      foodIncluded,
      electricityIncluded,
      maintenanceIncluded,
      images,
    } = await req.json();

    // ✅ Basic validation
    if (
      !pgName?.trim() ||
      !Array.isArray(roomTypes) ||
      roomTypes.length === 0 ||
      !Array.isArray(amenities) ||
      amenities.length === 0 ||
      !location?.city ||
      !location?.state ||
      !location?.pincode ||
      !Array.isArray(images) ||
      images.length === 0 ||
      !Array.isArray(additionalDetails) ||
      additionalDetails.length > 10 ||
      !Array.isArray(rulesAndRegulations) ||
      rulesAndRegulations.length > 10
    ) {
      return NextResponse.json({
        success: false,
        message: "Missing or invalid fields.",
      });
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

    const newLocation = {
      ...location,
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
      roomTypes: updatedRoomTypes,
      genderPreference,
      additionalDetails,
      location: newLocation,
      rulesAndRegulations,
      amenities,
      paymentStatus: user?.role === "owner" ? "pending" : "completed",
      isApproved: user?.role === "owner" ? false : true,
      rentInclusions: {
        foodIncluded,
        electricityIncluded,
        maintenanceIncluded,
      },
      images: uploadedImages,
      primaryImage: uploadedImages[0]?.url,
    });

    return NextResponse.json({
      success: true,
      message: "PG added successfully.",
      data: pg?._id,
    });
  } catch (error) {
    console.error("[listPg_API]", error);

    // ❌ Cleanup uploaded images on failure
    await Promise.all(
      uploadedImages.map(async (img) => {
        try {
          await deleteFromCloudinary(img.public_id);
        } catch (err) {
          console.warn(`Failed to delete image ${img.public_id}:`, err);
        }
      })
    );

    return NextResponse.json({
      success: false,
      message: "Server error while adding PG.",
    });
  }
}
