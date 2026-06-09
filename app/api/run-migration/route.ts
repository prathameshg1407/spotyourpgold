import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Listing from "@/models/listing";
import { uploadToS3 } from "@/services/s3"; // Now redirects to Cloudinary!
import { connectToDB } from "@/services/connectdb";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const S3_DOMAIN = ".amazonaws.com";

const s3Client = new S3Client({
  region: process.env.APP_AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY!,
  },
});

async function downloadFromS3(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  const match = url.match(/https:\/\/([^\.]+)\.s3\.([^\.]+)\.amazonaws\.com\/(.+)/);
  if (!match) {
    throw new Error(`Failed to parse S3 URL: ${url}`);
  }
  const bucket = match[1];
  const key = match[3];

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  
  const response = await s3Client.send(command);
  
  if (!response.Body) {
    throw new Error("Empty body from S3 object");
  }

  // Helper to convert readable stream to Buffer (compatible with AWS SDK v3 in Node.js)
  const streamToBuffer = async (stream: any): Promise<Buffer> => {
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  };

  const buffer = await streamToBuffer(response.Body);
  const contentType = response.ContentType || "image/jpeg";
  return { buffer, contentType };
}

export async function GET() {
  if (!process.env.MONGODB_URI) {
    return NextResponse.json({ error: "MONGODB_URI is not set" }, { status: 500 });
  }

  try {
    await connectToDB();

    const listings = await Listing.find({});
    let updatedCount = 0;
    const logs: string[] = [];

    for (const listing of listings) {
      let isUpdated = false;

      // 1. Migrate images from S3 back to Cloudinary
      if (listing.images && listing.images.length > 0) {
        for (let i = 0; i < listing.images.length; i++) {
          const img = listing.images[i];
          if (img.url && img.url.includes(S3_DOMAIN)) {
            try {
              const { buffer, contentType } = await downloadFromS3(img.url);
              const cloudinaryResult = await uploadToS3(
                buffer,
                contentType,
                "sypg/listing-images",
                "sypgListingImages"
              );
              img.url = cloudinaryResult.url;
              img.public_id = cloudinaryResult.public_id;
              isUpdated = true;
              logs.push(`Listing '${listing.pgName}': Updated image to ${cloudinaryResult.url}`);
            } catch (err: any) {
              logs.push(`Error on listing '${listing.pgName}' image ${img.url}: ${err.message}`);
            }
          }
        }
      }

      // 2. Migrate primaryImage from S3 back to Cloudinary
      if (listing.primaryImage && listing.primaryImage.includes(S3_DOMAIN)) {
        try {
          const { buffer, contentType } = await downloadFromS3(listing.primaryImage);
          const cloudinaryResult = await uploadToS3(
            buffer,
            contentType,
            "sypg/listing-images",
            "sypgListingImages"
          );
          listing.primaryImage = cloudinaryResult.url;
          isUpdated = true;
          logs.push(`Listing '${listing.pgName}': Updated primaryImage to ${cloudinaryResult.url}`);
        } catch (err: any) {
          logs.push(`Error on listing '${listing.pgName}' primaryImage ${listing.primaryImage}: ${err.message}`);
        }
      }

      // 3. Migrate videos from S3 back to Cloudinary
      if (listing.videos && listing.videos.length > 0) {
        for (let i = 0; i < listing.videos.length; i++) {
          const vid = listing.videos[i];
          if (vid.url && vid.url.includes(S3_DOMAIN)) {
            try {
              const { buffer, contentType } = await downloadFromS3(vid.url);
              const cloudinaryResult = await uploadToS3(
                buffer,
                contentType,
                "sypg/listing-videos",
                "sypgListingVideos"
              );
              vid.url = cloudinaryResult.url;
              vid.public_id = cloudinaryResult.public_id;
              isUpdated = true;
              logs.push(`Listing '${listing.pgName}': Updated video to ${cloudinaryResult.url}`);
            } catch (err: any) {
              logs.push(`Error on listing '${listing.pgName}' video ${vid.url}: ${err.message}`);
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
      message: `Successfully migrated ${updatedCount} listings from S3 back to Cloudinary.`,
      logs,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
