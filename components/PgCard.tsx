"use client";

import {
  IconArrowUpRight,
  IconHeart,
  IconHeartFilled,
} from "@tabler/icons-react";
import { Users } from "lucide-react";
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
  ownerName: string;
  price: number;
  genderPreference?: string;
  link?: string;
  isWishlisted?: boolean;
};

const PgCard = ({
  id,
  image,
  area,
  pgName,
  ownerName,
  price,
  genderPreference,
  isWishlisted = false,
}: PgCardProps) => {
  const [wishlisted, setWishlisted] = useState(isWishlisted);
  const [loading, setLoading] = useState(false); // ✅ prevent multiple clicks
  const { listings, setListings } = useListingStore();
  const router = useRouter();

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
        <div className="w-full h-44 overflow-hidden">
          <BlurImage
            className="object-cover w-full h-44"
            src={image || ""}
            width={400}
            height={176}
            alt={pgName}
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
            {area}
          </p>

          <h5 className="text-lg font-semibold text-HG-900 dark:text-white py-1 line-clamp-1">
            {pgName}
          </h5>

          <div className="space-y-1">
            <p className="text-sm text-gray-500 dark:text-gray-300 line-clamp-1">
              by {ownerName}
            </p>
            {genderPreference && (
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-HG-600" />
                <span className="text-gray-600 capitalize font-medium">
                  {genderPreference === "both"
                    ? "Male & Female"
                    : genderPreference}
                </span>
              </div>
            )}
          </div>
        </div>

        <p className="text-2xl font-bold font-poppins text-HG-400 pt-4 mt-auto">
          ₹{price?.toLocaleString()}{" "}
          <span className="text-base font-medium text-gray-600 dark:text-gray-300">
            /mo
          </span>
        </p>
      </div>
    </Link>
  );
};

export default PgCard;
