"use client";

import React from "react";
import {
  IconArrowUpRight,
  IconHeart,
  IconHeartFilled,
} from "@tabler/icons-react";
import { Users } from "lucide-react";
import Link from "next/link";
import { useState, useCallback } from "react";
import { BlurImage } from "./BlurImage";
import { toast } from "sonner";
import axios from "axios";
import { useRouter } from "next/navigation";

type OwnerListingCardProps = {
  listing: {
    _id: string;
    pgName: string;
    primaryImage?: string;
    images?: Array<{ url: string }>;
    location?: {
      area: string;
      city: string;
    };
    ownerId?: {
      fullName: string;
    };
    minRent?: number;
    monthlyRent?: number;
    genderPreference?: string;
    inWatchList?: boolean;
    isWatchlisted?: boolean;
  };
};

const OwnerListingCard = ({ listing }: OwnerListingCardProps) => {
  const [wishlisted, setWishlisted] = useState(
    listing.isWatchlisted || listing.inWatchList || false
  );
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const toggleWatchlist = useCallback(async () => {
    if (loading) return;
    setLoading(true);

    const loadingToast = toast.loading("Updating watchlist...", {
      closeButton: true,
    });

    try {
      const res = await axios.put(`/api/listing/toggleWatchlist`, {
        id: listing._id,
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
  }, [listing._id, wishlisted, router, loading]);

  const imageUrl =
    listing.primaryImage || listing.images?.[0]?.url || "/placeholder.svg";

  return (
    <Link
      href={`/routes/pg-details/${listing._id}`}
      className="hover:shadow-[0_8px_20px_rgb(0,0,0,0.08)]
      hover:scale-[1.02]
      w-full max-w-[320px] border-4 border-HG-500  
      rounded-xl border-opacity-25 overflow-hidden 
      hover:border-opacity-50 transition duration-300 ease-in group @container
      flex flex-col h-full"
    >
      <div className="flex relative items-center justify-center rounded-b-2xl">
        <div className="w-full h-44 overflow-hidden">
          <BlurImage
            className="object-cover w-full h-44"
            src={imageUrl}
            width={400}
            height={176}
            alt={listing.pgName || "PG Image"}
          />
        </div>

        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-70 transition-opacity bg-black/40 p-3 rounded-xl backdrop-blur-2xl">
          <IconArrowUpRight className="text-white w-7 h-7" />
        </div>
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
          <p className="text-xs uppercase text-gray-400 dark:text-gray-400 line-clamp-2 leading-tight mb-1">
            {listing.location?.area || listing.location?.city || "Location"}
          </p>

          <h5 className="text-lg font-semibold text-HG-900 dark:text-white py-1 line-clamp-1">
            {listing.pgName || "PG Name"}
          </h5>

          <div className="space-y-1">
            <p className="text-sm text-gray-500 dark:text-gray-300 line-clamp-1">
              by {listing.ownerId?.fullName || "Owner"}
            </p>
            {listing.genderPreference && (
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-HG-600" />
                <span className="text-gray-600 capitalize font-medium">
                  {listing.genderPreference === "both"
                    ? "Male & Female"
                    : listing.genderPreference}
                </span>
              </div>
            )}
          </div>
        </div>

        <p className="text-2xl font-bold font-poppins text-HG-400 pt-4 mt-auto">
          ₹
          {(listing.minRent && listing.minRent !== Infinity
            ? listing.minRent
            : listing.monthlyRent || 0
          )?.toLocaleString()}{" "}
          <span className="text-base font-medium text-gray-600 dark:text-gray-300">
            /mo
          </span>
        </p>
      </div>
    </Link>
  );
};

type OwnerListingSectionProps = {
  listings: any[];
  loading: boolean;
  ownerName: string;
};

const OwnerListingSection = ({
  listings,
  loading,
  ownerName,
}: OwnerListingSectionProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="w-full max-w-[320px] mx-auto animate-pulse"
          >
            <div className="border-4 border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-300 h-44 w-full"></div>
              <div className="p-4 bg-white">
                <div className="bg-gray-300 h-3 rounded mb-2 w-1/2"></div>
                <div className="bg-gray-300 h-5 rounded mb-2"></div>
                <div className="bg-gray-300 h-4 rounded mb-4 w-3/4"></div>
                <div className="bg-gray-300 h-6 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!listings || listings.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">
          No other properties available from {ownerName}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
      {listings.map((listing) => (
        <div key={listing._id} className="w-full max-w-[320px] mx-auto">
          <OwnerListingCard listing={listing} />
        </div>
      ))}
    </div>
  );
};

export default OwnerListingSection;
