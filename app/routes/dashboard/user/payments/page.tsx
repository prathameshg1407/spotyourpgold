// app/routes/dashboard/user/payments/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  Receipt,
  Calendar,
  CreditCard,
  Building,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  IndianRupee,
  Eye,
  RefreshCw,
  AlertTriangle,
  WifiOff,
  Home,
  Shield,
  Loader2,
} from "lucide-react";
import { useUserStore } from "@/store/userStore";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";

// Import payment components
import RazorpayCheckout, {
  RazorpaySuccessResponse,
} from "@/components/payments/RazorpayCheckout";
import PaymentBreakdown from "@/components/payments/PaymentBreakdown";
import PaymentSteps, {
  CompactPaymentSteps,
  PaymentProgress,
} from "@/components/payments/PaymentSteps";

// ==================== Types ====================
interface PaymentItem {
  label: string;
  amount: number;
  status: "pending" | "paid" | "failed" | "refunded";
  paidAt?: string | null;
  paymentReference?: string;
}

interface PaymentBreakdownData {
  bookingFee: PaymentItem;
  securityDeposit: PaymentItem;
  firstMonthRent: PaymentItem;
}

interface PaymentProgress {
  bookingFeePaid: boolean;
  approved: boolean;
  remainingPaid: boolean;
  isComplete: boolean;
}

interface BookingPayment {
  _id: string;
  type: "booking";
  listingId: {
    _id: string;
    pgName: string;
    location: { area: string; city: string };
    images: { url: string }[];
  } | null;
  pgName: string;
  roomType: string;
  moveInDate: string;
  duration: string;
  status: string;
  paymentMethod: "online" | "cash";
  createdAt: string;
  paymentBreakdown: PaymentBreakdownData;
  originalAmount: number;
  discountAmount: number;
  couponCode: string | null;
  totalDue: number;
  totalPaid: number;
  pendingAmount: number;
  paymentProgress: PaymentProgress;
  canPayBookingFee: boolean;
  canPayRemaining: boolean;
}

interface MonthlyRent {
  _id: string;
  type: "monthly_rent";
  pgName: string;
  rentMonth: string;
  monthNumber: number;
  amount: number;
  dueDate: string;
  status: string;
  paidAmount: number;
  paidAt: string | null;
  paymentMethod: string;
  lateFee: number;
  totalDue: number;
}

interface PaymentSummary {
  totalBookingFeesPaid: number;
  totalSecurityDepositsPaid: number;
  totalFirstMonthRentPaid: number;
  totalMonthlyRentPaid: number;
  totalMonthlyRentPending: number;
  totalPaid: number;
  totalPending: number;
  overdueCount: number;
}

interface RentDueInfo {
  rentId: string;
  nextDueDate: string;
  daysRemaining: number;
  amount: number;
  isOverdue: boolean;
  monthNumber: number;
}

interface PaymentApiResponse {
  success: boolean;
  data: {
    bookings: BookingPayment[];
    monthlyRents: MonthlyRent[];
    summary: PaymentSummary;
    rentDueInfo: RentDueInfo | null;
    hasActiveAllocation: boolean;
  };
  message?: string;
}

// ==================== Constants ====================
const BOOKING_STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
  confirmed: { color: "bg-blue-100 text-blue-800", label: "Confirmed" },
  active: { color: "bg-green-100 text-green-800", label: "Active" },
  cancelled: { color: "bg-red-100 text-red-800", label: "Cancelled" },
  completed: { color: "bg-gray-100 text-gray-800", label: "Completed" },
};

const RENT_STATUS_CONFIG: Record<string, { color: string; label: string; icon: React.ElementType }> = {
  upcoming: { color: "bg-gray-100 text-gray-600", label: "Upcoming", icon: Clock },
  pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending", icon: Clock },
  paid: { color: "bg-green-100 text-green-800", label: "Paid", icon: CheckCircle },
  overdue: { color: "bg-red-100 text-red-800", label: "Overdue", icon: AlertCircle },
  partially_paid: { color: "bg-orange-100 text-orange-800", label: "Partial", icon: AlertTriangle },
};

// ==================== Utility Functions ====================
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "Invalid Date";
  }
};

const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return axiosError.response?.data?.message || "An error occurred";
  }
  return "An unexpected error occurred";
};

