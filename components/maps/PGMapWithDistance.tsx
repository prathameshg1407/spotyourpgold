// components/maps/PGMapWithDistance.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Navigation,
  MapPin,
  Ruler,
  Locate,
  ExternalLink,
  AlertCircle,
  Car,
  Clock,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Fix Leaflet icons
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

// Custom Icons
const pgIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const userIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface RouteInfo {
  distance: number; // in kilometers
  duration: number; // in seconds
  coordinates: [number, number][]; // route path
}

interface PGMapWithDistanceProps {
  lat: number;
  lng: number;
  pgName: string;
  address: string;
}

export default function PGMapWithDistance({
  lat,
  lng,
  pgName,
  address,
}: PGMapWithDistanceProps) {
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const pgPosition: [number, number] = [lat, lng];

  // Format distance
  const formatDistance = (km: number): string => {
    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(2)} km`;
  };

  // Format duration
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes} min`;
  };

  // Fetch route from OpenRouteService
// Free routing using OSRM (no API key needed)
const fetchRoute = async (
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
) => {
  setRouteLoading(true);
  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`
    );

    if (!response.ok) throw new Error("Failed to fetch route");

    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const coordinates = route.geometry.coordinates.map(
        (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
      );

      setRouteInfo({
        distance: route.distance / 1000, // Convert to km
        duration: route.duration, // in seconds
        coordinates,
      });

      if (mapRef.current && coordinates.length > 0) {
        const bounds = L.latLngBounds(coordinates);
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }

      toast.success("Route calculated!");
    }
  } catch (err) {
    console.error("Route fetch error:", err);
    toast.error("Failed to calculate route");
  } finally {
    setRouteLoading(false);
  }
};

  // Get user's current location
  const getUserLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      toast.error("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        setUserLocation({ lat: userLat, lng: userLng });

        // Fetch actual route
        fetchRoute(userLat, userLng, lat, lng);

        setLoading(false);
        toast.success("Location found!");
      },
      (error) => {
        let errorMessage = "Failed to get location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
        }
        setError(errorMessage);
        setLoading(false);
        toast.error(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Open in Google Maps with directions
  const openDirections = () => {
    if (userLocation) {
      window.open(
        `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${lat},${lng}`,
        "_blank"
      );
    } else {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
        "_blank"
      );
    }
  };

  // Open location in Google Maps
  const openInGoogleMaps = () => {
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
      "_blank"
    );
  };

  const getInitialZoom = () => {
    return userLocation ? 13 : 15;
  };

  return (
    <div className="w-full space-y-4">
      {/* Route Info Card */}
      {routeInfo && userLocation && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Distance */}
              <div className="flex items-center gap-3">
                <div className="bg-blue-500 p-3 rounded-full">
                  <Ruler className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Distance</p>
                  <p className="text-xl font-bold text-blue-600">
                    {formatDistance(routeInfo.distance)}
                  </p>
                </div>
              </div>

              {/* Duration */}
              <div className="flex items-center gap-3">
                <div className="bg-green-500 p-3 rounded-full">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Travel Time</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatDuration(routeInfo.duration)}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-end">
                <Button
                  onClick={openDirections}
                  className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Navigate Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading Route */}
      {routeLoading && (
        <Alert>
          <Car className="h-4 w-4 animate-bounce" />
          <AlertDescription>
            Calculating best route on roads...
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Map Container */}
      <div className="rounded-lg overflow-hidden border relative bg-white shadow-lg">
        <div className="h-[450px] relative">
          <MapContainer
            center={pgPosition}
            zoom={getInitialZoom()}
            scrollWheelZoom={true}
            className="h-full w-full"
            ref={mapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* PG Location Marker */}
            <Marker position={pgPosition} icon={pgIcon}>
              <Popup>
                <div className="text-center p-2 min-w-[200px]">
                  <MapPin className="h-5 w-5 text-red-600 mx-auto mb-2" />
                  <strong className="text-base block mb-1">{pgName}</strong>
                  <p className="text-sm text-gray-600 mb-3">{address}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={openInGoogleMaps}
                    className="w-full"
                  >
                    <ExternalLink className="h-3 w-3 mr-2" />
                    Open in Google Maps
                  </Button>
                </div>
              </Popup>
            </Marker>

            {/* User Location Marker */}
            {userLocation && (
              <Marker
                position={[userLocation.lat, userLocation.lng]}
                icon={userIcon}
              >
                <Popup>
                  <div className="text-center p-2">
                    <Locate className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                    <strong className="text-sm block mb-1">
                      Your Location
                    </strong>
                    {routeInfo && (
                      <div className="text-xs text-gray-600 mt-2 space-y-1">
                        <p>📍 {formatDistance(routeInfo.distance)} away</p>
                        <p>🕐 {formatDuration(routeInfo.duration)} drive</p>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Route Polyline (actual roads) */}
            {routeInfo && routeInfo.coordinates.length > 0 && (
              <Polyline
                positions={routeInfo.coordinates}
                pathOptions={{
                  color: "#3b82f6",
                  weight: 4,
                  opacity: 0.8,
                }}
              />
            )}

            {/* Fallback: Straight line if no route */}
            {userLocation && !routeInfo && (
              <Polyline
                positions={[
                  [userLocation.lat, userLocation.lng],
                  pgPosition,
                ]}
                pathOptions={{
                  color: "#94a3b8",
                  weight: 2,
                  opacity: 0.5,
                  dashArray: "10, 10",
                }}
              />
            )}
          </MapContainer>

          {/* Locate Button */}
          <div className="absolute top-4 right-4 z-[1000]">
            <Button
              onClick={getUserLocation}
              disabled={loading || routeLoading}
              className="bg-white hover:bg-gray-100 text-gray-900 shadow-lg border"
            >
              {loading || routeLoading ? (
                <>
                  <Car className="h-4 w-4 mr-2 animate-pulse" />
                  {routeLoading ? "Calculating..." : "Locating..."}
                </>
              ) : (
                <>
                  <Locate className="h-4 w-4 mr-2" />
                  Find Route
                </>
              )}
            </Button>
          </div>

          {/* Info Card */}
          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs z-[1000]">
            <div className="flex items-start gap-2">
              <MapPin className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm mb-1">{pgName}</h3>
                <p className="text-xs text-gray-600">{address}</p>
              </div>
            </div>
            {routeInfo && (
              <div className="mt-3 pt-3 border-t space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Ruler className="h-3 w-3" /> Distance:
                  </span>
                  <Badge variant="secondary">
                    {formatDistance(routeInfo.distance)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Time:
                  </span>
                  <Badge variant="secondary">
                    {formatDuration(routeInfo.duration)}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="bg-gray-50 border-t p-3 flex gap-2">
          {!userLocation ? (
            <Button
              onClick={getUserLocation}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <>
                  <Car className="h-4 w-4 mr-2 animate-pulse" />
                  Getting Location...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Calculate Route & Distance
                </>
              )}
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={openInGoogleMaps}
                className="flex-1"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Map
              </Button>
              <Button
                onClick={openDirections}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Navigation className="h-4 w-4 mr-2" />
                Get Directions
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Additional Info */}
      {routeInfo && (
        <div className="text-xs text-gray-500 text-center">
          Route calculated using actual roads • Powered by OpenRouteService
        </div>
      )}
    </div>
  );
}