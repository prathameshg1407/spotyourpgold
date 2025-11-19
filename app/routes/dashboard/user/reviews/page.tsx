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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Star, Edit, Trash2, Calendar, Save, X } from "lucide-react";
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
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editForm, setEditForm] = useState({
    rating: 0,
    comment: "",
  });
  const [hoverRating, setHoverRating] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
      } else {
        toast.error(response.data.message || "Failed to fetch reviews");
      }
    } catch (error) {
      toast.error("Failed to fetch reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = (review: Review) => {
    setReviewToDelete(review);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteReview = async () => {
    if (!reviewToDelete) return;

    try {
      setIsDeleting(true);
      const response = await axios.delete(`/api/reviews/${reviewToDelete._id}`);
      if (response.data.success) {
        toast.success("Review deleted successfully");
        fetchUserReviews();
        setIsDeleteModalOpen(false);
        setReviewToDelete(null);
      } else {
        toast.error("Failed to delete review");
      }
    } catch (error) {
      toast.error("Failed to delete review");
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteReview = () => {
    setIsDeleteModalOpen(false);
    setReviewToDelete(null);
  };

  const handleEditReview = (review: Review) => {
    setEditingReview(review);
    setEditForm({
      rating: review.rating || 0,
      comment: review.comment || "",
    });
    setHoverRating(0);
    setIsEditModalOpen(true);
  };

  const handleUpdateReview = async () => {
    if (!editingReview) return;

    if (editForm.rating < 1 || editForm.rating > 5) {
      toast.error("Please select a rating between 1 and 5 stars");
      return;
    }

    if (!editForm.comment.trim()) {
      toast.error("Please write a comment");
      return;
    }

    try {
      setIsUpdating(true);
      const response = await axios.put(`/api/reviews/${editingReview._id}`, {
        rating: editForm.rating,
        comment: editForm.comment.trim(),
      });

      if (response.data.success) {
        toast.success("Review updated successfully");
        fetchUserReviews();
        setIsEditModalOpen(false);
        setEditingReview(null);
        setEditForm({ rating: 0, comment: "" });
      } else {
        toast.error(response.data.message || "Failed to update review");
      }
    } catch (error) {
      toast.error("Failed to update review");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditModalOpen(false);
    setEditingReview(null);
    setEditForm({ rating: 0, comment: "" });
    setHoverRating(0);
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

  const renderInteractiveStars = (
    rating: number,
    onRatingChange: (rating: number) => void
  ) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-6 w-6 cursor-pointer transition-colors ${
          i < (hoverRating || rating)
            ? "text-yellow-400 fill-yellow-400"
            : "text-gray-300 hover:text-yellow-200"
        }`}
        onMouseEnter={() => setHoverRating(i + 1)}
        onMouseLeave={() => setHoverRating(0)}
        onClick={() => onRatingChange(i + 1)}
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
                      {review.listingId?.pgName || "Unknown PG"}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1">
                        {renderStars(review.rating || 0)}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {review.rating || 0}/5
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-HG-500 text-HG-500 hover:bg-HG-50"
                      onClick={() => handleEditReview(review)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-500 text-red-500 hover:bg-red-50"
                      onClick={() => handleDeleteReview(review)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">
                  {review.comment || "No comment provided"}
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Reviewed on{" "}
                    {review.createdAt
                      ? new Date(review.createdAt).toLocaleDateString()
                      : "Unknown date"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Review Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-HG-500">
              Edit Review
            </DialogTitle>
          </DialogHeader>

          {editingReview && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">
                  {editingReview.listingId?.pgName || "Unknown PG"}
                </h4>

                {/* Rating Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">
                    Rating *
                  </label>
                  <div className="flex items-center gap-1">
                    {renderInteractiveStars(editForm.rating, (rating) =>
                      setEditForm({ ...editForm, rating })
                    )}
                    <span className="ml-2 text-sm text-gray-500">
                      {editForm.rating}/5
                    </span>
                  </div>
                </div>

                {/* Comment */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">
                    Comment *
                  </label>
                  <Textarea
                    value={editForm.comment}
                    onChange={(e) =>
                      setEditForm({ ...editForm, comment: e.target.value })
                    }
                    placeholder="Write your review..."
                    className="min-h-[100px] resize-none"
                    maxLength={500}
                  />
                  <div className="text-xs text-gray-500 text-right">
                    {editForm.comment.length}/500 characters
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateReview}
                  disabled={isUpdating}
                  className="flex-1 bg-HG-500 hover:bg-HG-600 text-white disabled:opacity-50"
                >
                  {isUpdating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-1" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-red-600">
              Delete Review
            </DialogTitle>
          </DialogHeader>

          {reviewToDelete && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Are you sure you want to delete this review?
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  This action cannot be undone. Your review for{" "}
                  <span className="font-medium">
                    {reviewToDelete.listingId?.pgName || "this PG"}
                  </span>{" "}
                  will be permanently removed.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={cancelDeleteReview}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  onClick={confirmDeleteReview}
                  disabled={isDeleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete Review
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
