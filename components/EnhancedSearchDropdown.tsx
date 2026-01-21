"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, MapPin, Building, Loader2, Navigation } from "lucide-react";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { BlurImage } from "./BlurImage";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
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
  type: "city" | "area";
  city: string;
  area?: string;
  state: string;
  count?: number;
  lat?: number | null;
  lng?: number | null;
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
  showNearbyOption = false,
}: EnhancedSearchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<{
    properties: Property[];
    locations: Location[];
  }>({ properties: [], locations: [] });
  const [loading, setLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const debouncedSearch = useDebouncedValue(value, 300);

  // Fetch suggestions from API
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
        setIsOpen(true);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSuggestions({ properties: [], locations: [] });
    } finally {
      setLoading(false);
    }
  }, []);

// Geocode location if coordinates are missing
const geocodeLocation = useCallback(async (location: Location): Promise<Location> => {
  console.log("🔄 Starting geocode for:", location);
  
  // If we already have coordinates, return as is
  if (location.lat && location.lng && location.lat !== null && location.lng !== null) {
    console.log("✅ Using existing coordinates:", { lat: location.lat, lng: location.lng });
    return location;
  }

  console.log("⚠️ No coordinates found, geocoding...");

  // Build search query
  const searchQuery = [location.area, location.city, location.state]
    .filter(Boolean)
    .join(", ");

  console.log("🔍 Geocoding query:", searchQuery);

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        searchQuery + ", India" // Add India for better results
      )}&limit=1&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'SYPG-App/1.0' // Required by Nominatim
        }
      }
    );
    
    if (!response.ok) {
      console.error("❌ Nominatim API error:", response.status);
      return location;
    }
    
    const data = await response.json();
    console.log("📡 Nominatim response:", data);

    if (data && data[0]) {
      const geocoded = {
        ...location,
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
      console.log("✅ Geocoded successfully:", geocoded);
      return geocoded;
    } else {
      console.warn("⚠️ No geocoding results found");
    }
  } catch (error) {
    console.error("❌ Geocoding error:", error);
  }

  // Return original location if geocoding fails
  console.log("⚠️ Returning original location without coordinates");
  return location;
}, []);

  // Fetch suggestions when debounced search changes
  useEffect(() => {
    if (debouncedSearch) {
      fetchSuggestions(debouncedSearch);
    } else {
      setSuggestions({ properties: [], locations: [] });
      setLoading(false);
      setIsOpen(false);
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

  const totalItems = suggestions.properties.length + suggestions.locations.length;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        if (!isOpen && value.trim()) {
          setIsOpen(true);
          return;
        }
        e.preventDefault();
        setFocusedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        if (!isOpen && value.trim()) {
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
    if (index < suggestions.locations.length) {
      // Selected a location
      const location = suggestions.locations[index];
      handleLocationSelect(location);
      return;
    }

    // Selected a property
    const propertyIndex = index - suggestions.locations.length;
    const property = suggestions.properties[propertyIndex];
    if (onSelectProperty) {
      onSelectProperty(property);
    } else {
      router.push(`/routes/pg-details/${property.slug || property._id}`);
    }
    setIsOpen(false);
    setFocusedIndex(-1);
  };

const handleLocationSelect = async (location: Location) => {
  console.log("🔍 Location selected:", location);
  
  // Geocode location if coordinates are missing
  const locationWithCoords = await geocodeLocation(location);
  console.log("📍 After geocoding:", locationWithCoords);

  // Build query params for all-listings page with radius search
  const params = new URLSearchParams();
  
  if (locationWithCoords.lat && locationWithCoords.lng) {
    console.log("✅ Using geospatial search with coords:", {
      lat: locationWithCoords.lat,
      lng: locationWithCoords.lng,
      radius: 10
    });
    // Use geospatial search with 10km radius
    params.set("lat", locationWithCoords.lat.toString());
    params.set("lng", locationWithCoords.lng.toString());
    params.set("radius", "10"); // 10km radius
  } else {
    console.log("⚠️ No coordinates available, using text search");
  }
  
  // Also include location details for display
  if (location.city) params.set("city", location.city);
  if (location.area) params.set("area", location.area);
  if (location.state) params.set("state", location.state);
  params.set("q", value);

  const finalUrl = `/routes/all-listings?${params.toString()}`;
  console.log("🌐 Navigating to:", finalUrl);

  if (onSelectLocation) {
    onSelectLocation(locationWithCoords);
  } else {
    router.push(finalUrl);
  }

  setIsOpen(false);
  setFocusedIndex(-1);
};

  const handleSearch = async () => {
    if (value.trim()) {
      // PRIORITY 1: If there's a location suggestion, use it with radius search
      if (suggestions.locations.length > 0) {
        await handleLocationSelect(suggestions.locations[0]);
      } 
      // PRIORITY 2: If properties exist, show listings page
      else if (suggestions.properties.length > 0) {
        const params = new URLSearchParams();
        params.set("q", value.trim());
        router.push(`/routes/all-listings?${params.toString()}`);
        setIsOpen(false);
        setFocusedIndex(-1);
      }
      // PRIORITY 3: Fallback to text search
      else {
        const params = new URLSearchParams();
        params.set("q", value.trim());
        router.push(`/routes/all-listings?${params.toString()}`);
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setFocusedIndex(-1);

    if (newValue.trim()) {
      setIsOpen(true);
    }
  };

  const handleInputFocus = () => {
    if (value.trim() && (suggestions.properties.length > 0 || suggestions.locations.length > 0)) {
      setIsOpen(true);
    }
  };

  const handleClearClick = () => {
    onClear();
    setIsOpen(false);
    setSuggestions({ properties: [], locations: [] });
    setFocusedIndex(-1);
    inputRef.current?.focus();
  };

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

      {showDropdown && isOpen && (
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
              {/* Locations Section - PRIORITY: Show locations first */}
              {suggestions.locations.length > 0 && (
                <div className="border-b border-gray-100">
                  <div className="px-4 py-2 bg-gray-50">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Locations ({suggestions.locations.length})
                    </p>
                  </div>
                  {suggestions.locations.map((location, index) => (
                    <div
                      key={`${location.city}-${location.area}-${index}`}
                      className={cn(
                        "px-4 py-3 cursor-pointer hover:bg-gray-50 flex items-center gap-3 transition-colors",
                        focusedIndex === index && "bg-gray-50 border-l-2 border-HG-500"
                      )}
                      onClick={() => handleItemSelect(index)}
                      onMouseEnter={() => setFocusedIndex(index)}
                    >
                      <MapPin className="w-4 h-4 text-HG-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {location.displayText}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-500 capitalize">
                            {location.type} • Within 10km radius
                          </p>
                          {location.count && (
                            <Badge variant="secondary" className="text-xs">
                              {location.count} properties
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Properties Section - Show after locations */}
              {suggestions.properties.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-gray-50">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Properties ({suggestions.properties.length})
                    </p>
                  </div>
                  {suggestions.properties.map((property, index) => {
                    // Adjust index to account for locations shown first
                    const actualIndex = suggestions.locations.length + index;
                    return (
                      <div
                        key={property._id}
                        className={cn(
                          "px-4 py-3 cursor-pointer hover:bg-gray-50 flex items-center gap-3 transition-colors",
                          focusedIndex === actualIndex && "bg-gray-50 border-l-2 border-HG-500"
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

              {/* No Results */}
              {!hasResults && value.trim().length >= 2 && (
                <div className="px-4 py-8 text-center">
                  <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-2" />
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