import authUser from "@/actions/authUser";
import Listing from "@/models/listing";
import {
  deleteFromCloudinary,
  uploadToCloudinary,
} from "@/services/cloudinary";
import { connectToDB } from "@/services/connectdb";
import { NextResponse } from "next/server";

function extractPublicId(url: string): string {
  // Extract the path after `/upload/` or start directly if not a full URL
  const path = url.includes("/upload/") ? url.split("/upload/")[1] : url;

  // Split path into parts
  const parts = path.split("/");

  // Remove version if present (starts with "v" followed by digits)
  if (parts[0].startsWith("v") && /^\d+$/.test(parts[0].substring(1))) {
    parts.shift(); // remove the version segment
  }

  // Extract filename and remove extension
  const fileName = parts.pop()!;
  const publicId = fileName.split(".")[0];

  // Return full public_id including folders
  return [...parts, publicId].join("/");
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  let uploadedImages: any[] = [];

  try {
    await connectToDB();

    const { id } = await context.params;
    const listingId = id;

    const user = await authUser();

    if (user?.role !== "owner") {
      return NextResponse.json({
        success: false,
        message: "You are not authorized to perform this action.",
      });
    }

    const {
      pgName,
      monthlyRent,
      securityDeposit,
      numberOfRooms,
      capacityPerRoom,
      genderPreference,
      additionalDetails,
      location,
      rulesAndRegulations,
      amenities,
      foodIncluded,
      electricityIncluded,
      maintenanceIncluded,
      images, // Contains mix of existing image URLs and new base64 images
    } = await req.json();

    // ✅ Validate inputs
    if (
      !pgName?.trim() ||
      typeof monthlyRent !== "number" ||
      !Array.isArray(amenities) ||
      amenities.length === 0 ||
      !location?.city ||
      !location?.state ||
      !location?.pincode ||
      !Array.isArray(images) ||
      images.length === 0 ||
      numberOfRooms < 1 ||
      capacityPerRoom < 1 ||
      additionalDetails.length > 10 ||
      rulesAndRegulations.length > 10
    ) {
      return NextResponse.json({
        success: false,
        message: "Missing or invalid fields.",
      });
    }

    if (pgName.length > 100 || images.length > 10) {
      return NextResponse.json({
        success: false,
        message: "Input too long.",
      });
    }

    const existingListing = await Listing.findById(listingId);
    if (!existingListing) {
      return NextResponse.json({
        success: false,
        message: "Listing not found.",
      });
    }

    // ✅ Split images into existing and new base64
    const newBase64Images = images.filter((img: string) =>
      img.startsWith("data:image")
    );
    const existingImageUrls = images.filter((img: string) =>
      img.startsWith("https://")
    );

    // ✅ Upload only new images
    uploadedImages = await Promise.all(
      newBase64Images.map(async (img: string) => {
        const { url, public_id } = await uploadToCloudinary(
          img,
          "sypg/listing-images",
          "sypgListingImages"
        );
        return { url, public_id };
      })
    );

    // ✅ Extract public_ids from reused existing URLs
    const reusedPublicIds = new Set(
      existingImageUrls.map((url) => extractPublicId(url))
    );

    // ✅ Delete only unused old images
    await Promise.all(
      existingListing.images.map(async (img: any) => {
        if (!reusedPublicIds.has(img.public_id)) {
          try {
            await deleteFromCloudinary(img.public_id);
          } catch (err) {
            console.warn(`Failed to delete ${img.public_id}:`, err);
          }
        }
      })
    );

    // ✅ Combine reused and new images
    const finalImages = [
      ...existingImageUrls.map((url) => ({
        url,
        public_id: extractPublicId(url),
      })),
      ...uploadedImages,
    ];

    const newLocation = {
      ...location,
      coordinates: {
        type: "Point",
        coordinates: [location.coordinates.lng, location.coordinates.lat],
      },
    };

    // ✅ Update listing
    existingListing.set({
      ownerId: user?.id,
      pgName,
      monthlyRent,
      securityDeposit,
      numberOfRooms,
      capacityPerRoom,
      genderPreference,
      additionalDetails,
      location: newLocation,
      rulesAndRegulations,
      amenities,
      rentInclusions: {
        foodIncluded,
        electricityIncluded,
        maintenanceIncluded,
      },
      images: finalImages,
      primaryImage: finalImages[0]?.url,
    });

    await existingListing.save();

    return NextResponse.json({
      success: true,
      message: "PG updated successfully.",
    });
  } catch (error) {
    console.error("[updatePg_API]", error);

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
      message: "Server error while updating PG.",
    });
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();
    const { id } = await context.params; // Await the params
    const user = await authUser();

    if (user?.role !== "owner") {
      return NextResponse.json({
        success: false,
        message: "You are not authorized to perform this action.",
      });
    }

    const listing = await Listing.findById(id).select("images");

    if (!listing) {
      return NextResponse.json({
        success: false,
        message: "Listing not found.",
      });
    }

    // Delete images
    await Promise.all(
      listing.images.map(async (img: any) => {
        try {
          await deleteFromCloudinary(img.public_id);
        } catch (err) {
          console.warn(`Failed to delete image ${img.public_id}:`, err);
        }
      })
    );

    await listing.deleteOne();

    return NextResponse.json({
      success: true,
      message: "PG deleted successfully.",
    });
  } catch (error) {
    console.error("[deletePG_API]", error);
    return NextResponse.json({
      success: false,
      message: "Server error while deleting PG.",
    });
  }
}
