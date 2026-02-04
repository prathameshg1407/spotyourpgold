// app/routes/dashboard/owners/settlement/page.tsx
"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Wallet,
  Building,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  PiggyBank,
  Receipt,
  RefreshCw,
  Info,
  Banknote,
} from "lucide-react";

interface SettlementData {
  overview: {
    payoutReceived: number;
    payoutPending: number;
    commissionPaid: number;
    commissionPending: number;
    netPosition: number;
    netPositionLabel: string;
    securityDepositsHeld: number;
  };
  rentSummary: {
    totalRentCollected: number;
    pendingRent: number;
    overdueRent: number;
    activeAllocations: number;
  };
  commissions: {
    payouts: {
      received: { count: number; amount: number };
      pending: { count: number; amount: number };
    };
    owed: {
      paid: { count: number; amount: number };
      pending: { count: number; amount: number };
      overdue: { count: number; amount: number };
    };
  };
  recentPayouts: any[];
  recentCommissionPayments: any[];
  monthlyBreakdown: any[];
  commissionRate: number;
  listingsCount: number;
}

export default function OwnerSettlementPage() {
  const [data, setData] = useState<SettlementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/owner/settlement-summary");
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      toast.error("Failed to fetch settlement data");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    `₹${Math.abs(amount).toLocaleString("en-IN")}`;

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="border-yellow-300 text-yellow-700">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="border-green-300 text-green-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case "overdue":
        return (
          <Badge variant="outline" className="border-red-300 text-red-700">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Overdue
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading settlement data...</p>
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

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-poppins">
            Settlement <span className="text-primary">Summary</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Track your payouts and commission obligations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            Commission Rate: {data.commissionRate}%
          </Badge>
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* How It Works Banner */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">How Commission Works:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>
                  <strong>First Month Booking:</strong> Admin receives 10%, you receive 90% (paid separately by admin)
                </li>
                <li>
                  <strong>Monthly Rent (2nd month onwards):</strong> You collect 100%, owe 10% commission to admin
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Payout from Admin */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">
                  Payout Received
                </p>
                <p className="text-2xl font-bold text-green-800">
                  {formatCurrency(data.overview.payoutReceived)}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  90% from first month bookings
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-200 flex items-center justify-center">
                <ArrowDownLeft className="h-6 w-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Payout */}
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700">
                  Payout Pending
                </p>
                <p className="text-2xl font-bold text-yellow-800">
                  {formatCurrency(data.overview.payoutPending)}
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  {data.commissions.payouts.pending.count} booking(s) pending
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-200 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Commission Paid */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">
                  Commission Paid
                </p>
                <p className="text-2xl font-bold text-blue-800">
                  {formatCurrency(data.overview.commissionPaid)}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {data.commissions.owed.paid.count} settlements
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-200 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Commission Pending */}
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">
                  Commission Owed
                </p>
                <p className="text-2xl font-bold text-red-800">
                  {formatCurrency(data.overview.commissionPending)}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  {data.commissions.owed.pending.count + data.commissions.owed.overdue.count} pending
                  {data.commissions.owed.overdue.count > 0 && (
                    <span className="text-red-700 font-medium">
                      {" "}({data.commissions.owed.overdue.count} overdue)
                    </span>
                  )}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-200 flex items-center justify-center">
                <ArrowUpRight className="h-6 w-6 text-red-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Net Position Card */}
      <Card
        className={`${
          data.overview.netPosition >= 0
            ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-300"
            : "bg-gradient-to-r from-red-50 to-orange-50 border-red-300"
        }`}
      >
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`h-14 w-14 rounded-full flex items-center justify-center ${
                  data.overview.netPosition >= 0
                    ? "bg-green-200"
                    : "bg-red-200"
                }`}
              >
                {data.overview.netPosition >= 0 ? (
                  <TrendingUp className="h-7 w-7 text-green-700" />
                ) : (
                  <TrendingDown className="h-7 w-7 text-red-700" />
                )}
              </div>
              <div>
                <p
                  className={`text-sm font-medium ${
                    data.overview.netPosition >= 0
                      ? "text-green-700"
                      : "text-red-700"
                  }`}
                >
                  {data.overview.netPositionLabel}
                </p>
                <p
                  className={`text-3xl font-bold ${
                    data.overview.netPosition >= 0
                      ? "text-green-800"
                      : "text-red-800"
                  }`}
                >
                  {formatCurrency(data.overview.netPosition)}
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-600 md:text-right">
              <p>
                Pending Payout: <span className="font-medium text-green-600">+{formatCurrency(data.overview.payoutPending)}</span>
              </p>
              <p>
                Commission Owed: <span className="font-medium text-red-600">-{formatCurrency(data.overview.commissionPending)}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Rent Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                Rent Collection Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Rent Collected</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(data.rentSummary.totalRentCollected)}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Pending Rent</p>
                  <p className="text-xl font-bold text-yellow-600">
                    {formatCurrency(data.rentSummary.pendingRent)}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Overdue Rent</p>
                  <p className="text-xl font-bold text-red-600">
                    {formatCurrency(data.rentSummary.overdueRent)}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Active Tenants</p>
                  <p className="text-xl font-bold text-blue-600">
                    {data.rentSummary.activeAllocations}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Deposits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-primary" />
                Security Deposits Held
              </CardTitle>
              <CardDescription>
                Refundable deposits from active tenants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(data.overview.securityDepositsHeld)}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  To be refunded when tenants move out
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payouts Tab (90% from Admin) */}
        <TabsContent value="payouts" className="space-y-4">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="py-4">
              <div className="flex items-center gap-2 text-green-800">
                <ArrowDownLeft className="h-5 w-5" />
                <p className="font-medium">
                  Payouts represent the 90% share you receive from first month bookings (admin pays you)
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Received</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(data.commissions.payouts.received.amount)}
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    {data.commissions.payouts.received.count} payouts
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {formatCurrency(data.commissions.payouts.pending.amount)}
                    </p>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    {data.commissions.payouts.pending.count} pending
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Payouts */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Payouts Received</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentPayouts.length === 0 ? (
                <div className="text-center py-8">
                  <Wallet className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No payouts received yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.recentPayouts.map((payout: any) => (
                    <div
                      key={payout._id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">
                          {payout.bookingId?.listingId?.pgName || "N/A"}
                        </p>
                        <p className="text-sm text-gray-500">
                          Tenant: {payout.bookingId?.fullName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          {formatCurrency(payout.commissionAmount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {payout.settledAt ? formatDate(payout.settledAt) : "N/A"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commissions Tab (10% to Admin) */}
        <TabsContent value="commissions" className="space-y-4">
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="py-4">
              <div className="flex items-center gap-2 text-orange-800">
                <ArrowUpRight className="h-5 w-5" />
                <p className="font-medium">
                  Commissions represent the 10% you owe to admin from monthly rent collections
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Paid</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(data.commissions.owed.paid.amount)}
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {data.commissions.owed.paid.count}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {formatCurrency(data.commissions.owed.pending.amount)}
                    </p>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    <Clock className="w-3 h-3 mr-1" />
                    {data.commissions.owed.pending.count}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className={data.commissions.owed.overdue.count > 0 ? "border-red-300" : ""}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Overdue</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(data.commissions.owed.overdue.amount)}
                    </p>
                  </div>
                  <Badge className="bg-red-100 text-red-800">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {data.commissions.owed.overdue.count}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Commission Payment Info */}
          {(data.commissions.owed.pending.count > 0 ||
            data.commissions.owed.overdue.count > 0) && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">How to settle commissions:</p>
                    <p className="mt-1">
                      Please contact the admin to settle your pending commissions.
                      You can pay via bank transfer, UPI, or cash.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          {/* Monthly Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Breakdown</CardTitle>
              <CardDescription>Last 6 months commission activity</CardDescription>
            </CardHeader>
            <CardContent>
              {data.monthlyBreakdown.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No data available yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Count</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.monthlyBreakdown.map((item: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell>
                            {new Date(item._id.year, item._id.month - 1).toLocaleDateString(
                              "en-IN",
                              { month: "long", year: "numeric" }
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                item._id.type === "first_month_owner"
                                  ? "border-green-300 text-green-700"
                                  : "border-orange-300 text-orange-700"
                              }
                            >
                              {item._id.type === "first_month_owner"
                                ? "Payout (90%)"
                                : "Commission (10%)"}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.count}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.totalAmount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Commission Settlements */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Commission Payments</CardTitle>
              <CardDescription>Your payments to admin</CardDescription>
            </CardHeader>
            <CardContent>
              {data.recentCommissionPayments.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No commission payments yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.recentCommissionPayments.map((payment: any) => (
                    <div
                      key={payment._id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">
                          {payment.listingId?.pgName || "N/A"}
                        </p>
                        <p className="text-sm text-gray-500">
                          Month {payment.monthNumber}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          {formatCurrency(payment.commissionAmount)}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {payment.settlementMethod?.replace("_", " ")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}