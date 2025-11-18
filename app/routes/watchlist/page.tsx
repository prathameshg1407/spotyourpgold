"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";
import PgCard from "@/components/PgCard";
import {
  Check,
  Trash2,
  MapPin,
  User,
  IndianRupee,
  Star,
  Bed,
  Wifi,
  Car,
  Utensils,
  Shield,
  Zap,
  Eye,
  Phone,
  Calendar,
  Tv,
  Sofa,
  Shirt,
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
  AirVent,
  Droplets,
  Camera,
  Refrigerator,
  BrushIcon,
} from "lucide-react";

interface PGListing {
  _id: string;
  pgName: string;
  city: string;
  minRent?: number;
  primaryImage?: string;
  images?: { url: string }[];
  location?: {
    area?: string;
    city?: string;
  };
  primaryLine?: string;
  genderPreference?: string;
  type?: string;
  distance?: number;
  inWatchList?: boolean;
  ownerId: {
    _id: string;
    fullName: string;
  };
  amenities?: string[];
  rentInclusions?: {
    foodIncluded?: boolean;
    electricityIncluded?: boolean;
    maintenanceIncluded?: boolean;
  };
  rating?: number;
  roomType?: string[];
  minSecurity?: number;
}

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

export default function WishlistCompare() {
  const [listings, setListings] = useState<PGListing[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<PGListing | null>(
    null
  );

  useEffect(() => {
    const fetchWishlist = async () => {
      toast.loading("Loading wishlist...", {
        id: "wishlist-loading",
        duration: 0,
      });

      try {
        const res = await axios.get("/api/listing/getWishlist");
        // console.log("res", res);
        if (res?.data?.success) {
          setListings(res.data.data);
        } else {
          toast.error("Failed to fetch wishlist");
        }

        // Mock data
        // setListings([
        //   {
        //     _id: "61e0d0f7c9b0c1d6c0b3a2a3",
        //     pgName: "Comfort Stay PG",
        //     city: "Delhi",
        //     minRent: 12000,
        //     rating: 4.5,
        //     roomType: ["Single", "Double"],
        //     minSecurity: 24000,
        //     amenities: ["wifi", "meals", "security", "ac"],
        //     ownerId: {
        //       _id: "61e0d0f7c9b0c1d6c0b3a2a1",
        //       fullName: "Rajat Sharma",
        //     },
        //   },
        //   {
        //     _id: "61e0d0f7c9b0c1d6c0b3a2a4",
        //     pgName: "Elite Residency",
        //     city: "Mumbai",
        //     minRent: 18000,
        //     rating: 4.2,
        //     roomType: ["Double", "Triple"],
        //     minSecurity: 36000,
        //     amenities: ["wifi", "parking", "meals", "security"],
        //     ownerId: {
        //       _id: "61e0d0f7c9b0c1d6c0b3a2a2",
        //       fullName: "Anjali Verma",
        //     },
        //   },
        //   {
        //     _id: "61e0d0f7c9b0c1d6c0b3a2a5",
        //     pgName: "Student Hub PG",
        //     city: "Pune",
        //     minRent: 9000,
        //     rating: 4.0,
        //     roomType: ["Triple"],
        //     minSecurity: 18000,
        //     amenities: ["wifi", "meals", "power"],
        //     ownerId: {
        //       _id: "61e0d0f7c9b0c1d6c0b3a2a3",
        //       fullName: "Priya Singh",
        //     },
        //   },
        //   {
        //     _id: "61e0d0f7c9b0c1d6c0b3a2a6",
        //     pgName: "Premium Stay",
        //     city: "Bangalore",
        //     minRent: 22000,
        //     rating: 4.8,
        //     roomType: ["Single"],
        //     minSecurity: 44000,
        //     amenities: ["wifi", "parking", "meals", "security", "ac", "power"],
        //     ownerId: {
        //       _id: "61e0d0f7c9b0c1d6c0b3a2a4",
        //       fullName: "Arjun Patel",
        //     },
        //   },
        // ])
      } catch {
        toast.error("Something went wrong");
      } finally {
        setLoading(false);
        toast.dismiss("wishlist-loading");
      }
    };

    fetchWishlist();
  }, []);

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCompare = () => {
    if (selected.length < 2) {
      toast.error("Select at least two listings to compare.");
      return;
    }
    setCompareModalOpen(true);
  };

  const handleViewDetails = (listing: PGListing) => {
    setSelectedListing(listing);
    setDetailModalOpen(true);
  };

  const handleRemove: (id: string) => Promise<void> = async (id: string) => {
    if (loading) return;
    setLoading(true);

    const loadingToast = toast.loading("Updating watchlist...", {
      closeButton: true,
    });

    try {
      const res = await axios.put(`/api/listing/toggleWatchlist`, {
        id: id,
        isWishlisted: true,
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
        return;
      }

      if (res?.data?.success) {
        setListings((prev) => prev.filter((listing) => listing._id !== id));

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
      toast.error("Failed to update watchlist. Try again.", {
        closeButton: true,
        duration: 2000,
      });
    } finally {
      toast.dismiss(loadingToast);
      setLoading(false);
    }
  };

  const selectedListings = listings.filter((listing) =>
    selected.includes(listing._id)
  );

  // Predefined comparison fields
  const comparisonFields = [
    // { key: "name", label: "PG Name", icon: User },
    { key: "minRent", label: "Min Rent", icon: IndianRupee },
    { key: "roomType", label: "Room Types", icon: Bed },
    { key: "minSecurity", label: "Min Security Deposit", icon: Shield },
    { key: "wifi", label: "WiFi", icon: Wifi },
    // { key: "meals", label: "Food", icon: Utensils },
    { key: "security", label: "CCTV", icon: Shield },
    { key: "ac", label: "AC", icon: Zap },
    { key: "rating", label: "Rating", icon: Star },
    { key: "city", label: "City", icon: MapPin },
  ];

  const renderComparisonValue = (field: string, item: PGListing) => {
    switch (field) {
      case "minRent":
        return (
          <div>
            <span className="text-lg font-bold text-green-600">
              ₹{item.minRent?.toLocaleString() || "N/A"}
            </span>
            <div className="text-xs text-gray-500">per month</div>
          </div>
        );
      case "roomType":
        return (
          <div className="text-sm">
            {item.roomType && item.roomType.length > 0
              ? item.roomType.join(", ")
              : "N/A"}
          </div>
        );
      case "minSecurity":
        return (
          <div>
            <span className="font-medium">
              ₹{item.minSecurity?.toLocaleString() || "N/A"}
            </span>
          </div>
        );
      case "city":
        return (
          <div className="flex items-center justify-center gap-1">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">{item.city}</span>
          </div>
        );
      case "rating":
        return item.rating ? (
          <div className="flex items-center justify-center gap-1">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= Math.floor(item.rating!)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-medium ml-1">({item.rating})</span>
          </div>
        ) : (
          <span className="text-gray-400">No rating</span>
        );
      case "wifi":
      case "meals":
      case "security":
      case "ac":
        return item.amenities?.includes(field) ? (
          <Check className="h-6 w-6 text-green-500 mx-auto" />
        ) : (
          <span className="text-red-500 text-xl font-bold">✗</span>
        );
      default:
        return "N/A";
    }
  };

  return (
    <div className="space-y-6 px-4 py-6 sm:py-10 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">My Wishlist</h1>
        <Button
          onClick={handleCompare}
          disabled={selected.length < 2}
          className="w-full sm:w-auto"
        >
          Compare ({selected.length})
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-HG-500"></div>
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">No items in wishlist.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
          {listings.map((item) => (
            <div key={item._id} className="relative group">
              <PgCard
                id={item._id}
                image={item.primaryImage || item.images?.[0]?.url || ""}
                images={item.images?.map((img: any) => img.url) || []}
                area={item.location?.area || item.city}
                pgName={item.pgName}
                primaryLine={item.primaryLine}
                ownerName={item.ownerId?.fullName}
                price={item.minRent || 0}
                genderPreference={item.genderPreference}
                isWishlisted={item.inWatchList}
                type={item.type}
                distance={item.distance}
                amenities={item.amenities || []}
                rentInclusions={item.rentInclusions || {}}
              />

              {/* Overlay with action buttons */}
              <div className="absolute top-2 left-2 right-2 flex flex-col sm:flex-row gap-2 z-20">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selected.includes(item._id)}
                    onChange={() => toggleSelect(item._id)}
                    className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 rounded focus:ring-blue-500 bg-white shadow-md"
                  />
                </div>
                <div className="flex gap-2 flex-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 sm:flex-none border-HG-500 text-HG-600 hover:bg-HG-50 hover:border-HG-600 bg-white shadow-md text-xs sm:text-sm"
                    onClick={() => handleViewDetails(item)}
                  >
                    <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="hidden sm:inline">Details</span>
                    <span className="sm:hidden">View</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 sm:flex-none border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 bg-white shadow-md text-xs sm:text-sm"
                    onClick={() => handleRemove(item._id)}
                  >
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="hidden sm:inline">Remove</span>
                    <span className="sm:hidden">Del</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comparison Modal */}
      <Dialog open={compareModalOpen} onOpenChange={setCompareModalOpen}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-auto [scrollbar-width:none] p-0">
          <DialogHeader className="p-4 sm:p-6 pb-4 border-b">
            <DialogTitle className="text-xl sm:text-2xl font-bold">
              Compare PG Accommodations ({selectedListings.length})
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto p-4 sm:p-6">
            <div className="min-w-max">
              <table className="w-full border-collapse">
                {/* Header Row */}
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left p-2 sm:p-4 font-bold text-gray-900 bg-gray-50 sticky left-0 z-10 min-w-[150px] sm:min-w-[200px]">
                      <span className="text-sm sm:text-base">Feature</span>
                    </th>
                    {selectedListings.map((item) => (
                      <th
                        key={item._id}
                        className="text-center p-2 sm:p-4 font-bold text-gray-900 bg-gray-50 min-w-[200px] sm:min-w-[250px]"
                      >
                        <div className="space-y-1 sm:space-y-2">
                          <div className="text-sm sm:text-lg font-semibold line-clamp-2">
                            {item.pgName}
                          </div>
                          <div className="flex items-center justify-center gap-1 text-xs sm:text-sm text-gray-600">
                            <User className="h-3 w-3" />
                            <span className="truncate">
                              {item.ownerId?.fullName}
                            </span>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonFields.map((field, index) => {
                    const IconComponent = field.icon;
                    return (
                      <tr
                        key={field.key}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="p-2 sm:p-4 font-semibold text-gray-900 bg-white sticky left-0 z-10 border-r border-gray-200">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <IconComponent className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="text-xs sm:text-sm">
                              {field.label}
                            </span>
                          </div>
                        </td>
                        {selectedListings.map((item) => (
                          <td key={item._id} className="p-2 sm:p-4 text-center">
                            <div className="text-xs sm:text-sm">
                              {renderComparisonValue(field.key, item)}
                            </div>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-bold">
              {selectedListing?.pgName}
            </DialogTitle>
          </DialogHeader>

          {selectedListing && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-3">
                      Basic Information
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Owner:</span>
                        <span>
                          {selectedListing.ownerId?.fullName || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Location:</span>
                        <span>{selectedListing.city}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <IndianRupee className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Starting Rent:</span>
                        <span className="text-green-600 font-bold">
                          ₹{selectedListing.minRent?.toLocaleString() || "N/A"}
                          /month
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Security Deposit:</span>
                        <span>
                          ₹
                          {selectedListing.minSecurity?.toLocaleString() ||
                            "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-3">Room Details</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Bed className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Room Types:</span>
                        <span>
                          {selectedListing.roomType?.join(", ") || "N/A"}
                        </span>
                      </div>
                      {selectedListing.rating && (
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">Rating:</span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= Math.floor(selectedListing.rating!)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                            <span className="ml-1">
                              ({selectedListing.rating})
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              {selectedListing.amenities &&
                selectedListing.amenities.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-3">Amenities</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 text-xs md:text-sm text-gray-700">
                      {selectedListing.amenities.map((amenity, index) => {
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
                )}

              {/* Action Buttons */}
              {/* <div className="flex gap-4 pt-4">
                <Button className="flex-1 bg-HG-500 hover:bg-HG-600 text-white">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Visit
                </Button>
              </div> */}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
