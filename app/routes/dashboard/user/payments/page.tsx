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
import { Skeleton } from "@/components/ui/skeleton";
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
  Wifi,
  WifiOff,
} from "lucide-react";
import { useUserStore } from "@/store/userStore";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";

// ==================== Types ====================
interface PaymentLocation {
  area: string;
  city: string;
}

interface PaymentImage {
  url: string;
}

interface PaymentListing {
  _id: string;
  pgName: string;
  location: PaymentLocation;
  images: PaymentImage[];
}

interface PaymentAddress {
  street: string;
  city: string;
  state: string;
  pincode: string;
}

type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";
type PaymentStatus = "pending" | "pending_cash_payment" | "completed_cash" | "failed" | "refunded";
type PaymentMethod = "cash" | "online";

interface PaymentRecord {
  _id: string;
  listingId: PaymentListing | null;
  roomType: string;
  moveInDate: string;
  duration: string;
  amount: number;
  originalAmount: number;
  discountAmount: number;
  securityDeposit: number;
  couponCode: string | null;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  createdAt: string;
  cashCollectedAt: string | null;
  adminVerifiedAt: string | null;
  fullName: string;
  email: string;
  phoneNumber: string;
  address: PaymentAddress;
}

interface RentDueInfo {
  nextDueDate: string;
  daysRemaining: number;
  amount: number;
  isOverdue: boolean;
}

interface PaymentApiResponse {
  success: boolean;
  data: PaymentRecord[];
  rentDueInfo?: RentDueInfo;
  message?: string;
}

interface ApiError {
  message: string;
  code?: string;
}

// ==================== Constants ====================
const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { 
  color: string; 
  icon: React.ReactNode; 
  label: string 
}> = {
  pending: {
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    icon: <Clock className="h-3 w-3" />,
    label: "Pending",
  },
  pending_cash_payment: {
    color: "bg-orange-100 text-orange-800 border-orange-300",
    icon: <AlertCircle className="h-3 w-3" />,
    label: "Awaiting Cash",
  },
  completed_cash: {
    color: "bg-green-100 text-green-800 border-green-300",
    icon: <CheckCircle className="h-3 w-3" />,
    label: "Paid (Cash)",
  },
  failed: {
    color: "bg-red-100 text-red-800 border-red-300",
    icon: <XCircle className="h-3 w-3" />,
    label: "Failed",
  },
  refunded: {
    color: "bg-purple-100 text-purple-800 border-purple-300",
    icon: <Receipt className="h-3 w-3" />,
    label: "Refunded",
  },
};

const BOOKING_STATUS_CONFIG: Record<BookingStatus, { color: string; label: string }> = {
  pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
  confirmed: { color: "bg-green-100 text-green-800", label: "Confirmed" },
  cancelled: { color: "bg-red-100 text-red-800", label: "Cancelled" },
  completed: { color: "bg-blue-100 text-blue-800", label: "Completed" },
};

const FILTER_OPTIONS = [
  { value: "all", label: "All Payments" },
  { value: "completed_cash", label: "Completed" },
  { value: "pending", label: "Pending" },
  { value: "pending_cash_payment", label: "Awaiting Cash" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
] as const;

// ==================== Utility Functions ====================
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string, options?: Intl.DateTimeFormatOptions): string => {
  try {
    const defaultOptions: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    };
    return new Date(dateString).toLocaleDateString('en-IN', options || defaultOptions);
  } catch {
    return 'Invalid Date';
  }
};

const formatTime = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
};

const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
    if (axiosError.code === 'ERR_NETWORK') {
      return 'Network error. Please check your connection.';
    }
    if (axiosError.response?.status === 401) {
      return 'Session expired. Please login again.';
    }
    if (axiosError.response?.status === 403) {
      return 'You do not have permission to access this resource.';
    }
    if (axiosError.response?.status === 404) {
      return 'Resource not found.';
    }
    if (axiosError.response?.status && axiosError.response.status >= 500) {
      return 'Server error. Please try again later.';
    }
  }
  return 'An unexpected error occurred.';
};

