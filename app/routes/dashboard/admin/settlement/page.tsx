"use client";

import { useState, useEffect } from "react";
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
import { Progress } from "@/components/ui/progress";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertTriangle,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Building,
  Banknote,
  CreditCard,
  Users,
  Mail,
} from "lucide-react";
import Link from "next/link";

interface SettlementData {
  overview: {
    totalRevenue: number;
    totalReceivables: number;
    totalPayables: number;
    netPosition: number;
    revenue: {
      onlineBookingFees: number;
      cashBookingFeeCollected: number;
      monthlyCommissionCollected: number;
    };
    receivables: {
      cashBookingFeePending: number;
      monthlyCommissionPending: number;
      monthlyCommissionOverdue: number;
    };
    payables: {
      firstMonthPayoutPending: number;
      firstMonthPayoutCompleted: number;
      depositPending: number;
      depositCompleted: number;
      monthlyPayoutPending: number;
      monthlyPayoutCompleted: number;
    };
  };
  pendingOwnerPayouts: Array<{
    ownerId: string;
    ownerName: string;
    ownerEmail: string;
    firstMonthPending: number;
    depositPending: number;
    totalPending: number;
    count: number;
  }>;
  topOwnersPendingCommissions: Array<{
    ownerId: string;
    ownerName: string;
    ownerEmail: string;
    ownerPhone: string;
    totalPending: number;
    count: number;
    overdueCount: number;
  }>;
  monthlyTrend: any[];
  recentActivity: any[];
  bookingStats: {
    total: number;
    confirmed: number;
    active: number;
    online: number;
    cash: number;
  };
}

