"use client";

import { useState, useEffect, useCallback } from "react";
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
  Wallet,
  Clock,
  CheckCircle,
  User,
  Building,
  Send,
  RefreshCw,
  IndianRupee,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Banknote,
  Calendar,
} from "lucide-react";

interface OwnerPayoutSummary {
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  bankDetails?: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    accountHolderName: string;
    upiId: string;
    isVerified: boolean;
  };
  firstMonthPending: number;
  depositPending: number;
  monthlyPending: number;
  totalPending: number;
  bookingCount: number;
  monthlyCount: number;
}

interface PendingPayout {
  _id: string;
  ownerId: {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
    bankDetails?: any;
  };
  listingId: {
    _id: string;
    pgName: string;
  };
  userId?: {
    fullName: string;
    email: string;
  };
  tenantId?: {
    fullName: string;
    email: string;
  };
  fullName?: string;
  phoneNumber?: string;
  firstMonthRent?: {
    ownerPayoutAmount: number;
    ownerPayoutStatus: string;
    paidAt: string;
  };
  securityDeposit?: {
    amount: number;
    transferredToOwner: boolean;
    paidAt: string;
  };
  onlinePayment?: {
    ownerPayoutAmount: number;
    ownerPayoutStatus: string;
  };
  rentMonth?: string;
  monthNumber?: number;
  rentAmount?: number;
  createdAt: string;
}

