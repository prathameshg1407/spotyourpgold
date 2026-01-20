"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";
import { toast } from "sonner";
import PgCard from "@/components/PgCard";
import SectionHeading from "@/components/SectionHeading";
import AdvancedFilter from "@/components/AdvancedFilter";
import LocationCategoryFilter from "@/components/LocationCategoryFilter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  X,
  MapPin,
  Navigation,
} from "lucide-react";
import Skeleton from "@/components/Skeleton";
import { useAdvancedFilters, FilterState } from "@/hooks/useAdvancedFilters";
import { useLocationSearch } from "@/hooks/useLocationSearch";

function AllListingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // State for nearby listings (bypassing advanced filter)
  const [nearbyListings, setNearbyListings] = useState<any[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyTotal, setNearbyTotal] = useState(0);
  const [nearbyCurrentPage, setNearbyCurrentPage] = useState(1);
  const [nearbyTotalPages, setNearbyTotalPages] = useState(0);

  // State for category listings (bypassing advanced filter)
  const [categoryListings, setCategoryListings] = useState<any[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryTotal, setCategoryTotal] = useState(0);
  const [categoryCurrentPage, setCategoryCurrentPage] = useState(1);
  const [categoryTotalPages, setCategoryTotalPages] = useState(0);
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);

  // State for user location
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);

  // State for category filtering in location-based search
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>(
    {}
  );

  // Check if this is a nearby search
  const isNearbySearch = searchParams.get("nearby") === "true";
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  // Check if this is a category search
  const category = searchParams.get("category");
  const isCategorySearch = !!category;

  // Use advanced filters hook with pagination (autoSearch disabled for better control)
  const {
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    applyFilters,
    activeFiltersCount,
    listings,
    loading,
    total,
    totalPages,
    currentPage,
    searchWithFilters,
  } = useAdvancedFilters(8, false); // Disable autoSearch for manual control

  // Use location search hook
  const {
    userLocation: locationSearchUserLocation,
    searchLocation,
    locationDenied: locationSearchDenied,
  } = useLocationSearch();

  // Check if advanced filters are applied (for category searches with filters)
  const hasAdvancedFilters = activeFiltersCount > 0;
  const isCategorySearchWithFilters = isCategorySearch && hasAdvancedFilters;

  const goBack = () => {
    router.back();
  };

  // Get user location on component mount
  useEffect(() => {
    if ("geolocation" in navigator && !lat && !lng) {
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
    } else if (lat && lng) {
      // Use location from URL parameters
      setUserLocation({
        lat: parseFloat(lat),
        lng: parseFloat(lng),
      });
    } else {
      setLocationDenied(true);
    }
  }, [lat, lng]);

  // Function to fetch nearby listings (bypassing advanced filter)
  const fetchNearbyListings = useCallback(
    async (page: number = 1) => {
      if (!lat || !lng) return;

      setNearbyLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          per_page: "12",
          lat: lat,
          lng: lng,
        });

        const res = await axios.get(`/api/listing?${queryParams.toString()}`);
        if (res?.data?.success) {
          setNearbyListings(res.data.data);
          setNearbyTotal(res.data.total);
          // Calculate total pages manually if not provided by API
          const totalPages =
            res.data.totalPages || Math.ceil(res.data.total / 12);
          setNearbyTotalPages(totalPages);
          setNearbyCurrentPage(page);
        } else {
          toast.error(res?.data?.message || "Something went wrong");
        }
      } catch (error) {
        toast.error("Failed to fetch nearby listings");
      } finally {
        setNearbyLoading(false);
      }
    },
    [lat, lng]
  );

  // Function to fetch category listings with advanced filters
  const fetchCategoryListings = useCallback(
    async (page: number = 1, appliedFilters?: FilterState) => {
      if (!category) return;

      setCategoryLoading(true);
      try {
        const queryParams = new URLSearchParams({
          category: category,
          page: page.toString(),
          per_page: "12",
        });

        // Add location if available
        if (userLocation) {
          queryParams.set("lat", userLocation.lat.toString());
          queryParams.set("lng", userLocation.lng.toString());
        }

        // Add advanced filters if provided
        const filtersToApply = appliedFilters || filters;
        if (filtersToApply.query) queryParams.set("q", filtersToApply.query);
        if (filtersToApply.subType)
          queryParams.set("subType", filtersToApply.subType);
        if (filtersToApply.minPrice)
          queryParams.set("minPrice", filtersToApply.minPrice.toString());
        if (filtersToApply.maxPrice)
          queryParams.set("maxPrice", filtersToApply.maxPrice.toString());
        if (filtersToApply.genderPreference)
          queryParams.set("genderPreference", filtersToApply.genderPreference);
        if (filtersToApply.amenities.length > 0)
          queryParams.set("amenities", filtersToApply.amenities.join(","));
        if (filtersToApply.roomTypes.length > 0)
          queryParams.set("roomTypes", filtersToApply.roomTypes.join(","));
        if (filtersToApply.nearbyPlaces.length > 0)
          queryParams.set(
            "nearbyPlaces",
            filtersToApply.nearbyPlaces.join(",")
          );

        const res = await axios.get(
          `/api/listing/category?${queryParams.toString()}`
        );
        if (res?.data?.success) {
          setCategoryListings(res.data.data);
          setCategoryTotal(res.data.total);
          setCategoryTotalPages(
            res.data.totalPages || Math.ceil(res.data.total / 12)
          );
          setCategoryCurrentPage(page);
          setCurrentCategory(category);
        } else {
          toast.error(res?.data?.message || "Something went wrong");
        }
      } catch (error) {
        toast.error("Failed to fetch category listings");
      } finally {
        setCategoryLoading(false);
      }
    },
    [category, userLocation, filters]
  );

  // Function to fetch category counts for location-based search
  const fetchCategoryCounts = useCallback(async () => {
    if (!lat || !lng) return;

    try {
      const queryParams = new URLSearchParams({
        lat: lat,
        lng: lng,
        radius: "10",
        countByCategory: "true",
      });

      const res = await axios.get(
        `/api/listing/search?${queryParams.toString()}`
      );
      if (res?.data?.success && res.data.categoryCounts) {
        setCategoryCounts(res.data.categoryCounts);
      }
    } catch (error) {
    }
  }, [lat, lng]);

  // Function to fetch filtered listings by category in location
  const fetchLocationCategoryListings = useCallback(
    async (page: number = 1) => {
      if (!lat || !lng) return;

      setCategoryLoading(true);
      try {
        const queryParams = new URLSearchParams({
          lat: lat,
          lng: lng,
          radius: "10",
          page: page.toString(),
          per_page: "12",
        });

        // Add selected categories
        if (selectedCategories.length > 0) {
          queryParams.set("categories", selectedCategories.join(","));
        }

        const res = await axios.get(
          `/api/listing/search?${queryParams.toString()}`
        );
        if (res?.data?.success) {
          setCategoryListings(res.data.data);
          setCategoryTotal(res.data.total);
          setCategoryTotalPages(
            res.data.totalPages || Math.ceil(res.data.total / 12)
          );
          setCategoryCurrentPage(page);
        } else {
          toast.error(res?.data?.message || "Something went wrong");
        }
      } catch (error) {
        toast.error("Failed to fetch listings");
      } finally {
        setCategoryLoading(false);
      }
    },
    [lat, lng, selectedCategories]
  );

  const handleNearbyPageChange = (page: number) => {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("page", page.toString());
    router.push(`?${searchParams.toString()}`);
  };

  const handleCategoryPageChange = (page: number) => {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("page", page.toString());
    router.push(`?${searchParams.toString()}`);
  };

  const handlePageChange = (page: number) => {
    // Build URL with current filters and new page
    const searchParams = new URLSearchParams();

    // Add current filter parameters to URL
    if (filters.query) searchParams.set("q", filters.query);
    if (filters.type) searchParams.set("type", filters.type);
    if (filters.subType) searchParams.set("subType", filters.subType);
    if (filters.minPrice) searchParams.set("minPrice", filters.minPrice);
    if (filters.maxPrice) searchParams.set("maxPrice", filters.maxPrice);
    if (filters.genderPreference)
      searchParams.set("genderPreference", filters.genderPreference);
    if (filters.amenities.length > 0)
      searchParams.set("amenities", filters.amenities.join(","));
    if (filters.roomTypes.length > 0)
      searchParams.set("roomTypes", filters.roomTypes.join(","));
    if (filters.nearbyPlaces.length > 0)
      searchParams.set("nearbyPlaces", filters.nearbyPlaces.join(","));
    if (filters.visible.length > 0)
      searchParams.set("visible", filters.visible.join(","));
    if (filters.sortBy) searchParams.set("sortBy", filters.sortBy);
    if (userLocation) {
      searchParams.set("lat", userLocation.lat.toString());
      searchParams.set("lng", userLocation.lng.toString());
    }

    // Set the new page
    searchParams.set("page", page.toString());

    // Update URL
    router.push(`?${searchParams.toString()}`);

    // Trigger search with current filters when page changes
    const locationParams = userLocation
      ? {
          lat: userLocation.lat.toString(),
          lng: userLocation.lng.toString(),
        }
      : {};
    searchWithFilters({ ...filters, ...locationParams }, true);
  };

  // Remove a specific filter
  const removeFilter = (key: keyof FilterState, value?: string) => {
    if (key === "amenities" || key === "roomTypes" || key === "nearbyPlaces") {
      const currentArray = filters[key] as string[];
      const newArray = currentArray.filter((item) => item !== value);
      updateFilter(key, newArray);
    } else {
      updateFilter(key, "");
    }
  };

  // Handle category from URL params
  useEffect(() => {
    const category = searchParams.get("category");
    if (category && category !== filters.type) {
      updateFilter("type", category);
    }
  }, [searchParams, updateFilter, filters.type]);

  // Trigger search when filters change (especially for category)
  useEffect(() => {
    if (initialLoadDone && !isNearbySearch) {
      const hasFilters = Object.values(filters).some((value) => {
        if (Array.isArray(value)) return value.length > 0;
        return value !== "";
      });

      const locationParams = userLocation
        ? {
            lat: userLocation.lat.toString(),
            lng: userLocation.lng.toString(),
          }
        : {};

      if (hasFilters) {
        searchWithFilters(locationParams);
      } else {
        searchWithFilters(locationParams, true);
      }
    }
  }, [
    filters,
    initialLoadDone,
    isNearbySearch,
    userLocation,
    searchWithFilters,
  ]);

  // Initial load - fetch listings based on URL parameters
  useEffect(() => {
    if (!initialLoadDone) {
      if (isNearbySearch && lat && lng) {
        // Fetch nearby listings (bypass advanced filter)
        fetchNearbyListings(1);
        // Also fetch category counts for filtering
        fetchCategoryCounts();
      } else if (isCategorySearch && category) {
        // Fetch category listings (bypass advanced filter)
        fetchCategoryListings(1);
      }
      setInitialLoadDone(true);
    }
  }, [
    initialLoadDone,
    isNearbySearch,
    isCategorySearch,
    lat,
    lng,
    category,
    fetchNearbyListings,
    fetchCategoryListings,
    fetchCategoryCounts,
  ]);

  // Fetch location category listings when categories change
  useEffect(() => {
    if (isNearbySearch && lat && lng) {
      // Fetch whenever categories change, even if empty (to show all listings)
      if (selectedCategories.length > 0) {
        fetchLocationCategoryListings(1);
      } else {
        // When no categories selected, fetch nearby listings instead
        fetchNearbyListings(1);
      }
    }
  }, [
    isNearbySearch,
    lat,
    lng,
    selectedCategories,
    fetchLocationCategoryListings,
    fetchNearbyListings,
  ]);

  // Handle page changes
  useEffect(() => {
    if (initialLoadDone) {
      const page = searchParams.get("page");
      if (page) {
        if (isNearbySearch && lat && lng) {
          // Handle nearby search page changes
          fetchNearbyListings(parseInt(page));
        } else if (isCategorySearch && category) {
          // Handle category search page changes
          fetchCategoryListings(parseInt(page));
        }
      }
    }
  }, [
    searchParams,
    initialLoadDone,
    isNearbySearch,
    isCategorySearch,
    lat,
    lng,
    category,
    fetchNearbyListings,
    fetchCategoryListings,
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 mb-6">
          <div className="flex flex-col gap-4">
            {/* Top Row - Logo, Back Button, and Filter Button */}
            <div className="flex items-center justify-between">
              {/* Left Section - Logo and Back Button */}
              <div className="flex items-center gap-3 min-w-0">
                <Link
                  href="/"
                  className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity"
                >
                  <Image
                    src="/logo.png"
                    alt="SYPG Logo"
                    width={40}
                    height={40}
                    className="h-8 w-8 md:h-10 md:w-10 object-contain"
                  />
                  <span className="hidden sm:block text-HG-500 font-semibold text-sm">
                    SYPG
                  </span>
                </Link>

                <div className="hidden md:block w-px h-6 bg-gray-200 flex-shrink-0"></div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goBack}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-2 py-1.5 h-auto flex-shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm font-medium">
                    Back
                  </span>
                </Button>
              </div>

              {/* Right Section - Filter Button */}
              <div className="flex-shrink-0">
                {!isNearbySearch && (
                  <AdvancedFilter
                    filters={filters}
                    onFiltersChange={(newFilters) => {
                      setFilters(newFilters);
                      // Always use searchWithFilters for better filtering capabilities
                      const locationParams = userLocation
                        ? {
                            lat: userLocation.lat.toString(),
                            lng: userLocation.lng.toString(),
                          }
                        : {};

                      // If this is a category search, ensure the category filter is applied
                      const filtersToApply = isCategorySearch
                        ? { ...newFilters, type: category, ...locationParams }
                        : { ...newFilters, ...locationParams };

                      searchWithFilters(filtersToApply, true);
                    }}
                    onApplyFilters={() => {
                      // onFiltersChange already handles the search, so we don't need to do anything here
                      // The search is triggered by onFiltersChange when filters are updated
                    }}
                    onClearFilters={() => {
                      // Always use clearFilters for consistent behavior
                      clearFilters();
                    }}
                    activeFiltersCount={activeFiltersCount}
                  />
                )}
              </div>
            </div>

            {/* Bottom Row - Title and Count */}
            <div className="text-center md:text-left">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 font-poppins">
                {isNearbySearch
                  ? "Nearby Properties"
                  : isCategorySearch
                  ? `${
                      currentCategory
                        ? currentCategory.charAt(0).toUpperCase() +
                          currentCategory.slice(1)
                        : "Category"
                    } Properties`
                  : "All Properties"}
              </h1>
              <p className="text-gray-500 font-inter text-sm md:text-base mt-1">
                {isNearbySearch
                  ? nearbyLoading
                    ? "Loading..."
                    : `${nearbyTotal} properties nearby`
                  : isCategorySearch
                  ? categoryLoading
                    ? "Loading..."
                    : `${categoryTotal} ${
                        currentCategory || "category"
                      } properties`
                  : loading
                  ? "Loading..."
                  : `${total} properties`}
              </p>
            </div>
          </div>
        </div>

        {/* Category Filter for Location-based Search */}
        {isNearbySearch && lat && lng && (
          <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5">
            <LocationCategoryFilter
              categories={[
                {
                  id: "pgs",
                  name: "pgs",
                  label: "PGs",
                  count: categoryCounts.pgs,
                },
                {
                  id: "hostels",
                  name: "hostels",
                  label: "Hostels",
                  count: categoryCounts.hostels,
                },
                {
                  id: "rooms",
                  name: "rooms",
                  label: "Rooms",
                  count: categoryCounts.rooms,
                },
                {
                  id: "flats",
                  name: "flats",
                  label: "Flats",
                  count: categoryCounts.flats,
                },
                {
                  id: "commercial",
                  name: "commercial",
                  label: "Commercial",
                  count: categoryCounts.commercial,
                },
              ]}
              selectedCategories={selectedCategories}
              onCategoryChange={setSelectedCategories}
              onClearAll={() => setSelectedCategories([])}
              showCounts={true}
            />
          </div>
        )}

        {/* Active Filters Display - Show for regular listings and category search */}
        {!isNearbySearch && activeFiltersCount > 0 && (
          <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-HG-500 rounded-full"></div>
                <span className="text-sm font-semibold text-gray-800">
                  Active Filters ({activeFiltersCount})
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs h-auto px-3 py-1.5 text-HG-500 hover:text-HG-600 hover:bg-HG-50 rounded-lg transition-colors"
              >
                Clear All
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.query && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1.5 bg-HG-50 text-HG-700 border-HG-200 hover:bg-HG-100 transition-colors"
                >
                  <span className="text-xs font-medium">Search:</span>
                  <span className="text-xs">&ldquo;{filters.query}&rdquo;</span>
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-HG-800 transition-colors"
                    onClick={() => removeFilter("query")}
                  />
                </Badge>
              )}
              {filters.type && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1.5 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors"
                >
                  <span className="text-xs font-medium">Type:</span>
                  <span className="text-xs capitalize">{filters.type}</span>
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-blue-800 transition-colors"
                    onClick={() => removeFilter("type")}
                  />
                </Badge>
              )}
              {filters.subType && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1.5 bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 transition-colors"
                >
                  <span className="text-xs font-medium">Subtype:</span>
                  <span className="text-xs capitalize">{filters.subType}</span>
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-purple-800 transition-colors"
                    onClick={() => removeFilter("subType")}
                  />
                </Badge>
              )}
              {filters.genderPreference && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1.5 bg-green-50 text-green-700 border-green-200 hover:bg-green-100 transition-colors"
                >
                  <span className="text-xs font-medium">Gender:</span>
                  <span className="text-xs capitalize">
                    {filters.genderPreference}
                  </span>
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-green-800 transition-colors"
                    onClick={() => removeFilter("genderPreference")}
                  />
                </Badge>
              )}
              {(filters.minPrice || filters.maxPrice) && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1.5 bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 transition-colors"
                >
                  <span className="text-xs font-medium">Price:</span>
                  <span className="text-xs">
                    ₹{filters.minPrice || "0"} - ₹{filters.maxPrice || "∞"}
                  </span>
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-orange-800 transition-colors"
                    onClick={() => {
                      removeFilter("minPrice");
                      removeFilter("maxPrice");
                    }}
                  />
                </Badge>
              )}
              {filters.amenities.map((amenity) => (
                <Badge
                  key={amenity}
                  variant="secondary"
                  className="flex items-center gap-1.5 bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100 transition-colors"
                >
                  <span className="text-xs capitalize">{amenity}</span>
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-pink-800 transition-colors"
                    onClick={() => removeFilter("amenities", amenity)}
                  />
                </Badge>
              ))}
              {filters.roomTypes.map((roomType) => (
                <Badge
                  key={roomType}
                  variant="secondary"
                  className="flex items-center gap-1.5 bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 transition-colors"
                >
                  <span className="text-xs capitalize">{roomType}</span>
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-amber-800 transition-colors"
                    onClick={() => removeFilter("roomTypes", roomType)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {(loading || nearbyLoading || categoryLoading) && (
          <div className="grid justify-center sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, idx) => (
              <Skeleton key={idx} />
            ))}
          </div>
        )}

        {/* Category Listings Grid (bypassing advanced filter) - Only show if no advanced filters */}
        {isCategorySearch &&
          !isCategorySearchWithFilters &&
          !categoryLoading &&
          categoryListings.length > 0 && (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 font-poppins">
                  {currentCategory
                    ? currentCategory.charAt(0).toUpperCase() +
                      currentCategory.slice(1)
                    : "Category"}{" "}
                  Properties
                </h2>
                <p className="text-gray-600 font-inter">
                  Showing {categoryTotal} {currentCategory || "category"}{" "}
                  properties
                </p>
              </div>
              <div className="grid justify-center sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                {categoryListings.map((pg, idx) => (
                  <PgCard
                    key={pg._id || idx}
                    id={pg._id}
                    image={pg.primaryImage}
                    images={pg.images?.map((img: any) => img.url) || []}
                    area={pg.location?.area}
                    pgName={pg.pgName}
                    primaryLine={pg.primaryLine}
                    ownerName={pg.ownerId?.fullName}
                    price={pg.minRent}
                    genderPreference={pg.genderPreference}
                    isWishlisted={pg.inWatchList}
                    type={pg.type}
                    distance={pg.distance}
                    amenities={pg.amenities || []}
                    rentInclusions={pg.rentInclusions || {}}
                  />
                ))}
              </div>
            </>
          )}

        {/* Nearby Listings Grid (bypassing advanced filter) */}
        {isNearbySearch && !nearbyLoading && nearbyListings.length > 0 && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 font-poppins">
                Nearby Properties Sorted by Distance
              </h2>
              <p className="text-gray-600 font-inter">
                Showing {nearbyTotal} properties near your location
              </p>
            </div>
            <div className="grid justify-center sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
              {nearbyListings.map((pg, idx) => (
                <PgCard
                  key={pg._id || idx}
                  id={pg._id}
                  image={pg.primaryImage}
                  images={pg.images?.map((img: any) => img.url) || []}
                  area={pg.location?.area}
                  pgName={pg.pgName}
                  primaryLine={pg.primaryLine}
                  ownerName={pg.ownerId?.fullName}
                  price={pg.minRent}
                  genderPreference={pg.genderPreference}
                  isWishlisted={pg.inWatchList}
                  type={pg.type}
                  distance={pg.distance}
                  amenities={pg.amenities || []}
                  rentInclusions={pg.rentInclusions || {}}
                />
              ))}
            </div>
          </>
        )}

        {/* Regular Listings Grid (with advanced filter) - Show for regular search or category search with filters */}
        {!isNearbySearch &&
          (!isCategorySearch || isCategorySearchWithFilters) &&
          !loading &&
          listings.length > 0 && (
            <div className="grid justify-center sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
              {listings.map((pg, idx) => (
                <PgCard
                  key={pg._id || idx}
                  id={pg._id}
                  image={pg.primaryImage}
                  images={pg.images?.map((img: any) => img.url) || []}
                  area={pg.location?.area}
                  pgName={pg.pgName}
                  primaryLine={pg.primaryLine}
                  ownerName={pg.ownerId?.fullName}
                  price={pg.minRent}
                  genderPreference={pg.genderPreference}
                  isWishlisted={pg.inWatchList}
                  type={pg.type}
                  distance={pg.distance}
                  amenities={pg.amenities || []}
                  rentInclusions={pg.rentInclusions || {}}
                />
              ))}
            </div>
          )}

        {/* Empty State */}
        {!loading &&
          !nearbyLoading &&
          !categoryLoading &&
          ((isNearbySearch && nearbyListings.length === 0) ||
            (isCategorySearch &&
              !isCategorySearchWithFilters &&
              categoryListings.length === 0) ||
            (!isNearbySearch &&
              (!isCategorySearch || isCategorySearchWithFilters) &&
              listings.length === 0)) && (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🏠</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 font-poppins">
                  {isNearbySearch
                    ? "No properties found near your location"
                    : isCategorySearch
                    ? `No ${currentCategory || "category"} properties found`
                    : activeFiltersCount > 0
                    ? "No properties match your filters"
                    : "No listings found"}
                </h3>
                <p className="text-gray-600 font-inter mb-4">
                  {isNearbySearch
                    ? "Try expanding your search area or check back later."
                    : isCategorySearch
                    ? `No ${
                        currentCategory || "category"
                      } properties are available at the moment. Try other categories.`
                    : activeFiltersCount > 0
                    ? "Try adjusting your search criteria or removing some filters."
                    : "There are no property listings available at the moment."}
                </p>
                {!isNearbySearch && activeFiltersCount > 0 && (
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    className="text-HG-500 border-HG-500 hover:bg-HG-50"
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            </div>
          )}

        {/* Pagination for Category Listings */}
        {isCategorySearch &&
          !isCategorySearchWithFilters &&
          !categoryLoading &&
          categoryTotalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-12">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleCategoryPageChange(categoryCurrentPage - 1)
                }
                disabled={categoryCurrentPage <= 1}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              <div className="flex items-center gap-2">
                {Array.from(
                  { length: Math.min(5, categoryTotalPages) },
                  (_, i) => {
                    let pageNum;
                    if (categoryTotalPages <= 5) {
                      pageNum = i + 1;
                    } else if (categoryCurrentPage <= 3) {
                      pageNum = i + 1;
                    } else if (categoryCurrentPage >= categoryTotalPages - 2) {
                      pageNum = categoryTotalPages - 4 + i;
                    } else {
                      pageNum = categoryCurrentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={
                          categoryCurrentPage === pageNum
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => handleCategoryPageChange(pageNum)}
                        className="w-10 h-10 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  }
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleCategoryPageChange(categoryCurrentPage + 1)
                }
                disabled={categoryCurrentPage >= categoryTotalPages}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}

        {/* Pagination for Category Listings with Filters */}
        {isCategorySearchWithFilters && !loading && totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-12">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className="w-10 h-10 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Pagination for Nearby Listings */}
        {isNearbySearch && !nearbyLoading && nearbyTotalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-12">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleNearbyPageChange(nearbyCurrentPage - 1)}
              disabled={nearbyCurrentPage <= 1}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, nearbyTotalPages) }, (_, i) => {
                let pageNum;
                if (nearbyTotalPages <= 5) {
                  pageNum = i + 1;
                } else if (nearbyCurrentPage <= 3) {
                  pageNum = i + 1;
                } else if (nearbyCurrentPage >= nearbyTotalPages - 2) {
                  pageNum = nearbyTotalPages - 4 + i;
                } else {
                  pageNum = nearbyCurrentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={
                      nearbyCurrentPage === pageNum ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => handleNearbyPageChange(pageNum)}
                    className="w-10 h-10 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleNearbyPageChange(nearbyCurrentPage + 1)}
              disabled={nearbyCurrentPage >= nearbyTotalPages}
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Pagination for Regular Listings */}
        {!isNearbySearch && !isCategorySearch && !loading && totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-12">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className="w-10 h-10 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Page Info for Category Listings */}
        {isCategorySearch &&
          !isCategorySearchWithFilters &&
          !categoryLoading &&
          categoryListings.length > 0 && (
            <div className="text-center mt-8">
              <p className="text-sm text-gray-600 font-inter">
                Page {categoryCurrentPage} of {categoryTotalPages} •{" "}
                {categoryTotal} total {currentCategory || "category"} properties
              </p>
            </div>
          )}

        {/* Page Info for Nearby Listings */}
        {isNearbySearch && !nearbyLoading && nearbyListings.length > 0 && (
          <div className="text-center mt-8">
            <p className="text-sm text-gray-600 font-inter">
              Page {nearbyCurrentPage} of {nearbyTotalPages} • {nearbyTotal}{" "}
              total properties near your location
            </p>
          </div>
        )}

        {/* Page Info for Category Listings with Filters */}
        {isCategorySearchWithFilters && !loading && listings.length > 0 && (
          <div className="text-center mt-8">
            <p className="text-sm text-gray-600 font-inter">
              Page {currentPage} of {totalPages} • {total} total properties
              {activeFiltersCount > 0 && ` (filtered from all listings)`}
            </p>
          </div>
        )}

        {/* Page Info for Regular Listings */}
        {!isNearbySearch &&
          !isCategorySearch &&
          !loading &&
          listings.length > 0 && (
            <div className="text-center mt-8">
              <p className="text-sm text-gray-600 font-inter">
                Page {currentPage} of {totalPages} • {total} total properties
                {activeFiltersCount > 0 && ` (filtered from all listings)`}
              </p>
            </div>
          )}
      </div>
    </div>
  );
}

export default function AllListingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-HG-500 mx-auto mb-4"></div>
            <p className="text-gray-600 font-inter">
              Loading property listings...
            </p>
          </div>
        </div>
      }
    >
      <AllListingsContent />
    </Suspense>
  );
}