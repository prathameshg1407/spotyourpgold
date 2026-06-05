"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, MapPin, Building, Loader2 } from "lucide-react";
import { Input } from "./ui/input";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { cn } from "@/lib/utils";
import Script from "next/script";
import { BlurImage } from "./BlurImage";

// ==========================================
// ⚡ GOOGLE MAPS TYPES
// ==========================================
interface Property {
  _id: string;
  slug: string;
  pgName: string;
  type?: string;
  location: {
    area: string;
    city: string;
  };
  primaryImage: string;
  minRent: number;
  propertyType: "property";
}

interface GooglePrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  isGoogle: true;
}

interface EnhancedSearchDropdownProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
  className?: string;
  showDropdown?: boolean;
}

export default function EnhancedSearchDropdown({
  value,
  onChange,
  onClear,
  placeholder = "Search for an area, landmark, or PG...",
  className,
  showDropdown = true,
}: EnhancedSearchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Separate states for hybrid results
  const [dbProperties, setDbProperties] = useState<Property[]>([]);
  const [googleLocations, setGoogleLocations] = useState<GooglePrediction[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Google Services Refs
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const sessionToken = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const debouncedSearch = useDebouncedValue(value, 300);
  
  // Use the key directly or from env
  const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyAVclzWRArjC6F-08mT50hhX2gjeJlulkE";

  // ==========================================
  // 1. INITIALIZE GOOGLE MAPS SERVICE
  // ==========================================
  const initGoogleServices = () => {
    if (window.google && window.google.maps && window.google.maps.places) {
      try {
        if (!autocompleteService.current) {
          autocompleteService.current = new window.google.maps.places.AutocompleteService();
          sessionToken.current = new window.google.maps.places.AutocompleteSessionToken();
        }
        // Create dummy div for PlacesService (Required by Google API)
        if (!placesService.current) {
          const dummyDiv = document.createElement("div");
          placesService.current = new window.google.maps.places.PlacesService(dummyDiv);
        }
        setScriptLoaded(true);
      } catch (err) {
        console.error("Google Maps Init Error:", err);
      }
    }
  };

  useEffect(() => {
    if (window.google?.maps?.places) {
      initGoogleServices();
    }
  }, []);

  // ==========================================
  // 2. FETCH DATA (HYBRID: GOOGLE + DB)
  // ==========================================
  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setDbProperties([]);
      setGoogleLocations([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // --- A. Fetch DB Properties (Internal) ---
      const dbPromise = axios.get(
        `/api/listing/suggestions?q=${encodeURIComponent(query)}&limit=3`
      );

      // --- B. Fetch Google Locations (External) ---
      const googlePromise = new Promise<GooglePrediction[]>((resolve) => {
        if (!autocompleteService.current) {
          console.warn("Google Autocomplete Service not ready");
          resolve([]);
          return;
        }

        autocompleteService.current.getPlacePredictions(
          {
            input: query,
            componentRestrictions: { country: "in" }, // Restrict to India
            // Remove 'types' to show everything (Business, Geocode, etc.)
            sessionToken: sessionToken.current || undefined,
          },
          (predictions, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
              const formatted = predictions.map((p) => ({
                description: p.description,
                place_id: p.place_id,
                structured_formatting: p.structured_formatting,
                isGoogle: true as const,
              }));
              resolve(formatted.slice(0, 5)); // Limit to 5 locations
            } else {
              console.log("Google API Status:", status); // Debug log
              resolve([]);
            }
          }
        );
      });

      // Wait for both results
      const [dbRes, googleRes] = await Promise.all([dbPromise, googlePromise]);

      if (dbRes.data?.success) {
        setDbProperties(dbRes.data.data.properties || []);
      }
      setGoogleLocations(googleRes);
      setIsOpen(true);

    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  }, [scriptLoaded]);

  // Trigger search on debounce
  useEffect(() => {
    if (debouncedSearch) {
      fetchSuggestions(debouncedSearch);
    } else {
      setDbProperties([]);
      setGoogleLocations([]);
      setIsOpen(false);
    }
  }, [debouncedSearch, fetchSuggestions]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ==========================================
  // 3. SELECTION LOGIC
  // ==========================================
  
  const handleGoogleSelect = (place: GooglePrediction) => {
    if (!placesService.current) return;

    setLoading(true);
    
    // Fetch Exact Lat/Lng using Place ID
    placesService.current.getDetails(
      {
        placeId: place.place_id,
        fields: ["geometry", "address_components", "formatted_address"], // Added formatted_address
        sessionToken: sessionToken.current || undefined,
      },
      (placeDetails, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && placeDetails?.geometry?.location) {
          const lat = placeDetails.geometry.location.lat();
          const lng = placeDetails.geometry.location.lng();
          
          // Generate new Session Token
          sessionToken.current = new window.google.maps.places.AutocompleteSessionToken();

          // Redirect to All Listings
          const params = new URLSearchParams();
          params.set("lat", lat.toString());
          params.set("lng", lng.toString());
          params.set("radius", "10"); // Default 10km
          params.set("q", place.structured_formatting.main_text); // Search label
          
          // Add context (city/state) if available
          const city = placeDetails.address_components?.find(c => c.types.includes('locality'))?.long_name;
          if (city) params.set("city", city);

          router.push(`/routes/all-listings?${params.toString()}`);
          setIsOpen(false);
          onChange(place.description);
        } else {
          console.error("Google Place Details Failed:", status);
        }
        setLoading(false);
      }
    );
  };

  const handlePropertySelect = (property: Property) => {
    router.push(`/routes/pg-details/${property.slug || property._id}`);
    setIsOpen(false);
  };

  const handleItemSelect = (index: number) => {
    if (index < googleLocations.length) {
      handleGoogleSelect(googleLocations[index]);
    } else {
      handlePropertySelect(dbProperties[index - googleLocations.length]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = googleLocations.length + dbProperties.length;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter" && focusedIndex >= 0) {
      e.preventDefault();
      handleItemSelect(focusedIndex);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const hasResults = googleLocations.length > 0 || dbProperties.length > 0;

  return (
    <div className={cn("relative w-full", className)} ref={dropdownRef}>
      
      {/* 🟢 LOAD GOOGLE MAPS SCRIPT (Essential) */}
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places`}
        onLoad={() => initGoogleServices()}
        strategy="lazyOnload"
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-10 pr-10 py-2 w-full border-gray-300 focus:border-HG-500 focus:ring-HG-500"
        />
        {value && (
          <button
            onClick={() => {
              onClear();
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {showDropdown && isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          
          {loading && (
            <div className="px-4 py-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-HG-500 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Searching...</p>
            </div>
          )}

          {!loading && (
            <>
              {/* 1. GOOGLE LOCATIONS */}
              {googleLocations.length > 0 && (
                <div className="border-b border-gray-100">
                  <div className="px-4 py-2 bg-gray-50">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Locations
                    </p>
                  </div>
                  {googleLocations.map((loc, index) => (
                    <div
                      key={loc.place_id}
                      className={cn(
                        "px-4 py-3 cursor-pointer hover:bg-gray-50 flex items-center gap-3 transition-colors",
                        focusedIndex === index && "bg-gray-50 border-l-2 border-HG-500"
                      )}
                      onClick={() => handleGoogleSelect(loc)}
                      onMouseEnter={() => setFocusedIndex(index)}
                    >
                      <MapPin className="w-4 h-4 text-HG-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {loc.structured_formatting.main_text}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {loc.structured_formatting.secondary_text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 2. DB PROPERTIES */}
              {dbProperties.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-gray-50">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Properties
                    </p>
                  </div>
                  {dbProperties.map((property, index) => {
                    const actualIndex = googleLocations.length + index;
                    return (
                      <div
                        key={property._id}
                        className={cn(
                          "px-4 py-3 cursor-pointer hover:bg-gray-50 flex items-center gap-3 transition-colors",
                          focusedIndex === actualIndex && "bg-gray-50 border-l-2 border-HG-500"
                        )}
                        onClick={() => handlePropertySelect(property)}
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
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}