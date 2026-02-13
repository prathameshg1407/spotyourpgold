"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BlurImage } from "@/components/BlurImage";

interface ProductGalleryProps {
  images: { url: string; description?: string }[];
  pgName: string;
}

export default function ProductGallery({ images, pgName }: ProductGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const previousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance && images.length > 1) nextImage();
    if (distance < -minSwipeDistance && images.length > 1) previousImage();
  };

  return (
    <div className="space-y-8">
      {/* Main Image */}
      <div
        className="relative aspect-square max-w-sm sm:max-w-none mx-auto bg-gray-300 rounded-2xl overflow-hidden shadow-lg group"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <BlurImage
          openInNewTab={true}
          className="object-cover w-full h-full cursor-pointer transition-transform duration-500 group-hover:scale-105"
          src={images[currentImageIndex]?.url || ""}
          width={600}
          height={600}
          alt={`${pgName} - Image ${currentImageIndex + 1}`}
          priority={true}
        />

        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-md hidden md:flex z-10"
              onClick={previousImage}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-md hidden md:flex z-10"
              onClick={nextImage}
            >
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </Button>
          </>
        )}

        {/* Counter Badge (Bottom Right) */}
        <div className="absolute font-inter bottom-3 right-3 bg-black/70 text-white px-3 py-1 rounded-lg text-xs font-medium backdrop-blur-md shadow-lg pointer-events-none z-10">
          {currentImageIndex + 1} / {images.length}
        </div>
        
        {/* ✅ FIXED: Description Overlay Badge (Bottom Left) */}
        {images[currentImageIndex]?.description && (
          <div className="absolute bottom-3 left-3 bg-black/70 text-white px-3 py-1.5 rounded-lg backdrop-blur-md shadow-lg max-w-[70%] pointer-events-none z-10 border border-white/10">
             <p className="text-xs md:text-sm font-inter font-medium tracking-wide line-clamp-2 capitalize">
               {images[currentImageIndex].description}
             </p>
          </div>
        )}
      </div>

      {/* Mobile Thumbnails */}
      <div className="grid md:hidden grid-cols-5 gap-3 max-w-sm sm:max-w-none mx-auto">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => setCurrentImageIndex(index)}
            className={`relative aspect-square bg-gray-300 rounded-lg overflow-hidden transition-all shadow-sm ${
              currentImageIndex === index
                ? "ring-[2.5px] ring-HG-500 shadow-md scale-105"
                : "hover:ring-2 hover:ring-gray-400 opacity-70 hover:opacity-100"
            }`}
          >
            <BlurImage
              className="object-cover w-full h-full"
              src={image.url}
              width={200}
              height={200}
              alt={`${pgName} thumbnail ${index + 1}`}
            />
          </button>
        ))}
      </div>

      {/* Desktop Thumbnails */}
      <div className="hidden md:grid grid-cols-5 gap-4">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => setCurrentImageIndex(index)}
            className={`relative aspect-square bg-gray-300 rounded-lg overflow-hidden transition-all shadow-sm ${
              currentImageIndex === index
                ? "ring-[3px] ring-HG-500 shadow-md scale-105"
                : "hover:ring-2 hover:ring-gray-400 opacity-70 hover:opacity-100"
            }`}
          >
            <BlurImage
              className="object-cover w-full h-full"
              src={image.url}
              width={200}
              height={200}
              alt={`${pgName} thumbnail ${index + 1}`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}