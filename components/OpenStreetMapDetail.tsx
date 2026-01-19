// components/OpenStreetMapDetail.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ExternalLink, Navigation, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Fix Leaflet default marker icons in Next.js
const fixLeafletIcons = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
};

// Custom red marker icon
const customIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface OpenStreetMapDetailProps {
  lat: number;
  lng: number;
  pgName: string;
  address: string;
  showDirections?: boolean;
}

// Component to recenter map when coordinates change
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);

  return null;
}

export default function OpenStreetMapDetail({
  lat,
  lng,
  pgName,
  address,
  showDirections = true,
}: OpenStreetMapDetailProps) {
  const [isClient, setIsClient] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    setIsClient(true);
    fixLeafletIcons();
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
    // Opens in Google Maps on mobile/desktop
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
      "_blank"
    );
  };

  const recenterMap = () => {
    if (mapRef.current) {
      mapRef.current.setView(position, 16);
    }
  };

  if (!isClient) {
    return (
      <div className="w-full h-[400px] rounded-lg overflow-hidden border bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading map...</div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg overflow-hidden border relative">
      <div className="h-[400px] relative">
        <MapContainer
          center={position}
          zoom={16}
          scrollWheelZoom={false}
          className="h-full w-full"
          ref={mapRef}
        >
          {/* OSM Tiles - Multiple options available */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Alternative tile options (uncomment to use): */}
          {/* CartoDB Positron (lighter) */}
          {/* <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
          /> */}

          {/* CartoDB Dark Matter (dark theme) */}
          {/* <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
          /> */}

          <Marker position={position} icon={customIcon}>
            <Popup>
              <div className="text-center p-2">
                <strong className="text-base block mb-1">{pgName}</strong>
                <p className="text-sm text-gray-600 mb-2">{address}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={getDirections}
                  className="w-full"
                >
                  <Navigation className="h-3 w-3 mr-2" />
                  Get Directions
                </Button>
              </div>
            </Popup>
          </Marker>

          <RecenterMap lat={lat} lng={lng} />
        </MapContainer>

        {/* Floating Action Buttons */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-[1000]">
          <Button
            size="sm"
            variant="secondary"
            onClick={recenterMap}
            className="bg-white hover:bg-gray-100 shadow-lg"
            title="Recenter map"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={openInOpenStreetMap}
            className="bg-white hover:bg-gray-100 shadow-lg"
            title="Open in OpenStreetMap"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          {showDirections && (
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 shadow-lg text-white"
              onClick={getDirections}
              title="Get directions"
            >
              <Navigation className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Info Card */}
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs z-[1000]">
          <h3 className="font-semibold text-sm mb-1">{pgName}</h3>
          <p className="text-xs text-gray-600">{address}</p>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="bg-gray-50 border-t p-3 flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={openInGoogleMaps}
          className="flex-1"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Open in Google Maps
        </Button>
        {showDirections && (
          <Button
            size="sm"
            onClick={getDirections}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Navigation className="h-4 w-4 mr-2" />
            Get Directions
          </Button>
        )}
      </div>
    </div>
  );
}