// ==================== Sub-Components ====================
const SummaryCard = ({
  title,
  value,
  icon: Icon,
  iconBgColor,
  iconColor,
  valueColor = "text-foreground",
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconBgColor: string;
  iconColor: string;
  valueColor?: string;
}) => (
  <Card className="border border-HG-400/20 shadow-sm rounded-2xl bg-white">
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={`text-2xl font-bold ${valueColor}`}>
            {typeof value === "number" ? formatCurrency(value) : value}
          </p>
        </div>
        <div className={`h-12 w-12 rounded-full ${iconBgColor} flex items-center justify-center`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

const RentDueCard = ({
  rentDueInfo,
  onPayNow,
  loading,
}: {
  rentDueInfo: RentDueInfo;
  onPayNow: () => void;
  loading: boolean;
}) => (
  <Card
    className={`border-2 ${
      rentDueInfo.isOverdue
        ? "border-red-400 bg-red-50"
        : "border-HG-400 bg-HG-50"
    } shadow-sm rounded-2xl`}
  >
    <CardContent className="pt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`h-12 w-12 rounded-full ${
              rentDueInfo.isOverdue ? "bg-red-100" : "bg-HG-100"
            } flex items-center justify-center flex-shrink-0`}
          >
            <Calendar
              className={`h-6 w-6 ${
                rentDueInfo.isOverdue ? "text-red-600" : "text-HG-600"
              }`}
            />
          </div>
          <div>
            <p
              className={`text-sm font-medium ${
                rentDueInfo.isOverdue ? "text-red-600" : "text-HG-600"
              }`}
            >
              {rentDueInfo.isOverdue
                ? "Rent Overdue!"
                : `Month ${rentDueInfo.monthNumber} Rent Due`}
            </p>
            <p className="text-lg font-bold">{formatDate(rentDueInfo.nextDueDate)}</p>
            <p className="text-sm text-muted-foreground">
              {rentDueInfo.isOverdue
                ? `${Math.abs(rentDueInfo.daysRemaining)} days overdue`
                : `${rentDueInfo.daysRemaining} days remaining`}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Amount Due</p>
            <p className="text-2xl font-bold">{formatCurrency(rentDueInfo.amount)}</p>
          </div>
          <Button
            onClick={onPayNow}
            disabled={loading}
            className={`${
              rentDueInfo.isOverdue
                ? "bg-red-500 hover:bg-red-600"
                : "bg-HG-500 hover:bg-HG-600"
            }`}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CreditCard className="h-4 w-4 mr-2" />
            )}
            Pay Now
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

const BookingPaymentCard = ({
  booking,
  onPayBookingFee,
  onPayRemaining,
  onViewDetails,
  onDownloadInvoice,
  paymentLoading,
  downloadingInvoice,
}: {
  booking: BookingPayment;
  onPayBookingFee: (bookingId: string) => void;
  onPayRemaining: (bookingId: string) => void;
  onViewDetails: (booking: BookingPayment) => void;
  onDownloadInvoice: (bookingId: string) => void;
  paymentLoading: string | null;
  downloadingInvoice: string | null;
}) => {
  const listing = booking.listingId;
  const progressPercent = Math.round((booking.totalPaid / booking.totalDue) * 100);
  const currentStep = booking.paymentProgress.isComplete
    ? 4
    : booking.paymentProgress.remainingPaid
    ? 4
    : booking.paymentProgress.approved
    ? 3
    : booking.paymentProgress.bookingFeePaid
    ? 2
    : 1;

  return (
    <Card className="border border-HG-400/20 shadow-sm rounded-xl overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Image */}
          <div className="w-full md:w-48 h-32 md:h-auto bg-gray-100 flex-shrink-0">
            {listing?.images?.[0]?.url ? (
              <img
                src={listing.images[0].url}
                alt={listing.pgName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building className="h-12 w-12 text-gray-300" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-4 space-y-4">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{booking.pgName}</h3>
                <p className="text-sm text-gray-500">
                  {listing?.location?.area}, {listing?.location?.city} • {booking.roomType}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Move-in: {formatDate(booking.moveInDate)} • {booking.duration} months
                </p>
              </div>
              <Badge
                variant="outline"
                className={BOOKING_STATUS_CONFIG[booking.status]?.color}
              >
                {BOOKING_STATUS_CONFIG[booking.status]?.label || booking.status}
              </Badge>
            </div>

            {/* Payment Steps */}
            <div className="py-2">
              <PaymentSteps currentStep={currentStep} size="sm" variant="horizontal" />
            </div>

            {/* Payment Breakdown Mini */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div
                className={`p-2 rounded-lg ${
                  booking.paymentBreakdown.bookingFee.status === "paid"
                    ? "bg-green-50 border border-green-200"
                    : "bg-gray-50 border border-gray-200"
                }`}
              >
                <p className="text-xs text-gray-500">Booking Fee</p>
                <p className="font-semibold text-sm">
                  {formatCurrency(booking.paymentBreakdown.bookingFee.amount)}
                </p>
                <Badge
                  variant="outline"
                  className={`text-[10px] mt-1 ${
                    booking.paymentBreakdown.bookingFee.status === "paid"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {booking.paymentBreakdown.bookingFee.status}
                </Badge>
              </div>
              <div
                className={`p-2 rounded-lg ${
                  booking.paymentBreakdown.securityDeposit.status === "paid"
                    ? "bg-green-50 border border-green-200"
                    : "bg-gray-50 border border-gray-200"
                }`}
              >
                <p className="text-xs text-gray-500">Deposit</p>
                <p className="font-semibold text-sm">
                  {formatCurrency(booking.paymentBreakdown.securityDeposit.amount)}
                </p>
                <Badge
                  variant="outline"
                  className={`text-[10px] mt-1 ${
                    booking.paymentBreakdown.securityDeposit.status === "paid"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {booking.paymentBreakdown.securityDeposit.status}
                </Badge>
              </div>
              <div
                className={`p-2 rounded-lg ${
                  booking.paymentBreakdown.firstMonthRent.status === "paid"
                    ? "bg-green-50 border border-green-200"
                    : "bg-gray-50 border border-gray-200"
                }`}
              >
                <p className="text-xs text-gray-500">First Month</p>
                <p className="font-semibold text-sm">
                  {formatCurrency(booking.paymentBreakdown.firstMonthRent.amount)}
                </p>
                <Badge
                  variant="outline"
                  className={`text-[10px] mt-1 ${
                    booking.paymentBreakdown.firstMonthRent.status === "paid"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {booking.paymentBreakdown.firstMonthRent.status}
                </Badge>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>
                  Paid: {formatCurrency(booking.totalPaid)} / {formatCurrency(booking.totalDue)}
                </span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    progressPercent === 100 ? "bg-green-500" : "bg-HG-500"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-2">
              {booking.canPayBookingFee && (
                <Button
                  size="sm"
                  onClick={() => onPayBookingFee(booking._id)}
                  disabled={paymentLoading === booking._id}
                  className="bg-HG-500 hover:bg-HG-600"
                >
                  {paymentLoading === booking._id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <CreditCard className="h-4 w-4 mr-1" />
                  )}
                  Pay Booking Fee
                </Button>
              )}
              {booking.canPayRemaining && (
                <Button
                  size="sm"
                  onClick={() => onPayRemaining(booking._id)}
                  disabled={paymentLoading === booking._id}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {paymentLoading === booking._id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <CreditCard className="h-4 w-4 mr-1" />
                  )}
                  Pay Remaining ({formatCurrency(booking.pendingAmount)})
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => onViewDetails(booking)}
              >
                <Eye className="h-4 w-4 mr-1" />
                Details
              </Button>
              {booking.totalPaid > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDownloadInvoice(booking._id)}
                  disabled={downloadingInvoice === booking._id}
                >
                  {downloadingInvoice === booking._id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const LoadingSkeleton = () => (
  <div className="space-y-6 pt-4 pb-14">
    <Skeleton className="h-9 w-64 mb-2" />
    <div className="grid gap-4 md:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="border border-HG-400/20 rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
              </div>
              <Skeleton className="h-12 w-12 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
    {[...Array(3)].map((_, i) => (
      <Skeleton key={i} className="h-48 w-full rounded-xl" />
    ))}
  </div>
);

// ==================== Main Component ====================
export default function PaymentHistoryPage() {
  const { user } = useUserStore();
  const [bookings, setBookings] = useState<BookingPayment[]>([]);
  const [monthlyRents, setMonthlyRents] = useState<MonthlyRent[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [rentDueInfo, setRentDueInfo] = useState<RentDueInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<BookingPayment | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);
  const [razorpayOrder, setRazorpayOrder] = useState<{
    orderId: string;
    amount: number;
    bookingId: string;
    paymentType: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState("bookings");

  // Fetch payment data
  const fetchPaymentData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await axios.get<PaymentApiResponse>(
        `/api/user/payments?userId=${user.id}`
      );

      if (response.data.success) {
        setBookings(response.data.data.bookings || []);
        setMonthlyRents(response.data.data.monthlyRents || []);
        setSummary(response.data.data.summary || null);
        setRentDueInfo(response.data.data.rentDueInfo || null);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPaymentData();
  }, [fetchPaymentData]);

  // Initiate payment
  const initiatePayment = async (bookingId: string, paymentType: "booking_fee" | "remaining") => {
    try {
      setPaymentLoading(bookingId);

      const response = await axios.post(`/api/booking/${bookingId}/initiate-payment`, {
        paymentType,
      });

      if (response.data.success) {
        setRazorpayOrder({
          orderId: response.data.data.orderId,
          amount: response.data.data.amount,
          bookingId,
          paymentType,
        });
      } else {
        toast.error(response.data.message || "Failed to initiate payment");
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setPaymentLoading(null);
    }
  };

  // Handle payment success
  const handlePaymentSuccess = async (response: RazorpaySuccessResponse) => {
    if (!razorpayOrder) return;

    try {
      setPaymentLoading(razorpayOrder.bookingId);

      const verifyResponse = await axios.post(
        `/api/booking/${razorpayOrder.bookingId}/verify-payment`,
        {
          paymentType: razorpayOrder.paymentType,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        }
      );

      if (verifyResponse.data.success) {
        toast.success("Payment successful!");
        setRazorpayOrder(null);
        fetchPaymentData();
      } else {
        toast.error(verifyResponse.data.message || "Payment verification failed");
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setPaymentLoading(null);
    }
  };

  // Handle rent payment
  const handleRentPayment = async () => {
    if (!rentDueInfo) return;

    try {
      setPaymentLoading("rent");

      const response = await axios.post("/api/user/rent", {
        rentId: rentDueInfo.rentId,
      });

      if (response.data.success) {
        // Open Razorpay for rent payment
        setRazorpayOrder({
          orderId: response.data.data.orderId,
          amount: response.data.data.amount,
          bookingId: rentDueInfo.rentId,
          paymentType: "monthly_rent",
        });
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setPaymentLoading(null);
    }
  };

  // Download invoice
  const handleDownloadInvoice = async (bookingId: string) => {
    try {
      setDownloadingInvoice(bookingId);

      const response = await axios.get(`/api/user/payments/invoice/${bookingId}`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${bookingId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Invoice downloaded");
    } catch (err) {
      toast.error("Failed to download invoice");
    } finally {
      setDownloadingInvoice(null);
    }
  };

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <Card className="border border-red-200 bg-red-50 rounded-2xl">
        <CardContent className="pt-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="font-semibold text-red-800 mb-2">Failed to Load</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchPaymentData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 pt-4 pb-14">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-HG-500">Payments</h1>
          <p className="text-muted-foreground mt-1">
            Manage your booking payments and rent
          </p>
        </div>
        <Button variant="outline" onClick={fetchPaymentData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard
            title="Total Paid"
            value={summary.totalPaid}
            icon={CheckCircle}
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
            valueColor="text-green-600"
          />
          <SummaryCard
            title="Pending"
            value={summary.totalPending}
            icon={Clock}
            iconBgColor="bg-orange-100"
            iconColor="text-orange-600"
            valueColor="text-orange-600"
          />
          <SummaryCard
            title="Security Deposits"
            value={summary.totalSecurityDepositsPaid}
            icon={Shield}
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
          />
          <SummaryCard
            title="Rent Paid"
            value={summary.totalMonthlyRentPaid}
            icon={Home}
            iconBgColor="bg-HG-100"
            iconColor="text-HG-500"
          />
        </div>
      )}

      {/* Rent Due Alert */}
      {rentDueInfo && (
        <RentDueCard
          rentDueInfo={rentDueInfo}
          onPayNow={handleRentPayment}
          loading={paymentLoading === "rent"}
        />
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="bookings" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Bookings ({bookings.length})
          </TabsTrigger>
          <TabsTrigger value="rent" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Monthly Rent ({monthlyRents.length})
          </TabsTrigger>
        </TabsList>

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="space-y-4 mt-6">
          {bookings.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-600 mb-2">No Bookings Yet</h3>
                <p className="text-gray-500">Your booking payments will appear here</p>
              </CardContent>
            </Card>
          ) : (
            bookings.map((booking) => (
              <BookingPaymentCard
                key={booking._id}
                booking={booking}
                onPayBookingFee={(id) => initiatePayment(id, "booking_fee")}
                onPayRemaining={(id) => initiatePayment(id, "remaining")}
                onViewDetails={(b) => {
                  setSelectedBooking(b);
                  setShowDetails(true);
                }}
                onDownloadInvoice={handleDownloadInvoice}
                paymentLoading={paymentLoading}
                downloadingInvoice={downloadingInvoice}
              />
            ))
          )}
        </TabsContent>

        {/* Monthly Rent Tab */}
        <TabsContent value="rent" className="mt-6">
          {monthlyRents.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-600 mb-2">No Rent History</h3>
                <p className="text-gray-500">Monthly rent payments will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Monthly Rent History</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Paid At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyRents.map((rent) => {
                      const statusConfig = RENT_STATUS_CONFIG[rent.status];
                      const StatusIcon = statusConfig?.icon || Clock;

                      return (
                        <TableRow key={rent._id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">Month {rent.monthNumber}</p>
                              <p className="text-xs text-gray-500">
                                {formatDate(rent.rentMonth)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(rent.dueDate)}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{formatCurrency(rent.amount)}</p>
                              {rent.lateFee > 0 && (
                                <p className="text-xs text-red-500">
                                  +{formatCurrency(rent.lateFee)} late fee
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`${statusConfig?.color} flex items-center gap-1 w-fit`}
                            >
                              <StatusIcon className="h-3 w-3" />
                              {statusConfig?.label || rent.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {rent.paidAt ? formatDate(rent.paidAt) : "-"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Payment Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              Complete breakdown of your booking payment
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-6">
              {/* PG Info */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="h-16 w-16 rounded-lg bg-gray-200 overflow-hidden">
                  {selectedBooking.listingId?.images?.[0]?.url ? (
                    <img
                      src={selectedBooking.listingId.images[0].url}
                      alt={selectedBooking.pgName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Building className="h-8 w-8 m-4 text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedBooking.pgName}</h3>
                  <p className="text-gray-500">
                    {selectedBooking.listingId?.location?.area},{" "}
                    {selectedBooking.listingId?.location?.city}
                  </p>
                </div>
              </div>

              {/* Payment Steps */}
              <PaymentSteps
                currentStep={
                  selectedBooking.paymentProgress.isComplete
                    ? 4
                    : selectedBooking.paymentProgress.remainingPaid
                    ? 4
                    : selectedBooking.paymentProgress.approved
                    ? 3
                    : selectedBooking.paymentProgress.bookingFeePaid
                    ? 2
                    : 1
                }
                variant="vertical"
              />

              {/* Payment Breakdown */}
              <PaymentBreakdown
                bookingFee={selectedBooking.paymentBreakdown.bookingFee}
                securityDeposit={selectedBooking.paymentBreakdown.securityDeposit}
                firstMonthRent={selectedBooking.paymentBreakdown.firstMonthRent}
                originalAmount={selectedBooking.originalAmount}
                discountAmount={selectedBooking.discountAmount}
                couponCode={selectedBooking.couponCode}
                totalDue={selectedBooking.totalDue}
                totalPaid={selectedBooking.totalPaid}
                paymentMethod={selectedBooking.paymentMethod}
              />

              {/* Actions */}
              <div className="flex gap-2">
                {selectedBooking.canPayBookingFee && (
                  <Button
                    onClick={() => {
                      setShowDetails(false);
                      initiatePayment(selectedBooking._id, "booking_fee");
                    }}
                    className="flex-1 bg-HG-500"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay Booking Fee
                  </Button>
                )}
                {selectedBooking.canPayRemaining && (
                  <Button
                    onClick={() => {
                      setShowDetails(false);
                      initiatePayment(selectedBooking._id, "remaining");
                    }}
                    className="flex-1 bg-green-600"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay Remaining
                  </Button>
                )}
                {selectedBooking.totalPaid > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadInvoice(selectedBooking._id)}
                    disabled={downloadingInvoice === selectedBooking._id}
                  >
                    {downloadingInvoice === selectedBooking._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Razorpay Checkout Modal */}
      {razorpayOrder && (
        <Dialog open={!!razorpayOrder} onOpenChange={() => setRazorpayOrder(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Complete Payment</DialogTitle>
              <DialogDescription>
                Amount: {formatCurrency(razorpayOrder.amount)}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <RazorpayCheckout
                orderId={razorpayOrder.orderId}
                amount={razorpayOrder.amount}
                description={
                  razorpayOrder.paymentType === "booking_fee"
                    ? "Booking Fee Payment"
                    : razorpayOrder.paymentType === "remaining"
                    ? "Deposit + First Month Rent"
                    : "Monthly Rent Payment"
                }
                prefill={{
                  name: user?.fullName,
                  email: user?.email,
                  contact: user?.phone,
                }}
                onSuccess={handlePaymentSuccess}
                onFailure={() => {
                  toast.error("Payment failed. Please try again.");
                  setRazorpayOrder(null);
                }}
                onDismiss={() => setRazorpayOrder(null)}
                buttonText={`Pay ${formatCurrency(razorpayOrder.amount)}`}
                fullWidth
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}