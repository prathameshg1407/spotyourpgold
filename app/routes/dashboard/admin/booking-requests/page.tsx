"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Trash2,
  Eye,
  DollarSign,
} from "lucide-react";
import { BlurImage } from "@/components/BlurImage";

interface BookingRequest {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
  };
  listingId: {
    _id: string;
    pgName: string;
    location: {
      area: string;
      city: string;
    };
    primaryImage: string;
    ownerId: string;
  };
  roomType: string;
  moveInDate: string;
  duration: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  aadhaarNumber: string;
  additionalRequirements: string;
  amount: number;
  originalAmount: number;
  discountAmount: number;
  couponCode: string;
  securityDeposit: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  cashPaymentProof: string;
  cashCollectedBy: string;
  cashCollectedAt: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminBookingRequestsPage() {
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<BookingRequest | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const itemsPerPage = 20;

  useEffect(() => {
    fetchBookings();
  }, [activeTab, currentPage]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: itemsPerPage.toString(),
      });

      if (activeTab !== "all") {
        params.append("status", activeTab);
      }

      const response = await axios.get(`/api/admin/booking-requests?${params}`);
      
      if (response.data.success) {
        setBookings(response.data.data);
        setTotal(response.data.total);
        setTotalPages(response.data.totalPages);
      } else {
        setError(response.data.message || "Failed to fetch bookings");
      }
    } catch (error) {
      setError("Failed to fetch booking requests");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    try {
      setDeleteLoading(bookingId);
      
      const response = await axios.delete(`/api/admin/booking/${bookingId}`);
      
      if (response.data.success) {
        toast.success("Booking request deleted successfully");
        setBookings(bookings.filter(booking => booking._id !== bookingId));
        setTotal(total - 1);
        setSelectedBooking(null);
      } else {
        toast.error(response.data.message || "Failed to delete booking");
      }
    } catch (error) {
      toast.error("Failed to delete booking request");
    } finally {
      setDeleteLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending</Badge>;
      case "confirmed":
        return <Badge variant="outline" className="text-green-600 border-green-600">Confirmed</Badge>;
      case "rejected":
        return <Badge variant="outline" className="text-red-600 border-red-600">Rejected</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="text-gray-600 border-gray-600">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case "pending":
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Payment Pending</Badge>;
      case "pending_cash_payment":
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Cash Payment Pending</Badge>;
      case "completed_cash":
        return <Badge variant="outline" className="text-green-600 border-green-600">Cash Payment Completed</Badge>;
      case "failed":
        return <Badge variant="outline" className="text-red-600 border-red-600">Payment Failed</Badge>;
      case "refunded":
        return <Badge variant="outline" className="text-gray-600 border-gray-600">Refunded</Badge>;
      default:
        return <Badge variant="outline">{paymentStatus}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const tabs = [
    { id: "all", label: "All Bookings", count: total },
    { id: "pending", label: "Pending", count: bookings.filter(b => b.status === "pending").length },
    { id: "confirmed", label: "Confirmed", count: bookings.filter(b => b.status === "confirmed").length },
    { id: "rejected", label: "Rejected", count: bookings.filter(b => b.status === "rejected").length },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-HG-500"></div>
        <span className="ml-2 text-muted-foreground">Loading booking requests...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchBookings} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4 pb-14">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-4xl font-bold tracking-tight font-poppins">
          Booking Requests <span className="text-HG-500">Management</span>
        </h1>
        <p className="text-muted-foreground text-sm md:text-lg font-inter">
          Manage all booking requests across the platform
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setCurrentPage(1);
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-HG-500 text-HG-500"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No booking requests found</h3>
              <p className="text-gray-500">
                {activeTab === "all" 
                  ? "No booking requests have been submitted yet."
                  : `No ${activeTab} booking requests found.`
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:gap-6">
          {bookings.map((booking) => (
            <Card key={booking._id} className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl bg-white">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* PG Image */}
                  <div className="w-full md:w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
                    <BlurImage
                      src={booking.listingId.primaryImage}
                      alt={booking.listingId.pgName}
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Booking Details */}
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">
                          {booking.listingId.pgName}
                        </h3>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {booking.listingId.location.area}, {booking.listingId.location.city}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {getStatusBadge(booking.status)}
                        {getPaymentStatusBadge(booking.paymentStatus)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Tenant</p>
                        <p className="font-medium">{booking.fullName}</p>
                        <p className="text-gray-600">{booking.email}</p>
                        <p className="text-gray-600">{booking.phoneNumber}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Booking Details</p>
                        <p className="font-medium">Room: {booking.roomType}</p>
                        <p className="text-gray-600">Move-in: {formatDate(booking.moveInDate)}</p>
                        <p className="text-gray-600">Duration: {booking.duration} month(s)</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="text-sm">
                        <span className="text-gray-500">Amount: </span>
                        <span className="font-semibold text-HG-600">
                          ₹{booking.amount.toLocaleString()}
                        </span>
                        {booking.discountAmount > 0 && (
                          <span className="text-green-600 ml-2">
                            (After {booking.couponCode} discount)
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedBooking(booking)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Booking Request Details</DialogTitle>
                            </DialogHeader>
                            {selectedBooking && (
                              <div className="space-y-4">
                                {/* PG Information */}
                                <div className="flex gap-4">
                                  <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                                    <BlurImage
                                      src={selectedBooking.listingId.primaryImage}
                                      alt={selectedBooking.listingId.pgName}
                                      width={96}
                                      height={96}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-lg">
                                      {selectedBooking.listingId.pgName}
                                    </h3>
                                    <p className="text-gray-600 flex items-center gap-1">
                                      <MapPin className="h-4 w-4" />
                                      {selectedBooking.listingId.location.area}, {selectedBooking.listingId.location.city}
                                    </p>
                                  </div>
                                </div>

                                {/* Status */}
                                <div className="flex gap-2">
                                  {getStatusBadge(selectedBooking.status)}
                                  {getPaymentStatusBadge(selectedBooking.paymentStatus)}
                                </div>

                                {/* Tenant Information */}
                                <div>
                                  <h4 className="font-semibold mb-2">Tenant Information</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <label className="text-gray-500">Full Name</label>
                                      <p className="font-medium">{selectedBooking.fullName}</p>
                                    </div>
                                    <div>
                                      <label className="text-gray-500">Email</label>
                                      <p className="font-medium">{selectedBooking.email}</p>
                                    </div>
                                    <div>
                                      <label className="text-gray-500">Phone</label>
                                      <p className="font-medium">{selectedBooking.phoneNumber}</p>
                                    </div>
                                    <div>
                                      <label className="text-gray-500">Aadhaar Number</label>
                                      <p className="font-medium">{selectedBooking.aadhaarNumber || "Not provided"}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Address */}
                                <div>
                                  <h4 className="font-semibold mb-2">Address</h4>
                                  <p className="text-sm">
                                    {selectedBooking.address.street}, {selectedBooking.address.city}, {selectedBooking.address.state} - {selectedBooking.address.pincode}
                                  </p>
                                </div>

                                {/* Booking Details */}
                                <div>
                                  <h4 className="font-semibold mb-2">Booking Details</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <label className="text-gray-500">Room Type</label>
                                      <p className="font-medium">{selectedBooking.roomType}</p>
                                    </div>
                                    <div>
                                      <label className="text-gray-500">Move-in Date</label>
                                      <p className="font-medium">{formatDate(selectedBooking.moveInDate)}</p>
                                    </div>
                                    <div>
                                      <label className="text-gray-500">Duration</label>
                                      <p className="font-medium">{selectedBooking.duration} month(s)</p>
                                    </div>
                                    <div>
                                      <label className="text-gray-500">Security Deposit</label>
                                      <p className="font-medium">₹{selectedBooking.securityDeposit.toLocaleString()}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Payment Information */}
                                <div>
                                  <h4 className="font-semibold mb-2">Payment Information</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <label className="text-gray-500">Amount</label>
                                      <p className="font-medium text-HG-600">
                                        ₹{selectedBooking.amount.toLocaleString()}
                                      </p>
                                    </div>
                                    {selectedBooking.discountAmount > 0 && (
                                      <div>
                                        <label className="text-gray-500">Discount ({selectedBooking.couponCode})</label>
                                        <p className="font-medium text-green-600">
                                          -₹{selectedBooking.discountAmount.toLocaleString()}
                                        </p>
                                      </div>
                                    )}
                                    <div>
                                      <label className="text-gray-500">Original Amount</label>
                                      <p className="font-medium">
                                        ₹{selectedBooking.originalAmount.toLocaleString()}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-gray-500">Payment Method</label>
                                      <p className="font-medium capitalize">{selectedBooking.paymentMethod}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Additional Requirements */}
                                {selectedBooking.additionalRequirements && (
                                  <div>
                                    <h4 className="font-semibold mb-2">Additional Requirements</h4>
                                    <p className="text-sm text-gray-600">{selectedBooking.additionalRequirements}</p>
                                  </div>
                                )}

                                {/* Cash Payment Details */}
                                {selectedBooking.paymentStatus === "completed_cash" && (
                                  <div>
                                    <h4 className="font-semibold mb-2">Cash Payment Details</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <label className="text-gray-500">Collected By</label>
                                        <p className="font-medium">{selectedBooking.cashCollectedBy}</p>
                                      </div>
                                      <div>
                                        <label className="text-gray-500">Collected At</label>
                                        <p className="font-medium">{formatDate(selectedBooking.cashCollectedAt)}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Timestamps */}
                                <div>
                                  <h4 className="font-semibold mb-2">Timestamps</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <label className="text-gray-500">Created</label>
                                      <p className="font-medium">{formatDate(selectedBooking.createdAt)}</p>
                                    </div>
                                    <div>
                                      <label className="text-gray-500">Last Updated</label>
                                      <p className="font-medium">{formatDate(selectedBooking.updatedAt)}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={deleteLoading === booking._id}
                            >
                              {deleteLoading === booking._id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              ) : (
                                <Trash2 className="h-4 w-4 mr-2" />
                              )}
                              Delete
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Delete Booking Request</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <p className="text-gray-600">
                                Are you sure you want to delete this booking request? This action cannot be undone.
                              </p>
                              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-sm text-red-800">
                                  <strong>Warning:</strong> This will permanently delete the booking request and all associated data including:
                                </p>
                                <ul className="text-sm text-red-700 mt-2 list-disc list-inside">
                                  <li>Booking details</li>
                                  <li>Associated commission records</li>
                                  <li>Related notifications</li>
                                </ul>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setSelectedBooking(null)}>
                                  Cancel
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleDeleteBooking(booking._id)}
                                  disabled={deleteLoading === booking._id}
                                >
                                  {deleteLoading === booking._id ? "Deleting..." : "Delete Booking"}
                                </Button>
                              </div>
                            </div>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
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
      )}
    </div>
  );
}

