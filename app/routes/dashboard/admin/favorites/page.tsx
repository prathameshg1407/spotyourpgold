"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLoadingStore } from "@/store/loading";
import {
  User,
  Heart,
  MapPin,
  Calendar,
  Search,
  Eye,
  Users,
  ChevronDown,
  ChevronUp,
  Building2,
  Mail,
  Phone,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { BlurImage } from "@/components/BlurImage";
import { format } from "date-fns";

interface WatchlistItem {
  _id: string;
  pgName: string;
  location: {
    city: string;
    area: string;
  };
  primaryImage: string;
  ownerId: {
    _id: string;
    fullName: string;
  };
}

interface UserWithWatchlist {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  watchlistCount: number;
  watchlist: WatchlistItem[];
  createdAt: string;
  updatedAt: string;
}

interface ListingPopularity {
  _id: string;
  favoriteCount: number;
  pgName: string;
  location: {
    city: string;
    area: string;
  };
  primaryImage: string;
  owner: {
    _id: string;
    fullName: string;
  };
}

export default function FavoritesManagement() {
  const [users, setUsers] = useState<UserWithWatchlist[]>([]);
  const [listingPopularity, setListingPopularity] = useState<
    ListingPopularity[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [selectedListing, setSelectedListing] =
    useState<ListingPopularity | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [popularListingsPage, setPopularListingsPage] = useState(1);
  const { containerLoading, setContainerLoading } = useLoadingStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setContainerLoading("userFavorites", true);
    setLoading(true);

    const fetchUsersWithWatchlists = async () => {
      try {
        const res = await axios.get("/api/admin/getUsersWithWatchlist");

        if (res?.data?.success) {
          setUsers(res.data.data);
          setListingPopularity(res.data.listingPopularity || []);
        } else {
          toast.error("Failed to fetch users with watchlists");
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Something went wrong");
      } finally {
        setContainerLoading("userFavorites", false);
        setLoading(false);
      }
    };

    fetchUsersWithWatchlists();

    return () => {
      setContainerLoading("userFavorites", false);
    };
  }, [setContainerLoading]);

  // Reset pagination when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const toggleUserExpansion = (userId: string) => {
    setExpandedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleListingClick = (listing: ListingPopularity) => {
    setSelectedListing(listing);
    setIsModalOpen(true);
  };

  const filteredUsers = users.filter((user) => {
    const search = searchQuery.toLowerCase();
    return (
      user.fullName.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search) ||
      user.phone.toLowerCase().includes(search)
    );
  });

  // Pagination constants
  const USERS_PER_PAGE = 50;
  const POPULAR_LISTINGS_PER_PAGE = 50;

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const startIndex = (currentPage - 1) * USERS_PER_PAGE;
  const endIndex = startIndex + USERS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const popularListingsTotal = Math.ceil(
    listingPopularity.length / POPULAR_LISTINGS_PER_PAGE
  );
  const popularStartIndex =
    (popularListingsPage - 1) * POPULAR_LISTINGS_PER_PAGE;
  const popularEndIndex = popularStartIndex + POPULAR_LISTINGS_PER_PAGE;
  const paginatedPopularListings = listingPopularity.slice(
    popularStartIndex,
    popularEndIndex
  );

  const totalFavorites = users.reduce(
    (sum, user) => sum + user.watchlistCount,
    0
  );
  const usersWithFavorites = users.filter((user) => user.watchlistCount > 0);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 min-h-[calc(100vh-15px)]">
        <div className="flex flex-col md:flex-row justify-between md:items-center">
          <div className="flex flex-col gap-2 md:pt-5">
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight font-poppins">
              User <span className="text-HG-500">Favorites</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-lg font-inter">
              View user watchlists and favorite properties
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-HG-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 min-h-[calc(100vh-15px)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center">
        <div className="flex flex-col gap-2 md:pt-5">
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight font-poppins">
            User <span className="text-HG-500">Favorites</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-lg font-inter">
            View user watchlists and favorite properties
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-HG-100 rounded-lg">
                <Users className="w-5 h-5 text-HG-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-100 rounded-lg">
                <Heart className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Users with Favorites
                </p>
                <p className="text-2xl font-bold">
                  {usersWithFavorites.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Favorites</p>
                <p className="text-2xl font-bold">{totalFavorites}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Most Popular Listings */}
      {listingPopularity.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl md:text-2xl font-bold font-poppins">
            Most Popular <span className="text-HG-500">Listings</span>
          </h2>
          <div className="grid grid-cols-6 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-15 gap-1">
            {paginatedPopularListings.map((listing) => (
              <Card
                key={listing._id}
                className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleListingClick(listing)}
              >
                <CardContent className="p-0">
                  <div className="aspect-square relative">
                    <BlurImage
                      src={listing.primaryImage || "/placeholder.jpg"}
                      alt={listing.pgName}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-0.5 right-0.5">
                      <Badge className="bg-HG-500 text-white text-xs px-1 py-0 h-4">
                        <Heart className="w-2 h-2 mr-0.5" />
                        {listing.favoriteCount}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-0.5">
                    <h5 className="font-semibold text-xs truncate leading-tight">
                      {listing.pgName}
                    </h5>
                    <div className="flex items-center gap-0.5 text-xs text-muted-foreground truncate">
                      <MapPin className="w-2 h-2 flex-shrink-0" />
                      <span className="truncate text-xs">
                        {listing.location.area}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Popular Listings Pagination */}
          {popularListingsTotal > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {popularStartIndex + 1} to{" "}
                {Math.min(popularEndIndex, listingPopularity.length)} of{" "}
                {listingPopularity.length} listings
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPopularListingsPage(popularListingsPage - 1)
                  }
                  disabled={popularListingsPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {popularListingsPage} of {popularListingsTotal}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPopularListingsPage(popularListingsPage + 1)
                  }
                  disabled={popularListingsPage === popularListingsTotal}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between md:items-start">
        <div className="relative w-full max-w-[300px] md:min-w-[300px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full px-10 py-2 font-poppins text-sm md:text-base rounded-lg bg-[#faf4eb] text-black focus:outline-HG-400/40"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Search className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Users & Their Favorites */}
      <div className="space-y-4">
        <h2 className="text-xl md:text-2xl font-bold font-poppins">
          Users & Their <span className="text-HG-500">Favorites</span>
        </h2>
        {paginatedUsers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No users found</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {paginatedUsers.map((user) => (
              <Card key={user._id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* User Header */}
                  <div className="p-4 border-b bg-gray-50/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-HG-100 rounded-lg">
                          <User className="w-5 h-5 text-HG-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {user.fullName}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              {user.email}
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              {user.phone}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Joined{" "}
                              {format(new Date(user.createdAt), "MMM dd, yyyy")}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="secondary"
                          className="bg-HG-100 text-HG-700"
                        >
                          <Heart className="w-3 h-3 mr-1" />
                          {user.watchlistCount} favorites
                        </Badge>
                        {user.watchlistCount > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleUserExpansion(user._id)}
                            className="p-2"
                          >
                            {expandedUsers.has(user._id) ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Watchlist Items */}
                  {expandedUsers.has(user._id) && user.watchlist.length > 0 && (
                    <div className="p-4">
                      <h4 className="font-semibold mb-3 text-HG-700">
                        Favorite Properties
                      </h4>
                      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-1">
                        {user.watchlist.map((item) => (
                          <Card
                            key={item._id}
                            className="overflow-hidden hover:shadow-md transition-shadow"
                          >
                            <CardContent className="p-0">
                              <div className="aspect-square relative">
                                <BlurImage
                                  src={item.primaryImage || "/placeholder.jpg"}
                                  alt={item.pgName}
                                  width={80}
                                  height={80}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="p-0.5">
                                <h5 className="font-semibold text-xs truncate leading-tight">
                                  {item.pgName}
                                </h5>
                                <div className="flex items-center gap-0.5 text-xs text-muted-foreground truncate">
                                  <MapPin className="w-2 h-2 flex-shrink-0" />
                                  <span className="truncate text-xs">
                                    {item.location.area}
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty State for User with No Favorites */}
                  {expandedUsers.has(user._id) &&
                    user.watchlist.length === 0 && (
                      <div className="p-4 text-center text-muted-foreground">
                        <Heart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No favorites yet</p>
                      </div>
                    )}
                </CardContent>
              </Card>
            ))}

            {/* Users Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(endIndex, filteredUsers.length)} of{" "}
                  {filteredUsers.length} users
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Listing Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {selectedListing?.pgName}
            </DialogTitle>
          </DialogHeader>

          {selectedListing && (
            <div className="space-y-4">
              <div className="aspect-video relative rounded-lg overflow-hidden">
                <BlurImage
                  src={selectedListing.primaryImage || "/placeholder.jpg"}
                  alt={selectedListing.pgName}
                  width={600}
                  height={338}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-rose-500" />
                    <span className="font-semibold">Popularity</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-HG-500">
                      {selectedListing.favoriteCount}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Users have favorited this property
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-500" />
                    <span className="font-semibold">Location</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="font-medium">
                      {selectedListing.location.area}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedListing.location.city}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-green-500" />
                  <span className="font-semibold">Owner Details</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="font-medium">
                    {selectedListing.owner.fullName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Property Owner
                  </p>
                </div>
              </div>

              <div className="bg-HG-50 rounded-lg p-4 border border-HG-200">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-5 h-5 text-HG-600" />
                  <span className="font-semibold text-HG-700">
                    Property Name
                  </span>
                </div>
                <p className="text-lg font-medium text-HG-800">
                  {selectedListing.pgName}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
