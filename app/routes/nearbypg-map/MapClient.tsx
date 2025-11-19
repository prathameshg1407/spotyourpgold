"use client";
import React from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { IconArrowUpRight } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useListingStore } from "@/store/listingStore";
import { useLoadingStore } from "@/store/loading";
import axios from "axios";
import { toast } from "sonner";
import { BlurImage } from "@/components/BlurImage";

// Fix marker icon issue with Leaflet in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "/marker-icon.png",
  iconRetinaUrl: "/marker-icon-2x.png",
  shadowUrl: "/marker-shadow.png",
});

type PGData = {
  id: string;
  pgName: string;
  monthlyRent: number;
  genderPreference: string;
  lat: number;
  lng: number;
  ownerName: string;
};

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});

const MapClient = () => {
  const router = useRouter();

  const { userLocation, setUserLocation, locationDenied, setLocationDenied } =
    useListingStore();

  const { setLoading } = useLoadingStore();

  const page = 1;
  const per_page = 20;

  const [listings, setListings] = useState<any[]>([]);

  useEffect(() => {
    if (userLocation || locationDenied) return;

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (err) => {
          setLocationDenied(true);
        }
      );
    } else {
      setLocationDenied(true);
    }
  }, [userLocation, locationDenied, setLocationDenied, setUserLocation]);

  useEffect(() => {
    if (locationDenied) {
      router.replace("/");
    }
  }, [locationDenied, router]);

  useEffect(() => {
    if (!userLocation || locationDenied) return;

    let ignore = false;
    const fetchData = async () => {
      setLoading(true);

      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          per_page: per_page.toString(),
          lat: userLocation.lat.toString(),
          lng: userLocation.lng.toString(),
        });

        const res = await axios.get(`/api/listing?${queryParams.toString()}`);
        // console.log("res", res);

        if (res?.data?.success && !ignore) {
          setListings(res.data.data);
        } else if (!ignore) {
          toast.error(res.data?.message || "Something went wrong");
          router.replace("/not-found");
        }
      } catch (error) {
        if (!ignore) {
          toast.error("Failed to fetch PG listings");
          router.replace("/not-found");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchData();

    return () => {
      ignore = true;
    };
  }, [userLocation, locationDenied, router, setLoading]);

  return (
    <>
      <MapContainer
        center={[userLocation?.lat || 28.6139, userLocation?.lng || 77.209]}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {listings?.map((pg, idx) => (
          <Marker
            key={idx}
            position={[
              pg?.location?.coordinates?.coordinates[1],
              pg?.location?.coordinates?.coordinates[0],
            ]}
          >
            <Popup closeButton={true} className="custom-popup">
              <div
                onClick={() => {
                  router.push(`/routes/pg-details/${pg?._id}`);
                }}
                className="bg-dark-charcoal cursor-pointer select-none border-4 border-outline rounded-lg border-opacity-15 overflow-hidden w-full hover:border-opacity-50 transition-colors duration-150 ease-in group  min-w-[200px] max-w-[300px] "
              >
                <div className=" flex relative items-center justify-center   rounded-b-2xl">
                  <div className="w-full h-32 bg-gray-100 overflow-hidden ">
                    <BlurImage
                      className="object-cover w-full"
                      src={pg?.primaryImage || "/placeholder.jpg"}
                      width={400}
                      height={440}
                      alt={pg?.pgName}
                    />
                  </div>

                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800/70 bg-opacity-25 p-1 rounded backdrop-blur-2xl">
                    <IconArrowUpRight className="  text-white  w-4 h-4 " />
                  </div>
                </div>

                <div className="px-4 font-inter relative py-2 max-w-[300px] w-full overflow-hidden">
                  <h5 className="text-lg font-medium text-HG-900 dark:text-white truncate w-[200px]">
                    {pg?.pgName}
                  </h5>
                  <div className="text-xs  uppercase text-gray-400 dark:text-gray-400">
                    {pg?.genderPreference}
                  </div>

                  <p className="text-sm text-gray-500">
                    by {pg?.ownerId?.fullName}
                  </p>

                  <h5 className="text-xl font-bold  text-HG-400  ">
                    {pg?.minRent?.toLocaleString()}
                  </h5>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <style jsx global>{`
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1),
            0 4px 6px -4px rgb(0 0 0 / 0.1);
          border: 1px solid hsl(var(--border));
          padding: 0;
        }

        .leaflet-popup-content {
          margin: 0;
          padding: 0;
          width: auto !important;
        }

        .leaflet-popup-tip {
          background: hsl(var(--background));
          border: 1px solid hsl(var(--border));
          border-top: none;
          border-right: none;
        }

        .custom-popup .leaflet-popup-close-button {
          top: 8px;
          right: 8px;
          font-size: 18px;
          color: hsl(var(--muted-foreground));
        }

        .custom-popup .leaflet-popup-close-button:hover {
          color: hsl(var(--foreground));
        }
      `}</style>
    </>
  );
};

export default MapClient;