// ==================== Sub-Components ====================
const PaymentStatusBadge = ({ status }: { status: PaymentStatus }) => {
  const config = PAYMENT_STATUS_CONFIG[status] || PAYMENT_STATUS_CONFIG.pending;
  return (
    <Badge variant="outline" className={`${config.color} flex items-center gap-1`}>
      {config.icon}
      {config.label}
    </Badge>
  );
};

const BookingStatusBadge = ({ status }: { status: BookingStatus }) => {
  const config = BOOKING_STATUS_CONFIG[status] || BOOKING_STATUS_CONFIG.pending;
  return (
    <Badge variant="outline" className={config.color}>
      {config.label}
    </Badge>
  );
};

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
            {typeof value === 'number' ? formatCurrency(value) : value}
          </p>
        </div>
        <div className={`h-12 w-12 rounded-full ${iconBgColor} flex items-center justify-center`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

const LoadingSkeleton = () => (
  <div className="space-y-6 pt-4 pb-14">
    {/* Header Skeleton */}
    <div>
      <Skeleton className="h-9 w-64 mb-2" />
      <Skeleton className="h-5 w-96" />
    </div>

    {/* Summary Cards Skeleton */}
    <div className="grid gap-4 md:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="border border-HG-400/20 shadow-sm rounded-2xl bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
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

    {/* Table Skeleton */}
    <Card className="border border-HG-400/20 shadow-sm rounded-2xl bg-white">
      <CardHeader>
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full max-w-xs" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

const ErrorState = ({ 
  message, 
  onRetry 
}: { 
  message: string; 
  onRetry: () => void 
}) => (
  <div className="space-y-6 pt-4 pb-14">
    <Card className="border border-red-200 bg-red-50 rounded-2xl">
      <CardContent className="pt-6">
        <div className="text-center py-8">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Failed to Load Payments
          </h3>
          <p className="text-red-600 mb-4 max-w-md mx-auto">{message}</p>
          <Button
            onClick={onRetry}
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-100"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
);

const EmptyState = ({ filter }: { filter: string }) => (
  <div className="text-center py-12">
    <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Payments Found</h3>
    <p className="text-gray-500">
      {filter === "all"
        ? "You haven't made any bookings yet."
        : `No ${filter.replace(/_/g, " ")} payments found.`}
    </p>
  </div>
);

const RentDueCard = ({ rentDueInfo }: { rentDueInfo: RentDueInfo }) => (
  <Card 
    className={`border-2 ${
      rentDueInfo.isOverdue 
        ? 'border-red-400 bg-red-50' 
        : 'border-HG-400 bg-HG-50'
    } shadow-sm rounded-2xl`}
  >
    <CardContent className="pt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div 
            className={`h-12 w-12 rounded-full ${
              rentDueInfo.isOverdue ? 'bg-red-100' : 'bg-HG-100'
            } flex items-center justify-center flex-shrink-0`}
          >
            <Calendar 
              className={`h-6 w-6 ${
                rentDueInfo.isOverdue ? 'text-red-600' : 'text-HG-600'
              }`} 
            />
          </div>
          <div>
            <p 
              className={`text-sm font-medium ${
                rentDueInfo.isOverdue ? 'text-red-600' : 'text-HG-600'
              }`}
            >
              {rentDueInfo.isOverdue ? 'Rent Overdue!' : 'Next Rent Due'}
            </p>
            <p className="text-lg font-bold">
              {formatDate(rentDueInfo.nextDueDate, {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            <p className="text-sm text-muted-foreground">
              {rentDueInfo.isOverdue
                ? `${Math.abs(rentDueInfo.daysRemaining)} days overdue`
                : `${rentDueInfo.daysRemaining} days remaining`}
            </p>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-sm text-muted-foreground">Amount Due</p>
          <p className="text-2xl font-bold">
            {formatCurrency(rentDueInfo.amount)}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
);

const PaymentDetailsDialog = ({
  payment,
  open,
  onOpenChange,
  onDownloadInvoice,
  isDownloading,
}: {
  payment: PaymentRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownloadInvoice: (id: string) => void;
  isDownloading: boolean;
}) => {
  if (!payment) return null;

  const totalAmount = payment.amount + payment.securityDeposit;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-HG-500">Payment Details</DialogTitle>
          <DialogDescription>
            Complete details of your booking and payment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* PG Info */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
              {payment.listingId?.images?.[0]?.url ? (
                <img
                  src={payment.listingId.images[0].url}
                  alt={payment.listingId.pgName || 'PG'}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <Building className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-lg truncate">
                {payment.listingId?.pgName || 'N/A'}
              </h3>
              <p className="text-muted-foreground truncate">
                {payment.listingId?.location?.area}, {payment.listingId?.location?.city}
              </p>
              <p className="text-sm text-HG-500">{payment.roomType}</p>
            </div>
          </div>

          {/* Booking Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Booking ID</p>
              <p className="font-mono text-sm break-all">{payment._id}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Move-in Date</p>
              <p className="font-medium">
                {formatDate(payment.moveInDate, {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="font-medium">{payment.duration} months</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Payment Method</p>
              <p className="font-medium capitalize">{payment.paymentMethod}</p>
            </div>
          </div>

          {/* Amount Breakdown */}
          <div className="border rounded-lg p-4 space-y-3">
            <h4 className="font-semibold">Amount Breakdown</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly Rent</span>
                <span>{formatCurrency(payment.originalAmount)}</span>
              </div>
              {payment.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount {payment.couponCode && `(${payment.couponCode})`}</span>
                  <span>-{formatCurrency(payment.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Security Deposit</span>
                <span>{formatCurrency(payment.securityDeposit)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total Amount</span>
                <span className="text-HG-500">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Booking Status</p>
              <BookingStatusBadge status={payment.status} />
            </div>
            <div className="space-y-1 text-right">
              <p className="text-sm text-muted-foreground">Payment Status</p>
              <PaymentStatusBadge status={payment.paymentStatus} />
            </div>
          </div>

          {/* Timestamps */}
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Booked on: {formatDate(payment.createdAt)} at {formatTime(payment.createdAt)}</p>
            {payment.cashCollectedAt && (
              <p>Cash collected: {formatDate(payment.cashCollectedAt)}</p>
            )}
            {payment.adminVerifiedAt && (
              <p>Verified: {formatDate(payment.adminVerifiedAt)}</p>
            )}
          </div>

          {/* Download Invoice Button */}
          {payment.paymentStatus === "completed_cash" && (
            <Button
              className="w-full bg-HG-500 hover:bg-HG-600 text-white"
              onClick={() => onDownloadInvoice(payment._id)}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating Invoice...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Download Invoice / Receipt
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ==================== Main Component ====================
export default function PaymentHistoryPage() {
  const { user } = useUserStore();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);
  const [rentDueInfo, setRentDueInfo] = useState<RentDueInfo | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchPaymentHistory = useCallback(async () => {
    if (!user?.id) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    if (!isOnline) {
      setError('No internet connection');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.get<PaymentApiResponse>(
        `/api/user/payments`,
        {
          params: { userId: user.id },
          timeout: 15000, // 15 second timeout
          headers: {
            'Cache-Control': 'no-cache',
          },
        }
      );

      if (response.data.success) {
        setPayments(response.data.data || []);
        if (response.data.rentDueInfo) {
          setRentDueInfo(response.data.rentDueInfo);
        }
      } else {
        throw new Error(response.data.message || 'Failed to fetch payments');
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      console.error('Payment fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, isOnline]);

  useEffect(() => {
    fetchPaymentHistory();
  }, [fetchPaymentHistory]);

  const handleDownloadInvoice = useCallback(async (bookingId: string) => {
    if (!isOnline) {
      toast.error('No internet connection');
      return;
    }

    try {
      setDownloadingInvoice(bookingId);

       const response = await axios.get(`/api/user/payments/invoice/${bookingId}`, {
      responseType: "blob",
      timeout: 30000,
    });


      // Validate response
      if (response.data.size === 0) {
        throw new Error('Empty file received');
      }

      // Create blob link to download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice-${bookingId}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        link.remove();
        window.URL.revokeObjectURL(url);
      }, 100);

      toast.success("Invoice downloaded successfully");
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      toast.error(errorMessage);
      console.error('Invoice download error:', err);
    } finally {
      setDownloadingInvoice(null);
    }
  }, [isOnline]);

  const handleViewDetails = useCallback((payment: PaymentRecord) => {
    setSelectedPayment(payment);
    setShowDetails(true);
  }, []);

  // Memoized calculations
  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      if (filter === "all") return true;
      return payment.paymentStatus === filter;
    });
  }, [payments, filter]);

  const { totalPaid, totalPending } = useMemo(() => {
    return payments.reduce(
      (acc, payment) => {
        const total = payment.amount + payment.securityDeposit;
        if (payment.paymentStatus === "completed_cash") {
          acc.totalPaid += total;
        } else if (["pending", "pending_cash_payment"].includes(payment.paymentStatus)) {
          acc.totalPending += total;
        }
        return acc;
      },
      { totalPaid: 0, totalPending: 0 }
    );
  }, [payments]);

  // Render states
  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchPaymentHistory} />;
  }

  return (
    <div className="space-y-6 pt-4 pb-14">
      {/* Offline Banner */}
      {!isOnline && (
        <Card className="border-orange-300 bg-orange-50">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-orange-700">
              <WifiOff className="h-4 w-4" />
              <span className="text-sm font-medium">
                You're offline. Some features may not work.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-HG-500">Payment History</h1>
          <p className="text-muted-foreground mt-2">
            View your payment history and download invoices
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchPaymentHistory}
          disabled={loading || !isOnline}
          className="self-start"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          title="Total Paid"
          value={totalPaid}
          icon={CheckCircle}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
          valueColor="text-green-600"
        />
        <SummaryCard
          title="Pending Amount"
          value={totalPending}
          icon={Clock}
          iconBgColor="bg-orange-100"
          iconColor="text-orange-600"
          valueColor="text-orange-600"
        />
        <SummaryCard
          title="Total Transactions"
          value={payments.length.toString()}
          icon={Receipt}
          iconBgColor="bg-HG-100"
          iconColor="text-HG-500"
          valueColor="text-HG-500"
        />
      </div>

      {/* Rent Due Reminder Card */}
      {rentDueInfo && <RentDueCard rentDueInfo={rentDueInfo} />}

      {/* Filter and Table */}
      <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl bg-white">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-HG-500">Transaction History</CardTitle>
              <CardDescription>All your booking payments and invoices</CardDescription>
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {FILTER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <EmptyState filter={filter} />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PG Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Room Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="hidden md:table-cell">Booking Status</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {payment.listingId?.images?.[0]?.url ? (
                              <img
                                src={payment.listingId.images[0].url}
                                alt={payment.listingId.pgName || 'PG'}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <Building className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">
                              {payment.listingId?.pgName || "N/A"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {payment.listingId?.location?.area}, {payment.listingId?.location?.city}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {payment.roomType}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {formatCurrency(payment.amount + payment.securityDeposit)}
                          </p>
                          {payment.discountAmount > 0 && (
                            <p className="text-xs text-green-600">
                              Saved {formatCurrency(payment.discountAmount)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <BookingStatusBadge status={payment.status} />
                      </TableCell>
                      <TableCell>
                        <PaymentStatusBadge status={payment.paymentStatus} />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <p className="text-sm">{formatDate(payment.createdAt)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(payment.createdAt)}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(payment)}
                            className="border-HG-500 text-HG-500 hover:bg-HG-50"
                            aria-label="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {payment.paymentStatus === "completed_cash" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadInvoice(payment._id)}
                              disabled={downloadingInvoice === payment._id || !isOnline}
                              className="border-green-500 text-green-600 hover:bg-green-50"
                              aria-label="Download invoice"
                            >
                              {downloadingInvoice === payment._id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Details Dialog */}
      <PaymentDetailsDialog
        payment={selectedPayment}
        open={showDetails}
        onOpenChange={setShowDetails}
        onDownloadInvoice={handleDownloadInvoice}
        isDownloading={downloadingInvoice === selectedPayment?._id}
      />
    </div>
  );
}