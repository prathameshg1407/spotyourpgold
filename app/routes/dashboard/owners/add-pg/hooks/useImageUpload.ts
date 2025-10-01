import type React from "react";
import type { PGFormData } from "../types";
import { compressImage, validateFileSize } from "@/lib/imageCompression";

export const useImageUpload = (
  formData: PGFormData,
  setFormData: React.Dispatch<React.SetStateAction<PGFormData>>,
  setErrors: React.Dispatch<React.SetStateAction<any>>
) => {
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const validFiles: File[] = [];
    let errorMessage = "";

    const existingCount = formData.existingImageUrls.length;
    const currentCount = formData.images.length;
    const totalCount = existingCount + currentCount;

    // Check if adding these files would exceed the limit
    if (totalCount + files.length > 12) {
      errorMessage = "Maximum 12 images allowed including existing ones";
      setErrors((prev: any) => ({
        ...prev,
        images: true,
        general: errorMessage,
      }));
      return;
    }

    try {
      // Process files with compression
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file type
        if (!file.type.startsWith("image/")) {
          errorMessage = "Only image files are allowed";
          break;
        }

        // Validate initial file size (before compression)
        if (file.size > 10 * 1024 * 1024) {
          // 10MB initial limit
          errorMessage = "Each image must be under 10MB before compression";
          break;
        }

        try {
          // Compress the image
          const compressedFile = await compressImage(file, {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 0.8,
            maxSizeKB: 1024, // 1MB after compression
          });

          // Validate compressed file size
          if (!validateFileSize(compressedFile, 2)) {
            // 2MB max after compression
            errorMessage = `Image ${file.name} is still too large after compression`;
            break;
          }

          validFiles.push(compressedFile);
        } catch (compressionError) {
          console.error("Image compression failed:", compressionError);
          errorMessage = `Failed to compress image ${file.name}`;
          break;
        }
      }

      if (errorMessage) {
        setErrors((prev: any) => ({
          ...prev,
          images: true,
          general: errorMessage,
        }));
        return;
      }

      // Trim to fit max 12
      const allowedCount = 12 - totalCount;
      const trimmedFiles = validFiles.slice(0, allowedCount);

      setErrors((prev: any) => ({ ...prev, images: false, general: "" }));

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...trimmedFiles],
      }));
    } catch (error) {
      console.error("Image upload error:", error);
      setErrors((prev: any) => ({
        ...prev,
        images: true,
        general: "Failed to process images. Please try again.",
      }));
    }

    // Reset input to allow re-uploading same file
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  return { handleImageUpload, removeImage };
};
