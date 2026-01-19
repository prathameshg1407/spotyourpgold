// components/maps/MapWrapper.tsx
"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const PGMapWithDistance = dynamic(() => import("./PGMapWithDistance"), {
  loading: () => (
    <div className="w-full h-[400px] rounded-lg border bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
        <p className="text-sm text-gray-600">Loading map...</p>
      </div>
    </div>
  ),
  ssr: false,
});

interface MapWrapperProps {
  lat: number;
  lng: number;
  pgName: string;
  address: string;
}

export default function MapWrapper(props: MapWrapperProps) {
  return <PGMapWithDistance {...props} />;
}