import type React from "react"
import type { PGFormData } from "../types"

export const useImageUpload = (
  formData: PGFormData,
  setFormData: React.Dispatch<React.SetStateAction<PGFormData>>,
  setErrors: React.Dispatch<React.SetStateAction<any>>,
) => {
const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (!files) return;

  const validFiles: File[] = [];
  let errorMessage = "";

  const existingCount = formData.existingImageUrls.length;
  const currentCount = formData.images.length;
  const totalCount = existingCount + currentCount;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    if (file.size > 3 * 1024 * 1024) {
      errorMessage = "Each image must be under 3MB";
      break;
    }

    validFiles.push(file);
  }

  if (!errorMessage && totalCount + validFiles.length > 5) {
    errorMessage = "Maximum 5 images allowed including existing ones";
  }

  if (errorMessage) {
    setErrors((prev: any) => ({
      ...prev,
      images: true,
      general: errorMessage,
    }));
    return;
  }

  // Trim to fit max 5
  const allowedCount = 5 - totalCount;
  const trimmedFiles = validFiles.slice(0, allowedCount);

  setErrors((prev: any) => ({ ...prev, images: false, general: "" }));

  setFormData((prev) => ({
    ...prev,
    images: [...prev.images, ...trimmedFiles],
  }));

  // Reset input to allow re-uploading same file
  e.target.value = "";
};


  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  return { handleImageUpload, removeImage }
}
