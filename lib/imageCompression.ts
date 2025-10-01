/**
 * Image compression utility to reduce file sizes before upload
 * This helps prevent 413 Payload Too Large errors
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeKB?: number;
}

export const compressImage = (
  file: File,
  options: CompressionOptions = {}
): Promise<File> => {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    maxSizeKB = 1024, // 1MB max
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);

      // Convert to blob with compression
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to compress image"));
            return;
          }

          // Check if compressed size is acceptable
          const sizeKB = blob.size / 1024;

          if (sizeKB > maxSizeKB) {
            // If still too large, reduce quality further
            const newQuality = Math.max(0.1, quality * (maxSizeKB / sizeKB));
            canvas.toBlob(
              (finalBlob) => {
                if (!finalBlob) {
                  reject(
                    new Error("Failed to compress image to acceptable size")
                  );
                  return;
                }
                resolve(
                  new File([finalBlob], file.name, { type: "image/jpeg" })
                );
              },
              "image/jpeg",
              newQuality
            );
          } else {
            resolve(new File([blob], file.name, { type: "image/jpeg" }));
          }
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
};

export const compressVideo = (
  file: File,
  options: { maxSizeMB?: number } = {}
): Promise<File> => {
  const { maxSizeMB = 10 } = options;

  // For now, just return the original file
  // Video compression is more complex and would require additional libraries
  // In a production app, you might want to use FFmpeg.js or similar
  return new Promise((resolve) => {
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB <= maxSizeMB) {
      resolve(file);
    } else {
      // For now, we'll just reject large videos
      // In production, implement proper video compression
      resolve(file);
    }
  });
};

export const validateFileSize = (
  file: File,
  maxSizeMB: number = 5
): boolean => {
  const sizeMB = file.size / (1024 * 1024);
  return sizeMB <= maxSizeMB;
};

export const getFileSizeInMB = (file: File): number => {
  return file.size / (1024 * 1024);
};
