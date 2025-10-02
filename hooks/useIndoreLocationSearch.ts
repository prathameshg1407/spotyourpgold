/**
 * Enhanced location search hook with Indore locations JSON integration
 * Provides fast local search before falling back to geocoding
 */

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import indoreLocations from "@/data/indore-locations.json";

export interface LocationData {
  name: string;
  lat: number;
  lng: number;
  displayName: string;
  type: "city" | "area" | "state" | "country";
}

export interface SearchLocation {
  name: string;
  lat: number;
  lng: number;
  radius?: number; // in km
}

interface IndoreLocation {
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  city: string;
  aliases: string[];
}

export const useIndoreLocationSearch = () => {
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [searchLocation, setSearchLocation] = useState<SearchLocation | null>(
    null
  );
  const [locationDenied, setLocationDenied] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const router = useRouter();

  // Create search index for fast lookups
  const locationIndex = useMemo(() => {
    const index: { [key: string]: IndoreLocation } = {};

    indoreLocations.forEach((location) => {
      // Index by name
      index[location.name.toLowerCase()] = location;

      // Index by aliases
      location.aliases.forEach((alias) => {
        index[alias.toLowerCase()] = location;
      });
    });

    return index;
  }, []);

  // Fast local search in Indore locations
  const searchIndoreLocation = useCallback(
    (query: string): IndoreLocation | null => {
      if (!query.trim()) return null;

      const lowerQuery = query.toLowerCase().trim();

      // Direct match
      if (locationIndex[lowerQuery]) {
        return locationIndex[lowerQuery];
      }

      // Partial match
      const matches = Object.keys(locationIndex).filter(
        (key) => key.includes(lowerQuery) || lowerQuery.includes(key)
      );

      if (matches.length > 0) {
        return locationIndex[matches[0]];
      }

      return null;
    },
    [locationIndex]
  );

  // Get user's current location
  const getUserLocation = useCallback(() => {
    return new Promise<LocationData>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            // Reverse geocode to get location name
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
            );
            const data = await response.json();

            const locationData: LocationData = {
              name: data.display_name,
              lat: latitude,
              lng: longitude,
              displayName: data.display_name,
              type: "city",
            };

            resolve(locationData);
          } catch (error) {
            // If reverse geocoding fails, still return coordinates
            resolve({
              name: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
              lat: latitude,
              lng: longitude,
              displayName: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
              type: "city",
            });
          }
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  }, []);

  // Enhanced geocoding with Indore locations priority
  const geocodeLocation = useCallback(
    async (query: string): Promise<LocationData | null> => {
      if (!query.trim()) return null;

      setIsGeocoding(true);

      try {
        // First, try local Indore locations search
        const indoreLocation = searchIndoreLocation(query);
        if (indoreLocation) {
          const locationData: LocationData = {
            name: indoreLocation.name,
            lat: indoreLocation.lat,
            lng: indoreLocation.lng,
            displayName: indoreLocation.displayName,
            type: "city",
          };
          setIsGeocoding(false);
          return locationData;
        }

        // Fallback to Nominatim geocoding
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query
          )}&limit=1&addressdetails=1&countrycodes=in`
        );
        const data = await response.json();

        if (data && data[0]) {
          const lat = Number.parseFloat(data[0].lat);
          const lng = Number.parseFloat(data[0].lon);
          const displayName = data[0].display_name;

          // Determine location type based on address components
          let type: LocationData["type"] = "city";
          if (data[0].address) {
            if (data[0].address.city) type = "city";
            else if (data[0].address.town) type = "city";
            else if (data[0].address.village) type = "area";
            else if (data[0].address.state) type = "state";
            else if (data[0].address.country) type = "country";
          }

          return {
            name: displayName,
            lat,
            lng,
            displayName,
            type,
          };
        }
        return null;
      } catch (error) {
        console.error("Geocoding failed:", error);
        return null;
      } finally {
        setIsGeocoding(false);
      }
    },
    [searchIndoreLocation]
  );

  // Get location suggestions for autocomplete
  const getLocationSuggestions = useCallback(
    (query: string): IndoreLocation[] => {
      if (!query.trim() || query.length < 2) return [];

      const lowerQuery = query.toLowerCase().trim();
      const suggestions: IndoreLocation[] = [];

      // Search through all locations
      indoreLocations.forEach((location) => {
        const nameMatch = location.name.toLowerCase().includes(lowerQuery);
        const aliasMatch = location.aliases.some((alias) =>
          alias.toLowerCase().includes(lowerQuery)
        );

        if (nameMatch || aliasMatch) {
          suggestions.push(location);
        }
      });

      // Sort by relevance (exact matches first, then partial matches)
      return suggestions
        .sort((a, b) => {
          const aExact = a.name.toLowerCase() === lowerQuery;
          const bExact = b.name.toLowerCase() === lowerQuery;

          if (aExact && !bExact) return -1;
          if (!aExact && bExact) return 1;

          return a.name.localeCompare(b.name);
        })
        .slice(0, 10); // Limit to 10 suggestions
    },
    []
  );

  // Initialize user location on mount
  useEffect(() => {
    getUserLocation()
      .then((location) => {
        setUserLocation(location);
        setLocationDenied(false);
      })
      .catch((error) => {
        console.warn("Geolocation denied or unavailable:", error);
        setLocationDenied(true);
      });
  }, [getUserLocation]);

  // Search for listings near a specific location
  const searchNearby = useCallback(
    (location: SearchLocation, category?: string) => {
      const params = new URLSearchParams({
        lat: location.lat.toString(),
        lng: location.lng.toString(),
        radius: (location.radius || 10).toString(),
      });

      if (category) {
        params.set("category", category);
      }

      router.push(`/routes/all-listings?nearby=true&${params.toString()}`);
    },
    [router]
  );

  // Search for listings in a specific city/area
  const searchInLocation = useCallback(
    (location: SearchLocation, category?: string) => {
      const params = new URLSearchParams({
        lat: location.lat.toString(),
        lng: location.lng.toString(),
      });

      if (category) {
        params.set("category", category);
      }

      router.push(`/routes/all-listings?${params.toString()}`);
    },
    [router]
  );

  // Search with text query and location
  const searchWithQuery = useCallback(
    (query: string, location?: SearchLocation, category?: string) => {
      const params = new URLSearchParams({
        q: query,
      });

      if (location) {
        params.set("lat", location.lat.toString());
        params.set("lng", location.lng.toString());
      }

      if (category) {
        params.set("category", category);
      }

      router.push(`/routes/all-listings?${params.toString()}`);
    },
    [router]
  );

  return {
    userLocation,
    searchLocation,
    locationDenied,
    isGeocoding,
    setSearchLocation,
    getUserLocation,
    geocodeLocation,
    searchNearby,
    searchInLocation,
    searchWithQuery,
    getLocationSuggestions,
    searchIndoreLocation,
  };
};
