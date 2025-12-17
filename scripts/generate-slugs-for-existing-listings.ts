/**
 * Migration script to generate slugs for existing listings
 * 
 * New slug format: pg-name-owner-name-area-city
 * Example: sunshine-pg-john-doe-vijay-nagar-indore
 * 
 * Usage:
 * 
 * 1. Generate slugs only for listings without slugs:
 *    npx tsx scripts/generate-slugs-for-existing-listings.ts
 *    npm run migrate:slugs
 * 
 * 2. Regenerate ALL slugs with new format (for existing entries):
 *    npx tsx scripts/generate-slugs-for-existing-listings.ts --all
 *    npm run migrate:slugs:all
 */

// Load environment variables
import { config } from "dotenv";
import { resolve } from "path";

// Try to load .env.local first, then .env, then .local.env
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".local.env") });

import mongoose from "mongoose";
import Listing from "../models/listing";
import User from "../models/user";
import { generateListingSlug } from "../lib/slug";
import { connectToDB } from "../services/connectdb";

async function generateSlugsForExistingListings(regenerateAll: boolean = false) {
  try {
    console.log("🔄 Connecting to database...");
    await connectToDB();
    console.log("✅ Connected to database");

    // Find all listings - either without slugs or all if regenerateAll is true
    let listingsToProcess;
    if (regenerateAll) {
      listingsToProcess = await Listing.find({})
        .populate("ownerId", "fullName")
        .lean();
      console.log(`📊 Regenerating slugs for ALL ${listingsToProcess.length} listings with new format`);
    } else {
      listingsToProcess = await Listing.find({
        $or: [{ slug: { $exists: false } }, { slug: null }, { slug: "" }],
      })
        .populate("ownerId", "fullName")
        .lean();
      console.log(`📊 Found ${listingsToProcess.length} listings without slugs`);
    }

    if (listingsToProcess.length === 0) {
      console.log("✅ No listings to process!");
      process.exit(0);
    }

    let successCount = 0;
    let errorCount = 0;

    // Process each listing
    for (const listing of listingsToProcess) {
      try {
        // Get owner name
        let ownerName = "owner";
        if (listing.ownerId && typeof listing.ownerId === "object") {
          ownerName = (listing.ownerId as any).fullName || "owner";
        } else {
          // If ownerId is just an ID, fetch it
          const owner = await User.findById(listing.ownerId)
            .select("fullName")
            .lean();
          ownerName = owner?.fullName || "owner";
        }

        // Generate slug: pg-name-owner-name-area-city
        const slug = await generateListingSlug(
          listing.pgName,
          ownerName,
          listing.location?.area || "unknown-area",
          listing.location?.city || "unknown",
          listing._id.toString()
        );

        // Update the listing with the slug
        await Listing.findByIdAndUpdate(listing._id, { slug });

        successCount++;
        console.log(
          `✅ Generated slug for "${listing.pgName}": ${slug} (${successCount}/${listingsToProcess.length})`
        );
      } catch (error: any) {
        errorCount++;
        console.error(
          `❌ Error generating slug for listing ${listing._id}:`,
          error.message
        );
      }
    }

    console.log("\n📊 Migration Summary:");
    console.log(`✅ Successfully generated: ${successCount} slugs`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📝 Total processed: ${successCount + errorCount}/${listingsToProcess.length}`);

    if (errorCount === 0) {
      console.log("\n🎉 All slugs generated successfully!");
    } else {
      console.log("\n⚠️  Some listings had errors. Please review and retry if needed.");
    }

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

// Run the migration
// To regenerate ALL slugs (not just missing ones), pass true: generateSlugsForExistingListings(true)
// To only generate missing slugs, pass false or nothing: generateSlugsForExistingListings(false)
const regenerateAll = process.argv.includes("--all") || process.argv.includes("-a");
generateSlugsForExistingListings(regenerateAll);
