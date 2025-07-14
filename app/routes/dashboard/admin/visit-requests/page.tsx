"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  MessageSquare,
  Star,
  Trash2,
  Edit,
  Filter,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Building,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { useLoadingStore } from "@/store/loading";

interface VisitRequest {
  _id: string;
  name: string;
  phone: string;
  preferredDate: string;
  preferredTime: string;
  message: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  isMarked: boolean;
  adminNotes: string;
  createdAt: string;
  listingId: {
    _id: string;
    pgName: string;
    location: {
      area: string;
      city: string;
    };
  };
  userId?: {
    _id: string;
    fullName: string;
    email: string;
  };
}

export default function VisitRequestsPage() {
  const [visitRequests, setVisitRequests] = useState<VisitRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<VisitRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [markedFilter, setMarkedFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<VisitRequest | null>(
    null
  );
  const [adminNotes, setAdminNotes] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { containerLoading, setContainerLoading } = useLoadingStore();

  const fetchVisitRequests = useCallback(async () => {
    setContainerLoading("visitRequests", true);
    try {
      const response = await axios.get("/api/admin/visit-requests");
      if (response.data.success) {
        setVisitRequests(response.data.data);
      } else {
        toast.error("Failed to fetch visit requests");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setContainerLoading("visitRequests", false);
    }
  }, [setContainerLoading]);

  const filterRequests = useCallback(() => {
    let filtered = visitRequests;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (request) =>
          request.name.toLowerCase().includes(query) ||
          request.phone.includes(query) ||
          request.listingId.pgName.toLowerCase().includes(query) ||
          request.listingId.location.area.toLowerCase().includes(query) ||
          request.listingId.location.city.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((request) => request.status === statusFilter);
    }

    // Marked filter
    if (markedFilter !== "all") {
      filtered = filtered.filter((request) =>
        markedFilter === "marked" ? request.isMarked : !request.isMarked
      );
    }

    setFilteredRequests(filtered);
  }, [visitRequests, searchQuery, statusFilter, markedFilter]);

  useEffect(() => {
    fetchVisitRequests();
  }, [fetchVisitRequests]);

  useEffect(() => {
    filterRequests();
  }, [visitRequests, searchQuery, statusFilter, markedFilter, filterRequests]);

  const updateVisitRequest = async (
    id: string,
    updates: {
      isMarked?: boolean;
      status?: "pending" | "confirmed" | "completed" | "cancelled";
      adminNotes?: string;
    }
  ) => {
    try {
      const response = await axios.put(
        `/api/admin/visit-requests/${id}`,
        updates
      );
      if (response.data.success) {
        setVisitRequests((prev) =>
          prev.map((request) =>
            request._id === id ? { ...request, ...updates } : request
          )
        );
        toast.success("Visit request updated successfully");
      } else {
        toast.error("Failed to update visit request");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const deleteVisitRequest = async (id: string) => {
    if (!confirm("Are you sure you want to delete this visit request?")) {
      return;
    }

    try {
      const response = await axios.delete(`/api/admin/visit-requests/${id}`);
      if (response.data.success) {
        setVisitRequests((prev) =>
          prev.filter((request) => request._id !== id)
        );
        toast.success("Visit request deleted successfully");
      } else {
        toast.error("Failed to delete visit request");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const handleMarkToggle = (request: VisitRequest) => {
    updateVisitRequest(request._id, { isMarked: !request.isMarked });
  };

  const handleStatusChange = (
    request: VisitRequest,
    newStatus: "pending" | "confirmed" | "completed" | "cancelled"
  ) => {
    updateVisitRequest(request._id, { status: newStatus });
  };

  const handleNotesUpdate = () => {
    if (selectedRequest) {
      updateVisitRequest(selectedRequest._id, { adminNotes });
      setSelectedRequest({ ...selectedRequest, adminNotes });
      setIsDialogOpen(false);
      toast.success("Notes updated successfully");
    }
  };

  const openNotesDialog = (request: VisitRequest) => {
    setSelectedRequest(request);
    setAdminNotes(request.adminNotes || "");
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
      confirmed: { color: "bg-blue-100 text-blue-800", icon: CheckCircle },
      completed: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      cancelled: { color: "bg-red-100 text-red-800", icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config?.icon || AlertCircle;

    return (
      <Badge className={`${config?.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (containerLoading.visitRequests) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold font-poppins">
            Visit Requests
          </h1>
        </div>
        <div className="grid gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-poppins">
            Visit Requests
          </h1>
          <p className="text-gray-600 font-inter">
            Manage property visit requests from users
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Building className="w-4 h-4" />
          <span>{filteredRequests.length} requests</span>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by name, phone, or property..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={markedFilter} onValueChange={setMarkedFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by marked" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="marked">Marked Only</SelectItem>
                <SelectItem value="unmarked">Unmarked Only</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setMarkedFilter("all");
              }}
              variant="outline"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Visit Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No visit requests found
              </h3>
              <p className="text-gray-500">
                Try adjusting your filters or check back later
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => (
            <Card
              key={request._id}
              className={`transition-all ${
                request.isMarked ? "ring-2 ring-yellow-400 bg-yellow-50" : ""
              }`}
            >
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* User & Visit Info */}
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg font-poppins flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {request.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <Phone className="w-4 h-4" />
                          {request.phone}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(request.status)}
                        {request.isMarked && (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <Star className="w-3 h-3 mr-1" />
                            Marked
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Visit Date: {formatDate(request.preferredDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{request.preferredTime}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <span className="text-xs">
                          Requested: {formatDate(request.createdAt)} at{" "}
                          {formatTime(request.createdAt)}
                        </span>
                      </div>
                    </div>

                    {request.message && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              Special Requests:
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {request.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Property Info */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold font-poppins flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        Property Details
                      </h4>
                      <div className="mt-2 space-y-1">
                        <p className="font-medium">
                          {request.listingId.pgName}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>
                            {request.listingId.location.area},{" "}
                            {request.listingId.location.city}
                          </span>
                        </div>
                      </div>
                    </div>

                    {request.userId && (
                      <div>
                        <h4 className="font-semibold font-poppins text-sm">
                          Registered User:
                        </h4>
                        <div className="mt-1 space-y-1 text-sm text-gray-600">
                          <p>{request.userId.fullName}</p>
                          <p>{request.userId.email}</p>
                        </div>
                      </div>
                    )}

                    {request.adminNotes && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-700">
                          Admin Notes:
                        </p>
                        <p className="text-sm text-blue-600 mt-1">
                          {request.adminNotes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Status:
                      </label>
                      <Select
                        value={request.status}
                        onValueChange={(value) =>
                          handleStatusChange(
                            request,
                            value as
                              | "pending"
                              | "confirmed"
                              | "completed"
                              | "cancelled"
                          )
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => handleMarkToggle(request)}
                        variant={request.isMarked ? "default" : "outline"}
                        size="sm"
                        className="w-full"
                      >
                        <Star className="w-4 h-4 mr-2" />
                        {request.isMarked ? "Unmark" : "Mark"}
                      </Button>

                      <Button
                        onClick={() => openNotesDialog(request)}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Notes
                      </Button>

                      <Button
                        onClick={() => deleteVisitRequest(request._id)}
                        variant="destructive"
                        size="sm"
                        className="w-full"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Notes Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin Notes</DialogTitle>
            <DialogDescription>
              Add or update notes for this visit request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter admin notes..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleNotesUpdate}>Save Notes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
