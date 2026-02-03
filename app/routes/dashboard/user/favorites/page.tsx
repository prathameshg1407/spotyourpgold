"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Heart,
  MapPin,
  Users,
  Wifi,
  Car,
  Utensils,
  Star,
  Eye,
} from "lucide-react";
import { useUserStore } from "@/store/userStore";
import axios from "axios";
import { toast } from "sonner";
import Link from "next/link";

interface FavoriteListing {
  _id: string;
  slug?: string;
  pgName: string;
  primaryLine: string;
  type: string;
  genderPreference: string;
  amenities: string[];
  location: {
    area: string;
    city: string;
    state: string;
  };
  roomTypes: Array<{
    type: string;
    monthlyRent: number;
    capacityPerRoom: number;
  }>;
  images: Array<{
    url: string;
  }>;
  isFeatured: boolean;
  averageRating: number;
  totalReviews: number;
}

export default function UserFavoritesPage() {
  const { user } = useUserStore();
  const [favorites, setFavorites] = useState<FavoriteListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchFavorites();
    }
  }, [user?.id]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/api/listing/getWishlist?userId=${user?.id}`
      );
      if (response.data.success) {
        setFavorites(response.data.data);
      }
    } catch (error) {
      toast.error("Failed to fetch favorites");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (listingId: string) => {
    try {
      const response = await axios.post("/api/listing/toggleWatchlist", {
        listingId,
        userId: user?.id,
      });

      if (response.data.success) {
        toast.success("Removed from favorites");
        fetchFavorites();
      } else {
        toast.error("Failed to remove from favorites");
      }
    } catch (error) {
      toast.error("Failed to remove from favorites");
    }
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case "wifi":
        return <Wifi className="h-4 w-4" />;
      case "parking":
        return <Car className="h-4 w-4" />;
      case "food":
        return <Utensils className="h-4 w-4" />;
      default:
        return <Star className="h-4 w-4" />;
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating)
            ? "text-yellow-400 fill-yellow-400"
            : "text-gray-300"
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="space-y-6 pt-4 pb-14">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-HG-500"></div>
          <span className="ml-2 text-muted-foreground">
            Loading favorites...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4 pb-14">
      <div>
        <h1 className="text-3xl font-bold text-HG-500">My Favorites</h1>
        <p className="text-muted-foreground mt-2">
          Your saved PG listings and properties you&apos;re interested in
        </p>
      </div>

      {favorites.length === 0 ? (
        <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl bg-white">
          <CardContent className="text-center py-12">
            <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              No Favorites Yet
            </h3>
            <p className="text-gray-500 mb-4">
              You haven&apos;t saved any PG listings to your favorites yet.
              Start exploring!
            </p>
            <Button
              onClick={() => (window.location.href = "/routes/all-listings")}
              className="bg-HG-500 hover:bg-HG-600 text-white"
            >
              Browse Listings
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {favorites.map((listing) => (
            <Card
              key={listing._id}
              className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl bg-white overflow-hidden"
            >
              <div className="relative">
                {listing.images && listing.images.length > 0 && (
                  <div className="h-48 bg-gray-200 relative">
                    <img
                      src={listing.images[0].url}
                      alt={listing.pgName}
                      className="w-full h-full object-cover"
                    />
                    {listing.isFeatured && (
                      <Badge className="absolute top-2 left-2 bg-HG-500 text-white">
                        Featured
                      </Badge>
                    )}
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2 bg-white/90 hover:bg-white border-red-500 text-red-500"
                  onClick={() => handleRemoveFavorite(listing._id)}
                >
                  <Heart className="h-4 w-4 fill-red-500" />
                </Button>
              </div>

              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-HG-500 line-clamp-1">
                  {listing.pgName}
                </CardTitle>
                {listing.primaryLine && (
                  <CardDescription className="line-clamp-2">
                    {listing.primaryLine}
                  </CardDescription>
                )}

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {listing.location?.area || "Unknown"},{" "}
                    {listing.location?.city || "Unknown"}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Room Types */}
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">
                      Available Rooms
                    </h4>
                    <div className="space-y-1">
                      {listing.roomTypes?.slice(0, 2).map((room, index) => (
                        <div
                          key={index}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-gray-600">{room.type}</span>
                          <span className="font-medium text-HG-500">
                            ₹{room.monthlyRent?.toLocaleString() || 0}/month
                          </span>
                        </div>
                      )) || (
                        <div className="text-sm text-gray-500">
                          No room information available
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Amenities */}
                  {listing.amenities && listing.amenities.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">
                        Amenities
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {listing.amenities.slice(0, 4).map((amenity, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded"
                          >
                            {getAmenityIcon(amenity)}
                            <span>{amenity}</span>
                          </div>
                        ))}
                        {listing.amenities.length > 4 && (
                          <span className="text-xs text-gray-500">
                            +{listing.amenities.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Rating */}
                  {listing.averageRating && listing.averageRating > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {renderStars(listing.averageRating)}
                      </div>
                      <span className="text-sm text-gray-600">
                        {listing.averageRating.toFixed(1)} (
                        {listing.totalReviews || 0} reviews)
                      </span>
                    </div>
                  )}

                  {/* Gender Preference */}
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600 capitalize">
                      {listing.genderPreference || "unisex"} only
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Link
                      href={`/routes/pg-details/${listing.slug || listing._id}`}
                      className="flex-1"
                    >
                      <Button className="w-full bg-HG-500 hover:bg-HG-600 text-white">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
