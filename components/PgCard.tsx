"use client";

import {
  IconArrowUpRight,
  IconHeart,
  IconHeartFilled,
  IconChevronLeft,
  IconChevronRight,
  IconShare,
} from "@tabler/icons-react";
import {
  Users,
  Building2,
  Bed,
  Home,
  Building,
  DoorOpen,
  Store,
  MapPin,
  Wifi,
  Utensils,
  Shirt,
  Droplets,
} from "lucide-react";
import Link from "next/link";
import React, { useState, useCallback } from "react";
import { BlurImage } from "./BlurImage";
import { useLoadingStore } from "@/store/loading";
import { toast } from "sonner";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useListingStore } from "@/store/listingStore";

type PgCardProps = {
  id: string;
  image: string;
  area: string;
  pgName: string;
  primaryLine?: string; // Add primary line prop
  ownerName: string;
  price: number;
  genderPreference?: string;
  link?: string;
  isWishlisted?: boolean;
  images?: string[]; // Add images array for swipeable functionality
  type?: string; // Add type prop (matches database field name)
  distance?: number; // Add distance prop for nearby listings
  amenities?: string[]; // Add amenities array
  rentInclusions?: {
    foodIncluded?: boolean;
    electricityIncluded?: boolean;
    maintenanceIncluded?: boolean;
  }; // Add rent inclusions object
};

