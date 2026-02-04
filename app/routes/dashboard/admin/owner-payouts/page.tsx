// app/routes/dashboard/admin/owner-payouts/page.tsx
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
  AlertTriangle,
  User,
  Building,
  CreditCard,
  Send,
  RefreshCw,
  IndianRupee,
  Banknote,
  Phone,
  Mail,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface OwnerPayoutSummary {
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  bankDetails?: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    upiId: string;
    isVerified: boolean;
  };
  totalPendingPayout: number;
  bookingCount: number;
  bookings: string[];
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
  userId: {
    _id: string;
    fullName: string;
    email: string;
  };
  fullName: string;
  phoneNumber: string;
  amount: number;
  securityDeposit: number;
  firstMonthCommission: {
    adminAmount: number;
    ownerAmount: number;
    ownerPayoutStatus: string;
  };
  cashCollectedAt: string;
  createdAt: string;
}

interface CompletedPayout {
  _id: string;
  ownerId: {
    fullName: string;
  };
  listingId: {
    pgName: string;
  };
  firstMonthCommission: {
    ownerAmount: number;
    ownerPayoutDate: string;
    ownerPayoutMethod: string;
    ownerPayoutReference: string;
  };
}

export default function AdminOwnerPayoutsPage() {
  // State
  const [loading, setLoading] = useState(true);
  const [pendingPayouts, setPendingPayouts] = useState<PendingPayout[]>([]);
  const [ownerWiseSummary, setOwnerWiseSummary] = useState<OwnerPayoutSummary[]>([]);
  const [completedPayouts, setCompletedPayouts] = useState<CompletedPayout[]>([]);
  const [totalPending, setTotalPending] = useState(0);
  const [activeTab, setActiveTab] = useState("by-owner");

  // Selection state
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [expandedOwners, setExpandedOwners] = useState<string[]>([]);

  // Payout dialog state
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState("bank_transfer");
  const [payoutReference, setPayoutReference] = useState("");
  const [payoutNotes, setPayoutNotes] = useState("");
  const [processingPayout, setProcessingPayout] = useState(false);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/admin/owner-payout");
      
      if (response.data.success) {
        setPendingPayouts(response.data.data.pendingPayouts);
        setOwnerWiseSummary(response.data.data.ownerWiseSummary);
        setCompletedPayouts(response.data.data.completedPayouts);
        setTotalPending(response.data.data.totalPending);
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

  // Toggle owner expansion
  const toggleOwnerExpansion = (ownerId: string) => {
    setExpandedOwners((prev) =>
      prev.includes(ownerId)
        ? prev.filter((id) => id !== ownerId)
        : [...prev, ownerId]
    );
  };

  // Handle booking selection
  const handleBookingSelect = (bookingId: string) => {
    setSelectedBookings((prev) =>
      prev.includes(bookingId)
        ? prev.filter((id) => id !== bookingId)
        : [...prev, bookingId]
    );
  };

  // Select all bookings for an owner
  const handleSelectAllForOwner = (bookingIds: string[]) => {
    const allSelected = bookingIds.every((id) => selectedBookings.includes(id));
    
    if (allSelected) {
      setSelectedBookings((prev) =>
        prev.filter((id) => !bookingIds.includes(id))
      );
    } else {
setSelectedBookings((prev) => Array.from(new Set([...prev, ...bookingIds])));    }
  };

  // Process payout
  const handleProcessPayout = async () => {
    if (selectedBookings.length === 0) {
      toast.error("Please select at least one booking");
      return;
    }

    if (!payoutReference.trim()) {
      toast.error("Please enter a payment reference");
      return;
    }

    setProcessingPayout(true);

    try {
      const response = await axios.post("/api/admin/owner-payout", {
        bookingIds: selectedBookings,
        payoutMethod,
        payoutReference,
        notes: payoutNotes,
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setShowPayoutDialog(false);
        setSelectedBookings([]);
        setPayoutReference("");
        setPayoutNotes("");
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to process payout");
    } finally {
      setProcessingPayout(false);
    }
  };

  // Calculate selected amount
  const selectedAmount = pendingPayouts
    .filter((p) => selectedBookings.includes(p._id))
    .reduce((sum, p) => sum + p.firstMonthCommission.ownerAmount, 0);

  // Helpers
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
            Pay 90% of first month rent to property owners
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {selectedBookings.length > 0 && (
            <Button onClick={() => setShowPayoutDialog(true)}>
              <Send className="h-4 w-4 mr-2" />
              Process Payout ({selectedBookings.length})
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700">Total Pending</p>
                <p className="text-2xl font-bold text-yellow-800">
                  {formatCurrency(totalPending)}
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  {ownerWiseSummary.length} owners waiting
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-200 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Selected</p>
                <p className="text-2xl font-bold text-blue-800">
                  {formatCurrency(selectedAmount)}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {selectedBookings.length} booking(s) selected
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-200 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Recently Paid</p>
                <p className="text-2xl font-bold text-green-800">
                  {completedPayouts.length}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Last 20 payouts
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-200 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="by-owner">By Owner</TabsTrigger>
          <TabsTrigger value="all-pending">All Pending</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
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
                const ownerBookings = pendingPayouts.filter(
                  (p) => p.ownerId._id === owner.ownerId
                );
                const allSelected = owner.bookings.every((id) =>
                  selectedBookings.includes(id)
                );
                const someSelected = owner.bookings.some((id) =>
                  selectedBookings.includes(id)
                );

                return (
                  <Card key={owner.ownerId} className="overflow-hidden">
                    {/* Owner Header */}
                    <div
                      className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => toggleOwnerExpansion(owner.ownerId)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Checkbox
                            checked={allSelected}
                            // indeterminate={someSelected && !allSelected}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectAllForOwner(owner.bookings);
                            }}
                          />
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
                              {formatCurrency(owner.totalPendingPayout)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {owner.bookingCount} booking(s)
                            </p>
                          </div>
                          {owner.bankDetails?.isVerified ? (
                            <Badge className="bg-green-100 text-green-700">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Bank Verified
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-yellow-300 text-yellow-700">
                              <AlertTriangle className="w-3 h-3 mr-1" />
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

                      {/* Bank Details Preview */}
                      {owner.bankDetails && isExpanded && (
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

                    {/* Owner Bookings */}
                    {isExpanded && (
                      <div className="border-t">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-10"></TableHead>
                              <TableHead>Property</TableHead>
                              <TableHead>Tenant</TableHead>
                              <TableHead>First Month Rent</TableHead>
                              <TableHead>Owner Payout (90%)</TableHead>
                              <TableHead>Cash Collected</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {ownerBookings.map((booking) => (
                              <TableRow key={booking._id}>
                                <TableCell>
                                  <Checkbox
                                    checked={selectedBookings.includes(booking._id)}
                                    onCheckedChange={() =>
                                      handleBookingSelect(booking._id)
                                    }
                                  />
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Building className="h-4 w-4 text-gray-400" />
                                    <span className="font-medium">
                                      {booking.listingId?.pgName || "N/A"}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{booking.fullName}</p>
                                    <p className="text-xs text-gray-500">
                                      {booking.phoneNumber}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {formatCurrency(booking.amount)}
                                </TableCell>
                                <TableCell>
                                  <span className="font-bold text-green-600">
                                    {formatCurrency(
                                      booking.firstMonthCommission.ownerAmount
                                    )}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {booking.cashCollectedAt
                                    ? formatDate(booking.cashCollectedAt)
                                    : "N/A"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
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
          {pendingPayouts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Pending Payouts
                </h3>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={
                            pendingPayouts.length > 0 &&
                            pendingPayouts.every((p) =>
                              selectedBookings.includes(p._id)
                            )
                          }
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedBookings(pendingPayouts.map((p) => p._id));
                            } else {
                              setSelectedBookings([]);
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead>First Month</TableHead>
                      <TableHead>Admin (10%)</TableHead>
                      <TableHead>Owner (90%)</TableHead>
                      <TableHead>Collected On</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingPayouts.map((payout) => (
                      <TableRow key={payout._id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedBookings.includes(payout._id)}
                            onCheckedChange={() => handleBookingSelect(payout._id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {payout.ownerId?.fullName || "N/A"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {payout.ownerId?.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{payout.listingId?.pgName || "N/A"}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{payout.fullName}</p>
                            <p className="text-xs text-gray-500">
                              {payout.phoneNumber}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(payout.amount)}</TableCell>
                        <TableCell className="text-blue-600">
                          {formatCurrency(payout.firstMonthCommission.adminAmount)}
                        </TableCell>
                        <TableCell className="font-bold text-green-600">
                          {formatCurrency(payout.firstMonthCommission.ownerAmount)}
                        </TableCell>
                        <TableCell>
                          {payout.cashCollectedAt
                            ? formatDate(payout.cashCollectedAt)
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

        {/* Completed Tab */}
        <TabsContent value="completed">
          {completedPayouts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Completed Payouts Yet
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
                      <TableHead>Amount Paid</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Paid On</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedPayouts.map((payout) => (
                      <TableRow key={payout._id}>
                        <TableCell className="font-medium">
                          {payout.ownerId?.fullName || "N/A"}
                        </TableCell>
                        <TableCell>{payout.listingId?.pgName || "N/A"}</TableCell>
                        <TableCell className="font-bold text-green-600">
                          {formatCurrency(payout.firstMonthCommission.ownerAmount)}
                        </TableCell>
                        <TableCell className="capitalize">
                          {payout.firstMonthCommission.ownerPayoutMethod?.replace(
                            "_",
                            " "
                          ) || "N/A"}
                        </TableCell>
                        <TableCell>
                          {payout.firstMonthCommission.ownerPayoutReference || "N/A"}
                        </TableCell>
                        <TableCell>
                          {payout.firstMonthCommission.ownerPayoutDate
                            ? formatDate(
                                payout.firstMonthCommission.ownerPayoutDate
                              )
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
              Pay the 90% share to property owners for {selectedBookings.length}{" "}
              booking(s)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Summary */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-green-700">Total Payout Amount</span>
                <span className="text-2xl font-bold text-green-800">
                  {formatCurrency(selectedAmount)}
                </span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                {selectedBookings.length} booking(s) selected
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
                  <SelectItem value="cash">Cash</SelectItem>
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
              disabled={processingPayout}
            >
              Cancel
            </Button>
            <Button
              onClick={handleProcessPayout}
              disabled={processingPayout || !payoutReference.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {processingPayout ? (
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