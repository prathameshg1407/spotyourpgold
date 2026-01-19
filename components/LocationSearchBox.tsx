"use client";

import { useState, useCallback, useEffect } from "react";
import { Search, MapPin, Navigation, Loader2 } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useLocationSearch, LocationData } from "@/hooks/useLocationSearch";
import { cn } from "@/lib/utils";

interface LocationSearchBoxProps {
  onLocationSelect?: (location: LocationData) => void;
  onNearbySearch?: (location: LocationData) => void;
  placeholder?: string;
  className?: string;
  showNearbyOption?: boolean;
}

export default function LocationSearchBox({
  onLocationSelect,
  onNearbySearch,
  placeholder = "Enter a city, area, or location name...",
  className,
  showNearbyOption = true,
}: LocationSearchBoxProps) {
  const [query, setQuery] = useState("");
  const [detectedLocation, setDetectedLocation] = useState<LocationData | null>(
    null
  );
  const [isSearching, setIsSearching] = useState(false);

  const {
    userLocation,
    locationDenied,
    isGeocoding,
    geocodeLocation,
    searchNearby,
    searchInLocation,
  } = useLocationSearch();

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

  // Handle location detection and geocoding
  useEffect(() => {
    if (query && isLocationQuery(query)) {
      setIsSearching(true);
      // Extract location name from query (remove common prefixes)
      const cleanQuery = query
        .replace(/^(near|in|around|at)\s+/i, "")
        .replace(/\s+(city|area|locality|district|state)$/i, "")
        .trim();

      geocodeLocation(cleanQuery).then((location) => {
        setDetectedLocation(location);
        setIsSearching(false);
      });
    } else {
      setDetectedLocation(null);
      setIsSearching(false);
    }
  }, [query, isLocationQuery, geocodeLocation]);

  // Handle search in location
  const handleSearchInLocation = async () => {
    if (detectedLocation) {
      if (onLocationSelect) {
        onLocationSelect(detectedLocation);
      } else {
        searchInLocation(detectedLocation);
      }
    }
  };

  // Handle search around location
  const handleSearchAroundLocation = async () => {
    if (detectedLocation) {
      if (onNearbySearch) {
        onNearbySearch(detectedLocation);
      } else {
        searchNearby(detectedLocation);
      }
    }
  };

  // Handle nearby search with user location
  const handleUserNearbySearch = () => {
    if (userLocation) {
      if (onNearbySearch) {
        onNearbySearch(userLocation);
      } else {
        searchNearby(userLocation);
      }
    }
  };

  // Handle general search
  const handleSearch = () => {
    if (query.trim()) {
      if (detectedLocation) {
        handleSearchInLocation();
      } else {
        // If no location detected, try to search anyway
        geocodeLocation(query).then((location) => {
          if (location) {
            searchInLocation(location);
          }
        });
      }
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-4 py-2 w-full border-gray-300 focus:border-HG-500 focus:ring-HG-500"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
        )}
      </div>

      {/* Detected Location Options */}
      {detectedLocation && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Found location:{" "}
            <span className="font-medium">{detectedLocation.displayName}</span>
          </p>
          <div className="flex gap-2">
            <Button
              onClick={handleSearchInLocation}
              className="flex-1 bg-HG-500 hover:bg-HG-600 text-white"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Search in {detectedLocation.displayName.split(",")[0]}
            </Button>
            <Button
              onClick={handleSearchAroundLocation}
              variant="outline"
              className="flex-1 border-HG-500 text-HG-500 hover:bg-HG-50"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Search around {detectedLocation.displayName.split(",")[0]}
            </Button>
          </div>
        </div>
      )}

      {/* User Location Option */}
      {showNearbyOption && userLocation && !detectedLocation && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Use your current location:</p>
          <Button
            onClick={handleUserNearbySearch}
            variant="outline"
            className="w-full border-blue-500 text-blue-500 hover:bg-blue-50"
          >
            <Navigation className="w-4 h-4 mr-2" />
            Show nearby properties
            <Badge variant="secondary" className="ml-2 text-xs">
              {userLocation.displayName.split(",")[0]}
            </Badge>
          </Button>
        </div>
      )}

      {/* Location Denied Message */}
      {locationDenied && showNearbyOption && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            Location access denied. Enable location services to find nearby
            properties.
          </p>
        </div>
      )}

      {/* No Location Detected */}
      {query && !detectedLocation && !isSearching && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            No location found for &quot;{query}&quot;. Try a different city or
            area name.
          </p>
        </div>
      )}
    </div>
  );
}