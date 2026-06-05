import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Load environment variables
const envPath = path.resolve(process.cwd(), ".local.env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

import Listing from "../models/listing";
import { uploadToS3 } from "../services/s3";

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

async function migrateListing(listing: any) {
  let isUpdated = false;

  console.log(`Checking listing: ${listing.pgName} (${listing._id})`);

  // 1. Migrate images array
  if (listing.images && listing.images.length > 0) {
    for (let i = 0; i < listing.images.length; i++) {
      const img = listing.images[i];
      if (img.url && img.url.includes(CLOUDINARY_DOMAIN)) {
        try {
          console.log(`Downloading image from Cloudinary: ${img.url}`);
          const { buffer, contentType } = await downloadImage(img.url);
          console.log(`Uploading to S3...`);
          const s3Result = await uploadToS3(buffer, contentType, "sypg/listing-images", "sypgListingImages");
          
          img.url = s3Result.url;
          img.public_id = s3Result.public_id;
          isUpdated = true;
          console.log(`Success: New URL -> ${s3Result.url}`);
        } catch (error) {
          console.error(`Error migrating image ${img.url}:`, error);
        }
      }
    }
  }

  // 2. Migrate primaryImage
  if (listing.primaryImage && listing.primaryImage.includes(CLOUDINARY_DOMAIN)) {
    try {
      console.log(`Downloading primaryImage from Cloudinary: ${listing.primaryImage}`);
      const { buffer, contentType } = await downloadImage(listing.primaryImage);
      console.log(`Uploading to S3...`);
      const s3Result = await uploadToS3(buffer, contentType, "sypg/listing-images", "sypgListingImages");
      
      listing.primaryImage = s3Result.url;
      isUpdated = true;
      console.log(`Success: New primaryImage URL -> ${s3Result.url}`);
    } catch (error) {
      console.error(`Error migrating primaryImage ${listing.primaryImage}:`, error);
    }
  }

  // 3. Migrate videos array
  if (listing.videos && listing.videos.length > 0) {
    for (let i = 0; i < listing.videos.length; i++) {
      const vid = listing.videos[i];
      if (vid.url && vid.url.includes(CLOUDINARY_DOMAIN)) {
        try {
          console.log(`Downloading video from Cloudinary: ${vid.url}`);
          const { buffer, contentType } = await downloadImage(vid.url);
          console.log(`Uploading to S3...`);
          const s3Result = await uploadToS3(buffer, contentType, "sypg/listing-videos", "sypgListingVideos");
          
          vid.url = s3Result.url;
          vid.public_id = s3Result.public_id;
          isUpdated = true;
          console.log(`Success: New Video URL -> ${s3Result.url}`);
        } catch (error) {
          console.error(`Error migrating video ${vid.url}:`, error);
        }
      }
    }
  }

  if (isUpdated) {
    await listing.save();
    console.log(`✅ Saved updated listing ${listing._id} to MongoDB\n`);
  } else {
    console.log(`No Cloudinary assets found for listing ${listing._id}\n`);
  }
}

async function runMigration() {
  console.log("Starting Cloudinary to S3 Migration...");
  
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is not defined in environment variables!");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    const listings = await Listing.find({});
    console.log(`Found ${listings.length} listings to process.`);

    for (const listing of listings) {
      await migrateListing(listing);
    }

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

runMigration();
