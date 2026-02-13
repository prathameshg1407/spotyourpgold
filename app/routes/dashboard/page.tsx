"use client";

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
  Users,
  Building,
  Calendar,
  Star,
  Heart,
  BarChart3,
  Crown,
  UserCheck,
  Building2,
  TrendingUp,
  CheckCircle,
  XCircle,
  DollarSign,
  Home,
  Clock,
  Award,
  Pin,
  Trash2,
  CreditCard,
  Banknote,
  MapPin,
  Phone,
  Mail,
  Eye,
  Edit,
  X,
} from "lucide-react";
import {
  getUserStats,
  getOwnerStats,
  getAdminStats,
  UserRole,
} from "@/app/routes/dashboard/dashboard";
import Link from "next/link";
import { useUserStore } from "@/store/userStore";
import { FormInput } from "../auth/form-input";
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";

// ============ INTERFACES ============
interface BookingAddress {
  street: string;
  city: string;
  state: string;
  pincode: string;
}

interface BookingFee {
  amount: number;
  status: string;
  paidAt?: string | null;
  ownerCommissionStatus?: string;
}

interface SecurityDeposit {
  amount: number;
  status: string;
  transferredToOwner?: boolean;
}

interface FirstMonthRent {
  amount: number;
  status: string;
  ownerPayoutStatus?: string;
}

interface ListingInfo {
  _id: string;
  pgName: string;
  location?: {
    area: string;
    city: string;
  };
  primaryImage?: string;
  roomTypes?: Array<{
    type: string;
    monthlyRent: number;
  }>;
}

interface OwnerInfo {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
}

interface Booking {
  _id: string;
  userId?: string;
  listingId?: ListingInfo;
  ownerId?: OwnerInfo;
  roomType: string;
  moveInDate: string;
  duration: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  address: BookingAddress;
  aadhaarNumber?: string;
  additionalRequirements?: string;
  status: string;
  paymentMethod: "cash" | "online";
  monthlyRent?: number;
  bookingFee?: BookingFee;
  securityDeposit?: SecurityDeposit;
  firstMonthRent?: FirstMonthRent;
  totalPaid?: number;
  totalDue?: number;
  // Legacy fields (for backward compatibility)
  amount?: number;
  paymentStatus?: string;
  cashCollectedAt?: string | null;
  adminVerifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============ HELPER FUNCTIONS ============
const formatCurrency = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null) return "N/A";
  return `₹${amount.toLocaleString("en-IN")}`;
};

