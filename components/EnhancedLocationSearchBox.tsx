"use client";

import { useState, useCallback, useEffect } from "react";
import { Search, MapPin, Navigation, Loader2, ChevronDown, X } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useDynamicLocationSearch, LocationData } from "@/hooks/useDynamicLocationSearch";
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
  placeholder = "Search for colleges, hospitals, malls, metro stations, or any location...",
  className,
  showNearbyOption = true,
  showSuggestions = true,
}: LocationSearchBoxProps) {
  const [query, setQuery] = useState("");
  const [detectedLocation, setDetectedLocation] = useState<LocationData | null>(null);
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
  } = useDynamicLocationSearch();

  // Fetch suggestions dynamically
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length >= 3 && showSuggestions) {
        setIsSearching(true);
        const results = await getLocationSuggestions(query);
        setSuggestions(results);
        setShowSuggestionsList(results.length > 0);
        setIsSearching(false);
      } else {
        setSuggestions([]);
        setShowSuggestionsList(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, getLocationSuggestions, showSuggestions]);

  // Detect location from query
  useEffect(() => {
    const detectLocation = async () => {
      if (query.length >= 3) {
        const location = await geocodeLocation(query);
        setDetectedLocation(location);
      } else {
        setDetectedLocation(null);
      }
    };

    const debounceTimer = setTimeout(detectLocation, 500);
    return () => clearTimeout(debounceTimer);
  }, [query, geocodeLocation]);

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

  // Map suggestion type to LocationData type
  const mapSuggestionType = (type: string): LocationData["type"] => {
    const typeMap: Record<string, LocationData["type"]> = {
      city: "city",
      town: "city",
      village: "area",
      suburb: "area",
      neighbourhood: "area",
      locality: "area",
      state: "state",
      country: "country",
    };
    return typeMap[type] || "location";
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: any) => {
    const locationData: LocationData = {
      name: suggestion.name,
      lat: suggestion.lat,
      lng: suggestion.lng,
      displayName: suggestion.description,
      type: mapSuggestionType(suggestion.type),
      category: suggestion.category,
    };
    setDetectedLocation(locationData);
    setQuery(suggestion.name);
    setShowSuggestionsList(false);

    // Automatically trigger nearby search for POIs (colleges, hospitals, etc.)
    if (suggestion.category && ['amenity', 'building', 'tourism', 'leisure'].includes(suggestion.category)) {
      if (onNearbySearch) {
        onNearbySearch(locationData);
      } else {
        searchNearby(locationData);
      }
    } else {
      // For general locations, search in location
      if (onLocationSelect) {
        onLocationSelect(locationData);
      } else {
        searchInLocation(locationData);
      }
    }
  };

  // Handle general search
  const handleSearch = () => {
    if (query.trim()) {
      if (detectedLocation) {
        handleSearchAroundLocation();
      } else {
        geocodeLocation(query).then((location) => {
          if (location) {
            searchNearby(location);
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
          className="pl-12 pr-12 py-3 w-full border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-base transition-all duration-200 hover:border-gray-300"
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
        {isSearching || isGeocoding ? (
          <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 animate-spin text-primary" />
        ) : (
          query && (
            <button
              onClick={() => {
                setQuery("");
                setDetectedLocation(null);
                setShowSuggestionsList(false);
              }}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </button>
          )
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestionsList && suggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-96 overflow-y-auto mt-2 suggestions-container animate-in slide-in-from-top-2 duration-200">
          <div className="p-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2 border-b border-gray-100">
              Locations & Places
            </div>
            {suggestions.map((suggestion, index) => (
              <div
                key={`${suggestion.place_id}-${index}`}
                className="px-3 py-3 hover:bg-primary/10 cursor-pointer rounded-lg mx-1 transition-all duration-200 hover:shadow-sm group"
                onClick={() => handleSuggestionSelect(suggestion)}
              >
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate group-hover:text-primary">
                      {suggestion.name}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                      {suggestion.description}
                    </p>
                    {suggestion.category && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {suggestion.type || suggestion.category}
                      </Badge>
                    )}
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors flex-shrink-0 -rotate-90" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detected Location Options */}
      {detectedLocation && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-sm font-medium text-gray-700">
              Location found:{" "}
              <span className="text-primary font-semibold">
                {detectedLocation.name}
              </span>
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleSearchAroundLocation}
              className="flex-1 py-2.5 rounded-lg font-medium transition-all duration-200 hover:shadow-lg"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Show nearby PGs (10km radius)
            </Button>
            <Button
              onClick={handleSearchInLocation}
              variant="outline"
              className="flex-1 py-2.5 rounded-lg font-medium transition-all duration-200"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Search in this area
            </Button>
          </div>
        </div>
      )}

      {/* User Location Option */}
      {showNearbyOption && userLocation && !detectedLocation && !query && (
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
              {userLocation.name}
            </Badge>
          </Button>
        </div>
      )}

      {/* Location Denied Message */}
      {locationDenied && showNearbyOption && !query && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            Location access denied. Enable location services to find nearby properties.
          </p>
        </div>
      )}

      {/* No Location Detected */}
      {query && !detectedLocation && !isSearching && !showSuggestionsList && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            No location found for &quot;{query}&quot;. Try a different search term.
          </p>
        </div>
      )}
    </div>
  );
}