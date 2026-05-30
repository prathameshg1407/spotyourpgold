import authUser from "@/actions/authUser";
import Listing from "@/models/listing";
import User from "@/models/user";
import { generateListingSlug } from "@/lib/slug";
import {
  deleteFromS3,
  uploadDataUriToS3,
} from "@/services/s3";
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
  let uploadedVideos: any[] = [];

  try {
    await connectToDB();

    const { id } = await context.params;
    const listingId = id;

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

    // ✅ Normalize and split images
    const newImagesToUpload: { base64: string; description: string }[] = [];
    const existingImagesToKeep: { url: string; public_id: string; description: string }[] = [];

    images.forEach((img: any) => {
      if (typeof img === "string") {
        if (img.startsWith("data:image")) {
          newImagesToUpload.push({ base64: img, description: "" });
        } else if (img.startsWith("http")) {
          existingImagesToKeep.push({
            url: img,
            public_id: extractPublicId(img),
            description: "",
          });
        }
      } else if (typeof img === "object") {
        if (img.base64) {
          newImagesToUpload.push({
            base64: img.base64,
            description: img.description || "",
          });
        } else if (img.url) {
          existingImagesToKeep.push({
            url: img.url,
            public_id: img.public_id || extractPublicId(img.url),
            description: img.description || "",
          });
        }
      }
    });

    // ✅ Split videos into existing and new base64
    const newBase64Videos = videos.filter((video: string) =>
      video.startsWith("data:video")
    );
    const existingVideoUrls = videos.filter((video: string) =>
      video.startsWith("https://")
    );

    // ✅ Upload only new images
    uploadedImages = await Promise.all(
      newImagesToUpload.map(async (item) => {
        const { url, public_id } = await uploadDataUriToS3(
          item.base64,
          "sypg/listing-images",
          "sypgListingImages"
        );
        return { url, public_id, description: item.description };
      })
    );

    // ✅ Upload only new videos
    if (newBase64Videos.length > 0) {
      uploadedVideos = await Promise.all(
        newBase64Videos.map(async (video: string) => {
          const { url, public_id } = await uploadDataUriToS3(
            video,
            "sypg/listing-videos",
            "sypgListingVideos"
          );
          return { url, public_id };
        })
      );
    }

    // ✅ Extract public_ids from reused existing URLs
    const reusedImagePublicIds = new Set(
      existingImagesToKeep.map((img) => img.public_id)
    );
    const reusedVideoPublicIds = new Set(
      existingVideoUrls.map((url: string) => extractPublicId(url))
    );

    // ✅ Delete only unused old images and videos
    await Promise.all([
      ...(existingListing.images || []).map(async (img: any) => {
        // Handle both string images (legacy) and object images
        const publicId = typeof img === 'string' ? extractPublicId(img) : img.public_id;
        if (!reusedImagePublicIds.has(publicId)) {
          try {
            await deleteFromS3(publicId);
          } catch (err) {
            console.warn(`Failed to delete ${publicId}:`, err);
          }
        }
      }),
      ...(existingListing.videos || []).map(async (video: any) => {
        if (!reusedVideoPublicIds.has(video.public_id)) {
          try {
            await deleteFromS3(video.public_id);
          } catch (err) {
            console.warn(`Failed to delete ${video.public_id}:`, err);
          }
        }
      }),
    ]);

    // ✅ Combine reused and new images
    const finalImages = [
      ...existingImagesToKeep.map((img) => ({
        url: img.url,
        public_id: img.public_id,
        description: img.description,
      })),
      ...uploadedImages, // Already contains { url, public_id, description }
    ];

    // ✅ Combine reused and new videos
    const finalVideos = [
      ...existingVideoUrls.map((url: string) => ({
        url,
        public_id: extractPublicId(url),
      })),
      ...uploadedVideos,
    ];

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

    // Regenerate slug if pgName, area, city, or owner changed
    let slug = existingListing.slug;
    const needsSlugUpdate = 
      existingListing.pgName !== pgName ||
      existingListing.location?.area !== location.area ||
      existingListing.location?.city !== location.city;
    
    if (needsSlugUpdate || !slug) {
      const owner = await User.findById(user?.id).select("fullName").lean();
      const ownerName = (!owner || Array.isArray(owner)) ? "owner" : (owner.fullName || "owner");
      slug = await generateListingSlug(
        pgName,
        ownerName,
        location.area,
        location.city,
        existingListing._id.toString()
      );
    }

    // ✅ Update listing
    existingListing.set({
      slug, // Update slug if needed
      ownerId: user?.id,
      pgName,
      primaryLine:
        primaryLine !== undefined ? primaryLine : existingListing.primaryLine,
      type: type || existingListing.type,
      subType: subType || existingListing.subType,
      roomTypes: updatedRoomTypes,
      genderPreference,
      additionalDetails,
      location: newLocation,
      rulesAndRegulations,
      detailedRules: detailedRules ||
        existingListing.detailedRules || {
          lockInPeriod: "",
          noticePeriod: "",
          maintenanceCharges: "",
          entryTiming: "",
          exitTiming: "",
          guestStayPolicy: "",
          smokingAlcoholPolicy: "",
        },
      amenities,
      rentInclusions: {
        foodIncluded,
        electricityIncluded,
        maintenanceIncluded,
      },
      mealTimings: mealTimings ||
        existingListing.mealTimings || {
          morning: { enabled: false, from: "07:00", to: "09:00" },
          noon: { enabled: false, from: "12:00", to: "14:00" },
          evening: { enabled: false, from: "18:00", to: "20:00" },
          night: { enabled: false, from: "21:00", to: "23:00" },
        },
      images: finalImages,
      primaryImage: finalImages[0]?.url,
      videos: finalVideos,
    });

    await existingListing.save();

    return NextResponse.json({
      success: true,
      message: "PG updated successfully.",
    });
  } catch (error) {
    console.error("[updatePg_API]", error);

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

    return NextResponse.json({
      success: false,
      message: "Server error while updating PG.",
    });
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();

    const { id } = await context.params;
    const listingId = id;

    const user = await authUser();

    if (user?.role == "user") {
      return NextResponse.json({
        success: false,
        message: "You are not authorized to perform this action.",
      });
    }

    const existingListing = await Listing.findById(listingId);
    if (!existingListing) {
      return NextResponse.json({
        success: false,
        message: "Listing not found.",
      });
    }

    // Check if user owns this listing
    if (existingListing.ownerId.toString() !== user?.id) {
      return NextResponse.json({
        success: false,
        message: "You can only update your own listings.",
      });
    }

    const { isActive } = await req.json();

    // Update only the isActive field
    existingListing.isActive = isActive;
    await existingListing.save();

    return NextResponse.json({
      success: true,
      message: `Listing ${
        isActive ? "activated" : "deactivated"
      } successfully.`,
    });
  } catch (error) {
    console.error("[updateListingStatus_API]", error);
    return NextResponse.json({
      success: false,
      message: "Server error while updating listing status.",
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

    if (user?.role == "user") {
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
          await deleteFromS3(img.public_id);
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
