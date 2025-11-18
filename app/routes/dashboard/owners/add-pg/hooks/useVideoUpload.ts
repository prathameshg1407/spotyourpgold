import type React from "react";
import type { PGFormData } from "../types";
import { compressVideo, validateFileSize } from "@/lib/imageCompression";

export const useVideoUpload = (
  formData: PGFormData,
  setFormData: React.Dispatch<React.SetStateAction<PGFormData>>,
  setErrors: React.Dispatch<React.SetStateAction<any>>
) => {
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const validFiles: File[] = [];
    let errorMessage = "";

    const existingCount = formData.existingVideoUrls.length;
    const currentCount = formData.videos.length;
    const totalCount = existingCount + currentCount;

    // Check if adding these files would exceed the limit
    if (totalCount + files.length > 3) {
      errorMessage = "Maximum 3 videos allowed including existing ones";
      setErrors((prev: any) => ({
        ...prev,
        videos: true,
        general: errorMessage,
      }));
      return;
    }

    try {
      // Process files with compression
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Check file type
        if (!file.type.startsWith("video/")) {
          errorMessage = "Only video files are allowed";
          break;
        }

        // Check initial file size (100MB limit for videos before compression)
        if (file.size > 100 * 1024 * 1024) {
          errorMessage = "Each video must be under 100MB before compression";
          break;
        }

        try {
          // Compress the video (basic validation for now)
          const compressedFile = await compressVideo(file, {
            maxSizeMB: 20, // 20MB max after compression
          });

          // Validate compressed file size
          if (!validateFileSize(compressedFile, 25)) {
            // 25MB max after compression
            errorMessage = `Video ${file.name} is still too large after compression`;
            break;
          }

          validFiles.push(compressedFile);
        } catch (compressionError) {
          errorMessage = `Failed to process video ${file.name}`;
          break;
        }
      }

      if (errorMessage) {
        setErrors((prev: any) => ({
          ...prev,
          videos: true,
          general: errorMessage,
        }));
        return;
      }

      // Trim to fit max 3
      const allowedCount = 3 - totalCount;
      const trimmedFiles = validFiles.slice(0, allowedCount);

      setErrors((prev: any) => ({ ...prev, videos: false, general: "" }));

      setFormData((prev) => ({
        ...prev,
        videos: [...prev.videos, ...trimmedFiles],
      }));
    } catch (error) {
      setErrors((prev: any) => ({
        ...prev,
        videos: true,
        general: "Failed to process videos. Please try again.",
      }));
    }

    // Reset input to allow re-uploading same file
    e.target.value = "";
  };

  const removeVideo = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index),
    }));
  };

  return { handleVideoUpload, removeVideo };
};
