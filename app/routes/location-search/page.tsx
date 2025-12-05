"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import EnhancedLocationSearchBox from "@/components/EnhancedLocationSearchBox";
import PgCard from "@/components/PgCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, MapPin, Navigation } from "lucide-react";
import Skeleton from "@/components/Skeleton";
import {
  useIndoreLocationSearch,
  LocationData,
} from "@/hooks/useIndoreLocationSearch";
import axios from "axios";
import { toast } from "sonner";

interface Property {
  _id: string;
  pgName: string;
  type?: string;
  subType?: string;
  genderPreference?: string;
  location: {
    area: string;
    city: string;
  };
  primaryImage: string;
  minRent: number;
  amenities?: string[];
  roomTypes?: any[];
  ownerName?: string;
  distance?: number;
  isWishlisted?: boolean;
  rentInclusions?: any;
}

function LocationSearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [listings, setListings] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchLocation, setSearchLocation] = useState<LocationData | null>(
    null
  );
  const [searchType, setSearchType] = useState<"in" | "around">("in");
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>(
    {}
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const { userLocation } = useIndoreLocationSearch();

  // Check if we have URL parameters for a search
  useEffect(() => {
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const nearby = searchParams.get("nearby");
    const q = searchParams.get("q");

    if (lat && lng) {
      const location: LocationData = {
        name: q || "Search Location",
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        displayName: q || `${lat}, ${lng}`,
        type: "city",
      };
      setSearchLocation(location);
      setSearchType(nearby === "true" ? "around" : "in");
      fetchListings(location, nearby === "true" ? "around" : "in", 1);
    }
  }, [searchParams]);

  // Fetch listings based on location and search type
  const fetchListings = async (
    location: LocationData,
    type: "in" | "around" = "in",
    page: number = 1,
    categories?: string[] // Accept categories as parameter to avoid stale state
  ) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        lat: location.lat.toString(),
        lng: location.lng.toString(),
        page: page.toString(),
        per_page: "12",
      });

      if (type === "around") {
        queryParams.set("radius", "10");
      }

      // Add category filter if selected (use parameter if provided, otherwise use state)
      const categoriesToUse = categories !== undefined ? categories : selectedCategories;
      if (categoriesToUse.length > 0) {
        queryParams.set("categories", categoriesToUse.join(","));
      }

      // Get category counts
      const countParams = new URLSearchParams(queryParams);
      countParams.set("countByCategory", "true");
      countParams.set("page", "1");
      countParams.set("per_page", "1");

      const [listingsRes, countsRes] = await Promise.all([
        axios.get(`/api/listing/search?${queryParams.toString()}`),
        axios.get(`/api/listing/search?${countParams.toString()}`),
      ]);

      if (listingsRes.data?.success) {
        setListings(listingsRes.data.data);
        setTotal(listingsRes.data.total);
        setTotalPages(listingsRes.data.totalPages);
        setCurrentPage(page);
      }

      if (countsRes.data?.success && countsRes.data.categoryCounts) {
        setCategoryCounts(countsRes.data.categoryCounts);
      }
    } catch (error) {
      toast.error("Failed to fetch listings");
    } finally {
      setLoading(false);
    }
  };

  // Handle location selection
  const handleLocationSelect = (location: LocationData) => {
    setSearchLocation(location);
    setSearchType("in");
    setSelectedCategories([]);
    fetchListings(location, "in", 1);
  };

  // Handle nearby search
  const handleNearbySearch = (location: LocationData) => {
    setSearchLocation(location);
    setSearchType("around");
    setSelectedCategories([]);
    fetchListings(location, "around", 1);
  };

  // Handle category change
  const handleCategoryChange = (categories: string[]) => {
    setSelectedCategories(categories);
    if (searchLocation) {
      // Pass categories directly to avoid stale state issue
      fetchListings(searchLocation, searchType, 1, categories);
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    if (searchLocation) {
      fetchListings(searchLocation, searchType, page);
    }
  };

  // Clear all filters
  const handleClearAll = () => {
    setSelectedCategories([]);
    if (searchLocation) {
      // Pass empty array directly to avoid stale state issue
      fetchListings(searchLocation, searchType, 1, []);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-poppins">
                Location Search
              </h1>
              <p className="text-gray-600 font-inter">
                Find properties by location or search around a specific area
              </p>
            </div>
          </div>

          {/* Search Box */}
          <div className="max-w-2xl">
            <EnhancedLocationSearchBox
              onLocationSelect={handleLocationSelect}
              onNearbySearch={handleNearbySearch}
              placeholder="Search for hospitals, schools, malls, metro stations in Indore..."
              showSuggestions={true}
              showNearbyOption={true}
            />
          </div>
        </div>

        {/* Search Results */}
        {searchLocation && (
          <div className="space-y-6">
            {/* Search Info */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {searchType === "around" ? (
                    <Navigation className="w-5 h-5 text-blue-500" />
                  ) : (
                    <MapPin className="w-5 h-5 text-HG-500" />
                  )}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {searchType === "around"
                        ? `Properties around ${
                            searchLocation.displayName.split(",")[0]
                          }`
                        : `Properties in ${
                            searchLocation.displayName.split(",")[0]
                          }`}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {searchType === "around"
                        ? "Within 10km radius"
                        : "In this location"}{" "}
                      • {total} properties found
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-sm">
                  {searchType === "around" ? "Nearby" : "In Location"}
                </Badge>
              </div>
            </div>

            {/* Category Filter */}
            {Object.keys(categoryCounts).length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Filter by Property Type
                  </h3>
                  {selectedCategories.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearAll}
                      className="text-HG-500 hover:text-HG-600"
                    >
                      Clear All ({selectedCategories.length})
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {/* Sort categories in a consistent order to prevent shuffling */}
                  {Object.entries(categoryCounts)
                    .sort(([a], [b]) => {
                      // Define the desired order
                      const order = ['pgs', 'hostels', 'rooms', 'flats', 'commercial'];
                      return order.indexOf(a) - order.indexOf(b);
                    })
                    .map(([category, count]) => (
                    <Button
                      key={category}
                      variant={
                        selectedCategories.includes(category)
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => {
                        if (selectedCategories.includes(category)) {
                          handleCategoryChange(
                            selectedCategories.filter((c) => c !== category)
                          );
                        } else {
                          handleCategoryChange([
                            ...selectedCategories,
                            category,
                          ]);
                        }
                      }}
                      className={
                        selectedCategories.includes(category)
                          ? "bg-HG-500 text-white hover:bg-HG-600"
                          : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)} (
                      {count})
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Listings Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-items-center">
                {Array.from({ length: 8 }).map((_, index) => (
                  <Skeleton key={index} />
                ))}
              </div>
            ) : listings.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-items-center">
                  {listings.map((pg, index) => (
                    <PgCard
                      key={pg._id || index}
                      id={pg._id}
                      image={pg.primaryImage}
                      images={[]}
                      area={pg.location?.area || ""}
                      pgName={pg.pgName}
                      primaryLine=""
                      ownerName={pg.ownerName || ""}
                      price={pg.minRent}
                      genderPreference={pg.genderPreference}
                      isWishlisted={pg.isWishlisted}
                      type={pg.type}
                      distance={pg.distance}
                      amenities={pg.amenities || []}
                      rentInclusions={pg.rentInclusions || {}}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-4 mt-8">
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
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
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
                              variant={
                                currentPage === pageNum ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
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
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      className="flex items-center gap-2"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {/* Page Info */}
                <div className="text-center mt-4">
                  <p className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages} • {total} total
                    properties
                    {selectedCategories.length > 0 &&
                      ` (filtered by ${selectedCategories.join(", ")})`}
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No properties found
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchType === "around"
                    ? "No properties found around this location. Try expanding your search radius or searching in a different area."
                    : "No properties found in this location. Try searching in a nearby area or different city."}
                </p>
                <Button
                  onClick={() => setSearchLocation(null)}
                  variant="outline"
                >
                  Try a different location
                </Button>
              </div>
            )}
          </div>
        )}

        {/* No Search State */}
        {!searchLocation && (
          <div className="text-center py-16">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Search for properties by location
            </h3>
            <p className="text-gray-600 mb-4">
              Enter a city, area, or location name to find properties in that
              area or around it.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LocationSearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LocationSearchContent />
    </Suspense>
  );
}
