"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconAdjustmentsHorizontal,
  IconX,
  IconMapPin,
  IconCurrencyRupee,
  IconUsers,
  IconHome,
} from "@tabler/icons-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import {
  propertyTypes,
  predefinedAmenities,
} from "@/app/routes/dashboard/owners/add-pg/constants";
import {
  ChevronDown,
  Filter,
  X,
  Eye,
  EyeOff,
  Star,
  Zap,
  CreditCard,
  Check,
  Clock,
  AlertCircle,
} from "lucide-react";

// Visible status options
const visibleOptions = [
  { id: "approved", label: "Approved", icon: Check, color: "text-green-600" },
  {
    id: "pending",
    label: "Pending Approval",
    icon: Clock,
    color: "text-yellow-600",
  },
  { id: "active", label: "Active", icon: Eye, color: "text-blue-600" },
  { id: "inactive", label: "Inactive", icon: EyeOff, color: "text-gray-600" },
  { id: "featured", label: "Featured", icon: Star, color: "text-purple-600" },
  {
    id: "non-featured",
    label: "Non-Featured",
    icon: Star,
    color: "text-gray-400",
  },
  { id: "free", label: "Free Plan", icon: Zap, color: "text-green-600" },
  { id: "paid", label: "Paid Plan", icon: CreditCard, color: "text-blue-600" },
  {
    id: "subscription",
    label: "Subscription",
    icon: CreditCard,
    color: "text-purple-600",
  },
  {
    id: "payment-pending",
    label: "Payment Pending",
    icon: Clock,
    color: "text-yellow-600",
  },
  {
    id: "payment-completed",
    label: "Payment Completed",
    icon: Check,
    color: "text-green-600",
  },
  {
    id: "payment-failed",
    label: "Payment Failed",
    icon: AlertCircle,
    color: "text-red-600",
  },
];

interface FilterState {
  query: string;
  type: string;
  subType: string;
  minPrice: string;
  maxPrice: string;
  genderPreference: string;
  amenities: string[];
  roomTypes: string[];
  nearbyPlaces: string[];
  visible: string[];
  sortBy: string;
  lat: string;
  lng: string;
}

interface AdvancedFilterProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
}

const roomTypeOptions = [
  { id: "single", label: "Single Occupancy" },
  { id: "double", label: "Double Sharing" },
  { id: "triple", label: "Triple Sharing" },
  { id: "quad", label: "Quad Sharing" },
  { id: "studio", label: "Studio Apartment" },
  { id: "1bhk", label: "1 BHK" },
  { id: "2bhk", label: "2 BHK" },
  { id: "3bhk", label: "3 BHK" },
  { id: "1rk", label: "1 RK" },
];

const genderOptions = [
  { value: "male", label: "Boys/Male" },
  { value: "female", label: "Girls/Female" },
  { value: "both", label: "Unisex/Co-ed" },
];

const sortOptions = [
  { value: "", label: "Default" },
  { value: "price-low-high", label: "Price: Low to High" },
  { value: "price-high-low", label: "Price: High to Low" },
  { value: "rating-high-low", label: "Rating: High to Low" },
  { value: "rating-low-high", label: "Rating: Low to High" },
];

