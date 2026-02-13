"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Banknote,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  Building,
  User,
  Phone,
  Mail,
  AlertTriangle,
  IndianRupee,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { BlurImage } from "@/components/BlurImage";

interface CashPaymentBooking {
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
  fullName: string;
  phoneNumber: string;
  email: string;
  roomType: string;
  paymentMethod: "cash";
  monthlyRent: number;
  bookingFee: {
    amount: number;
    status: string;
    ownerCommissionStatus: string;
  };
  securityDeposit: {
    amount: number;
    status: string;
  };
  firstMonthRent: {
    amount: number;
    status: string;
  };
  totalPaid: number;
  cashPaymentProof: {
    bookingFeeProof: string;
    securityDepositProof: string;
    firstMonthRentProof: string;
  };
  cashCollectedBy: string;
  cashCollectedAt: string | null;
  adminVerifiedAt: string | null;
  createdAt: string;
}

interface Stats {
  totalCashPayments: number;
  pendingVerification: number;
  verified: number;
  totalAmount: number;
  pendingCommission: number;
}

export default function AdminCashPaymentsPage() {
  const [bookings, setBookings] = useState<CashPaymentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("pending");

  // Dialogs
  const [selectedBooking, setSelectedBooking] = useState<CashPaymentBooking | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchCashPayments = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: "20",
        status: activeTab,
      });

      const response = await axios.get(`/api/admin/verify-cash-payment?${params}`);

      if (response.data.success) {
        setBookings(response.data.data);
        setTotal(response.data.total);
        setTotalPages(response.data.totalPages);
        setStats(response.data.stats);
      }
    } catch (error) {
      toast.error("Failed to fetch cash payments");
    } finally {
      setLoading(false);
    }
  }, [currentPage, activeTab]);

  useEffect(() => {
    fetchCashPayments();
  }, [fetchCashPayments]);

  const handleVerify = async () => {
    if (!selectedBooking) return;

    setProcessing(true);
    try {
      const response = await axios.post("/api/admin/verify-cash-payment", {
        bookingId: selectedBooking._id,
        action: "verify",
      });

      if (response.data.success) {
        toast.success("Cash payment verified successfully");
        setShowVerifyDialog(false);
        setSelectedBooking(null);
        fetchCashPayments();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to verify payment");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedBooking) return;

    setProcessing(true);
    try {
      const response = await axios.post("/api/admin/verify-cash-payment", {
        bookingId: selectedBooking._id,
        action: "reject",
        notes: rejectReason,
      });

      if (response.data.success) {
        toast.success("Cash payment rejected");
        setShowRejectDialog(false);
        setRejectReason("");
        setSelectedBooking(null);
        fetchCashPayments();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reject payment");
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

  if (loading && bookings.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading cash payments...</p>
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
            Cash Payment <span className="text-primary">Verification</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Verify cash payments and track commission receivables
          </p>
        </div>
        <Button variant="outline" onClick={fetchCashPayments} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-gray-500">Total Cash Payments</p>
              <p className="text-xl font-bold">{stats.totalCashPayments}</p>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-yellow-600">Pending Verification</p>
              <p className="text-xl font-bold text-yellow-700">{stats.pendingVerification}</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-green-600">Verified</p>
              <p className="text-xl font-bold text-green-700">{stats.verified}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-gray-500">Total Amount</p>
              <p className="text-xl font-bold">{formatCurrency(stats.totalAmount)}</p>
            </CardContent>
          </Card>
          <Card className="bg-orange-50">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-orange-600">Pending Commission</p>
              <p className="text-xl font-bold text-orange-700">
                {formatCurrency(stats.pendingCommission)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Info Banner */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Banknote className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800">Cash Payment Flow</p>
              <p className="text-sm text-blue-700 mt-1">
                User → Owner (100%) → Admin receives 10% commission from owner
              </p>
              <p className="text-sm text-blue-600 mt-1">
                After verification, a commission record is created for the 10% owed by the owner.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending Verification
            {stats && stats.pendingVerification > 0 && (
              <Badge className="ml-2 bg-yellow-100 text-yellow-800">
                {stats.pendingVerification}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="verified">Verified</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {bookings.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                {activeTab === "pending" ? (
                  <>
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      All Caught Up!
                    </h3>
                    <p className="text-gray-600">
                      No cash payments pending verification.
                    </p>
                  </>
                ) : (
                  <>
                    <Banknote className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Cash Payments
                    </h3>
                    <p className="text-gray-600">
                      No cash payments found in this category.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Commission (10%)</TableHead>
                      <TableHead>Collected</TableHead>
                      <TableHead>Status</TableHead>
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
                          <p className="font-bold">{formatCurrency(booking.totalPaid)}</p>
                        </TableCell>
                        <TableCell>
                          <p className="font-bold text-orange-600">
                            {formatCurrency(booking.bookingFee.amount)}
                          </p>
                          <Badge
                            className={
                              booking.bookingFee.ownerCommissionStatus === "paid"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }
                          >
                            {booking.bookingFee.ownerCommissionStatus === "paid"
                              ? "Received"
                              : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {booking.cashCollectedAt ? (
                            <div className="text-xs">
                              <p>{formatDate(booking.cashCollectedAt)}</p>
                              <p className="text-gray-500">{booking.cashCollectedBy}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {booking.adminVerifiedAt ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                          )}
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
                            {!booking.adminVerifiedAt && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-600"
                                  onClick={() => {
                                    setSelectedBooking(booking);
                                    setShowVerifyDialog(true);
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600"
                                  onClick={() => {
                                    setSelectedBooking(booking);
                                    setShowRejectDialog(true);
                                  }}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

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
            <DialogTitle>Cash Payment Details</DialogTitle>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-6">
              {/* Property Info */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  {selectedBooking.listingId?.primaryImage ? (
                    <BlurImage
                      src={selectedBooking.listingId.primaryImage}
                      alt={selectedBooking.listingId.pgName}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <Building className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">{selectedBooking.listingId?.pgName}</h3>
                  <p className="text-sm text-gray-600">
                    {selectedBooking.listingId?.location?.area},{" "}
                    {selectedBooking.listingId?.location?.city}
                  </p>
                  {selectedBooking.adminVerifiedAt ? (
                    <Badge className="mt-2 bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified on {formatDate(selectedBooking.adminVerifiedAt)}
                    </Badge>
                  ) : (
                    <Badge className="mt-2 bg-yellow-100 text-yellow-800">
                      <Clock className="w-3 h-3 mr-1" />
                      Pending Verification
                    </Badge>
                  )}
                </div>
              </div>

              {/* People Involved */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Tenant
                  </h4>
                  <div className="space-y-1 text-sm">
                    <p>{selectedBooking.fullName}</p>
                    <p className="text-gray-500">{selectedBooking.email}</p>
                    <p className="text-gray-500">{selectedBooking.phoneNumber}</p>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Owner
                  </h4>
                  <div className="space-y-1 text-sm">
                    <p>{selectedBooking.ownerId?.fullName}</p>
                    <p className="text-gray-500">{selectedBooking.ownerId?.email}</p>
                    <p className="text-gray-500">{selectedBooking.ownerId?.phone}</p>
                  </div>
                </div>
              </div>

              {/* Payment Breakdown */}
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold mb-3">Payment Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Booking Fee (10%)</span>
                    <span className="font-bold">{formatCurrency(selectedBooking.bookingFee.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Security Deposit</span>
                    <span className="font-bold">{formatCurrency(selectedBooking.securityDeposit.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>First Month Rent (90%)</span>
                    <span className="font-bold">{formatCurrency(selectedBooking.firstMonthRent.amount)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-semibold">Total Collected</span>
                    <span className="font-bold text-lg">{formatCurrency(selectedBooking.totalPaid)}</span>
                  </div>
                </div>
              </div>

              {/* Commission Info */}
              <div className="p-4 bg-orange-50 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <IndianRupee className="h-4 w-4" />
                  Commission Due from Owner
                </h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-orange-700">
                      {formatCurrency(selectedBooking.bookingFee.amount)}
                    </p>
                    <p className="text-sm text-orange-600">10% of monthly rent</p>
                  </div>
                  <Badge
                    className={
                      selectedBooking.bookingFee.ownerCommissionStatus === "paid"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }
                  >
                    {selectedBooking.bookingFee.ownerCommissionStatus === "paid"
                      ? "Received"
                      : "Pending"}
                  </Badge>
                </div>
              </div>

              {/* Payment Proof */}
              {(selectedBooking.cashPaymentProof.bookingFeeProof ||
                selectedBooking.cashPaymentProof.securityDepositProof ||
                selectedBooking.cashPaymentProof.firstMonthRentProof) && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Payment Proofs
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    {selectedBooking.cashPaymentProof.bookingFeeProof && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Booking Fee</p>
                        <a
                          href={selectedBooking.cashPaymentProof.bookingFeeProof}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <img
                            src={selectedBooking.cashPaymentProof.bookingFeeProof}
                            alt="Booking Fee Proof"
                            className="w-full h-20 object-cover rounded border"
                          />
                        </a>
                      </div>
                    )}
                    {selectedBooking.cashPaymentProof.securityDepositProof && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Security Deposit</p>
                        <a
                          href={selectedBooking.cashPaymentProof.securityDepositProof}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <img
                            src={selectedBooking.cashPaymentProof.securityDepositProof}
                            alt="Security Deposit Proof"
                            className="w-full h-20 object-cover rounded border"
                          />
                        </a>
                      </div>
                    )}
                    {selectedBooking.cashPaymentProof.firstMonthRentProof && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">First Month Rent</p>
                        <a
                          href={selectedBooking.cashPaymentProof.firstMonthRentProof}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <img
                            src={selectedBooking.cashPaymentProof.firstMonthRentProof}
                            alt="First Month Rent Proof"
                            className="w-full h-20 object-cover rounded border"
                          />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Collection Info */}
              {selectedBooking.cashCollectedAt && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Collection Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Collected By</p>
                      <p className="font-medium">{selectedBooking.cashCollectedBy}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Collected At</p>
                      <p className="font-medium">{formatDateTime(selectedBooking.cashCollectedAt)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Verify Dialog */}
      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Cash Payment</DialogTitle>
            <DialogDescription>
              Confirm that the cash payment has been collected and verified.
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="py-4">
              <div className="p-4 bg-green-50 rounded-lg mb-4">
                <p className="font-medium text-green-800">
                  Amount Collected: {formatCurrency(selectedBooking.totalPaid)}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  Commission to collect from owner: {formatCurrency(selectedBooking.bookingFee.amount)}
                </p>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>What happens next:</strong>
                </p>
                <ul className="text-sm text-blue-700 mt-2 list-disc list-inside">
                  <li>Payment will be marked as verified</li>
                  <li>A commission record will be created</li>
                  <li>Owner will be notified to pay 10% commission</li>
                </ul>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVerifyDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleVerify}
              disabled={processing}
              className="bg-green-600 hover:bg-green-700"
            >
              {processing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Verify Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Cash Payment</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this cash payment verification.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="p-4 bg-red-50 rounded-lg mb-4">
              <p className="text-sm text-red-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5" />
                This will notify both the tenant and owner about the rejection.
              </p>
            </div>

            <div>
              <Label>Reason for Rejection *</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Please provide a reason for rejection..."
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing || !rejectReason.trim()}
            >
              {processing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}