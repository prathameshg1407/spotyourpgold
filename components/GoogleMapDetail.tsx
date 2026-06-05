// components/GoogleMapDetail.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Loader2, ExternalLink, Navigation } from "lucide-react";
import { loadGoogleMaps, getGoogleMapsExternalUrl, getDirectionsUrl } from "@/lib/googleMaps";

interface Props {
  lat: number;
  lng: number;
  pgName: string;
  address?: string;
  showDirections?: boolean;
  className?: string;
}

export default function GoogleMapDetail({ 
  lat, 
  lng, 
  pgName, 
  address,
  showDirections = true,
  className = ""
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  const handleShowMap = async () => {
    if (loaded || loading) return;

    setLoading(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyAVclzWRArjC6F-08mT50hhX2gjeJlulkE";
      if (!apiKey) {
        throw new Error("Google Maps API key not configured");
      }

      await loadGoogleMaps(apiKey);
      setLoaded(true);
    } catch (err) {
      console.warn("Google Maps failed to load:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // Initialize map once loaded
  useEffect(() => {
    if (loaded && mapRef.current && !mapInstanceRef.current) {
      try {
        const map = new google.maps.Map(mapRef.current, {
          center: { lat, lng },
          zoom: 17,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
        });

        // Add marker
        new google.maps.Marker({
          position: { lat, lng },
          map: map,
          title: pgName,
          animation: google.maps.Animation.DROP,
        });

        // Add info window
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-weight: 600; font-size: 16px;">${pgName}</h3>
              ${address ? `<p style="margin: 0; color: #666; font-size: 14px;">${address}</p>` : ''}
            </div>
          `,
        });

        // Show info window on marker click
        const marker = new google.maps.Marker({
          position: { lat, lng },
          map: map,
          title: pgName,
        });

        marker.addListener("click", () => {
          infoWindow.open(map, marker);
        });

        mapInstanceRef.current = map;
      } catch (err) {
        console.error("Failed to initialize map:", err);
        setError(true);
      }
    }
  }, [loaded, lat, lng, pgName, address]);

  // Not loaded yet - show button
  if (!loaded && !error) {
    return (
      <div className={`w-full h-96 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-gray-300 gap-4 ${className}`}>
        <div className="text-center space-y-2">
          <p className="text-gray-600 font-medium">View precise location on Google Maps</p>
          <p className="text-sm text-gray-500">High-quality interactive map with street view</p>
        </div>
        <Button
          onClick={handleShowMap}
          disabled={loading}
          size="lg"
          className="bg-HG-500 hover:bg-HG-600 text-white shadow-lg hover:shadow-xl transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading Google Maps...
            </>
          ) : (
            <>
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              View on Google Maps
            </>
          )}
        </Button>
      </div>
    );
  }

  // Error state - show fallback
  if (error) {
    return (
      <div className={`w-full h-96 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl flex flex-col items-center justify-center gap-4 border-2 border-dashed border-red-200 p-6 ${className}`}>
        <div className="text-center space-y-2">
          <p className="text-red-600 font-semibold">Google Maps temporarily unavailable</p>
          <p className="text-sm text-gray-600">View this location directly on Google Maps</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            asChild
            variant="outline"
            className="border-HG-500 text-HG-600 hover:bg-HG-50"
          >
            <a
              href={getGoogleMapsExternalUrl(lat, lng, pgName)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open in Google Maps
            </a>
          </Button>
          {showDirections && (
            <Button
              asChild
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <a
                href={getDirectionsUrl(lat, lng)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Navigation className="mr-2 h-4 w-4" />
                Get Directions
              </a>
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Map loaded successfully
  return (
    <div className={`space-y-3 ${className}`}>
      <div 
        ref={mapRef} 
        className="w-full h-96 rounded-xl overflow-hidden shadow-lg border-2 border-gray-200"
      />
      
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          asChild
          variant="outline"
          className="flex-1 border-HG-500 text-HG-600 hover:bg-HG-50"
        >
          <a
            href={getGoogleMapsExternalUrl(lat, lng, pgName)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Open in Google Maps
          </a>
        </Button>
        
        {showDirections && (
          <Button
            asChild
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
          >
            <a
              href={getDirectionsUrl(lat, lng)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Navigation className="mr-2 h-4 w-4" />
              Get Directions
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}