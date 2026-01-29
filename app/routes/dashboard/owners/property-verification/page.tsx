// app/routes/dashboard/admin/property-verification/page.tsx
"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Building,
  Clock,
  CheckCircle,
  XCircle,
  Star,
  Eye,
  MapPin,
  User,
  Search,
  Filter,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Home,
  Bed,
} from "lucide-react";
import { BlurImage } from "@/components/BlurImage";

interface Listing {
  _id: string;
  pgName: string;
  type: string;
  subType: string;
  location: {
    area: string;
    city: string;
    state: string;
  };
  images: { url: string }[];
  primaryImage: string;
  roomTypes: {
    type: string;
    numberOfRooms: number;
    availableRooms: number;
    monthlyRent: number;
  }[];
  genderPreference: string;
  amenities: string[];
  isApproved: boolean;
  isActive: boolean;
  isFeatured: boolean;
  planType: string;
  paymentStatus: string;
  createdAt: string;
  ownerId: {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
    ownerStatus: string;
  };
}

interface Summary {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

interface Analytics {
  cityBreakdown: { _id: string; count: number }[];
  typeBreakdown: { _id: string; count: number }[];
}

export default function PropertyVerificationPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("status", activeTab);
      params.append("page", currentPage.toString());
      if (selectedCity !== "all") params.append("city", selectedCity);
      if (selectedType !== "all") params.append("type", selectedType);

