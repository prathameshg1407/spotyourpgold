"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import PgCard from "@/components/PgCard";
import SectionHeading from "@/components/SectionHeading";
import AdvancedFilter from "@/components/AdvancedFilter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ChevronLeft, ChevronRight, X } from "lucide-react";
import Skeleton from "@/components/Skeleton";
import { useAdvancedFilters, FilterState } from "@/hooks/useAdvancedFilters";

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

  // State for user location
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);

  // Check if this is a nearby search
  const isNearbySearch = searchParams.get("nearby") === "true";
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

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
          console.warn("Geolocation denied or unavailable", err);
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
  const fetchNearbyListings = async (page: number = 1) => {
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
      console.error("Nearby listings fetch error", error);
      toast.error("Failed to fetch nearby listings");
    } finally {
      setNearbyLoading(false);
    }
  };

  const handleNearbyPageChange = (page: number) => {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("page", page.toString());
    router.push(`?${searchParams.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("page", page.toString());
    router.push(`?${searchParams.toString()}`);
  };

  // Remove a specific filter
  const removeFilter = (key: keyof FilterState, value?: string) => {
    if (key === "amenities" || key === "roomTypes" || key === "nearbyPlaces") {
      const currentArray = filters[key] as string[];
      updateFilter(
        key,
        currentArray.filter((item) => item !== value)
      );
    } else {
      updateFilter(key, "");
    }
  };

  // Handle category from URL params
  useEffect(() => {
    const category = searchParams.get("category");
    if (category) {
      updateFilter("type", category);
    }
  }, [searchParams, updateFilter]);

  // Initial load - fetch listings based on URL parameters
  useEffect(() => {
    if (!initialLoadDone) {
      if (isNearbySearch && lat && lng) {
        // Fetch nearby listings (bypass advanced filter)
        fetchNearbyListings(1);
      } else {
        // Check if we have any filters or search parameters from URL
        const hasFilters = Object.values(filters).some((value) => {
          if (Array.isArray(value)) return value.length > 0;
          return value !== "";
        });

        console.log("AllListings - Initial load:", {
          filters,
          hasFilters,
        });

        // Include user location in search if available
        const locationParams = userLocation
          ? {
              lat: userLocation.lat.toString(),
              lng: userLocation.lng.toString(),
            }
          : {};

        if (hasFilters) {
          // Use URL parameters for search
          searchWithFilters(locationParams);
        } else {
          // No parameters, show all listings with location
          searchWithFilters(locationParams, true);
        }
      }
      setInitialLoadDone(true);
    }
  }, [
    initialLoadDone,
    searchWithFilters,
    filters,
    isNearbySearch,
    lat,
    lng,
    userLocation,
  ]);

  // Handle page changes
  useEffect(() => {
    if (initialLoadDone) {
      if (isNearbySearch && lat && lng) {
        // Handle nearby search page changes
        const page = searchParams.get("page");
        if (page) {
          fetchNearbyListings(parseInt(page));
        }
      } else {
        // Handle regular filter page changes
        const hasFilters = Object.values(filters).some((value) => {
          if (Array.isArray(value)) return value.length > 0;
          return value !== "";
        });

        // Include user location in search if available
        const locationParams = userLocation
          ? {
              lat: userLocation.lat.toString(),
              lng: userLocation.lng.toString(),
            }
          : {};

        if (hasFilters) {
          searchWithFilters(locationParams);
        } else {
          searchWithFilters(locationParams, true); // Force search even without filters
        }
      }
    }
  }, [
    searchParams.get("page"),
    initialLoadDone,
    searchWithFilters,
    filters,
    isNearbySearch,
    lat,
    lng,
    userLocation,
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={goBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-poppins">
                {isNearbySearch ? "Nearby Properties" : "All Property Listings"}
              </h1>
              <p className="text-gray-600 font-inter">
                {isNearbySearch
                  ? nearbyLoading
                    ? "Loading..."
                    : `Showing ${nearbyTotal} properties near your location`
                  : loading
                  ? "Loading..."
                  : `Showing ${total} properties`}
              </p>
            </div>
          </div>

          {/* Advanced Filter Button - Only show for regular listings */}
          {!isNearbySearch && (
            <AdvancedFilter
              filters={filters}
              onFiltersChange={(newFilters) => {
                setFilters(newFilters);
                // Include user location in search if available
                const locationParams = userLocation
                  ? {
                      lat: userLocation.lat.toString(),
                      lng: userLocation.lng.toString(),
                    }
                  : {};
                // Trigger immediate search with new filters
                searchWithFilters({ ...newFilters, ...locationParams }, true);
              }}
              onApplyFilters={applyFilters}
              onClearFilters={clearFilters}
              activeFiltersCount={activeFiltersCount}
            />
          )}
        </div>

        {/* Active Filters Display - Only show for regular listings */}
        {!isNearbySearch && activeFiltersCount > 0 && (
          <div className="mb-8 p-4 bg-white rounded-lg border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">
                Active Filters ({activeFiltersCount}):
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs h-auto p-1 text-HG-500 hover:text-HG-600"
              >
                Clear All Filters
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.query && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Search: &ldquo;{filters.query}&rdquo;
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => removeFilter("query")}
                  />
                </Badge>
              )}
              {filters.type && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Type: {filters.type}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => removeFilter("type")}
                  />
                </Badge>
              )}
              {filters.subType && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Subtype: {filters.subType}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => removeFilter("subType")}
                  />
                </Badge>
              )}
              {filters.genderPreference && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Gender: {filters.genderPreference}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => removeFilter("genderPreference")}
                  />
                </Badge>
              )}
              {(filters.minPrice || filters.maxPrice) && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Price: ₹{filters.minPrice || "0"} - ₹{filters.maxPrice || "∞"}
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
                <Badge variant="secondary" className="flex items-center gap-1">
                  City: {filters.city}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => removeFilter("city")}
                  />
                </Badge>
              )}
              {filters.area && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Area: {filters.area}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => removeFilter("area")}
                  />
                </Badge>
              )}
              {filters.location && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Location: {filters.location}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => removeFilter("location")}
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
            </div>
          </div>
        )}

        {/* Loading State */}
        {(loading || nearbyLoading) && (
          <div className="grid justify-center sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, idx) => (
              <Skeleton key={idx} />
            ))}
          </div>
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
                  ownerName={pg.ownerId?.fullName}
                  price={pg.minRent}
                  genderPreference={pg.genderPreference}
                  isWishlisted={pg.inWatchList}
                  type={pg.type}
                  distance={pg.distance}
                />
              ))}
            </div>
          </>
        )}

        {/* Regular Listings Grid (with advanced filter) */}
        {!isNearbySearch && !loading && listings.length > 0 && (
          <div className="grid justify-center sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            {listings.map((pg, idx) => (
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
                distance={pg.distance}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading &&
          !nearbyLoading &&
          ((isNearbySearch && nearbyListings.length === 0) ||
            (!isNearbySearch && listings.length === 0)) && (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🏠</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 font-poppins">
                  {isNearbySearch
                    ? "No properties found near your location"
                    : activeFiltersCount > 0
                    ? "No properties match your filters"
                    : "No listings found"}
                </h3>
                <p className="text-gray-600 font-inter mb-4">
                  {isNearbySearch
                    ? "Try expanding your search area or check back later."
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
        {!isNearbySearch && !loading && totalPages > 1 && (
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

        {/* Page Info for Nearby Listings */}
        {isNearbySearch && !nearbyLoading && nearbyListings.length > 0 && (
          <div className="text-center mt-8">
            <p className="text-sm text-gray-600 font-inter">
              Page {nearbyCurrentPage} of {nearbyTotalPages} • {nearbyTotal}{" "}
              total properties near your location
            </p>
          </div>
        )}

        {/* Page Info for Regular Listings */}
        {!isNearbySearch && !loading && listings.length > 0 && (
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
