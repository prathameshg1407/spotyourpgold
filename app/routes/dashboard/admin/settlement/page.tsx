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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Wallet,
  BarChart3,
  ArrowUpRight,
  Phone,
  Mail,
  RefreshCw,
  Eye,
  Building,
} from "lucide-react";

interface SettlementData {
  overview: {
    totalRevenue: number;
    pendingRevenue: number;
    totalCommissionsCollected: number;
    pendingCommissions: number;
    overdueCommissions: number;
  };
  commissionBreakdown: {
    pending: { count: number; amount: number };
    settled: { count: number; amount: number };
    overdue: { count: number; amount: number };
  };
  topOwnersPending: {
    ownerId: string;
    ownerName: string;
    ownerEmail: string;
    ownerPhone: string;
    totalPending: number;
    count: number;
  }[];
  monthlyTrend: any[];
  recentSettlements: any[];
  overdueList: any[];
  bookingStats: {
    totalBookings: number;
    cashPaymentsCount: number;
  };
}

export default function AdminSettlementDashboardPage() {
  const [data, setData] = useState<SettlementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOwner, setSelectedOwner] = useState<any>(null);

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

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-HG-500 mx-auto mb-4"></div>
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
            Settlement <span className="text-HG-500">Dashboard</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Platform-wide commission and settlement overview
          </p>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Overview Cards */}
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
                  <ArrowUpRight className="h-3 w-3" />
                  {data.overview.totalCommissionsCollected} settled
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
                <p className="text-xs text-yellow-600 mt-1">
                  {data.overview.pendingCommissions} pending commissions
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-200 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Overdue</p>
                <p className="text-2xl font-bold text-red-800">
                  {data.overview.overdueCommissions}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Require immediate attention
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-200 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-700" />
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
                  {data.bookingStats.totalBookings}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {data.bookingStats.cashPaymentsCount} cash payments
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Commissions</p>
                <p className="text-xl font-bold text-yellow-600">
                  {formatCurrency(data.commissionBreakdown.pending.amount)}
                </p>
                <p className="text-xs text-gray-500">
                  {data.commissionBreakdown.pending.count} entries
                </p>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800">
                <Clock className="w-3 h-3 mr-1" />
                Pending
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Settled Commissions</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(data.commissionBreakdown.settled.amount)}
                </p>
                <p className="text-xs text-gray-500">
                  {data.commissionBreakdown.settled.count} entries
                </p>
              </div>
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Settled
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue Commissions</p>
                <p className="text-xl font-bold text-red-600">
                  {formatCurrency(data.commissionBreakdown.overdue.amount)}
                </p>
                <p className="text-xs text-gray-500">
                  {data.commissionBreakdown.overdue.count} entries
                </p>
              </div>
              <Badge className="bg-red-100 text-red-800">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Overdue
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Owners with Pending Commissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-HG-500" />
            Top Owners - Pending Commissions
          </CardTitle>
          <CardDescription>Owners with highest pending commission amounts</CardDescription>
        </CardHeader>
        <CardContent>
          {data.topOwnersPending.length === 0 ? (
            <p className="text-center text-gray-500 py-4">
              No pending commissions from owners
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Owner</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-center">Pending Items</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topOwnersPending.map((owner, idx) => (
                    <TableRow key={owner.ownerId}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${
                              idx === 0
                                ? "bg-red-100 text-red-700"
                                : idx === 1
                                ? "bg-orange-100 text-orange-700"
                                : idx === 2
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-medium">{owner.ownerName}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="flex items-center gap-1 text-gray-600">
                            <Mail className="h-3 w-3" />
                            {owner.ownerEmail}
                          </p>
                          {owner.ownerPhone && (
                            <p className="flex items-center gap-1 text-gray-600">
                              <Phone className="h-3 w-3" />
                              {owner.ownerPhone}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{owner.count}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-red-600">
                        {formatCurrency(owner.totalPending)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(
                              `/routes/dashboard/admin/commissions?ownerId=${owner.ownerId}`,
                              "_blank"
                            )
                          }
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
          )}
        </CardContent>
      </Card>

      {/* Recent Settlements & Overdue Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Settlements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Recent Settlements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentSettlements.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No recent settlements</p>
            ) : (
              <div className="space-y-3">
                {data.recentSettlements.slice(0, 5).map((settlement: any) => (
                  <div
                    key={settlement._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {settlement.ownerId?.fullName || "Owner"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {settlement.bookingId?.listingId?.pgName || "Property"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        {formatCurrency(settlement.commissionAmount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(settlement.settledAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overdue List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Overdue Commissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.overdueList.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No overdue commissions</p>
            ) : (
              <div className="space-y-3">
                {data.overdueList.slice(0, 5).map((overdue: any) => (
                  <div
                    key={overdue._id}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {overdue.ownerId?.fullName || "Owner"}
                      </p>
                      <p className="text-xs text-gray-500">
                        Due: {formatDate(overdue.dueDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">
                        {formatCurrency(overdue.commissionAmount)}
                      </p>
                      <Badge variant="outline" className="border-red-300 text-red-600 text-xs">
                        Overdue
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {data.overdueList.length > 5 && (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() =>
                  window.open("/routes/dashboard/admin/commissions?status=overdue", "_blank")
                }
              >
                View All Overdue ({data.overdueList.length})
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}