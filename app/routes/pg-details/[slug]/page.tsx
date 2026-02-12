// app/routes/pg-details/[slug]/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  Star,
  Phone,
  Calendar,
  MapPin,
  Share2,
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
import { IconHeart, IconHeartFilled, IconArrowUpRight } from "@tabler/icons-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { useLoadingStore } from "@/store/loading";
import { useUserStore } from "@/store/userStore";
import { decryptResponse, isEncryptedResponse } from "@/lib/decryption";

import SectionHeading from "@/components/SectionHeading";
import PgCard from "@/components/PgCard";
import OwnerListingSection from "@/components/OwnerListingSection";
import VisitRequestForm from "@/components/VisitRequestForm";
import AuthModal from "@/components/AuthModal";

// Import our new components
import ProductGallery from "@/components/pg-details/ProductGallery";
import BookingModal from "@/components/pg-details/BookingModal";

// Dynamic imports for maps
const MapView = dynamic(() => import("@/components/maps/MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-xl">
      <span className="text-gray-500">Loading map...</span>
    </div>
  ),
});

const PGMapWithDistance = dynamic(
  () => import("@/components/maps/PGMapWithDistance"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[450px] bg-gray-200 flex items-center justify-center rounded-xl">
        <span className="text-gray-500">Loading map...</span>
      </div>
    ),
  }
);

// Amenities icon mapping
const amenityIcons: Record<string, any> = {
  wifi: Wifi, "wi-fi": Wifi,
  parking: Car,
  meals: Utensils,
  security: Shield, "24x7-security": Shield, "24x7 security": Shield,
  power: Zap, "power-backup": Zap, "power backup": Zap,
  ac: AirVent, "air conditioning": AirVent,
  geyser: Zap,
  "water-purifier": Droplets, "water purifier": Droplets,
  tv: Tv, "tv/entertainment": Tv,
  sofa: Sofa,
  laundry: Shirt, "laundry facility": Shirt,
  bed: Bed, "mattress-wardrobe": Bed, "mattress and wardrobe": Bed,
  bathroom: Bath,
  kitchen: Home,
  "combined-cooking": Coffee, "combined cooking area": Coffee,
  common: Users, "common-area": Users, "common area": Users, "common area / lounge": Users,
  coffee: Coffee,
  games: Gamepad2,
  gym: Dumbbell,
  study: BookOpen, "study-desk": BookOpen, "study desk": BookOpen,
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
  refrigerator: Refrigerator, "common-refrigerator": Refrigerator, "common refrigerator": Refrigerator,
  "separate-refrigerator": Refrigerator, "separate refrigerator": Refrigerator,
};

// Room type icons mapping
const roomTypeIcons: Record<string, any> = {
  single: Bed, double: Users, triple: Building, shared: Users, private: DoorOpen,
  "1 bhk": Home, "2 bhk": Building, "3 bhk": Building, "1 rk": DoorOpen,
  dormitory: Building, suite: Home, studio: DoorOpen,
};

