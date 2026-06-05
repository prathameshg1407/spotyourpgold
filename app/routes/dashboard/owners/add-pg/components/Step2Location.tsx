"use client";

import type React from "react";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/app/routes/auth/form-input";
import { MapPin, Loader2, Navigation, Plus, X, AlertCircle, Search } from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import type { StepProps } from "../types";
import { toast } from "sonner";
import { safeString, safeArray } from "../utils/formDataHelpers";
import Script from "next/script"; // Import Next.js Script

// Custom marker icon
const createMarkerIcon = () => {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width: 20px;
      height: 20px;
      background-color: #D58F24;
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      cursor: pointer;
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

// Map center updater component
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    if (center[0] && center[1]) {
      map.setView(center, 13);
    }
  }, [center, map]);

  return null;
}

// Map click and drag handler
function MapController({
  position,
  onLocationChange,
}: {
  position: [number, number];
  onLocationChange: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onLocationChange(lat, lng);
    },
  });

  return position[0] && position[1] ? (
    <Marker
      position={position}
      draggable={true}
      icon={createMarkerIcon()}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const { lat, lng } = marker.getLatLng();
          onLocationChange(lat, lng);
        },
      }}
    />
  ) : null;
}

export default function Step2Location({
  formData,
  setFormData,
  errors,
}: StepProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const [lastGeocodingTime, setLastGeocodingTime] = useState(0);
  const [geolocationSupported, setGeolocationSupported] = useState(true);
  
  // Google Places Ref
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Rate limiting for Nominatim (1 request per second)
  const MIN_REQUEST_INTERVAL = 1000;

  // Safe accessors with fallbacks
  const location = useMemo(() => formData.location || {
    area: '',
    city: '',
    state: '',
    pincode: '',
    nearbyPlaces: [],
    nearbyPlacesInput: '',
    coordinates: { lat: 0, lng: 0 },
  }, [formData.location]);

  const nearbyPlacesInput = useMemo(
    () => safeString(location.nearbyPlacesInput),
    [location.nearbyPlacesInput]
  );

  const nearbyPlaces = useMemo(
    () => safeArray<string>(location.nearbyPlaces),
    [location.nearbyPlaces]
  );

  const coordinates = useMemo(() => ({
    lat: typeof location.coordinates?.lat === 'number' ? location.coordinates.lat : 0,
    lng: typeof location.coordinates?.lng === 'number' ? location.coordinates.lng : 0,
  }), [location.coordinates]);

  // Check geolocation support on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeolocationSupported(false);
    }
  }, []);

  // Initialize Google Autocomplete
  const initAutocomplete = useCallback(() => {
    if (!searchInputRef.current || !window.google || !window.google.maps || !window.google.maps.places) {
      return;
    }

    // Prevent double initialization
    if (autocompleteRef.current) return;

    // console.log("🚀 Initializing Google Autocomplete..."); // Debug log

    try {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(searchInputRef.current, {
        types: ["geocode", "establishment"],
        componentRestrictions: { country: "in" },
        fields: ["geometry", "address_components", "formatted_address"],
      });

      autocompleteRef.current.addListener("place_changed", handlePlaceSelect);
    } catch (error) {
      console.error("Google Autocomplete Init Error:", error);
    }
  }, []); // Dependencies

  // 2. Effect to Check if Script is Already Loaded (The Fix)
  useEffect(() => {
    // Check if Google Maps is already available globally
    if (typeof window !== "undefined" && window.google && window.google.maps && window.google.maps.places) {
      initAutocomplete();
    }
  }, [initAutocomplete]);

  const handlePlaceSelect = () => {
    const place = autocompleteRef.current?.getPlace();

    if (!place || !place.geometry || !place.geometry.location) {
      toast.error("Please select a location from the dropdown");
      return;
    }

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();

    // Extract address components from Google
    let area = "";
    let city = "";
    let state = "";
    let pincode = "";

    if (place.address_components) {
      place.address_components.forEach((component) => {
        const types = component.types;
        if (types.includes("sublocality") || types.includes("neighborhood")) {
          area = component.long_name;
        }
        if (types.includes("locality")) {
          city = component.long_name;
        }
        if (types.includes("administrative_area_level_1")) {
          state = component.long_name;
        }
        if (types.includes("postal_code")) {
          pincode = component.long_name;
        }
      });
    }

    // Fallback if area is empty, use formatted address first part
    if (!area && place.formatted_address) {
      area = place.formatted_address.split(",")[0];
    }

    setFormData((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        coordinates: { lat, lng },
        area: area || prev.location.area,
        city: city || prev.location.city,
        state: state || prev.location.state,
        pincode: pincode || prev.location.pincode,
      },
    }));

    toast.success("Location updated from search!");
  };

  const addNearbyPlace = useCallback(() => {
    const place = nearbyPlacesInput.trim();
    
    if (!place) {
      return;
    }

    if (nearbyPlaces.includes(place)) {
      toast.info("This place is already added");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        nearbyPlaces: [...nearbyPlaces, place],
        nearbyPlacesInput: "",
      },
    }));

    toast.success("Nearby place added");
  }, [nearbyPlacesInput, nearbyPlaces, setFormData]);

  const removeNearbyPlace = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        nearbyPlaces: nearbyPlaces.filter((_, i) => i !== index),
      },
    }));

    toast.success("Nearby place removed");
  }, [nearbyPlaces, setFormData]);

  const handleNearbyPlaceKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addNearbyPlace();
    }
  }, [addNearbyPlace]);

  // Reverse geocoding: Coordinates → Address (Nominatim fallback)
  const getAddressFromCoords = useCallback(
    async (lat: number, lng: number) => {
      try {
        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          throw new Error("Invalid coordinates");
        }

        const now = Date.now();
        const timeSinceLastRequest = now - lastGeocodingTime;
        if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
          await new Promise((resolve) =>
            setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
          );
        }
        setLastGeocodingTime(Date.now());

        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
          {
            headers: {
              "User-Agent": "SpotYourPG/1.0 (spotyourpg.com)",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Geocoding failed");
        }

        const data = await response.json();

        if (data && data.address) {
          const addr = data.address;
          
          const areaComponents = [
            addr.house_number,
            addr.road,
            addr.neighbourhood,
            addr.suburb,
            addr.hamlet,
            addr.village,
            addr.town,
            addr.city_district,
            addr.municipality,
          ].filter(Boolean);

          const area = areaComponents.length > 0 
            ? areaComponents.join(", ")
            : data.display_name || "";

          const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || "";
          const state = addr.state || addr.region || "";
          const pincode = addr.postcode || "";

          setFormData((prev) => ({
            ...prev,
            location: {
              ...prev.location,
              coordinates: { lat, lng },
              area: area,
              city: city,
              state: state,
              pincode: pincode,
            },
          }));

          toast.success("Address updated from map location");
        } else {
          setFormData((prev) => ({
            ...prev,
            location: {
              ...prev.location,
              coordinates: { lat, lng },
            },
          }));
          toast.warning("Coordinates updated. Could not fetch full address.");
        }
      } catch (error) {
        console.error("Reverse geocoding error:", error);
        setFormData((prev) => ({
          ...prev,
          location: {
            ...prev.location,
            coordinates: { lat, lng },
          },
        }));
        toast.warning("Coordinates updated. Please fill address manually.");
      }
    },
    [setFormData, lastGeocodingTime]
  );

  // Forward geocoding: Address → Coordinates (Nominatim)
  const getCoordsFromAddress = useCallback(async () => {
    const area = safeString(location.area);
    const city = safeString(location.city);
    const state = safeString(location.state);
    const pincode = safeString(location.pincode);

    const queryLevels = [
      [area, city, state, pincode],
      [city, state, pincode],
      [state, pincode],
      [pincode],
    ];

    setIsLoading(true);

    try {
      const now = Date.now();
      const timeSinceLastRequest = now - lastGeocodingTime;
      if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        await new Promise((resolve) =>
          setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
        );
      }
      setLastGeocodingTime(Date.now());

      for (const level of queryLevels) {
        const query = level.filter(Boolean).join(", ");
        if (!query.trim()) continue;

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query
          )}&countrycodes=in&limit=1&addressdetails=1`,
          {
            headers: {
              "User-Agent": "SpotYourPG/1.0 (spotyourpg.com)",
            },
          }
        );

        if (!response.ok) continue;

        const data = await response.json();

        if (data && data[0]) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);

          setFormData((prev) => ({
            ...prev,
            location: {
              ...prev.location,
              coordinates: { lat, lng },
            },
          }));

          setMapKey((prev) => prev + 1);
          toast.success("Location found on map!");
          return;
        }
      }
      toast.error("Could not find location. Try entering coordinates manually.");
    } catch (error) {
      console.error("Geocoding error:", error);
      toast.error("Could not find location. Try manual selection.");
    } finally {
      setIsLoading(false);
    }
  }, [location, setFormData, lastGeocodingTime]);

  const handleMapLocationChange = useCallback(
    (lat: number, lng: number) => {
      getAddressFromCoords(lat, lng);
    },
    [getAddressFromCoords]
  );

  const getGeolocationErrorMessage = (error: GeolocationPositionError): string => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return "Location permission denied. Please enable location access in your browser settings.";
      case error.POSITION_UNAVAILABLE:
        return "Location information is unavailable. Please check your device settings.";
      case error.TIMEOUT:
        return "Location request timed out. Please try again.";
      default:
        return "Unable to get your current location. Please try again or enter manually.";
    }
  };

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      setGeolocationSupported(false);
      return;
    }

    setIsLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        getAddressFromCoords(latitude, longitude);
        setMapKey((prev) => prev + 1);
        setIsLoading(false);
        toast.success("Location detected successfully!");
      },
      (error) => {
        const errorMessage = getGeolocationErrorMessage(error);
        console.error("Geolocation error:", {
          code: error.code,
          message: error.message,
        });
        toast.error(errorMessage);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [getAddressFromCoords]);

  useEffect(() => {
    if ("geolocation" in navigator && !coordinates.lat && !coordinates.lng) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          setFormData((prev) => ({
            ...prev,
            location: {
              ...prev.location,
              coordinates: { lat, lng },
            },
          }));

          getAddressFromCoords(lat, lng).catch(() => {});
        },
        (err) => {
          console.log("Auto-location detection skipped:", err.code);
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 300000,
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const { lat, lng } = coordinates;

    if (
      lat &&
      lng &&
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    ) {
      const timeoutId = setTimeout(() => {
        setMapKey((prev) => prev + 1);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [coordinates.lat, coordinates.lng]);

  const mapCenter: [number, number] = useMemo(() => [
    coordinates.lat || 28.6139,
    coordinates.lng || 77.209,
  ], [coordinates.lat, coordinates.lng]);

  const isAddButtonDisabled = useMemo(
    () => !nearbyPlacesInput.trim(),
    [nearbyPlacesInput]
  );

  return (
    <form className="space-y-6">
      {/* 3. Keep Script for direct page loads, but ensure ID matches Navbar if possible */}
      <Script
        id="google-maps-script" // Adding an ID helps Next.js deduplicate
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        onLoad={initAutocomplete}
        strategy="lazyOnload"
      />

      {!geolocationSupported && (
        <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Geolocation not supported</p>
            <p className="text-xs mt-1">
              Your browser doesn&apos;t support geolocation. Please enter coordinates
              or address manually.
            </p>
          </div>
        </div>
      )}

      {/* ✅ NEW: Google Search Bar for Property Location */}
      <div className="space-y-3 pb-5 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">
          Search Property Location
        </h3>
        <p className="text-sm text-gray-600">
          Search for your PG area or a nearby landmark to automatically set the address and coordinates.
        </p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            ref={searchInputRef}
            type="text"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-HG-500 focus:border-transparent"
            placeholder="Search for an area, landmark, or street..."
          />
        </div>
      </div>

      <div className="space-y-4 text-left pb-5 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">
          Location Coordinates
        </h3>
        <p className="text-sm text-gray-600">
          Enter exact latitude and longitude coordinates (recommended for
          precise location)
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            id="latitude"
            label="Latitude"
            type="number"
            value={coordinates.lat ? coordinates.lat.toString() : ""}
            onChange={(value) => {
              const lat = value === "" ? 0 : parseFloat(value);
              if (!isNaN(lat) && lat >= -90 && lat <= 90) {
                setFormData((prev) => ({
                  ...prev,
                  location: {
                    ...prev.location,
                    coordinates: { 
                      lat,
                      lng: coordinates.lng,
                    },
                  },
                }));
              }
            }}
            placeholder="e.g. 28.6139"
            hasError={errors.latitude}
            icon={MapPin}
          />

          <FormInput
            id="longitude"
            label="Longitude"
            type="number"
            value={coordinates.lng ? coordinates.lng.toString() : ""}
            onChange={(value) => {
              const lng = value === "" ? 0 : parseFloat(value);
              if (!isNaN(lng) && lng >= -180 && lng <= 180) {
                setFormData((prev) => ({
                  ...prev,
                  location: {
                    ...prev.location,
                    coordinates: { 
                      lat: coordinates.lat,
                      lng,
                    },
                  },
                }));
              }
            }}
            placeholder="e.g. 77.2090"
            hasError={errors.longitude}
            icon={MapPin}
          />
        </div>

        <div className="text-xs text-blue-600 bg-blue-50 p-3 rounded">
          <strong>💡 Tip:</strong> You can enter coordinates directly here for
          precision. The map will update automatically. Address fields below are
          required for listing details.
        </div>
      </div>

      {/* Address Section */}
      <div className="space-y-4 text-left pb-5">
        <h3 className="text-lg font-semibold text-gray-800">
          Address Details{" "}
          <span className="text-sm font-normal text-red-500">(Required)</span>
        </h3>

        <FormInput
          id="area"
          label="Area"
          type="textarea"
          value={safeString(location.area)}
          onChange={(value) =>
            setFormData((prev) => ({
              ...prev,
              location: { ...prev.location, area: value },
            }))
          }
          placeholder="Enter complete address with landmarks"
          hasError={errors.area}
          icon={MapPin}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormInput
            id="city"
            label="City"
            type="text"
            value={safeString(location.city)}
            onChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                location: { ...prev.location, city: value },
              }))
            }
            placeholder="e.g. Delhi"
            hasError={errors.city}
            icon={MapPin}
          />

          <FormInput
            id="state"
            label="State"
            type="text"
            value={safeString(location.state)}
            onChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                location: { ...prev.location, state: value },
              }))
            }
            placeholder="e.g. Delhi"
            hasError={errors.state}
            icon={MapPin}
          />

          <FormInput
            id="pincode"
            label="Pincode"
            type="text"
            value={safeString(location.pincode)}
            onChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                location: { ...prev.location, pincode: value },
              }))
            }
            placeholder="e.g. 110001"
            hasError={errors.pincode}
            icon={MapPin}
          />
        </div>
      </div>

      {/* Nearby Places Section */}
      <div className="space-y-4 pb-5">
        <div className="flex items-center gap-2">
          <FormInput
            id="nearbyPlacesInput"
            label="Nearby Places"
            type="text"
            value={nearbyPlacesInput}
            onChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                location: { ...prev.location, nearbyPlacesInput: value },
              }))
            }
            placeholder="e.g. Metro Station, Shopping Mall, Hospital"
            icon={MapPin}
            hasError={false}
            onKeyPress={handleNearbyPlaceKeyPress}
          />
          <Button
            type="button"
            onClick={addNearbyPlace}
            className="mt-6 bg-HG-500 hover:bg-HG-600"
            disabled={isAddButtonDisabled}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {nearbyPlaces.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {nearbyPlaces.map((place, index) => (
              <div
                key={`${place}-${index}`}
                className="flex items-center gap-2 bg-HG-100 text-HG-700 px-3 py-1 rounded-full text-sm"
              >
                <span>{place}</span>
                <button
                  type="button"
                  onClick={() => removeNearbyPlace(index)}
                  className="text-HG-500 hover:text-HG-700"
                  aria-label={`Remove ${place}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 pb-5 justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={getCoordsFromAddress}
          disabled={isLoading}
          className="flex items-center gap-2 bg-transparent text-gray-500 font-inter"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <MapPin className="w-4 h-4" />
          )}
          Find on Map (from Address)
        </Button>
        <Button
          type="button"
          onClick={getCurrentLocation}
          disabled={isLoading || !geolocationSupported}
          className="flex items-center gap-2 font-inter bg-HG-500 hover:bg-HG-600 disabled:opacity-50 disabled:cursor-not-allowed"
          title={
            !geolocationSupported
              ? "Geolocation not supported"
              : "Get current GPS location"
          }
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4" />
          )}
          Current Location
        </Button>
      </div>

      {/* Interactive Map */}
      <div className="h-[300px] sm:h-[400px] w-full rounded-lg overflow-hidden border-2 border-dashed border-HG-400">
        <MapContainer
          key={mapKey}
          center={mapCenter}
          zoom={13}
          scrollWheelZoom={true}
          className="h-full w-full"
          style={{ minHeight: "300px" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapUpdater center={mapCenter} />
          <MapController
            position={mapCenter}
            onLocationChange={handleMapLocationChange}
          />
        </MapContainer>
      </div>

      {/* Instructions */}
      <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded space-y-1">
        <p className="font-semibold">📍 How to use:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li><strong>Use &quot;Search Property Location&quot;</strong> to find a place and auto-fill details (Recommended)</li>
          <li>Enter coordinates manually above for exact precision</li>
          <li>Click anywhere on map or drag marker to adjust location</li>
          <li>Use &quot;Current Location&quot; for GPS-based location</li>
        </ul>
      </div>
    </form>
  );
}