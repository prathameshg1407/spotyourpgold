/**
 * Custom hook for location-based search functionality
 * Handles geocoding, location detection, and nearby search
 */

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

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

export const useLocationSearch = () => {
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [searchLocation, setSearchLocation] = useState<SearchLocation | null>(
    null
  );
  const [locationDenied, setLocationDenied] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const router = useRouter();

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
              type: "city", // Default type
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

  // Geocode a location string to coordinates
  const geocodeLocation = useCallback(
    async (query: string): Promise<LocationData | null> => {
      if (!query.trim()) return null;

      setIsGeocoding(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query
          )}&limit=1&addressdetails=1&countrycodes=in` // Limit to India
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
        return null;
      } finally {
        setIsGeocoding(false);
      }
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
  };
};