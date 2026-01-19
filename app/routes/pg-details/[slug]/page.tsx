"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  MapPin,
  Home,
  Users,
  Shield,
  Clock,
  Star,
  Share2,
  Heart,
  ArrowLeft,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  Calendar,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import MapWrapper from "@/components/maps/MapWrapper";
import VisitRequestForm from "@/components/VisitRequestForm";

// Types
interface RoomType {
  type: string;
  numberOfRooms: number;
  availableRooms: number;
  capacityPerRoom: number;
  monthlyRent: number;
  securityDeposit: number;
}

interface Location {
  area: string;
  city: string;
  state: string;
  pincode: string;
  nearbyPlaces: string[];
  coordinates: {
    type: string;
    coordinates: [number, number];
  };
}

interface MealTiming {
  enabled: boolean;
  from: string;
  to: string;
}

interface DetailedRules {
  lockInPeriod?: string;
  noticePeriod?: string;
  maintenanceCharges?: string;
  entryTiming?: string;
  exitTiming?: string;
  guestStayPolicy?: string;
  smokingAlcoholPolicy?: string;
}

interface Listing {
  _id: string;
  pgName: string;
  primaryLine?: string;
  type: string;
  subType?: string;
  roomTypes: RoomType[];
  genderPreference: string;
  amenities: string[];
  additionalDetails?: string[];
  rentInclusions: {
    foodIncluded: boolean;
    electricityIncluded: boolean;
    maintenanceIncluded: boolean;
  };
  mealTimings?: {
    morning: MealTiming;
    noon: MealTiming;
    evening: MealTiming;
    night: MealTiming;
  };
  rulesAndRegulations: string[];
  detailedRules?: DetailedRules;
  images: Array<{ url: string; public_id?: string }>;
  primaryImage?: string;
  videos?: Array<{ url: string; public_id?: string }>;
  location: Location;
  isApproved?: boolean;
  isActive?: boolean;
  isFeatured?: boolean;
  inWatchList?: boolean;
  createdAt: string;
  minRent?: number;
  ownerId: {
    _id: string;
    fullName: string;
    email?: string;
    phone?: string;
    address?: {
      city?: string;
      state?: string;
    };
  };
}

interface Review {
  _id: string;
  rating: number;
  comment: string;
  userId: {
    _id: string;
    fullName: string;
  };
  updatedAt: string;
}

interface ApiResponse {
  success: boolean;
  data?: {
    listing: Listing;
    reviews: Review[];
  };
  message?: string;
}

