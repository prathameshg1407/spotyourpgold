"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import EnhancedLocationSearchBox from "@/components/EnhancedLocationSearchBox";
import PgCard from "@/components/PgCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, MapPin, Navigation, X } from "lucide-react";
import Skeleton from "@/components/Skeleton";
import { useDynamicLocationSearch, LocationData } from "@/hooks/useDynamicLocationSearch";
import axios from "axios";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  inWatchList?: boolean;
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
  const [searchLocation, setSearchLocation] = useState<LocationData | null>(null);
  const [searchType, setSearchType] = useState<"in" | "around">("around");
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [radius, setRadius] = useState(10); // Default 10km

  const { userLocation } = useDynamicLocationSearch();

  // Check URL parameters
  useEffect(() => {
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const nearby = searchParams.get("nearby");
    const name = searchParams.get("name") || searchParams.get("q");
    const urlRadius = searchParams.get("radius");

    if (lat && lng) {
      const location: LocationData = {
        name: name || "Search Location",
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        displayName: name || `${lat}, ${lng}`,
        type: "location",
      };
      setSearchLocation(location);
      const type = nearby === "true" ? "around" : "in";
      setSearchType(type);
      if (urlRadius) setRadius(parseInt(urlRadius));
      fetchListings(location, type, 1);
    }
  }, [searchParams]);

  // Fetch listings
  const fetchListings = async (
    location: LocationData,
    type: "in" | "around" = "around",
    page: number = 1,
    categories?: string[]
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
        queryParams.set("radius", radius.toString());
      }

      const categoriesToUse = categories !== undefined ? categories : selectedCategories;
      if (categoriesToUse.length > 0) {
        queryParams.set("categories", categoriesToUse.join(","));
      }

      const countParams = new URLSearchParams(queryParams);
      countParams.set("countByCategory", "true");
      countParams.set("page", "1");
      countParams.set("per_page", "1");

      const [listingsRes, countsRes] = await Promise.all([
        axios.get(`/api/listing/search?${queryParams.toString()}`),
        axios.get(`/api/listing/search?${countParams.toString()}`),
      ]);

      if (listingsRes.data?.success) {
        setListings(listingsRes.data.data || []);
        setTotal(listingsRes.data.total || 0);
        setTotalPages(listingsRes.data.totalPages || 0);
        setCurrentPage(page);
      } else {
        toast.error(listingsRes.data?.message || "Failed to fetch listings");
        setListings([]);
        setTotal(0);
      }

      if (countsRes.data?.success && countsRes.data.categoryCounts) {
        setCategoryCounts(countsRes.data.categoryCounts);
      }
    } catch (error: any) {
      console.error("Fetch listings error:", error);
      toast.error(error.response?.data?.message || "Failed to fetch listings");
      setListings([]);
      setTotal(0);
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
    
    // Update URL
    const params = new URLSearchParams({
      lat: location.lat.toString(),
      lng: location.lng.toString(),
      name: location.name,
    });
    router.push(`/routes/location-search?${params.toString()}`);
  };

  // Handle nearby search
  const handleNearbySearch = (location: LocationData) => {
    setSearchLocation(location);
    setSearchType("around");
    setSelectedCategories([]);
    fetchListings(location, "around", 1);
    
    // Update URL
    const params = new URLSearchParams({
      lat: location.lat.toString(),
      lng: location.lng.toString(),
      name: location.name,
      nearby: "true",
      radius: radius.toString(),
    });
    router.push(`/routes/location-search?${params.toString()}`);
  };

  // Handle category change
  const handleCategoryChange = (categories: string[]) => {
    setSelectedCategories(categories);
    if (searchLocation) {
      fetchListings(searchLocation, searchType, 1, categories);
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    if (searchLocation) {
      fetchListings(searchLocation, searchType, page);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Clear all filters
  const handleClearAll = () => {
    setSelectedCategories([]);
    if (searchLocation) {
      fetchListings(searchLocation, searchType, 1, []);
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchLocation(null);
    setListings([]);
    setTotal(0);
    setSelectedCategories([]);
    router.push('/routes/location-search');
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
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-poppins">
                Location Search
              </h1>
              <p className="text-gray-600 font-inter text-sm md:text-base">
                Find PGs near colleges, hospitals, malls, or any location
              </p>
            </div>
          </div>

          {/* Search Box */}
          <div className="max-w-2xl">
            <EnhancedLocationSearchBox
              onLocationSelect={handleLocationSelect}
              onNearbySearch={handleNearbySearch}
              placeholder="Search: IIT Delhi, AIIMS, DLF Mall, Rajiv Chowk Metro..."
              showSuggestions={true}
              showNearbyOption={true}
            />
          </div>
        </div>

        {/* Search Results */}
        {searchLocation && (
          <div className="space-y-6">
            {/* Search Info */}
            <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {searchType === "around" ? (
                    <Navigation className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  ) : (
                    <MapPin className="w-5 h-5 text-HG-500 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-gray-900 truncate">
                      {searchType === "around"
                        ? `PGs near ${searchLocation.name}`
                        : `PGs in ${searchLocation.name}`}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {searchType === "around"
                        ? `Within ${radius}km radius`
                        : "In this location"}{" "}
                      • {total} {total === 1 ? 'property' : 'properties'} found
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-sm">
                    {searchType === "around" ? "Nearby" : "In Location"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSearch}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Category Filter */}
            {Object.keys(categoryCounts).length > 0 && (
              <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
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
                  {Object.entries(categoryCounts)
                    .sort(([a], [b]) => {
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
                            handleCategoryChange([...selectedCategories, category]);
                          }
                        }}
                        className={
                          selectedCategories.includes(category)
                            ? "bg-HG-500 text-white hover:bg-HG-600"
                            : "border-gray-300 text-gray-700 hover:bg-gray-50"
                        }
                      >
                        {category.charAt(0).toUpperCase() + category.slice(1)} ({count})
                      </Button>
                    ))}
                </div>
              </div>
            )}

            {/* Listings Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, index) => (
                  <Skeleton key={index} />
                ))}
              </div>
            ) : listings.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {listings.map((pg) => (
                    <PgCard
                      key={pg._id}
                      id={pg._id}
                      image={pg.primaryImage}
                      images={[]}
                      area={pg.location?.area || ""}
                      pgName={pg.pgName}
                      primaryLine=""
                      ownerName={pg.ownerName || ""}
                      price={pg.minRent}
                      genderPreference={pg.genderPreference}
                      isWishlisted={pg.isWishlisted || pg.inWatchList}
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
                            className={cn(
                              "w-10 h-10 p-0",
                              currentPage === pageNum && "bg-HG-500 hover:bg-HG-600"
                            )}
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

                <div className="text-center mt-4">
                  <p className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages} • {total} total {total === 1 ? 'property' : 'properties'}
                    {selectedCategories.length > 0 &&
                      ` (filtered by ${selectedCategories.join(", ")})`}
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-16 bg-white rounded-lg border">
                <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No properties found
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {searchType === "around"
                    ? `No PGs found within ${radius}km of ${searchLocation.name}.`
                    : `No PGs found in ${searchLocation.name}.`}
                  <br />
                  <span className="text-sm text-gray-500 mt-2 inline-block">
                    Only showing properties listed on SpotYourPG
                  </span>
                </p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={handleClearSearch} variant="outline">
                    Try a different location
                  </Button>
                  {searchType === "around" && (
                    <Button
                      onClick={() => {
                        setSearchType("in");
                        if (searchLocation) {
                          fetchListings(searchLocation, "in", 1);
                        }
                      }}
                      variant="default"
                      className="bg-HG-500 hover:bg-HG-600"
                    >
                      Search in area instead
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* No Search State */}
        {!searchLocation && !loading && (
          <div className="text-center py-16 bg-white rounded-lg border">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Search for PGs near any location
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Enter a college, hospital, mall, metro station, or any landmark to find nearby PG accommodations.
            </p>
            <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto mb-4">
              <Badge variant="outline" className="text-sm">IIT Delhi</Badge>
              <Badge variant="outline" className="text-sm">AIIMS</Badge>
              <Badge variant="outline" className="text-sm">Connaught Place</Badge>
              <Badge variant="outline" className="text-sm">DLF Mall</Badge>
              <Badge variant="outline" className="text-sm">Rajiv Chowk Metro</Badge>
            </div>
            <p className="text-xs text-gray-500">
              Showing only approved and active listings
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LocationSearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-HG-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading search...</p>
        </div>
      </div>
    }>
      <LocationSearchContent />
    </Suspense>
  );
}