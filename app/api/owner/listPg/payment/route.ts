import Listing from "@/models/listing";
import { deleteFromCloudinary, uploadToCloudinary } from "@/services/cloudinary";
import { connectToDB } from "@/services/connectdb";
import { NextResponse } from "next/server";

export async function PUT(req: Request) {
  let uploadedImage;
  try {
    await connectToDB();

    const { listingId, proof } = await req.json();


    // ✅ Validate fields
    if (!listingId || !proof) {
      return NextResponse.json({
        success: false,
        message: "Please provide both listingId and proof.",
      });
    }

    // ✅ Find listing
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return NextResponse.json({
        success: false,
        message: "Listing not found.",
      });
    }

    // ✅ Upload to Cloudinary
      uploadedImage = await uploadToCloudinary(
        proof,
        "sypg/listing-proofs",
        "sypgListingProofs"
      );


    if (!uploadedImage.url) {
      return NextResponse.json({
        success: false,
        message: "Failed to upload payment proof.",
      });
    }

    // ✅ Save proof & update payment status
    listing.paymentProof = uploadedImage.url;
    listing.paymentStatus = "completed"; // Set this only if business logic allows
    await listing.save();

    return NextResponse.json({
      success: true,
      message: "Payment proof uploaded and saved successfully.",
    });
  } catch (error) {
    console.error("[upload-payment-proof_API]", error);
    if (uploadedImage?.public_id) {
      await deleteFromCloudinary(uploadedImage.public_id);
    }
    return NextResponse.json({
      success: false,
      message: "Server error while saving payment proof.",
    });
  }
}
