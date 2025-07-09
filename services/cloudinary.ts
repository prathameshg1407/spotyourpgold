import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export const uploadToCloudinary = async (
  file: string,
  folder = "sypg/owner-docs",
  publicidname = "sypgOwnerDocs",
): Promise<{ url: string; public_id: string }> => {
  const res = await cloudinary.uploader.upload(file, {
    folder,
    resource_type: "image",
    public_id: `${publicidname +"-" + Date.now()}`,
  });

  return {
    url: res.secure_url,
    public_id: res.public_id,
  };
};


export const deleteFromCloudinary = async (public_id: string) => {
  try {
    await cloudinary.uploader.destroy(public_id,{
      invalidate: true, // ⬅️ this ensures CDN purging
    });
  } catch (err) {
    console.warn(`Failed to delete image ${public_id}:`, err);
  }
};