export default function AdminOwnerPayoutsPage() {
  const [loading, setLoading] = useState(true);
  const [ownerWiseSummary, setOwnerWiseSummary] = useState<OwnerPayoutSummary[]>([]);
  const [pendingFirstMonth, setPendingFirstMonth] = useState<PendingPayout[]>([]);
  const [pendingDeposits, setPendingDeposits] = useState<PendingPayout[]>([]);
  const [pendingMonthly, setPendingMonthly] = useState<PendingPayout[]>([]);
  const [recentPayouts, setRecentPayouts] = useState<any[]>([]);
  const [totals, setTotals] = useState({
    firstMonth: 0,
    deposit: 0,
    monthly: 0,
    total: 0,
  });

  const [activeTab, setActiveTab] = useState("by-owner");
  const [expandedOwners, setExpandedOwners] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [payoutType, setPayoutType] = useState<"first_month" | "security_deposit" | "monthly_rent">("first_month");

  // Payout dialog
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState("bank_transfer");
  const [payoutReference, setPayoutReference] = useState("");
  const [payoutNotes, setPayoutNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/admin/owner-payout");

      if (response.data.success) {
        const { data } = response.data;
        setOwnerWiseSummary(data.ownerWiseSummary || []);
        setPendingFirstMonth(data.pendingFirstMonthPayouts || []);
        setPendingDeposits(data.pendingDepositTransfers || []);
        setPendingMonthly(data.pendingMonthlyPayouts || []);
        setRecentPayouts(data.recentPayouts || []);
        setTotals(data.totals || { firstMonth: 0, deposit: 0, monthly: 0, total: 0 });
      }
    } catch (error) {
      toast.error("Failed to fetch payout data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleOwnerExpansion = (ownerId: string) => {
    setExpandedOwners((prev) =>
      prev.includes(ownerId)
        ? prev.filter((id) => id !== ownerId)
        : [...prev, ownerId]
    );
  };

  const handleItemSelect = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAllForType = (items: PendingPayout[]) => {
    const ids = items.map((item) => item._id);
    const allSelected = ids.every((id) => selectedItems.includes(id));

    if (allSelected) {
      setSelectedItems((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedItems((prev) => Array.from(new Set([...prev, ...ids])));
    }
  };

  const handleProcessPayout = async () => {
    if (selectedItems.length === 0) {
      toast.error("Please select items to process");
      return;
    }

    if (!payoutReference.trim()) {
      toast.error("Please enter a payment reference");
      return;
    }

    setProcessing(true);
    try {
      const response = await axios.post("/api/admin/owner-payout", {
        payoutType,
        ids: selectedItems,
        payoutMethod,
        payoutReference,
        notes: payoutNotes,
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setShowPayoutDialog(false);
        setSelectedItems([]);
        setPayoutReference("");
        setPayoutNotes("");
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to process payout");
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

  const getSelectedAmount = () => {
    let items: PendingPayout[] = [];
    if (payoutType === "first_month") items = pendingFirstMonth;
    else if (payoutType === "security_deposit") items = pendingDeposits;
    else items = pendingMonthly;

    return items
      .filter((item) => selectedItems.includes(item._id))
      .reduce((sum, item) => {
        if (payoutType === "first_month") {
          return sum + (item.firstMonthRent?.ownerPayoutAmount || 0);
        } else if (payoutType === "security_deposit") {
          return sum + (item.securityDeposit?.amount || 0);
        } else {
          return sum + (item.onlinePayment?.ownerPayoutAmount || 0);
        }
      }, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading payout data...</p>
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
            Owner <span className="text-primary">Payouts</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Process 90% payouts to property owners (Online payments)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {selectedItems.length > 0 && (
            <Button onClick={() => setShowPayoutDialog(true)}>
              <Send className="h-4 w-4 mr-2" />
              Process ({selectedItems.length})
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700">Total Pending</p>
                <p className="text-2xl font-bold text-yellow-800">
                  {formatCurrency(totals.total)}
                </p>
              </div>
              <Wallet className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${
            payoutType === "first_month" ? "ring-2 ring-primary" : "hover:shadow-md"
          }`}
          onClick={() => {
            setPayoutType("first_month");
            setSelectedItems([]);
          }}
        >
          <CardContent className="pt-6">
            <div>
              <p className="text-sm font-medium text-gray-600">First Month (90%)</p>
              <p className="text-xl font-bold text-blue-600">
                {formatCurrency(totals.firstMonth)}
              </p>
              <p className="text-xs text-gray-500">{pendingFirstMonth.length} pending</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${
            payoutType === "security_deposit" ? "ring-2 ring-primary" : "hover:shadow-md"
          }`}
          onClick={() => {
            setPayoutType("security_deposit");
            setSelectedItems([]);
          }}
        >
          <CardContent className="pt-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Security Deposits</p>
              <p className="text-xl font-bold text-orange-600">
                {formatCurrency(totals.deposit)}
              </p>
              <p className="text-xs text-gray-500">{pendingDeposits.length} pending</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${
            payoutType === "monthly_rent" ? "ring-2 ring-primary" : "hover:shadow-md"
          }`}
          onClick={() => {
            setPayoutType("monthly_rent");
            setSelectedItems([]);
          }}
        >
          <CardContent className="pt-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Rent (90%)</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(totals.monthly)}
              </p>
              <p className="text-xs text-gray-500">{pendingMonthly.length} pending</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Banner */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <CreditCard className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800">Online Payment Flow</p>
              <p className="text-sm text-blue-700 mt-1">
                User → Admin (100%) → Owner (90%)
              </p>
              <p className="text-sm text-blue-600 mt-1">
                Currently showing:{" "}
                <strong>
                  {payoutType === "first_month"
                    ? "First Month Rent Payouts (90%)"
                    : payoutType === "security_deposit"
                    ? "Security Deposit Transfers"
                    : "Monthly Rent Payouts (90%)"}
                </strong>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="by-owner">By Owner</TabsTrigger>
          <TabsTrigger value="all-pending">All Pending</TabsTrigger>
          <TabsTrigger value="recent">Recent Payouts</TabsTrigger>
        </TabsList>

        {/* By Owner Tab */}
        <TabsContent value="by-owner" className="space-y-4">
          {ownerWiseSummary.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  All Caught Up!
                </h3>
                <p className="text-gray-600">
                  No pending payouts to owners at this time.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {ownerWiseSummary.map((owner) => {
                const isExpanded = expandedOwners.includes(owner.ownerId);

                return (
                  <Card key={owner.ownerId} className="overflow-hidden">
                    <div
                      className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => toggleOwnerExpansion(owner.ownerId)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {owner.ownerName}
                            </h3>
                            <div className="flex items-center gap-3 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {owner.ownerEmail}
                              </span>
                              {owner.ownerPhone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {owner.ownerPhone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-lg font-bold text-yellow-600">
                              {formatCurrency(owner.totalPending)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {owner.bookingCount} booking(s), {owner.monthlyCount || 0} monthly
                            </p>
                          </div>
                          {owner.bankDetails?.isVerified ? (
                            <Badge className="bg-green-100 text-green-700">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Bank Verified
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-yellow-300 text-yellow-700">
                              No Bank Details
                            </Badge>
                          )}
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {/* Bank Details */}
                      {isExpanded && owner.bankDetails && (
                        <div className="mt-3 pt-3 border-t grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-gray-500">Account:</span>
                            <p className="font-medium">
                              {owner.bankDetails.accountNumber || "N/A"}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">IFSC:</span>
                            <p className="font-medium">
                              {owner.bankDetails.ifscCode || "N/A"}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Bank:</span>
                            <p className="font-medium">
                              {owner.bankDetails.bankName || "N/A"}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">UPI:</span>
                            <p className="font-medium">
                              {owner.bankDetails.upiId || "N/A"}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Breakdown */}
                    {isExpanded && (
                      <div className="p-4 border-t">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <p className="text-xs text-blue-600">First Month (90%)</p>
                            <p className="font-bold text-blue-700">
                              {formatCurrency(owner.firstMonthPending)}
                            </p>
                          </div>
                          <div className="p-3 bg-orange-50 rounded-lg">
                            <p className="text-xs text-orange-600">Security Deposit</p>
                            <p className="font-bold text-orange-700">
                              {formatCurrency(owner.depositPending)}
                            </p>
                          </div>
                          <div className="p-3 bg-green-50 rounded-lg">
                            <p className="text-xs text-green-600">Monthly (90%)</p>
                            <p className="font-bold text-green-700">
                              {formatCurrency(owner.monthlyPending || 0)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* All Pending Tab */}
        <TabsContent value="all-pending">
          {(() => {
            let items: PendingPayout[] = [];
            if (payoutType === "first_month") items = pendingFirstMonth;
            else if (payoutType === "security_deposit") items = pendingDeposits;
            else items = pendingMonthly;

            if (items.length === 0) {
              return (
                <Card>
                  <CardContent className="text-center py-12">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Pending Payouts
                    </h3>
                    <p className="text-gray-600">
                      All{" "}
                      {payoutType === "first_month"
                        ? "first month"
                        : payoutType === "security_deposit"
                        ? "security deposit"
                        : "monthly rent"}{" "}
                      payouts are processed.
                    </p>
                  </CardContent>
                </Card>
              );
            }

            return (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox
                            checked={
                              items.length > 0 &&
                              items.every((item) => selectedItems.includes(item._id))
                            }
                            onCheckedChange={() => handleSelectAllForType(items)}
                          />
                        </TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Property</TableHead>
                        <TableHead>Tenant</TableHead>
                        {payoutType === "monthly_rent" && <TableHead>Month</TableHead>}
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item._id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedItems.includes(item._id)}
                              onCheckedChange={() => handleItemSelect(item._id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {item.ownerId?.fullName || "N/A"}
                              </p>
                              <p className="text-xs text-gray-500">
                                {item.ownerId?.email}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{item.listingId?.pgName || "N/A"}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {item.fullName || item.tenantId?.fullName || "N/A"}
                              </p>
                              <p className="text-xs text-gray-500">
                                {item.phoneNumber || item.tenantId?.email || ""}
                              </p>
                            </div>
                          </TableCell>
                          {payoutType === "monthly_rent" && (
                            <TableCell>
                              <div>
                                <p>Month {item.monthNumber}</p>
                                <p className="text-xs text-gray-500">
                                  {item.rentMonth ? formatDate(item.rentMonth) : "N/A"}
                                </p>
                              </div>
                            </TableCell>
                          )}
                          <TableCell>
                            <p className="font-bold text-green-600">
                              {formatCurrency(
                                payoutType === "first_month"
                                  ? item.firstMonthRent?.ownerPayoutAmount || 0
                                  : payoutType === "security_deposit"
                                  ? item.securityDeposit?.amount || 0
                                  : item.onlinePayment?.ownerPayoutAmount || 0
                              )}
                            </p>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">
                              {formatDate(
                                item.firstMonthRent?.paidAt ||
                                  item.securityDeposit?.paidAt ||
                                  item.createdAt
                              )}
                            </p>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })()}
        </TabsContent>

        {/* Recent Payouts Tab */}
        <TabsContent value="recent">
          {recentPayouts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Recent Payouts
                </h3>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Owner</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentPayouts.map((payout) => (
                      <TableRow key={payout._id}>
                        <TableCell className="font-medium">
                          {payout.ownerId?.fullName || "N/A"}
                        </TableCell>
                        <TableCell>{payout.listingId?.pgName || "N/A"}</TableCell>
                        <TableCell className="font-bold text-green-600">
                          {formatCurrency(payout.firstMonthRent?.ownerPayoutAmount || 0)}
                        </TableCell>
                        <TableCell className="capitalize">
                          {payout.firstMonthRent?.ownerPayoutMethod?.replace("_", " ") || "N/A"}
                        </TableCell>
                        <TableCell>
                          {payout.firstMonthRent?.ownerPayoutReference || "N/A"}
                        </TableCell>
                        <TableCell>
                          {payout.firstMonthRent?.ownerPayoutDate
                            ? formatDate(payout.firstMonthRent.ownerPayoutDate)
                            : "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Process Payout Dialog */}
      <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Process Owner Payout</DialogTitle>
            <DialogDescription>
              Transfer{" "}
              {payoutType === "first_month"
                ? "90% first month rent"
                : payoutType === "security_deposit"
                ? "security deposit"
                : "90% monthly rent"}{" "}
              to owners
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Summary */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-green-700">Total Payout Amount</span>
                <span className="text-2xl font-bold text-green-800">
                  {formatCurrency(getSelectedAmount())}
                </span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                {selectedItems.length} item(s) selected
              </p>
            </div>

            {/* Payout Method */}
            <div>
              <Label>Payment Method *</Label>
              <Select value={payoutMethod} onValueChange={setPayoutMethod}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reference */}
            <div>
              <Label>Payment Reference *</Label>
              <Input
                value={payoutReference}
                onChange={(e) => setPayoutReference(e.target.value)}
                placeholder="Transaction ID, UTR number, etc."
                className="mt-1"
              />
            </div>

            {/* Notes */}
            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                value={payoutNotes}
                onChange={(e) => setPayoutNotes(e.target.value)}
                placeholder="Any additional notes..."
                className="mt-1"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPayoutDialog(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleProcessPayout}
              disabled={processing || !payoutReference.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {processing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Process Payout
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}