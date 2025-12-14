"use client";

import { useState, useCallback, useEffect } from "react";
import { Search, MapPin, Navigation, Loader2, ChevronDown } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  useIndoreLocationSearch,
  LocationData,
} from "@/hooks/useIndoreLocationSearch";
import { cn } from "@/lib/utils";

interface LocationSearchBoxProps {
  onLocationSelect?: (location: LocationData) => void;
  onNearbySearch?: (location: LocationData) => void;
  placeholder?: string;
  className?: string;
  showNearbyOption?: boolean;
  showSuggestions?: boolean;
}

export default function EnhancedLocationSearchBox({
  onLocationSelect,
  onNearbySearch,
  placeholder = "Search for hospitals, schools, malls, metro stations...",
  className,
  showNearbyOption = true,
  showSuggestions = true,
}: LocationSearchBoxProps) {
  const [query, setQuery] = useState("");
  const [detectedLocation, setDetectedLocation] = useState<LocationData | null>(
    null
  );
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestionsList, setShowSuggestionsList] = useState(false);

  const {
    userLocation,
    locationDenied,
    isGeocoding,
    geocodeLocation,
    searchNearby,
    searchInLocation,
    getLocationSuggestions,
    searchIndoreLocation,
  } = useIndoreLocationSearch();

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
      "close to",
      "beside",
      "next to",
      "hospital",
      "school",
      "college",
      "mall",
      "metro",
      "station",
      "market",
      "temple",
      "palace",
      "airport",
      "railway",
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
      /close to\s+[a-zA-Z\s]+/i, // "close to [location]"
      /beside\s+[a-zA-Z\s]+/i, // "beside [location]"
      /next to\s+[a-zA-Z\s]+/i, // "next to [location]"
      /[a-zA-Z\s]+\s+(city|area|locality|district|state)/i, // "[name] city/area/etc"
    ];

    const matchesPattern = locationPatterns.some((pattern) =>
      pattern.test(lowerQuery)
    );

    // If it's a short query (likely a location name) or matches patterns, treat as location
    return hasLocationKeyword || (lowerQuery.length <= 30 && matchesPattern);
  }, []);

  // Handle location detection and geocoding
  useEffect(() => {
    if (query && isLocationQuery(query)) {
      setIsSearching(true);

      // First try local Indore search
      const indoreLocation = searchIndoreLocation(query);
      if (indoreLocation) {
        const locationData: LocationData = {
          name: indoreLocation.name,
          lat: indoreLocation.lat,
          lng: indoreLocation.lng,
          displayName: indoreLocation.displayName,
          type: "city",
        };
        setDetectedLocation(locationData);
        setIsSearching(false);
        return;
      }

      // Extract location name from query (remove common prefixes)
      const cleanQuery = query
        .replace(/^(near|in|around|at|close to|beside|next to)\s+/i, "")
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
  }, [query, isLocationQuery, geocodeLocation, searchIndoreLocation]);

  // Handle suggestions
  useEffect(() => {
    if (query.length >= 2 && showSuggestions) {
      const locationSuggestions = getLocationSuggestions(query);
      setSuggestions(locationSuggestions);
      setShowSuggestionsList(locationSuggestions.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestionsList(false);
    }
  }, [query, getLocationSuggestions, showSuggestions]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".suggestions-container")) {
        setShowSuggestionsList(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: any) => {
    const locationData: LocationData = {
      name: suggestion.name,
      lat: suggestion.lat,
      lng: suggestion.lng,
      displayName: suggestion.displayName,
      type: "city",
    };
    setDetectedLocation(locationData);
    setQuery(suggestion.name);
    setShowSuggestionsList(false);

    // Automatically trigger search in location
    if (onLocationSelect) {
      onLocationSelect(locationData);
    } else {
      searchInLocation(locationData);
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
    <div className={cn("space-y-4 suggestions-container relative", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-12 pr-12 py-3 w-full border-2 border-gray-200 focus:border-HG-500 focus:ring-2 focus:ring-HG-500/20 rounded-xl text-base transition-all duration-200 hover:border-gray-300"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
            if (e.key === "Escape") {
              setShowSuggestionsList(false);
            }
          }}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestionsList(true);
            }
          }}
        />
        {isSearching ? (
          <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 animate-spin text-HG-500" />
        ) : (
          query && (
            <button
              onClick={() => {
                setQuery("");
                setDetectedLocation(null);
                setShowSuggestionsList(false);
              }}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors"
            >
              ×
            </button>
          )
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestionsList && suggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-80 overflow-y-auto mt-2 suggestions-container animate-in slide-in-from-top-2 duration-200 max-w-full">
          <div className="p-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2 border-b border-gray-100">
              Indore Locations
            </div>
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="px-3 py-3 hover:bg-HG-50 cursor-pointer rounded-lg mx-1 transition-all duration-200 hover:shadow-sm group w-full"
                onClick={() => handleSuggestionSelect(suggestion)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-HG-500 flex-shrink-0" />
                      <p className="font-semibold text-gray-900 truncate group-hover:text-HG-700">
                        {suggestion.name}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 truncate">
                      {suggestion.displayName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <div className="w-2 h-2 bg-HG-500 rounded-full opacity-60"></div>
                    <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-HG-500 transition-colors" />
                  </div>
                </div>
              </div>
            ))}
            {suggestions.length >= 10 && (
              <div className="px-3 py-2 text-xs text-gray-400 text-center border-t border-gray-100">
                Showing top {suggestions.length} results
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detected Location Options */}
      {detectedLocation && (
        <div className="bg-HG-50 border border-HG-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
            <p className="text-sm font-medium text-gray-700 break-words">
              Location found:{" "}
              <span className="text-HG-600 font-semibold break-words">
                {detectedLocation.displayName}
              </span>
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleSearchInLocation}
              className="flex-1 bg-HG-500 hover:bg-HG-600 text-white py-2.5 rounded-lg font-medium transition-all duration-200 hover:shadow-lg whitespace-normal justify-start sm:justify-center text-left sm:text-center min-h-[44px]"
            >
              <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="break-words">Search in {detectedLocation.displayName.split(",")[0]}</span>
            </Button>
            <Button
              onClick={handleSearchAroundLocation}
              variant="outline"
              className="flex-1 border-2 border-HG-500 text-HG-500 hover:bg-HG-500 hover:text-white py-2.5 rounded-lg font-medium transition-all duration-200 whitespace-normal justify-start sm:justify-center text-left sm:text-center min-h-[44px]"
            >
              <Navigation className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="break-words">Search around {detectedLocation.displayName.split(",")[0]}</span>
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
      {query && !detectedLocation && !isSearching && !showSuggestionsList && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            No location found for &quot;{query}&quot;. Try searching for
            hospitals, schools, malls, or metro stations in Indore.
          </p>
        </div>
      )}

      {/* Popular Searches */}
      {!query && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">
            Popular searches in Indore:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {[
              "Bombay Hospital",
              "IIM Indore",
              "C21 Mall",
              "Sarafa Metro",
              "Rajwada Palace",
              "Devi Ahilya University",
              "Treasure Island Mall",
              "Central Museum",
              "Lal Bagh Palace",
              "Indore Railway Station",
              "Bhawarkuan",
              "Vijay Nagar",
              "Scheme 78",
              "Palasia",
              "Rajendra Nagar",
            ].map((popular) => (
              <Button
                key={popular}
                variant="outline"
                size="sm"
                onClick={() => setQuery(popular)}
                className="text-xs py-2 px-3 rounded-lg border-gray-200 hover:border-HG-500 hover:text-HG-600 hover:bg-HG-50 transition-all duration-200 text-center"
              >
                {popular}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
