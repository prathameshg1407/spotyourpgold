// app/routes/dashboard/admin/settlement/page.tsx
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
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Phone,
  Mail,
  RefreshCw,
  Eye,
  Building,
  Banknote,
  CreditCard,
} from "lucide-react";
import Link from "next/link";

interface SettlementData {
  overview: {
    totalRevenue: number;
    pendingRevenue: number;
    pendingOwnerPayouts: number;
    firstMonth: {
      adminReceived: number;
      adminPending: number;
      ownerPaid: number;
      ownerPending: number;
    };
    monthlyRent: {
      collected: number;
      pending: number;
      overdue: number;
    };
  };
  pendingOwnerPayouts: Array<{
    ownerId: string;
    ownerName: string;
    ownerEmail: string;
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
  }>;
  monthlyTrend: any[];
  recentActivity: any[];
  bookingStats: {
    totalConfirmed: number;
    cashPaymentsCompleted: number;
    pendingPayouts: number;
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

  const formatCurrency = (amount: number) =>
    `₹${amount.toLocaleString("en-IN")}`;

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

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-poppins">
            Settlement <span className="text-primary">Dashboard</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Platform revenue and settlement overview
          </p>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Main Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Total Revenue</p>
                <p className="text-2xl font-bold text-green-800">
                  {formatCurrency(data.overview.totalRevenue)}
                </p>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Commission collected
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-200 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700">Pending Revenue</p>
                <p className="text-2xl font-bold text-yellow-800">
                  {formatCurrency(data.overview.pendingRevenue)}
                </p>
                <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Awaiting settlement
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-200 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Owner Payouts Due</p>
                <p className="text-2xl font-bold text-orange-800">
                  {formatCurrency(data.overview.pendingOwnerPayouts)}
                </p>
                <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" />
                  90% to pay owners
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-200 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-orange-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Bookings</p>
                <p className="text-2xl font-bold text-blue-800">
                  {data.bookingStats.totalConfirmed}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {data.bookingStats.cashPaymentsCompleted} cash payments
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-200 flex items-center justify-center">
                <Building className="h-6 w-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commission Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* First Month Split */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              First Month Commission Split
            </CardTitle>
            <CardDescription>
              10% to Admin, 90% to Owner from each booking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowDownLeft className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">
                    Admin Received (10%)
                  </span>
                </div>
                <p className="text-2xl font-bold text-blue-800">
                  {formatCurrency(data.overview.firstMonth.adminReceived)}
                </p>
                {data.overview.firstMonth.adminPending > 0 && (
                  <p className="text-xs text-blue-600 mt-1">
                    +{formatCurrency(data.overview.firstMonth.adminPending)} pending
                  </p>
                )}
              </div>

              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowUpRight className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-700">
                    Owner Payouts (90%)
                  </span>
                </div>
                <p className="text-2xl font-bold text-orange-800">
                  {formatCurrency(data.overview.firstMonth.ownerPending)}
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  {formatCurrency(data.overview.firstMonth.ownerPaid)} already paid
                </p>
              </div>
            </div>

            <Link href="/routes/dashboard/admin/owner-payouts">
              <Button variant="outline" className="w-full">
                <Wallet className="h-4 w-4 mr-2" />
                Manage Owner Payouts
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Monthly Rent Commissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-primary" />
              Monthly Rent Commissions
            </CardTitle>
            <CardDescription>
              10% of rent collected by owners (owed to admin)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <p className="text-xs text-green-600">Collected</p>
                <p className="text-lg font-bold text-green-700">
                  {formatCurrency(data.overview.monthlyRent.collected)}
                </p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg text-center">
                <p className="text-xs text-yellow-600">Pending</p>
                <p className="text-lg font-bold text-yellow-700">
                  {formatCurrency(data.overview.monthlyRent.pending)}
                </p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg text-center">
                <p className="text-xs text-red-600">Overdue</p>
                <p className="text-lg font-bold text-red-700">
                  {formatCurrency(data.overview.monthlyRent.overdue)}
                </p>
              </div>
            </div>

            {/* Progress */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Collection Progress</span>
                <span className="font-medium">
                  {data.overview.monthlyRent.collected + data.overview.monthlyRent.pending > 0
                    ? Math.round(
                        (data.overview.monthlyRent.collected /
                          (data.overview.monthlyRent.collected +
                            data.overview.monthlyRent.pending +
                            data.overview.monthlyRent.overdue)) *
                          100
                      )
                    : 0}
                  %
                </span>
              </div>
              <Progress
                value={
                  data.overview.monthlyRent.collected + data.overview.monthlyRent.pending > 0
                    ? (data.overview.monthlyRent.collected /
                        (data.overview.monthlyRent.collected +
                          data.overview.monthlyRent.pending +
                          data.overview.monthlyRent.overdue)) *
                      100
                    : 0
                }
                className="h-2"
              />
            </div>

            <Link href="/routes/dashboard/admin/commissions?type=monthly_rent">
              <Button variant="outline" className="w-full">
                <DollarSign className="h-4 w-4 mr-2" />
                Manage Commissions
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Owner Payouts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-orange-500" />
              Pending Owner Payouts
            </CardTitle>
            <CardDescription>Owners waiting for their 90% share</CardDescription>
          </CardHeader>
          <CardContent>
            {data.pendingOwnerPayouts.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                <p className="text-gray-600">All payouts completed!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.pendingOwnerPayouts.slice(0, 5).map((owner, idx) => (
                  <div
                    key={owner.ownerId}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          idx === 0
                            ? "bg-orange-100 text-orange-700"
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
                    <p className="font-bold text-orange-600">
                      {formatCurrency(owner.totalPending)}
                    </p>
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

        {/* Owners with Pending Commissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDownLeft className="h-5 w-5 text-green-500" />
              Owners Owing Commissions
            </CardTitle>
            <CardDescription>Monthly rent commissions due to admin</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topOwnersPendingCommissions.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                <p className="text-gray-600">All commissions collected!</p>
              </div>
            ) : (
              <div className="space-y-3">
// app/routes/dashboard/admin/settlement/page.tsx (continued)

                {data.topOwnersPendingCommissions.slice(0, 5).map((owner, idx) => (
                  <div
                    key={owner.ownerId}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
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
                        <p className="text-xs text-gray-500 flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          {owner.ownerEmail}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">
                        {formatCurrency(owner.totalPending)}
                      </p>
                      <p className="text-xs text-gray-500">{owner.count} pending</p>
                    </div>
                  </div>
                ))}

                {data.topOwnersPendingCommissions.length > 5 && (
                  <Link href="/routes/dashboard/admin/commissions?type=monthly_rent&status=pending">
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
            <div className="text-center py-6">
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
                            activity.commissionType === "first_month_admin"
                              ? "border-blue-300 text-blue-700"
                              : activity.commissionType === "first_month_owner"
                              ? "border-orange-300 text-orange-700"
                              : "border-green-300 text-green-700"
                          }
                        >
                          {activity.commissionType === "first_month_admin" && (
                            <ArrowDownLeft className="w-3 h-3 mr-1" />
                          )}
                          {activity.commissionType === "first_month_owner" && (
                            <ArrowUpRight className="w-3 h-3 mr-1" />
                          )}
                          {activity.commissionType === "monthly_rent" && (
                            <Banknote className="w-3 h-3 mr-1" />
                          )}
                          {activity.commissionType === "first_month_admin"
                            ? "Admin 10%"
                            : activity.commissionType === "first_month_owner"
                            ? "Owner 90%"
                            : "Monthly 10%"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {activity.ownerId?.fullName || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell>{activity.listingId?.pgName || "N/A"}</TableCell>
                      <TableCell className="font-bold">
                        {formatCurrency(activity.commissionAmount)}
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
                      <TableCell>{formatDate(activity.createdAt)}</TableCell>
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
        <Link href="/routes/dashboard/admin/owner-payouts">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold">Owner Payouts</p>
                  <p className="text-sm text-gray-500">
                    Pay 90% to property owners
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
                  <p className="font-semibold">Commission Ledger</p>
                  <p className="text-sm text-gray-500">
                    Track all commission transactions
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/routes/dashboard/admin/commission-settings">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold">Commission Settings</p>
                  <p className="text-sm text-gray-500">
                    Manage owner commission rates
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}