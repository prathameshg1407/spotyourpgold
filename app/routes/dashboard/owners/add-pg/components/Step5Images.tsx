"use client";

import type React from "react";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Upload, X, Video, Image as ImageIcon } from "lucide-react";
import { BlurImage } from "@/components/BlurImage";
import type { StepProps } from "../types";

interface Step5ImagesProps extends StepProps {
  fileInputRef: React.RefObject<HTMLInputElement>;
  videoInputRef: React.RefObject<HTMLInputElement>;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeImage: (index: number) => void;
  removeVideo: (index: number) => void;
  existingImageUrls: string[];
  existingVideoUrls: string[];
  handleRemoveExistingImage: (index: number) => void;
  handleRemoveExistingVideo: (index: number) => void;
}

export const Step5Images: React.FC<Step5ImagesProps> = ({
  formData,
  fileInputRef,
  videoInputRef,
  handleImageUpload,
  handleVideoUpload,
  removeImage,
  removeVideo,
  existingImageUrls,
  existingVideoUrls,
  handleRemoveExistingImage,
  handleRemoveExistingVideo,
}) => {
  return (
    <form>
      <div className="space-y-6 pt-2 text-left pb-10">
        {/* Images Section */}
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-gray-700 text-[16px] font-inter font-semibold flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-HG-500" />
              Property Images
            </Label>
            <p className="text-gray-600 text-[14px] font-inter">
              Upload 1–12 high-quality images of your PG. First image will be
              primary.
            </p>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-HG-400 transition-colors"
          >
            <Upload className="w-8 h-8 mx-auto text-HG-400 mb-2" />
            <p className="text-gray-600 text-sm font-inter">
              Click to upload images
            </p>
            <p className="text-xs text-gray-400 mt-1 font-inter">
              JPG, PNG up to 3MB each • Max 12 images
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {/* Videos Section */}
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-gray-700 text-[16px] font-inter font-semibold flex items-center gap-2">
              <Video className="w-5 h-5 text-HG-500" />
              Property Videos (Optional)
            </Label>
            <p className="text-gray-600 text-[14px] font-inter">
              Upload up to 3 videos to showcase your property better.
            </p>
          </div>

          <div
            onClick={() => videoInputRef.current?.click()}
            className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
          >
            <Video className="w-8 h-8 mx-auto text-blue-400 mb-2" />
            <p className="text-gray-600 text-sm font-inter">
              Click to upload videos
            </p>
            <p className="text-xs text-gray-400 mt-1 font-inter">
              MP4, MOV up to 50MB each • Max 3 videos
            </p>
          </div>

          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            multiple
            onChange={handleVideoUpload}
            className="hidden"
          />
        </div>

        {/* {formData.images.length > 0 && (
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                  },
                },
              }}
              initial="hidden"
              animate="visible"
              className="grid pt-4 grid-cols-2 md:grid-cols-3 gap-4"
            >
              {formData.images.map((file, index) => (
                <div
                  key={index}
                  className="relative group overflow-hidden rounded-lg border border-gray-200"
                >
                  <BlurImage
                    src={URL.createObjectURL(file)}
                    alt={`PG Image ${index + 1}`}
                    className="w-full h-40 object-cover rounded-lg"
                    width={400}
                    height={400}
                  />

                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {index === 0 && (
                    <div className="absolute bottom-2 left-2 bg-HG-500 text-white text-xs px-2 py-0.5 rounded-full font-inter">
                      Primary
                    </div>
                  )}
                </div>
              ))}
            
            </motion.div>
          )} */}

        {/* Display Images */}
        {(existingImageUrls.length > 0 || formData.images.length > 0) && (
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: {
                opacity: 1,
                y: 0,
                transition: {
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                },
              },
            }}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            <Label className="text-gray-700 text-[15px] font-inter font-medium">
              Uploaded Images (
              {(existingImageUrls?.length || 0) + formData.images.length}/12)
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {existingImageUrls?.map((url, index) => (
                <div
                  key={`existing-${index}`}
                  className="relative group overflow-hidden rounded-lg border border-gray-200"
                >
                  <BlurImage
                    src={url}
                    alt={`PG Image ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                    width={400}
                    height={400}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveExistingImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {index === 0 && (
                    <div className="absolute bottom-2 left-2 bg-HG-500 text-white text-xs px-2 py-0.5 rounded-full font-inter">
                      Primary
                    </div>
                  )}
                </div>
              ))}

              {formData.images.map((file, index) => (
                <div
                  key={`new-${index}`}
                  className="relative group overflow-hidden rounded-lg border border-gray-200"
                >
                  <BlurImage
                    src={URL.createObjectURL(file)}
                    alt={`PG Image ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                    width={400}
                    height={400}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Display Videos */}
        {(existingVideoUrls.length > 0 || formData.videos.length > 0) && (
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: {
                opacity: 1,
                y: 0,
                transition: {
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                },
              },
            }}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            <Label className="text-gray-700 text-[15px] font-inter font-medium">
              Uploaded Videos (
              {(existingVideoUrls?.length || 0) + formData.videos.length}/3)
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {existingVideoUrls?.map((url, index) => (
                <div
                  key={`existing-video-${index}`}
                  className="relative group overflow-hidden rounded-lg border border-gray-200"
                >
                  <video
                    src={url}
                    className="w-full h-40 object-cover rounded-lg"
                    controls
                    preload="metadata"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveExistingVideo(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-inter">
                    Video {index + 1}
                  </div>
                </div>
              ))}

              {formData.videos.map((file, index) => (
                <div
                  key={`new-video-${index}`}
                  className="relative group overflow-hidden rounded-lg border border-gray-200"
                >
                  <video
                    src={URL.createObjectURL(file)}
                    className="w-full h-40 object-cover rounded-lg"
                    controls
                    preload="metadata"
                  />
                  <button
                    type="button"
                    onClick={() => removeVideo(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-inter">
                    Video {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </form>
  );
};
