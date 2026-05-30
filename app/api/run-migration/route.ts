import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Listing from "@/models/listing";
import { uploadToS3 } from "@/services/s3";

const CLOUDINARY_DOMAIN = "res.cloudinary.com";

async function downloadImage(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentType = response.headers.get("content-type") || "image/jpeg";
  return { buffer, contentType };
}

export async function GET() {
  if (!process.env.MONGODB_URI) {
    return NextResponse.json({ error: "MONGODB_URI is not set" }, { status: 500 });
  }

  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const listings = await Listing.find({});
    let updatedCount = 0;
    const logs: string[] = [];

    for (const listing of listings) {
      let isUpdated = false;

      // 1. Migrate images
      if (listing.images && listing.images.length > 0) {
        for (let i = 0; i < listing.images.length; i++) {
          const img = listing.images[i];
          if (img.url && img.url.includes(CLOUDINARY_DOMAIN)) {
            try {
              const { buffer, contentType } = await downloadImage(img.url);
              const s3Result = await uploadToS3(buffer, contentType, "sypg/listing-images", "sypgListingImages");
              img.url = s3Result.url;
              img.public_id = s3Result.public_id;
              isUpdated = true;
              logs.push(`Updated image for listing ${listing._id} -> ${s3Result.url}`);
            } catch (err: any) {
              logs.push(`Error on image ${img.url}: ${err.message}`);
            }
          }
        }
      }

      // 2. Migrate primaryImage
      if (listing.primaryImage && listing.primaryImage.includes(CLOUDINARY_DOMAIN)) {
        try {
          const { buffer, contentType } = await downloadImage(listing.primaryImage);
          const s3Result = await uploadToS3(buffer, contentType, "sypg/listing-images", "sypgListingImages");
          listing.primaryImage = s3Result.url;
          isUpdated = true;
          logs.push(`Updated primaryImage for listing ${listing._id} -> ${s3Result.url}`);
        } catch (err: any) {
          logs.push(`Error on primaryImage ${listing.primaryImage}: ${err.message}`);
        }
      }

      // 3. Migrate videos
      if (listing.videos && listing.videos.length > 0) {
        for (let i = 0; i < listing.videos.length; i++) {
          const vid = listing.videos[i];
          if (vid.url && vid.url.includes(CLOUDINARY_DOMAIN)) {
            try {
              const { buffer, contentType } = await downloadImage(vid.url);
              const s3Result = await uploadToS3(buffer, contentType, "sypg/listing-videos", "sypgListingVideos");
              vid.url = s3Result.url;
              vid.public_id = s3Result.public_id;
              isUpdated = true;
              logs.push(`Updated video for listing ${listing._id} -> ${s3Result.url}`);
            } catch (err: any) {
              logs.push(`Error on video ${vid.url}: ${err.message}`);
            }
          }
        }
      }

      if (isUpdated) {
        await listing.save();
        updatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully migrated ${updatedCount} listings from Cloudinary to S3.`,
      logs,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
