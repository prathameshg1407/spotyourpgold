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
import { Star, Edit, Trash2, Calendar } from "lucide-react";
import { useUserStore } from "@/store/userStore";
import axios from "axios";
import { toast } from "sonner";

interface Review {
  _id: string;
  rating: number;
  comment: string;
  listingId: {
    _id: string;
    pgName: string;
    images: Array<{ url: string }>;
  };
  createdAt: string;
}

export default function UserReviewsPage() {
  const { user } = useUserStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchUserReviews();
    }
  }, [user?.id]);

  const fetchUserReviews = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/reviews?userId=${user?.id}`);
      if (response.data.success) {
        setReviews(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast.error("Failed to fetch reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      const response = await axios.delete(`/api/reviews/${reviewId}`);
      if (response.data.success) {
        toast.success("Review deleted successfully");
        fetchUserReviews();
      } else {
        toast.error("Failed to delete review");
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error("Failed to delete review");
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="space-y-6 pt-4 pb-14">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-HG-500"></div>
          <span className="ml-2 text-muted-foreground">Loading reviews...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4 pb-14">
      <div>
        <h1 className="text-3xl font-bold text-HG-500">My Reviews</h1>
        <p className="text-muted-foreground mt-2">
          Manage your reviews and ratings for PG listings
        </p>
      </div>

      {reviews.length === 0 ? (
        <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl bg-white">
          <CardContent className="text-center py-12">
            <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              No Reviews Yet
            </h3>
            <p className="text-gray-500 mb-4">
              You haven&apos;t written any reviews yet. Start by reviewing PGs
              you&apos;ve stayed at.
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
        <div className="grid gap-6">
          {reviews.map((review) => (
            <Card
              key={review._id}
              className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl bg-white"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-HG-500">
                      {review.listingId.pgName}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1">
                        {renderStars(review.rating)}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {review.rating}/5
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-HG-500 text-HG-500 hover:bg-HG-50"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-500 text-red-500 hover:bg-red-50"
                      onClick={() => handleDeleteReview(review._id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">{review.comment}</p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Reviewed on{" "}
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
