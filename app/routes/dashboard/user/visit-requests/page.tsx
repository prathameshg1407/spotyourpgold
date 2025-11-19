"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  MessageSquare,
  Trash2,
  Eye,
  Building,
  User,
  CalendarDays,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { useUserStore } from "@/store/userStore";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface VisitRequest {
  _id: string;
  name: string;
  phone: string;
  preferredDate: string;
  preferredTime: string;
  message: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt: string;
  listingId: {
    _id: string;
    pgName: string;
    primaryImage?: string;
    location?: {
      area?: string;
      city?: string;
    };
    city: string;
    type: string;
    amenities: string[];
  };
}

const statusConfig = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
  },
  confirmed: {
    label: "Confirmed",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: CheckCircle,
  },
  completed: {
    label: "Completed",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
  },
};

export default function UserVisitRequestsPage() {
  const { user } = useUserStore();
  const [visitRequests, setVisitRequests] = useState<VisitRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<VisitRequest | null>(
    null
  );
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    if (user) {
      fetchVisitRequests();
    }
  }, [user]);

  const fetchVisitRequests = async (page = 1) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/api/visit-request/user?page=${page}&limit=10`
      );

      if (response.data.success) {
        setVisitRequests(response.data.data);
        setPagination(response.data.pagination);
      } else {
        toast.error("Failed to fetch visit requests");
      }
    } catch (error) {
      toast.error("Failed to fetch visit requests");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm("Are you sure you want to delete this visit request?")) {
      return;
    }

    try {
      setDeletingId(requestId);
      const response = await axios.delete(
        `/api/visit-request/user?id=${requestId}`
      );

      if (response.data.success) {
        toast.success("Visit request deleted successfully");
        // Remove from local state
        setVisitRequests((prev) =>
          prev.filter((request) => request._id !== requestId)
        );
        // Update pagination
        setPagination((prev) => ({
          ...prev,
          total: prev.total - 1,
        }));
      } else {
        toast.error(response.data.message || "Failed to delete visit request");
      }
    } catch (error) {
      toast.error("Failed to delete visit request");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading your visit requests...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col">
      <div className="space-y-2 sm:space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              My Visit Requests
            </h1>
            <p className="text-gray-600 mt-1 text-xs sm:text-sm">
              Manage your property visit requests
            </p>
          </div>
          <Badge variant="outline" className="text-xs w-fit">
            {pagination.total} total requests
          </Badge>
        </div>

        {visitRequests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Visit Requests
              </h3>
              <p className="text-gray-600 text-center mb-4">
                You haven&apos;t submitted any visit requests yet.
              </p>
              <Link href="/routes/all-listings">
                <Button className="bg-HG-500 hover:bg-HG-600 text-white">
                  Browse Properties
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {visitRequests.map((request) => {
              const statusInfo = statusConfig[request.status];
              const StatusIcon = statusInfo.icon;

              return (
                <Card
                  key={request._id}
                  className="hover:shadow-sm transition-shadow"
                >
                  <CardHeader className="pb-2 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm font-semibold text-gray-900 mb-1 truncate">
                          {request.listingId.pgName}
                        </CardTitle>
                        <div className="flex items-center gap-3 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">
                              {request.listingId.location?.area ||
                                request.listingId.city}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Building className="h-3 w-3 flex-shrink-0" />
                            <span className="capitalize text-xs">
                              {request.listingId.type}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate text-xs">
                              {formatDateTime(request.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`${statusInfo.color} border text-xs px-2 py-1`}
                      >
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusInfo.label}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0 px-3 pb-2">
                    <div className="flex items-center justify-between gap-4">
                      {/* Visit Details - Compact */}
                      <div className="flex-1">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-gray-500 flex-shrink-0" />
                            <span className="font-medium">Date:</span>
                            <span className="truncate">
                              {formatDate(request.preferredDate)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-gray-500 flex-shrink-0" />
                            <span className="font-medium">Time:</span>
                            <span className="truncate">
                              {request.preferredTime}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-gray-500 flex-shrink-0" />
                            <span className="font-medium">Name:</span>
                            <span className="truncate">{request.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-gray-500 flex-shrink-0" />
                            <span className="font-medium">Phone:</span>
                            <span className="truncate">{request.phone}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1">
                        <Link
                          href={`/routes/pg-details/${request.listingId._id}`}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs px-2 py-1 h-7"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </Link>

                        {request.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteRequest(request._id)}
                            disabled={deletingId === request._id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs px-2 py-1 h-7"
                          >
                            {deletingId === request._id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Message - Compact */}
                    {request.message && (
                      <div className="mt-2 pt-2 border-t">
                        <div className="flex items-center gap-1 mb-1">
                          <MessageSquare className="h-3 w-3" />
                          <span className="font-medium text-xs text-gray-900">
                            Special Requests:
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                          {request.message}
                        </p>
                      </div>
                    )}

                    {/* Amenities - Compact */}
                    {request.listingId.amenities &&
                      request.listingId.amenities.length > 0 && (
                        <div className="mt-2 pt-2 border-t">
                          <div className="flex items-center gap-1 mb-1">
                            <Building className="h-3 w-3" />
                            <span className="font-medium text-xs text-gray-900">
                              Amenities:
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {request.listingId.amenities
                              .slice(0, 3)
                              .map((amenity, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="text-xs px-1.5 py-0.5"
                                >
                                  {amenity}
                                </Badge>
                              ))}
                            {request.listingId.amenities.length > 3 && (
                              <Badge
                                variant="secondary"
                                className="text-xs px-1.5 py-0.5"
                              >
                                +{request.listingId.amenities.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                  </CardContent>
                </Card>
              );
            })}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchVisitRequests(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="text-xs px-3 py-1 h-7"
                >
                  Previous
                </Button>
                <span className="text-xs text-gray-600">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchVisitRequests(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="text-xs px-3 py-1 h-7"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
