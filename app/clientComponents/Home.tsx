"use client";
import FilterButton from "@/components/FilterButton";
import NavBar from "@/components/NavBar";
import SectionHeading from "@/components/SectionHeading";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { IconArrowRight, IconPin } from "@tabler/icons-react";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { FeaturedCarousel } from "@/components/FeaturedCarousel";
import GradientText from "@/components/gradient-text";
import HomeContainer from "./HomeContainer";
import { useLoadingStore } from "@/store/loading";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Skeleton from "@/components/Skeleton";
import { Button } from "@/components/ui/button";
import { useListingStore } from "@/store/listingStore";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const Home = ({ page, per_page }: { page: number; per_page: number }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const { isLoading, setContainerLoading } = useLoadingStore();

  const { userLocation, setUserLocation, locationDenied, setLocationDenied } =
    useListingStore();

  const [availableAd, setAvailableAd] = useState("");

  useEffect(() => {
    const fetchAd = async () => {
      try {
        const res = await axios.get("/api/admin/ad");
        if (res?.data?.success) {
          setAvailableAd(res.data.data.title);
        }
      } catch (error) {
        toast.error("Something went wrong");
      }
    };

    fetchAd();
  }, []);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (err) => {
          console.warn("Geolocation denied or unavailable", err);
          setLocationDenied(true);
        }
      );
    } else {
      setLocationDenied(true);
    }
  }, []);

  const debouncedSearch = useDebouncedValue(searchQuery, 800);
  const { setListings } = useListingStore();

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!debouncedSearch.trim()) return;
        setContainerLoading("homeContainer", true);

      try {
        const res = await axios.get(
          `/api/listing/search?q=${debouncedSearch}&page=1&per_page=20`
        );
        // console.log(res);
        if (res?.data?.success) {
          setListings(res.data.data); // ✅ used by HomeContainer
        } else {
          toast.error("Search failed");
        }
      } catch (error) {
        toast.error("Something went wrong");
      }finally {
        setContainerLoading("homeContainer", false);
      }
    };

    fetchSearchResults();
  }, [debouncedSearch]);


    const [featuredPGs, setFeaturedListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);


    useEffect(() => {
    let ignore = false;
    setLoading(true);

    const fetchData = async () => {
      try {
        const res = await axios.get(`/api/listing/getFeatured`);
        if (res?.data?.success && !ignore) {
          setFeaturedListings(res.data.data);
        } else if (!ignore) {
          toast.error(res?.data?.message || "Something went wrong", {
            duration: 1500,
          });
        }
      } catch (error) {
        if (!ignore) {
          console.error("Featured fetch error", error);
          toast.error("Failed to fetch featured listings", { duration: 1500 });
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchData();

    return () => {
      ignore = true;
    };
  }, []);



  return (
    <>
      <NavBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {searchQuery && (
        <section className="pt-36 md:pt-40 px-4 md:px-8 md:-mb-28">
          <SectionHeading >
          {/* <SectionHeading rightSide={<FilterButton />}> */}
            Searching For{" "}
            <span className="text-HG-400 block mt-2 md:mt-0 md:inline-block ">
              {searchQuery}...
            </span>
          </SectionHeading>
        </section>
      )}
      <>
        <div className="md:px-8 px-4 mt-32 md:mt-40 space-y-10">
          {!searchQuery && (
            <>
              <div className="flex flex-col items-center font-poppins mb-10 md:mb-20">
                <GradientText
                  className="text-[clamp(40px,10vw,80px)] md:text-[80px] leading-tight font-semibold select-none"
                  element="H1"
                >
                  SPOT YOUR PG
                </GradientText>

                <TextGenerateEffect
                  className="font-inter select-none text-center md:tracking-wider font-medium text-[clamp(12px,4vw,18px)] md:text-lg text-gray-600"
                  words="Discover the perfect PG around you — filtered by comfort, budget, and location."
                  shouldAnimate={!isLoading}
                />
              </div>

              {availableAd && (
                <span className="w-full h-14 rounded-2xl text-xs md:text-base border-2 border-dashed border-HG-400/40 bg-HG-400/10 flex justify-center items-center md:gap-3 gap-1 md:font-bold text-HG-500 font-inter md:tracking-wider px-2 text-center">
                  <IconPin className="w-4 h-4 md:w-5 md:h-5 inline-block" />
                  {availableAd}
                </span>
              )}

              <section>
                <SectionHeading
                  // rightSide={
                  //   <Link
                  //     href={"/featured-listings"}
                  //     className="flex items-center gap-2"
                  //   >
                  //     <p className="font-inter text-xs md:text-base text-HG-500">
                  //       View All
                  //     </p>
                  //     <IconArrowRight className="text-HG-500 w-4 h-4 md:w-5 md:h-5" />
                  //   </Link>
                  // }
                >
                  Featured PG&apos;s
                </SectionHeading>

                <FeaturedCarousel loading={loading} pgs={featuredPGs} />
              </section>
            </>
          )}

          <section>
            <SectionHeading
              rightSide={
                userLocation &&
                !searchQuery && (
                  <Link
                    href="/routes/nearbypg-map"
                    className="flex items-center gap-2"
                  >
                    <p className="font-inter text-xs md:text-base text-HG-500">
                      View On Map
                    </p>
                    <IconArrowRight className="text-HG-500 w-4 h-4 md:w-5 md:h-5" />
                  </Link>
                )
              }
            >
              {!searchQuery
                ? userLocation
                  ? "PG's Near You"
                  : locationDenied
                  ? "Latest PG's"
                  : "Finding PG's Near You..."
                : ""}
            </SectionHeading>

            {locationDenied && (
              <div className="mt-4 p-4 flex justify-between items-center border border-yellow-300 bg-yellow-50 rounded-xl text-sm text-yellow-800 font-inter ">
                <p>
                  ⚠️ We couldn&apos;t access your location. Showing latest PGs
                  instead. You can allow location access for a better
                  experience.
                </p>

                <Button
                  onClick={() => {
                    if ("geolocation" in navigator) {
                      navigator.geolocation.getCurrentPosition(
                        (position) => {
                          setUserLocation({
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                          });
                          setLocationDenied(false);
                        },
                        (err) => {
                          console.warn("Permission still denied", err);
                          setLocationDenied(true);
                        }
                      );
                    }
                  }}
                  className=""
                >
                  Retry Location Access
                </Button>
              </div>
            )}

            <Suspense fallback={<Skeleton />}>
              <HomeContainer
                searchQuery={searchQuery}
                page={page}
                per_page={per_page}
                userLocation={userLocation}
                locationDenied={locationDenied}
              />
            </Suspense>
          </section>
        </div>
      </>
    </>
  );
};

export default Home;
