// components/payments/PaymentBreakdown.tsx
"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  CreditCard,
  Shield,
  Home,
  Tag,
  IndianRupee,
  Info,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PaymentItem {
  label: string;
  amount: number;
  status: "pending" | "paid" | "failed" | "refunded" | "partially_refunded";
  paidAt?: string | null;
  paymentReference?: string;
  description?: string;
  refundAmount?: number;
}

interface PaymentBreakdownProps {
  bookingFee: PaymentItem;
  securityDeposit: PaymentItem;
  firstMonthRent: PaymentItem;
  originalAmount?: number;
  discountAmount?: number;
  couponCode?: string | null;
  totalDue: number;
  totalPaid: number;
  paymentMethod?: "online" | "cash";
  showDetails?: boolean;
  compact?: boolean;
  className?: string;
}

const STATUS_CONFIG = {
  pending: {
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    icon: Clock,
    label: "Pending",
  },
  paid: {
    color: "bg-green-100 text-green-800 border-green-300",
    icon: CheckCircle,
    label: "Paid",
  },
  failed: {
    color: "bg-red-100 text-red-800 border-red-300",
    icon: XCircle,
    label: "Failed",
  },
  refunded: {
    color: "bg-purple-100 text-purple-800 border-purple-300",
    icon: AlertCircle,
    label: "Refunded",
  },
  partially_refunded: {
    color: "bg-purple-100 text-purple-800 border-purple-300",
    icon: AlertCircle,
    label: "Partially Refunded",
  },
};

const PAYMENT_ICONS = {
  bookingFee: CreditCard,
  securityDeposit: Shield,
  firstMonthRent: Home,
};