const PgCard = ({
  id,
  image,
  area,
  pgName,
  primaryLine,
  ownerName,
  price,
  genderPreference,
  isWishlisted = false,
  images = [],
  type = "pgs", // Default to "pgs" (matches database enum)
  distance,
  amenities = [],
  rentInclusions = {},
}: PgCardProps) => {
  const [wishlisted, setWishlisted] = useState(isWishlisted);
  const [loading, setLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const { listings, setListings } = useListingStore();
  const router = useRouter();

  // Amenity checking logic
  const hasFood =
    rentInclusions?.foodIncluded ||
    amenities.includes("meals") ||
    amenities.includes("food");
  const hasWifi = amenities.includes("wifi") || amenities.includes("wi-fi");
  const hasFurnished =
    amenities.includes("mattress-wardrobe") || amenities.includes("furnished");
  const hasLaundry =
    amenities.includes("laundry") || amenities.includes("laundry-facility");
  const hasROWater =
    amenities.includes("water-purifier") || amenities.includes("ro-water");

  // Amenity icons data
  const amenityIcons = [
    {
      condition: hasFood,
      icon: Utensils,
      label: "Food Included",
    },
    {
      condition: hasWifi,
      icon: Wifi,
      label: "Wi-Fi",
    },
    {
      condition: hasFurnished,
      icon: Bed,
      label: "Furnished",
    },
    {
      condition: hasLaundry,
      icon: Shirt,
      label: "Laundry",
    },
    {
      condition: hasROWater,
      icon: Droplets,
      label: "RO Water",
    },
  ].filter((amenity) => amenity.condition);

  // Combine primary image with additional images for swipeable functionality (max 3)
  // Filter out duplicates and ensure we have unique images
  const allImages = [image, ...images]
    .filter(Boolean)
    .filter((img, index, arr) => arr.indexOf(img) === index) // Remove duplicates
    .slice(0, 3);
  const hasMultipleImages = allImages.length > 1;

  const nextImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  }, [allImages.length]);

  const prevImage = useCallback(() => {
    setCurrentImageIndex(
      (prev) => (prev - 1 + allImages.length) % allImages.length
    );
  }, [allImages.length]);

  // Touch handlers for mobile swipe
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
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextImage();
    }
    if (isRightSwipe) {
      prevImage();
    }
  };

  const toggleWatchlist = useCallback(async () => {
    if (loading) return;
    setLoading(true);

    const loadingToast = toast.loading("Updating watchlist...", {
      closeButton: true,
    });

    try {
      const res = await axios.put(`/api/listing/toggleWatchlist`, {
        id,
        isWishlisted: wishlisted,
      });

      if (
        res?.data &&
        !res.data.success &&
        res.data.message === "Unauthorized"
      ) {
        toast.error("You are not authorized to perform this action.", {
          closeButton: true,
          duration: 2000,
        });
        router.push("/routes/auth/login");
        return;
      }

      if (res?.data?.success) {
        setWishlisted((prev) => !prev);

        setListings(
          listings.map((pg: { _id: string; inWatchList: any }) =>
            pg._id === id ? { ...pg, inWatchList: !pg.inWatchList } : pg
          )
        );

        toast.success(res.data.message || "Watchlist updated!", {
          closeButton: true,
          duration: 2000,
        });
      } else {
        toast.error(res?.data?.message || "Something went wrong", {
          closeButton: true,
          duration: 2000,
        });
      }
    } catch (error) {
      console.error("Toggle watchlist error:", error);
      toast.error("Failed to update watchlist. Try again.", {
        closeButton: true,
        duration: 2000,
      });
    } finally {
      toast.dismiss(loadingToast);
      setLoading(false);
    }
  }, [id, wishlisted, router, setListings, loading, listings]);

  const handleShare = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const shareUrl = `${window.location.origin}/routes/pg-details/${id}`;
      const shareText = `Check out this amazing ${
        type === "pgs" ? "PG" : type?.toUpperCase() || "property"
      }: ${pgName} in ${area}`;

      try {
        if (navigator.share) {
          // Use native share API if available (mobile)
          await navigator.share({
            title: `${pgName} - ${area}`,
            text: shareText,
            url: shareUrl,
          });
        } else {
          // Fallback: copy to clipboard
          await navigator.clipboard.writeText(shareUrl);
          toast.success("Link copied to clipboard!", {
            closeButton: true,
            duration: 2000,
          });
        }
      } catch (error) {
        // Fallback: copy to clipboard
        try {
          await navigator.clipboard.writeText(shareUrl);
          toast.success("Link copied to clipboard!", {
            closeButton: true,
            duration: 2000,
          });
        } catch (clipboardError) {
          toast.error("Unable to share. Please copy the URL manually.", {
            closeButton: true,
            duration: 2000,
          });
        }
      }
    },
    [id, type, pgName, area]
  );

  return (
    <Link
      href={"/routes/pg-details/" + id}
      className="hover:shadow-[0_8px_20px_rgb(0,0,0,0.08)]
      hover:scale-[1.02]
      w-full max-w-[320px] border-4 border-HG-500  
      rounded-xl border-opacity-25 overflow-hidden 
      hover:border-opacity-50 transition duration-300 ease-in group @container
      flex flex-col h-full"
    >
      <div className="flex relative items-center justify-center rounded-b-2xl">
        <div
          className="w-full h-44 overflow-hidden"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <BlurImage
            className="object-cover w-full h-44"
            src={allImages[currentImageIndex] || ""}
            width={400}
            height={176}
            alt={pgName}
          />
        </div>

        {/* Share Icon - Top Left Corner */}
        <button
          onClick={handleShare}
          className="absolute top-3 left-3 bg-white/90 hover:bg-white text-HG-500 hover:text-HG-600 p-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-20 group"
          title="Share this listing"
        >
          <IconShare className="w-4 h-4 group-hover:scale-110 transition-transform" />
        </button>

        {/* Gender Preference Badge - Top Right Corner */}
        {genderPreference && (
          <div
            className={`absolute top-3 right-3 bg-white text-HG-400 border border-HG-400 text-xs font-bold px-2 py-1 rounded-lg shadow-lg`}
          >
            {genderPreference === "both"
              ? "UNISEX"
              : genderPreference.toUpperCase()}
          </div>
        )}

        {/* Image Navigation Arrows - Show on PC, hide on mobile */}
        {hasMultipleImages && (
          <>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                prevImage();
              }}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full opacity-0 md:group-hover:opacity-100 transition-all duration-200 z-10 hidden md:block"
            >
              <IconChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                nextImage();
              }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full opacity-0 md:group-hover:opacity-100 transition-all duration-200 z-10 hidden md:block"
            >
              <IconChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Image Indicators - Show on PC, hide on mobile */}
        {hasMultipleImages && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 gap-1 z-10 hidden md:flex">
            {allImages.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentImageIndex ? "bg-white" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        )}

        {/* Image Counter - Show on mobile */}
        {hasMultipleImages && (
          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full md:hidden">
            {currentImageIndex + 1}/{allImages.length}
          </div>
        )}
      </div>

      <div className="p-4 font-inter relative bg-white flex-grow flex flex-col">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWatchlist();
          }}
          className="absolute top-2 right-2 z-10 p-1 hover:scale-125 transition"
          disabled={loading}
        >
          {wishlisted ? (
            <IconHeartFilled className="h-5 w-5 text-red-500" />
          ) : (
            <IconHeart className="h-5 w-5 text-HG-500 dark:text-white" />
          )}
        </button>

        <div className="flex-grow">
          <p className="text-xs uppercase text-gray-400 dark:text-gray-400 line-clamp-1 leading-tight mb-1 truncate">
            {area}
          </p>

          <h5 className="text-lg font-semibold text-HG-900 dark:text-white py-1 line-clamp-1">
            {pgName}
          </h5>

          {/* Category display with proper icon */}
          <div className="flex items-center gap-2 text-sm">
            {type === "hostels" ? (
              <Home className="w-4 h-4 text-HG-600" />
            ) : type === "pgs" ? (
              <Building2 className="w-4 h-4 text-HG-600" />
            ) : type === "rooms" ? (
              <DoorOpen className="w-4 h-4 text-HG-600" />
            ) : type === "flats" ? (
              <Building className="w-4 h-4 text-HG-600" />
            ) : type === "commercial" ? (
              <Store className="w-4 h-4 text-HG-600" />
            ) : (
              <Building2 className="w-4 h-4 text-HG-600" />
            )}
            <span className="text-gray-600 capitalize font-medium">
              {type === "hostels"
                ? "HOSTELS"
                : type === "pgs"
                ? "PG"
                : type === "rooms"
                ? "ROOMS"
                : type === "flats"
                ? "FLATS"
                : type === "commercial"
                ? "COMMERCIAL"
                : type?.toUpperCase() || "PG"}
            </span>
          </div>

          {/* Amenity Icons Row */}
          {amenityIcons.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              {amenityIcons.slice(0, 5).map((amenity, index) => {
                const IconComponent = amenity.icon;

                return (
                  <div
                    key={index}
                    className="flex items-center justify-center p-1.5 bg-white border border-HG-400 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-md group cursor-pointer"
                    title={amenity.label}
                  >
                    <IconComponent
                      className="w-4 h-4 text-HG-400"
                      strokeWidth={2.5}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Primary Line */}
          {primaryLine && (
            <p className="text-xs uppercase text-gray-400 dark:text-gray-400 line-clamp-1 leading-tight mb-1 truncate">
              {primaryLine}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 mt-auto">
          <p className="text-2xl font-bold font-poppins text-HG-400">
            ₹{price?.toLocaleString()}{" "}
            <span className="text-base font-medium text-gray-600 dark:text-gray-300">
              /mo
            </span>
          </p>
          {distance !== undefined && (
            <div className="flex items-center gap-1 text-xs text-HG-500 font-medium bg-HG-50 px-2 py-1 rounded-full">
              <MapPin className="w-3 h-3" />
              <span>
                {distance < 1
                  ? `${(distance * 1000).toFixed(0)}m`
                  : `${distance.toFixed(1)}km`}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default PgCard;
