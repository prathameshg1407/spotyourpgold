// app/routes/dashboard/admin/commissions/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Calendar,
  Building,
  Eye,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  Banknote,
  TrendingUp,
} from "lucide-react";

interface Commission {
  _id: string;
  ownerId: {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
  };
  bookingId: {
    _id: string;
    amount: number;
    fullName: string;
    phoneNumber: string;
    userId?: {
      fullName: string;
      email: string;
    };
  };
  listingId: {
    _id: string;
    pgName: string;
  };
  commissionType: "first_month_admin" | "first_month_owner" | "monthly_rent";
  monthNumber: number;
  rentMonth: string;
  baseAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: "pending" | "completed" | "overdue" | "waived";
  dueDate: string;
  settledAt: string | null;
  settlementMethod: string | null;
  settlementReference: string;
  notes: string;
  createdAt: string;
}

interface TypeSummary {
  _id: string;
  count: number;
  totalAmount: number;
  pending: number;
  completed: number;
}

export default function AdminCommissionsPage() {
  // State
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [typeSummary, setTypeSummary] = useState<TypeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [activeTab, setActiveTab] = useState("monthly_rent");
  const [statusFilter, setStatusFilter] = useState("pending");

  // Selection for bulk settle
  const [selectedCommissions, setSelectedCommissions] = useState<string[]>([]);

  // Settle dialog
  const [showSettleDialog, setShowSettleDialog] = useState(false);
  const [settlementMethod, setSettlementMethod] = useState("cash");
  const [settlementReference, setSettlementReference] = useState("");
  const [settlementNotes, setSettlementNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  // Detail dialog
  const [selectedDetail, setSelectedDetail] = useState<Commission | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // Fetch commissions
  const fetchCommissions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        type: activeTab,
        status: statusFilter,
        page: currentPage.toString(),
        per_page: "20",
      });

      const response = await axios.get(`/api/admin/commissions?${params}`);

      if (response.data.success) {
        setCommissions(response.data.data);
        setTotal(response.data.total);
        setTotalPages(response.data.totalPages);
        setTypeSummary(response.data.typeSummary || []);
      }
    } catch (error) {
      toast.error("Failed to fetch commissions");
    } finally {
      setLoading(false);
    }
  }, [activeTab, statusFilter, currentPage]);

  useEffect(() => {
    fetchCommissions();
    setSelectedCommissions([]);
  }, [fetchCommissions]);

  // Handle settle
  const handleSettle = async () => {
    if (selectedCommissions.length === 0) {
      toast.error("Please select commissions to settle");
      return;
    }

    setProcessing(true);

    try {
      const response = await axios.patch("/api/admin/commissions", {
        commissionIds: selectedCommissions,
        settlementMethod,
        settlementReference,
        notes: settlementNotes,
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setShowSettleDialog(false);
        setSelectedCommissions([]);
        setSettlementReference("");
        setSettlementNotes("");
        fetchCommissions();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to settle commissions");
    } finally {
      setProcessing(false);
    }
  };

  // Helpers
  const formatCurrency = (amount: number) =>
    `₹${amount.toLocaleString("en-IN")}`;

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
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case "overdue":
        return (
          <Badge className="bg-red-100 text-red-800">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Overdue
          </Badge>
        );
      case "waived":
        return (
          <Badge variant="outline" className="text-gray-600">
            Waived
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "first_month_admin":
        return "First Month (Admin 10%)";
      case "first_month_owner":
        return "First Month (Owner 90%)";
      case "monthly_rent":
        return "Monthly Rent (10%)";
      default:
        return type;
    }
  };

  const getTypeDescription = (type: string) => {
    switch (type) {
      case "first_month_admin":
        return "Admin receives 10% from first payment";
      case "first_month_owner":
        return "Admin pays 90% to owner";
      case "monthly_rent":
        return "Owner owes 10% to admin";
      default:
        return "";
    }
  };

  const getSummaryForType = (type: string) => {
    const summary = typeSummary.find((s) => s._id === type);
    return summary || { count: 0, totalAmount: 0, pending: 0, completed: 0 };
  };

  // Calculate selected amount
  const selectedAmount = commissions
    .filter((c) => selectedCommissions.includes(c._id))
    .reduce((sum, c) => sum + c.commissionAmount, 0);

  if (loading && commissions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading commissions...</p>
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
            Commission <span className="text-primary">Ledger</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Track all commission transactions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchCommissions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {selectedCommissions.length > 0 && activeTab === "monthly_rent" && (
            <Button onClick={() => setShowSettleDialog(true)}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Settle ({selectedCommissions.length})
            </Button>
          )}
        </div>
      </div>

      {/* Type Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* First Month Admin */}
        <Card
          className={`cursor-pointer transition-all ${
            activeTab === "first_month_admin"
              ? "ring-2 ring-primary"
              : "hover:shadow-md"
          }`}
          onClick={() => setActiveTab("first_month_admin")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  First Month (Admin)
                </p>
                <p className="text-xl font-bold text-blue-600">
                  {formatCurrency(getSummaryForType("first_month_admin").completed)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  <ArrowDownLeft className="w-3 h-3 inline text-green-500" />
                  {" "}10% received from bookings
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <ArrowDownLeft className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* First Month Owner */}
        <Card
          className={`cursor-pointer transition-all ${
            activeTab === "first_month_owner"
              ? "ring-2 ring-primary"
              : "hover:shadow-md"
          }`}
          onClick={() => setActiveTab("first_month_owner")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  First Month (Owner)
                </p>
                <p className="text-xl font-bold text-orange-600">
                  {formatCurrency(getSummaryForType("first_month_owner").pending)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  <ArrowUpRight className="w-3 h-3 inline text-orange-500" />
                  {" "}90% pending to pay owners
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                <ArrowUpRight className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Rent */}
        <Card
          className={`cursor-pointer transition-all ${
            activeTab === "monthly_rent"
              ? "ring-2 ring-primary"
              : "hover:shadow-md"
          }`}
          onClick={() => setActiveTab("monthly_rent")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Monthly Rent
                </p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(getSummaryForType("monthly_rent").pending)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  <TrendingUp className="w-3 h-3 inline text-green-500" />
                  {" "}10% owed by owners
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <Banknote className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Type Info Banner */}
      <div className="p-4 bg-gray-50 rounded-lg border">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          <div>
            <p className="font-medium">{getTypeLabel(activeTab)}</p>
            <p className="text-sm text-gray-600">{getTypeDescription(activeTab)}</p>
          </div>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-4">
        <Label>Status:</Label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>

        {selectedCommissions.length > 0 && (
          <div className="ml-auto text-sm text-gray-600">
            Selected: {selectedCommissions.length} ({formatCurrency(selectedAmount)})
          </div>
        )}
      </div>

      {/* Commissions Table */}
      {commissions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Commissions Found
            </h3>
            <p className="text-gray-600">
              No {statusFilter !== "all" ? statusFilter : ""} commissions for{" "}
              {getTypeLabel(activeTab).toLowerCase()}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  {activeTab === "monthly_rent" && statusFilter !== "completed" && (
                    <TableHead className="w-10">
                      <Checkbox
                        checked={
                          commissions.length > 0 &&
                          commissions
                            .filter((c) => c.status !== "completed")
                            .every((c) => selectedCommissions.includes(c._id))
                        }
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedCommissions(
                              commissions
                                .filter((c) => c.status !== "completed")
                                .map((c) => c._id)
                            );
                          } else {
                            setSelectedCommissions([]);
                          }
                        }}
                      />
                    </TableHead>
                  )}
                  <TableHead>Owner</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Base Amount</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.map((commission) => (
                  <TableRow key={commission._id}>
                    {activeTab === "monthly_rent" && statusFilter !== "completed" && (
                      <TableCell>
                        {commission.status !== "completed" && (
                          <Checkbox
                            checked={selectedCommissions.includes(commission._id)}
                            onCheckedChange={() => {
                              setSelectedCommissions((prev) =>
                                prev.includes(commission._id)
                                  ? prev.filter((id) => id !== commission._id)
                                  : [...prev, commission._id]
                              );
                            }}
                          />
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {commission.ownerId?.fullName || "N/A"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {commission.ownerId?.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        {commission.listingId?.pgName || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">Month {commission.monthNumber}</p>
                        <p className="text-xs text-gray-500">
                          {commission.rentMonth
                            ? formatDate(commission.rentMonth)
                            : "N/A"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(commission.baseAmount)}</TableCell>
                    <TableCell>
                      <span
                        className={`font-bold ${
                          activeTab === "monthly_rent"
                            ? "text-green-600"
                            : activeTab === "first_month_owner"
                            ? "text-orange-600"
                            : "text-blue-600"
                        }`}
                      >
                        {formatCurrency(commission.commissionAmount)}
                      </span>
                      <p className="text-xs text-gray-500">
                        {(commission.commissionRate * 100).toFixed(0)}%
                      </p>
                    </TableCell>
                    <TableCell>{formatDate(commission.dueDate)}</TableCell>
                    <TableCell>{getStatusBadge(commission.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedDetail(commission);
                          setShowDetailDialog(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

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

      {/* Settle Dialog */}
      <Dialog open={showSettleDialog} onOpenChange={setShowSettleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Settle Commission</DialogTitle>
            <DialogDescription>
              Mark {selectedCommissions.length} commission(s) as settled
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-green-700">Total Amount</span>
                <span className="text-2xl font-bold text-green-800">
                  {formatCurrency(selectedAmount)}
                </span>
              </div>
            </div>

            <div>
              <Label>Settlement Method *</Label>
              <Select value={settlementMethod} onValueChange={setSettlementMethod}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="adjusted">Adjusted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Reference Number</Label>
              <Input
                value={settlementReference}
                onChange={(e) => setSettlementReference(e.target.value)}
                placeholder="Transaction ID, receipt number..."
                className="mt-1"
              />
            </div>

            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                value={settlementNotes}
                onChange={(e) => setSettlementNotes(e.target.value)}
                placeholder="Any additional notes..."
                className="mt-1"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSettleDialog(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSettle}
              disabled={processing}
              className="bg-green-600 hover:bg-green-700"
            >
              {processing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark as Settled
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Commission Details</DialogTitle>
          </DialogHeader>

          {selectedDetail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Type</p>
                  <p className="font-medium">{getTypeLabel(selectedDetail.commissionType)}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Status</p>
                  {getStatusBadge(selectedDetail.status)}
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Base Amount</p>
                  <p className="font-medium">{formatCurrency(selectedDetail.baseAmount)}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Commission ({(selectedDetail.commissionRate * 100).toFixed(0)}%)</p>
                  <p className="font-bold text-lg">{formatCurrency(selectedDetail.commissionAmount)}</p>
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-600 mb-1">Owner</p>
                <p className="font-medium">{selectedDetail.ownerId?.fullName}</p>
                <p className="text-sm text-gray-600">{selectedDetail.ownerId?.email}</p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Property</p>
                <p className="font-medium">{selectedDetail.listingId?.pgName}</p>
              </div>

              {selectedDetail.bookingId && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Tenant</p>
                  <p className="font-medium">{selectedDetail.bookingId.fullName}</p>
                  <p className="text-sm text-gray-600">{selectedDetail.bookingId.phoneNumber}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Due Date</p>
                  <p className="font-medium">{formatDate(selectedDetail.dueDate)}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Month Number</p>
                  <p className="font-medium">{selectedDetail.monthNumber}</p>
                </div>
              </div>

              {selectedDetail.status === "completed" && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-green-600 mb-1">Settlement Details</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Method:</span>{" "}
                      <span className="capitalize">
                        {selectedDetail.settlementMethod?.replace("_", " ")}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Date:</span>{" "}
                      {selectedDetail.settledAt
                        ? formatDate(selectedDetail.settledAt)
                        : "N/A"}
                    </div>
                    {selectedDetail.settlementReference && (
                      <div className="col-span-2">
                        <span className="text-gray-500">Reference:</span>{" "}
                        {selectedDetail.settlementReference}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedDetail.notes && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Notes</p>
                  <p className="text-sm">{selectedDetail.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}