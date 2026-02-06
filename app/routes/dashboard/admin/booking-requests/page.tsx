"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  Trash2,
  Eye,
  Search,
  RefreshCw,
  Building,
  User,
  CreditCard,
  Banknote,
  CheckCircle,
  XCircle,
  AlertCircle,
  IndianRupee,
  Filter,
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
  };
  ownerId: {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
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
  aadhaarNumber?: string;
  additionalRequirements: string;
  status: string;
  paymentMethod: "cash" | "online";
  monthlyRent: number;
  bookingFee: {
    amount: number;
    status: string;
    paidAt: string | null;
    ownerCommissionStatus?: string;
  };
  securityDeposit: {
    amount: number;
    status: string;
    transferredToOwner: boolean;
  };
  firstMonthRent: {
    amount: number;
    status: string;
    ownerPayoutStatus?: string;
  };
  totalPaid: number;
  totalDue: number;
  cashCollectedAt: string | null;
  adminVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  activeBookings: number;
  onlinePayments: number;
  cashPayments: number;
  totalRevenue: number;
}

export default function AdminBookingRequestsPage() {
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");

  // Dialogs
  const [selectedBooking, setSelectedBooking] = useState<BookingRequest | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: "20",
      });

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      if (paymentMethodFilter !== "all") {
        params.append("paymentMethod", paymentMethodFilter);
      }
      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const response = await axios.get(`/api/admin/booking-requests?${params}`);

      if (response.data.success) {
        setBookings(response.data.data);
        setTotal(response.data.total);
        setTotalPages(response.data.totalPages);
        setStats(response.data.stats);
      }
    } catch (error) {
      toast.error("Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, paymentMethodFilter, searchQuery]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchBookings();
  };

  const handleUpdateStatus = async () => {
    if (!selectedBooking || !newStatus) return;

    setProcessing(true);
    try {
      const response = await axios.patch(`/api/admin/booking/${selectedBooking._id}`, {
        status: newStatus,
        adminNotes,
      });

      if (response.data.success) {
        toast.success("Booking status updated");
        setShowStatusDialog(false);
        setSelectedBooking(null);
        setNewStatus("");
        setAdminNotes("");
        fetchBookings();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteBooking = async () => {
    if (!selectedBooking) return;

    setProcessing(true);
    try {
      const response = await axios.delete(`/api/admin/booking/${selectedBooking._id}`);

      if (response.data.success) {
        toast.success("Booking deleted successfully");
        setShowDeleteDialog(false);
        setSelectedBooking(null);
        fetchBookings();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete booking");
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: number) =>
    `₹${amount.toLocaleString("en-IN")}`;

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getStatusBadge = (status: string) => {
    const config: Record<string, { class: string; icon: any }> = {
      pending: { class: "bg-yellow-100 text-yellow-800", icon: Clock },
      confirmed: { class: "bg-blue-100 text-blue-800", icon: CheckCircle },
      active: { class: "bg-green-100 text-green-800", icon: CheckCircle },
      completed: { class: "bg-gray-100 text-gray-800", icon: CheckCircle },
      cancelled: { class: "bg-red-100 text-red-800", icon: XCircle },
    };
    const { class: className, icon: Icon } = config[status] || config.pending;
    return (
      <Badge className={className}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPaymentMethodBadge = (method: string) => {
    if (method === "online") {
      return (
        <Badge className="bg-blue-100 text-blue-800">
          <CreditCard className="w-3 h-3 mr-1" />
          Online
        </Badge>
      );
    }
    return (
      <Badge className="bg-orange-100 text-orange-800">
        <Banknote className="w-3 h-3 mr-1" />
        Cash
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const config: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      paid: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      refunded: "bg-gray-100 text-gray-800",
    };
    return (
      <Badge className={config[status] || config.pending}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-poppins">
            Booking <span className="text-primary">Requests</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Manage all booking requests across the platform
          </p>
        </div>
        <Button variant="outline" onClick={fetchBookings} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-xl font-bold">{stats.totalBookings}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-yellow-600">Pending</p>
              <p className="text-xl font-bold text-yellow-700">{stats.pendingBookings}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-blue-600">Confirmed</p>
              <p className="text-xl font-bold text-blue-700">{stats.confirmedBookings}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-green-600">Active</p>
              <p className="text-xl font-bold text-green-700">{stats.activeBookings}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-blue-600">Online</p>
              <p className="text-xl font-bold">{stats.onlinePayments}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-orange-600">Cash</p>
              <p className="text-xl font-bold">{stats.cashPayments}</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-green-600">Revenue (10%)</p>
              <p className="text-xl font-bold text-green-700">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name, email, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch}>
              <Filter className="h-4 w-4 mr-2" />
              Apply
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      {bookings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Bookings Found
            </h3>
            <p className="text-gray-600">
              Try adjusting your filters or check back later.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                            {booking.listingId?.primaryImage ? (
                              <BlurImage
                                src={booking.listingId.primaryImage}
                                alt={booking.listingId.pgName}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <Building className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {booking.listingId?.pgName || "N/A"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {booking.roomType}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{booking.fullName}</p>
                          <p className="text-xs text-gray-500">{booking.phoneNumber}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">
                            {booking.ownerId?.fullName || "N/A"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {booking.ownerId?.phone || ""}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getPaymentMethodBadge(booking.paymentMethod)}
                          <div className="text-xs text-gray-500">
                            {getPaymentStatusBadge(booking.bookingFee.status)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-bold text-sm">
                            {formatCurrency(booking.totalDue)}
                          </p>
                          <p className="text-xs text-green-600">
                            Paid: {formatCurrency(booking.totalPaid)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(booking.status)}</TableCell>
                      <TableCell>
                        <div className="text-xs text-gray-500">
                          {formatDate(booking.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowDetailDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setNewStatus(booking.status);
                              setShowStatusDialog(true);
                            }}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Page {currentPage} of {totalPages} ({total} total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-6">
              {/* Property & Status */}
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                  {selectedBooking.listingId?.primaryImage ? (
                    <BlurImage
                      src={selectedBooking.listingId.primaryImage}
                      alt={selectedBooking.listingId.pgName}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <Building className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">
                    {selectedBooking.listingId?.pgName || "N/A"}
                  </h3>
                  <p className="text-gray-600 flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {selectedBooking.listingId?.location?.area},{" "}
                    {selectedBooking.listingId?.location?.city}
                  </p>
                  <div className="flex gap-2 mt-2">
                    {getStatusBadge(selectedBooking.status)}
                    {getPaymentMethodBadge(selectedBooking.paymentMethod)}
                  </div>
                </div>
              </div>

              {/* Tenant Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Tenant Details
                  </h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-500">Name:</span> {selectedBooking.fullName}</p>
                    <p><span className="text-gray-500">Email:</span> {selectedBooking.email}</p>
                    <p><span className="text-gray-500">Phone:</span> {selectedBooking.phoneNumber}</p>
                    {selectedBooking.aadhaarNumber && (
                      <p><span className="text-gray-500">Aadhaar:</span> {selectedBooking.aadhaarNumber}</p>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Owner Details
                  </h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-500">Name:</span> {selectedBooking.ownerId?.fullName || "N/A"}</p>
                    <p><span className="text-gray-500">Email:</span> {selectedBooking.ownerId?.email || "N/A"}</p>
                    <p><span className="text-gray-500">Phone:</span> {selectedBooking.ownerId?.phone || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-2">Booking Details</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Room Type</p>
                    <p className="font-medium">{selectedBooking.roomType}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Move-in Date</p>
                    <p className="font-medium">{formatDate(selectedBooking.moveInDate)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Duration</p>
                    <p className="font-medium">{selectedBooking.duration} month(s)</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Monthly Rent</p>
                    <p className="font-medium">{formatCurrency(selectedBooking.monthlyRent)}</p>
                  </div>
                </div>
              </div>

              {/* Payment Breakdown */}
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold mb-3">Payment Breakdown</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Booking Fee (10%)</p>
                      <p className="text-xs text-gray-500">
                        {selectedBooking.paymentMethod === "online"
                          ? "Admin Revenue"
                          : "Owner owes Admin"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(selectedBooking.bookingFee.amount)}</p>
                      {getPaymentStatusBadge(selectedBooking.bookingFee.status)}
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Security Deposit</p>
                      <p className="text-xs text-gray-500">
                        {selectedBooking.paymentMethod === "online"
                          ? selectedBooking.securityDeposit.transferredToOwner
                            ? "Transferred to Owner"
                            : "Pending Transfer to Owner"
                          : "With Owner"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(selectedBooking.securityDeposit.amount)}</p>
                      {getPaymentStatusBadge(selectedBooking.securityDeposit.status)}
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">First Month Rent (90%)</p>
                      <p className="text-xs text-gray-500">
                        {selectedBooking.paymentMethod === "online"
                          ? selectedBooking.firstMonthRent.ownerPayoutStatus === "completed"
                            ? "Paid to Owner"
                            : "Pending Payout to Owner"
                          : "With Owner"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(selectedBooking.firstMonthRent.amount)}</p>
                      {getPaymentStatusBadge(selectedBooking.firstMonthRent.status)}
                    </div>
                  </div>

                  <div className="border-t pt-3 flex justify-between items-center">
                    <p className="font-semibold">Total</p>
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatCurrency(selectedBooking.totalDue)}</p>
                      <p className="text-sm text-green-600">
                        Paid: {formatCurrency(selectedBooking.totalPaid)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Tenant Address</h4>
                <p className="text-sm">
                  {selectedBooking.address.street}, {selectedBooking.address.city},{" "}
                  {selectedBooking.address.state} - {selectedBooking.address.pincode}
                </p>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Created At</p>
                  <p className="font-medium">{formatDateTime(selectedBooking.createdAt)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Last Updated</p>
                  <p className="font-medium">{formatDateTime(selectedBooking.updatedAt)}</p>
                </div>
                {selectedBooking.cashCollectedAt && (
                  <div>
                    <p className="text-gray-500">Cash Collected At</p>
                    <p className="font-medium">{formatDateTime(selectedBooking.cashCollectedAt)}</p>
                  </div>
                )}
                {selectedBooking.adminVerifiedAt && (
                  <div>
                    <p className="text-gray-500">Admin Verified At</p>
                    <p className="font-medium">{formatDateTime(selectedBooking.adminVerifiedAt)}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Booking Status</DialogTitle>
            <DialogDescription>
              Change the status of this booking request
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Admin Notes (Optional)</Label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes about this status change..."
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus} disabled={processing}>
              {processing ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this booking? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 font-medium">
                This will permanently delete:
              </p>
              <ul className="text-sm text-red-700 mt-2 list-disc list-inside">
                <li>Booking details</li>
                <li>Associated commission records</li>
                <li>Related notifications</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteBooking}
              disabled={processing}
            >
              {processing ? "Deleting..." : "Delete Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}