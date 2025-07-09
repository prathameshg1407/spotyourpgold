  "use client";

  import type React from "react";
  import { motion } from "framer-motion";
  import { Label } from "@/components/ui/label";
  import { Upload, X } from "lucide-react";
  import { BlurImage } from "@/components/BlurImage";
  import type { StepProps } from "../types";

  interface Step5ImagesProps extends StepProps {
    fileInputRef: React.RefObject<HTMLInputElement>;
    handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    removeImage: (index: number) => void;
    existingImageUrls: string[];
    handleRemoveExistingImage: (index: number) => void;
  }

  export const Step5Images: React.FC<Step5ImagesProps> = ({
    formData,
    fileInputRef,
    handleImageUpload,
    removeImage,
    existingImageUrls,
    handleRemoveExistingImage,
  }) => {



    return (
      <form>
        <div className="space-y-2 pt-2 text-left pb-10">
          <div className="space-y-1">
            <Label className="text-gray-700 text-[14px] font-inter">
              Upload 1–5 high-quality images of your PG. First image will be
              primary.
            </Label>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-HG-400 transition-colors"
          >
            <Upload className="w-10 h-10 mx-auto text-HG-400 mb-3" />
            <p className="text-gray-600 text-sm font-inter">
              Click to upload images
            </p>
            <p className="text-xs text-gray-400 mt-1 font-inter">
              JPG, PNG up to 5MB each • Max 5 images
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
              className="grid pt-4 grid-cols-2 md:grid-cols-3 gap-4"
            >
              {existingImageUrls?.map((url, index) => (
                <div
                  key={`existing-${index}`}
                  className="relative group overflow-hidden rounded-lg border border-gray-200"
                >
                  <BlurImage
                    src={url}
                    alt={`PG Image ${index + 1}`}
                    className="w-full h-40 object-cover rounded-lg"
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
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </form>
    );
  };
