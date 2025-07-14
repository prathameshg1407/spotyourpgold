"use client";
import PaginationControls from "@/components/PaginationControls";
import PgCard from "@/components/PgCard";
import Skeleton from "@/components/Skeleton";
import { useListingStore } from "@/store/listingStore";
import { useLoadingStore } from "@/store/loading";
import axios from "axios";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

const HomeContainer = ({
  page = 1,
  per_page = 20,
  userLocation,
  locationDenied,
  searchQuery = "",
}: {
  page: number;
  per_page: number;
  userLocation: { lat: number; lng: number } | null;
  locationDenied: boolean;
  searchQuery?: string;
}) => {
  const { containerLoading, setContainerLoading } = useLoadingStore();
  const [total, setTotal] = useState(0);
  // const [listings, setListings] = useState<any[]>([]);

  const { listings, setListings } = useListingStore();

  const router = useRouter();

  useEffect(() => {
    if (searchQuery) return;

    if (!userLocation && !locationDenied) return; // wait

    let ignore = false;
    setContainerLoading("homeContainer", true);

    const fetchData = async () => {
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          per_page: per_page.toString(),
        });

        if (userLocation && !locationDenied) {
          queryParams.append("lat", userLocation.lat.toString());
          queryParams.append("lng", userLocation.lng.toString());
        }

        const res = await axios.get(`/api/listing?${queryParams.toString()}`);

        // console.log("res", res);

        if (res?.data?.success && !ignore) {
          setListings(res?.data?.data);
          setTotal(res?.data?.total);
        } else if (!ignore) {
          toast.error(res?.data?.message || "Something went wrong", {
            duration: 1500,
          });
          router.replace("/not-found");
        }
      } catch (error) {
        if (!ignore) {
          console.error("listing fetch error", error);
          toast.error("Failed to fetch PG listings", { duration: 1500 });
          router.replace("/not-found");
        }
      } finally {
        if (!ignore) setContainerLoading("homeContainer", false);
      }
    };

    fetchData();

    return () => {
      ignore = true;
    };
  }, [
    page,
    per_page,
    userLocation,
    locationDenied,
    setContainerLoading,
    router,
    searchQuery,
    setListings,
  ]);

  if (containerLoading.homeContainer) {
    return (
      <>
        <div className="grid justify-center mt-10 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-5">
          {Array.from({ length: 20 }).map((pg, idx) => (
            <Skeleton key={idx} />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="grid justify-center mt-10 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-5">
        {listings?.map((pg, idx) => (
          <PgCard
            key={idx}
            id={pg?._id}
            image={pg?.primaryImage}
            area={pg?.location?.area}
            pgName={pg?.pgName}
            ownerName={pg?.ownerId?.fullName}
            price={pg?.minRent}
            isWishlisted={pg?.inWatchList}
          />
        ))}
      </div>

      <PaginationControls
        page={page}
        per_page={per_page}
        hasNextPage={page * per_page < total}
        hasPrevPage={page > 1}
        total={total}
      />
    </>
  );
};

export default HomeContainer;
