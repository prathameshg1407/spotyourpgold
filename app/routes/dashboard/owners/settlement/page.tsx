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
  ArrowDownRight,
  PiggyBank,
  Receipt,
} from "lucide-react";

interface SettlementData {
  overview: {
    totalEarnings: number;
    totalCommissionPaid: number;
    totalCommissionOwed: number;
    netPayout: number;
    securityDepositsHeld: number;
  };
  rentSummary: {
    totalRentCollected: number;
    pendingRent: number;
    overdueRent: number;
    activeAllocations: number;
  };
  commissions: {
    pending: { count: number; amount: number };
    settled: { count: number; amount: number };
    overdue: { count: number; amount: number };
  };
  recentSettlements: any[];
  monthlyBreakdown: any[];
  listingsCount: number;
}

interface Commission {
  _id: string;
  bookingId: {
    fullName: string;
    roomType: string;
    listingId: {
      pgName: string;
    };
  };
  bookingAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: string;
  dueDate: string;
  createdAt: string;
  notes: string;
}

export default function OwnerSettlementPage() {
  const [settlementData, setSettlementData] = useState<SettlementData | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [commissionTab, setCommissionTab] = useState("pending");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === "commissions") {
      fetchCommissions(commissionTab);
    }
  }, [activeTab, commissionTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/owner/settlement-summary");
      if (response.data.success) {
        setSettlementData(response.data.data);
      }
    } catch (error) {
      toast.error("Failed to fetch settlement data");
    } finally {
      setLoading(false);
    }
  };

  const fetchCommissions = async (status: string) => {
    try {
      const response = await axios.get(`/api/owner/commissions?status=${status}`);
      if (response.data.success) {
        setCommissions(response.data.data);
      }
    } catch (error) {
      toast.error("Failed to fetch commissions");
    }
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="border-yellow-300 text-yellow-700">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "settled":
        return (
          <Badge variant="outline" className="border-green-300 text-green-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            Settled
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-HG-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settlement data...</p>
        </div>
      </div>
    );
  }

  if (!settlementData) {
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
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-poppins">
          Settlement <span className="text-HG-500">Summary</span>
        </h1>
        <p className="text-gray-600 mt-1">
          Track your earnings, commissions, and payouts
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Total Earnings</p>
                <p className="text-2xl font-bold text-green-800">
                  {formatCurrency(settlementData.overview.totalEarnings)}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  From {settlementData.listingsCount} properties
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-200 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Commission Owed</p>
                <p className="text-2xl font-bold text-red-800">
                  {formatCurrency(settlementData.overview.totalCommissionOwed)}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  {settlementData.commissions.pending.count + settlementData.commissions.overdue.count} pending
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-200 flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-red-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Commission Paid</p>
                <p className="text-2xl font-bold text-blue-800">
                  {formatCurrency(settlementData.overview.totalCommissionPaid)}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {settlementData.commissions.settled.count} settlements
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-200 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-HG-50 to-HG-100 border-HG-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-HG-700">Net Payout</p>
                <p className="text-2xl font-bold text-HG-800">
                  {formatCurrency(settlementData.overview.netPayout)}
                </p>
                <p className="text-xs text-HG-600 mt-1">After commission deduction</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-HG-200 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-HG-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Rent Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-HG-500" />
                Rent Collection Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Rent Collected</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(settlementData.rentSummary.totalRentCollected)}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Pending Rent</p>
                  <p className="text-xl font-bold text-yellow-600">
                    {formatCurrency(settlementData.rentSummary.pendingRent)}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Overdue Rent</p>
                  <p className="text-xl font-bold text-red-600">
                    {formatCurrency(settlementData.rentSummary.overdueRent)}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Active Tenants</p>
                  <p className="text-xl font-bold text-blue-600">
                    {settlementData.rentSummary.activeAllocations}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Deposits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-HG-500" />
                Security Deposits Held
              </CardTitle>
              <CardDescription>
                Refundable deposits from active tenants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(settlementData.overview.securityDepositsHeld)}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  To be refunded when tenants move out
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commissions Tab */}
        <TabsContent value="commissions" className="space-y-4">
          <Tabs value={commissionTab} onValueChange={setCommissionTab}>
            <TabsList>
              <TabsTrigger value="pending">
                Pending ({settlementData.commissions.pending.count})
              </TabsTrigger>
              <TabsTrigger value="overdue">
                Overdue ({settlementData.commissions.overdue.count})
              </TabsTrigger>
              <TabsTrigger value="settled">
                Settled ({settlementData.commissions.settled.count})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={commissionTab}>
              {commissions.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No {commissionTab} commissions
                    </h3>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Booking Details</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Commission (10%)</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {commissions.map((commission) => (
                          <TableRow key={commission._id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {commission.bookingId?.listingId?.pgName || "N/A"}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {commission.bookingId?.fullName} - {commission.bookingId?.roomType}
                                </p>
                                {commission.notes && (
                                  <p className="text-xs text-gray-400 mt-1">{commission.notes}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{formatCurrency(commission.bookingAmount)}</TableCell>
                            <TableCell className="font-medium text-red-600">
                              {formatCurrency(commission.commissionAmount)}
                            </TableCell>
                            <TableCell>{formatDate(commission.dueDate)}</TableCell>
                            <TableCell>{getStatusBadge(commission.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Settlements</CardTitle>
              <CardDescription>Your commission payment history</CardDescription>
            </CardHeader>
            <CardContent>
              {settlementData.recentSettlements.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No settlements yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {settlementData.recentSettlements.map((settlement: any) => (
                    <div
                      key={settlement._id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">
                          {settlement.bookingId?.listingId?.pgName || "N/A"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(settlement.settledAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          {formatCurrency(settlement.commissionAmount)}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {settlement.settlementMethod}
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