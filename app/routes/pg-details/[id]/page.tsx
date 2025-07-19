// // app/routes/pg-details/[id]/page.tsx
// interface PageProps {
//   params: Promise<{ id: string }>;
// }

// export default async function PgDetailsPage({ params }: PageProps) {
//   const { id } = await params;

//   // Now you can use the id
//   // console.log('PG ID:', id);

//   return (
//     <div>
//       <h1>PG Details for ID: {id}</h1>
//       {/* Your existing component content */}
//     </div>
//   );
// }

"use client";

import { useCallback, useEffect, useState } from "react";

// Comprehensive Listing interface matching the upgraded model
interface ListingDetails {
  _id?: string;
  inWatchList: boolean;

  // Basic Info
  pgName: string;
  type?: string;
  subType?: string;
  genderPreference: "male" | "female" | "both";

  // Room Types
  roomTypes: Array<{
    type: string;
    numberOfRooms: number;
    availableRooms: number;
    capacityPerRoom: number;
    monthlyRent: number;
    securityDeposit: number;
  }>;

  // Financial
  monthlyRent: number;
  minRent: number;
  securityDeposit: number;
  numberOfRooms: number;
  capacityPerRoom: number;

  // Amenities & Details
  amenities: string[];
  additionalDetails: string[];

  // Rent Inclusions
  rentInclusions: {
    foodIncluded: boolean;
    electricityIncluded: boolean;
    maintenanceIncluded: boolean;
  };

  // Rules
  rulesAndRegulations: string[];
  detailedRules: {
    lockInPeriod: string;
    noticePeriod: string;
    maintenanceCharges: string;
    entryTiming: string;
    exitTiming: string;
    guestStayPolicy: string;
    smokingAlcoholPolicy: string;
  };

  // Owner Info
  ownerId: {
    _id: string;
    fullName: string;
    address: {
      city: string;
      state: string;
    };
    createdAt: string;
  };

  // Media
  images: Array<{
    url: string;
    public_id?: string;
  }>;
  primaryImage: string;
  videos?: Array<{
    url: string;
    public_id?: string;
  }>;

  // Location
  location: {
    area: string;
    city: string;
    state: string;
    pincode: string;
    nearbyPlaces: string[];
    coordinates: {
      type: string;
      coordinates: number[];
    };
  };

  // Status
  isActive: boolean;
  isApproved: boolean;
  isFeatured: boolean;

  // Monetization
  planType: string;
  paymentStatus: string;

  // Timestamps
  createdAt: Date;
}
import Image from "next/image";
import {
  ArrowLeft,
  Star,
  Phone,
  Calendar,
  MapPin,
  Wifi,
  Car,
  Utensils,
  Shield,
  Zap,
  Tv,
  Sofa,
  Shirt,
  Bed,
  Bath,
  Home,
  Users,
  Coffee,
  Gamepad2,
  Dumbbell,
  BookOpen,
  Clock,
  Lightbulb,
  DoorOpen,
  Building,
  IndianRupee,
  UserCheck,
  AirVent,
  Droplets,
  Camera,
  Refrigerator,
  BrushIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  IconHeart,
  IconHeartFilled,
  IconArrowUpRight,
} from "@tabler/icons-react";
import { BlurImage } from "@/components/BlurImage";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { useLoadingStore } from "@/store/loading";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import dynamic from "next/dynamic";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useListingStore } from "@/store/listingStore";
import SectionHeading from "@/components/SectionHeading";
import { FeaturedCarousel } from "@/components/FeaturedCarousel";
import OwnerListingSection from "@/components/OwnerListingSection";
import VisitRequestForm from "@/components/VisitRequestForm";

// Fix default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "/marker-icon.png",
  iconRetinaUrl: "/marker-icon-2x.png",
  shadowUrl: "/marker-shadow.png",
});

// Amenities icon mapping
const amenityIcons: Record<string, any> = {
  wifi: Wifi,
  "wi-fi": Wifi,
  parking: Car,
  meals: Utensils,
  security: Shield,
  "24x7-security": Shield,
  "24x7 security": Shield,
  power: Zap,
  "power-backup": Zap,
  "power backup": Zap,
  ac: AirVent,
  "air conditioning": AirVent,
  geyser: Zap,
  "water-purifier": Droplets,
  "water purifier": Droplets,
  tv: Tv,
  "tv/entertainment": Tv,
  sofa: Sofa,
  laundry: Shirt,
  "laundry facility": Shirt,
  bed: Bed,
  "mattress-wardrobe": Bed,
  "mattress and wardrobe": Bed,
  bathroom: Bath,
  kitchen: Home,
  "combined-cooking": Coffee,
  "combined cooking area": Coffee,
  common: Users,
  "common-area": Users,
  "common area": Users,
  "common area / lounge": Users,
  coffee: Coffee,
  games: Gamepad2,
  gym: Dumbbell,
  study: BookOpen,
  "study-desk": BookOpen,
  "study desk": BookOpen,
  library: BookOpen,
  "24/7": Clock,
  electricity: Lightbulb,
  food: Utensils,
  internet: Wifi,
  cctv: Camera,
  generator: Zap,
  furniture: Sofa,
  cleaning: Bath,
  housekeeping: BrushIcon,
  maintenance: Home,
  refrigerator: Refrigerator,
  "common-refrigerator": Refrigerator,
  "common refrigerator": Refrigerator,
  "separate-refrigerator": Refrigerator,
  "separate refrigerator": Refrigerator,
};

// Room type icons mapping
const roomTypeIcons: Record<string, any> = {
  single: Bed,
  double: Users,
  triple: Building,
  shared: Users,
  private: DoorOpen,
  "1 bhk": Home,
  "2 bhk": Building,
  "3 bhk": Building,
  "1 rk": DoorOpen,
  dormitory: Building,
  suite: Home,
  studio: DoorOpen,
};

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);

const productImages = [
  "/placeholder.svg?height=600&width=600&text=Product+Image+1",
  "/placeholder.svg?height=600&width=600&text=Product+Image+2",
  "/placeholder.svg?height=600&width=600&text=Product+Image+3",
  "/placeholder.svg?height=600&width=600&text=Product+Image+4",
  "/placeholder.svg?height=600&width=600&text=Product+Image+5",
];

