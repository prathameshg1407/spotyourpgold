import { NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import User from "@/models/user";
import OwnerProfile from "@/models/ownerProfile";
import { uploadDataUriToS3 } from "@/services/s3";
import authUser from "@/actions/authUser";

export async function POST(req: Request) {
  try {
    await connectToDB();
    const {
      aadhaarNumber,
      phone,
      aadhaarFront,
      aadhaarBack,
      street,
      city,
      state,
      pincode,
      documents = [],
    } = await req.json();

    // Validate only required fields: phone and address
    if (!phone || !street || !city || !state || !pincode) {
      return NextResponse.json({
        success: false,
        message:
          "Please fill all required fields. (phone, street, city, state, pincode)",
      }, { status: 400 });
    }

    const user = await authUser();

    // Ensure user exists
    const existingUser = await User.findById(user?.id);
    if (!existingUser) {
      return NextResponse.json({
        success: false,
        message: "User does not exist.",
      }, { status: 404 });
    }

    // Ensure profile doesn't already exist
    const existingProfile = await OwnerProfile.findOne({ userId: user?.id });
    if (existingProfile) {
      return NextResponse.json({
        success: false,
        message: "Owner profile already exists.",
      }, { status: 400 });
    }

    let aadhaarFrontUrl = null;
    let aadhaarBackUrl = null;
    let aadhaarFrontPublicId = null;
    let aadhaarBackPublicId = null;

    // Optional: Upload Aadhaar documents only if provided
    if (aadhaarFront) {
      const res = await uploadDataUriToS3(aadhaarFront);
      aadhaarFrontUrl = res.url;
      aadhaarFrontPublicId = res.public_id;
    }

    if (aadhaarBack) {
      const res = await uploadDataUriToS3(aadhaarBack);
      aadhaarBackUrl = res.url;
      aadhaarBackPublicId = res.public_id;
    }

    // Upload additional documents (optional)
    const uploadedDocuments = await Promise.all(
      documents.map(async (doc: string) => {
        const { url, public_id } = await uploadDataUriToS3(doc);
        return { url, public_id };
      })
    );

    // Create Owner Profile (aadhaarNumber is now optional)
    await OwnerProfile.create({
      userId: user?.id,
      phone,
      aadhaarNumber: aadhaarNumber || "", // Optional
      address: {
        street,
        city,
        state,
        pincode,
      },
      documents: {
        aadhaarFrontUrl,
        aadhaarBackUrl,
        aadhaarFrontPublicId,
        aadhaarBackPublicId,
        additionalDocuments: uploadedDocuments,
      },
    });

    // Update User role and ownerStatus
    await User.findByIdAndUpdate(user?.id, {
      role: "owner",
      ownerStatus: "pending",
    });

    return NextResponse.json({
      success: true,
      message: "Owner profile created successfully. Your account is now pending verification.",
    });
  } catch (error: any) {
    console.error("[Owner_register_API] Error Details:", {
      message: error.message,
      stack: error.stack,
      errors: error.errors, // For mongoose validation errors
    });
    return NextResponse.json({
      success: false,
      message: "Failed to register as owner.",
      error: error.message, // Send error message back for easier debugging
    }, { status: 500 });
  }
}