import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary with hardcoded credentials as fallback
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dee33m30l",
  api_key: process.env.CLOUDINARY_API_KEY || "846856161445992",
  api_secret: process.env.CLOUDINARY_API_SECRET || "HsYeEumvtsxD5Cz-wXTL0ua3-eY",
});

export const uploadToS3 = async (
  buffer: Buffer,
  mimeType: string,
  folder = "sypg/owner-docs",
  publicidname = "sypgOwnerDocs"
): Promise<{ url: string; public_id: string }> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
        public_id: `${publicidname}-${Date.now()}`,
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Upload to Cloudinary failed"));
        } else {
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
          });
        }
      }
    );
    uploadStream.end(buffer);
  });
};

export const uploadDataUriToS3 = async (
  dataUri: string,
  folder = "sypg/owner-docs",
  publicidname = "sypgOwnerDocs"
): Promise<{ url: string; public_id: string }> => {
  const matches = dataUri.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error("Invalid Data URI");
  }
  const mimeType = matches[1];
  const buffer = Buffer.from(matches[2], "base64");
  return uploadToS3(buffer, mimeType, folder, publicidname);
};

export const deleteFromS3 = async (fileKey: string) => {
  try {
    await cloudinary.uploader.destroy(fileKey, {
      invalidate: true,
    });
  } catch (err) {
    console.warn(`Failed to delete image ${fileKey} from Cloudinary:`, err);
  }
};