// Component for rendering stars with partial fill
const StarRating = ({
  rating,
  size = "w-4 h-4",
}: {
  rating: number;
  size?: string;
}) => {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => {
        const fillPercentage = Math.min(Math.max(rating - star + 1, 0), 1);
        return (
          <div key={star} className="relative">
            <Star className={`${size} text-gray-300`} />
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fillPercentage * 100}%` }}
            >
              <Star className={`${size} fill-yellow-400 text-yellow-400`} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

type Listing = {
  roomTypes: {
    type: string;
    monthlyRent: number;
    availableRooms: number;
    capacityPerRoom: number;
    securityDeposit: number;
  }[];
  rentInculsions: {
    foodIncluded: boolean;
    electricityIncluded: boolean;
    maintenanceIncluded: boolean;
  };
  inWatchList: boolean;
  // Owner
  ownerId: {
    _id: string;
    fullName: string;
    address: {
      city: string;
      state: string;
    };
    createdAt: string;
  };

  // Basic Info
  pgName: string;
  monthlyRent: number;
  minRent: number;
  securityDeposit: number;
  numberOfRooms: number;
  capacityPerRoom: number;
  genderPreference: "male" | "female" | "both";

  // Amenities
  amenities: string[];
  additionalDetails: string[];

  // Rules
  rulesAndRegulations: string[];

  // Images
  images: {
    url: string;
  }[];
  primaryImage?: string;

  // Location
  location: {
    area: string;
    city: string;
    state: string;
    pincode: string;
    coordinates: {
      type: string;
      coordinates: number[];
    };
  };

  // Timestamps
  createdAt: Date;
};

// Infinite Scroll Listings Component
function InfiniteScrollListings({
  currentListingId,
}: {
  currentListingId: string;
}) {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [initialLoad, setInitialLoad] = useState(false);

  const fetchMoreListings = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const response = await axios.get(
        `/api/listing/getFeatured?page=${page}&per_page=6&exclude=${currentListingId}`
      );

      if (response.data.success) {
        const newListings = response.data.data;

        if (newListings.length === 0) {
          setHasMore(false);
        } else {
          setListings((prev) => [...prev, ...newListings]);
          setPage((prev) => prev + 1);
        }
      }
    } catch (error) {
      console.error("Error fetching more listings:", error);
    } finally {
      setLoading(false);
      setInitialLoad(true);
    }
  }, [page, loading, hasMore, currentListingId]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && initialLoad && !loading && hasMore) {
          fetchMoreListings();
        }
      },
      { threshold: 0.1 }
    );

    const trigger = document.getElementById("scroll-trigger");
    if (trigger) {
      observer.observe(trigger);
    }

    return () => observer.disconnect();
  }, [fetchMoreListings, initialLoad, loading, hasMore]);

  // Initial load when component mounts
  useEffect(() => {
    if (!initialLoad) {
      fetchMoreListings();
    }
  }, [fetchMoreListings, initialLoad]);

  if (!initialLoad && loading) {
    return (
      <div className="mt-16">
        <SectionHeading>More PG Accommodations</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
          {[...Array(8)].map((_, index) => (
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
      </div>
    );
  }

  if (listings.length === 0 && !loading) {
    return null;
  }

  return (
    <div className="mt-16">
      <SectionHeading>More PG Accommodations</SectionHeading>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
        {listings.map((listing: any) => (
          <div key={listing._id} className="w-full max-w-[320px] mx-auto">
            <Link
              href={`/routes/pg-details/${listing._id}`}
              className="hover:shadow-[0_8px_20px_rgb(0,0,0,0.08)]
              hover:scale-[1.02]
              w-full border-4 border-HG-500  
              rounded-xl border-opacity-25 overflow-hidden 
              hover:border-opacity-50 transition duration-300 ease-in group @container
              flex flex-col h-full block"
            >
              <div className="flex relative items-center justify-center rounded-b-2xl">
                <div className="w-full h-44 overflow-hidden">
                  <BlurImage
                    className="object-cover w-full h-44"
                    src={
                      listing.primaryImage ||
                      listing.images?.[0]?.url ||
                      "/placeholder.svg"
                    }
                    width={400}
                    height={176}
                    alt={listing.pgName}
                  />
                </div>

                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-70 transition-opacity bg-black/40 p-3 rounded-xl backdrop-blur-2xl">
                  <IconArrowUpRight className="text-white w-7 h-7" />
                </div>
              </div>

              <div className="p-4 font-inter relative bg-white flex-grow flex flex-col">
                <div className="flex-grow">
                  <p className="text-xs uppercase text-gray-400 dark:text-gray-400 line-clamp-2 leading-tight mb-1">
                    {listing.location?.area}
                  </p>

                  <h5 className="text-lg font-semibold text-HG-900 dark:text-white py-1 line-clamp-1">
                    {listing.pgName}
                  </h5>

                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 dark:text-gray-300 line-clamp-1">
                      by {listing.ownerId?.fullName}
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
                  ₹{listing.minRent?.toLocaleString()}{" "}
                  <span className="text-base font-medium text-gray-600 dark:text-gray-300">
                    /mo
                  </span>
                </p>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
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
      )}

      {/* Scroll trigger */}
      <div id="scroll-trigger" className="h-4 mt-8"></div>

      {/* End message */}
      {!hasMore && listings.length > 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No more listings to show</p>
        </div>
      )}
    </div>
  );
}

export default function ProductPage() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [showDirectionModal, setShowDirectionModal] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 0,
    comment: "",
  });
  const [hoverRating, setHoverRating] = useState(0);

  const [listing, setListing] = useState<ListingDetails>({
    inWatchList: false,

    // Enhanced fields from upgraded model
    type: "",
    subType: "",

    rentInclusions: {
      foodIncluded: false,
      electricityIncluded: false,
      maintenanceIncluded: false,
    },

    // Enhanced rules structure
    detailedRules: {
      lockInPeriod: "",
      noticePeriod: "",
      maintenanceCharges: "",
      entryTiming: "",
      exitTiming: "",
      guestStayPolicy: "",
      smokingAlcoholPolicy: "",
    },

    roomTypes: [],
    ownerId: {
      _id: "",
      fullName: "",
      address: {
        city: "",
        state: "",
      },
      createdAt: "",
    },

    pgName: "",
    monthlyRent: 0,
    minRent: 0,
    securityDeposit: 0,
    numberOfRooms: 0,
    capacityPerRoom: 0,
    genderPreference: "both",

    // Amenities
    amenities: [],
    additionalDetails: [],

    // Rules
    rulesAndRegulations: [],

    // Images
    images: [
      {
        url: "",
      },
    ],
    primaryImage: "",

    // Videos (new field)
    videos: [],

    // Location with enhanced fields
    location: {
      area: "",
      city: "",
      state: "",
      pincode: "",
      nearbyPlaces: [], // New field
      coordinates: {
        type: "",
        coordinates: [28.6139, 77.209],
      },
    },

    // Status fields
    isActive: true,
    isApproved: true,
    isFeatured: false,

    // Monetization fields
    planType: "free",
    paymentStatus: "pending",

    // Timestamps
    createdAt: new Date(),
  });

  const { containerLoading, setContainerLoading } = useLoadingStore();

  const params = useParams();

  const router = useRouter();

  const [loading, setLoading] = useState(false); // ✅ prevent multiple clicks

  const [ownerPgs, setOwnerPgs] = useState<any[]>([]);
  const [ownerPgsLoading, setOwnerPgsLoading] = useState(false);

  useEffect(() => {
    if (!listing?.ownerId?._id) return;

    let ignore = false;
    setOwnerPgsLoading(true);

    const fetchData = async () => {
      try {
        const res = await axios.get(
          `/api/listing/getOwnerListing?owner=${listing.ownerId._id}&exclude=${params?.id}`
        );
        if (res?.data?.success && !ignore) {
          setOwnerPgs(res.data.data);
        } else if (!ignore) {
          toast.error(res?.data?.message || "Something went wrong", {
            duration: 1500,
          });
        }
      } catch (error) {
        if (!ignore) {
          console.error("ownerPgs fetch error", error);
          toast.error("Failed to fetch owner listings", { duration: 1500 });
        }
      } finally {
        if (!ignore) setOwnerPgsLoading(false);
      }
    };

    fetchData();

    return () => {
      ignore = true;
    };
  }, [listing?.ownerId?._id, params?.id]);

  useEffect(() => {
    let ignore = false; // 👈 prevent second fetch/toast
    setContainerLoading("pgDetails", true);

    const fetchData = async () => {
      try {
        const res = await axios.get(`/api/listing/${params.id}`);
        // console.log(res);
        if (res?.data?.success) {
          if (!ignore) {
            setListing(res.data.data.listing);
            setReviews(res.data.data.reviews);
          }
        } else {
          if (!ignore) {
            toast.error(res?.data?.message, { duration: 1500 });
            router.replace("/");
          }
        }
      } catch (error) {
        console.log(error);
        if (!ignore) {
          toast.error("Failed to fetch listing (error)", { duration: 1500 });
          router.replace("/");
        }
      } finally {
        if (!ignore) setContainerLoading("pgDetails", false);
      }
    };

    fetchData();

    return () => {
      ignore = true;
      setContainerLoading("pgDetails", false);
    };
  }, [router, setContainerLoading, params.id]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % listing?.images?.length);
  };

  const previousImage = () => {
    setCurrentImageIndex(
      (prev) => (prev - 1 + listing?.images?.length) % listing?.images?.length
    );
  };

  const toggleWatchlist = async () => {
    if (loading) return;
    setLoading(true);

    const loadingToast = toast.loading("Updating watchlist...", {
      closeButton: true,
    });

    try {
      const res = await axios.put(`/api/listing/toggleWatchlist`, {
        id: params?.id,
        isWishlisted: listing?.inWatchList,
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
        setListing((prev) => ({ ...prev, inWatchList: !prev.inWatchList }));

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

  const goBack = () => {
    window.history.back();
  };

  const handleVisitClick = () => {
    setShowVisitForm(true);
  };

  const handleVisitFormClose = () => {
    setShowVisitForm(false);
  };

  const handleDirectionClick = () => {
    setShowDirectionModal(true);
  };

  const handleDirectionYes = () => {
    // User has visited before, redirect to directions
    const mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${listing?.location?.coordinates?.coordinates[1]},${listing?.location?.coordinates?.coordinates[0]}`;
    window.open(mapUrl, "_blank");
    setShowDirectionModal(false);
  };

  const handleDirectionNo = () => {
    // User hasn't visited, show visit form
    setShowDirectionModal(false);
    setShowVisitForm(true);
  };

  const handleInlineSubmit = async (e: any) => {
    e.preventDefault();

    if (!newReview.comment.trim()) {
      alert("Please write a review");
      return;
    }

    const toastLoading = toast.loading("Submitting review...", {
      closeButton: true,
    });

    try {
      const res = await axios.post("/api/reviews", {
        listingId: params?.id,
        rating: newReview.rating,
        comment: newReview.comment.trim(),
      });

      if (res?.data?.success) {
        setReviews([
          res?.data?.data,
          ...reviews.filter(
            (review) => review.userId._id !== res?.data?.data.userId._id
          ),
        ]);
        toast.success(res.data.message || "Review submitted successfully!", {
          closeButton: true,
          duration: 2000,
        });
      } else {
        router.push("/routes/auth/login");
        toast.error(res?.data?.message || "Something went wrong", {
          closeButton: true,
          duration: 2000,
        });
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to submit review. Try again.", {
        closeButton: true,
        duration: 2000,
      });
    } finally {
      toast.dismiss(toastLoading);
    }

    setNewReview({ rating: 5, comment: "" });
    setHoverRating(0);
    setShowReviewForm(false);
  };

  function timeAgo(date: Date) {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  }

  const averageRating =
    reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length ||
    0;

  if (containerLoading.pgDetails) {
    return (
      <div className=" bg-gray-50 min-h-screen">
        <nav className="w-full fixed top-0 left-0 z-50 backdrop-blur-md bg-white/20 py-1 px-4 shadow-2xl shadow-HG-500/10   ">
          <div className="flex items-center justify-between pr-2 md:px-4 py-2 md:py-3 max-w-6xl mx-auto">
            <Button
              variant="ghost"
              onClick={goBack}
              className="flex items-center px-3 md:gap-2 bg-HG-400/10 md:bg-transparent md:hover:bg-HG-400/10"
            >
              <ArrowLeft className="w-7 h-7" />
              <span className="sm:inline text-xs md:text-lg font-poppins">
                Back
              </span>
            </Button>
            <button
              className="hover:scale-125 transition"
              onClick={toggleWatchlist}
            >
              {isFavorite ? (
                <IconHeartFilled className=" md:h-7 md:w-7 text-red-500" />
              ) : (
                <IconHeart className="md:h-7 md:w-7 text-HG-500 dark:text-white" />
              )}
            </button>
          </div>
        </nav>

        <main className="px-4 pt-32 md:pt-36 max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6 lg:gap-12">
            <div className="space-y-8">
              <div className="relative animate-pulse   aspect-square max-w-sm sm:max-w-none mx-auto bg-gray-300 rounded-2xl overflow-hidden shadow-lg"></div>

              <div className="grid md:hidden grid-cols-5 gap-3 max-w-sm sm:max-w-none mx-auto">
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative aspect-square animate-pulse bg-gray-300  rounded-lg overflow-hidden transition-all shadow-sm ${
                      currentImageIndex === index
                        ? "ring-[2.5px] ring-HG-500 shadow-md"
                        : "hover:ring-2 hover:ring-gray-400 hover:shadow-lg"
                    }`}
                  ></button>
                ))}
              </div>
            </div>

            <div className="space-y flex flex-col justify-between gap-5 pb-16 md:pb-0 ">
              {/* Product Info */}
              <div className="bg-white  rounded-2xl p-6 shadow-sm">
                <h1 className=" md:text-3xl animate-pulse font-semibold mb-1 md:mb-3 font-poppins ">
                  Loading...
                </h1>

                <div className="flex flex-col items-start gap-3 mb-2 md:mb-3">
                  <div className="flex animate-pulse items-center gap-2 text-xs md:text-sm ">
                    Loading...
                  </div>
                  <div className="text-xs animate-pulse md:text-sm text-gray-500 font-inter">
                    Loading...
                  </div>
                </div>

                <p className="animate-pulse text-2xl md:text-4xl font-bold font-poppins text-HG-400 pt-1 md:pt-2 pb-4 md:pb-5">
                  Loading...
                </p>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 md:gap-5 ">
                  <Button
                    onClick={handleVisitClick}
                    className="border-2 border-HG-400 hover:bg-HG-400/40 hover:text-black hover:border-transparent transition duration-300 bg-transparent font-poppins text-HG-500 font-semibold uppercase gap-5 flex items-center"
                  >
                    <Calendar className="w-4 h-4 font-semibold hidden md:block" />
                    Visit Now
                  </Button>
                  <Button className="py-3 font-semibold hover: border-2 border-transparent font-poppins text-white uppercase flex items-center gap-5 bg-HG-500/80 hover:bg-HG-500">
                    <Phone className="w-4 h-4 hidden md:block " />
                    Book Now
                  </Button>
                </div>
              </div>

              {/* Owner Info */}
              <div className="bg-white  rounded-2xl p-5 md:p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="md:w-14 md:h-14 w-10 h-10">
                    {/* <AvatarImage src={user.avatarUrl} /> */}
                    <AvatarFallback className="text-HG-500  md:text-xl font-poppins">
                      {"?"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <h3 className="font-bold animate-pulse text-sm md:text-lg font-poppins">
                      Loading...
                    </h3>
                    <p className=" text-xs md:text-sm animate-pulse text-gray-600">
                      Loading...
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 text-gray-600 ">
                  <div className="flex items-center gap-2">
                    <MapPin className="md:w-4 md:h-4  w-3 h-3" />
                    <span className=" text-xs md:text-sm animate-pulse">
                      Loading...
                    </span>
                  </div>
                  <Link
                    href={"#"}
                    className=" text-xs md:text-sm hover:underline animate-pulse font-medium text-HG-500 cursor-pointer"
                  >
                    Loading...
                  </Link>
                </div>
              </div>

              {/* Thumbnail Images */}
              <div className="hidden md:grid grid-cols-5 gap-4 ">
                {listing?.images?.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative aspect-square animate-pulse bg-gray-300 rounded-lg overflow-hidden transition-all shadow-sm ${
                      currentImageIndex === index
                        ? "ring-[2.5px] ring-HG-500 shadow-md"
                        : "hover:ring-2 hover:ring-gray-400 hover:shadow-lg"
                    }`}
                  ></button>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const mapUrl = isIOS
    ? `http://maps.apple.com/?daddr=${listing?.location?.coordinates?.coordinates[1]},${listing?.location?.coordinates?.coordinates[0]}`
    : `https://www.google.com/maps/dir/?api=1&destination=${listing?.location?.coordinates?.coordinates[1]},${listing?.location?.coordinates?.coordinates[0]}`;

  return (
    <div className=" bg-gray-50">
      {/* Header */}
      <nav className="w-full fixed top-0 left-0 z-50 backdrop-blur-md bg-white/20 py-1 px-4 shadow-2xl shadow-HG-500/10   ">
        <div className="flex items-center justify-between pr-2 md:px-4 py-2 md:py-3 max-w-6xl mx-auto">
          <Button
            variant="ghost"
            onClick={goBack}
            className="flex items-center px-3 md:gap-2 bg-HG-400/10 md:bg-transparent md:hover:bg-HG-400/10"
          >
            <ArrowLeft className="w-7 h-7" />
            <span className="sm:inline text-xs md:text-lg font-poppins">
              Back
            </span>
          </Button>
          <button
            className="hover:scale-125 transition"
            onClick={toggleWatchlist}
          >
            {listing?.inWatchList ? (
              <IconHeartFilled className="md:h-7 md:w-7 text-red-500" />
            ) : (
              <IconHeart className="md:h-7 md:w-7 text-HG-500 dark:text-white" />
            )}
          </button>
        </div>
      </nav>

      <main className="px-4 py-32 md:py-36 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-6 lg:gap-12">
          {/* Product Images */}
          <div className="space-y-8">
            {/* Main Image - Smaller on mobile */}
            <div className="relative aspect-square max-w-sm sm:max-w-none mx-auto bg-gray-300 rounded-2xl overflow-hidden shadow-lg">
              <BlurImage
                openInNewTab={true}
                className="object-cover w-full cursor-pointer"
                src={listing?.images[currentImageIndex]?.url || ""}
                width={600}
                height={600}
                alt={"Main PG image"}
                priority={true}
              />

              {/* Navigation Arrows */}
              {listing.images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-md backdrop-blur-sm"
                    onClick={previousImage}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-md backdrop-blur-sm"
                    onClick={nextImage}
                  >
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </Button>
                </>
              )}

              {/* Image Counter */}
              <div className="absolute font-inter bottom-3 right-3 bg-black/70 text-white px-2 py-1 rounded-full text-xs font-medium">
                {currentImageIndex + 1} / {listing.images.length}
              </div>
            </div>

            <div className="grid md:hidden grid-cols-5 gap-3 max-w-sm sm:max-w-none mx-auto">
              {listing.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`relative aspect-square bg-gray-300 rounded-lg overflow-hidden transition-all shadow-sm ${
                    currentImageIndex === index
                      ? "ring-[2.5px] ring-HG-500 shadow-md"
                      : "hover:ring-2 hover:ring-gray-400 hover:shadow-lg"
                  }`}
                >
                  <BlurImage
                    className="object-cover w-full"
                    src={listing?.images[index].url}
                    width={200}
                    height={200}
                    alt={"PG image"}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Details */}

          <div className="space-y flex flex-col justify-between gap-5 pb-10 md:pb-0">
            {/* Product Info */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h1 className=" md:text-3xl font-semibold mb-1 md:mb-3 font-poppins ">
                {listing?.pgName}
              </h1>

              <div className="flex flex-col items-start gap-3 mb-2 md:mb-3">
                <div className="flex items-center gap-2 text-xs md:text-sm ">
                  <StarRating rating={averageRating} />
                  <span className="text-sm text-gray-600 font-medium">
                    {reviews?.length > 0
                      ? `${averageRating.toFixed(1)} (${
                          reviews.length
                        } reviews)`
                      : `${averageRating.toFixed(1)} (0 reviews)`}
                  </span>
                </div>
                <div className="text-xs md:text-sm text-gray-500 font-inter">
                  Listed on{" "}
                  {listing?.createdAt
                    ? new Date(listing.createdAt).toLocaleDateString()
                    : "N/A"}
                </div>
              </div>

              <p className="text-2xl md:text-4xl font-bold font-poppins text-HG-400 pt-1 md:pt-2 pb-4 md:pb-5">
                ₹{listing?.minRent?.toLocaleString()}{" "}
                <span className="text-sm md:text-base font-medium text-gray-600 dark:text-gray-300">
                  /mo
                </span>
              </p>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 md:gap-5 ">
                <Button
                  onClick={handleVisitClick}
                  className="border-2 border-HG-400 hover:bg-HG-400/40 hover:text-black hover:border-transparent transition duration-300 bg-transparent font-poppins text-HG-500 font-semibold uppercase gap-5 flex items-center"
                >
                  <Calendar className="w-4 h-4 font-semibold hidden md:block" />
                  Visit Now
                </Button>
                <Button className="py-3 font-semibold hover: border-2 border-transparent font-poppins text-white uppercase flex items-center gap-5 bg-HG-500/80 hover:bg-HG-500">
                  <Phone className="w-4 h-4 hidden md:block " />
                  Book Now
                </Button>
              </div>
            </div>

            {/* Owner Info */}
            <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-5 md:mb-4">
                {/* <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-lg font-bold text-white">AS</span>
                      </div> */}

                <Avatar className="md:w-14 md:h-14 w-10 h-10">
                  {/* <AvatarImage src={user.avatarUrl} /> */}
                  <AvatarFallback className="text-HG-500 text-xl font-poppins">
                    {listing?.ownerId?.fullName?.slice(0, 1).toUpperCase() ||
                      "?"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <h3 className="font-bold text-sm nd:text-lg font-poppins">
                    {listing?.ownerId?.fullName}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-600">
                    Verified Seller • Member since{" "}
                    {listing?.ownerId?.createdAt
                      ? new Date(
                          listing?.ownerId?.createdAt
                        ).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 text-gray-600 ">
                <div className="flex items-center gap-2">
                  <MapPin className="md:w-4 md:h-4 w-3 h-3" />
                  <span className=" text-xs md:text-sm ">
                    {listing?.ownerId?.address?.city +
                      ", " +
                      listing?.ownerId?.address?.state}
                  </span>
                </div>
                {/* <Link
                      href={"/"}
                      className="text-xs md:text-sm hover:underline font-medium text-HG-500 cursor-pointer"
                    >
                      Other PG&apos;s by {listing?.ownerId?.fullName}
                    </Link> */}
              </div>
            </div>

            {/* Thumbnail Images */}
            <div className=" hidden md:grid grid-cols-5 gap-4 ">
              {listing.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`relative aspect-square bg-gray-300 rounded-lg overflow-hidden transition-all shadow-sm ${
                    currentImageIndex === index
                      ? "ring-[3px] ring-HG-500 shadow-md"
                      : "hover:ring-2 hover:ring-gray-400 hover:shadow-lg"
                  }`}
                >
                  <BlurImage
                    className="object-cover w-full"
                    src={listing?.images[index].url}
                    width={200}
                    height={200}
                    alt={"PG images"}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="md:mt-20 bg-white rounded-2xl shadow-md overflow-hidden py-5 px-3 md:p-5">
          <Tabs defaultValue="details" className="w-full   ">
            <TabsList className="grid w-full grid-cols-3 bg-HG-400/20 rounded-xl font-poppins">
              <TabsTrigger
                value="details"
                className="rounded-lg text-xs md:text-sm"
              >
                Details
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="rounded-lg text-xs md:text-sm"
              >
                Reviews ( {reviews.length} )
              </TabsTrigger>
              <TabsTrigger
                value="location"
                className="rounded-lg text-xs md:text-sm"
              >
                Location
              </TabsTrigger>
            </TabsList>

            <div className="px-2 md:px-4 pt-8 font-inter">
              <TabsContent value="details" className="mt-0">
                <div className="prose max-w-none space-y-10">
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold tracking-wide mb-4 md:mb-6 font-poppins">
                      Room Types & Pricing
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 text-sm text-gray-700">
                      {listing?.roomTypes?.length > 0 ? (
                        listing.roomTypes.map((room, index) => {
                          const IconComponent =
                            roomTypeIcons[room?.type?.toLowerCase()] || Bed;
                          return (
                            <div
                              key={index}
                              className="w-full max-w-[320px] border-4 border-HG-500 rounded-xl border-opacity-25 overflow-hidden hover:border-opacity-50 transition duration-300 ease-in group bg-white hover:shadow-[0_8px_20px_rgb(0,0,0,0.08)] hover:scale-[1.02]"
                            >
                              <div className="p-4 font-inter bg-white flex flex-col h-full">
                                {/* Header with Icon and Type */}
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="p-2 bg-HG-100 rounded-lg">
                                    <IconComponent className="w-5 h-5 md:w-6 md:h-6 text-HG-600" />
                                  </div>
                                  <h4 className="font-semibold text-lg text-HG-900 capitalize">
                                    {room?.type || "Type N/A"}
                                  </h4>
                                </div>

                                {/* Price */}
                                <div className="mb-4">
                                  <div className="flex items-center gap-2 mb-1">
                                    <IndianRupee className="w-4 h-4 text-HG-400" />
                                    <span className="text-2xl font-bold font-poppins text-HG-400">
                                      ₹
                                      {room?.monthlyRent?.toLocaleString() ??
                                        "N/A"}
                                    </span>
                                    <span className="text-base font-medium text-gray-600">
                                      /mo
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-500">
                                    Security:{" "}
                                    <span className="text-HG-400 font-semibold">
                                      ₹
                                      {room?.securityDeposit?.toLocaleString() ??
                                        "0"}
                                    </span>
                                  </p>
                                </div>

                                {/* Room Details */}
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-600">
                                      Available Rooms:
                                    </span>
                                    <span className="font-medium text-HG-600">
                                      {room?.availableRooms ?? "0"}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-600">
                                      Capacity per Room:
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <UserCheck className="w-4 h-4 text-gray-500" />
                                      <span className="font-medium">
                                        {room?.capacityPerRoom ?? "0"}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Availability Badge */}
                                <div className="mt-auto pt-3 border-t border-gray-100">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      (room?.availableRooms ?? 0) > 0
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {(room?.availableRooms ?? 0) > 0
                                      ? "Available"
                                      : "Fully Occupied"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-gray-500 col-span-full text-center py-8">
                          No room types available.
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className=" text-lg md:text-xl font-semibold tracking-wide mb-2 md:mb-4 font-poppins">
                      Gender Preference
                    </h3>
                    <div className="flex items-center gap-3 p-4 bg-HG-50 rounded-lg border border-HG-200">
                      <div className="p-2 bg-HG-100 rounded-lg">
                        <Users className="w-5 h-5 text-HG-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {listing?.genderPreference === "both"
                          ? "Male & Female"
                          : listing?.genderPreference}
                      </span>
                    </div>
                  </div>

                  {/* ✅ Section 1: Additional Details */}
                  <div>
                    <h3 className=" text-lg md:text-xl font-semibold tracking-wide mb-2 md:mb-4 font-poppins">
                      Additional Details
                    </h3>
                    <ul className="list-disc text-gray-700 pl-5 text-sm md:text-base space-y-2">
                      {listing?.additionalDetails.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* ✅ Section 2: Amenities */}
                  <div>
                    <h3 className=" text-lg md:text-xl font-semibold tracking-wide mb-2 md:mb-4 font-poppins">
                      Amenities
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 text-xs md:text-sm text-gray-700">
                      {listing?.amenities.map((amenity, index) => {
                        const IconComponent =
                          amenityIcons[amenity.toLowerCase()] || Home;
                        return (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-4 rounded-lg bg-white border-2 border-gray-200 hover:border-HG-400 hover:bg-HG-50 transition-all duration-300 shadow-sm hover:shadow-md min-h-[60px]"
                          >
                            <div className="p-2 bg-HG-100 rounded-lg flex-shrink-0">
                              <IconComponent className="w-5 h-5 text-HG-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-700 capitalize flex-grow">
                              {amenity}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h3 className=" text-lg md:text-xl font-semibold tracking-wide mb-2 md:mb-4 font-poppins">
                      Rent Inclusions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {listing?.rentInclusions?.foodIncluded && (
                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                          <Utensils className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-medium text-green-700">
                            Food Included
                          </span>
                        </div>
                      )}
                      {listing?.rentInclusions?.electricityIncluded && (
                        <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <Zap className="w-5 h-5 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-700">
                            Electricity Included
                          </span>
                        </div>
                      )}
                      {listing?.rentInclusions?.maintenanceIncluded && (
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <Home className="w-5 h-5 text-blue-600" />
                          <span className="text-sm font-medium text-blue-700">
                            Maintenance Included
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ✅ Section 3: Rules and Regulations */}
                  <div>
                    <h3 className="  text-lg md:text-xl font-semibold tracking-wide mb-2 md:mb-4 font-poppins">
                      Rules & Regulations
                    </h3>
                    <ul className="text-gray-700 text-xs md:text-sm space-y-2">
                      {listing?.rulesAndRegulations.map((rule, index) => (
                        <li
                          key={index}
                          className="relative pl-3 md:pl-5 before:content-['*'] before:absolute before:left-0 before:top-[2px] before:text-red-600"
                        >
                          {rule}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* ✅ Section 4: Detailed Rules & Policies */}
                  {listing?.detailedRules && (
                    <div>
                      <h3 className="text-lg md:text-xl font-semibold tracking-wide mb-2 md:mb-4 font-poppins">
                        Detailed Policies
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {listing?.detailedRules?.lockInPeriod && (
                          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="w-4 h-4 text-gray-600" />
                              <span className="font-medium text-gray-900">
                                Lock-in Period
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">
                              {listing.detailedRules.lockInPeriod}
                            </p>
                          </div>
                        )}

                        {listing?.detailedRules?.noticePeriod && (
                          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="w-4 h-4 text-gray-600" />
                              <span className="font-medium text-gray-900">
                                Notice Period
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">
                              {listing.detailedRules.noticePeriod}
                            </p>
                          </div>
                        )}

                        {listing?.detailedRules?.entryTiming && (
                          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                              <DoorOpen className="w-4 h-4 text-green-600" />
                              <span className="font-medium text-gray-900">
                                Entry Timing
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">
                              {listing.detailedRules.entryTiming}
                            </p>
                          </div>
                        )}

                        {listing?.detailedRules?.exitTiming && (
                          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                              <DoorOpen className="w-4 h-4 text-red-600" />
                              <span className="font-medium text-gray-900">
                                Exit Timing
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">
                              {listing.detailedRules.exitTiming}
                            </p>
                          </div>
                        )}

                        {listing?.detailedRules?.guestStayPolicy && (
                          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Users className="w-4 h-4 text-blue-600" />
                              <span className="font-medium text-gray-900">
                                Guest Policy
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 capitalize">
                              {listing.detailedRules.guestStayPolicy.replace(
                                "-",
                                " "
                              )}
                            </p>
                          </div>
                        )}

                        {listing?.detailedRules?.smokingAlcoholPolicy && (
                          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Shield className="w-4 h-4 text-orange-600" />
                              <span className="font-medium text-gray-900">
                                Smoking & Alcohol
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 capitalize">
                              {listing.detailedRules.smokingAlcoholPolicy.replace(
                                "-",
                                " "
                              )}
                            </p>
                          </div>
                        )}

                        {listing?.detailedRules?.maintenanceCharges && (
                          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                              <IndianRupee className="w-4 h-4 text-yellow-600" />
                              <span className="font-medium text-gray-900">
                                Maintenance Charges
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">
                              {listing.detailedRules.maintenanceCharges}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ✅ Section 5: Property Type & Category */}
                  {(listing?.type || listing?.subType) && (
                    <div>
                      <h3 className="text-lg md:text-xl font-semibold tracking-wide mb-2 md:mb-4 font-poppins">
                        Property Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {listing?.type && (
                          <div className="flex items-center gap-3 p-4 bg-HG-50 rounded-lg border border-HG-200">
                            <Building className="w-5 h-5 text-HG-600" />
                            <div>
                              <span className="text-sm text-gray-600">
                                Property Type
                              </span>
                              <p className="font-medium text-gray-900 capitalize">
                                {listing.type}
                              </p>
                            </div>
                          </div>
                        )}

                        {listing?.subType && (
                          <div className="flex items-center gap-3 p-4 bg-HG-50 rounded-lg border border-HG-200">
                            <Home className="w-5 h-5 text-HG-600" />
                            <div>
                              <span className="text-sm text-gray-600">
                                Sub Type
                              </span>
                              <p className="font-medium text-gray-900 capitalize">
                                {listing.subType}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ✅ Section 6: Nearby Places */}
                  {listing?.location?.nearbyPlaces?.length > 0 && (
                    <div>
                      <h3 className="text-lg md:text-xl font-semibold tracking-wide mb-2 md:mb-4 font-poppins">
                        Nearby Places
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {listing.location.nearbyPlaces.map((place, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200"
                          >
                            <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            <span className="text-sm font-medium text-blue-700 truncate">
                              {place}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ✅ Section 7: Videos (if available) */}
                  {listing?.videos && listing.videos.length > 0 && (
                    <div>
                      <h3 className="text-lg md:text-xl font-semibold tracking-wide mb-2 md:mb-4 font-poppins">
                        Property Videos
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {listing.videos.map((video, index) => (
                          <div
                            key={index}
                            className="rounded-lg overflow-hidden border border-gray-200"
                          >
                            <video
                              controls
                              className="w-full h-48 object-cover"
                              poster="/placeholder.svg?height=200&width=350&text=Video+Thumbnail"
                            >
                              <source src={video.url} type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="reviews" className="mt-0">
                <div className="space-y-10">
                  {/* Reviews Header */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-4">
                      <div className="text-xl md:text-3xl font-bold font-poppins">
                        {averageRating.toFixed(1)}
                      </div>
                      <div>
                        <StarRating
                          rating={averageRating}
                          size=" w-3 h-3 md:w-5 md:h-5"
                        />
                        <p className=" text-xs md:text-sm text-gray-600 mt-1">
                          {reviews.length} reviews
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={() => setShowReviewForm(!showReviewForm)}
                      className="md:px-5 text-xs md:text-sm "
                    >
                      {showReviewForm ? "Cancel" : "Write Review"}
                    </Button>
                  </div>

                  {/* Inline Review Form - Always visible template */}
                  {showReviewForm && (
                    <Card className="border-none  pt-4 bg-HG-400/10 ">
                      <CardContent className="">
                        <div className="md:space-y-4 space-y-3">
                          <div>
                            <Label className="font-poppins text-sm md:text-base md:tracking-wide">
                              Rating
                            </Label>
                            <div className="flex md:gap-1 mt-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() =>
                                    setNewReview({
                                      ...newReview,
                                      rating: star,
                                    })
                                  }
                                  onMouseEnter={() => setHoverRating(star)}
                                  onMouseLeave={() => setHoverRating(0)}
                                  className="p-1 transition-transform hover:scale-110"
                                >
                                  <Star
                                    className={`md:w-8 md:h-8 transition-colors ${
                                      star <= (hoverRating || newReview.rating)
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-gray-300 hover:text-yellow-200"
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                            <p className=" text-xs md:text-sm text-HG-500 font-poppins uppercase pl-2 mt-1 font-medium">
                              {newReview.rating === 1 && "Poor"}
                              {newReview.rating === 2 && "Fair"}
                              {newReview.rating === 3 && "Good"}
                              {newReview.rating === 4 && "Very Good"}
                              {newReview.rating === 5 && "Excellent"}
                            </p>
                          </div>
                          <div>
                            <Label
                              htmlFor="review-comment"
                              className="font-poppins text-sm md:text-base md:tracking-wide"
                            >
                              Your Review
                            </Label>
                            <Textarea
                              id="review-comment"
                              value={newReview.comment}
                              onChange={(e) =>
                                setNewReview({
                                  ...newReview,
                                  comment: e.target.value,
                                })
                              }
                              placeholder="Share your experience ..."
                              rows={4}
                              className="mt-1 border-2 text-sm md:text-base border-gray-300  shadow-none resize-none focus-visible:ring-0 focus-visible:border-HG-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              {newReview.comment.length}/500 characters
                            </p>
                          </div>
                          <div className="w-full items-center  md:justify-end flex gap-5 ">
                            <Button
                              onClick={handleInlineSubmit}
                              disabled={
                                !newReview.comment.trim() ||
                                newReview.comment.length > 500
                              }
                              className="md:px-5 text-xs md:text-sm"
                            >
                              Submit Review
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setNewReview({
                                  rating: 0,
                                  comment: "",
                                });
                                setHoverRating(0);
                              }}
                              className="md:px-5 text-xs md:text-sm"
                            >
                              Clear
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Reviews List */}
                  <div className="space-y-4 ">
                    {reviews.map((review, idx) => (
                      <div
                        key={idx}
                        className="border-b border-HG-500/60 pb-4 last:border-b-0"
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="md:w-12 md:h-12">
                            {/* <AvatarImage src={user.avatarUrl} /> */}
                            <AvatarFallback className="text-HG-500 md:text-xl font-poppins">
                              {review?.userId?.fullName
                                ?.slice(0, 1)
                                .toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-sm md:text-base font-inter">
                                {review?.userId?.fullName}
                              </h4>
                              <span className=" text-xs md:text-sm text-gray-500">
                                {/* • {review?.createdAt.toLocaleDateString()} */}
                                •{" "}
                                {review?.updatedAt
                                  ? timeAgo(new Date(review.updatedAt))
                                  : ""}
                              </span>
                            </div>
                            <StarRating
                              size="w-3 h-3 md:w-4 md:h-4"
                              rating={review?.rating}
                            />
                            <p className="text-gray-700 mt-2  text-sm md:text-base">
                              {review?.comment}
                            </p>
                          </div>
                        </div>
                      </div>
                      // <div
                      //   key={review.id}
                      //   className="border-b pb-4 last:border-b-0"
                      // >
                      //   <div className="flex items-start gap-3">
                      //     <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      //       <span className="text-sm font-bold text-white">
                      //         {review.initials}
                      //       </span>
                      //     </div>
                      //     <div className="flex-1">
                      //       <div className="flex items-center gap-2 mb-1">
                      //         <h4 className="font-semibold">{review.name}</h4>
                      //         <span className="text-sm text-gray-500">
                      //           • {review.date}
                      //         </span>
                      //       </div>
                      //       <StarRating rating={review.rating} />
                      //       <p className="text-gray-700 mt-2">
                      //         {review.comment}
                      //       </p>
                      //     </div>
                      //   </div>
                      // </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="location" className="mt-0">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg md:text-xl font-semibold font-poppins tracking-wide">
                      PG Location
                    </h3>

                    <Button
                      onClick={handleDirectionClick}
                      className="md:px-5 text-xs md:text-sm"
                    >
                      Get Directions
                    </Button>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-gray-400 mb-3 text-xs md:text-sm">
                      {listing?.location?.area}
                    </div>

                    <div className="flex items-center gap-2 text-gray-600 mb-4 text-sm md:text-base">
                      <MapPin className="md:w-5 md:h-5 h-3 w-3" />
                      <span>
                        {listing?.location?.city +
                          ", " +
                          listing?.location?.state +
                          ", " +
                          listing?.location?.pincode}
                      </span>
                    </div>
                  </div>

                  {/* Enhanced Map Placeholder */}
                  <div className="w-full h-80 bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-HG-500/40">
                    <MapContainer
                      center={[
                        listing?.location?.coordinates?.coordinates[1],
                        listing?.location?.coordinates?.coordinates[0],
                      ]}
                      zoom={13}
                      style={{ height: "100%", width: "100%" }}
                    >
                      <TileLayer
                        attribution="&copy; OpenStreetMap contributors"
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker
                        key={`${listing?.location?.coordinates?.coordinates[1]}-${listing?.location?.coordinates?.coordinates[0]}`}
                        position={[
                          listing?.location?.coordinates?.coordinates[1],
                          listing?.location?.coordinates?.coordinates[0],
                        ]}
                      />
                    </MapContainer>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <div className="mt-10 ">
          <SectionHeading>
            Other PG&apos;s by {listing?.ownerId?.fullName}
          </SectionHeading>

          <OwnerListingSection
            listings={ownerPgs}
            loading={ownerPgsLoading}
            ownerName={listing?.ownerId?.fullName || "Owner"}
          />
        </div>

        {/* Infinite Scroll Listings */}
        <InfiniteScrollListings currentListingId={params.id as string} />
      </main>

      {/* Visit Request Form Modal */}
      {showVisitForm && (
        <VisitRequestForm
          listingId={params.id as string}
          pgName={listing?.pgName || ""}
          onSuccess={handleVisitFormClose}
          onCancel={handleVisitFormClose}
        />
      )}

      {/* Direction Confirmation Modal */}
      {showDirectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-HG-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-HG-500" />
              </div>
              <h3 className="text-xl font-bold font-poppins text-gray-900 mb-2">
                Have you visited this property before?
              </h3>
              <p className="text-gray-600 font-inter mb-6">
                This helps us provide you with the best directions and
                information.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDirectionYes}
                  className="flex-1 bg-HG-500 hover:bg-HG-600 text-white font-poppins font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Yes, I have visited
                </button>
                <button
                  onClick={handleDirectionNo}
                  className="flex-1 border-2 border-HG-400 hover:bg-HG-50 text-HG-500 font-poppins font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  No, first time
                </button>
              </div>
              <button
                onClick={() => setShowDirectionModal(false)}
                className="mt-3 text-gray-500 hover:text-gray-700 text-sm font-inter"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
