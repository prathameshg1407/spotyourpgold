"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import PgCard from "@/components/PgCard";
import SectionHeading from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import Skeleton from "@/components/Skeleton";

function FeaturedListingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const perPage = 20;

  useEffect(() => {
    const page = parseInt(searchParams.get("page") || "1");
    setCurrentPage(page);
    fetchFeaturedListings(page);
  }, [searchParams]);

  const fetchFeaturedListings = async (page: number) => {
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/listing/getFeatured?page=${page}&per_page=${perPage}`
      );
      if (res?.data?.success) {
        setListings(res.data.data);
        // Calculate total pages based on response (you might need to modify API to return total count)
        setTotalPages(
          Math.ceil(res.data.data.length < perPage ? page : page + 1)
        );
      } else {
        toast.error(res?.data?.message || "Failed to fetch listings");
      }
    } catch (error) {
      toast.error("Failed to fetch featured listings");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      router.push(`/routes/featured-listings?page=${newPage}`);
    }
  };

  const goBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="w-full fixed top-0 left-0 z-50 backdrop-blur-md bg-white/90 py-4 px-4 shadow-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Button
            variant="ghost"
            onClick={goBack}
            className="flex items-center gap-2 bg-HG-400/10 hover:bg-HG-400/20"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-poppins">Back</span>
          </Button>
          <h1 className="text-xl md:text-2xl font-semibold text-HG-900 font-poppins">
            Featured PG&apos;s
          </h1>
          <div className="w-20"></div> {/* Spacer for center alignment */}
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <SectionHeading>All Featured PG&apos;s</SectionHeading>
          <p className="text-gray-600 font-inter mt-2">
            Discover our handpicked selection of premium PGs
          </p>
        </div>

        {loading ? (
          <div className="grid justify-center sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            {Array.from({ length: 12 }).map((_, index) => (
              <Skeleton key={index} />
            ))}
          </div>
        ) : (
          <>
            {listings.length > 0 ? (
              <>
                <div className="grid justify-center sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 mb-12">
                  {listings.map((listing) => (
                    <PgCard
                      key={listing._id}
                      id={listing._id}
                      image={listing.primaryImage}
                      images={listing.images?.map((img: any) => img.url) || []}
                      area={listing.location?.area}
                      pgName={listing.pgName}
                      primaryLine={listing.primaryLine}
                      ownerName={listing.ownerId?.fullName}
                      price={listing.minRent}
                      genderPreference={listing.genderPreference}
                      isWishlisted={listing.isWatchlisted}
                      type={listing.type}
                      distance={listing.distance}
                      amenities={listing.amenities || []}
                      rentInclusions={listing.rentInclusions || {}}
                    />
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex justify-center items-center gap-4 py-8">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-2">
                    {Array.from({ length: Math.min(5, totalPages) }).map(
                      (_, index) => {
                        const pageNumber = Math.max(1, currentPage - 2) + index;
                        if (pageNumber > totalPages) return null;

                        return (
                          <Button
                            key={pageNumber}
                            variant={
                              pageNumber === currentPage ? "default" : "outline"
                            }
                            onClick={() => handlePageChange(pageNumber)}
                            className="w-10 h-10 p-0"
                          >
                            {pageNumber}
                          </Button>
                        );
                      }
                    )}
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-2"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 font-inter">
                  No featured listings found
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function FeaturedListingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-HG-500 mx-auto mb-4"></div>
            <p className="text-gray-600 font-inter">
              Loading featured listings...
            </p>
          </div>
        </div>
      }
    >
      <FeaturedListingsContent />
    </Suspense>
  );
}
