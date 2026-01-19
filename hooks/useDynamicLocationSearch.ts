// hooks/useIndoreLocationSearch.ts (rename to useDynamicLocationSearch.ts)
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

export interface LocationData {
  name: string;
  lat: number;
  lng: number;
  displayName: string;
  type: string;
  category?: string;
}


export interface SearchLocation {
  name: string;
  lat: number;
  lng: number;
  radius?: number;
}

export const useDynamicLocationSearch = () => {
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [searchLocation, setSearchLocation] = useState<SearchLocation | null>(null);
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
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
              {
                headers: {
                  "User-Agent": "SpotYourPG/1.0 (spotyourpg.com)",
                },
              }
            );
            const data = await response.json();

            const locationData: LocationData = {
              name: data.address?.city || data.address?.town || data.display_name.split(",")[0],
              lat: latitude,
              lng: longitude,
              displayName: data.display_name,
              type: "current_location",
            };

            resolve(locationData);
          } catch (error) {
            resolve({
              name: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
              lat: latitude,
              lng: longitude,
              displayName: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
              type: "coordinates",
            });
          }
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        }
      );
    });
  }, []);

  // Geocode any location dynamically
  const geocodeLocation = useCallback(async (query: string): Promise<LocationData | null> => {
    if (!query.trim()) return null;

    setIsGeocoding(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&countrycodes=in&limit=1&addressdetails=1&extratags=1`,
        {
          headers: {
            "User-Agent": "SpotYourPG/1.0 (spotyourpg.com)",
          },
        }
      );

      const data = await response.json();

      if (data && data[0]) {
        const result = data[0];
        return {
          name: result.name || result.display_name.split(",")[0],
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          displayName: result.display_name,
          type: result.type || "location",
          category: result.class || "place",
        };
      }

      return null;
    } catch (error) {
      console.error("Geocoding error:", error);
      return null;
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  // Get dynamic location suggestions via API
  const getLocationSuggestions = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 3) return [];

    try {
      const response = await fetch(
        `/api/location/autocomplete?q=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      return data.predictions || [];
    } catch (error) {
      console.error("Suggestions error:", error);
      return [];
    }
  }, []);

  // Initialize user location on mount
  useEffect(() => {
    getUserLocation()
      .then((location) => {
        setUserLocation(location);
        setLocationDenied(false);
      })
      .catch((error) => {
        console.error("Location error:", error);
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
        nearby: "true",
      });

      if (category) {
        params.set("category", category);
      }

      router.push(`/routes/location-search?${params.toString()}`);
    },
    [router]
  );

  // Search for listings in a specific city/area
  const searchInLocation = useCallback(
    (location: SearchLocation, category?: string) => {
      const params = new URLSearchParams({
        lat: location.lat.toString(),
        lng: location.lng.toString(),
        name: location.name,
      });

      if (category) {
        params.set("category", category);
      }

      router.push(`/routes/location-search?${params.toString()}`);
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

      router.push(`/routes/location-search?${params.toString()}`);
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
  };
};
