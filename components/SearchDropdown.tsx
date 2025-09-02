"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, MapPin, Building, Loader2 } from "lucide-react";
import { Input } from "./ui/input";
import { BlurImage } from "./BlurImage";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Property {
  _id: string;
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
  type: "city" | "area";
  displayText: string;
}

interface SearchDropdownProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  onSelectProperty?: (property: Property) => void;
  onSelectLocation?: (location: Location) => void;
  placeholder?: string;
  className?: string;
  showDropdown?: boolean;
  onDropdownChange?: (show: boolean) => void;
}

export default function SearchDropdown({
  value,
  onChange,
  onClear,
  onSelectProperty,
  onSelectLocation,
  placeholder = "Search by location, PG name, or owner name...",
  className,
  showDropdown = true,
  onDropdownChange,
}: SearchDropdownProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<{
    properties: Property[];
    locations: Location[];
  }>({ properties: [], locations: [] });
  const [loading, setLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [detectedLocation, setDetectedLocation] = useState<{
    name: string;
    lat: number;
    lng: number;
  } | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedSearch = useDebouncedValue(value, 150); // Ultra-fast response

  // Geocode location using Nominatim API (same as used in add-pg form)
  const geocodeLocation = useCallback(async (query: string) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=1&addressdetails=1`
      );
      const data = await response.json();

      if (data && data[0]) {
        const lat = Number.parseFloat(data[0].lat);
        const lng = Number.parseFloat(data[0].lon);
        const displayName = data[0].display_name;

        return {
          name: displayName,
          lat,
          lng,
        };
      }
      return null;
    } catch (error) {
      console.error("Geocoding failed:", error);
      return null;
    }
  }, []);

  // Check if query looks like a location (city, area, etc.)
  const isLocationQuery = useCallback((query: string) => {
    const locationKeywords = [
      "city",
      "area",
      "locality",
      "district",
      "state",
      "near",
      "in",
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
    ];

    const lowerQuery = query.toLowerCase();

    // First check if it contains known location keywords
    const hasLocationKeywords = locationKeywords.some((keyword) =>
      lowerQuery.includes(keyword)
    );

    // If it has location keywords, it's definitely a location
    if (hasLocationKeywords) return true;

    // For other queries, be more selective about what we consider a location
    // Only treat as location if it looks like an address or has location indicators
    const addressPatterns = [
      /\d+.*road/i,
      /\d+.*street/i,
      /\d+.*lane/i,
      /\d+.*avenue/i,
      /.*road.*\d+/i,
      /.*street.*\d+/i,
      /.*city$/i,
      /.*nagar$/i,
      /.*pur$/i,
      /.*bad$/i,
      /.*ganj$/i,
    ];

    return addressPatterns.some((pattern) => pattern.test(query));
  }, []);

  // Fetch suggestions
  const fetchSuggestions = useCallback(
    async (query: string) => {
      if (!query || query.length < 2) {
        setSuggestions({ properties: [], locations: [] });
        setDetectedLocation(null);
        setIsOpen(false);
        return;
      }

      setLoading(true);
      try {
        // Check if this looks like a location query and geocode it
        const isLocation = isLocationQuery(query);
        console.log("SearchDropdown - Query analysis:", {
          query,
          isLocation,
          detectedLocation,
        });

        if (isLocation) {
          const locationData = await geocodeLocation(query);
          console.log("SearchDropdown - Geocoding result:", locationData);
          if (locationData) {
            setDetectedLocation(locationData);
          }
        } else {
          setDetectedLocation(null);
        }

        // Fetch regular suggestions (properties and locations)
        const response = await axios.get(
          `/api/listing/suggestions?q=${encodeURIComponent(query)}&limit=10`
        );
        if (response.data.success) {
          setSuggestions(response.data.data);
          setIsOpen(
            showDropdown &&
              (response.data.data.properties.length > 0 ||
                response.data.data.locations.length > 0 ||
                detectedLocation !== null)
          );
        }
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
        setSuggestions({ properties: [], locations: [] });
        setDetectedLocation(null);
        setIsOpen(false);
      } finally {
        setLoading(false);
      }
    },
    [showDropdown, isLocationQuery, geocodeLocation, detectedLocation]
  );

  // Effect for debounced search
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
    suggestions.properties.length + suggestions.locations.length;

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        e.preventDefault();
        if (focusedIndex >= 0) {
          handleItemSelect(focusedIndex);
        } else if (value.trim()) {
          // No item focused, navigate to all-listings with search query
          setIsOpen(false);
          setFocusedIndex(-1);
          const searchUrl = detectedLocation
            ? `/routes/all-listings?q=${encodeURIComponent(value)}&lat=${
                detectedLocation.lat
              }&lng=${detectedLocation.lng}`
            : `/routes/all-listings?q=${encodeURIComponent(value)}`;

          console.log("SearchDropdown - Navigation:", {
            value,
            detectedLocation,
            searchUrl,
          });

          router.push(searchUrl);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setFocusedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle item selection
  const handleItemSelect = (index: number) => {
    const propertiesCount = suggestions.properties.length;

    if (index < propertiesCount) {
      // Selected a property
      const property = suggestions.properties[index];
      onSelectProperty?.(property);
      onChange(property.pgName);
    } else {
      // Selected a location
      const location = suggestions.locations[index - propertiesCount];
      onSelectLocation?.(location);
      onChange(location.displayText);
    }

    setIsOpen(false);
    setFocusedIndex(-1);
  };

  // Handle input focus
  const handleFocus = () => {
    if (value && value.length >= 2 && totalItems > 0) {
      setIsOpen(true);
    }
  };

  // Handle property click
  const handlePropertyClick = (property: Property) => {
    onSelectProperty?.(property);
    onChange(property.pgName);
    setIsOpen(false);
    setFocusedIndex(-1);
  };

  // Handle location click
  const handleLocationClick = (location: Location) => {
    onSelectLocation?.(location);
    onChange(location.displayText);
    setIsOpen(false);
    setFocusedIndex(-1);
  };

  return (
    <div ref={dropdownRef} className={cn("relative w-full", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-8 py-2 bg-white/80 backdrop-blur-md border-white/20 rounded-lg focus:ring-2 focus:ring-HG-500 focus:border-transparent"
        />
        {value && (
          <button
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {loading && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen &&
        (suggestions.properties.length > 0 ||
          suggestions.locations.length > 0) && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
            {/* Properties Section */}
            {suggestions.properties.length > 0 && (
              <div className="p-2">
                <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b">
                  Properties
                </div>
                {suggestions.properties.map((property, index) => (
                  <button
                    key={property._id}
                    onClick={() => handlePropertyClick(property)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left",
                      focusedIndex === index && "bg-HG-50 border-HG-200"
                    )}
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                      <BlurImage
                        src={property.primaryImage || "/placeholder.svg"}
                        alt={property.pgName}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {property.pgName}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <MapPin className="w-3 h-3" />
                        {property.location.area}, {property.location.city}
                      </div>
                      {property.type && (
                        <div className="text-xs text-HG-500 capitalize">
                          {property.type} • {property.genderPreference}
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-semibold text-HG-500">
                        ₹{property.minRent?.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">per month</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Locations Section */}
            {suggestions.locations.length > 0 && (
              <div className="p-2 border-t border-gray-100">
                <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b">
                  Locations
                </div>
                {suggestions.locations.map((location, index) => {
                  const globalIndex = suggestions.properties.length + index;
                  return (
                    <button
                      key={`${location.type}-${location.name}`}
                      onClick={() => handleLocationClick(location)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left",
                        focusedIndex === globalIndex && "bg-HG-50 border-HG-200"
                      )}
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        {location.type === "city" ? (
                          <Building className="w-4 h-4 text-gray-600" />
                        ) : (
                          <MapPin className="w-4 h-4 text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {location.displayText}
                        </div>
                        <div className="text-sm text-gray-500 capitalize">
                          {location.type}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Detected Location */}
            {detectedLocation && (
              <div className="p-2 border-t border-gray-100">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-700 text-sm">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="font-medium">Location detected:</span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1 truncate">
                    {detectedLocation.name}
                  </p>
                </div>
              </div>
            )}

            {/* View All Results Link */}
            {(suggestions.properties.length > 0 ||
              suggestions.locations.length > 0 ||
              detectedLocation) && (
              <div className="p-2 border-t border-gray-100">
                <Link
                  href={
                    detectedLocation
                      ? `/routes/all-listings?q=${encodeURIComponent(
                          value
                        )}&lat=${detectedLocation.lat}&lng=${
                          detectedLocation.lng
                        }`
                      : `/routes/all-listings?q=${encodeURIComponent(value)}`
                  }
                  className="w-full flex items-center justify-center gap-2 p-3 text-HG-500 hover:bg-HG-50 rounded-lg transition-colors font-medium"
                  onClick={() => {
                    setIsOpen(false);
                    setFocusedIndex(-1);
                  }}
                >
                  <Search className="w-4 h-4" />
                  {detectedLocation
                    ? `View all results near "${value}"`
                    : `View all results for "${value}"`}
                </Link>
              </div>
            )}
          </div>
        )}
    </div>
  );
}
