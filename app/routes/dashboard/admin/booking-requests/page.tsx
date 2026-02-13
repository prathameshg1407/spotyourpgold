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
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
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
  Download,
  TrendingUp,
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

  // View Dialog
  const [selectedBooking, setSelectedBooking] = useState<BookingRequest | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

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

  const handleExportData = () => {
    // Export functionality for reports
    toast.success("Exporting booking data...");
    // Implementation would go here
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
            Booking <span className="text-primary">Overview</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor all booking activity across the platform
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={fetchBookings} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="text-xl font-bold">{stats.totalBookings}</p>
                </div>
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-yellow-200">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-yellow-600">Pending</p>
                  <p className="text-xl font-bold text-yellow-700">{stats.pendingBookings}</p>
                </div>
                <Clock className="h-5 w-5 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-600">Confirmed</p>
                  <p className="text-xl font-bold text-blue-700">{stats.confirmedBookings}</p>
                </div>
                <CheckCircle className="h-5 w-5 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-200">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-600">Active</p>
                  <p className="text-xl font-bold text-green-700">{stats.activeBookings}</p>
                </div>
                <User className="h-5 w-5 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-600">Online</p>
                  <p className="text-xl font-bold">{stats.onlinePayments}</p>
                </div>
                <CreditCard className="h-5 w-5 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-orange-600">Cash</p>
                  <p className="text-xl font-bold">{stats.cashPayments}</p>
                </div>
                <Banknote className="h-5 w-5 text-orange-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-300">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-600">Revenue</p>
                  <p className="text-xl font-bold text-green-700">
                    {formatCurrency(stats.totalRevenue)}
                  </p>
                </div>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
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
                    <TableHead className="text-right">Action</TableHead>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowDetailDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
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
            Showing {((currentPage - 1) * 20) + 1} - {Math.min(currentPage * 20, total)} of {total} bookings
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
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={i}
                    variant={pageNum === currentPage ? "default" : "outline"}
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
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

      {/* View-Only Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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

              {/* Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Tenant Information */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Tenant Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs">Name</p>
                        <p className="font-medium">{selectedBooking.fullName}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Email</p>
                        <p className="font-medium break-all">{selectedBooking.email}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Phone</p>
                        <p className="font-medium">{selectedBooking.phoneNumber}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Owner Information */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Owner Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs">Name</p>
                        <p className="font-medium">{selectedBooking.ownerId?.fullName || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Email</p>
                        <p className="font-medium break-all">{selectedBooking.ownerId?.email || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Phone</p>
                        <p className="font-medium">{selectedBooking.ownerId?.phone || "N/A"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Booking Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Booking Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs">Room Type</p>
                        <p className="font-medium">{selectedBooking.roomType}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Move-in Date</p>
                        <p className="font-medium">{formatDate(selectedBooking.moveInDate)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Duration</p>
                        <p className="font-medium">{selectedBooking.duration} month(s)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Payment Breakdown */}
              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <CardHeader>
                  <CardTitle className="text-sm">Payment Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b">
                      <div>
                        <p className="font-medium">Monthly Rent</p>
                        <p className="text-xs text-gray-500">Base rent amount</p>
                      </div>
                      <p className="font-bold text-lg">{formatCurrency(selectedBooking.monthlyRent)}</p>
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm">Booking Fee (10%)</p>
                        <p className="text-xs text-gray-500">
                          Platform commission
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(selectedBooking.bookingFee.amount)}</p>
                        {getPaymentStatusBadge(selectedBooking.bookingFee.status)}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm">Security Deposit</p>
                        <p className="text-xs text-gray-500">
                          {selectedBooking.securityDeposit.transferredToOwner
                            ? "Transferred to owner"
                            : "Held for owner"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(selectedBooking.securityDeposit.amount)}</p>
                        {getPaymentStatusBadge(selectedBooking.securityDeposit.status)}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm">First Month Rent (90%)</p>
                        <p className="text-xs text-gray-500">
                          Owner's share
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(selectedBooking.firstMonthRent.amount)}</p>
                        {getPaymentStatusBadge(selectedBooking.firstMonthRent.status)}
                      </div>
                    </div>

                    <div className="border-t pt-3 flex justify-between items-center">
                      <div>
                        <p className="font-semibold">Total Amount</p>
                        <p className="text-xs text-green-600">
                          Paid: {formatCurrency(selectedBooking.totalPaid)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-xl text-green-700">
                          {formatCurrency(selectedBooking.totalDue)}
                        </p>
                        {selectedBooking.totalPaid >= selectedBooking.totalDue && (
                          <Badge className="bg-green-100 text-green-800 mt-1">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Fully Paid
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Address */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Tenant Address</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      {selectedBooking.address.street}, {selectedBooking.address.city},{" "}
                      {selectedBooking.address.state} - {selectedBooking.address.pincode}
                    </p>
                  </CardContent>
                </Card>

                {/* Requirements */}
                {selectedBooking.additionalRequirements && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Additional Requirements</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{selectedBooking.additionalRequirements}</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Timestamps */}
              <Card className="bg-gray-50">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs">Created</p>
                      <p className="font-medium">{formatDateTime(selectedBooking.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Updated</p>
                      <p className="font-medium">{formatDateTime(selectedBooking.updatedAt)}</p>
                    </div>
                    {selectedBooking.cashCollectedAt && (
                      <div>
                        <p className="text-gray-500 text-xs">Cash Collected</p>
                        <p className="font-medium">{formatDateTime(selectedBooking.cashCollectedAt)}</p>
                      </div>
                    )}
                    {selectedBooking.adminVerifiedAt && (
                      <div>
                        <p className="text-gray-500 text-xs">Verified</p>
                        <p className="font-medium">{formatDateTime(selectedBooking.adminVerifiedAt)}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Note for Admin */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900 mb-1">Admin View Only</p>
                      <p className="text-blue-700">
                        This is a read-only view. Booking management (approval, rejection, status updates) 
                        should be handled by the property owner through their dashboard.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}