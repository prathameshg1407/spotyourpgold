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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Trash2,
  CreditCard,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  IndianRupee,
  Upload,
} from "lucide-react";
import { BlurImage } from "@/components/BlurImage";
import { DialogTrigger } from "@radix-ui/react-dialog";

interface BookingRequest {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
  };
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
  status: "pending" | "confirmed" | "rejected" | "cancelled" | "completed" | "active";
  
  // Payment details
  monthlyRent: number;
  bookingFee: {
    amount: number;
    status: "pending" | "paid";
    paidTo: "admin" | "owner" | null;
    paymentMethod: "online" | "cash" | null;
    ownerCommissionStatus: "pending" | "paid" | null;
    ownerCommissionPaidAt?: string;
  };
  firstMonthRent: {
    amount: number;
    status: "pending" | "paid";
    paidTo: "admin" | "owner" | null;
    paymentMethod: "online" | "cash" | null;
    ownerPayoutStatus: "pending" | "completed" | null;
    ownerPayoutAmount: number;
    ownerPayoutDate?: string;
  };
  securityDeposit: {
    amount: number;
    status: "pending" | "paid" | "refunded";
    paidTo: "admin" | "owner" | null;
    transferredToOwner: boolean;
    transferredAt?: string;
  };
  paymentMethod: "online" | "cash" | null;
  paymentStatus: "pending" | "partially_paid" | "fully_paid" | "refunded";
  
  // Cash payment details
  cashPayment?: {
    bookingFeeProof?: string;
    securityDepositProof?: string;
    firstMonthRentProof?: string;
    collectedBy?: string;
    collectedAt?: string;
    verifiedByAdmin: boolean;
    verifiedAt?: string;
  };
  
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
  const [selectedBooking, setSelectedBooking] = useState<BookingRequest | null>(null);
  const [ownerNotes, setOwnerNotes] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Cash payment confirmation state
  const [showCashDialog, setShowCashDialog] = useState(false);
  const [cashPaymentDetails, setCashPaymentDetails] = useState({
    bookingFeeProof: "",
    securityDepositProof: "",
    firstMonthRentProof: "",
    collectedBy: "",
    notes: "",
  });

  const fetchBookings = async (status: string, page: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `/api/booking/owner-requests?status=${status === "all" ? "all" : status}&page=${page}&per_page=20`
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

  const handleBookingAction = async (bookingId: string, action: "confirmed" | "rejected") => {
    try {
      setActionLoading(bookingId);

      const response = await axios.patch(`/api/booking/${bookingId}`, {
        status: action,
        ownerNotes: ownerNotes.trim() || undefined,
      });

      if (response.data.success) {
        toast.success(`Booking ${action} successfully`);
        
        if (action === "confirmed" && response.data.data.paymentMethod === "cash") {
          toast.info("Please collect cash payment from tenant and upload proof", { duration: 5000 });
          setSelectedBooking(response.data.data);
          setShowCashDialog(true);
        }
        
        setOwnerNotes("");
        fetchBookings(activeTab, currentPage);
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

      const response = await axios.post(`/api/booking/${bookingId}/cash-payment`, {
        cashPaymentProof: {
          bookingFeeProof: cashPaymentDetails.bookingFeeProof,
          securityDepositProof: cashPaymentDetails.securityDepositProof,
          firstMonthRentProof: cashPaymentDetails.firstMonthRentProof,
        },
        cashCollectedBy: cashPaymentDetails.collectedBy,
        notes: cashPaymentDetails.notes,
      });

      if (response.data.success) {
        toast.success("Cash payment confirmation uploaded successfully");
        
        // Show commission info
        if (response.data.commissionCreated) {
          toast.info(
            `Commission of ₹${response.data.commissionCreated.toLocaleString()} is pending. Please pay to admin within 7 days.`,
            { duration: 6000 }
          );
        }
        
        setShowCashDialog(false);
        setCashPaymentDetails({
          bookingFeeProof: "",
          securityDepositProof: "",
          firstMonthRentProof: "",
          collectedBy: "",
          notes: "",
        });
        fetchBookings(activeTab, currentPage);
      }
    } catch (error) {
      toast.error("Failed to confirm cash payment");
    } finally {
      setActionLoading(null);
    }
  };

  const getPaymentStatusBadge = (booking: BookingRequest) => {
    if (booking.paymentStatus === "fully_paid") {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Fully Paid
        </Badge>
      );
    }

    if (booking.paymentMethod === "online") {
      // Check if owner has received their 90% payout
      if (booking.firstMonthRent.ownerPayoutStatus === "pending") {
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Payout Pending
          </Badge>
        );
      } else if (booking.firstMonthRent.ownerPayoutStatus === "completed") {
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Payout Received
          </Badge>
        );
      }
    }

    if (booking.paymentMethod === "cash") {
      // Check if owner has paid commission to admin
      if (booking.bookingFee.ownerCommissionStatus === "pending") {
        return (
          <Badge className="bg-orange-100 text-orange-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Commission Due
          </Badge>
        );
      } else if (booking.bookingFee.ownerCommissionStatus === "paid") {
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Commission Paid
          </Badge>
        );
      }
      
      if (!booking.cashPayment?.verifiedByAdmin) {
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3 mr-1" />
            Verification Pending
          </Badge>
        );
      }
    }

    return (
      <Badge variant="outline">
        <Clock className="w-3 h-3 mr-1" />
        {booking.paymentStatus.replace("_", " ")}
      </Badge>
    );
  };

  const getPaymentBreakdown = (booking: BookingRequest) => {
    const total = booking.bookingFee.amount + booking.firstMonthRent.amount + booking.securityDeposit.amount;
    
    return (
      <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-sm text-gray-700 mb-3">Payment Breakdown</h4>
        
        {/* Booking Fee */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Booking Fee (10%)</span>
          <div className="text-right">
            <span className="font-medium">₹{booking.bookingFee.amount.toLocaleString()}</span>
            {booking.paymentMethod === "online" && (
              <p className="text-xs text-gray-500">Admin keeps this</p>
            )}
            {booking.paymentMethod === "cash" && (
              <p className="text-xs text-orange-600">You owe this to admin</p>
            )}
          </div>
        </div>

        {/* First Month Rent */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">First Month Rent (90%)</span>
          <div className="text-right">
            <span className="font-medium">₹{booking.firstMonthRent.amount.toLocaleString()}</span>
            {booking.paymentMethod === "online" && (
              <p className="text-xs text-green-600">You'll receive this</p>
            )}
            {booking.paymentMethod === "cash" && (
              <p className="text-xs text-green-600">You keep this</p>
            )}
          </div>
        </div>

        {/* Security Deposit */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Security Deposit</span>
          <div className="text-right">
            <span className="font-medium">₹{booking.securityDeposit.amount.toLocaleString()}</span>
            <p className="text-xs text-gray-500">Refundable</p>
          </div>
        </div>

        {/* Total */}
        <div className="flex justify-between text-sm pt-2 border-t">
          <span className="font-semibold">Total Amount</span>
          <span className="font-bold text-lg text-HG-600">₹{total.toLocaleString()}</span>
        </div>

        {/* Your Share */}
        <div className="mt-3 p-3 bg-white rounded border">
          {booking.paymentMethod === "online" ? (
            <div>
              <p className="text-sm font-medium text-green-700">Your Payout (from Admin):</p>
              <p className="text-xl font-bold text-green-800">
                ₹{(booking.firstMonthRent.amount + booking.securityDeposit.amount).toLocaleString()}
              </p>
              <p className="text-xs text-gray-600 mt-1">90% rent + security deposit</p>
            </div>
          ) : booking.paymentMethod === "cash" ? (
            <div>
              <p className="text-sm font-medium text-green-700">You Keep:</p>
              <p className="text-xl font-bold text-green-800">
                ₹{(booking.firstMonthRent.amount + booking.securityDeposit.amount).toLocaleString()}
              </p>
              <p className="text-xs text-orange-600 mt-1">
                Commission due: ₹{booking.bookingFee.amount.toLocaleString()}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading && bookings.length === 0) {
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

      {/* Commission Info Banner */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Payment & Commission Info:</p>
              <ul className="space-y-1 text-blue-700">
                <li>• <strong>Online Payment:</strong> Admin collects 100%, pays you 90% + deposit</li>
                <li>• <strong>Cash Payment:</strong> You collect 100%, pay 10% commission to admin</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
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
                  No {activeTab === "all" ? "" : activeTab} booking requests
                </h3>
                <p className="text-gray-600">
                  {activeTab === "pending"
                    ? "You don't have any pending booking requests at the moment."
                    : `You don't have any ${activeTab} booking requests.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:gap-4">
              {bookings.map((booking) => (
                <Card key={booking._id} className="hover:shadow-md transition-shadow">
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
                              <h3 className="font-semibold text-sm sm:text-base md:text-lg text-gray-900">
                                {booking.listingId.pgName}
                              </h3>
                              <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">
                                  {booking.listingId.location.area}, {booking.listingId.location.city}
                                </span>
                              </p>
                            </div>
                            <div className="flex flex-col gap-1">
                              <Badge
                                variant={
                                  booking.status === "confirmed"
                                    ? "default"
                                    : booking.status === "pending"
                                    ? "secondary"
                                    : "destructive"
                                }
                              >
                                {booking.status}
                              </Badge>
                              {booking.status === "confirmed" && getPaymentStatusBadge(booking)}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <User className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                              <span className="font-medium">{booking.fullName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                              <span>{booking.phoneNumber}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                              <span className="break-all">{booking.email}</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                              <span>Move-in: {formatDate(booking.moveInDate)}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Room Type: </span>
                              <span className="font-medium">{booking.roomType}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Monthly Rent: </span>
                              <span className="font-medium text-HG-600">
                                ₹{booking.monthlyRent.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2 border-t gap-2">
                          <div className="flex items-center gap-2 text-sm">
                            {booking.paymentMethod && (
                              <Badge variant="outline">
                                {booking.paymentMethod === "online" ? (
                                  <>
                                    <CreditCard className="w-3 h-3 mr-1" />
                                    Online
                                  </>
                                ) : (
                                  <>
                                    <DollarSign className="w-3 h-3 mr-1" />
                                    Cash
                                  </>
                                )}
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedBooking(booking)}
                                >
                                  <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                  View Details
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Booking Request Details</DialogTitle>
                                </DialogHeader>

                                {selectedBooking && (
                                  <div className="space-y-6">
                                    {/* Property Info */}
                                    <div className="flex gap-4">
                                      <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
                                        <BlurImage
                                          src={selectedBooking.listingId.primaryImage}
                                          alt={selectedBooking.listingId.pgName}
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
                                          {selectedBooking.listingId.location.area},{" "}
                                          {selectedBooking.listingId.location.city}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Payment Breakdown */}
                                    {getPaymentBreakdown(selectedBooking)}

                                    {/* Personal Information */}
                                    <div>
                                      <h4 className="font-semibold mb-3">Personal Information</h4>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <label className="text-sm font-medium text-gray-500">
                                            Full Name
                                          </label>
                                          <p className="font-medium">{selectedBooking.fullName}</p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium text-gray-500">
                                            Phone
                                          </label>
                                          <p className="font-medium">
                                            {selectedBooking.phoneNumber}
                                          </p>
                                        </div>
                                        <div className="col-span-2">
                                          <label className="text-sm font-medium text-gray-500">
                                            Email
                                          </label>
                                          <p className="font-medium">{selectedBooking.email}</p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Address */}
                                    <div>
                                      <h4 className="font-semibold mb-3">Address</h4>
                                      <p className="text-gray-700">
                                        {selectedBooking.address.street}, {selectedBooking.address.city},{" "}
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
                                          {selectedBooking.additionalRequirements}
                                        </p>
                                      </div>
                                    )}

                                    {/* Owner Notes */}
                                    {selectedBooking.status === "pending" && (
                                      <div>
                                        <label className="text-sm font-medium text-gray-500 mb-2 block">
                                          Owner Notes (Optional)
                                        </label>
                                        <Textarea
                                          value={ownerNotes}
                                          onChange={(e) => setOwnerNotes(e.target.value)}
                                          placeholder="Add any notes for the tenant..."
                                          rows={3}
                                        />
                                      </div>
                                    )}

                                    {/* Action Buttons */}
                                    {selectedBooking.status === "pending" && (
                                      <div className="flex gap-3 pt-4 border-t">
                                        <Button
                                          onClick={() =>
                                            handleBookingAction(selectedBooking._id, "confirmed")
                                          }
                                          disabled={actionLoading === selectedBooking._id}
                                          className="flex-1 bg-green-600 hover:bg-green-700"
                                        >
                                          <CheckCircle className="w-4 h-4 mr-2" />
                                          Approve Booking
                                        </Button>
                                        <Button
                                          onClick={() =>
                                            handleBookingAction(selectedBooking._id, "rejected")
                                          }
                                          disabled={actionLoading === selectedBooking._id}
                                          variant="destructive"
                                          className="flex-1"
                                        >
                                          <XCircle className="w-4 h-4 mr-2" />
                                          Reject Booking
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>

                            {/* Upload Cash Payment Proof */}
                            {booking.status === "confirmed" &&
                              booking.paymentMethod === "cash" &&
                              !booking.cashPayment?.verifiedByAdmin && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-green-300 text-green-600 hover:bg-green-50"
                                  onClick={() => {
                                    setSelectedBooking(booking);
                                    setShowCashDialog(true);
                                  }}
                                >
                                  <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                  Upload Proof
                                </Button>
                              )}
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

      {/* Cash Payment Dialog */}
      <Dialog open={showCashDialog} onOpenChange={setShowCashDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cash Payment Collection</DialogTitle>
            <DialogDescription>
              Please collect the full payment from tenant and upload proof
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4 py-4">
              {/* Amount to Collect */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800 mb-2">Amount to Collect:</p>
                <p className="text-2xl font-bold text-green-900">
                  ₹
                  {(
                    selectedBooking.bookingFee.amount +
                    selectedBooking.firstMonthRent.amount +
                    selectedBooking.securityDeposit.amount
                  ).toLocaleString()}
                </p>
                <div className="mt-2 space-y-1 text-xs text-green-700">
                  <p>• Booking Fee: ₹{selectedBooking.bookingFee.amount.toLocaleString()}</p>
                  <p>• First Month: ₹{selectedBooking.firstMonthRent.amount.toLocaleString()}</p>
                  <p>• Security: ₹{selectedBooking.securityDeposit.amount.toLocaleString()}</p>
                </div>
              </div>

              {/* Commission Info */}
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800">
                  <strong>Note:</strong> You'll owe ₹
                  {selectedBooking.bookingFee.amount.toLocaleString()} (10%) as commission to admin
                </p>
              </div>

              {/* Upload Fields */}
              <div className="space-y-3">
                <div>
                  <Label>Booking Fee Proof URL</Label>
                  <Input
                    placeholder="https://drive.google.com/..."
                    value={cashPaymentDetails.bookingFeeProof}
                    onChange={(e) =>
                      setCashPaymentDetails({
                        ...cashPaymentDetails,
                        bookingFeeProof: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label>First Month Rent Proof URL</Label>
                  <Input
                    placeholder="https://drive.google.com/..."
                    value={cashPaymentDetails.firstMonthRentProof}
                    onChange={(e) =>
                      setCashPaymentDetails({
                        ...cashPaymentDetails,
                        firstMonthRentProof: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Security Deposit Proof URL</Label>
                  <Input
                    placeholder="https://drive.google.com/..."
                    value={cashPaymentDetails.securityDepositProof}
                    onChange={(e) =>
                      setCashPaymentDetails({
                        ...cashPaymentDetails,
                        securityDepositProof: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Collected By *</Label>
                  <Input
                    placeholder="Your name"
                    value={cashPaymentDetails.collectedBy}
                    onChange={(e) =>
                      setCashPaymentDetails({
                        ...cashPaymentDetails,
                        collectedBy: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Notes (Optional)</Label>
                  <Textarea
                    placeholder="Any additional notes..."
                    value={cashPaymentDetails.notes}
                    onChange={(e) =>
                      setCashPaymentDetails({
                        ...cashPaymentDetails,
                        notes: e.target.value,
                      })
                    }
                    rows={2}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCashDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedBooking && handleCashPaymentConfirmation(selectedBooking._id)}
              disabled={
                !cashPaymentDetails.collectedBy ||
                actionLoading === selectedBooking?._id
              }
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Confirm Collection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            >
              <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                if (pageNum > totalPages) return null;
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
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