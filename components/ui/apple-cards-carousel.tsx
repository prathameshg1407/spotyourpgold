"use client";
import React, { useEffect, useRef, useState, createContext } from "react";
import {
  IconArrowUpRight,
  IconHeart,
  IconHeartFilled,
} from "@tabler/icons-react";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { BlurImage } from "../BlurImage";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";
import { useListingStore } from "@/store/listingStore";

interface CarouselProps {
  items: JSX.Element[];
  initialScroll?: number;
}

type Card = {
  id: number;
  image: string;
  area: string;
  pgName: string;
  ownerName: string;
  price: number;
  link?: string;
  isWishlisted?: boolean;
};

export const CarouselContext = createContext<{
  onCardClose: (index: number) => void;
  currentIndex: number;
}>({
  onCardClose: () => {},
  currentIndex: 0,
});

export const Carousel = ({ items, initialScroll = 0 }: CarouselProps) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = initialScroll;
    }
  }, [initialScroll]);

  const isMobile = () =>
    typeof window !== "undefined" && window.innerWidth < 768;

  const handleCardClose = (index: number) => {
    if (!carouselRef.current) return;
    const cardWidth = isMobile() ? 230 : 384;
    const gap = isMobile() ? 4 : 8;
    const scrollPosition = (cardWidth + gap) * (index + 1);
    carouselRef.current.scrollTo({
      left: scrollPosition,
      behavior: "smooth",
    });
    setCurrentIndex(index);
  };

  return (
    <CarouselContext.Provider
      value={{ onCardClose: handleCardClose, currentIndex }}
    >
      <div className="relative w-full">
        <div
          className="flex w-full overflow-x-scroll overscroll-x-auto scroll-smooth py-10 [scrollbar-width:none] md:py-12  "
          ref={carouselRef}
        >
          <div className="absolute right-0 z-[1000] h-auto w-[5%] overflow-hidden bg-gradient-to-l" />
          <div
            className={cn("flex flex-row justify-start gap-5 md:gap-10", "")}
          >
            {items.map((item, index) => (
              <div key={index} className="rounded-3xl">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </CarouselContext.Provider>
  );
};

export const Card = ({
  card,
  index,
  layout = false,
}: {
  card: any;
  index: number;
  layout?: boolean;
}) => {
  // const [wishlisted, setWishlisted] = useState(card.isWishlisted);
  const router = useRouter();

  const [loading, setLoading] = useState(false); // ✅ prevent multiple clicks

  const { listings, setListings } = useListingStore();

  const toggleWatchlist = async () => {
    if (loading) return;
    setLoading(true);

    const loadingToast = toast.loading("Updating watchlist...", {
      closeButton: true,
    });

    try {
      const res = await axios.put(`/api/listing/toggleWatchlist`, {
        id: card?._id,
        isWishlisted: card?.isWatchlisted,
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
        card.isWatchlisted = !card.isWatchlisted;

        setListings(
          listings.map((pg: { _id: string; inWatchList: any }) =>
            pg._id === card?._id ? { ...pg, inWatchList: !pg.inWatchList } : pg
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
  };

  return (
    <div
      className="
      hover:shadow-[0_8px_20px_rgb(0,0,0,0.08)]
      hover:scale-[1.02]
      w-full max-w-[320px] cursor-pointer border-4 border-HG-500  
      rounded-xl border-opacity-25 overflow-hidden 
      hover:border-opacity-50 transition duration-300 ease-in group @container 
      relative flex flex-col h-full"
      onClick={() => {
        router.push(`/routes/pg-details/${card?._id}`);
      }}
    >
      <div className="w-full h-44 object-cover rounded-t-lg overflow-hidden">
        <BlurImage
          className="w-full h-44 object-cover rounded-t-lg"
          src={card?.primaryImage}
          width={400}
          height={176}
          alt={card?.pgName}
        />
      </div>

      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-70 transition-opacity bg-black/40 p-3 rounded-xl backdrop-blur-2xl">
        <IconArrowUpRight className="text-white w-7 h-7" />
      </div>

      <div className="p-4 relative font-inter text-left w-full bg-white flex-grow flex flex-col">
        <button
          className="absolute top-2 right-2 z-10 p-1 hover:scale-125 transition"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            toggleWatchlist();
          }}
        >
          {card?.isWatchlisted ? (
            <IconHeartFilled className="h-5 w-5 text-red-500" />
          ) : (
            <IconHeart className="h-5 w-5 text-HG-500 dark:text-white" />
          )}
        </button>

        <div className="flex-grow">
          <p className="text-xs uppercase text-gray-400 dark:text-gray-400 line-clamp-2 leading-tight mb-1">
            {card?.location?.area}
          </p>
          <h5 className="text-lg font-semibold text-HG-900 dark:text-white py-1 line-clamp-1">
            {card?.pgName}
          </h5>
          <div className="space-y-1">
            <p className="text-sm text-gray-500 dark:text-gray-300 line-clamp-1">
              by {card?.ownerId?.fullName}
            </p>
            {card?.genderPreference && (
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-HG-600" />
                <span className="text-gray-600 capitalize font-medium">
                  {card?.genderPreference === "both"
                    ? "Male & Female"
                    : card?.genderPreference}
                </span>
              </div>
            )}
          </div>
        </div>

        <p className="text-2xl font-bold font-poppins text-HG-400 pt-4 mt-auto">
          ₹{card?.minRent?.toLocaleString()}
          <span className="text-base font-medium text-gray-600 dark:text-gray-300">
            /mo
          </span>
        </p>
      </div>
    </div>
  );
};
