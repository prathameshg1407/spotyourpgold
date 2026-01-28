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

// User Bookings Section Component
const UserBookingsSection = ({ userId }: { userId?: string }) => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBooking, setEditingBooking] = useState<any>(null);
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
        setBookings(response.data.data);
      }
    } catch (error) {
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

  const handleEditBooking = (booking: any) => {
    setEditingBooking(booking);
    setEditForm({
      fullName: booking.fullName,
      phoneNumber: booking.phoneNumber,
      email: booking.email,
      address: booking.address,
      aadhaarNumber: booking.aadhaarNumber,
      additionalRequirements: booking.additionalRequirements,
      moveInDate: new Date(booking.moveInDate).toISOString().split("T")[0],
      duration: booking.duration,
      roomType: booking.roomType,
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusMessage = (status: string, paymentStatus: string) => {
    switch (status) {
      case "pending":
        return "Awaiting owner approval";
      case "confirmed":
        switch (paymentStatus) {
          case "pending":
            return "Approved! Mark as cash payment to proceed";
          case "pending_cash_payment":
            return "Cash payment pending - Owner will collect payment";
          case "completed_cash":
            return "Cash payment confirmed - Awaiting admin verification";
          case "failed":
            return "Payment failed - Contact support";
          default:
            return "Booking confirmed";
        }
      case "rejected":
        return "Booking request rejected";
      case "cancelled":
        return "Booking cancelled";
      case "completed":
        return "Stay completed";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl bg-white">
        <CardHeader>
          <CardTitle className="text-HG-500 font-semibold">
            My Bookings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-HG-500"></div>
            <span className="ml-2 text-muted-foreground">
              Loading bookings...
            </span>
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
          <div className="text-center py-8">
            <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No bookings found</p>
            <p className="text-sm text-gray-400">
              Start by booking a PG from our listings
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking._id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">
                        {booking.listingId?.pgName}
                      </h3>
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {getStatusMessage(booking.status, booking.paymentStatus)}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p>
                          <span className="font-medium">Room Type:</span>{" "}
                          {booking.roomType}
                        </p>
                        <p>
                          <span className="font-medium">Move-in Date:</span>{" "}
                          {new Date(booking.moveInDate).toLocaleDateString()}
                        </p>
                        <p>
                          <span className="font-medium">Duration:</span>{" "}
                          {booking.duration} month(s)
                        </p>
                      </div>
                      <div>
                        <p>
                          <span className="font-medium">Amount:</span> ₹
                          {booking.amount.toLocaleString()}
                        </p>
                        <p>
                          <span className="font-medium">Security Deposit:</span>{" "}
                          ₹{booking.securityDeposit.toLocaleString()}
                        </p>
                        <p>
                          <span className="font-medium">Payment Status:</span>{" "}
                          {booking.paymentStatus}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 text-sm">
                      <p>
                        <span className="font-medium">Contact:</span>{" "}
                        {booking.fullName} - {booking.phoneNumber}
                      </p>
                      <p>
                        <span className="font-medium">Email:</span>{" "}
                        {booking.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {booking.status === "confirmed" &&
                      booking.paymentStatus === "pending" && (
                        <Button
                          onClick={async () => {
                            try {
                              const response = await axios.post(
                                `/api/booking/${booking._id}/cash-payment`
                              );
                              if (response.data.success) {
                                toast.success(
                                  "Booking marked for cash payment"
                                );
                                fetchBookings();
                              }
                            } catch (error) {
                              toast.error("Failed to mark cash payment");
                            }
                          }}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Mark as Cash Payment
                        </Button>
                      )}
                    {booking.status === "pending" && (
                      <Button
                        onClick={() => handleDeleteBooking(booking._id)}
                        variant="outline"
                        size="sm"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete Request
                      </Button>
                    )}
                    <Button
                      onClick={() => handleEditBooking(booking)}
                      variant="outline"
                      size="sm"
                      className="border-HG-500 text-HG-500 hover:bg-HG-50"
                    >
                      Edit Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Modal */}
        {editingBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Edit Booking Details
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={editForm.fullName}
                        onChange={(e) =>
                          setEditForm({ ...editForm, fullName: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-HG-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={editForm.phoneNumber}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            phoneNumber: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-HG-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) =>
                        setEditForm({ ...editForm, email: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-HG-500 focus:border-transparent"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Move-in Date
                      </label>
                      <input
                        type="date"
                        value={editForm.moveInDate}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            moveInDate: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-HG-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Duration (Months)
                      </label>
                      <select
                        value={editForm.duration}
                        onChange={(e) =>
                          setEditForm({ ...editForm, duration: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-HG-500 focus:border-transparent"
                      >
                        <option value="1">1 Month</option>
                        <option value="3">3 Months</option>
                        <option value="6">6 Months</option>
                        <option value="12">12 Months</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Room Type
                      </label>
                      <select
                        value={editForm.roomType}
                        onChange={(e) =>
                          setEditForm({ ...editForm, roomType: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-HG-500 focus:border-transparent"
                      >
                        {editingBooking?.listingId?.roomTypes?.map(
                          (room: any, index: number) => (
                            <option key={index} value={room.type}>
                              {room.type} - ₹{room.monthlyRent}/month
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Street Address
                      </label>
                      <input
                        type="text"
                        value={editForm.address.street}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            address: {
                              ...editForm.address,
                              street: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-HG-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={editForm.address.city}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            address: {
                              ...editForm.address,
                              city: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-HG-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        value={editForm.address.state}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            address: {
                              ...editForm.address,
                              state: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-HG-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Pincode
                      </label>
                      <input
                        type="text"
                        value={editForm.address.pincode}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            address: {
                              ...editForm.address,
                              pincode: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-HG-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Aadhaar Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={editForm.aadhaarNumber}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          aadhaarNumber: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-HG-500 focus:border-transparent"
                      placeholder="Enter 12-digit Aadhaar number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-HG-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
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
          </div>
        )}
      </CardContent>
    </Card>
  );
};

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

    const res = await axios.post("/api/admin/ad", {
      title: adminAd,
    });
    if (res?.data?.success) {
      toast.success("Ad submitted successfully");
      setAdminAd("");
    } else {
      toast.error("Failed to submit ad");
    }
  };

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
      <div className="grid gap-4 md:gap-8 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl p-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-black font-inter">
                My Bookings
              </p>
              <h2 className="text-3xl font-poppins font-semibold text-HG-500">
                {userStats.totalBookings}
              </h2>
              <p className="text-xs text-muted-foreground font-inter">
                Total bookings
              </p>
            </div>
            <div className="p-2 rounded-full bg-golden/10 text-HG-500">
              <Home className="md:h-8 md:w-8" />
            </div>
          </div>
        </Card>

        <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl p-4 bg-white">
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
            <div className="p-2 rounded-full bg-golden/10 text-HG-500">
              <Heart className="md:h-8 md:w-8" />
            </div>
          </div>
        </Card>

        <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl p-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-black font-inter">
                Reviews Given
              </p>
              <h2 className="text-3xl font-poppins font-semibold text-HG-500">
                {userStats.totalReviews}
              </h2>
              <p className="text-xs text-muted-foreground font-inter">
                Your feedback
              </p>
            </div>
            <div className="p-2 rounded-full bg-golden/10 text-HG-500">
              <Star className="md:h-8 md:w-8" />
            </div>
          </div>
        </Card>

        <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl p-4 bg-white">
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
            <div className="p-2 rounded-full bg-golden/10 text-HG-500">
              <Calendar className="md:h-8 md:w-8" />
            </div>
          </div>
        </Card>
      </div>

      {/* Bookings Section */}
      <UserBookingsSection userId={user?.id} />
    </div>
  );

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
      <div className="grid gap-4 md:gap-8 md:grid-cols-3 ">
        <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl p-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-black font-inter">
                Total Listings
              </p>
              <h2 className="text-3xl font-poppins font-semibold text-HG-500">
                {ownerStats.totalListings}
              </h2>
              <p className="text-xs text-muted-foreground  font-inter">
                Active PG listings
              </p>
            </div>
            <div className="p-2 rounded-full bg-golden/10 text-HG-500">
              <Building className="md:h-8 md:w-8 " />
            </div>
          </div>
        </Card>

        <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl p-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-black font-inter">
                Monthly Revenue
              </p>
              <h2 className="text-3xl font-poppins font-semibold text-HG-500">
                ₹{ownerStats.monthlyRevenue.toLocaleString()}
              </h2>
              <p className="text-xs text-muted-foreground font-inter">
                This month&apos;s earnings
              </p>
            </div>
            <div className="p-2 rounded-full bg-golden/10 text-HG-500">
              <DollarSign className="md:h-8 md:w-8" />
            </div>
          </div>
        </Card>

        <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl p-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-black font-inter">
                Total Revenue
              </p>
              <h2 className="text-3xl font-poppins font-semibold text-HG-500">
                ₹{ownerStats.totalRevenue?.toLocaleString() || 0}
              </h2>
              <p className="text-xs text-muted-foreground font-inter">
                All time earnings
              </p>
            </div>
            <div className="p-2 rounded-full bg-golden/10 text-HG-500">
              <TrendingUp className="md:h-8 md:w-8" />
            </div>
          </div>
        </Card>

        <Link href="/routes/dashboard/owners/visit-requests">
          <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl p-4 bg-white hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-black font-inter">
                  Visit Requests
                </p>
                <h2 className="text-3xl font-poppins font-semibold text-HG-500">
                  {ownerStats.pendingVisitRequests}
                </h2>
                <p className="text-xs text-muted-foreground font-inter">
                  Pending requests
                </p>
              </div>
              <div className="p-2 rounded-full bg-golden/10 text-HG-500">
                <Calendar className="md:h-8 md:w-8" />
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/routes/dashboard/owners/booking-requests">
          <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl p-4 bg-white hover:shadow-lg transition-shadow cursor-pointer">
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
              <div className="p-2 rounded-full bg-golden/10 text-HG-500">
                <CheckCircle className="md:h-8 md:w-8" />
              </div>
            </div>
          </Card>
        </Link>

        <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl p-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-black font-inter">
                Average Rating
              </p>
              <h2 className="text-3xl font-poppins font-semibold text-HG-500">
                {ownerStats.averageRating}
              </h2>
              <p className="text-xs text-muted-foreground font-inter">
                From {ownerStats.totalReviews} reviews
              </p>
            </div>
            <div className="p-2 rounded-full bg-golden/10 text-HG-500">
              <Star className="md:h-8 md:w-8" />
            </div>
          </div>
        </Card>

        <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl p-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-black font-inter">
                Wishlist Count
              </p>
              <h2 className="text-3xl font-poppins font-semibold text-HG-500">
                {ownerStats.totalWishlist}
              </h2>
              <p className="text-xs text-muted-foreground font-inter">
                People saved your listings
              </p>
            </div>
            <div className="p-2 rounded-full bg-golden/10 text-HG-500">
              <Heart className="md:h-8 md:w-8" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

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
      <div className="grid gap-4 md:gap-8 md:grid-cols-3">
        {/* Total Users */}
        <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl p-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-black font-inter">
                Total Users
              </p>
              <h2 className="text-3xl font-poppins font-semibold text-HG-500">
                {adminStats.totalUsers}
              </h2>
              <p className="text-xs text-muted-foreground font-inter">
                Registered users
              </p>
            </div>
            <div className="p-2 rounded-full bg-golden/10 text-HG-500">
              <Users className="md:h-8 md:w-8" />
            </div>
          </div>
        </Card>

        {/* Total Owners */}
        <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl p-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-black font-inter">
                Total Owners
              </p>
              <h2 className="text-3xl font-poppins font-semibold text-HG-500">
                {adminStats.totalOwners}
              </h2>
              <p className="text-xs text-muted-foreground font-inter">
                Verified owners
              </p>
            </div>
            <div className="p-2 rounded-full bg-golden/10 text-HG-500">
              <UserCheck className="md:h-8 md:w-8" />
            </div>
          </div>
        </Card>

        {/* Total Listings */}
        <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl p-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-black font-inter">
                Total Listings
              </p>
              <h2 className="text-3xl font-poppins font-semibold text-HG-500">
                {adminStats.totalListings}
              </h2>
              <p className="text-xs text-muted-foreground font-inter">
                Active PG listings
              </p>
            </div>
            <div className="p-2 rounded-full bg-golden/10 text-HG-500">
              <Building2 className="md:h-8 md:w-8" />
            </div>
          </div>
        </Card>

        {/* Pending Requests */}
        <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl p-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-black font-inter">
                Pending Requests
              </p>
              <h2 className="text-3xl font-poppins font-semibold text-HG-500">
                {adminStats.pendingRequests}
              </h2>
              <p className="text-xs text-muted-foreground font-inter">
                Awaiting approval
              </p>
            </div>
            <div className="p-2 rounded-full bg-golden/10 text-HG-500">
              <Clock className="md:h-8 md:w-8" />
            </div>
          </div>
        </Card>

        {/* Monthly Revenue */}
        <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl p-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-black font-inter">
                Monthly Revenue
              </p>
              <h2 className="text-3xl font-poppins font-semibold text-HG-500">
                ₹{adminStats.monthlyRevenue.toLocaleString()}
              </h2>
              <p className="text-xs text-muted-foreground font-inter">
                Platform earnings
              </p>
            </div>
            <div className="p-2 rounded-full bg-golden/10 text-HG-500">
              <TrendingUp className="md:h-8 md:w-8" />
            </div>
          </div>
        </Card>

        {/* Featured Listings */}
        <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl p-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-black font-inter">
                Featured Listings
              </p>
              <h2 className="text-3xl font-poppins font-semibold text-HG-500">
                {adminStats.featuredListings}
              </h2>
              <p className="text-xs text-muted-foreground font-inter">
                Premium placements
              </p>
            </div>
            <div className="p-2 rounded-full bg-golden/10 text-HG-500">
              <Award className="md:h-8 md:w-8" />
            </div>
          </div>
        </Card>
      </div>

      {/* Ad Management Section */}
      <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl bg-white w-full">
        <CardHeader>
          <CardTitle className="text-HG-500 font-semibold">
            Ad Management
          </CardTitle>
          <CardDescription>
            Add a promotional ad to display on the platform
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

            <div className=" w-full flex justify-end">
              <Button type="submit" className=" hover:opacity-90 px-8">
                Submit Ad
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 md:pt-5">
        <h1 className="text-2xl md:text-4xl font-bold tracking-tight font-poppins">
          Welcome back, <br className="md:hidden block" />{" "}
          <span className="text-HG-500">{user?.fullName}</span>
        </h1>
        <p className="text-muted-foreground text-sm md:text-lg font-inter">
          {userRole === "user" && "Here's your PG booking overview"}
          {userRole === "owner" &&
            "Manage your PG listings and track performance"}
          {userRole === "admin" && "Monitor platform activity and manage users"}
        </p>
      </div>

      {userRole === "user" && renderUserDashboard()}
      {userRole === "owner" && renderOwnerDashboard()}
      {userRole === "admin" && renderAdminDashboard()}
    </div>
  );
}