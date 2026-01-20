"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, MapPin, Building, Loader2, Navigation } from "lucide-react";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { BlurImage } from "./BlurImage";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  useIndoreLocationSearch,
  LocationData,
} from "@/hooks/useIndoreLocationSearch";
import { cn } from "@/lib/utils";

interface Property {
  _id: string;
  slug: string;
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
  const [isTyping, setIsTyping] = useState(false); // Track if user is actively typing

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const {
    userLocation,
    geocodeLocation,
    searchNearby,
    searchInLocation,
    searchWithQuery,
  } = useIndoreLocationSearch();

  const debouncedSearch = useDebouncedValue(value, 300); // Increased debounce time

  // Helper to determine if we should geocode the query for URL coordinates
  const isLocationQuery = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase().trim();
    return lowerQuery.length >= 2;
  }, []);

  // BACKGROUND GEOCODING: This ensures lat/lng are available for the URL
  useEffect(() => {
    if (debouncedSearch && isLocationQuery(debouncedSearch)) {
      const cleanQuery = debouncedSearch
        .replace(/^(near|in|around|at)\s+/i, "")
        .replace(/\s+(city|area|locality|district|state)$/i, "")
        .trim();

      geocodeLocation(cleanQuery).then((location) => {
        setDetectedLocation(location);
      });
    } else {
      setDetectedLocation(null);
    }
  }, [debouncedSearch, isLocationQuery, geocodeLocation]);

  // Fetch text-based suggestions from API
  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions({ properties: [], locations: [] });
      setLoading(false);
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
      console.error("Search error:", error);
      setSuggestions({ properties: [], locations: [] });
    } finally {
      setLoading(false);
      setIsTyping(false); // User finished typing
    }
  }, []);

  // Fetch suggestions when debounced search changes
  useEffect(() => {
    if (debouncedSearch) {
      fetchSuggestions(debouncedSearch);
    } else {
      setSuggestions({ properties: [], locations: [] });
      setLoading(false);
      setIsTyping(false);
    }
  }, [debouncedSearch, fetchSuggestions]);

  // Handle click outside
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

  useEffect(() => {
    onDropdownChange?.(isOpen);
  }, [isOpen, onDropdownChange]);

  const totalItems =
    suggestions.properties.length +
    suggestions.locations.length +
    (showNearbyOption && userLocation ? 1 : 0);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        if (!isOpen) {
          setIsOpen(true);
          return;
        }
        e.preventDefault();
        setFocusedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        if (!isOpen) {
          setIsOpen(true);
          return;
        }
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        e.preventDefault();
        if (isOpen && focusedIndex >= 0) {
          handleItemSelect(focusedIndex);
        } else if (value.trim()) {
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

  const handleItemSelect = (index: number) => {
    let currentIndex = 0;

    if (showNearbyOption && userLocation && index === currentIndex++) {
      handleNearbySearch();
      return;
    }

    if (index < currentIndex + suggestions.properties.length) {
      const propertyIndex = index - currentIndex;
      const property = suggestions.properties[propertyIndex];
      if (onSelectProperty) {
        onSelectProperty(property);
      } else {
        router.push(`/routes/pg-details/${property._id}`);
      }
      setIsOpen(false);
      setFocusedIndex(-1);
      return;
    }
    currentIndex += suggestions.properties.length;

    if (index < currentIndex + suggestions.locations.length) {
      const locationIndex = index - currentIndex;
      const location = suggestions.locations[locationIndex];
      handleLocationSelect({
        name: location.name,
        lat: 0,
        lng: 0,
        displayName: location.displayText,
        type: location.type,
      });
    }
  };

  const handleLocationSelect = async (location: LocationData) => {
    if (location.lat === 0 && location.lng === 0) {
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

  const handleNearbySearch = () => {
    if (userLocation) {
      searchNearby(userLocation);
    }
    setIsOpen(false);
    setFocusedIndex(-1);
  };

  const handleSearch = () => {
    if (value.trim()) {
      // Passes background coordinates to the URL if they were detected
      if (detectedLocation) {
        searchWithQuery(value, detectedLocation);
      } else {
        searchWithQuery(value);
      }
    }
    setIsOpen(false);
    setFocusedIndex(-1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsTyping(true); // Mark as typing
    
    // Keep dropdown open if there's text
    if (newValue.trim()) {
      setIsOpen(true);
    }
    
    setFocusedIndex(-1);
  };

  const handleInputFocus = () => {
    // Only open if there's value or suggestions
    if (value.trim() || suggestions.properties.length > 0 || suggestions.locations.length > 0) {
      setIsOpen(true);
    }
  };

  const handleClearClick = () => {
    onClear();
    setIsOpen(false);
    setSuggestions({ properties: [], locations: [] });
    setFocusedIndex(-1);
    setIsTyping(false);
    inputRef.current?.focus();
  };

  // Determine if we should show the dropdown content
  const shouldShowDropdown = showDropdown && isOpen && !isTyping;
  const hasResults = suggestions.properties.length > 0 || suggestions.locations.length > 0;

  return (
    <div className={cn("relative w-full", className)} ref={dropdownRef}>
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
            onClick={handleClearClick}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {shouldShowDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          
          {/* Loading State */}
          {loading && (
            <div className="px-4 py-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-HG-500 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Searching...</p>
            </div>
          )}

          {/* Results when not loading */}
          {!loading && (
            <>
              {/* USER LOCATION (GPS) - First Priority */}
              {showNearbyOption && userLocation && (
                <div
                  className={cn(
                    "px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 flex items-center gap-3 transition-colors",
                    focusedIndex === 0 && "bg-gray-50"
                  )}
                  onClick={handleNearbySearch}
                  onMouseEnter={() => setFocusedIndex(0)}
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

              {/* Properties Section */}
              {suggestions.properties.length > 0 && (
                <div className="border-b border-gray-100">
                  <div className="px-4 py-2 bg-gray-50">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Properties ({suggestions.properties.length})
                    </p>
                  </div>
                  {suggestions.properties.map((property, index) => {
                    const actualIndex = (showNearbyOption && userLocation ? 1 : 0) + index;
                    return (
                      <div
                        key={property._id}
                        className={cn(
                          "px-4 py-3 cursor-pointer hover:bg-gray-50 flex items-center gap-3 transition-colors",
                          focusedIndex === actualIndex && "bg-gray-50"
                        )}
                        onClick={() => handleItemSelect(actualIndex)}
                        onMouseEnter={() => setFocusedIndex(actualIndex)}
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
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
                            ₹{property.minRent.toLocaleString()}/month
                          </p>
                        </div>
                        <Building className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Locations Section */}
              {suggestions.locations.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-gray-50">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Locations ({suggestions.locations.length})
                    </p>
                  </div>
                  {suggestions.locations.map((location, index) => {
                    const actualIndex =
                      (showNearbyOption && userLocation ? 1 : 0) +
                      suggestions.properties.length +
                      index;
                    return (
                      <div
                        key={`${location.name}-${index}`}
                        className={cn(
                          "px-4 py-3 cursor-pointer hover:bg-gray-50 flex items-center gap-3 transition-colors",
                          focusedIndex === actualIndex && "bg-gray-50"
                        )}
                        onClick={() => handleItemSelect(actualIndex)}
                        onMouseEnter={() => setFocusedIndex(actualIndex)}
                      >
                        <MapPin className="w-4 h-4 text-HG-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
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
              {!hasResults && value.trim().length >= 2 && (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-gray-500 mb-1">
                    No results found for &quot;{value}&quot;
                  </p>
                  <p className="text-xs text-gray-400">
                    Try searching with different keywords
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}