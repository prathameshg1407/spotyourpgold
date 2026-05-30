import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import mongoose from "mongoose";
import OwnerProfile from "@/models/ownerProfile";
import { uploadToS3 } from "@/services/s3";

export async function POST(req: NextRequest) {
  try {
    await connectToDB();

    const formData = await req.formData();
    const userId = formData.get("userId") as string;
    const documentType = formData.get("documentType") as string;
    const file = formData.get("file") as File;

    if (!userId || !documentType || !file) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid file type. Only JPEG, PNG, and PDF files are allowed.",
        },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          message: "File size too large. Maximum size is 5MB.",
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload file to S3
    const uploadResult = await uploadToS3(buffer, file.type, "owner-documents");

    if (!uploadResult) {
      return NextResponse.json(
        { success: false, message: "Failed to upload file" },
        { status: 500 }
      );
    }

    // Update owner profile with document URL
    const updateData: any = {};

    if (documentType === "aadhaarFront") {
      updateData["documents.aadhaarFrontUrl"] = uploadResult.url;
      updateData["documents.aadhaarFrontPublicId"] = uploadResult.public_id;
    } else if (documentType === "aadhaarBack") {
      updateData["documents.aadhaarBackUrl"] = uploadResult.url;
      updateData["documents.aadhaarBackPublicId"] = uploadResult.public_id;
    } else if (documentType === "additional") {
      // For additional documents, we'll add to the array
      const ownerProfile = await OwnerProfile.findOne({
        userId: new mongoose.Types.ObjectId(userId),
      });
      if (ownerProfile) {
        const additionalDocs =
          ownerProfile.documents?.additionalDocuments || [];
        additionalDocs.push({
          url: uploadResult.url,
          public_id: uploadResult.public_id,
        });
        updateData["documents.additionalDocuments"] = additionalDocs;
      }
    }

    const updatedProfile = await OwnerProfile.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      { $set: updateData },
      { new: true, upsert: true }
    );

    if (!updatedProfile) {
      return NextResponse.json(
        { success: false, message: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Document uploaded successfully",
      data: {
        url: uploadResult.url,
        publicId: uploadResult.public_id,
        documentType,
      },
    });
  } catch (error) {
    console.error("Document upload error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
