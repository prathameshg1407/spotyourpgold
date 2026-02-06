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
  Building,
  Eye,
  RefreshCw,
  ArrowDownLeft,
  Banknote,
  TrendingUp,
  Phone,
  Mail,
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
    fullName: string;
    phoneNumber: string;
    monthlyRent: number;
  };
  listingId: {
    _id: string;
    pgName: string;
  };
  tenantId?: {
    fullName: string;
    email: string;
  };
  commissionType: string;
  direction: string;
  sourcePaymentMethod: string;
  monthNumber: number;
  rentMonth: string | null;
  baseAmount: number;
  commissionRate: number;
  amount: number;
  status: string;
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
  overdue: number;
  completed: number;
}

interface OwnerSummary {
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  totalPending: number;
  count: number;
  overdueCount: number;
}

interface Stats {
  totalReceivables: number;
  pendingAmount: number;
  overdueAmount: number;
  collectedAmount: number;
}

export default function AdminCommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [typeSummary, setTypeSummary] = useState<TypeSummary[]>([]);
  const [ownerSummary, setOwnerSummary] = useState<OwnerSummary[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("pending");

  // Selection
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

  const fetchCommissions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: "20",
        direction: "owner_owes_admin",
      });

      if (typeFilter !== "all") {
        params.append("type", typeFilter);
      }
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await axios.get(`/api/admin/commissions?${params}`);

      if (response.data.success) {
        setCommissions(response.data.data);
        setTotal(response.data.total);
        setTotalPages(response.data.totalPages);
        setTypeSummary(response.data.typeSummary || []);
        setOwnerSummary(response.data.ownerSummary || []);
        setStats(response.data.stats);
      }
    } catch (error) {
      toast.error("Failed to fetch commissions");
    } finally {
      setLoading(false);
    }
  }, [currentPage, typeFilter, statusFilter]);

  useEffect(() => {
    fetchCommissions();
    setSelectedCommissions([]);
  }, [fetchCommissions]);

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

  const formatCurrency = (amount: number) =>
    `₹${amount.toLocaleString("en-IN")}`;

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const getStatusBadge = (status: string) => {
    const config: Record<string, { class: string; icon: any }> = {
      pending: { class: "bg-yellow-100 text-yellow-800", icon: Clock },
      completed: { class: "bg-green-100 text-green-800", icon: CheckCircle },
      overdue: { class: "bg-red-100 text-red-800", icon: AlertTriangle },
      waived: { class: "bg-gray-100 text-gray-800", icon: CheckCircle },
    };
    const { class: className, icon: Icon } = config[status] || config.pending;
    return (
      <Badge className={className}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      booking_fee_receivable: "Booking Fee (10%)",
      monthly_rent_commission: "Monthly Rent (10%)",
    };
    return labels[type] || type;
  };

  const getSummaryForType = (type: string) => {
    return typeSummary.find((s) => s._id === type) || {
      count: 0,
      totalAmount: 0,
      pending: 0,
      overdue: 0,
      completed: 0,
    };
  };

  const selectedAmount = commissions
    .filter((c) => selectedCommissions.includes(c._id))
    .reduce((sum, c) => sum + c.amount, 0);

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
            Commission <span className="text-primary">Receivables</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Track 10% commissions owed by owners to admin
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchCommissions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {selectedCommissions.length > 0 && (
            <Button onClick={() => setShowSettleDialog(true)}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Settle ({selectedCommissions.length})
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-gray-500">Total Receivables</p>
              <p className="text-xl font-bold">{formatCurrency(stats.totalReceivables)}</p>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-yellow-600">Pending</p>
              <p className="text-xl font-bold text-yellow-700">
                {formatCurrency(stats.pendingAmount)}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-red-50">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-red-600">Overdue</p>
              <p className="text-xl font-bold text-red-700">
                {formatCurrency(stats.overdueAmount)}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-green-50">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-green-600">Collected</p>
              <p className="text-xl font-bold text-green-700">
                {formatCurrency(stats.collectedAmount)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Type Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          className={`cursor-pointer transition-all ${
            typeFilter === "booking_fee_receivable" ? "ring-2 ring-primary" : "hover:shadow-md"
          }`}
          onClick={() => setTypeFilter("booking_fee_receivable")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Booking Fee Commissions</p>
                <p className="text-xl font-bold text-orange-600">
                  {formatCurrency(getSummaryForType("booking_fee_receivable").pending)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  10% from cash bookings • {getSummaryForType("booking_fee_receivable").count} total
                </p>
              </div>
              <Banknote className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${
            typeFilter === "monthly_rent_commission" ? "ring-2 ring-primary" : "hover:shadow-md"
          }`}
          onClick={() => setTypeFilter("monthly_rent_commission")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Rent Commissions</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(getSummaryForType("monthly_rent_commission").pending)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  10% from cash monthly rents • {getSummaryForType("monthly_rent_commission").count} total
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Banner */}
      <Card className="bg-orange-50 border-orange-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <ArrowDownLeft className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <p className="font-medium text-orange-800">Owner Owes Admin</p>
              <p className="text-sm text-orange-700 mt-1">
                These are 10% commissions that owners need to pay to admin from cash payments they collected.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Label>Type:</Label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="booking_fee_receivable">Booking Fee</SelectItem>
              <SelectItem value="monthly_rent_commission">Monthly Rent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label>Status:</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedCommissions.length > 0 && (
          <div className="ml-auto text-sm text-gray-600">
            Selected: {selectedCommissions.length} ({formatCurrency(selectedAmount)})
          </div>
        )}
      </div>

      {/* Top Owners Owing */}
      {ownerSummary.length > 0 && statusFilter !== "completed" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Top Owners with Pending Commissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ownerSummary.slice(0, 6).map((owner, idx) => (
                <div
                  key={owner.ownerId}
                  className="p-4 bg-gray-50 rounded-lg flex items-center justify-between"
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
                          <span className="text-red-600 ml-1">
                            ({owner.overdueCount} overdue)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <p className="font-bold text-orange-600">
                    {formatCurrency(owner.totalPending)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Commissions Table */}
      {commissions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Commissions Found
            </h3>
            <p className="text-gray-600">
              No {statusFilter !== "all" ? statusFilter : ""} commissions
              {typeFilter !== "all" ? ` of type "${getTypeLabel(typeFilter)}"` : ""}.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  {statusFilter !== "completed" && (
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
                  <TableHead>Type</TableHead>
                  <TableHead>Base Amount</TableHead>
                  <TableHead>Commission (10%)</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.map((commission) => (
                  <TableRow key={commission._id}>
                    {statusFilter !== "completed" && (
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
                          {commission.ownerId?.phone || commission.ownerId?.email}
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
                      <Badge variant="outline">
                        {getTypeLabel(commission.commissionType)}
                      </Badge>
                      {commission.monthNumber > 1 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Month {commission.monthNumber}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>{formatCurrency(commission.baseAmount)}</TableCell>
                    <TableCell>
                      <span className="font-bold text-orange-600">
                        {formatCurrency(commission.amount)}
                      </span>
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
              Mark {selectedCommissions.length} commission(s) as received from owner
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
              <Label>Payment Method *</Label>
              <Select value={settlementMethod} onValueChange={setSettlementMethod}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
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
                <div className="p-3 bg-orange-50 rounded-lg">
                  <p className="text-xs text-orange-600">Commission (10%)</p>
                  <p className="font-bold text-lg text-orange-700">
                    {formatCurrency(selectedDetail.amount)}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-600 mb-1">Owner</p>
                <p className="font-medium">{selectedDetail.ownerId?.fullName}</p>
                <p className="text-sm text-gray-600">{selectedDetail.ownerId?.email}</p>
                <p className="text-sm text-gray-600">{selectedDetail.ownerId?.phone}</p>
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