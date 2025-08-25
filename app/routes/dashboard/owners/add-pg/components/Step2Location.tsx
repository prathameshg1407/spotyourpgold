"use client";

import type React from "react";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/app/routes/auth/form-input";
import { MapPin, Loader2, Navigation, Plus, X } from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import type { StepProps } from "../types";

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

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);

  return null;
}

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

  return (
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
  );
}

export default function Step2Location({
  formData,
  setFormData,
  errors,
}: StepProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [mapKey, setMapKey] = useState(0);

  const addNearbyPlace = () => {
    const place = formData.location.nearbyPlacesInput.trim();
    if (place && !formData.location.nearbyPlaces.includes(place)) {
      setFormData((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          nearbyPlaces: [...prev.location.nearbyPlaces, place],
          nearbyPlacesInput: "",
        },
      }));
    }
  };

  const removeNearbyPlace = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        nearbyPlaces: prev.location.nearbyPlaces.filter((_, i) => i !== index),
      },
    }));
  };

  const handleNearbyPlaceKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addNearbyPlace();
    }
  };

  const getAddressFromCoords = useCallback(
    async (lat: number, lng: number) => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
        );
        const data = await response.json();

        if (data && data.address) {
          const addr = data.address;
          const area = [
            addr.house_number,
            addr.road,
            addr.neighbourhood,
            addr.suburb,
            addr.city_district,
          ]
            .filter(Boolean)
            .join(", ");
          setFormData((prev) => ({
            ...prev,
            location: {
              ...prev.location,
              coordinates: { lat, lng },
              area: area || prev.location.area,
              city:
                addr.city || addr.town || addr.village || prev.location.city,
              state: addr.state || prev.location.state,
              pincode: addr.postcode || prev.location.pincode,
            },
          }));
        }
      } catch (error) {
        console.error("Failed to get address:", error);
        setFormData((prev) => ({
          ...prev,
          location: {
            ...prev.location,
            coordinates: { lat, lng },
          },
        }));
      }
    },
    [setFormData]
  );

  const getCoordsFromAddress = useCallback(async () => {
    const { area, city, state, pincode } = formData.location;

    const queryLevels = [
      [area, city, state, pincode],
      [city, state, pincode],
      [state, pincode],
      [pincode],
    ];

    setIsLoading(true);

    try {
      for (const level of queryLevels) {
        const query = level.filter(Boolean).join(", ");
        if (!query.trim()) continue;

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query
          )}&limit=1&addressdetails=1`
        );
        const data = await response.json();

        if (data && data[0]) {
          const lat = Number.parseFloat(data[0].lat);
          const lng = Number.parseFloat(data[0].lon);

          setFormData((prev) => ({
            ...prev,
            location: {
              ...prev.location,
              coordinates: { lat, lng },
            },
          }));

          setMapKey((prev) => prev + 1);
          break;
        }
      }
    } catch (error) {
      console.error("Failed to get coordinates:", error);
    } finally {
      setIsLoading(false);
    }
  }, [formData, setFormData]);

  const handleMapLocationChange = useCallback(
    (lat: number, lng: number) => {
      getAddressFromCoords(lat, lng);
    },
    [getAddressFromCoords]
  );

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser");
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        getAddressFromCoords(latitude, longitude);
        setMapKey((prev) => prev + 1);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Unable to get your current location");
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [getAddressFromCoords]);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          getAddressFromCoords(
            position.coords.latitude,
            position.coords.longitude
          );
          setFormData((prev) => ({
            ...prev,
            location: {
              ...prev.location,
              coordinates: {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              },
            },
          }));
        },
        (err) => {
          console.warn("Geolocation denied or unavailable", err);
        }
      );
    } else {
      alert("Geolocation is not supported by this browser try to enable it");
    }
  }, [getAddressFromCoords, setFormData]);

  // Safely update map when coordinates change
  useEffect(() => {
    const lat = formData.location.coordinates.lat;
    const lng = formData.location.coordinates.lng;

    // Only update map if we have valid coordinates
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
      }, 500); // Debounce to avoid too frequent updates

      return () => clearTimeout(timeoutId);
    }
  }, [formData.location.coordinates.lat, formData.location.coordinates.lng]);

  return (
    <form>
      {/* Manual Coordinates Section */}
      <div className="space-y-4 text-left pb-5 border-b border-gray-200 mb-5">
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
            value={formData.location.coordinates.lat ? formData.location.coordinates.lat.toString() : ""}
            onChange={(value) => {
              const lat = value === "" ? 0 : parseFloat(value);
              if (!isNaN(lat)) {
                setFormData((prev) => ({
                  ...prev,
                  location: {
                    ...prev.location,
                    coordinates: { ...prev.location.coordinates, lat },
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
            value={formData.location.coordinates.lng ? formData.location.coordinates.lng.toString() : ""}
            onChange={(value) => {
              const lng = value === "" ? 0 : parseFloat(value);
              if (!isNaN(lng)) {
                setFormData((prev) => ({
                  ...prev,
                  location: {
                    ...prev.location,
                    coordinates: { ...prev.location.coordinates, lng },
                  },
                }));
              }
            }}
            placeholder="e.g. 77.2090"
            hasError={errors.longitude}
            icon={MapPin}
          />
        </div>

        <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
          <strong>Tip:</strong> You can enter coordinates directly here for
          precision. Address fields below are required for listing details.
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
          value={formData.location.area}
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
            value={formData.location.city}
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
            value={formData.location.state}
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
            value={formData.location.pincode}
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
            value={formData.location.nearbyPlacesInput}
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
            disabled={!formData.location.nearbyPlacesInput.trim()}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Display added nearby places */}
        {formData.location.nearbyPlaces.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.location.nearbyPlaces.map((place, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-HG-100 text-HG-700 px-3 py-1 rounded-full text-sm"
              >
                <span>{place}</span>
                <button
                  type="button"
                  onClick={() => removeNearbyPlace(index)}
                  className="text-HG-500 hover:text-HG-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

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
          Find on Map
        </Button>
        <Button
          type="button"
          onClick={getCurrentLocation}
          disabled={isLoading}
          className="flex items-center gap-2 font-inter"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4" />
          )}
          Current Location
        </Button>
      </div>

      <div className="h-[300px] sm:h-[400px] w-full rounded-lg overflow-hidden border-2 border-dashed border-HG-400">
        <MapContainer
          key={mapKey}
          center={[
            formData.location.coordinates.lat,
            formData.location.coordinates.lng,
          ]}
          zoom={13}
          scrollWheelZoom={true}
          className="h-full w-full"
          style={{ minHeight: "300px" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapUpdater
            center={[
              formData.location.coordinates.lat,
              formData.location.coordinates.lng,
            ]}
          />
          <MapController
            position={[
              formData.location.coordinates.lat,
              formData.location.coordinates.lng,
            ]}
            onLocationChange={handleMapLocationChange}
          />
        </MapContainer>
      </div>

      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded mt-2 mb-10">
        <strong>Instructions:</strong>
        <br />• Enter coordinates manually in the fields above for precise
        location
        <br />• OR click anywhere on map or drag the marker to select location
        <br />• Use &quot;Find on Map&quot; to locate typed address or
        &quot;Current Location&quot; for GPS
        <br />• Coordinates will automatically sync with map interactions
      </div>
    </form>
  );
}