const AdvancedFilter: React.FC<AdvancedFilterProps> = ({
  filters,
  onFiltersChange,
  onApplyFilters,
  onClearFilters,
  activeFiltersCount,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);
  const [expandedSections, setExpandedSections] = useState({
    propertyType: true,
    priceRange: true,
    genderPreference: true,
    amenities: false,
    roomTypes: false,
    visible: false,
    sortBy: true,
  });

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const updateLocalFilter = (key: keyof FilterState, value: any) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleArrayValue = (key: keyof FilterState, value: string) => {
    const currentArray = localFilters[key] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter((item) => item !== value)
      : [...currentArray, value];
    updateLocalFilter(key, newArray);
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const handleClear = () => {
    // Preserve lat and lng from current filters to maintain location context
    const clearedFilters: FilterState = {
      query: "",
      type: "",
      subType: "",
      minPrice: "",
      maxPrice: "",
      genderPreference: "",
      amenities: [],
      roomTypes: [],
      nearbyPlaces: [],
      visible: [],
      sortBy: "",
      lat: filters.lat, // Preserve location coordinates
      lng: filters.lng, // Preserve location coordinates
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
    onClearFilters();
    setIsOpen(false);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const getSelectedPropertyTypeLabel = () => {
    if (localFilters.subType) {
      const type = propertyTypes.find((t) => t.id === localFilters.type);
      const subType = type?.subTypes.find((s) => s.id === localFilters.subType);
      return subType?.label || "All Types";
    }
    if (localFilters.type) {
      const type = propertyTypes.find((t) => t.id === localFilters.type);
      return type?.label || "All Types";
    }
    return "All Types";
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="relative flex items-center justify-center w-10 h-10 p-0 bg-white hover:bg-gray-50 border-gray-200 text-gray-700 rounded-lg"
        >
          <Filter className="w-4 h-4" />
          {activeFiltersCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full max-w-sm md:w-[500px] md:!max-w-none [scrollbar-width:none] overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle className="text-xl text-HG-500 -mb-2 font-semibold flex items-center gap-2">
            <IconAdjustmentsHorizontal className="w-5 h-5" />
            Advanced Filters
          </SheetTitle>
          <SheetDescription className="text-sm text-gray-500">
            Refine your search with detailed filters to find the perfect
            property
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Sort By */}
          <div>
            <button
              onClick={() => toggleSection("sortBy")}
              className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-2"
            >
              <span className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Sort By
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  expandedSections.sortBy ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {expandedSections.sortBy && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-3"
                >
                  <select
                    value={localFilters.sortBy}
                    onChange={(e) =>
                      updateLocalFilter("sortBy", e.target.value)
                    }
                    className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-HG-400"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {localFilters.sortBy === "location-nearby" && (
                    <p className="text-xs text-gray-500 italic">
                      Note: Location sorting works best when location filters
                      are applied
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Separator />

          {/* Property Type */}
          <div>
            <button
              onClick={() => toggleSection("propertyType")}
              className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-2"
            >
              <span className="flex items-center gap-2">
                <IconHome className="w-4 h-4" />
                Property Type
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  expandedSections.propertyType ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {expandedSections.propertyType && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-2"
                >
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-600 mb-2">
                      Selected:{" "}
                      <span className="font-medium">
                        {getSelectedPropertyTypeLabel()}
                      </span>
                    </p>

                    {/* All Types Option */}
                    <button
                      onClick={() => {
                        updateLocalFilter("type", "");
                        updateLocalFilter("subType", "");
                      }}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors mb-2 ${
                        !localFilters.type
                          ? "bg-HG-400/20 text-HG-600 font-medium"
                          : "bg-white hover:bg-gray-100"
                      }`}
                    >
                      All Types
                    </button>

                    {/* Property Types */}
                    {propertyTypes.map((type) => (
                      <div key={type.id} className="space-y-1">
                        <button
                          onClick={() => {
                            updateLocalFilter("type", type.id);
                            updateLocalFilter("subType", "");
                          }}
                          className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                            localFilters.type === type.id &&
                            !localFilters.subType
                              ? "bg-HG-400/20 text-HG-600 font-medium"
                              : "bg-white hover:bg-gray-100"
                          }`}
                        >
                          {type.label}
                        </button>

                        {/* Sub Types */}
                        {type.subTypes.length > 0 &&
                          localFilters.type === type.id && (
                            <div className="ml-4 space-y-1">
                              {type.subTypes.map((subType) => (
                                <button
                                  key={subType.id}
                                  onClick={() =>
                                    updateLocalFilter("subType", subType.id)
                                  }
                                  className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                                    localFilters.subType === subType.id
                                      ? "bg-HG-400/20 text-HG-600 font-medium"
                                      : "bg-white hover:bg-gray-100"
                                  }`}
                                >
                                  {subType.label}
                                </button>
                              ))}
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Separator />

          {/* Price Range */}
          <div>
            <button
              onClick={() => toggleSection("priceRange")}
              className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-2"
            >
              <span className="flex items-center gap-2">
                <IconCurrencyRupee className="w-4 h-4" />
                Price Range (per month)
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  expandedSections.priceRange ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {expandedSections.priceRange && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      placeholder="Min ₹"
                      value={localFilters.minPrice}
                      onChange={(e) =>
                        updateLocalFilter("minPrice", e.target.value)
                      }
                      className="w-1/2 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-HG-400"
                    />
                    <span className="text-gray-400">to</span>
                    <input
                      type="number"
                      placeholder="Max ₹"
                      value={localFilters.maxPrice}
                      onChange={(e) =>
                        updateLocalFilter("maxPrice", e.target.value)
                      }
                      className="w-1/2 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-HG-400"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Separator />

          {/* Gender Preference */}
          <div>
            <button
              onClick={() => toggleSection("genderPreference")}
              className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-2"
            >
              <span className="flex items-center gap-2">
                <IconUsers className="w-4 h-4" />
                Gender Preference
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  expandedSections.genderPreference ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {expandedSections.genderPreference && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-2"
                >
                  {genderOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() =>
                        updateLocalFilter(
                          "genderPreference",
                          localFilters.genderPreference === option.value
                            ? ""
                            : option.value
                        )
                      }
                      className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                        localFilters.genderPreference === option.value
                          ? "bg-HG-400/20 text-HG-600 font-medium"
                          : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Separator />

          {/* Room Types */}
          <div>
            <button
              onClick={() => toggleSection("roomTypes")}
              className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-2"
            >
              <span>Room Types</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  expandedSections.roomTypes ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {expandedSections.roomTypes && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="grid grid-cols-2 gap-2"
                >
                  {roomTypeOptions.map((roomType) => (
                    <button
                      key={roomType.id}
                      onClick={() => toggleArrayValue("roomTypes", roomType.id)}
                      className={`px-3 py-2 text-sm rounded-md transition-colors ${
                        localFilters.roomTypes.includes(roomType.id)
                          ? "bg-HG-400/20 text-HG-600 font-medium"
                          : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      {roomType.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Separator />

          {/* Amenities */}
          <div>
            <button
              onClick={() => toggleSection("amenities")}
              className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-2"
            >
              <span>Amenities</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  expandedSections.amenities ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {expandedSections.amenities && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="grid grid-cols-2 gap-2 text-sm"
                >
                  {predefinedAmenities.map((amenity) => (
                    <button
                      key={amenity.id}
                      onClick={() => toggleArrayValue("amenities", amenity.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                        localFilters.amenities.includes(amenity.id)
                          ? "bg-HG-400/20 text-HG-600 font-medium"
                          : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <amenity.icon className="w-4 h-4" />
                      <span className="text-xs">{amenity.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Separator />

          {/* Visible/Status */}
          <div>
            <button
              onClick={() => toggleSection("visible")}
              className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-2"
            >
              <span>Visibility & Status</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  expandedSections.visible ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {expandedSections.visible && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="grid grid-cols-1 gap-2 text-sm"
                >
                  {visibleOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => toggleArrayValue("visible", option.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                        localFilters.visible.includes(option.id)
                          ? "bg-HG-400/20 text-HG-600 font-medium"
                          : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <option.icon className={`w-4 h-4 ${option.color}`} />
                      <span className="text-xs">{option.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Active Filters Preview */}
          {activeFiltersCount > 0 && (
            <div className="bg-HG-50 p-3 rounded-md">
              <p className="text-sm font-medium text-HG-600 mb-2">
                Active Filters ({activeFiltersCount})
              </p>
              <div className="flex flex-wrap gap-1">
                {localFilters.type && (
                  <Badge variant="secondary" className="text-xs">
                    {getSelectedPropertyTypeLabel()}
                  </Badge>
                )}
                {localFilters.genderPreference && (
                  <Badge variant="secondary" className="text-xs">
                    {
                      genderOptions.find(
                        (g) => g.value === localFilters.genderPreference
                      )?.label
                    }
                  </Badge>
                )}
                {(localFilters.minPrice || localFilters.maxPrice) && (
                  <Badge variant="secondary" className="text-xs">
                    ₹{localFilters.minPrice || "0"} - ₹
                    {localFilters.maxPrice || "∞"}
                  </Badge>
                )}
                {localFilters.amenities.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {localFilters.amenities.length} amenities
                  </Badge>
                )}
                {localFilters.sortBy && (
                  <Badge variant="secondary" className="text-xs">
                    {
                      sortOptions.find((s) => s.value === localFilters.sortBy)
                        ?.label
                    }
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={handleClear}
              className="flex-1"
              disabled={activeFiltersCount === 0}
            >
              Clear All
            </Button>
            <Button
              onClick={handleApply}
              className="flex-1 bg-HG-500 hover:bg-HG-600"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AdvancedFilter;