export default function PGDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [listing, setListing] = useState<Listing | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showVisitForm, setShowVisitForm] = useState(false);

  // Fetch listing data
  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/listing/${id}`);
        const body: ApiResponse = await response.json();

        if (body.success && body.data) {
          setListing(body.data.listing);
          setReviews(body.data.reviews || []);
          setInWatchlist(body.data.listing.inWatchList || false);
        } else {
          setError(body.message || "Failed to load listing");
        }
      } catch (err) {
        console.error("Error fetching listing:", err);
        setError("Failed to load listing details");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchListing();
  }, [id]);

  // Toggle watchlist
  const handleToggleWatchlist = async () => {
    try {
      const response = await fetch("/api/listing/toggleWatchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: id }),
      });

      const data = await response.json();

      if (data.success) {
        setInWatchlist(!inWatchlist);
        toast.success(
          inWatchlist ? "Removed from watchlist" : "Added to watchlist"
        );
      } else {
        toast.error(data.message || "Failed to update watchlist");
      }
    } catch (err) {
      console.error("Error toggling watchlist:", err);
      toast.error("Failed to update watchlist");
    }
  };

  // Share listing
  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing?.pgName,
          text: listing?.primaryLine || `Check out ${listing?.pgName}`,
          url: url,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Error state
  if (error || !listing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-600 text-lg">{error || "Listing not found"}</p>
        <Button onClick={() => router.push("/routes/all-listings")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Listings
        </Button>
      </div>
    );
  }

  // Safe data extraction
  const roomTypes = Array.isArray(listing.roomTypes) ? listing.roomTypes : [];
  const hasRoomTypes = roomTypes.length > 0;
  const minRent = hasRoomTypes
    ? Math.min(...roomTypes.map((r) => r.monthlyRent))
    : listing.minRent || 0;
  const maxRent = hasRoomTypes
    ? Math.max(...roomTypes.map((r) => r.monthlyRent))
    : listing.minRent || 0;
  const images = Array.isArray(listing.images) ? listing.images : [];
  const currentImage = images[selectedImage] || null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleShare}
                title="Share listing"
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleToggleWatchlist}
                className={
                  inWatchlist ? "border-red-500 bg-red-50" : "border-gray-300"
                }
                title={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
              >
                <Heart
                  className={`h-4 w-4 ${
                    inWatchlist ? "fill-red-500 text-red-500" : ""
                  }`}
                />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Image Gallery */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          <div className="relative h-96 rounded-xl overflow-hidden bg-gray-200">
            {currentImage || listing.primaryImage ? (
              <Image
                src={
                  currentImage?.url || listing.primaryImage || "/placeholder.jpg"
                }
                alt={listing.pgName}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No image available
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 h-96 overflow-y-auto">
            {images.length > 0 ? (
              images.map((img, idx) => (
                <button
                  key={img.public_id || idx}
                  className={`relative h-32 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                    selectedImage === idx
                      ? "border-blue-500 scale-95"
                      : "border-transparent hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedImage(idx)}
                >
                  <Image
                    src={img.url}
                    alt={`${listing.pgName} - ${idx + 1}`}
                    fill
                    className="object-cover hover:scale-110 transition-transform"
                    sizes="150px"
                  />
                </button>
              ))
            ) : (
              <div className="col-span-3 flex items-center justify-center text-gray-400">
                No additional images
              </div>
            )}
          </div>
        </section>

        {/* Title and Basic Info */}
        <section className="bg-white rounded-xl p-6 mb-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {listing.isFeatured && (
                  <Badge className="bg-yellow-500">Featured</Badge>
                )}
                {listing.type && <Badge variant="outline">{listing.type}</Badge>}
                {listing.subType && (
                  <Badge variant="secondary">{listing.subType}</Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {listing.pgName}
              </h1>
              {listing.primaryLine && (
                <p className="text-gray-600 text-lg mb-4">
                  {listing.primaryLine}
                </p>
              )}
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="h-5 w-5 text-blue-600" />
                <span>
                  {listing.location.area}, {listing.location.city},{" "}
                  {listing.location.state} - {listing.location.pincode}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {hasRoomTypes || minRent > 0 ? (
                  <>
                    ₹{minRent.toLocaleString("en-IN")}
                    {minRent !== maxRent &&
                      ` - ₹${maxRent.toLocaleString("en-IN")}`}
                  </>
                ) : (
                  <span className="text-gray-500 text-lg">Price on request</span>
                )}
              </div>
              <p className="text-gray-500">per month</p>
              <Button
                size="lg"
                className="mt-4 bg-blue-600 hover:bg-blue-700 w-full lg:w-auto"
                onClick={() => setShowVisitForm(true)}
              >
                <Calendar className="mr-2 h-5 w-5" />
                Schedule Visit
              </Button>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white p-1 rounded-lg shadow-sm">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="rooms">Rooms & Pricing</TabsTrigger>
            <TabsTrigger value="amenities">Amenities</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Property Highlights</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="font-semibold">Gender Preference</p>
                    <p className="text-gray-600 capitalize">
                      {listing.genderPreference}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Home className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="font-semibold">Room Types</p>
                    <p className="text-gray-600">
                      {hasRoomTypes
                        ? `${roomTypes.length} types available`
                        : "No room types added"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="font-semibold">Status</p>
                    <p className="text-green-600">
                      {listing.isActive ? "Active" : "Inactive"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rent Inclusions */}
            <Card>
              <CardHeader>
                <CardTitle>What&apos;s Included in Rent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    {listing.rentInclusions.foodIncluded ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-300" />
                    )}
                    <span>Food</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {listing.rentInclusions.electricityIncluded ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-300" />
                    )}
                    <span>Electricity</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {listing.rentInclusions.maintenanceIncluded ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-300" />
                    )}
                    <span>Maintenance</span>
                  </div>
                </div>

                {/* Meal Timings */}
                {listing.rentInclusions.foodIncluded &&
                  listing.mealTimings && (
                    <div className="mt-6 pt-6 border-t">
                      <h4 className="font-semibold mb-4">Meal Timings</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Object.entries(listing.mealTimings).map(
                          ([meal, timing]) =>
                            timing.enabled && (
                              <div
                                key={meal}
                                className="flex items-center gap-2"
                              >
                                <Clock className="h-4 w-4 text-blue-600" />
                                <div>
                                  <p className="font-medium capitalize">
                                    {meal}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {timing.from} - {timing.to}
                                  </p>
                                </div>
                              </div>
                            )
                        )}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rooms Tab */}
          <TabsContent value="rooms">
            <Card>
              <CardHeader>
                <CardTitle>Available Rooms</CardTitle>
              </CardHeader>
              <CardContent>
                {hasRoomTypes ? (
                  <div className="space-y-4">
                    {roomTypes.map((room, idx) => (
                      <div
                        key={idx}
                        className="border rounded-lg p-4 hover:border-blue-500 transition-colors"
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold mb-2">
                              {room.type}
                            </h3>
                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                              <p>
                                Total Rooms:{" "}
                                <span className="font-medium">
                                  {room.numberOfRooms}
                                </span>
                              </p>
                              <p>
                                Available:{" "}
                                <span className="font-medium text-green-600">
                                  {room.availableRooms}
                                </span>
                              </p>
                              <p>
                                Capacity:{" "}
                                <span className="font-medium">
                                  {room.capacityPerRoom} per room
                                </span>
                              </p>
                              <p>
                                Deposit:{" "}
                                <span className="font-medium">
                                  ₹{room.securityDeposit.toLocaleString("en-IN")}
                                </span>
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600">
                              ₹{room.monthlyRent.toLocaleString("en-IN")}
                            </div>
                            <p className="text-gray-500 text-sm">per month</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No room information available.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Amenities Tab */}
          <TabsContent value="amenities">
            <Card>
              <CardHeader>
                <CardTitle>Amenities & Facilities</CardTitle>
              </CardHeader>
              <CardContent>
                {listing.amenities && listing.amenities.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {listing.amenities.map((amenity, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
                      >
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{amenity}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No amenities listed.
                  </p>
                )}

                {listing.additionalDetails &&
                  listing.additionalDetails.length > 0 && (
                    <div className="mt-6 pt-6 border-t">
                      <h4 className="font-semibold mb-4">
                        Additional Details
                      </h4>
                      <ul className="space-y-2">
                        {listing.additionalDetails.map((detail, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rules Tab */}
          <TabsContent value="rules">
            <Card>
              <CardHeader>
                <CardTitle>Rules & Regulations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {listing.detailedRules && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {listing.detailedRules.lockInPeriod && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="font-semibold mb-1">Lock-in Period</p>
                        <p className="text-gray-600">
                          {listing.detailedRules.lockInPeriod}
                        </p>
                      </div>
                    )}
                    {listing.detailedRules.noticePeriod && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="font-semibold mb-1">Notice Period</p>
                        <p className="text-gray-600">
                          {listing.detailedRules.noticePeriod}
                        </p>
                      </div>
                    )}
                    {listing.detailedRules.entryTiming && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="font-semibold mb-1">Entry Timing</p>
                        <p className="text-gray-600">
                          {listing.detailedRules.entryTiming}
                        </p>
                      </div>
                    )}
                    {listing.detailedRules.exitTiming && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="font-semibold mb-1">Exit Timing</p>
                        <p className="text-gray-600">
                          {listing.detailedRules.exitTiming}
                        </p>
                      </div>
                    )}
                    {listing.detailedRules.guestStayPolicy && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="font-semibold mb-1">Guest Stay Policy</p>
                        <p className="text-gray-600 capitalize">
                          {listing.detailedRules.guestStayPolicy}
                        </p>
                      </div>
                    )}
                    {listing.detailedRules.smokingAlcoholPolicy && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="font-semibold mb-1">
                          Smoking & Alcohol
                        </p>
                        <p className="text-gray-600 capitalize">
                          {listing.detailedRules.smokingAlcoholPolicy}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {listing.rulesAndRegulations &&
                  listing.rulesAndRegulations.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-4">General Rules</h4>
                      <ul className="space-y-2">
                        {listing.rulesAndRegulations.map((rule, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">{rule}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {!listing.detailedRules &&
                  (!listing.rulesAndRegulations ||
                    listing.rulesAndRegulations.length === 0) && (
                    <p className="text-gray-500 text-center py-8">
                      No rules specified.
                    </p>
                  )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Location Tab */}
          <TabsContent value="location">
            <Card>
              <CardHeader>
                <CardTitle>Location & Nearby Places</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <MapPin className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold mb-1">Full Address</p>
                    <p className="text-gray-700">
                      {listing.location.area}
                      <br />
                      {listing.location.city}, {listing.location.state} -{" "}
                      {listing.location.pincode}
                    </p>
                  </div>
                </div>

                {listing.location.nearbyPlaces &&
                  listing.location.nearbyPlaces.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">Nearby Places</h4>
                      <div className="flex flex-wrap gap-2">
                        {listing.location.nearbyPlaces.map((place, idx) => (
                          <Badge key={idx} variant="secondary">
                            {place}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                {listing.location.coordinates?.coordinates && (
                  <div>
                    <h4 className="font-semibold mb-3">Location & Distance</h4>
                    <MapWrapper
                      lat={listing.location.coordinates.coordinates[1]}
                      lng={listing.location.coordinates.coordinates[0]}
                      pgName={listing.pgName}
                      address={`${listing.location.area}, ${listing.location.city}`}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Owner Contact */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Contact Owner</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="font-semibold text-lg">
                  {listing.ownerId.fullName}
                </p>
                <p className="text-gray-600">Property Owner</p>
                {listing.ownerId.address && (
                  <p className="text-sm text-gray-500 mt-1">
                    {listing.ownerId.address.city},{" "}
                    {listing.ownerId.address.state}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {listing.ownerId.phone && (
                  <Button asChild variant="outline">
                    <a href={`tel:${listing.ownerId.phone}`}>
                      <Phone className="mr-2 h-4 w-4" />
                      Call
                    </a>
                  </Button>
                )}
                {listing.ownerId.email && (
                  <Button asChild variant="outline">
                    <a href={`mailto:${listing.ownerId.email}`}>
                      <Mail className="mr-2 h-4 w-4" />
                      Email
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reviews */}
        {reviews.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Reviews ({reviews.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review._id}
                    className="border-b last:border-0 pb-4 last:pb-0"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-semibold">
                        {review.userId.fullName}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(review.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Visit Request Modal */}
      {showVisitForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <VisitRequestForm
              listingId={listing._id}
              pgName={listing.pgName}
            />
            <div className="p-4 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowVisitForm(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}