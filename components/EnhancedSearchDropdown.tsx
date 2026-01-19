"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, MapPin, Building, Loader2, Navigation } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { BlurImage } from "./BlurImage";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  useDynamicLocationSearch,
  LocationData,
} from "@/hooks/useDynamicLocationSearch";
import { cn } from "@/lib/utils";

interface Property {
  _id: string;
  slug?: string;
  pgName: string;
  type?: string;
  subType?: string;
  genderPreference?: string;
  location: {
    area: string;
    city: string;
  };
  primaryImage: string;
  minRent: number;
  amenities?: string[];
  roomTypes?: any[];
  ownerName?: string;
  relevanceScore?: number;
  isFeatured?: boolean;
  propertyType: "property";
}

interface Location {
  name: string;
  displayText: string;
  type: "city" | "area" | "state" | "country";
}

interface EnhancedSearchDropdownProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  onSelectProperty?: (property: Property) => void;
  onSelectLocation?: (location: Location) => void;
  placeholder?: string;
  className?: string;
  showDropdown?: boolean;
  onDropdownChange?: (show: boolean) => void;
  showNearbyOption?: boolean;
}

export default function EnhancedSearchDropdown({
  value,
  onChange,
  onClear,
  onSelectProperty,
  onSelectLocation,
  placeholder = "Search by location, PG name, or owner name...",
  className,
  showDropdown = true,
  onDropdownChange,
  showNearbyOption = true,
}: EnhancedSearchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<{
    properties: Property[];
    locations: Location[];
  }>({ properties: [], locations: [] });
  const [loading, setLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [detectedLocation, setDetectedLocation] = useState<LocationData | null>(
    null
  );

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const {
    userLocation,
    locationDenied,
    isGeocoding,
    geocodeLocation,
    searchNearby,
    searchInLocation,
    searchWithQuery,
  } = useDynamicLocationSearch();

  const debouncedSearch = useDebouncedValue(value, 150);

  // Check if query looks like a location
  const isLocationQuery = useCallback((query: string) => {
    const locationKeywords = [
      "city",
      "area",
      "locality",
      "district",
      "state",
      "near",
      "in",
      "around",
      "delhi",
      "mumbai",
      "bangalore",
      "pune",
      "hyderabad",
      "chennai",
      "kolkata",
      "ahmedabad",
      "jaipur",
      "lucknow",
      "kanpur",
      "nagpur",
      "indore",
      "thane",
      "bhopal",
      "visakhapatnam",
      "pimpri",
      "patna",
      "vadodara",
      "ghaziabad",
      "ludhiana",
      "agra",
      "nashik",
      "faridabad",
      "meerut",
      "rajkot",
      "kalyan",
      "vasai",
      "varanasi",
      "srinagar",
      "aurangabad",
      "dhanbad",
      "amritsar",
      "navi mumbai",
      "allahabad",
      "ranchi",
      "howrah",
      "coimbatore",
      "jabalpur",
      "gwalior",
      "vijayawada",
      "jodhpur",
      "madurai",
      "raipur",
      "kota",
      "guwahati",
      "chandigarh",
      "gurgaon",
      "noida",
      "greater noida",
      "faridabad",
      "ghaziabad",
      "meerut",
      "noida",
      "gurugram",
      "noida",
      "greater noida",
      "faridabad",
      "ghaziabad",
      "meerut",
      "noida",
      "gurugram",
      "noida",
      "greater noida",
      "faridabad",
      "ghaziabad",
      "meerut",
      "noida",
      "gurugram",
    ];

    const lowerQuery = query.toLowerCase().trim();

    // Check for location keywords
    const hasLocationKeyword = locationKeywords.some((keyword) =>
      lowerQuery.includes(keyword.toLowerCase())
    );

    // Check for patterns that suggest location names
    const locationPatterns = [
      /^[a-zA-Z\s]+$/, // Only letters and spaces
      /near\s+[a-zA-Z\s]+/i, // "near [location]"
      /in\s+[a-zA-Z\s]+/i, // "in [location]"
      /around\s+[a-zA-Z\s]+/i, // "around [location]"
      /[a-zA-Z\s]+\s+(city|area|locality|district|state)/i, // "[name] city/area/etc"
    ];

    const matchesPattern = locationPatterns.some((pattern) =>
      pattern.test(lowerQuery)
    );

    // If it's a short query (likely a city name) or matches patterns, treat as location
    return hasLocationKeyword || (lowerQuery.length <= 20 && matchesPattern);
  }, []);

  // Fetch suggestions from API
  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions({ properties: [], locations: [] });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(
        `/api/listing/suggestions?q=${encodeURIComponent(query)}&limit=8`
      );

      if (response.data?.success) {
        setSuggestions(response.data.data);
      }
    } catch (error) {
      setSuggestions({ properties: [], locations: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle location detection and geocoding
  useEffect(() => {
    if (debouncedSearch && isLocationQuery(debouncedSearch)) {
      // Extract location name from query (remove common prefixes)
      const cleanQuery = debouncedSearch
        .replace(/^(near|in|around|at)\s+/i, "")
        .replace(/\s+(city|area|locality|district|state)$/i, "")
        .trim();

      geocodeLocation(cleanQuery).then((location: LocationData | null) => {
        setDetectedLocation(location);
      });
    } else {
      setDetectedLocation(null);
    }
  }, [debouncedSearch, isLocationQuery, geocodeLocation]);

  // Fetch suggestions when query changes
  useEffect(() => {
    fetchSuggestions(debouncedSearch);
  }, [debouncedSearch, fetchSuggestions]);

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Notify parent of dropdown state changes
  useEffect(() => {
    onDropdownChange?.(isOpen);
  }, [isOpen, onDropdownChange]);

  // Calculate total items for keyboard navigation
  const totalItems =
    suggestions.properties.length +
    suggestions.locations.length +
    (detectedLocation ? 2 : 0) + // 2 options: "Search in" and "Search around"
    (showNearbyOption && userLocation ? 1 : 0);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        if (!isOpen) return;
        e.preventDefault();
        setFocusedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        if (!isOpen) return;
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        e.preventDefault();
        if (isOpen && focusedIndex >= 0) {
          handleItemSelect(focusedIndex);
        } else if (value.trim()) {
          // No item focused or dropdown closed, perform search
          handleSearch();
        }
        break;
      case "Escape":
        if (!isOpen) return;
        setIsOpen(false);
        setFocusedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle location selection
  const handleLocationSelect = async (location: LocationData) => {
    if (location.lat === 0 && location.lng === 0) {
      // Need to geocode
      const geocodedLocation = await geocodeLocation(location.name);
      if (geocodedLocation) {
        searchInLocation(geocodedLocation);
      }
    } else {
      searchInLocation(location);
    }
    setIsOpen(false);
    setFocusedIndex(-1);
  };

  // Handle location around search
  const handleLocationAroundSearch = async (location: LocationData) => {
    if (location.lat === 0 && location.lng === 0) {
      // Need to geocode
      const geocodedLocation = await geocodeLocation(location.name);
      if (geocodedLocation) {
        searchNearby(geocodedLocation);
      }
    } else {
      searchNearby(location);
    }
    setIsOpen(false);
    setFocusedIndex(-1);
  };

  // Handle nearby search
  const handleNearbySearch = () => {
    if (userLocation) {
      searchNearby(userLocation);
    }
    setIsOpen(false);
    setFocusedIndex(-1);
  };

  // Handle general search
  const handleSearch = () => {
    if (value.trim()) {
      if (detectedLocation) {
        searchWithQuery(value, detectedLocation);
      } else {
        searchWithQuery(value);
      }
    }
    setIsOpen(false);
    setFocusedIndex(-1);
  };

  // Handle item selection
  const handleItemSelect = (index: number) => {
    let currentIndex = 0;

    // Check if it's a detected location - Search in location
    if (detectedLocation && index === currentIndex++) {
      handleLocationSelect(detectedLocation);
      return;
    }

    // Check if it's a detected location - Search around location
    if (detectedLocation && index === currentIndex++) {
      handleLocationAroundSearch(detectedLocation);
      return;
    }

    // Check if it's nearby option
    if (showNearbyOption && userLocation && index === currentIndex++) {
      handleNearbySearch();
      return;
    }

    // Check properties
    if (index < currentIndex + suggestions.properties.length) {
      const propertyIndex = index - currentIndex;
      const property = suggestions.properties[propertyIndex];
      if (onSelectProperty) {
        onSelectProperty(property);
      } else {
        router.push(`/routes/pg-details/${property.slug || property._id}`);
      }
      setIsOpen(false);
      setFocusedIndex(-1);
      return;
    }
    currentIndex += suggestions.properties.length;

    // Check locations
    if (index < currentIndex + suggestions.locations.length) {
      const locationIndex = index - currentIndex;
      const location = suggestions.locations[locationIndex];
      handleLocationSelect({
        name: location.name,
        lat: 0, // Will be geocoded
        lng: 0,
        displayName: location.displayText,
        type: location.type,
      });
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(true);
    setFocusedIndex(-1);
  };

  // Handle input focus
  const handleInputFocus = () => {
    setIsOpen(true);
  };

  return (
    <div className={cn("relative w-full", className)} ref={dropdownRef}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-10 pr-10 py-2 w-full border-gray-300 focus:border-HG-500 focus:ring-HG-500"
        />
        {value && (
          <button
            onClick={onClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {/* Detected Location - Search in location */}
          {detectedLocation && (
            <div
              className={cn(
                "px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 flex items-center gap-3",
                focusedIndex === 0 && "bg-gray-50"
              )}
              onClick={() => handleLocationSelect(detectedLocation)}
            >
              <MapPin className="w-4 h-4 text-HG-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Search in {detectedLocation.displayName}
                </p>
                <p className="text-xs text-gray-500">
                  {detectedLocation.type === "city"
                    ? "City"
                    : detectedLocation.type === "area"
                    ? "Area"
                    : detectedLocation.type === "state"
                    ? "State"
                    : "Location"}
                </p>
              </div>
              {isGeocoding && (
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              )}
            </div>
          )}

          {/* Detected Location - Search around location */}
          {detectedLocation && (
            <div
              className={cn(
                "px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 flex items-center gap-3",
                focusedIndex === 1 && "bg-gray-50"
              )}
              onClick={() => handleLocationAroundSearch(detectedLocation)}
            >
              <Navigation className="w-4 h-4 text-blue-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Search around {detectedLocation.displayName.split(",")[0]}
                </p>
                <p className="text-xs text-gray-500">
                  Properties within 10km radius
                </p>
              </div>
              <Badge variant="secondary" className="text-xs">
                Nearby
              </Badge>
            </div>
          )}

          {/* Nearby Option */}
          {showNearbyOption && userLocation && (
            <div
              className={cn(
                "px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 flex items-center gap-3",
                focusedIndex === (detectedLocation ? 2 : 0) && "bg-gray-50"
              )}
              onClick={handleNearbySearch}
            >
              <Navigation className="w-4 h-4 text-blue-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Show nearby properties
                </p>
                <p className="text-xs text-gray-500">
                  Properties near your current location
                </p>
              </div>
              <Badge variant="secondary" className="text-xs">
                {userLocation.displayName.split(",")[0]}
              </Badge>
            </div>
          )}

          {/* Properties */}
          {suggestions.properties.length > 0 && (
            <div className="border-b border-gray-100">
              <div className="px-4 py-2 bg-gray-50">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Properties
                </p>
              </div>
              {suggestions.properties.map((property, index) => {
                const actualIndex =
                  (detectedLocation ? 2 : 0) +
                  (showNearbyOption && userLocation ? 1 : 0) +
                  index;
                return (
                  <div
                    key={property._id}
                    className={cn(
                      "px-4 py-3 cursor-pointer hover:bg-gray-50 flex items-center gap-3",
                      focusedIndex === actualIndex && "bg-gray-50"
                    )}
                    onClick={() => handleItemSelect(actualIndex)}
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100">
                      <BlurImage
                        src={property.primaryImage}
                        alt={property.pgName}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {property.pgName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {property.location.area}, {property.location.city}
                      </p>
                      <p className="text-xs text-HG-500 font-medium">
                        ₹{property.minRent}/month
                      </p>
                    </div>
                    <Building className="w-4 h-4 text-gray-400" />
                  </div>
                );
              })}
            </div>
          )}

          {/* Locations */}
          {suggestions.locations.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-gray-50">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Locations
                </p>
              </div>
              {suggestions.locations.map((location, index) => {
                const actualIndex =
                  (detectedLocation ? 2 : 0) +
                  (showNearbyOption && userLocation ? 1 : 0) +
                  suggestions.properties.length +
                  index;
                return (
                  <div
                    key={index}
                    className={cn(
                      "px-4 py-3 cursor-pointer hover:bg-gray-50 flex items-center gap-3",
                      focusedIndex === actualIndex && "bg-gray-50"
                    )}
                    onClick={() => handleItemSelect(actualIndex)}
                  >
                    <MapPin className="w-4 h-4 text-HG-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {location.displayText}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {location.type}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* No Results */}
          {!loading &&
            suggestions.properties.length === 0 &&
            suggestions.locations.length === 0 &&
            !detectedLocation &&
            value.trim() && (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-gray-500">
                  No results found for &quot;{value}&quot;
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Try searching for a city, area, or property name
                </p>
              </div>
            )}

          {/* Loading State */}
          {loading && (
            <div className="px-4 py-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-HG-500 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Searching...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
