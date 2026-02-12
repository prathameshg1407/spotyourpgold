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
  Search,
  Filter,
} from "lucide-react";
import Skeleton from "@/components/Skeleton";
import { useAdvancedFilters, FilterState } from "@/hooks/useAdvancedFilters";
import { useLocationSearch } from "@/hooks/useLocationSearch";
import { cn } from "@/lib/utils";

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

  // State for location-based search
  const [locationListings, setLocationListings] = useState<any[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationTotal, setLocationTotal] = useState(0);
  const [locationCurrentPage, setLocationCurrentPage] = useState(1);
  const [locationTotalPages, setLocationTotalPages] = useState(0);

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

  // Check URL parameters
  const isNearbySearch = searchParams.get("nearby") === "true";
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const category = searchParams.get("category");
  const isCategorySearch = !!category;

  // Location parameters from dropdown selection
  const city = searchParams.get("city") || "";
  const area = searchParams.get("area") || "";
  const state = searchParams.get("state") || "";
  const q = searchParams.get("q") || "";

  const hasLocationParams = city || area || state || (lat && lng);
  const isLocationSearch = !!(hasLocationParams && !isNearbySearch && !isCategorySearch);
  const locationLabel = [area, city, state].filter(Boolean).join(", ");

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
  } = useAdvancedFilters(12, false); 

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
          radius: "10",
        });

        const res = await axios.get(`/api/listing/search?${queryParams.toString()}`);
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
        // ... (existing params logic)
        
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

  // Function to fetch location-based listings
  const fetchLocationListings = useCallback(
    async (page: number = 1, categories?: string[]) => {
      // Allow fetch if hasLocationParams OR just q (text search)
      if (!hasLocationParams && !q) return;

      setLocationLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          per_page: "12",
        });

        // Add location parameters
        if (city) params.set("city", city);
        if (area) params.set("area", area);
        if (state) params.set("state", state);
        if (q) params.set("q", q);
        if (lat) params.set("lat", lat);
        if (lng) params.set("lng", lng);
        
        // Pass radius for location searches
        const radius = searchParams.get("radius");
        if(radius) params.set("radius", radius);

        // Add category filter
        const categoriesToUse = categories !== undefined ? categories : selectedCategories;
        if (categoriesToUse.length > 0) {
          params.set("categories", categoriesToUse.join(","));
        }

        // Get category counts
        const countParams = new URLSearchParams(params);
        countParams.set("countByCategory", "true");
        countParams.set("page", "1");
        countParams.set("per_page", "1");

        const [listingsRes, countsRes] = await Promise.all([
          axios.get(`/api/listing/search?${params.toString()}`),
          axios.get(`/api/listing/search?${countParams.toString()}`),
        ]);

        if (listingsRes.data?.success) {
          setLocationListings(listingsRes.data.data);
          setLocationTotal(listingsRes.data.total);
          setLocationTotalPages(listingsRes.data.totalPages);
          setLocationCurrentPage(page);
        }

        if (countsRes.data?.success && countsRes.data.categoryCounts) {
          setCategoryCounts(countsRes.data.categoryCounts);
        }
      } catch (error) {
        toast.error("Failed to fetch listings");
      } finally {
        setLocationLoading(false);
      }
    },
    [city, area, state, q, lat, lng, hasLocationParams, selectedCategories, searchParams]
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
      console.error("Failed to fetch category counts");
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

  const handleLocationPageChange = (page: number) => {
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
    
    // Only add location if needed
    if (userLocation && filters.sortBy === 'distance') {
      searchParams.set("lat", userLocation.lat.toString());
      searchParams.set("lng", userLocation.lng.toString());
    }

    // Set the new page
    searchParams.set("page", page.toString());

    // Update URL
    router.push(`?${searchParams.toString()}`);

    // Trigger search with current filters when page changes
    const locationParams = (userLocation && filters.sortBy === 'distance')
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

  // ==========================================
  // 🟢 FIX FOR DISAPPEARING LISTINGS
  // ==========================================
  useEffect(() => {
    if (initialLoadDone && !isNearbySearch && !isLocationSearch) {
      const hasFilters = Object.values(filters).some((value) => {
        if (Array.isArray(value)) return value.length > 0;
        return value !== "";
      });

      // 🔴 CRITICAL FIX: Only pass location if user is sorting by distance
      // Otherwise, we want ALL listings, not just those in 10km radius
      const locationParams = (userLocation && filters.sortBy === 'distance')
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
    isLocationSearch,
    userLocation, // Keep as dependency, but check logic inside
    searchWithFilters,
  ]);

  // Initial load - fetch listings based on URL parameters
  useEffect(() => {
    if (!initialLoadDone) {
      if (isNearbySearch && lat && lng) {
        fetchNearbyListings(1);
        fetchCategoryCounts();
      } else if (isCategorySearch && category) {
        fetchCategoryListings(1);
      } else if (isLocationSearch) {
        fetchLocationListings(1);
      } else {
        // Standard View All - ensure we load data
        // Passing empty object ensures no radius filter is applied
        searchWithFilters({}, true);
      }
      setInitialLoadDone(true);
    }
  }, [
    initialLoadDone,
    isNearbySearch,
    isCategorySearch,
    isLocationSearch,
    lat,
    lng,
    category,
    fetchNearbyListings,
    fetchCategoryListings,
    fetchCategoryCounts,
    fetchLocationListings,
    searchWithFilters,
  ]);

  // Fetch location category listings when categories change
  useEffect(() => {
    if (isNearbySearch && lat && lng) {
      if (selectedCategories.length > 0) {
        fetchLocationCategoryListings(1);
      } else {
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

  // Handle category changes for location search
  const handleLocationCategoryChange = (categories: string[]) => {
    setSelectedCategories(categories);
    if (isLocationSearch) {
      fetchLocationListings(1, categories);
    }
  };

  // Handle page changes
  useEffect(() => {
    if (initialLoadDone) {
      const page = searchParams.get("page");
      if (page) {
        if (isNearbySearch && lat && lng) {
          fetchNearbyListings(parseInt(page));
        } else if (isCategorySearch && category) {
          fetchCategoryListings(parseInt(page));
        } else if (isLocationSearch) {
          fetchLocationListings(parseInt(page));
        }
      }
    }
  }, [
    searchParams,
    initialLoadDone,
    isNearbySearch,
    isCategorySearch,
    isLocationSearch,
    lat,
    lng,
    category,
    fetchNearbyListings,
    fetchCategoryListings,
    fetchLocationListings,
  ]);

  // Determine which data to display
  const displayLoading = isNearbySearch
    ? nearbyLoading
    : isCategorySearch
    ? categoryLoading
    : isLocationSearch
    ? locationLoading
    : loading;

  const displayListings = isNearbySearch
    ? nearbyListings
    : isCategorySearch && !isCategorySearchWithFilters
    ? categoryListings
    : isLocationSearch
    ? locationListings
    : listings;

  const displayTotal = isNearbySearch
    ? nearbyTotal
    : isCategorySearch && !isCategorySearchWithFilters
    ? categoryTotal
    : isLocationSearch
    ? locationTotal
    : total;

  const displayCurrentPage = isNearbySearch
    ? nearbyCurrentPage
    : isCategorySearch && !isCategorySearchWithFilters
    ? categoryCurrentPage
    : isLocationSearch
    ? locationCurrentPage
    : currentPage;

  const displayTotalPages = isNearbySearch
    ? nearbyTotalPages
    : isCategorySearch && !isCategorySearchWithFilters
    ? categoryTotalPages
    : isLocationSearch
    ? locationTotalPages
    : totalPages;

  const displayHandlePageChange = isNearbySearch
    ? handleNearbyPageChange
    : isCategorySearch && !isCategorySearchWithFilters
    ? handleCategoryPageChange
    : isLocationSearch
    ? handleLocationPageChange
    : handlePageChange;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        
        {/* ======================= */}
        {/* 🎨 CLEAN HEADER (White & Compact) */}
        {/* ======================= */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 mb-6">
          <div className="flex flex-col gap-4">
            {/* Top Row: Nav & Actions */}
            <div className="flex items-center justify-between">
              {/* Left Section - Logo and Back Button */}
              <div className="flex items-center gap-3 min-w-0">
                <Link href="/" className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity">
                  <Image src="/logo.png" alt="SYPG Logo" width={40} height={40} className="h-8 w-8 md:h-10 md:w-10 object-contain" />
                  <span className="hidden sm:block text-HG-500 font-semibold text-sm">SYPG</span>
                </Link>

                <div className="hidden md:block w-px h-6 bg-gray-200 flex-shrink-0"></div>

                <Button variant="ghost" size="sm" onClick={goBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-2 py-1.5 h-auto flex-shrink-0">
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm font-medium">Back</span>
                </Button>
              </div>

              {/* Right Section - Filter Button */}
              <div className="flex-shrink-0">
                {!isNearbySearch && !isLocationSearch && (
                  <AdvancedFilter
                    filters={filters}
                    onFiltersChange={(newFilters) => {
                      setFilters(newFilters);
                      const locationParams = (userLocation && filters.sortBy === 'distance') ? { lat: userLocation.lat.toString(), lng: userLocation.lng.toString() } : {};
                      const filtersToApply = isCategorySearch ? { ...newFilters, type: category, ...locationParams } : { ...newFilters, ...locationParams };
                      searchWithFilters(filtersToApply, true);
                    }}
                    onApplyFilters={() => {}}
                    onClearFilters={clearFilters}
                    activeFiltersCount={activeFiltersCount}
                  />
                )}
              </div>
            </div>

            {/* Bottom Row - Title and Count */}
            <div className="text-center md:text-left">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 font-poppins break-words">
                {isNearbySearch
                  ? "Nearby Properties"
                  : isCategorySearch
                  ? `${currentCategory ? currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1) : "Category"} Properties`
                  : isLocationSearch
                  ? `Properties in ${locationLabel}`
                  : "All Properties"}
              </h1>
              <p className="text-gray-500 font-inter text-sm md:text-base mt-1">
                {displayLoading
                  ? "Loading..."
                  : `${displayTotal} ${
                      isLocationSearch
                        ? `properties in and around ${locationLabel}`
                        : isNearbySearch
                        ? "properties near you"
                        : isCategorySearch
                        ? `${currentCategory || "category"} properties`
                        : "properties listed"
                    }`}
              </p>
            </div>
          </div>
        </div>

        {/* Category Filter for Nearby Search */}
        {isNearbySearch && lat && lng && (
          <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5">
            <LocationCategoryFilter
              categories={[
                { id: "pgs", name: "pgs", label: "PGs", count: categoryCounts.pgs },
                { id: "hostels", name: "hostels", label: "Hostels", count: categoryCounts.hostels },
                { id: "rooms", name: "rooms", label: "Rooms", count: categoryCounts.rooms },
                { id: "flats", name: "flats", label: "Flats", count: categoryCounts.flats },
                { id: "commercial", name: "commercial", label: "Commercial", count: categoryCounts.commercial },
              ]}
              selectedCategories={selectedCategories}
              onCategoryChange={setSelectedCategories}
              onClearAll={() => setSelectedCategories([])}
              showCounts={true}
            />
          </div>
        )}

        {/* Category Filter for Location Search */}
        {isLocationSearch && Object.keys(categoryCounts).length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Filter by Property Type
              </h3>
              {selectedCategories.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLocationCategoryChange([])}
                  className="text-HG-500 hover:text-HG-600"
                >
                  Clear All ({selectedCategories.length})
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(categoryCounts)
                .sort(([a], [b]) => {
                  const order = ["pgs", "hostels", "rooms", "flats", "commercial"];
                  return order.indexOf(a) - order.indexOf(b);
                })
                .map(([category, count]) => (
                  <Button
                    key={category}
                    variant={selectedCategories.includes(category) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      if (selectedCategories.includes(category)) {
                        handleLocationCategoryChange(selectedCategories.filter((c) => c !== category));
                      } else {
                        handleLocationCategoryChange([...selectedCategories, category]);
                      }
                    }}
                    className={cn(
                      selectedCategories.includes(category)
                        ? "bg-HG-500 text-white hover:bg-HG-600"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)} ({count})
                  </Button>
                ))}
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {!isNearbySearch && !isLocationSearch && activeFiltersCount > 0 && (
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
                <Badge variant="secondary" className="flex items-center gap-1.5 bg-HG-50 text-HG-700 border-HG-200">
                  <span className="text-xs font-medium">Search:</span>
                  <span className="text-xs">&ldquo;{filters.query}&rdquo;</span>
                  <X className="w-3 h-3 cursor-pointer" onClick={() => removeFilter("query")} />
                </Badge>
              )}
              {filters.type && (
                <Badge variant="secondary" className="flex items-center gap-1.5 bg-blue-50 text-blue-700 border-blue-200">
                  <span className="text-xs font-medium">Type:</span>
                  <span className="text-xs capitalize">{filters.type}</span>
                  <X className="w-3 h-3 cursor-pointer" onClick={() => removeFilter("type")} />
                </Badge>
              )}
              {/* Add other badges here if needed */}
            </div>
          </div>
        )}

        {/* Loading State */}
        {displayLoading && (
          <div className="grid justify-center sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, idx) => (
              <Skeleton key={idx} />
            ))}
          </div>
        )}

        {/* Listings Grid */}
        {!displayLoading && displayListings.length > 0 && (
          <div className="grid justify-center sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            {displayListings.map((pg, idx) => (
              <PgCard
                key={pg._id || idx}
                id={pg._id}
                slug={pg.slug}
                image={pg.primaryImage}
                images={pg.images || []}
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
        {!displayLoading && displayListings.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 font-poppins">
                No properties found
              </h3>
              <p className="text-gray-600 font-inter mb-6">
                Try adjusting your search filters or check back later.
              </p>
              <Button onClick={() => router.push("/")} variant="default" className="bg-HG-500 hover:bg-HG-600">
                Back to Home
              </Button>
            </div>
          </div>
        )}

        {/* Pagination */}
        {!displayLoading && displayTotalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-12">
            <Button
              variant="outline"
              size="sm"
              onClick={() => displayHandlePageChange(displayCurrentPage - 1)}
              disabled={displayCurrentPage <= 1}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            <span className="text-sm font-medium text-gray-600">
              Page {displayCurrentPage} of {displayTotalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => displayHandlePageChange(displayCurrentPage + 1)}
              disabled={displayCurrentPage >= displayTotalPages}
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
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
            <p className="text-gray-600 font-inter">Loading listings...</p>
          </div>
        </div>
      }
    >
      <AllListingsContent />
    </Suspense>
  );
}