function StatusBadge({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`${config.color} flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

function PaymentItemRow({
  item,
  icon: Icon,
  showDetails = true,
}: {
  item: PaymentItem;
  icon: React.ElementType;
  showDetails?: boolean;
}) {
  const formatCurrency = (amount: number) =>
    `₹${amount.toLocaleString("en-IN")}`;

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="flex items-start justify-between py-3 border-b last:border-b-0">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-gray-100 rounded-lg">
          <Icon className="h-4 w-4 text-gray-600" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900">{item.label}</p>
            {item.description && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">{item.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          {showDetails && item.paidAt && (
            <p className="text-xs text-gray-500 mt-0.5">
              Paid on {formatDate(item.paidAt)}
            </p>
          )}
          {showDetails && item.paymentReference && item.status === "paid" && (
            <p className="text-xs text-gray-400 font-mono mt-0.5">
              Ref: {item.paymentReference.slice(0, 16)}...
            </p>
          )}
          {item.refundAmount && item.refundAmount > 0 && (
            <p className="text-xs text-purple-600 mt-0.5">
              Refunded: {formatCurrency(item.refundAmount)}
            </p>
          )}
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold text-gray-900">{formatCurrency(item.amount)}</p>
        <StatusBadge status={item.status} />
      </div>
    </div>
  );
}

export default function PaymentBreakdown({
  bookingFee,
  securityDeposit,
  firstMonthRent,
  originalAmount,
  discountAmount = 0,
  couponCode,
  totalDue,
  totalPaid,
  paymentMethod = "online",
  showDetails = true,
  compact = false,
  className = "",
}: PaymentBreakdownProps) {
  const formatCurrency = (amount: number) =>
    `₹${amount.toLocaleString("en-IN")}`;

  const pendingAmount = useMemo(() => totalDue - totalPaid, [totalDue, totalPaid]);

  const allPaid = useMemo(
    () =>
      bookingFee.status === "paid" &&
      securityDeposit.status === "paid" &&
      firstMonthRent.status === "paid",
    [bookingFee.status, securityDeposit.status, firstMonthRent.status]
  );

  if (compact) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Booking Fee (10%)</span>
          <div className="flex items-center gap-2">
            <span>{formatCurrency(bookingFee.amount)}</span>
            <StatusBadge status={bookingFee.status} />
          </div>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Security Deposit</span>
          <div className="flex items-center gap-2">
            <span>{formatCurrency(securityDeposit.amount)}</span>
            <StatusBadge status={securityDeposit.status} />
          </div>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">First Month Rent (90%)</span>
          <div className="flex items-center gap-2">
            <span>{formatCurrency(firstMonthRent.amount)}</span>
            <StatusBadge status={firstMonthRent.status} />
          </div>
        </div>
        <Separator className="my-2" />
        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span className="text-HG-500">{formatCurrency(totalDue)}</span>
        </div>
      </div>
    );
  }

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <IndianRupee className="h-5 w-5 text-HG-500" />
            Payment Breakdown
          </CardTitle>
          <Badge variant={paymentMethod === "online" ? "default" : "secondary"}>
            {paymentMethod === "online" ? "Online Payment" : "Cash Payment"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {/* Payment Items */}
        <PaymentItemRow
          item={{
            ...bookingFee,
            description: "Non-refundable confirmation fee (10% of monthly rent)",
          }}
          icon={PAYMENT_ICONS.bookingFee}
          showDetails={showDetails}
        />
        <PaymentItemRow
          item={{
            ...securityDeposit,
            description: "Refundable deposit (returned at checkout)",
          }}
          icon={PAYMENT_ICONS.securityDeposit}
          showDetails={showDetails}
        />
        <PaymentItemRow
          item={{
            ...firstMonthRent,
            description: "First month's rent (90% of monthly rent)",
          }}
          icon={PAYMENT_ICONS.firstMonthRent}
          showDetails={showDetails}
        />

        <Separator className="my-4" />

        {/* Discount Section */}
        {discountAmount > 0 && (
          <div className="flex justify-between items-center py-2 text-green-600">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              <span>Discount {couponCode && `(${couponCode})`}</span>
            </div>
            <span className="font-medium">-{formatCurrency(discountAmount)}</span>
          </div>
        )}

        {/* Totals */}
        <div className="bg-gray-50 rounded-lg p-4 mt-4 space-y-2">
          {originalAmount && originalAmount !== totalDue + discountAmount && (
            <div className="flex justify-between text-sm text-gray-500">
              <span>Original Amount</span>
              <span className="line-through">{formatCurrency(originalAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total Amount</span>
            <span className="font-medium">{formatCurrency(totalDue)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Paid Amount</span>
            <span className="font-medium text-green-600">
              {formatCurrency(totalPaid)}
            </span>
          </div>
          {pendingAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Pending Amount</span>
              <span className="font-medium text-orange-600">
                {formatCurrency(pendingAmount)}
              </span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between pt-2">
            <span className="font-semibold text-gray-900">Payment Status</span>
            {allPaid ? (
              <Badge className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Complete
              </Badge>
            ) : (
              <Badge variant="outline" className="border-orange-400 text-orange-600">
                <Clock className="h-3 w-3 mr-1" />
                {formatCurrency(pendingAmount)} Pending
              </Badge>
            )}
          </div>
        </div>

        {/* Payment Method Info */}
        {paymentMethod === "cash" && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800">
              <AlertCircle className="h-4 w-4 inline mr-1" />
              Cash payment will be collected by the owner. Keep proof of payment.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Compact inline breakdown for tables/lists
export function InlinePaymentBreakdown({
  bookingFee,
  securityDeposit,
  firstMonthRent,
  totalPaid,
  totalDue,
}: {
  bookingFee: { amount: number; status: string };
  securityDeposit: { amount: number; status: string };
  firstMonthRent: { amount: number; status: string };
  totalPaid: number;
  totalDue: number;
}) {
  const formatCurrency = (amount: number) =>
    `₹${amount.toLocaleString("en-IN")}`;

  const getStatusIcon = (status: string) => {
    if (status === "paid") return <CheckCircle className="h-3 w-3 text-green-500" />;
    if (status === "pending") return <Clock className="h-3 w-3 text-yellow-500" />;
    return <XCircle className="h-3 w-3 text-red-500" />;
  };

  return (
    <div className="space-y-1 text-xs">
      <div className="flex items-center gap-1">
        {getStatusIcon(bookingFee.status)}
        <span>Booking: {formatCurrency(bookingFee.amount)}</span>
      </div>
      <div className="flex items-center gap-1">
        {getStatusIcon(securityDeposit.status)}
        <span>Deposit: {formatCurrency(securityDeposit.amount)}</span>
      </div>
      <div className="flex items-center gap-1">
        {getStatusIcon(firstMonthRent.status)}
        <span>Rent: {formatCurrency(firstMonthRent.amount)}</span>
      </div>
      <div className="pt-1 border-t font-medium">
        {formatCurrency(totalPaid)} / {formatCurrency(totalDue)}
      </div>
    </div>
  );
}