      const response = await axios.get(`/api/admin/property-verification?${params}`);
      if (response.data.success) {
        setListings(response.data.data);
        setSummary(response.data.summary);
        setAnalytics(response.data.analytics);
        setTotalPages(response.data.totalPages);
        setTotal(response.data.total);
      }
    } catch (error) {
      toast.error("Failed to fetch listings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [activeTab, currentPage, selectedCity, selectedType]);

  const handleAction = async (action: string) => {
    if (!selectedListing) return;

    try {
      setActionLoading(true);
      const response = await axios.patch("/api/admin/property-verification", {
        listingId: selectedListing._id,
        action,
        rejectionReason: action === "reject" ? rejectionReason : undefined,
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setSelectedListing(null);
        setRejectionReason("");
        fetchListings();
      }
    } catch (error) {
      toast.error("Failed to perform action");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (listing: Listing) => {
    if (listing.isFeatured) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
          <Star className="w-3 h-3 mr-1 fill-yellow-500" />
          Featured
        </Badge>
      );
    }
    if (listing.isApproved && listing.isActive) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-300">
          <CheckCircle className="w-3 h-3 mr-1" />
          Approved
        </Badge>
      );
    }
    if (!listing.isApproved && listing.isActive) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    }
    return (
      <Badge className="bg-red-100 text-red-800 border-red-300">
        <XCircle className="w-3 h-3 mr-1" />
        Rejected
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getMinRent = (roomTypes: any[]) => {
    if (!roomTypes || roomTypes.length === 0) return 0;
    return Math.min(...roomTypes.map((r) => r.monthlyRent));
  };

  const getTotalRooms = (roomTypes: any[]) => {
    if (!roomTypes || roomTypes.length === 0) return 0;
    return roomTypes.reduce((acc, r) => acc + r.numberOfRooms, 0);
  };

  if (loading && listings.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-HG-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-poppins">
          Property <span className="text-HG-500">Verification</span>
        </h1>
        <p className="text-gray-600 mt-1">
          Review and approve property listings
        </p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{summary.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{summary.approved}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">{summary.rejected}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-HG-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-HG-600">{summary.total}</p>
                </div>
                <Building className="h-8 w-8 text-HG-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Top Cities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {analytics.cityBreakdown.slice(0, 5).map((city) => (
                  <Badge key={city._id} variant="outline" className="px-3 py-1">
                    {city._id}: {city.count}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Property Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {analytics.typeBreakdown.map((type) => (
                  <Badge key={type._id} variant="outline" className="px-3 py-1 capitalize">
                    {type._id}: {type.count}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by property name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="pgs">PGs</SelectItem>
            <SelectItem value="hostels">Hostels</SelectItem>
            <SelectItem value="flats">Flats</SelectItem>
            <SelectItem value="rooms">Rooms</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {listings.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No {activeTab} properties
                </h3>
                <p className="text-gray-600">
                  {activeTab === "pending"
                    ? "No properties awaiting verification."
                    : `No ${activeTab} properties found.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {listings.map((listing) => (
                <Card key={listing._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Image */}
                      <div className="w-full md:w-40 h-32 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <BlurImage
                          src={listing.primaryImage || listing.images?.[0]?.url}
                          alt={listing.pgName}
                          width={160}
                          height={128}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Details */}
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-lg">{listing.pgName}</h3>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {listing.location.area}, {listing.location.city}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {getStatusBadge(listing)}
                            <Badge variant="outline" className="capitalize">
                              {listing.type}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-gray-500">Rooms:</span>
                            <p className="font-medium">{getTotalRooms(listing.roomTypes)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Starting:</span>
                            <p className="font-medium">
                              ₹{getMinRent(listing.roomTypes).toLocaleString()}/mo
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Gender:</span>
                            <p className="font-medium capitalize">{listing.genderPreference}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Listed:</span>
                            <p className="font-medium">{formatDate(listing.createdAt)}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-4 h-4 text-gray-400" />
                            <span>{listing.ownerId?.fullName}</span>
                            {listing.ownerId?.ownerStatus === "verified" && (
                              <Badge variant="outline" className="text-xs border-green-300 text-green-600">
                                KYC ✓
                              </Badge>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                window.open(`/routes/pg-details/${listing._id}`, "_blank")
                              }
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Preview
                            </Button>

                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedListing(listing)}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  Review
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Property Review</DialogTitle>
                                  <DialogDescription>
                                    Review property details and take action
                                  </DialogDescription>
                                </DialogHeader>

                                {selectedListing && (
                                  <div className="space-y-6">
                                    {/* Property Images */}
                                    <div className="grid grid-cols-4 gap-2">
                                      {selectedListing.images?.slice(0, 4).map((img, idx) => (
                                        <div
                                          key={idx}
                                          className="aspect-square rounded-lg overflow-hidden bg-gray-100"
                                        >
                                          <BlurImage
                                            src={img.url}
                                            alt={`${selectedListing.pgName} - ${idx + 1}`}
                                            width={150}
                                            height={150}
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                      ))}
                                    </div>

                                    {/* Basic Info */}
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                      <h4 className="font-semibold mb-3">Property Details</h4>
                                      <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                          <span className="text-gray-500">Name:</span>
                                          <p className="font-medium">{selectedListing.pgName}</p>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Type:</span>
                                          <p className="font-medium capitalize">
                                            {selectedListing.type} - {selectedListing.subType}
                                          </p>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Location:</span>
                                          <p className="font-medium">
                                            {selectedListing.location.area},{" "}
                                            {selectedListing.location.city},{" "}
                                            {selectedListing.location.state}
                                          </p>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Gender:</span>
                                          <p className="font-medium capitalize">
                                            {selectedListing.genderPreference}
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Room Types */}
                                    <div className="p-4 bg-blue-50 rounded-lg">
                                      <h4 className="font-semibold mb-3">Room Configuration</h4>
                                      <div className="space-y-2">
                                        {selectedListing.roomTypes?.map((room, idx) => (
                                          <div
                                            key={idx}
                                            className="flex justify-between items-center p-2 bg-white rounded"
                                          >
                                            <span>{room.type}</span>
                                            <span>
                                              {room.numberOfRooms} rooms @ ₹
                                              {room.monthlyRent.toLocaleString()}/mo
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Amenities */}
                                    <div className="p-4 bg-green-50 rounded-lg">
                                      <h4 className="font-semibold mb-3">Amenities</h4>
                                      <div className="flex flex-wrap gap-2">
                                        {selectedListing.amenities?.map((amenity, idx) => (
                                          <Badge key={idx} variant="outline">
                                            {amenity}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Owner Info */}
                                    <div className="p-4 bg-yellow-50 rounded-lg">
                                      <h4 className="font-semibold mb-3">Owner Information</h4>
                                      <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                          <span className="text-gray-500">Name:</span>
                                          <p className="font-medium">
                                            {selectedListing.ownerId?.fullName}
                                          </p>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Email:</span>
                                          <p className="font-medium">
                                            {selectedListing.ownerId?.email}
                                          </p>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Phone:</span>
                                          <p className="font-medium">
                                            {selectedListing.ownerId?.phone || "N/A"}
                                          </p>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">KYC Status:</span>
                                          <p className="font-medium capitalize">
                                            {selectedListing.ownerId?.ownerStatus}
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Actions */}
                                    {!selectedListing.isApproved && selectedListing.isActive && (
                                      <div className="space-y-4 pt-4 border-t">
                                        <div>
                                          <label className="text-sm font-medium mb-2 block">
                                            Rejection Reason (if rejecting)
                                          </label>
                                          <Textarea
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            placeholder="Enter reason for rejection..."
                                          />
                                        </div>
                                        <div className="flex gap-3">
                                          <Button
                                            onClick={() => handleAction("approve")}
                                            disabled={actionLoading}
                                            className="flex-1 bg-green-600 hover:bg-green-700"
                                          >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            {actionLoading ? "Processing..." : "Approve"}
                                          </Button>
                                          <Button
                                            onClick={() => handleAction("reject")}
                                            disabled={actionLoading}
                                            variant="destructive"
                                            className="flex-1"
                                          >
                                            <XCircle className="w-4 h-4 mr-2" />
                                            {actionLoading ? "Processing..." : "Reject"}
                                          </Button>
                                        </div>
                                      </div>
                                    )}

                                    {/* Feature/Unfeature for approved listings */}
                                    {selectedListing.isApproved && (
                                      <div className="flex gap-3 pt-4 border-t">
                                        {selectedListing.isFeatured ? (
                                          <Button
                                            onClick={() => handleAction("unfeature")}
                                            disabled={actionLoading}
                                            variant="outline"
                                            className="flex-1"
                                          >
                                            <Star className="w-4 h-4 mr-2" />
                                            Remove Featured
                                          </Button>
                                        ) : (
                                          <Button
                                            onClick={() => handleAction("feature")}
                                            disabled={actionLoading}
                                            className="flex-1 bg-yellow-500 hover:bg-yellow-600"
                                          >
                                            <Star className="w-4 h-4 mr-2 fill-white" />
                                            Make Featured
                                          </Button>
                                        )}
                                        <Button
                                          onClick={() => handleAction("deactivate")}
                                          disabled={actionLoading}
                                          variant="destructive"
                                          className="flex-1"
                                        >
                                          <XCircle className="w-4 h-4 mr-2" />
                                          Deactivate
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {listings.length} of {total} properties
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}