// components/maps/OpenStreetMapDetail.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch";
import "leaflet-geosearch/dist/geosearch.css";
import {
  ExternalLink,
  Navigation,
  Maximize2,
  Search,
  Locate,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

// Fix Leaflet default marker icons in Next.js
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

// Custom marker icons
const createCustomIcon = (color: string) =>
  new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

const redIcon = createCustomIcon("red");
const blueIcon = createCustomIcon("blue");

// Map styles
enum MapStyle {
  STANDARD = "standard",
  LIGHT = "light",
  DARK = "dark",
  SATELLITE = "satellite",
}

const MAP_STYLES = {
  [MapStyle.STANDARD]: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  [MapStyle.LIGHT]: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
  },
  [MapStyle.DARK]: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
  },
  [MapStyle.SATELLITE]: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
  },
};

interface OpenStreetMapDetailProps {
  lat: number;
  lng: number;
  pgName: string;
  address: string;
  showDirections?: boolean;
  showSearch?: boolean;
  allowFullscreen?: boolean;
}

// Component to add search control
function SearchControl({ map }: { map: L.Map | null }) {
  const searchControlRef = useRef<any>(null);

  useEffect(() => {
    if (!map) return;

    const provider = new OpenStreetMapProvider();

    const searchControl = new (GeoSearchControl as any)({
      provider,
      style: "bar",
      showMarker: true,
      showPopup: false,
      autoClose: true,
      retainZoomLevel: false,
      animateZoom: true,
      keepResult: true,
      searchLabel: "Search location...",
    });

    searchControlRef.current = searchControl;
    map.addControl(searchControl);

    // Listen to search results
    map.on("geosearch/showlocation", (result: any) => {
      console.log("Location found:", result);
      toast.success("Location found!");
    });

    return () => {
      if (searchControlRef.current) {
        map.removeControl(searchControlRef.current);
      }
    };
  }, [map]);

  return null;
}

// Component to recenter map
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);

  return null;
}

// Component to locate user
function LocateControl({
  onLocate,
}: {
  onLocate: (lat: number, lng: number) => void;
}) {
  const map = useMap();

  useEffect(() => {
    map.on("locationfound", (e: L.LocationEvent) => {
      onLocate(e.latlng.lat, e.latlng.lng);
      map.flyTo(e.latlng, 16);
      toast.success("Location found!");
    });

    map.on("locationerror", () => {
      toast.error("Could not find your location");
    });

    return () => {
      map.off("locationfound");
      map.off("locationerror");
    };
  }, [map, onLocate]);

  return null;
}

export default function OpenStreetMapDetail({
  lat,
  lng,
  pgName,
  address,
  showDirections = true,
  showSearch = true,
  allowFullscreen = true,
}: OpenStreetMapDetailProps) {
  const [isClient, setIsClient] = useState(false);
  const [mapStyle, setMapStyle] = useState<MapStyle>(MapStyle.STANDARD);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const position: [number, number] = [lat, lng];

  const openInGoogleMaps = () => {
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
      "_blank"
    );
  };

  const openInOpenStreetMap = () => {
    window.open(
      `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`,
      "_blank"
    );
  };

  const getDirections = () => {
    if (userLocation) {
      // If user location is available, show route from user to destination
      window.open(
        `https://www.google.com/maps/dir/${userLocation[0]},${userLocation[1]}/${lat},${lng}`,
        "_blank"
      );
    } else {
      // Otherwise just open destination
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
        "_blank"
      );
    }
  };

  const recenterMap = () => {
    if (mapRef.current) {
      mapRef.current.setView(position, 16);
    }
  };

  const locateUser = () => {
    if (mapRef.current) {
      mapRef.current.locate({ setView: true, maxZoom: 16 });
    }
  };

  const handleUserLocate = (lat: number, lng: number) => {
    setUserLocation([lat, lng]);
  };

  const toggleFullscreen = () => {
    if (!allowFullscreen) return;

    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  if (!isClient) {
    return null;
  }

  const currentStyle = MAP_STYLES[mapStyle];

  return (
    <div
      ref={containerRef}
      className={`w-full rounded-lg overflow-hidden border relative bg-white ${
        isFullscreen ? "h-screen" : ""
      }`}
    >
      <div className={isFullscreen ? "h-full" : "h-[400px]"}>
        <MapContainer
          center={position}
          zoom={16}
          scrollWheelZoom={true}
          className="h-full w-full"
          ref={mapRef}
        >
          <TileLayer
            attribution={currentStyle.attribution}
            url={currentStyle.url}
          />

          {/* Main marker */}
          <Marker position={position} icon={redIcon}>
            <Popup>
              <div className="text-center p-2 min-w-[200px]">
                <strong className="text-base block mb-1">{pgName}</strong>
                <p className="text-sm text-gray-600 mb-3">{address}</p>
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={getDirections}
                    className="w-full"
                  >
                    <Navigation className="h-3 w-3 mr-2" />
                    Get Directions
                  </Button>
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
              </div>
            </Popup>
          </Marker>

          {/* User location marker */}
          {userLocation && (
            <Marker position={userLocation} icon={blueIcon}>
              <Popup>
                <div className="text-center p-2">
                  <strong className="text-sm">Your Location</strong>
                </div>
              </Popup>
            </Marker>
          )}

          <RecenterMap lat={lat} lng={lng} />
          <LocateControl onLocate={handleUserLocate} />
          {showSearch && <SearchControl map={mapRef.current} />}
        </MapContainer>

        {/* Floating Controls - Top Right */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-[1000]">
          {/* Map Style Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="secondary"
                className="bg-white hover:bg-gray-100 shadow-lg"
                title="Change map style"
              >
                <Layers className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setMapStyle(MapStyle.STANDARD)}>
                Standard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMapStyle(MapStyle.LIGHT)}>
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMapStyle(MapStyle.DARK)}>
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMapStyle(MapStyle.SATELLITE)}>
                Satellite
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Fullscreen Toggle */}
          {allowFullscreen && (
            <Button
              size="sm"
              variant="secondary"
              onClick={toggleFullscreen}
              className="bg-white hover:bg-gray-100 shadow-lg"
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          )}

          {/* Locate User */}
          <Button
            size="sm"
            variant="secondary"
            onClick={locateUser}
            className="bg-white hover:bg-gray-100 shadow-lg"
            title="Find my location"
          >
            <Locate className="h-4 w-4" />
          </Button>

          {/* Recenter */}
          <Button
            size="sm"
            variant="secondary"
            onClick={recenterMap}
            className="bg-white hover:bg-gray-100 shadow-lg"
            title="Recenter map"
          >
            <Navigation className="h-4 w-4" />
          </Button>
        </div>

        {/* Info Card - Top Left */}
        {!isFullscreen && (
          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs z-[1000]">
            <h3 className="font-semibold text-sm mb-1">{pgName}</h3>
            <p className="text-xs text-gray-600">{address}</p>
            {userLocation && (
              <p className="text-xs text-blue-600 mt-2">
                📍 Your location marked in blue
              </p>
            )}
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      {!isFullscreen && (
        <div className="bg-gray-50 border-t p-3 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={openInGoogleMaps}
            className="flex-1"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Google Maps
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={openInOpenStreetMap}
            className="flex-1"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            OpenStreetMap
          </Button>
          {showDirections && (
            <Button
              size="sm"
              onClick={getDirections}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Navigation className="h-4 w-4 mr-2" />
              Directions
            </Button>
          )}
        </div>
      )}
    </div>
  );
}