export default function AdminSettlementDashboardPage() {
  const [data, setData] = useState<SettlementData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/admin/settlement-summary");
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      toast.error("Failed to fetch settlement data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

const formatCurrency = (amount: number | undefined | null): string => {
  // Handle undefined, null, or NaN values
  if (amount === undefined || amount === null || isNaN(amount)) {
    return "₹0";
  }
  return `₹${amount.toLocaleString("en-IN")}`;
};

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading settlement dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Failed to load data</p>
        <Button onClick={fetchData} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const { overview } = data;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-poppins">
            Settlement <span className="text-primary">Dashboard</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Platform financial overview and settlement tracking
          </p>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Main Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Total Revenue</p>
                <p className="text-2xl font-bold text-green-800">
                  {formatCurrency(overview.totalRevenue)}
                </p>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  10% commission collected
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Receivables</p>
                <p className="text-2xl font-bold text-orange-800">
                  {formatCurrency(overview.totalReceivables)}
                </p>
                <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                  <ArrowDownLeft className="h-3 w-3" />
                  Owner owes admin
                </p>
              </div>
              <ArrowDownLeft className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Payables</p>
                <p className="text-2xl font-bold text-blue-800">
                  {formatCurrency(overview.totalPayables)}
                </p>
                               <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" />
                  Admin owes owner
                </p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`bg-gradient-to-br ${
            overview.netPosition >= 0
              ? "from-emerald-50 to-emerald-100 border-emerald-200"
              : "from-red-50 to-red-100 border-red-200"
          }`}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-sm font-medium ${
                    overview.netPosition >= 0 ? "text-emerald-700" : "text-red-700"
                  }`}
                >
                  Net Position
                </p>
                <p
                  className={`text-2xl font-bold ${
                    overview.netPosition >= 0 ? "text-emerald-800" : "text-red-800"
                  }`}
                >
                  {formatCurrency(Math.abs(overview.netPosition))}
                </p>
                <p
                  className={`text-xs mt-1 ${
                    overview.netPosition >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {overview.netPosition >= 0 ? "Net positive" : "Net liability"}
                </p>
              </div>
              <Wallet
                className={`h-8 w-8 ${
                  overview.netPosition >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Booking Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-gray-500">Total Bookings</p>
            <p className="text-2xl font-bold">{data.bookingStats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-blue-600">Confirmed</p>
            <p className="text-2xl font-bold text-blue-700">{data.bookingStats.confirmed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-green-600">Active</p>
            <p className="text-2xl font-bold text-green-700">{data.bookingStats.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-purple-600">Online</p>
            <p className="text-2xl font-bold text-purple-700">{data.bookingStats.online}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-orange-600">Cash</p>
            <p className="text-2xl font-bold text-orange-700">{data.bookingStats.cash}</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Revenue (Collected)
            </CardTitle>
            <CardDescription>10% commission already received</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Online Booking Fees</p>
                <p className="text-xs text-gray-500">Auto-collected via Razorpay</p>
              </div>
              <p className="font-bold text-green-700">
                {formatCurrency(overview.revenue.onlineBookingFees)}
              </p>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Cash Booking Fees</p>
                <p className="text-xs text-gray-500">Received from owners</p>
              </div>
              <p className="font-bold text-green-700">
                {formatCurrency(overview.revenue.cashBookingFeeCollected)}
              </p>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Monthly Commissions</p>
                <p className="text-xs text-gray-500">Received from owners</p>
              </div>
              <p className="font-bold text-green-700">
                {formatCurrency(overview.revenue.monthlyCommissionCollected)}
              </p>
            </div>
            <div className="border-t pt-3 flex justify-between items-center">
              <p className="font-semibold">Total Revenue</p>
              <p className="text-xl font-bold text-green-700">
                {formatCurrency(overview.totalRevenue)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Receivables Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ArrowDownLeft className="h-5 w-5 text-orange-500" />
              Receivables (Pending)
            </CardTitle>
            <CardDescription>10% commission owed by owners</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Cash Booking Fees</p>
                <p className="text-xs text-gray-500">Pending from owners</p>
              </div>
              <p className="font-bold text-orange-700">
                {formatCurrency(overview.receivables.cashBookingFeePending)}
              </p>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Monthly Commissions</p>
                <p className="text-xs text-gray-500">Pending from owners</p>
              </div>
              <p className="font-bold text-yellow-700">
                {formatCurrency(overview.receivables.monthlyCommissionPending)}
              </p>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Overdue Commissions</p>
                <p className="text-xs text-red-500">Past due date</p>
              </div>
              <p className="font-bold text-red-700">
                {formatCurrency(overview.receivables.monthlyCommissionOverdue)}
              </p>
            </div>
            <div className="border-t pt-3 flex justify-between items-center">
              <p className="font-semibold">Total Receivables</p>
              <p className="text-xl font-bold text-orange-700">
                {formatCurrency(overview.totalReceivables)}
              </p>
            </div>

            <Link href="/routes/dashboard/admin/commissions">
              <Button variant="outline" className="w-full">
                <DollarSign className="h-4 w-4 mr-2" />
                Manage Commissions
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Payables Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ArrowUpRight className="h-5 w-5 text-blue-500" />
              Payables (To Owners)
            </CardTitle>
            <CardDescription>90% due to property owners</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm font-medium">First Month Rent (90%)</p>
                <p className="text-xs text-gray-500">Pending payout</p>
              </div>
              <p className="font-bold text-blue-700">
                {formatCurrency(overview.payables.firstMonthPayoutPending)}
              </p>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Security Deposits</p>
                <p className="text-xs text-gray-500">Pending transfer</p>
              </div>
              <p className="font-bold text-purple-700">
                {formatCurrency(overview.payables.depositPending)}
              </p>
            </div>
            <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Monthly Rent (90%)</p>
                <p className="text-xs text-gray-500">Pending payout</p>
              </div>
              <p className="font-bold text-indigo-700">
                {formatCurrency(overview.payables.monthlyPayoutPending)}
              </p>
            </div>
            <div className="border-t pt-3 flex justify-between items-center">
              <p className="font-semibold">Total Payables</p>
              <p className="text-xl font-bold text-blue-700">
                {formatCurrency(overview.totalPayables)}
              </p>
            </div>

            <Link href="/routes/dashboard/admin/owner-payouts">
              <Button variant="outline" className="w-full">
                <Wallet className="h-4 w-4 mr-2" />
                Process Payouts
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Lists Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Owner Payouts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-blue-500" />
              Pending Owner Payouts
            </CardTitle>
            <CardDescription>Owners waiting for their 90% share</CardDescription>
          </CardHeader>
          <CardContent>
            {data.pendingOwnerPayouts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                <p className="text-gray-600">All payouts completed!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.pendingOwnerPayouts.slice(0, 5).map((owner, idx) => (
                  <div
                    key={owner.ownerId}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          idx === 0
                            ? "bg-blue-100 text-blue-700"
                            : idx === 1
                            ? "bg-blue-50 text-blue-600"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{owner.ownerName}</p>
                        <p className="text-xs text-gray-500">{owner.count} booking(s)</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">
                        {formatCurrency(owner.totalPending)}
                      </p>
                      <div className="flex gap-1 text-xs text-gray-500">
                        {owner.firstMonthPending > 0 && (
                          <span>90%: {formatCurrency(owner.firstMonthPending)}</span>
                        )}
                        {owner.depositPending > 0 && (
                          <span>Dep: {formatCurrency(owner.depositPending)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {data.pendingOwnerPayouts.length > 5 && (
                  <Link href="/routes/dashboard/admin/owner-payouts">
                    <Button variant="link" className="w-full">
                      View all {data.pendingOwnerPayouts.length} owners
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Owners Owing Commissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDownLeft className="h-5 w-5 text-orange-500" />
              Owners Owing Commissions
            </CardTitle>
            <CardDescription>10% commission due from owners</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topOwnersPendingCommissions.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                <p className="text-gray-600">All commissions collected!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.topOwnersPendingCommissions.slice(0, 5).map((owner, idx) => (
                  <div
                    key={owner.ownerId}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          idx === 0
                            ? "bg-red-100 text-red-700"
                            : idx === 1
                            ? "bg-orange-100 text-orange-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{owner.ownerName}</p>
                        <p className="text-xs text-gray-500">
                          {owner.count} pending
                          {owner.overdueCount > 0 && (
                            <span className="text-red-500 ml-1">
                              ({owner.overdueCount} overdue)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-orange-600">
                        {formatCurrency(owner.totalPending)}
                      </p>
                      {owner.ownerPhone && (
                        <p className="text-xs text-gray-500">{owner.ownerPhone}</p>
                      )}
                    </div>
                  </div>
                ))}

                {data.topOwnersPendingCommissions.length > 5 && (
                  <Link href="/routes/dashboard/admin/commissions?status=pending">
                    <Button variant="link" className="w-full">
                      View all {data.topOwnersPendingCommissions.length} owners
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Commission Activity</CardTitle>
          <CardDescription>Latest commission transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {data.recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No recent activity</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentActivity.slice(0, 10).map((activity: any) => (
                    <TableRow key={activity._id}>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            activity.commissionType?.includes("booking_fee")
                              ? "border-orange-300 text-orange-700"
                              : activity.commissionType?.includes("payout")
                              ? "border-blue-300 text-blue-700"
                              : "border-green-300 text-green-700"
                          }
                        >
                          {activity.commissionType === "booking_fee_revenue" && "Booking Fee"}
                          {activity.commissionType === "booking_fee_receivable" && "Booking Fee"}
                          {activity.commissionType === "first_month_payout" && "First Month"}
                          {activity.commissionType === "security_deposit_payout" && "Deposit"}
                          {activity.commissionType === "monthly_rent_payout" && "Monthly Payout"}
                          {activity.commissionType === "monthly_rent_commission" && "Monthly Comm"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {activity.ownerId?.fullName || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell>{activity.listingId?.pgName || "N/A"}</TableCell>
                      <TableCell className="font-bold">
                        {formatCurrency(activity.amount)}
                      </TableCell>
                      <TableCell>
                        {activity.direction === "admin_received" && (
                          <Badge className="bg-green-100 text-green-800">
                            <ArrowDownLeft className="w-3 h-3 mr-1" />
                            Received
                          </Badge>
                        )}
                        {activity.direction === "admin_owes_owner" && (
                          <Badge className="bg-blue-100 text-blue-800">
                            <ArrowUpRight className="w-3 h-3 mr-1" />
                            To Owner
                          </Badge>
                        )}
                        {activity.direction === "owner_owes_admin" && (
                          <Badge className="bg-orange-100 text-orange-800">
                            <ArrowDownLeft className="w-3 h-3 mr-1" />
                            From Owner
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            activity.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : activity.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {activity.status === "completed" && (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          )}
                          {activity.status === "pending" && (
                            <Clock className="w-3 h-3 mr-1" />
                          )}
                          {activity.status === "overdue" && (
                            <AlertTriangle className="w-3 h-3 mr-1" />
                          )}
                          {activity.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(activity.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/routes/dashboard/admin/cash-payments">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <Banknote className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold">Cash Payments</p>
                  <p className="text-sm text-gray-500">
                    Verify cash payment proofs
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/routes/dashboard/admin/owner-payouts">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold">Owner Payouts</p>
                  <p className="text-sm text-gray-500">
                    Process 90% payouts to owners
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/routes/dashboard/admin/commissions">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold">Commissions</p>
                  <p className="text-sm text-gray-500">
                    Collect 10% from owners
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Payment Flow Info */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-lg">Payment Flow Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Online Flow */}
            <div className="p-4 bg-white rounded-lg border">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <h4 className="font-semibold text-blue-800">Online Payment Flow</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
                    1
                  </div>
                  <span>User pays 100% to Admin (Razorpay)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-700">
                    2
                  </div>
                  <span>Admin keeps 10% (Revenue)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-xs font-bold text-orange-700">
                    3
                  </div>
                  <span>Admin pays 90% to Owner (Payout)</span>
                </div>
              </div>
            </div>

            {/* Cash Flow */}
            <div className="p-4 bg-white rounded-lg border">
              <div className="flex items-center gap-2 mb-3">
                <Banknote className="h-5 w-5 text-orange-600" />
                <h4 className="font-semibold text-orange-800">Cash Payment Flow</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-xs font-bold text-orange-700">
                    1
                  </div>
                  <span>User pays 100% to Owner (Cash)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
                    2
                  </div>
                  <span>Owner keeps 90%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-700">
                    3
                  </div>
                  <span>Owner pays 10% to Admin (Commission)</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}