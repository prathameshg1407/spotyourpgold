"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Eye,
  MessageSquare,
  Trash2,
  CreditCard,
  DollarSign,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { BlurImage } from "@/components/BlurImage";

interface BookingRequest {
  _id: string;
  userId: string;
  listingId: {
    _id: string;
    pgName: string;
    primaryImage: string;
    location: {
      area: string;
      city: string;
    };
  };
  roomType: string;
  moveInDate: string;
  duration: number;
  fullName: string;
  phoneNumber: string;
  email: string;
  aadhaarNumber?: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  additionalRequirements?: string;
  status: "pending" | "confirmed" | "rejected" | "cancelled" | "completed";
  paymentStatus: "pending" | "pending_cash_payment" | "completed_cash" | "failed" | "refunded";
  amount: number;
  securityDeposit: number;
  ownerNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function BookingRequestsPage() {
  const router = useRouter();

  // Local state
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<BookingRequest | null>(
    null
  );
  const [ownerNotes, setOwnerNotes] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [cashPaymentProof, setCashPaymentProof] = useState("");
  const [cashCollectedBy, setCashCollectedBy] = useState("");

  const fetchBookings = async (status: string, page: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `/api/booking/owner-requests?status=${
          status === "all" ? "all" : status
        }&page=${page}&per_page=20`
      );
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

  useEffect(() => {
    fetchBookings(activeTab, currentPage);
  }, [activeTab, currentPage]);

  const handleBookingAction = async (
    bookingId: string,
    action: "confirmed" | "rejected"
  ) => {
    try {
      setActionLoading(bookingId);

      const response = await axios.patch(`/api/booking/${bookingId}`, {
        status: action,
        ownerNotes: ownerNotes.trim() || undefined,
      });

      if (response.data.success) {
        toast.success(`Booking ${action} successfully`);
        setOwnerNotes("");
        setSelectedBooking(null);

        // Update the booking in local state
        setBookings(prevBookings =>
          prevBookings.map(booking =>
            booking._id === bookingId
              ? { ...booking, status: action, ownerNotes: ownerNotes.trim() || undefined }
              : booking
          )
        );
      }
    } catch (error) {
      toast.error(`Failed to ${action} booking`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCashPaymentConfirmation = async (bookingId: string) => {
    try {
      setActionLoading(bookingId);

      const response = await axios.patch(
        `/api/booking/${bookingId}/cash-payment`,
        {
          cashPaymentProof: cashPaymentProof.trim() || undefined,
          cashCollectedBy: cashCollectedBy.trim() || undefined,
        }
      );

      if (response.data.success) {
        toast.success("Cash payment confirmed successfully");
        setCashPaymentProof("");
        setCashCollectedBy("");
        setSelectedBooking(null);

        // Update the booking in local state
        setBookings(prevBookings =>
          prevBookings.map(booking =>
            booking._id === bookingId
              ? { ...booking, paymentStatus: "completed_cash" }
              : booking
          )
        );
      }
    } catch (error) {
      toast.error("Failed to confirm cash payment");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    try {
      setActionLoading(bookingId);

      const response = await axios.delete(`/api/booking/${bookingId}`);

      if (response.data.success) {
        toast.success("Booking request deleted successfully");
        setSelectedBooking(null);

        // Remove the booking from local state
        setBookings(prevBookings =>
          prevBookings.filter(booking => booking._id !== bookingId)
        );
        setTotal(prevTotal => prevTotal - 1);
      }
    } catch (error) {
      toast.error("Failed to delete booking request");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "confirmed":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Confirmed
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="border-yellow-300 text-yellow-700"
          >
            <Clock className="w-3 h-3 mr-1" />
            Payment Pending
          </Badge>
        );
      case "pending_cash_payment":
        return (
          <Badge variant="outline" className="border-blue-300 text-blue-700">
            <DollarSign className="w-3 h-3 mr-1" />
            Cash Payment Pending
          </Badge>
        );
      case "completed_cash":
        return (
          <Badge variant="outline" className="border-green-300 text-green-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            Payment Completed
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="outline" className="border-red-300 text-red-700">
            <XCircle className="w-3 h-3 mr-1" />
            Payment Failed
          </Badge>
        );
      case "refunded":
        return (
          <Badge variant="outline" className="border-gray-300 text-gray-700">
            <CreditCard className="w-3 h-3 mr-1" />
            Refunded
          </Badge>
        );
      default:
        return <Badge variant="outline">{paymentStatus}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-HG-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 font-poppins">
          Booking <span className="text-HG-500">Requests</span>
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Manage booking requests from potential tenants
        </p>
        {total > 0 && (
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Showing {bookings.length} of {total} requests
          </p>
        )}
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value);
        }}
      >
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger
            value="pending"
            className="text-xs sm:text-sm py-2 px-2 sm:px-4"
          >
            <span className="hidden sm:inline">Pending</span>
            <span className="sm:hidden">Pending</span>
          </TabsTrigger>
          <TabsTrigger
            value="confirmed"
            className="text-xs sm:text-sm py-2 px-2 sm:px-4"
          >
            <span className="hidden sm:inline">Confirmed</span>
            <span className="sm:hidden">Confirmed</span>
          </TabsTrigger>
          <TabsTrigger
            value="rejected"
            className="text-xs sm:text-sm py-2 px-2 sm:px-4"
          >
            <span className="hidden sm:inline">Rejected</span>
            <span className="sm:hidden">Rejected</span>
          </TabsTrigger>
          <TabsTrigger
            value="all"
            className="text-xs sm:text-sm py-2 px-2 sm:px-4"
          >
            <span className="hidden sm:inline">All</span>
            <span className="sm:hidden">All</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {error && (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-red-500">{error}</p>
                <Button
                  variant="outline"
                  onClick={() => fetchBookings(activeTab, currentPage)}
                  className="mt-4"
                >
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}
          {!error && bookings.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No {activeTab} booking requests
                </h3>
                <p className="text-gray-600">
                  {activeTab === "pending"
                    ? "You don't have any pending booking requests at the moment."
                    : `You don't have any ${activeTab} booking requests.`}
                </p>
              </CardContent>
            </Card>
          ) : !error ? (
            <div className="grid gap-3 sm:gap-4">
              {bookings.map((booking) => (
                <Card
                  key={booking._id}
                  className="hover:shadow-md transition-shadow border border-gray-200"
                >
                  <CardContent className="p-3 sm:p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      {/* Property Image */}
                      <div className="w-full sm:w-24 md:w-32 h-24 sm:h-24 md:h-32 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
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
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-sm sm:text-base md:text-lg text-gray-900 line-clamp-1">
                                {booking.listingId.pgName}
                              </h3>
                              <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">
                                  {booking.listingId.location.area},{" "}
                                  {booking.listingId.location.city}
                                </span>
                              </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 flex-shrink-0">
                              {getStatusBadge(booking.status)}
                              {booking.status === "confirmed" && (
                                <div className="mt-1 sm:mt-0">
                                  {getPaymentStatusBadge(booking.paymentStatus)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <User className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                              <span className="font-medium text-xs sm:text-sm">
                                {booking.fullName}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                              <span className="text-xs sm:text-sm">
                                {booking.phoneNumber}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                              <span className="text-xs sm:text-sm break-all">
                                {booking.email}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                              <span className="text-xs sm:text-sm">
                                Move-in: {formatDate(booking.moveInDate)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500 text-xs sm:text-sm">
                                Room Type:{" "}
                              </span>
                              <span className="font-medium text-xs sm:text-sm">
                                {booking.roomType}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500 text-xs sm:text-sm">
                                Duration:{" "}
                              </span>
                              <span className="font-medium text-xs sm:text-sm">
                                {booking.duration} month(s)
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2 border-t gap-2">
                          <div className="text-xs sm:text-sm">
                            <span className="text-gray-500">Amount: </span>
                            <span className="font-semibold text-HG-600">
                              ₹{booking.amount.toLocaleString()}
                            </span>
                            <span className="text-gray-500 ml-1 sm:ml-2 text-xs sm:text-sm">
                              (Security: ₹
                              {booking.securityDeposit.toLocaleString()})
                            </span>
                          </div>

                          {(booking.status === "pending" ||
                            booking.paymentStatus ===
                              "pending_cash_payment") && (
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full sm:w-auto text-xs sm:text-sm"
                                    onClick={() => setSelectedBooking(booking)}
                                  >
                                    <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                    View Details
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>
                                      Booking Request Details
                                    </DialogTitle>
                                  </DialogHeader>

                                  {selectedBooking && (
                                    <div className="space-y-6">
                                      {/* Property Info */}
                                      <div className="flex gap-4">
                                        <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
                                          <BlurImage
                                            src={
                                              selectedBooking.listingId
                                                .primaryImage
                                            }
                                            alt={
                                              selectedBooking.listingId.pgName
                                            }
                                            width={96}
                                            height={96}
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                        <div>
                                          <h3 className="font-semibold text-lg">
                                            {selectedBooking.listingId.pgName}
                                          </h3>
                                          <p className="text-gray-600">
                                            {
                                              selectedBooking.listingId.location
                                                .area
                                            }
                                            ,{" "}
                                            {
                                              selectedBooking.listingId.location
                                                .city
                                            }
                                          </p>
                                        </div>
                                      </div>

                                      {/* Booking Details */}
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <label className="text-sm font-medium text-gray-500">
                                            Room Type
                                          </label>
                                          <p className="font-medium">
                                            {selectedBooking.roomType}
                                          </p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium text-gray-500">
                                            Duration
                                          </label>
                                          <p className="font-medium">
                                            {selectedBooking.duration} month(s)
                                          </p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium text-gray-500">
                                            Move-in Date
                                          </label>
                                          <p className="font-medium">
                                            {formatDate(
                                              selectedBooking.moveInDate
                                            )}
                                          </p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium text-gray-500">
                                            Amount
                                          </label>
                                          <p className="font-medium text-HG-600">
                                            ₹
                                            {selectedBooking.amount.toLocaleString()}
                                          </p>
                                        </div>
                                      </div>

                                      {/* Personal Information */}
                                      <div>
                                        <h4 className="font-semibold mb-3">
                                          Personal Information
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <label className="text-sm font-medium text-gray-500">
                                              Full Name
                                            </label>
                                            <p className="font-medium">
                                              {selectedBooking.fullName}
                                            </p>
                                          </div>
                                          <div>
                                            <label className="text-sm font-medium text-gray-500">
                                              Phone
                                            </label>
                                            <p className="font-medium">
                                              {selectedBooking.phoneNumber}
                                            </p>
                                          </div>
                                          <div>
                                            <label className="text-sm font-medium text-gray-500">
                                              Email
                                            </label>
                                            <p className="font-medium">
                                              {selectedBooking.email}
                                            </p>
                                          </div>
                                          {selectedBooking.aadhaarNumber && (
                                            <div>
                                              <label className="text-sm font-medium text-gray-500">
                                                Aadhaar
                                              </label>
                                              <p className="font-medium">
                                                {selectedBooking.aadhaarNumber}
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Address */}
                                      <div>
                                        <h4 className="font-semibold mb-3">
                                          Address
                                        </h4>
                                        <p className="text-gray-700">
                                          {selectedBooking.address.street},{" "}
                                          {selectedBooking.address.city},{" "}
                                          {selectedBooking.address.state} -{" "}
                                          {selectedBooking.address.pincode}
                                        </p>
                                      </div>

                                      {/* Additional Requirements */}
                                      {selectedBooking.additionalRequirements && (
                                        <div>
                                          <h4 className="font-semibold mb-3">
                                            Additional Requirements
                                          </h4>
                                          <p className="text-gray-700">
                                            {
                                              selectedBooking.additionalRequirements
                                            }
                                          </p>
                                        </div>
                                      )}

                                      {/* Cash Payment Confirmation */}
                                      {selectedBooking.paymentStatus ===
                                        "pending_cash_payment" && (
                                        <div className="space-y-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                          <h4 className="font-semibold text-yellow-800">
                                            Cash Payment Confirmation
                                          </h4>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                              <label className="text-sm font-medium text-gray-500 mb-2 block">
                                                Payment Proof URL (Optional)
                                              </label>
                                              <input
                                                type="url"
                                                value={cashPaymentProof}
                                                onChange={(e) =>
                                                  setCashPaymentProof(
                                                    e.target.value
                                                  )
                                                }
                                                placeholder="https://example.com/receipt.jpg"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-HG-500 focus:border-transparent"
                                              />
                                            </div>
                                            <div>
                                              <label className="text-sm font-medium text-gray-500 mb-2 block">
                                                Collected By
                                              </label>
                                              <input
                                                type="text"
                                                value={cashCollectedBy}
                                                onChange={(e) =>
                                                  setCashCollectedBy(
                                                    e.target.value
                                                  )
                                                }
                                                placeholder="Your name"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-HG-500 focus:border-transparent"
                                              />
                                            </div>
                                          </div>
                                          <Button
                                            onClick={() =>
                                              handleCashPaymentConfirmation(
                                                selectedBooking._id
                                              )
                                            }
                                            disabled={
                                              actionLoading ===
                                              selectedBooking._id
                                            }
                                            className="w-full bg-green-600 hover:bg-green-700"
                                          >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Confirm Cash Collection
                                          </Button>
                                        </div>
                                      )}

                                      {/* Owner Notes */}
                                      <div>
                                        <label className="text-sm font-medium text-gray-500 mb-2 block">
                                          Owner Notes (Optional)
                                        </label>
                                        <Textarea
                                          value={ownerNotes}
                                          onChange={(e) =>
                                            setOwnerNotes(e.target.value)
                                          }
                                          placeholder="Add any notes for the tenant..."
                                          rows={3}
                                        />
                                      </div>

                                      {/* Action Buttons */}
                                      <div className="flex gap-3 pt-4 border-t">
                                        {selectedBooking.status ===
                                          "pending" && (
                                          <>
                                            <Button
                                              onClick={() =>
                                                handleBookingAction(
                                                  selectedBooking._id,
                                                  "confirmed"
                                                )
                                              }
                                              disabled={
                                                actionLoading ===
                                                selectedBooking._id
                                              }
                                              className="flex-1 bg-green-600 hover:bg-green-700"
                                            >
                                              <CheckCircle className="w-4 h-4 mr-2" />
                                              Approve Booking
                                            </Button>
                                            <Button
                                              onClick={() =>
                                                handleBookingAction(
                                                  selectedBooking._id,
                                                  "rejected"
                                                )
                                              }
                                              disabled={
                                                actionLoading ===
                                                selectedBooking._id
                                              }
                                              variant="destructive"
                                              className="flex-1"
                                            >
                                              <XCircle className="w-4 h-4 mr-2" />
                                              Reject Booking
                                            </Button>
                                            <Button
                                              onClick={() =>
                                                handleDeleteBooking(
                                                  selectedBooking._id
                                                )
                                              }
                                              disabled={
                                                actionLoading ===
                                                selectedBooking._id
                                              }
                                              variant="outline"
                                              className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                                            >
                                              <Trash2 className="w-4 h-4 mr-2" />
                                              Delete Request
                                            </Button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
          <div className="text-xs sm:text-sm text-gray-600">
            Page {currentPage} of {totalPages} ({total} total requests)
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="text-xs sm:text-sm"
            >
              <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum =
                  Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                if (pageNum > totalPages) return null;
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-8 h-8 p-0 text-xs sm:text-sm"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="text-xs sm:text-sm"
            >
              Next
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
