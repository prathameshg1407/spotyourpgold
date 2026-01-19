// lib/googleMaps.ts
let googleMapsPromise: Promise<typeof google> | null = null;

/**
 * Lazy-loads Google Maps JavaScript API
 * Only loads once per session
 * @param apiKey - Google Maps API Key (restricted to domain)
 * @returns Promise resolving to google object
 */
export const loadGoogleMaps = (apiKey: string): Promise<typeof google> => {
  if (typeof window === "undefined") {
    return Promise.reject("Window not available");
  }

  // If already loaded, return immediately
  if (window.google?.maps) {
    return Promise.resolve(window.google);
  }

  // If loading in progress, return existing promise
  if (!googleMapsPromise) {
    googleMapsPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        if (window.google?.maps) {
          console.log("✅ Google Maps loaded successfully");
          resolve(window.google);
        } else {
          reject(new Error("Google Maps failed to load"));
        }
      };
      
      script.onerror = () => {
        console.error("❌ Failed to load Google Maps script");
        reject(new Error("Failed to load Google Maps script"));
      };
      
      document.head.appendChild(script);
    });
  }

  return googleMapsPromise;
};

/**
 * Fallback URL when quota exceeded or script fails
 * Opens Google Maps in new tab with exact coordinates
 * @param lat - Latitude
 * @param lng - Longitude
 * @param pgName - PG name for search context
 * @returns Google Maps URL
 */
export const getGoogleMapsExternalUrl = (
  lat: number,
  lng: number,
  pgName: string
) => {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${encodeURIComponent(
    pgName
  )}`;
};

/**
 * Get directions URL from user location to PG
 * @param toLat - Destination latitude
 * @param toLng - Destination longitude
 * @returns Google Maps directions URL
 */
export const getDirectionsUrl = (toLat: number, toLng: number) => {
  return `https://www.google.com/maps/dir/?api=1&destination=${toLat},${toLng}`;
};

/**
 * Check if Google Maps is loaded
 * @returns boolean
 */
export const isGoogleMapsLoaded = (): boolean => {
  return typeof window !== "undefined" && !!window.google?.maps;
};