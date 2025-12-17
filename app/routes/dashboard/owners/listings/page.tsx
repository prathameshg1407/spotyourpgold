"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useLoadingStore } from "@/store/loading";
import { Building2, Star, Plus, Edit, Trash } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Listing {
  _id: string;
  pgName: string;
  area: string;
  monthlyRent: number;
  isActive: boolean;
  isFeatured: boolean;
  isApproved: boolean;
  createdAt: string;
  paymentStatus: "pending" | "completed" | "failed";
  rating?: number;
}

export default function MyListingsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [approvedFilter, setApprovedFilter] = useState<
    "all" | "approved" | "unapproved"
  >("all");
  const [featuredFilter, setFeaturedFilter] = useState<
    "all" | "featured" | "non-featured"
  >("all");
  const [sortOrder, setSortOrder] = useState("latest");

  const [listings, setListings] = useState<Listing[]>([]);
  const { containerLoading, setContainerLoading } = useLoadingStore();

  const router = useRouter();

  useEffect(() => {
    setContainerLoading("ownerListings", true);

    const fetchOwnerListings = async () => {
      try {
        const res = await axios.get("/api/owner/getOwnerPg");

        if (res?.data?.success) {
          setListings(res.data.data);
        } else {
          toast.error("Failed to fetch listings");
        }
      } catch (error) {
        toast.error("Something went wrong");
      } finally {
        setContainerLoading("ownerListings", false); // ✅ stop loading only after fetch completes
      }
    };

    fetchOwnerListings();

    // Optional cleanup
    return () => {
      setContainerLoading("ownerListings", false);
    };
  }, [setContainerLoading]);

  const handleStatusToggle = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const loadingToast = toast.loading(
      `${newStatus ? "Activating" : "Deactivating"} listing...`,
      {
        closeButton: true,
      }
    );

    try {
      setContainerLoading("ownerListings", true);
      const res = await axios.patch(`/api/owner/listPg/${id}`, {
        isActive: newStatus,
      });

      if (res?.data?.success) {
        // Update the listing status in state
        setListings((prev) =>
          prev.map((listing) =>
            listing._id === id ? { ...listing, isActive: newStatus } : listing
          )
        );

        toast.success(
          `Listing ${newStatus ? "activated" : "deactivated"} successfully`,
          {
            closeButton: true,
            duration: 2000,
          }
        );
      } else {
        toast.error(res.data?.message || "Failed to update listing status", {
          closeButton: true,
          duration: 2000,
        });
      }
    } catch (error) {
      toast.error("Failed to update listing status", {
        closeButton: true,
        duration: 2000,
      });
    } finally {
      toast.dismiss(loadingToast);
      setContainerLoading("ownerListings", false);
    }
  };

  const handleDelete = async (id: string) => {
    const loadingToast = toast.loading("Deleting PG...", {
      closeButton: true,
    });

    setContainerLoading("ownerListings", true);

    try {
      const res = await axios.delete(`/api/owner/listPg/${id}`);
      if (res?.data?.success) {
        toast.dismiss(loadingToast);
        toast.success(res.data.message || "PG deleted successfully!", {
          closeButton: true,
          duration: 2000,
        });
        setListings((prev) => prev.filter((pg) => pg._id !== id));
      } else {
        toast.dismiss(loadingToast);
        toast.error(res?.data?.message || "Something went wrong", {
          closeButton: true,
          duration: 2000,
        });
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("Failed to delete PG. Try again.", {
        closeButton: true,
        duration: 2000,
      });
    } finally {
      setContainerLoading("ownerListings", false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${
          i < Math.floor(rating)
            ? "fill-yellow-400 text-yellow-400"
            : i < rating
            ? "fill-yellow-200 text-yellow-400"
            : "text-gray-300"
        }`}
      />
    ));
  };

  const filteredListings = listings
    .filter((pg) => {
      const search = searchQuery.toLowerCase();
      return (
        pg.pgName.toLowerCase().includes(search) ||
        pg.area.toLowerCase().includes(search)
      );
    })
    .filter((pg) => {
      if (activeFilter === "active" && !pg.isActive) return false;
      if (activeFilter === "inactive" && pg.isActive) return false;
      return true;
    })
    .filter((pg) => {
      if (approvedFilter === "approved" && !pg.isApproved) return false;
      if (approvedFilter === "unapproved" && pg.isApproved) return false;
      return true;
    })
    .filter((pg) => {
      if (featuredFilter === "featured" && !pg.isFeatured) return false;
      if (featuredFilter === "non-featured" && pg.isFeatured) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortOrder === "latest")
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      if (sortOrder === "oldest")
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      if (sortOrder === "rent-low") return a.monthlyRent - b.monthlyRent;
      if (sortOrder === "rent-high") return b.monthlyRent - a.monthlyRent;
      if (sortOrder === "rating") return (b.rating || 0) - (a.rating || 0);
      return 0;
    });

  return (
    <div className="flex flex-col gap-6 min-h-[calc(100vh-15px)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center">
        <div className="flex flex-col gap-2 md:pt-5">
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight font-poppins">
            My PG <span className="text-HG-500">Listings</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-lg font-inter">
            Manage your property listings with ease
          </p>
        </div>
        <Link href={"/routes/dashboard/owners/add-pg"}>
          <Button className="font-poppins hidden md:flex py-6 shadow-lg">
            <Plus className="w-4 h-4 md:mr-2" />
            Add New PG
          </Button>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4  justify-between md:items-start">
        <div className="flex items-center gap-2 md:w-[30%] md:min-w-[300px] justify-between  ">
          {/* Search Box */}
          <div className="  relative w-full max-w-[300px] md:min-w-[300px] ">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your PG..."
              className="w-full px-10 py-2 font-poppins text-sm md:text-base rounded-lg bg-[#faf4eb] text-black focus:outline-HG-400/40"
            />
            {
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-4.35-4.35M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0z"
                  />
                </svg>
              </div>
            }
            {searchQuery && (
              <div
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            )}
          </div>

          <Button className="w-full md:hidden max-w-fit">Add PG</Button>
        </div>

        {/* Filters */}
        <div className="flex justify-end   flex-wrap gap-3 text-gray-600 font-inter">
          <Select
            value={activeFilter}
            onValueChange={(value) =>
              setActiveFilter(value as "all" | "active" | "inactive")
            }
          >
            <SelectTrigger className="w-32 md:w-[130px] border-gray-200">
              <SelectValue placeholder="Active Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={approvedFilter}
            onValueChange={(value) =>
              setApprovedFilter(value as "all" | "approved" | "unapproved")
            }
          >
            <SelectTrigger className="w-32 md:w-[130px] border-gray-200">
              <SelectValue placeholder="Approval" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="unapproved">Unapproved</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={featuredFilter}
            onValueChange={(value) =>
              setFeaturedFilter(value as "all" | "featured" | "non-featured")
            }
          >
            <SelectTrigger className="w-32 md:w-[130px] border-gray-200">
              <SelectValue placeholder="Featured" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="non-featured">Non-Featured</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-32 md:w-[130px] border-gray-200">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">New First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="rent-low">Rent: Low to High</SelectItem>
              <SelectItem value="rent-high">Rent: High to Low</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Listings */}
      <div className="w-full pb-14 space-y-6">
        {containerLoading.ownerListings ? (
          <div className="h-[60vh] z-[99999] flex items-center justify-center bg-white bg-opacity-60 backdrop-blur-sm transition-opacity duration-500">
            <svg
              aria-hidden="true"
              className="inline w-14 h-14 md:w-14 md:h-14 animate-spin fill-[#ffe0ae]"
              viewBox="0 0 100 101"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" />
              <path
                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                fill="#D58F24"
              />
            </svg>
            <span className="sr-only">Loading...</span>
          </div>
        ) : filteredListings.length === 0 ? (
          <Card className="h-[60vh] w-full flex justify-center items-center shadow-none border-none">
            <CardContent className="p-12 text-center font-inter">
              <Building2 className="w-20 h-20 mx-auto text-HG-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No PG listings found
              </h3>
              <p className="text-gray-500">
                Try adjusting your search or filters
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 mt-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
            {filteredListings.map((pg) => (
              <Link
                key={pg._id}
                href={`/routes/pg-details/${pg.slug || pg._id}`}
                className="group rounded-xl shadow hover:scale-[1.03] transition overflow-hidden border border-opacity-20 hover:border-opacity-50"
              >
                <div className="p-4 bg-white relative font-inter">
                  <p className="text-xs uppercase text-gray-400">{pg.area}</p>
                  <h5 className="text-lg font-semibold text-HG-900 py-1">
                    {pg.pgName}
                  </h5>

                  <div className="flex items-center">
                    {renderStars(pg.rating || 0)}
                    <span className="text-xs text-gray-600 ml-1 font-inter">
                      ({pg.rating?.toFixed(1) || "0.0"})
                    </span>
                  </div>

                  <p className="text-2xl font-bold font-poppins text-HG-400 pt-4">
                    ₹{pg.monthlyRent.toLocaleString()}
                    <span className="text-base font-medium text-gray-600">
                      {" "}
                      /mo
                    </span>
                  </p>

                  <div className="flex justify-between items-center pt-4">
                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        router.push(
                          `/routes/dashboard/owners/add-pg?mode=edit&id=${pg._id}`
                        );
                      }}
                      className="text-sm"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>

                    <Button
                      variant="outline"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleStatusToggle(pg._id, pg.isActive);
                      }}
                      className={`text-sm ${
                        pg.isActive
                          ? "text-red-500 hover:text-red-500"
                          : "text-green-500 hover:text-green-500"
                      }`}
                    >
                      {pg.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <div className="flex items-center justify-end gap-2 pb-2">
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          pg.isActive
                            ? "text-green-500 bg-green-400/20"
                            : "text-red-500 bg-red-400/20"
                        }`}
                      >
                        {pg.isActive ? "active" : "inactive"}
                      </Badge>
                      {pg.isFeatured && (
                        <Badge
                          variant="outline"
                          className="text-HG-500 bg-HG-400/20 text-xs"
                        >
                          Featured
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pb-2">
                      {/* Delete Button */}
                      <Button
                        className="bg-red-500 hover:bg-red-600"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDelete(pg._id);
                        }}
                      >
                        <Trash className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="sr-only">Delete</span>
                      </Button>

                      {/* 🚀 Add Pay Now button conditionally */}
                      {pg.paymentStatus !== "completed" && (
                        <Button
                          variant="secondary"
                          className="bg-gray-500 hover:bg-gray-400 text-white"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            router.push(
                              `/routes/dashboard/owners/add-pg?mode=edit&id=${pg._id}&payNow=true`
                            );
                          }}
                        >
                          Pay Now
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
