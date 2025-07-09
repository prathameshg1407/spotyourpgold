"use client";

import { usePathname } from "next/navigation";
import { Dock } from "./Dock";

export const DockWrapper = () => {
  const pathname = usePathname();
  const isNoDockRoute = [
    "/routes/dashboard",
    "/routes/auth",
    "/routes/owners",
    "/routes/pg-details",
    "/routes/nearbypg-map",
    
  ].some((path) => pathname?.startsWith(path));

  if (isNoDockRoute) return null;

  return (
    <div className="fixed bottom-40 z-50 md:bottom-10 md:left-1/2 md:-translate-x-1/2">
      <Dock />
    </div>
  );
};
