// app/routes/dashboard/owners/rent-collection/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Calendar,
  CreditCard,
  Wallet,
  TrendingUp,
  Filter,
  RefreshCw,
  Building2,
  IndianRupee,
  Receipt,
} from "lucide-react";

// Types
interface RentRecord {
  allocationId: string;
  rentId: string;
  tenant: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  pg: {
    id: string;
    name: string;
  };
  room: {
    number: string;
    bed: string;
    type: string;
  };
  rent: {
    month: string;
    amount: number;
    status: "pending" | "paid" | "overdue" | "partial";
    paidAmount: number;
    paidAt: string | null;
    dueDate: string;
    lateFee: number;
    waivedAmount: number;
    paymentMethod: string;
    transactionId: string;
  };
  monthlyRent: number;
}

interface Summary {
  totalPending: number;
  totalOverdue: number;
  totalPaid: number;
  pendingCount: number;
  overdueCount: number;
  paidCount: number;
}

interface ListingOption {
  id: string;
  name: string;
}

export default function RentCollectionPage() {
  // State
  const [rentRecords, setRentRecords] = useState<RentRecord[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [listings, setListings] = useState<ListingOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedListing, setSelectedListing] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("");

  // Dialog states
  const [selectedRecord, setSelectedRecord] = useState<RentRecord | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [transactionId, setTransactionId] = useState("");
  const [waiveLateFee, setWaiveLateFee] = useState(false);
  const [paymentNotes, setPaymentNotes] = useState("");

  // Fetch rent data
  const fetchRentData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (activeTab !== "all") {
        params.append("status", activeTab);
      }
      if (selectedListing !== "all") {
        params.append("listingId", selectedListing);
      }
      if (selectedMonth) {
        params.append("month", selectedMonth);
      }

      const response = await axios.get(`/api/owner/rent-collection?${params}`);
      
      if (response.data.success) {
        setRentRecords(response.data.data);
        setSummary(response.data.summary);
        setListings(response.data.listings);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch rent data");
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedListing, selectedMonth]);

  useEffect(() => {
    fetchRentData();
  }, [fetchRentData]);

  // Handle payment recording
  const handleRecordPayment = async () => {
    if (!selectedRecord || !paymentAmount) {
      toast.error("Please enter payment amount");
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setActionLoading(true);
    try {
      const response = await axios.post("/api/owner/rent-collection", {
        allocationId: selectedRecord.allocationId,
        rentMonth: selectedRecord.rent.month,
        paidAmount: amount,
        paymentMethod,
        transactionId: transactionId || undefined,
        waiveLateFee,
        notes: paymentNotes || undefined,
      });

      if (response.data.success) {
        toast.success("Rent payment recorded successfully!");
        
        if (response.data.data.commissionCreated > 0) {
          toast.info(
            `Commission of ₹${response.data.data.commissionCreated.toLocaleString()} added to pending`,
            { duration: 4000 }
          );
        }
        
        closePaymentDialog();
        fetchRentData();
      } else {
        toast.error(response.data.message || "Failed to record payment");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to record payment");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle waive late fee
  const handleWaiveLateFee = async (record: RentRecord) => {
    try {
      const response = await axios.patch("/api/owner/rent-collection", {
        allocationId: record.allocationId,
        rentMonth: record.rent.month,
        action: "waive_late_fee",
      });

      if (response.data.success) {
        toast.success("Late fee waived successfully");
        fetchRentData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to waive late fee");
    }
  };

  const openPaymentDialog = (record: RentRecord) => {
    setSelectedRecord(record);
    const dueAmount = record.rent.amount + record.rent.lateFee - record.rent.paidAmount;
    setPaymentAmount(dueAmount.toString());
    setPaymentMethod("cash");
    setTransactionId("");
    setWaiveLateFee(false);
    setPaymentNotes("");
    setShowPaymentDialog(true);
  };

  const closePaymentDialog = () => {
    setShowPaymentDialog(false);
    setSelectedRecord(null);
    setPaymentAmount("");
    setTransactionId("");
    setWaiveLateFee(false);
    setPaymentNotes("");
  };

  // Helpers
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "paid":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Paid
          </Badge>
        );
      case "overdue":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Overdue
          </Badge>
        );
      case "partial":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <DollarSign className="w-3 h-3 mr-1" />
            Partial
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatMonth = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

  // Generate month options for filter
  const getMonthOptions = () => {
    const options = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      options.push({
        value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
        label: date.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
      });
    }
    return options;
  };

  // Loading state
  if (loading && rentRecords.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-HG-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading rent data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-poppins">
            Rent <span className="text-HG-500">Collection</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Track and manage rent payments from your tenants
          </p>
        </div>
        <Button variant="outline" onClick={fetchRentData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {formatCurrency(summary.totalPending)}
                  </p>
                  <p className="text-xs text-gray-500">{summary.pendingCount} payments</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(summary.totalOverdue)}
                  </p>
                  <p className="text-xs text-gray-500">{summary.overdueCount} payments</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Collected</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(summary.totalPaid)}
                  </p>
                  <p className="text-xs text-gray-500">{summary.paidCount} payments</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-HG-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Due</p>
                  <p className="text-2xl font-bold text-HG-600">
                    {formatCurrency(summary.totalPending + summary.totalOverdue)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {summary.pendingCount + summary.overdueCount} payments
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-HG-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={selectedListing} onValueChange={setSelectedListing}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Building2 className="w-4 h-4 mr-2" />
            <SelectValue placeholder="All Properties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Properties</SelectItem>
            {listings.map((listing) => (
              <SelectItem key={listing.id} value={listing.id}>
                {listing.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue placeholder="All Months" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Months</SelectItem>
            {getMonthOptions().map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">
            Pending
            {summary && summary.pendingCount > 0 && (
              <Badge className="ml-2 bg-yellow-100 text-yellow-800 text-xs">
                {summary.pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="overdue">
            Overdue
            {summary && summary.overdueCount > 0 && (
              <Badge className="ml-2 bg-red-100 text-red-800 text-xs">
                {summary.overdueCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {rentRecords.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No {activeTab === "all" ? "" : activeTab} rent payments
                </h3>
                <p className="text-gray-600">
                  {activeTab === "pending" || activeTab === "overdue"
                    ? "All rent payments are up to date!"
                    : `No ${activeTab} rent records found for the selected filters.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tenant</TableHead>
                        <TableHead>Property / Room</TableHead>
                        <TableHead>Month</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rentRecords.map((record) => {
                        const dueAmount =
                          record.rent.amount +
                          record.rent.lateFee -
                          record.rent.paidAmount -
                          record.rent.waivedAmount;

                        return (
                          <TableRow key={`${record.allocationId}-${record.rentId}`}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-HG-100 flex items-center justify-center">
                                  <User className="h-4 w-4 text-HG-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{record.tenant.name}</p>
                                  <p className="text-xs text-gray-500">{record.tenant.phone}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">{record.pg.name}</p>
                                <p className="text-xs text-gray-500">
                                  Room {record.room.number}, Bed {record.room.bed}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm">{formatMonth(record.rent.month)}</p>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">
                                  {formatCurrency(record.rent.amount)}
                                </p>
                                {record.rent.lateFee > 0 && (
                                  <p className="text-xs text-red-500">
                                    +{formatCurrency(record.rent.lateFee)} late fee
                                  </p>
                                )}
                                {record.rent.paidAmount > 0 &&
                                  record.rent.status !== "paid" && (
                                    <p className="text-xs text-green-500">
                                      {formatCurrency(record.rent.paidAmount)} paid
                                    </p>
                                  )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm">{formatDate(record.rent.dueDate)}</p>
                            </TableCell>
                            <TableCell>{getStatusBadge(record.rent.status)}</TableCell>
                            <TableCell className="text-right">
                              {record.rent.status !== "paid" ? (
                                <div className="flex items-center justify-end gap-2">
                                  {record.rent.lateFee > 0 && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleWaiveLateFee(record)}
                                      className="text-xs text-gray-500 hover:text-gray-700"
                                    >
                                      Waive Fee
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openPaymentDialog(record)}
                                    className="border-green-300 text-green-600 hover:bg-green-50"
                                  >
                                    <CreditCard className="w-4 h-4 mr-1" />
                                    Collect
                                  </Button>
                                </div>
                              ) : (
                                <div className="text-right">
                                  <p className="text-xs text-green-600">
                                    Paid on {formatDate(record.rent.paidAt!)}
                                  </p>
                                  {record.rent.paymentMethod && (
                                    <p className="text-xs text-gray-500 capitalize">
                                      via {record.rent.paymentMethod}
                                    </p>
                                  )}
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Rent Payment</DialogTitle>
            <DialogDescription>
              Record a rent payment from the tenant
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-4 py-4">
              {/* Payment Info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Tenant:</span>
                    <p className="font-medium">{selectedRecord.tenant.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Month:</span>
                    <p className="font-medium">{formatMonth(selectedRecord.rent.month)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Rent Amount:</span>
                    <p className="font-medium">
                      {formatCurrency(selectedRecord.rent.amount)}
                    </p>
                  </div>
                  {selectedRecord.rent.lateFee > 0 && (
                    <div>
                      <span className="text-gray-500">Late Fee:</span>
                      <p className="font-medium text-red-600">
                        {formatCurrency(selectedRecord.rent.lateFee)}
                      </p>
                    </div>
                  )}
                  {selectedRecord.rent.paidAmount > 0 && (
                    <div>
                      <span className="text-gray-500">Already Paid:</span>
                      <p className="font-medium text-green-600">
                        {formatCurrency(selectedRecord.rent.paidAmount)}
                      </p>
                    </div>
                  )}
                  <div className="col-span-2 pt-2 border-t">
                    <span className="text-gray-500">Total Due:</span>
                    <p className="font-bold text-lg text-HG-600">
                      {formatCurrency(
                        selectedRecord.rent.amount +
                          selectedRecord.rent.lateFee -
                          selectedRecord.rent.paidAmount
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Amount */}
              <div>
                <Label>Amount Received *</Label>
                <div className="relative mt-1">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="online">Online Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Transaction ID */}
              {paymentMethod !== "cash" && (
                <div>
                  <Label>Transaction ID (Optional)</Label>
                  <Input
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Enter transaction ID"
                    className="mt-1"
                  />
                </div>
              )}

              {/* Waive Late Fee */}
              {selectedRecord.rent.lateFee > 0 && (
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <Label htmlFor="waive-fee" className="cursor-pointer">
                      Waive Late Fee
                    </Label>
                    <p className="text-xs text-gray-500">
                      Remove {formatCurrency(selectedRecord.rent.lateFee)} late fee
                    </p>
                  </div>
                  <Switch
                    id="waive-fee"
                    checked={waiveLateFee}
                    onCheckedChange={setWaiveLateFee}
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <Label>Notes (Optional)</Label>
                <Textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Any notes about this payment..."
                  className="mt-1"
                  rows={2}
                />
              </div>

              {/* Commission Info */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> 10% commission (
                  {formatCurrency((parseFloat(paymentAmount) || 0) * 0.1)}) will be added to
                  your pending commissions.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closePaymentDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleRecordPayment}
              disabled={actionLoading || !paymentAmount}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <Receipt className="w-4 h-4 mr-2" />
              )}
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}