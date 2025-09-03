"use client";
import FilterButton from "@/components/FilterButton";
import AdvancedFilter from "@/components/AdvancedFilter";
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
import { BlurImage } from "@/components/BlurImage";

import PgCard from "@/components/PgCard";
import { useAdvancedFilters, FilterState } from "@/hooks/useAdvancedFilters";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import DiscountSection from "@/components/DiscountSection";
import CategorySection from "@/components/CategorySection";

const Home = ({ page, per_page }: { page: number; per_page: number }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedSubType, setSelectedSubType] = useState("");

  const { isLoading, setContainerLoading } = useLoadingStore();

  const { userLocation, setUserLocation, locationDenied, setLocationDenied } =
    useListingStore();

  const [availableAd, setAvailableAd] = useState("");

  // State for different sections
  const [featuredPGs, setFeaturedListings] = useState<any[]>([]);
  const [allListings, setAllListings] = useState<any[]>([]);
  const [nearbyListings, setNearbyListings] = useState<any[]>([]);
  const [loading, setLoading] = useState({
    featured: false,
    all: false,
    nearby: false,
  });

  // Advanced filters hook
  const {
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    applyFilters,
    activeFiltersCount,
    listings: searchResults,
    loading: searchLoading,
    total: searchTotal,
    searchWithFilters,
  } = useAdvancedFilters(20, false);

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
  }, [setLocationDenied, setUserLocation]);

  const debouncedSearch = useDebouncedValue(searchQuery, 800);

  const handleTypeChange = (type: string, subType: string) => {
    setSelectedType(type);
    setSelectedSubType(subType);
    // Update advanced filters
    updateFilter("type", type);
    updateFilter("subType", subType);
  };

  // Handle search query changes
  useEffect(() => {
    console.log("Search query change:", {
      debouncedSearch,
      currentFilterQuery: filters.query,
      searchQuery,
    });
    if (debouncedSearch !== filters.query) {
      console.log("Updating filter query to:", debouncedSearch);
      updateFilter("query", debouncedSearch);
    }
  }, [debouncedSearch, filters.query, updateFilter, searchQuery]);

  // Update search query when filters change
  useEffect(() => {
    if (filters.query !== searchQuery) {
      setSearchQuery(filters.query);
    }
    if (filters.type !== selectedType) {
      setSelectedType(filters.type);
    }
    if (filters.subType !== selectedSubType) {
      setSelectedSubType(filters.subType);
    }
  }, [filters, searchQuery, selectedSubType, selectedType]);

  // Trigger search when filters have values
  useEffect(() => {
    const hasActiveSearch = filters.query || activeFiltersCount > 0;
    console.log("Search trigger check:", {
      query: filters.query,
      activeFiltersCount,
      hasActiveSearch,
    });
    if (hasActiveSearch) {
      console.log("Triggering search with filters:", filters);
      searchWithFilters();
    }
  }, [filters, activeFiltersCount, searchWithFilters]);

  // Fetch Featured Properties
  useEffect(() => {
    let ignore = false;
    setLoading((prev) => ({ ...prev, featured: true }));

    const fetchFeaturedData = async () => {
      try {
        const res = await axios.get(`/api/listing/getFeatured?per_page=5`);
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
        if (!ignore) setLoading((prev) => ({ ...prev, featured: false }));
      }
    };

    fetchFeaturedData();

    return () => {
      ignore = true;
    };
  }, []);

  // Fetch All Property Listings
  useEffect(() => {
    let ignore = false;
    setLoading((prev) => ({ ...prev, all: true }));

    const fetchAllData = async () => {
      try {
        const res = await axios.get(`/api/listing?page=1&per_page=5`);
        if (res?.data?.success && !ignore) {
          setAllListings(res.data.data);
        } else if (!ignore) {
          toast.error(res?.data?.message || "Something went wrong", {
            duration: 1500,
          });
        }
      } catch (error) {
        if (!ignore) {
          console.error("All listings fetch error", error);
          toast.error("Failed to fetch listings", { duration: 1500 });
        }
      } finally {
        if (!ignore) setLoading((prev) => ({ ...prev, all: false }));
      }
    };

    fetchAllData();

    return () => {
      ignore = true;
    };
  }, []);

  // Fetch Nearby PGs when location is available
  useEffect(() => {
    if (!userLocation || locationDenied) return;

    let ignore = false;
    setLoading((prev) => ({ ...prev, nearby: true }));

    const fetchNearbyData = async () => {
      try {
        const queryParams = new URLSearchParams({
          page: "1",
          per_page: "5",
          lat: userLocation.lat.toString(),
          lng: userLocation.lng.toString(),
        });

        const res = await axios.get(`/api/listing?${queryParams.toString()}`);
        if (res?.data?.success && !ignore) {
          setNearbyListings(res.data.data);
        } else if (!ignore) {
          toast.error(res?.data?.message || "Something went wrong", {
            duration: 1500,
          });
        }
      } catch (error) {
        if (!ignore) {
          console.error("Nearby listings fetch error", error);
          toast.error("Failed to fetch nearby listings", { duration: 1500 });
        }
      } finally {
        if (!ignore) setLoading((prev) => ({ ...prev, nearby: false }));
      }
    };

    fetchNearbyData();

    return () => {
      ignore = true;
    };
  }, [userLocation, locationDenied]);

  const column1Images = [
    { src: "/home/3.jpg", alt: "PG Property" },
    { src: "/home/4.jpg", alt: "Room Interior" },
    { src: "/home/5.jpg", alt: "Property View" },
    { src: "/home/6.jpg", alt: "Living Space" },
    { src: "/home/7.jpg", alt: "Modern Room" },
  ];

  const column2Images = [
    { src: "/home/8.jpg", alt: "Property Exterior" },
    { src: "/home/9.jpg", alt: "Common Area" },
    { src: "/home/10.jpg", alt: "Furnished Room" },
    { src: "/home/11.jpg", alt: "Building View" },
    { src: "/home/12.jpg", alt: "Room Setup" },
  ];

  const column3Images = [
    { src: "/home/13.jpg", alt: "Property Layout" },
    { src: "/home/14.jpg", alt: "Interior Design" },
    { src: "/home/15.jpg", alt: "Living Area" },
    { src: "/home/16.jpg", alt: "Property Feature" },
    { src: "/home/17.jpg", alt: "Room View" },
  ];

  // Remove a specific filter
  const removeFilter = (key: keyof FilterState, value?: string) => {
    if (
      key === "amenities" ||
      key === "roomTypes" ||
      key === "nearbyPlaces" ||
      key === "visible"
    ) {
      const currentArray = filters[key] as string[];
      updateFilter(
        key,
        currentArray.filter((item) => item !== value)
      );
    } else {
      updateFilter(key, "");
    }
  };

  // Check if there's an active search
  const hasActiveSearch =
    searchQuery || filters.query || activeFiltersCount > 0;

  return (
    <>
      <NavBar />

      {hasActiveSearch && (
        <section className="pt-32 md:pt-40 px-4 md:px-8 md:-mb-28">
          <div className="flex items-center justify-between mb-4">
            <SectionHeading>
              {searchQuery ? (
                <>
                  Searching For{" "}
                  <span className="text-HG-400 block mt-2 md:mt-0 md:inline-block">
                    {searchQuery}...
                  </span>
                </>
              ) : (
                "Filtered Results"
              )}
            </SectionHeading>
            <AdvancedFilter
              filters={filters}
              onFiltersChange={setFilters}
              onApplyFilters={applyFilters}
              onClearFilters={clearFilters}
              activeFiltersCount={activeFiltersCount}
            />
          </div>

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-gray-600">
                  Active Filters:
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs h-auto p-1 text-HG-500 hover:text-HG-600"
                >
                  Clear All
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {filters.type && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    Type: {filters.type}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => removeFilter("type")}
                    />
                  </Badge>
                )}
                {filters.genderPreference && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    Gender: {filters.genderPreference}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => removeFilter("genderPreference")}
                    />
                  </Badge>
                )}
                {(filters.minPrice || filters.maxPrice) && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    Price: ₹{filters.minPrice || "0"} - ₹
                    {filters.maxPrice || "∞"}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => {
                        removeFilter("minPrice");
                        removeFilter("maxPrice");
                      }}
                    />
                  </Badge>
                )}
                {filters.city && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    City: {filters.city}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => removeFilter("city")}
                    />
                  </Badge>
                )}
                {filters.area && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    Area: {filters.area}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => removeFilter("area")}
                    />
                  </Badge>
                )}
                {filters.amenities.map((amenity) => (
                  <Badge
                    key={amenity}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {amenity}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => removeFilter("amenities", amenity)}
                    />
                  </Badge>
                ))}
                {filters.roomTypes.map((roomType) => (
                  <Badge
                    key={roomType}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {roomType}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => removeFilter("roomTypes", roomType)}
                    />
                  </Badge>
                ))}
                {filters.visible.map((visible) => (
                  <Badge
                    key={visible}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {visible.charAt(0).toUpperCase() +
                      visible.slice(1).replace(/-/g, " ")}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => removeFilter("visible", visible)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {searchLoading ? (
            <div className="grid justify-center mt-10 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-5">
              {Array.from({ length: 10 }).map((_, idx) => (
                <Skeleton key={idx} />
              ))}
            </div>
          ) : searchResults.length > 0 ? (
            <>
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Found {searchTotal} properties
                </p>
              </div>
              <div className="grid justify-center mt-10 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-5">
                {searchResults.map((pg, idx) => (
                  <PgCard
                    key={pg._id || idx}
                    id={pg._id}
                    image={pg.primaryImage}
                    images={pg.images?.map((img: any) => img.url) || []}
                    area={pg.location?.area}
                    pgName={pg.pgName}
                    ownerName={pg.ownerId?.fullName}
                    price={pg.minRent}
                    genderPreference={pg.genderPreference}
                    isWishlisted={pg.inWatchList}
                    type={pg.type}
                  />
                ))}
              </div>
            </>
          ) : hasActiveSearch ? (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔍</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 font-poppins">
                  No properties found
                </h3>
                <p className="text-gray-600 font-inter mb-4">
                  Try adjusting your search criteria or filters to find more
                  properties.
                </p>
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="text-HG-500 border-HG-500 hover:bg-HG-50"
                >
                  Clear all filters
                </Button>
              </div>
            </div>
          ) : null}
        </section>
      )}

      <>
        <div className="md:px-8 px-4 pt-32 md:pt-32 space-y-10">
          {!hasActiveSearch && (
            <>
              {/* Hero Section */}
              <div className="w-full md:p-8 overflow-hidden mt-4 md:-mt-8">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  {/* Left Content - Text Only */}
                  <div className="space-y-6">
                    <h1 className="text-4xl lg:text-7xl font-Parisienne font-medium text-HG-400 ">
                      Searching for a place?
                      <br />
                      <span className="font-medium text-3xl md:text-6xl font-poppins">
                        We&apos;ve got you!
                      </span>
                    </h1>
                    <TextGenerateEffect
                      className="font-inter select-none md:tracking-wider font-medium text-[clamp(12px,4vw,18px)] md:text-lg text-gray-600"
                      words="Discover the perfect PG around you — filtered by comfort, budget, and location."
                      shouldAnimate={!isLoading}
                    />
                  </div>

                  {/* Right Image Animated Grid */}
                  <div className=" grid-cols-3 gap-4 h-[520px] relative hidden md:grid">
                    {/* Column 1 - Moving Down */}
                    <div className="relative overflow-hidden rounded-lg ">
                      <div className="animate-scroll-down space-y-4">
                        {/* Duplicate images for infinite scroll */}
                        {[
                          ...column1Images,
                          ...column1Images,
                          ...column1Images,
                        ].map((image, index) => (
                          <div
                            key={index}
                            className="bg-white rounded-xl overflow-hidden shadow-lg flex-shrink-0"
                          >
                            <BlurImage
                              src={image.src}
                              alt={image.alt}
                              width={250}
                              height={250}
                              className="w-[250px] h-[250px] object-cover"
                            />
                          </div>
                        ))}
                      </div>
                      {/* Top blur overlay */}
                      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-white via-gray-50/80 to-transparent backdrop-blur-sm z-10"></div>
                      {/* Bottom blur overlay */}
                      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white via-gray-50/80 to-transparent backdrop-blur-sm z-10"></div>
                    </div>

                    {/* Column 2 - Moving Up */}
                    <div className="relative overflow-hidden rounded-lg">
                      <div className="animate-scroll-up space-y-4">
                        {/* Teal accent block */}
                        <div className=" rounded-xl h-32 flex-shrink-0 shadow-lg"></div>
                        {/* Duplicate images for infinite scroll */}
                        {[
                          ...column2Images,
                          ...column2Images,
                          ...column2Images,
                        ].map((image, index) => (
                          <div
                            key={index}
                            className="bg-white rounded-xl overflow-hidden shadow-lg  flex-shrink-0"
                          >
                            <BlurImage
                              src={image.src}
                              alt={image.alt}
                              width={250}
                              height={250}
                              className="w-[250px] h-[250px] object-cover"
                            />
                          </div>
                        ))}
                        {/* Gray accent block */}
                        <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl h-24 flex-shrink-0 shadow-md"></div>
                      </div>
                      {/* Top blur overlay */}
                      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-white via-gray-50/80 to-transparent backdrop-blur-sm z-10"></div>
                      {/* Bottom blur overlay */}
                      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white via-gray-50/80 to-transparent backdrop-blur-sm z-10"></div>
                    </div>

                    {/* Column 3 - Moving Down */}
                    <div className="relative overflow-hidden rounded-lg">
                      <div className="animate-scroll-down-slow space-y-4">
                        {/* Duplicate images for infinite scroll */}
                        {[
                          ...column3Images,
                          ...column3Images,
                          ...column3Images,
                        ].map((image, index) => (
                          <div
                            key={index}
                            className="bg-white rounded-xl overflow-hidden shadow-lg  flex-shrink-0"
                          >
                            <BlurImage
                              src={image.src}
                              alt={image.alt}
                              width={250}
                              height={250}
                              className="w-[250px] h-[250px] object-cover"
                            />
                          </div>
                        ))}
                      </div>
                      {/* Top blur overlay */}
                      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-white via-gray-50/80 to-transparent backdrop-blur-sm z-10"></div>
                      {/* Bottom blur overlay */}
                      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white via-gray-50/80 to-transparent backdrop-blur-sm z-10"></div>
                    </div>
                  </div>
                </div>

                <style jsx>{`
                  @keyframes scroll-down {
                    0% {
                      transform: translateY(-50%);
                    }
                    100% {
                      transform: translateY(0%);
                    }
                  }

                  @keyframes scroll-up {
                    0% {
                      transform: translateY(0%);
                    }
                    100% {
                      transform: translateY(-50%);
                    }
                  }

                  @keyframes scroll-down-slow {
                    0% {
                      transform: translateY(-50%);
                    }
                    100% {
                      transform: translateY(0%);
                    }
                  }

                  .animate-scroll-down {
                    animation: scroll-down 20s linear infinite;
                  }

                  .animate-scroll-up {
                    animation: scroll-up 25s linear infinite;
                  }

                  .animate-scroll-down-slow {
                    animation: scroll-down-slow 30s linear infinite;
                  }
                `}</style>
              </div>

              {availableAd && (
                <span className="w-full h-14 rounded-2xl text-xs md:text-base border-2 border-dashed border-HG-400/40 bg-HG-400/10 flex justify-center items-center md:gap-3 gap-1 md:font-bold text-HG-500 font-inter md:tracking-wider px-2 text-center">
                  <IconPin className="w-4 h-4 md:w-5 md:h-5 inline-block" />
                  {availableAd}
                </span>
              )}

              {/* Advanced Filter Button */}
              {/* <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-2">
                    Find Your Perfect PG
                  </h2>
                  <p className="text-gray-600 text-sm md:text-base">
                    Use advanced filters to discover properties that match your
                    preferences
                  </p>
                </div>
                <AdvancedFilter
                  filters={filters}
                  onFiltersChange={setFilters}
                  onApplyFilters={applyFilters}
                  onClearFilters={clearFilters}
                  activeFiltersCount={activeFiltersCount}
                />
              </div> */}

              {/* Active Filters Display for Home Page */}
              {/* {activeFiltersCount > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-medium text-gray-600">
                      Active Filters:
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-xs h-auto p-1 text-HG-500 hover:text-HG-600"
                    >
                      Clear All
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {filters.type && (
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        Type: {filters.type}
                        <X
                          className="w-3 h-3 cursor-pointer"
                          onClick={() => removeFilter("type")}
                        />
                      </Badge>
                    )}
                    {filters.genderPreference && (
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        Gender: {filters.genderPreference}
                        <X
                          className="w-3 h-3 cursor-pointer"
                          onClick={() => removeFilter("genderPreference")}
                        />
                      </Badge>
                    )}
                    {(filters.minPrice || filters.maxPrice) && (
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        Price: ₹{filters.minPrice || "0"} - ₹
                        {filters.maxPrice || "∞"}
                        <X
                          className="w-3 h-3 cursor-pointer"
                          onClick={() => {
                            removeFilter("minPrice");
                            removeFilter("maxPrice");
                          }}
                        />
                      </Badge>
                    )}
                    {filters.city && (
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        City: {filters.city}
                        <X
                          className="w-3 h-3 cursor-pointer"
                          onClick={() => removeFilter("city")}
                        />
                      </Badge>
                    )}
                    {filters.area && (
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        Area: {filters.area}
                        <X
                          className="w-3 h-3 cursor-pointer"
                          onClick={() => removeFilter("area")}
                        />
                      </Badge>
                    )}
                    {filters.amenities.map((amenity) => (
                      <Badge
                        key={amenity}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {amenity}
                        <X
                          className="w-3 h-3 cursor-pointer"
                          onClick={() => removeFilter("amenities", amenity)}
                        />
                      </Badge>
                    ))}
                    {filters.roomTypes.map((roomType) => (
                      <Badge
                        key={roomType}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {roomType}
                        <X
                          className="w-3 h-3 cursor-pointer"
                          onClick={() => removeFilter("roomTypes", roomType)}
                        />
                      </Badge>
                    ))}
                    {filters.visible.map((visible) => (
                      <Badge
                        key={visible}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {visible.charAt(0).toUpperCase() +
                          visible.slice(1).replace(/-/g, " ")}
                        <X
                          className="w-3 h-3 cursor-pointer"
                          onClick={() => removeFilter("visible", visible)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )} */}

              {/* Category Section */}
              <CategorySection />

              {/* Section 1: Featured Properties */}
              <section>
                <SectionHeading
                  rightSide={
                    <Link
                      href={"/routes/featured-listings"}
                      className="flex items-center gap-2"
                    >
                      <p className="font-inter text-xs md:text-base text-HG-500">
                        View All
                      </p>
                      <IconArrowRight className="text-HG-500 w-4 h-4 md:w-5 md:h-5" />
                    </Link>
                  }
                >
                  Featured Properties
                </SectionHeading>

                {loading.featured ? (
                  <div className="grid justify-center mt-10 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-5">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Skeleton key={idx} />
                    ))}
                  </div>
                ) : (
                  <div className="grid justify-center mt-10 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-5">
                    {featuredPGs?.map((pg, idx) => (
                      <PgCard
                        key={idx}
                        id={pg?._id}
                        image={pg?.primaryImage}
                        images={pg?.images?.map((img: any) => img.url) || []}
                        area={pg?.location?.area}
                        pgName={pg?.pgName}
                        ownerName={pg?.ownerId?.fullName}
                        price={pg?.minRent}
                        genderPreference={pg?.genderPreference}
                        isWishlisted={pg?.inWatchList}
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* Discount Section */}
              <DiscountSection />

              {/* Section 2: Property Listings */}
              <section>
                <SectionHeading
                  rightSide={
                    <Link
                      href={"/routes/all-listings"}
                      className="flex items-center gap-2"
                    >
                      <p className="font-inter text-xs md:text-base text-HG-500">
                        View All
                      </p>
                      <IconArrowRight className="text-HG-500 w-4 h-4 md:w-5 md:h-5" />
                    </Link>
                  }
                >
                  Property Listings
                </SectionHeading>

                {loading.all ? (
                  <div className="grid justify-center mt-10 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-5">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Skeleton key={idx} />
                    ))}
                  </div>
                ) : (
                  <div className="grid justify-center mt-10 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-5">
                    {allListings?.map((pg, idx) => (
                      <PgCard
                        key={idx}
                        id={pg?._id}
                        image={pg?.primaryImage}
                        images={pg?.images?.map((img: any) => img.url) || []}
                        area={pg?.location?.area}
                        pgName={pg?.pgName}
                        ownerName={pg?.ownerId?.fullName}
                        price={pg?.minRent}
                        genderPreference={pg?.genderPreference}
                        isWishlisted={pg?.inWatchList}
                        type={pg?.type}
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* Section 3: PG Near Me - Only show if location is available */}
              {userLocation && !locationDenied && (
                <section className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 md:p-8 border border-blue-100">
                  <SectionHeading
                    rightSide={
                      <Link
                        href="/routes/nearbypg-map"
                        className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-all duration-200 border border-blue-200 hover:border-blue-300"
                      >
                        <svg
                          className="w-4 h-4 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7"
                          />
                        </svg>
                        <p className="font-inter text-sm md:text-base text-blue-600 font-medium">
                          View on Maps
                        </p>
                        <IconArrowRight className="text-blue-600 w-4 h-4 md:w-5 md:h-5" />
                      </Link>
                    }
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </div>
                      <span className="md:text-3xl font-medium font-poppins text-gray-800">
                        PG&apos;s Near You
                      </span>
                    </div>
                  </SectionHeading>

                  {loading.nearby ? (
                    <div className="grid justify-center mt-10 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-5">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Skeleton key={idx} />
                      ))}
                    </div>
                  ) : (
                    <div className="grid justify-center mt-10 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-5">
                      {nearbyListings?.map((pg, idx) => (
                        <PgCard
                          key={idx}
                          id={pg?._id}
                          image={pg?.primaryImage}
                          images={pg?.images?.map((img: any) => img.url) || []}
                          area={pg?.location?.area}
                          pgName={pg?.pgName}
                          ownerName={pg?.ownerId?.fullName}
                          price={pg?.minRent}
                          genderPreference={pg?.genderPreference}
                          isWishlisted={pg?.inWatchList}
                          type={pg?.type}
                        />
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Location denied message */}
              {locationDenied && (
                <div className="mt-4 p-4 flex justify-between items-center border border-yellow-300 bg-yellow-50 rounded-xl text-sm text-yellow-800 font-inter ">
                  <p>
                    ⚠️ We couldn&apos;t access your location. Enable location
                    access to see nearby PGs.
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
            </>
          )}
        </div>
      </>
    </>
  );
};

export default Home;