const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// ============ USER BOOKINGS SECTION COMPONENT ============
const UserBookingsSection = ({ userId }: { userId?: string }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    address: {
      street: "",
      city: "",
      state: "",
      pincode: "",
    },
    aadhaarNumber: "",
    additionalRequirements: "",
    moveInDate: "",
    duration: "",
    roomType: "",
  });

  useEffect(() => {
    if (userId) {
      fetchBookings();
    }
  }, [userId]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/booking?userId=${userId}`);
      if (response.data.success) {
        setBookings(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    try {
      const response = await axios.delete(`/api/booking/${bookingId}`);
      if (response.data.success) {
        toast.success("Booking request deleted successfully");
        fetchBookings();
      }
    } catch (error) {
      toast.error("Failed to delete booking request");
    }
  };

  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    setEditForm({
      fullName: booking.fullName || "",
      phoneNumber: booking.phoneNumber || "",
      email: booking.email || "",
      address: {
        street: booking.address?.street || "",
        city: booking.address?.city || "",
        state: booking.address?.state || "",
        pincode: booking.address?.pincode || "",
      },
      aadhaarNumber: booking.aadhaarNumber || "",
      additionalRequirements: booking.additionalRequirements || "",
      moveInDate: booking.moveInDate
        ? new Date(booking.moveInDate).toISOString().split("T")[0]
        : "",
      duration: booking.duration || "",
      roomType: booking.roomType || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingBooking) return;

    try {
      const response = await axios.put(
        `/api/booking/${editingBooking._id}`,
        editForm
      );
      if (response.data.success) {
        toast.success("Booking updated successfully");
        setEditingBooking(null);
        fetchBookings();
      } else {
        toast.error("Failed to update booking");
      }
    } catch (error) {
      toast.error("Failed to update booking");
    }
  };

  const handleMarkCashPayment = async (bookingId: string) => {
    try {
      const response = await axios.post(`/api/booking/${bookingId}/cash-payment`);
      if (response.data.success) {
        toast.success("Booking marked for cash payment");
        fetchBookings();
      }
    } catch (error) {
      toast.error("Failed to mark cash payment");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "active":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "rejected":
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "completed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    if (method === "online") {
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
          <CreditCard className="w-3 h-3 mr-1" />
          Online
        </Badge>
      );
    }
    return (
      <Badge className="bg-orange-100 text-orange-800 border-orange-200">
        <Banknote className="w-3 h-3 mr-1" />
        Cash
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string | undefined) => {
    const statusValue = status?.toLowerCase() || "pending";
    const config: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      paid: "bg-green-100 text-green-800 border-green-200",
      failed: "bg-red-100 text-red-800 border-red-200",
      refunded: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return (
      <Badge className={config[statusValue] || config.pending}>
        {statusValue.charAt(0).toUpperCase() + statusValue.slice(1)}
      </Badge>
    );
  };

  const getStatusMessage = (booking: Booking) => {
    const status = booking.status?.toLowerCase();
    const paymentStatus = booking.bookingFee?.status?.toLowerCase() || booking.paymentStatus?.toLowerCase() || "pending";

    switch (status) {
      case "pending":
        return "Awaiting owner approval";
      case "confirmed":
        switch (paymentStatus) {
          case "pending":
            return booking.paymentMethod === "cash"
              ? "Approved! Cash payment will be collected by owner"
              : "Approved! Complete payment to proceed";
          case "paid":
            return "Payment completed - Booking confirmed";
          case "failed":
            return "Payment failed - Please retry or contact support";
          default:
            return "Booking confirmed";
        }
      case "active":
        return "You have moved in - Enjoy your stay!";
      case "rejected":
        return "Booking request rejected by owner";
      case "cancelled":
        return "Booking cancelled";
      case "completed":
        return "Stay completed - Thank you for choosing us!";
      default:
        return status || "Unknown status";
    }
  };

  // Get total amount (supporting both old and new structure)
  const getTotalAmount = (booking: Booking): number => {
    if (booking.totalDue !== undefined) return booking.totalDue;
    if (booking.amount !== undefined) return booking.amount;
    
    // Calculate from parts if available
    const bookingFee = booking.bookingFee?.amount || 0;
    const securityDeposit = booking.securityDeposit?.amount || 0;
    const firstMonthRent = booking.firstMonthRent?.amount || 0;
    
    if (bookingFee || securityDeposit || firstMonthRent) {
      return bookingFee + securityDeposit + firstMonthRent;
    }
    
    return 0;
  };

  // Get paid amount
  const getPaidAmount = (booking: Booking): number => {
    if (booking.totalPaid !== undefined) return booking.totalPaid;
    return 0;
  };

  // Get security deposit
  const getSecurityDeposit = (booking: Booking): number => {
    if (booking.securityDeposit?.amount !== undefined) return booking.securityDeposit.amount;
    if (typeof booking.securityDeposit === "number") return booking.securityDeposit;
    return 0;
  };

  // Check if can show cash payment button
  const canShowCashPaymentButton = (booking: Booking): boolean => {
    const status = booking.status?.toLowerCase();
    const paymentStatus = booking.bookingFee?.status?.toLowerCase() || booking.paymentStatus?.toLowerCase() || "pending";
    return status === "confirmed" && paymentStatus === "pending" && booking.paymentMethod === "cash";
  };

  // Check if can delete booking
  const canDeleteBooking = (booking: Booking): boolean => {
    const status = booking.status?.toLowerCase();
    return status === "pending";
  };

  if (loading) {
    return (
      <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl bg-white">
        <CardHeader>
          <CardTitle className="text-HG-500 font-semibold">My Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-HG-500"></div>
            <span className="ml-2 text-muted-foreground">Loading bookings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl bg-white">
      <CardHeader>
        <CardTitle className="text-HG-500 font-semibold">My Bookings</CardTitle>
        <CardDescription>
          Manage your PG bookings and personal details
        </CardDescription>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Home className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Bookings Found</h3>
            <p className="text-gray-500 mb-4">Start by booking a PG from our listings</p>
            <Link href="/listings">
              <Button className="bg-HG-500 hover:bg-HG-600">
                Browse Listings
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking._id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    {/* Header with PG Name and Status */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <h3 className="font-semibold text-lg text-gray-900">
                        {booking.listingId?.pgName || "PG Name Not Available"}
                      </h3>
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1) || "Unknown"}
                      </Badge>
                      {getPaymentMethodBadge(booking.paymentMethod)}
                    </div>

                    {/* Status Message */}
                    <div className="flex items-center gap-2 mb-4">
                      {booking.status === "pending" && <Clock className="h-4 w-4 text-yellow-600" />}
                      {booking.status === "confirmed" && <CheckCircle className="h-4 w-4 text-green-600" />}
                      {booking.status === "active" && <CheckCircle className="h-4 w-4 text-blue-600" />}
                      {(booking.status === "rejected" || booking.status === "cancelled") && (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <p className="text-sm text-gray-600">{getStatusMessage(booking)}</p>
                    </div>

                    {/* Booking Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      {/* Room Details */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-700 flex items-center gap-1">
                          <Building className="h-4 w-4" />
                          Room Details
                        </h4>
                        <p>
                          <span className="text-gray-500">Room Type:</span>{" "}
                          <span className="font-medium">{booking.roomType}</span>
                        </p>
                        <p>
                          <span className="text-gray-500">Move-in:</span>{" "}
                          <span className="font-medium">{formatDate(booking.moveInDate)}</span>
                        </p>
                        <p>
                          <span className="text-gray-500">Duration:</span>{" "}
                          <span className="font-medium">{booking.duration} month(s)</span>
                        </p>
                        {booking.monthlyRent && (
                          <p>
                            <span className="text-gray-500">Monthly Rent:</span>{" "}
                            <span className="font-medium">{formatCurrency(booking.monthlyRent)}</span>
                          </p>
                        )}
                      </div>

                      {/* Payment Details */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-700 flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          Payment Details
                        </h4>
                        <p>
                          <span className="text-gray-500">Total Amount:</span>{" "}
                          <span className="font-bold text-gray-900">
                            {formatCurrency(getTotalAmount(booking))}
                          </span>
                        </p>
                        <p>
                          <span className="text-gray-500">Amount Paid:</span>{" "}
                          <span className="font-medium text-green-600">
                            {formatCurrency(getPaidAmount(booking))}
                          </span>
                        </p>
                        {getSecurityDeposit(booking) > 0 && (
                          <p>
                            <span className="text-gray-500">Security Deposit:</span>{" "}
                            <span className="font-medium">
                              {formatCurrency(getSecurityDeposit(booking))}
                            </span>
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Payment Status:</span>
                          {getPaymentStatusBadge(booking.bookingFee?.status || booking.paymentStatus)}
                        </div>
                      </div>

                      {/* Contact Details */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-700 flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          Contact Details
                        </h4>
                        <p>
                          <span className="text-gray-500">Name:</span>{" "}
                          <span className="font-medium">{booking.fullName}</span>
                        </p>
                        <p className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span className="font-medium">{booking.phoneNumber}</span>
                        </p>
                        <p className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <span className="font-medium text-xs md:text-sm truncate">
                            {booking.email}
                          </span>
                        </p>
                        {booking.address && (
                          <p className="flex items-start gap-1">
                            <MapPin className="h-3 w-3 text-gray-400 mt-0.5" />
                            <span className="text-xs">
                              {booking.address.city}, {booking.address.state}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Owner Info */}
                    {booking.ownerId && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="font-medium text-gray-700 mb-2 text-sm">Owner Contact</h4>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Building className="h-3 w-3 text-gray-400" />
                            {booking.ownerId.fullName}
                          </span>
                          {booking.ownerId.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-gray-400" />
                              {booking.ownerId.phone}
                            </span>
                          )}
                          {booking.ownerId.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-gray-400" />
                              {booking.ownerId.email}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap lg:flex-col gap-2 lg:min-w-[140px]">
                    {canShowCashPaymentButton(booking) && (
                      <Button
                        onClick={() => handleMarkCashPayment(booking._id)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Banknote className="w-4 h-4 mr-1" />
                        Mark Cash Payment
                      </Button>
                    )}

                    {canDeleteBooking(booking) && (
                      <Button
                        onClick={() => handleDeleteBooking(booking._id)}
                        variant="outline"
                        size="sm"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Cancel Request
                      </Button>
                    )}

                    <Button
                      onClick={() => handleEditBooking(booking)}
                      variant="outline"
                      size="sm"
                      className="border-HG-500 text-HG-500 hover:bg-HG-50"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit Details
                    </Button>

                    {booking.listingId?._id && (
                      <Link href={`/listing/${booking.listingId._id}`}>
                        <Button variant="ghost" size="sm" className="w-full">
                          <Eye className="w-4 h-4 mr-1" />
                          View Listing
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Booking ID Footer */}
                <div className="mt-4 pt-3 border-t text-xs text-gray-400 flex justify-between">
                  <span>Booking ID: {booking._id}</span>
                  <span>Created: {formatDate(booking.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Modal */}
        {editingBooking && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Edit Booking Details</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingBooking(null)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="p-6 space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-gray-600">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={editForm.fullName}
                        onChange={(e) =>
                          setEditForm({ ...editForm, fullName: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-HG-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-gray-600">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={editForm.phoneNumber}
                        onChange={(e) =>
                          setEditForm({ ...editForm, phoneNumber: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-HG-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-1.5 text-gray-600">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) =>
                        setEditForm({ ...editForm, email: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-HG-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Booking Details */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Booking Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-gray-600">
                        Move-in Date
                      </label>
                      <input
                        type="date"
                        value={editForm.moveInDate}
                        onChange={(e) =>
                          setEditForm({ ...editForm, moveInDate: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-HG-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-gray-600">
                        Duration (Months)
                      </label>
                      <select
                        value={editForm.duration}
                        onChange={(e) =>
                          setEditForm({ ...editForm, duration: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-HG-500 focus:border-transparent transition-all"
                      >
                        <option value="1">1 Month</option>
                        <option value="3">3 Months</option>
                        <option value="6">6 Months</option>
                        <option value="12">12 Months</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-gray-600">
                        Room Type
                      </label>
                      <select
                        value={editForm.roomType}
                        onChange={(e) =>
                          setEditForm({ ...editForm, roomType: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-HG-500 focus:border-transparent transition-all"
                      >
                        {editingBooking?.listingId?.roomTypes?.map(
                          (room: any, index: number) => (
                            <option key={index} value={room.type}>
                              {room.type} - ₹{room.monthlyRent?.toLocaleString()}/month
                            </option>
                          )
                        ) || (
                          <option value={editForm.roomType}>{editForm.roomType}</option>
                        )}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Address</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1.5 text-gray-600">
                        Street Address
                      </label>
                      <input
                        type="text"
                        value={editForm.address.street}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            address: { ...editForm.address, street: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-HG-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-gray-600">
                        City
                      </label>
                      <input
                        type="text"
                        value={editForm.address.city}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            address: { ...editForm.address, city: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-HG-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-gray-600">
                        State
                      </label>
                      <input
                        type="text"
                        value={editForm.address.state}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            address: { ...editForm.address, state: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-HG-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-gray-600">
                        Pincode
                      </label>
                      <input
                        type="text"
                        value={editForm.address.pincode}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            address: { ...editForm.address, pincode: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-HG-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Additional Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-gray-600">
                        Aadhaar Number (Optional)
                      </label>
                      <input
                        type="text"
                        value={editForm.aadhaarNumber}
                        onChange={(e) =>
                          setEditForm({ ...editForm, aadhaarNumber: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-HG-500 focus:border-transparent transition-all"
                        placeholder="Enter 12-digit Aadhaar number"
                        maxLength={12}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-gray-600">
                        Additional Requirements
                      </label>
                      <textarea
                        value={editForm.additionalRequirements}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            additionalRequirements: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-HG-500 focus:border-transparent transition-all resize-none"
                        rows={3}
                        placeholder="Any special requirements or notes..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex gap-3">
                <Button
                  onClick={handleSaveEdit}
                  className="flex-1 bg-HG-500 hover:bg-HG-600 text-white"
                >
                  Save Changes
                </Button>
                <Button
                  onClick={() => setEditingBooking(null)}
                  variant="outline"
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ============ MAIN DASHBOARD COMPONENT ============
export default function DashboardPage() {
  const { user } = useUserStore();
  const userRole = user?.role as UserRole;

  // Get real-time metrics from API
  const { metrics, loading, error } = useDashboardMetrics(
    userRole || "",
    user?.id
  );

  // Fallback to mock data if API fails
  const ownerStats =
    metrics && userRole === "owner" ? (metrics as any) : getOwnerStats();
  const adminStats =
    metrics && userRole === "admin" ? (metrics as any) : getAdminStats();
  const userStats =
    metrics && userRole === "user" ? (metrics as any) : getUserStats();

  const [adminAd, setAdminAd] = useState("");

  const handleAdSubmit = async (e: any) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const res = await axios.post("/api/admin/ad", {
        title: adminAd,
      });
      if (res?.data?.success) {
        toast.success("Ad submitted successfully");
        setAdminAd("");
      } else {
        toast.error("Failed to submit ad");
      }
    } catch (error) {
      toast.error("Failed to submit ad");
    }
  };

  // ============ USER DASHBOARD ============
  const renderUserDashboard = () => (
    <div className="space-y-6 pt-4 pb-14">
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-HG-500"></div>
          <span className="ml-2 text-muted-foreground">Loading metrics...</span>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">Error loading metrics: {error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:gap-8 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl p-4 bg-white hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-black font-inter">
                My Bookings
              </p>
              <h2 className="text-3xl font-poppins font-semibold text-HG-500">
                {userStats.totalBookings || 0}
              </h2>
              <p className="text-xs text-muted-foreground font-inter">
                Total bookings
              </p>
            </div>
            <div className="p-3 rounded-full bg-HG-100 text-HG-500">
              <Home className="h-6 w-6 md:h-8 md:w-8" />
            </div>
          </div>
        </Card>

        <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl p-4 bg-white hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-black font-inter">
                Watchlist
              </p>
              <h2 className="text-3xl font-poppins font-semibold text-HG-500">
                {userStats.totalWatchlist || 0}
              </h2>
              <p className="text-xs text-muted-foreground font-inter">
                Saved listings
              </p>
            </div>
            <div className="p-3 rounded-full bg-pink-100 text-pink-500">
              <Heart className="h-6 w-6 md:h-8 md:w-8" />
            </div>
          </div>
        </Card>

        <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl p-4 bg-white hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-black font-inter">
                Reviews Given
              </p>
              <h2 className="text-3xl font-poppins font-semibold text-HG-500">
                {userStats.totalReviews || 0}
              </h2>
              <p className="text-xs text-muted-foreground font-inter">
                Your feedback
              </p>
            </div>
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-500">
              <Star className="h-6 w-6 md:h-8 md:w-8" />
            </div>
          </div>
        </Card>

        <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl p-4 bg-white hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-black font-inter">
                Visit Requests
              </p>
              <h2 className="text-3xl font-poppins font-semibold text-HG-500">
                {userStats.totalVisitRequests || 0}
              </h2>
              <p className="text-xs text-muted-foreground font-inter">
                Property visits
              </p>
            </div>
            <div className="p-3 rounded-full bg-blue-100 text-blue-500">
              <Calendar className="h-6 w-6 md:h-8 md:w-8" />
            </div>
          </div>
        </Card>
      </div>

      {/* Bookings Section */}
      <UserBookingsSection userId={user?.id} />
    </div>
  );

  // ============ OWNER DASHBOARD ============
  const renderOwnerDashboard = () => (
    <div className="space-y-6 pt-4 pb-14">
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-HG-500"></div>
          <span className="ml-2 text-muted-foreground">Loading metrics...</span>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">Error loading metrics: {error}</p>
        </div>
      )}

      <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl p-4 bg-white hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-black font-inter">
                Total Listings
              </p>
              <h2 className="text-3xl font-poppins font-semibold text-HG-500">
                {ownerStats.totalListings || 0}
              </h2>
              <p className="text-xs text-muted-foreground font-inter">
                Active PG listings
              </p>
            </div>
            <div className="p-3 rounded-full bg-HG-100 text-HG-500">
              <Building className="h-6 w-6 md:h-8 md:w-8" />
            </div>
          </div>
        </Card>

        <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl p-4 bg-white hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-black font-inter">
                Monthly Revenue
              </p>
              <h2 className="text-3xl font-poppins font-semibold text-HG-500">
                ₹{(ownerStats.monthlyRevenue || 0).toLocaleString()}
              </h2>
              <p className="text-xs text-muted-foreground font-inter">
                This month&apos;s earnings
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-100 text-green-500">
              <DollarSign className="h-6 w-6 md:h-8 md:w-8" />
            </div>
          </div>
        </Card>

        <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl p-4 bg-white hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-black font-inter">
                Total Revenue
              </p>
              <h2 className="text-3xl font-poppins font-semibold text-HG-500">
                ₹{(ownerStats.totalRevenue || 0).toLocaleString()}
              </h2>
              <p className="text-xs text-muted-foreground font-inter">
                All time earnings
              </p>
            </div>
            <div className="p-3 rounded-full bg-emerald-100 text-emerald-500">
              <TrendingUp className="h-6 w-6 md:h-8 md:w-8" />
            </div>
          </div>
        </Card>

        <Link href="/routes/dashboard/owners/visit-requests">
          <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl p-4 bg-white hover:shadow-xl transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-black font-inter">
                  Visit Requests
                </p>
                <h2 className="text-3xl font-poppins font-semibold text-HG-500">
                  {ownerStats.pendingVisitRequests || 0}
                </h2>
                <p className="text-xs text-muted-foreground font-inter">
                  Pending requests
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 text-blue-500">
                <Calendar className="h-6 w-6 md:h-8 md:w-8" />
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/routes/dashboard/owners/booking-requests">
          <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl p-4 bg-white hover:shadow-xl transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-black font-inter">
                  Booking Requests
                </p>
                <h2 className="text-3xl font-poppins font-semibold text-HG-500">
                  {ownerStats.pendingBookingRequests || 0}
                </h2>
                <p className="text-xs text-muted-foreground font-inter">
                  Awaiting approval
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-100 text-orange-500">
                <CheckCircle className="h-6 w-6 md:h-8 md:w-8" />
              </div>
            </div>
          </Card>
        </Link>

        <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl p-4 bg-white hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-black font-inter">
                Average Rating
              </p>
              <h2 className="text-3xl font-poppins font-semibold text-HG-500">
                {ownerStats.averageRating || "N/A"}
              </h2>
              <p className="text-xs text-muted-foreground font-inter">
                From {ownerStats.totalReviews || 0} reviews
              </p>
            </div>
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-500">
              <Star className="h-6 w-6 md:h-8 md:w-8" />
            </div>
          </div>
        </Card>

        <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl p-4 bg-white hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-black font-inter">
                Wishlist Count
              </p>
              <h2 className="text-3xl font-poppins font-semibold text-HG-500">
                {ownerStats.totalWishlist || 0}
              </h2>
              <p className="text-xs text-muted-foreground font-inter">
                People saved your listings
              </p>
            </div>
            <div className="p-3 rounded-full bg-pink-100 text-pink-500">
              <Heart className="h-6 w-6 md:h-8 md:w-8" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  // ============ ADMIN DASHBOARD ============
  const renderAdminDashboard = () => (
    <div className="space-y-6 pt-4 pb-14">
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-HG-500"></div>
          <span className="ml-2 text-muted-foreground">Loading metrics...</span>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">Error loading metrics: {error}</p>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl p-4 bg-white hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-black font-inter">
                Total Users
              </p>
              <h2 className="text-3xl font-poppins font-semibold text-HG-500">
                {adminStats.totalUsers || 0}
              </h2>
              <p className="text-xs text-muted-foreground font-inter">
                Registered users
              </p>
            </div>
            <div className="p-3 rounded-full bg-blue-100 text-blue-500">
              <Users className="h-6 w-6 md:h-8 md:w-8" />
            </div>
          </div>
        </Card>

        <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl p-4 bg-white hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-black font-inter">
                Total Owners
              </p>
              <h2 className="text-3xl font-poppins font-semibold text-HG-500">
                {adminStats.totalOwners || 0}
              </h2>
              <p className="text-xs text-muted-foreground font-inter">
                Verified owners
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-100 text-green-500">
              <UserCheck className="h-6 w-6 md:h-8 md:w-8" />
            </div>
          </div>
        </Card>

        <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl p-4 bg-white hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-black font-inter">
                Total Listings
              </p>
              <h2 className="text-3xl font-poppins font-semibold text-HG-500">
                {adminStats.totalListings || 0}
              </h2>
              <p className="text-xs text-muted-foreground font-inter">
                Active PG listings
              </p>
            </div>
            <div className="p-3 rounded-full bg-HG-100 text-HG-500">
              <Building2 className="h-6 w-6 md:h-8 md:w-8" />
            </div>
          </div>
        </Card>

        <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl p-4 bg-white hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-black font-inter">
                Pending Requests
              </p>
              <h2 className="text-3xl font-poppins font-semibold text-HG-500">
                {adminStats.pendingRequests || 0}
              </h2>
              <p className="text-xs text-muted-foreground font-inter">
                Awaiting approval
              </p>
            </div>
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-500">
              <Clock className="h-6 w-6 md:h-8 md:w-8" />
            </div>
          </div>
        </Card>

        <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl p-4 bg-white hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-black font-inter">
                Monthly Revenue
              </p>
              <h2 className="text-3xl font-poppins font-semibold text-HG-500">
                ₹{(adminStats.monthlyRevenue || 0).toLocaleString()}
              </h2>
              <p className="text-xs text-muted-foreground font-inter">
                Platform earnings
              </p>
            </div>
            <div className="p-3 rounded-full bg-emerald-100 text-emerald-500">
              <TrendingUp className="h-6 w-6 md:h-8 md:w-8" />
            </div>
          </div>
        </Card>

        <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl p-4 bg-white hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-black font-inter">
                Featured Listings
              </p>
              <h2 className="text-3xl font-poppins font-semibold text-HG-500">
                {adminStats.featuredListings || 0}
              </h2>
              <p className="text-xs text-muted-foreground font-inter">
                Premium placements
              </p>
            </div>
            <div className="p-3 rounded-full bg-purple-100 text-purple-500">
              <Award className="h-6 w-6 md:h-8 md:w-8" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/routes/dashboard/admin/booking-requests">
          <Card className="border border-HG-400/20 shadow-sm rounded-xl p-4 bg-gradient-to-br from-blue-50 to-white hover:shadow-lg transition-all cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Manage Bookings</h3>
                <p className="text-xs text-gray-500">View all booking requests</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/routes/dashboard/admin/users">
          <Card className="border border-HG-400/20 shadow-sm rounded-xl p-4 bg-gradient-to-br from-green-50 to-white hover:shadow-lg transition-all cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Manage Users</h3>
                <p className="text-xs text-gray-500">User management</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/routes/dashboard/admin/listings">
          <Card className="border border-HG-400/20 shadow-sm rounded-xl p-4 bg-gradient-to-br from-purple-50 to-white hover:shadow-lg transition-all cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Building2 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Manage Listings</h3>
                <p className="text-xs text-gray-500">Listing management</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Ad Management Section */}
      <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl bg-white w-full">
        <CardHeader>
          <CardTitle className="text-HG-500 font-semibold flex items-center gap-2">
            <Pin className="h-5 w-5" />
            Ad Management
          </CardTitle>
          <CardDescription>
            Add a promotional ad to display on the platform homepage
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={handleAdSubmit}>
            <FormInput
              id="ad"
              label="Enter Ad"
              type="textarea"
              value={adminAd}
              onChange={(value) => setAdminAd(value)}
              placeholder="Enter the ad to show on home page"
              hasError={false}
              icon={Pin}
            />

            <div className="w-full flex justify-end">
              <Button
                type="submit"
                className="bg-HG-500 hover:bg-HG-600 px-8"
                disabled={!adminAd.trim()}
              >
                Submit Ad
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );

  // ============ MAIN RENDER ============
  return (
    <div className="flex flex-col gap-6">
      {/* Welcome Header */}
      <div className="flex flex-col gap-2 md:pt-5">
        <h1 className="text-2xl md:text-4xl font-bold tracking-tight font-poppins">
          Welcome back, <br className="md:hidden block" />{" "}
          <span className="text-HG-500">{user?.fullName || "User"}</span>
        </h1>
        <p className="text-muted-foreground text-sm md:text-lg font-inter">
          {userRole === "user" && "Here's your PG booking overview"}
          {userRole === "owner" && "Manage your PG listings and track performance"}
          {userRole === "admin" && "Monitor platform activity and manage users"}
        </p>
      </div>

      {/* Role-based Dashboard Content */}
      {userRole === "user" && renderUserDashboard()}
      {userRole === "owner" && renderOwnerDashboard()}
      {userRole === "admin" && renderAdminDashboard()}
    </div>
  );
}