// Star Rating Component
const StarRating = ({ rating, size = "w-4 h-4" }: { rating: number; size?: string }) => {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => {
        const fillPercentage = Math.min(Math.max(rating - star + 1, 0), 1);
        return (
          <div key={star} className="relative">
            <Star className={`${size} text-gray-300`} />
            <div className="absolute inset-0 overflow-hidden" style={{ width: `${fillPercentage * 100}%` }}>
              <Star className={`${size} fill-yellow-400 text-yellow-400`} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Nearby Listings Component (Static 12)
function NearbyListings({
  currentListingId,
  lat,
  lng,
}: {
  currentListingId: string;
  lat?: number;
  lng?: number;
}) {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);

  const removeDuplicates = (listingsArray: any[]) => {
    const seen = new Set();
    return listingsArray.filter((listing) => {
      if (seen.has(listing._id)) return false;
      seen.add(listing._id);
      return true;
    });
  };

  useEffect(() => {
    if (!lat || !lng || hasFetched) return;

    const fetchNearby = async () => {
      setLoading(true);
      try {
        const endpoint = "/api/listing/search";
        const params = new URLSearchParams({
          page: "1",
          per_page: "12",
          exclude: currentListingId,
          lat: lat.toString(),
          lng: lng.toString(),
          radius: "10",
        });

        const response = await axios.get(`${endpoint}?${params.toString()}`);
        
        if (response.data.success) {
          setListings(removeDuplicates(response.data.data).slice(0, 12)); 
        }
      } catch (error) {
        console.error("Error fetching nearby listings:", error);
      } finally {
        setLoading(false);
        setHasFetched(true);
      }
    };

    fetchNearby();
  }, [currentListingId, lat, lng, hasFetched]);

  if (loading) {
    return (
      <div className="mt-16">
        <SectionHeading>Nearby PG Accommodations</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
          {[...Array(4)].map((_, index) => (
            <div
              key={`skeleton-nearby-${index}`}
              className="w-full max-w-[320px] mx-auto animate-pulse"
            >
              <div className="border-4 border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-300 h-44 w-full"></div>
                <div className="p-4 bg-white">
                  <div className="bg-gray-300 h-3 rounded mb-2 w-1/2"></div>
                  <div className="bg-gray-300 h-5 rounded mb-2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="mt-16 text-center py-8">
        <p className="text-gray-500">No other PGs found nearby.</p>
      </div>
    );
  }

  return (
    <div className="mt-16">
      <SectionHeading>Nearby PG Accommodations</SectionHeading>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
        {listings.map((listing: any, index: number) => (
          <PgCard
            key={`${listing._id}-${index}`}
            id={listing._id}
            slug={listing.slug}
            image={listing.primaryImage || listing.images?.[0] || ""}
            images={listing.images || []}
            area={listing.location?.area}
            pgName={listing.pgName}
            primaryLine={listing.primaryLine}
            ownerName={listing.ownerId?.fullName}
            price={listing.minRent}
            genderPreference={listing.genderPreference}
            isWishlisted={listing.inWatchList}
            type={listing.type}
            distance={listing.distance} 
            amenities={listing.amenities || []}
            rentInclusions={listing.rentInclusions || {}}
          />
        ))}
      </div>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================
export default function ProductPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showDirectionsModal, setShowDirectionsModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ownerPgs, setOwnerPgs] = useState<any[]>([]);
  const [ownerPgsLoading, setOwnerPgsLoading] = useState(false);

  // New State for Direction Flow
  const [isDirectionFlow, setIsDirectionFlow] = useState(false);

  // Review state
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [hoverRating, setHoverRating] = useState(0);

  // Listing state
  const [listing, setListing] = useState<any>({
    inWatchList: false,
    type: "",
    subType: "",
    rentInclusions: { foodIncluded: false, electricityIncluded: false, maintenanceIncluded: false },
    detailedRules: {},
    roomTypes: [],
    ownerId: { _id: "", fullName: "", createdAt: "" },
    pgName: "",
    monthlyRent: 0,
    minRent: 0,
    securityDeposit: 0,
    numberOfRooms: 0,
    capacityPerRoom: 0,
    genderPreference: "unisex",
    amenities: [],
    additionalDetails: [],
    rulesAndRegulations: [],
    images: [{ url: "" }],
    primaryImage: "",
    videos: [],
    location: {
      area: "",
      city: "",
      state: "",
      pincode: "",
      nearbyPlaces: [],
      coordinates: { type: "", coordinates: [28.6139, 77.209] },
    },
    createdAt: new Date(),
  });

  const { containerLoading, setContainerLoading } = useLoadingStore();
  const { user } = useUserStore();
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();

  // --- Session Storage Helpers ---
  const getVisitRequestKey = (listingId: string) => `visit_request_${listingId}`;

  const hasSubmittedVisitRequest = (listingId: string) => {
    if (typeof window === "undefined") return false;
    const key = getVisitRequestKey(listingId);
    return sessionStorage.getItem(key) === "true";
  };

  const markVisitRequestSubmitted = (listingId: string) => {
    if (typeof window === "undefined") return;
    const key = getVisitRequestKey(listingId);
    sessionStorage.setItem(key, "true");
  };
  // -------------------------------

  // Fetch listing data
  useEffect(() => {
    let ignore = false;
    setContainerLoading("pgDetails", true);

    const fetchData = async () => {
      try {
        const response = await fetch(`/api/listing/${slug}`);
        const rawData = await response.json();
        const res = isEncryptedResponse(rawData) ? decryptResponse(rawData) : rawData;

        if (res?.success) {
          if (!ignore) {
            setListing(res.data.listing);
            setReviews(res.data.reviews);
          }
        } else {
          if (!ignore) {
            toast.error(res?.message || "Listing not found");
            router.replace("/");
          }
        }
      } catch (error) {
        if (!ignore) {
          toast.error("Failed to fetch listing");
          router.replace("/");
        }
      } finally {
        if (!ignore) setContainerLoading("pgDetails", false);
      }
    };

    if (slug) fetchData();

    return () => {
      ignore = true;
      setContainerLoading("pgDetails", false);
    };
  }, [router, setContainerLoading, slug]);

  // Fetch owner's other PGs
  useEffect(() => {
    if (!listing?.ownerId?._id) return;
    let ignore = false;
    setOwnerPgsLoading(true);

    const fetchData = async () => {
      try {
        const res = await axios.get(
          `/api/listing/getOwnerListing?owner=${listing.ownerId._id}&exclude=${listing._id}`
        );
        if (res?.data?.success && !ignore) {
          setOwnerPgs(res.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch owner listings");
      } finally {
        if (!ignore) setOwnerPgsLoading(false);
      }
    };

    fetchData();
    return () => { ignore = true; };
  }, [listing?.ownerId?._id, listing?._id]);

  // Watchlist toggle
  const toggleWatchlist = async () => {
    if (loading || !listing?._id) return;
    setLoading(true);
    try {
      const res = await axios.put(`/api/listing/toggleWatchlist`, {
        id: listing._id,
        isWishlisted: listing?.inWatchList,
      });
      if (res?.data?.success) {
        setListing((prev: any) => ({ ...prev, inWatchList: !prev.inWatchList }));
        toast.success(res.data.message || "Watchlist updated!");
      } else if (res.data.message === "Unauthorized") {
        router.push("/routes/auth/login");
      } else {
        toast.error(res?.data?.message || "Something went wrong");
      }
    } catch (error) {
      toast.error("Failed to update watchlist");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => window.history.back();

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: listing?.pgName, text: `Check out ${listing?.pgName}`, url });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleBookingClick = () => {
    if (!user) {
      setShowLoginModal(true);
    } else {
      setShowBookingModal(true);
    }
  };

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    setShowBookingModal(true);
  };

  // ✅ Updated: Normal Visit Button Click (No direction flow)
  const handleVisitClick = () => {
    setIsDirectionFlow(false);
    setShowVisitForm(true);
  };

  // ✅ Updated: Visit Form Cancel (Cancel flow)
  const handleVisitFormClose = () => {
    setShowVisitForm(false);
    setIsDirectionFlow(false); // Reset flow
  };

  // ✅ Updated: Visit Form Success
  const handleVisitFormSuccess = () => {
    if (listing?._id) {
      markVisitRequestSubmitted(listing._id);
    }
    setShowVisitForm(false);

    // If this was triggered by "Get Directions", open the map now
    if (isDirectionFlow) {
      setShowDirectionsModal(true);
      setIsDirectionFlow(false); // Reset flow
    }
  };

  // ✅ Updated: Handle Get Directions Click
  const handleDirectionClick = () => {
    if (listing?._id && hasSubmittedVisitRequest(listing._id)) {
      // If request already submitted, show map immediately
      setShowDirectionsModal(true);
    } else {
      // Otherwise, open visit form first and mark flow
      setIsDirectionFlow(true);
      setShowVisitForm(true);
    }
  };

  const openDirections = () => {
    const { coordinates } = listing?.location || {};
    if (coordinates?.coordinates) {
      const [lng, lat] = coordinates.coordinates;
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      window.open(googleMapsUrl, "_blank");
    } else {
      toast.error("Location not available");
    }
  };

  // Review submit
  const handleInlineSubmit = async (e: any) => {
    e.preventDefault();
    if (!newReview.comment.trim()) {
      toast.error("Please write a review");
      return;
    }
    if (!listing?._id) {
      toast.error("Listing not found");
      return;
    }

    const loadingToast = toast.loading("Submitting review...");
    try {
      const res = await axios.post("/api/reviews", {
        listingId: listing._id,
        rating: newReview.rating,
        comment: newReview.comment.trim(),
      });
      if (res?.data?.success) {
        setReviews([res.data.data, ...reviews.filter((r) => r.userId._id !== res.data.data.userId._id)]);
        toast.success("Review submitted successfully!");
      } else {
        router.push("/routes/auth/login");
        toast.error(res?.data?.message || "Something went wrong");
      }
    } catch (error) {
      toast.error("Failed to submit review");
    } finally {
      toast.dismiss(loadingToast);
    }
    setNewReview({ rating: 5, comment: "" });
    setHoverRating(0);
    setShowReviewForm(false);
  };

  const timeAgo = (date: Date) => {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  const averageRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length || 0;
  const isIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);

  // Loading state
  if (containerLoading.pgDetails) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <nav className="w-full fixed top-0 left-0 z-50 backdrop-blur-md bg-white/20 py-1 px-4 shadow-2xl shadow-HG-500/10">
          <div className="flex items-center justify-between pr-2 md:px-4 py-2 md:py-3 max-w-6xl mx-auto">
            <Button variant="ghost" onClick={goBack} className="flex items-center px-3 md:gap-2">
              <ArrowLeft className="w-7 h-7" />
              <span className="text-xs md:text-lg font-poppins">Back</span>
            </Button>
          </div>
        </nav>
        <main className="px-4 pt-32 md:pt-36 max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6 lg:gap-12">
            <div className="space-y-8">
              <div className="relative animate-pulse aspect-square max-w-sm sm:max-w-none mx-auto bg-gray-300 rounded-2xl" />
            </div>
            <div className="space-y-5">
              <div className="bg-white rounded-2xl p-6 shadow-sm animate-pulse">
                <div className="h-8 bg-gray-300 rounded w-3/4 mb-4" />
                <div className="h-4 bg-gray-300 rounded w-1/2 mb-2" />
                <div className="h-10 bg-gray-300 rounded w-1/3" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <nav className="w-full fixed top-0 left-0 z-50 backdrop-blur-md bg-white/20 py-1 px-4 shadow-2xl shadow-HG-500/10">
        <div className="flex items-center justify-between pr-2 md:px-4 py-2 md:py-3 max-w-6xl mx-auto">
          <Button variant="ghost" onClick={goBack} className="flex items-center px-3 md:gap-2 bg-HG-400/10 md:bg-transparent md:hover:bg-HG-400/10">
            <ArrowLeft className="w-7 h-7" />
            <span className="text-xs md:text-lg font-poppins">Back</span>
          </Button>
          <div className="flex items-center gap-2">
            <button className="hover:scale-110 transition p-2" onClick={handleShare}>
              <Share2 className="md:h-6 md:w-6 h-5 w-5 text-HG-500" />
            </button>
            <button className="hover:scale-125 transition" onClick={toggleWatchlist}>
              {listing?.inWatchList ? (
                <IconHeartFilled className="md:h-7 md:w-7 text-red-500" />
              ) : (
                <IconHeart className="md:h-7 md:w-7 text-HG-500" />
              )}
            </button>
          </div>
        </div>
      </nav>

      <main className="px-4 py-32 md:py-36 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-6 lg:gap-12">
          {/* Product Gallery */}
          <ProductGallery images={listing?.images || []} pgName={listing?.pgName || ""} />

          {/* Product Details */}
          <div className="flex flex-col justify-between gap-5 pb-10 md:pb-0">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h1 className="md:text-3xl font-semibold mb-1 md:mb-3 font-poppins">{listing?.pgName}</h1>
              <div className="flex flex-col items-start gap-3 mb-2 md:mb-3">
                <div className="flex items-center gap-2 text-xs md:text-sm">
                  <StarRating rating={averageRating} />
                  <span className="text-sm text-gray-600 font-medium">
                    {reviews?.length > 0 ? `${averageRating.toFixed(1)} (${reviews.length} reviews)` : "0 reviews"}
                  </span>
                </div>
                <div className="text-xs md:text-sm text-gray-500 font-inter">
                  Listed on {listing?.createdAt ? new Date(listing.createdAt).toLocaleDateString() : "N/A"}
                </div>
              </div>
              <p className="text-2xl md:text-4xl font-bold font-poppins text-HG-400 pt-1 md:pt-2 pb-4 md:pb-5">
                ₹{listing?.minRent?.toLocaleString()} <span className="text-sm md:text-base font-medium text-gray-600">/mo</span>
              </p>
              <div className="grid grid-cols-2 gap-3 md:gap-5">
                <Button onClick={handleVisitClick} className="border-2 border-HG-400 hover:bg-HG-400/40 hover:text-black hover:border-transparent transition duration-300 bg-transparent font-poppins text-HG-500 font-semibold uppercase gap-5 flex items-center">
                  <Calendar className="w-4 h-4 hidden md:block" />
                  Visit Now
                </Button>
                <Button onClick={handleBookingClick} className="py-3 font-semibold border-2 border-transparent font-poppins text-white uppercase flex items-center gap-5 bg-HG-500/80 hover:bg-HG-500">
                  <Phone className="w-4 h-4 hidden md:block" />
                  Book Now
                </Button>
              </div>
            </div>

            {/* Owner Info */}
            <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-5 md:mb-4">
                <Avatar className="md:w-14 md:h-14 w-10 h-10">
                  <AvatarFallback className="text-HG-500 text-xl font-poppins">
                    {listing?.ownerId?.fullName?.slice(0, 1).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-bold text-sm md:text-lg font-poppins">{listing?.ownerId?.fullName}</h3>
                  <p className="text-xs md:text-sm text-gray-600">
                    Verified Seller • Member since {listing?.ownerId?.createdAt ? new Date(listing.ownerId.createdAt).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin className="md:w-4 md:h-4 w-3 h-3" />
                  <span className="text-xs md:text-sm">
                    {listing?.location?.area && `${listing.location.area}, `}
                    {listing?.location?.city}
                    {listing?.location?.state && `, ${listing.location.state}`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="md:mt-20 bg-white rounded-2xl shadow-md overflow-hidden py-5 px-3 md:p-5">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-HG-400/20 rounded-xl font-poppins">
              <TabsTrigger value="details" className="rounded-lg text-xs md:text-sm">Details</TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-lg text-xs md:text-sm">Reviews ({reviews.length})</TabsTrigger>
              <TabsTrigger value="location" className="rounded-lg text-xs md:text-sm">Location</TabsTrigger>
            </TabsList>

            <div className="px-2 md:px-4 pt-8 font-inter">
              {/* Details Tab */}
              <TabsContent value="details" className="mt-0">
                <div className="prose max-w-none space-y-10">
                  {/* Room Types */}
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold tracking-wide mb-4 md:mb-6 font-poppins">Room Types & Pricing</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                      {listing?.roomTypes?.length > 0 ? (
                        listing.roomTypes.map((room: any, index: number) => {
                          const IconComponent = roomTypeIcons[room?.type?.toLowerCase()] || Bed;
                          return (
                            <div key={index} className="w-full max-w-[320px] border-4 border-HG-500 rounded-xl border-opacity-25 overflow-hidden hover:border-opacity-50 transition duration-300">
                              <div className="p-4 font-inter bg-white flex flex-col h-full">
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="p-2 bg-HG-100 rounded-lg">
                                    <IconComponent className="w-5 h-5 md:w-6 md:h-6 text-HG-600" />
                                  </div>
                                  <h4 className="font-semibold text-lg text-HG-900 capitalize">{room?.type || "Type N/A"}</h4>
                                </div>
                                <div className="mb-4">
                                  <div className="flex items-center gap-2 mb-1">
                                    <IndianRupee className="w-4 h-4 text-HG-400" />
                                    <span className="text-2xl font-bold font-poppins text-HG-400">₹{room?.monthlyRent?.toLocaleString() ?? "N/A"}</span>
                                    <span className="text-base font-medium text-gray-600">/mo</span>
                                  </div>
                                  <p className="text-sm text-gray-500">Security: <span className="text-HG-400 font-semibold">₹{room?.securityDeposit?.toLocaleString() ?? "0"}</span></p>
                                </div>
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Available Rooms:</span>
                                    <span className="font-medium text-HG-600">{room?.availableRooms ?? "0"}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Capacity per Room:</span>
                                    <span className="font-medium">{room?.capacityPerRoom ?? "0"}</span>
                                  </div>
                                </div>
                                <div className="mt-auto pt-3 border-t border-gray-100">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(room?.availableRooms ?? 0) > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                    {(room?.availableRooms ?? 0) > 0 ? "Available" : "Fully Occupied"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-gray-500 col-span-full text-center py-8">No room types available.</p>
                      )}
                    </div>
                  </div>

                  {/* Amenities */}
                  {listing?.amenities && listing.amenities.length > 0 && (
                    <div>
                      <h3 className="text-lg md:text-xl font-semibold tracking-wide mb-2 md:mb-4 font-poppins">Amenities</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                        {listing.amenities.map((amenity: string, index: number) => {
                          const IconComponent = amenityIcons[amenity.toLowerCase()] || Home;
                          return (
                            <div key={index} className="flex items-center gap-3 p-4 rounded-lg bg-white border-2 border-gray-200 hover:border-HG-400">
                              <div className="p-2 bg-HG-100 rounded-lg">
                                <IconComponent className="w-5 h-5 text-HG-600" />
                              </div>
                              <span className="text-sm font-medium text-gray-700 capitalize">{amenity}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="mt-0">
                <div className="space-y-10">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-4">
                      <div className="text-xl md:text-3xl font-bold font-poppins">{averageRating.toFixed(1)}</div>
                      <div>
                        <StarRating rating={averageRating} size="w-3 h-3 md:w-5 md:h-5" />
                        <p className="text-xs md:text-sm text-gray-600 mt-1">{reviews.length} reviews</p>
                      </div>
                    </div>
                    <Button onClick={() => setShowReviewForm(!showReviewForm)} className="md:px-5 text-xs md:text-sm">
                      {showReviewForm ? "Cancel" : "Write Review"}
                    </Button>
                  </div>

                  {showReviewForm && (
                    <Card className="border-none pt-4 bg-HG-400/10">
                      <CardContent>
                        <div className="md:space-y-4 space-y-3">
                          <div>
                            <Label className="font-poppins text-sm md:text-base">Rating</Label>
                            <div className="flex md:gap-1 mt-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setNewReview({ ...newReview, rating: star })}
                                  onMouseEnter={() => setHoverRating(star)}
                                  onMouseLeave={() => setHoverRating(0)}
                                  className="p-1 transition-transform hover:scale-110"
                                >
                                  <Star className={`md:w-8 md:h-8 transition-colors ${star <= (hoverRating || newReview.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="review-comment" className="font-poppins text-sm md:text-base">Your Review</Label>
                            <Textarea
                              id="review-comment"
                              value={newReview.comment}
                              onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                              placeholder="Share your experience..."
                              rows={4}
                              className="mt-1 border-2 text-sm md:text-base border-gray-300 shadow-none resize-none focus-visible:ring-0 focus-visible:border-HG-500"
                            />
                          </div>
                          <div className="w-full items-center md:justify-end flex gap-5">
                            <Button onClick={handleInlineSubmit} disabled={!newReview.comment.trim() || newReview.comment.length > 500} className="md:px-5 text-xs md:text-sm">
                              Submit Review
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="space-y-4">
                    {reviews.map((review, idx) => (
                      <div key={idx} className="border-b border-HG-500/60 pb-4 last:border-b-0">
                        <div className="flex items-start gap-3">
                          <Avatar className="md:w-12 md:h-12">
                            <AvatarFallback className="text-HG-500 md:text-xl font-poppins">
                              {review?.userId?.fullName?.slice(0, 1).toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-sm md:text-base font-inter">{review?.userId?.fullName}</h4>
                              <span className="text-xs md:text-sm text-gray-500">• {review?.updatedAt ? timeAgo(new Date(review.updatedAt)) : ""}</span>
                            </div>
                            <StarRating size="w-3 h-3 md:w-4 md:h-4" rating={review?.rating} />
                            <p className="text-gray-700 mt-2 text-sm md:text-base">{review?.comment}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Location Tab */}
              <TabsContent value="location" className="mt-0">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg md:text-xl font-semibold font-poppins tracking-wide">PG Location</h3>
                    {/* ✅ Updated: Call handleDirectionClick instead of direct modal open */}
                    <Button onClick={handleDirectionClick} className="md:px-5 text-xs md:text-sm">Get Directions</Button>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-gray-400 mb-3 text-xs md:text-sm">{listing?.location?.area}</div>
                    <div className="flex items-center gap-2 text-gray-600 mb-4 text-sm md:text-base">
                      <MapPin className="md:w-5 md:h-5 h-3 w-3" />
                      <span>{listing?.location?.city}, {listing?.location?.state}, {listing?.location?.pincode}</span>
                    </div>
                  </div>
                  <div className="w-full h-80 bg-gray-100 rounded-xl overflow-hidden border-2 border-dashed border-HG-500/40">
                    <MapView lat={listing?.location?.coordinates?.coordinates[1] || 0} lng={listing?.location?.coordinates?.coordinates[0] || 0} />
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Owner's Other PGs */}
        <div className="mt-10">
          <SectionHeading>Other PGs by {listing?.ownerId?.fullName}</SectionHeading>
          <OwnerListingSection listings={ownerPgs} loading={ownerPgsLoading} ownerName={listing?.ownerId?.fullName || "Owner"} />
        </div>

        {/* Nearby Listings */}
        <NearbyListings 
          currentListingId={listing?._id || ""} 
          lat={listing?.location?.coordinates?.coordinates[1]}
          lng={listing?.location?.coordinates?.coordinates[0]}
        />
      </main>

      {/* Modals */}
      {showVisitForm && listing?._id && (
        <VisitRequestForm 
          listingId={listing._id} 
          pgName={listing?.pgName || ""} 
          onSuccess={handleVisitFormSuccess} 
          onCancel={handleVisitFormClose} 
        />
      )}

      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-2xl max-w-md w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold font-poppins text-gray-900">Login Required</h3>
              <button onClick={() => setShowLoginModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-4">
              <p className="text-gray-600 font-inter mb-4">Please login or create an account to book this property.</p>
              <AuthModal onSuccess={handleLoginSuccess} />
            </div>
          </div>
        </div>
      )}

      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        listing={listing}
        user={user}
      />

      {showDirectionsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-2xl max-w-4xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold font-poppins text-gray-900">Get Directions to {listing?.pgName}</h3>
              <button onClick={() => setShowDirectionsModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            <div className="p-4">
              <PGMapWithDistance
                lat={listing?.location?.coordinates?.coordinates[1] || 0}
                lng={listing?.location?.coordinates?.coordinates[0] || 0}
                pgName={listing?.pgName || "PG Location"}
                address={`${listing?.location?.area || ""}, ${listing?.location?.city || ""}, ${listing?.location?.state || ""} - ${listing?.location?.pincode || ""}`}
              />
            </div>
            <div className="p-4 border-t bg-gray-50">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={openDirections} className="flex-1 bg-HG-500 hover:bg-HG-600 text-white">
                  <IconArrowUpRight className="w-5 h-5 mr-2" />
                  Open in {isIOS ? "Apple" : "Google"} Maps
                </Button>
                <Button onClick={() => setShowDirectionsModal(false)} variant="outline" className="flex-1">Close</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}