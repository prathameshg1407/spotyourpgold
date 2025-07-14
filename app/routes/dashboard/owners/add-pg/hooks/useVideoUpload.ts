import type React from "react";
import type { PGFormData } from "../types";

export const useVideoUpload = (
  formData: PGFormData,
  setFormData: React.Dispatch<React.SetStateAction<PGFormData>>,
  setErrors: React.Dispatch<React.SetStateAction<any>>
) => {
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const validFiles: File[] = [];
    let errorMessage = "";

    const existingCount = formData.existingVideoUrls.length;
    const currentCount = formData.videos.length;
    const totalCount = existingCount + currentCount;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Check file size (50MB limit for videos)
      if (file.size > 50 * 1024 * 1024) {
        errorMessage = "Each video must be under 50MB";
        break;
      }

      // Check file type
      if (!file.type.startsWith("video/")) {
        errorMessage = "Only video files are allowed";
        break;
      }

      validFiles.push(file);
    }

    if (!errorMessage && totalCount + validFiles.length > 3) {
      errorMessage = "Maximum 3 videos allowed including existing ones";
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
