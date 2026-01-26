import { NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import User from "@/models/user";
import OwnerProfile from "@/models/ownerProfile";
import { uploadToCloudinary } from "@/services/cloudinary";
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
      });
    }

    const user = await authUser();

    // Ensure user exists
    const existingUser = await User.findById(user?.id);
    if (!existingUser) {
      return NextResponse.json({
        success: false,
        message: "User does not exist.",
      });
    }

    // Ensure profile doesn't already exist
    const existingProfile = await OwnerProfile.findOne({ userId: user?.id });
    if (existingProfile) {
      return NextResponse.json({
        success: true,
        message: "Owner profile already exists.",
      });
    }

    let aadhaarFrontUrl = null;
    let aadhaarBackUrl = null;
    let aadhaarFrontPublicId = null;
    let aadhaarBackPublicId = null;

    // Optional: Upload Aadhaar documents only if provided
    if (aadhaarFront) {
      const res = await uploadToCloudinary(aadhaarFront);
      aadhaarFrontUrl = res.url;
      aadhaarFrontPublicId = res.public_id;
    }

    if (aadhaarBack) {
      const res = await uploadToCloudinary(aadhaarBack);
      aadhaarBackUrl = res.url;
      aadhaarBackPublicId = res.public_id;
    }

    // Upload additional documents (optional)
    const uploadedDocuments = await Promise.all(
      documents.map(async (doc: string) => {
        const { url, public_id } = await uploadToCloudinary(doc);
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

    return NextResponse.json({
      success: true,
      message: "Owner profile created successfully.",
    });
  } catch (error) {
    console.error("[Owner_register_API]", error);
    return NextResponse.json({
      success: false,
      message: "Failed to register as owner.",
    });
  }
}