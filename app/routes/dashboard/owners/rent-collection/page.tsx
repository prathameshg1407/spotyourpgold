// app/routes/dashboard/owners/rent-collection/page.tsx
"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import {
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Calendar,
  Building,
  CreditCard,
  Wallet,
  TrendingUp,
  Filter,
} from "lucide-react";

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

interface Listing {
  id: string;
  name: string;
}

export default function RentCollectionPage() {
  const [rentRecords, setRentRecords] = useState<RentRecord[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedListing, setSelectedListing] = useState("all");
  const [selectedRecord, setSelectedRecord] = useState<RentRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [transactionId, setTransactionId] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRentData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeTab !== "all") params.append("status", activeTab);
      if (selectedListing !== "all") params.append("listingId", selectedListing);

      const response = await axios.get(`/api/owner/rent-collection?${params}`);
      if (response.data.success) {
        setRentRecords(response.data.data);
        setSummary(response.data.summary);
        setListings(response.data.listings);
      }
    } catch (error) {
      toast.error("Failed to fetch rent data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRentData();
  }, [activeTab, selectedListing]);

  const handleMarkAsPaid = async () => {
    if (!selectedRecord || !paymentAmount) {
      toast.error("Please enter payment amount");
      return;
    }

    try {
      setActionLoading(true);
      const response = await axios.post("/api/owner/rent-collection", {
        allocationId: selectedRecord.allocationId,
        rentMonth: selectedRecord.rent.month,
        paidAmount: parseFloat(paymentAmount),
        paymentMethod,
        transactionId: transactionId || undefined,
      });

      if (response.data.success) {
        toast.success("Rent payment recorded successfully");
        toast.info(`Commission of ₹${response.data.data.commissionCreated.toLocaleString()} will be deducted`);
        setSelectedRecord(null);
        setPaymentAmount("");
        setTransactionId("");
        fetchRentData();
      }
    } catch (error) {
      toast.error("Failed to record payment");
    } finally {
      setActionLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-HG-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading rent data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-poppins">
          Rent <span className="text-HG-500">Collection</span>
        </h1>
        <p className="text-gray-600 mt-1">
          Track and manage rent payments from your tenants
        </p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    ₹{summary.totalPending.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">{summary.pendingCount} payments</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">
                    ₹{summary.totalOverdue.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">{summary.overdueCount} payments</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Collected</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₹{summary.totalPaid.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">{summary.paidCount} payments</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-HG-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Due</p>
                  <p className="text-2xl font-bold text-HG-600">
                    ₹{(summary.totalPending + summary.totalOverdue).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {summary.pendingCount + summary.overdueCount} payments
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-HG-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={selectedListing} onValueChange={setSelectedListing}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by PG" />
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
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {rentRecords.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No {activeTab} rent payments
                </h3>
                <p className="text-gray-600">
                  {activeTab === "pending"
                    ? "All rent payments are up to date!"
                    : `No ${activeTab} rent records found.`}
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
                      {rentRecords.map((record) => (
                        <TableRow key={record.rentId}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{record.tenant.name}</p>
                              <p className="text-xs text-gray-500">{record.tenant.phone}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{record.pg.name}</p>
                              <p className="text-xs text-gray-500">
                                Room {record.room.number}, Bed {record.room.bed}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{formatMonth(record.rent.month)}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">₹{record.rent.amount.toLocaleString()}</p>
                              {record.rent.lateFee > 0 && (
                                <p className="text-xs text-red-500">
                                  +₹{record.rent.lateFee} late fee
                                </p>
                              )}
                              {record.rent.paidAmount > 0 && record.rent.status !== "paid" && (
                                <p className="text-xs text-green-500">
                                  ₹{record.rent.paidAmount} paid
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(record.rent.dueDate)}</TableCell>
                          <TableCell>{getStatusBadge(record.rent.status)}</TableCell>
                          <TableCell className="text-right">
                            {record.rent.status !== "paid" && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedRecord(record);
                                      setPaymentAmount(
                                        (record.rent.amount + record.rent.lateFee - record.rent.paidAmount).toString()
                                      );
                                    }}
                                  >
                                    <CreditCard className="w-4 h-4 mr-1" />
                                    Collect
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Record Rent Payment</DialogTitle>
                                  </DialogHeader>
                                  {selectedRecord && (
                                    <div className="space-y-4">
                                      <div className="p-4 bg-gray-50 rounded-lg">
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                          <div>
                                            <span className="text-gray-500">Tenant:</span>
                                            <p className="font-medium">{selectedRecord.tenant.name}</p>
                                          </div>
                                          <div>
                                            <span className="text-gray-500">Month:</span>
                                            <p className="font-medium">
                                              {formatMonth(selectedRecord.rent.month)}
                                            </p>
                                          </div>
                                          <div>
                                            <span className="text-gray-500">Rent Amount:</span>
                                            <p className="font-medium">
                                              ₹{selectedRecord.rent.amount.toLocaleString()}
                                            </p>
                                          </div>
                                          {selectedRecord.rent.lateFee > 0 && (
                                            <div>
                                              <span className="text-gray-500">Late Fee:</span>
                                              <p className="font-medium text-red-600">
                                                ₹{selectedRecord.rent.lateFee.toLocaleString()}
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      <div>
                                        <label className="text-sm font-medium mb-2 block">
                                          Amount Received *
                                        </label>
                                        <Input
                                          type="number"
                                          value={paymentAmount}
                                          onChange={(e) => setPaymentAmount(e.target.value)}
                                          placeholder="Enter amount"
                                        />
                                      </div>

                                      <div>
                                        <label className="text-sm font-medium mb-2 block">
                                          Payment Method
                                        </label>
                                        <Select
                                          value={paymentMethod}
                                          onValueChange={setPaymentMethod}
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="cash">Cash</SelectItem>
                                            <SelectItem value="upi">UPI</SelectItem>
                                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                            <SelectItem value="online">Online (Razorpay)</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      {paymentMethod !== "cash" && (
                                        <div>
                                          <label className="text-sm font-medium mb-2 block">
                                            Transaction ID
                                          </label>
                                          <Input
                                            value={transactionId}
                                            onChange={(e) => setTransactionId(e.target.value)}
                                            placeholder="Enter transaction ID"
                                          />
                                        </div>
                                      )}

                                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <p className="text-sm text-yellow-800">
                                          <strong>Note:</strong> 10% commission (₹
                                          {((parseFloat(paymentAmount) || 0) * 0.1).toLocaleString()}) will be
                                          added to your pending commissions.
                                        </p>
                                      </div>

                                      <Button
                                        onClick={handleMarkAsPaid}
                                        disabled={actionLoading || !paymentAmount}
                                        className="w-full bg-green-600 hover:bg-green-700"
                                      >
                                        {actionLoading ? (
                                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                        ) : (
                                          <CheckCircle className="w-4 h-4 mr-2" />
                                        )}
                                        Record Payment
                                      </Button>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                            )}
                            {record.rent.status === "paid" && (
                              <span className="text-sm text-green-600">
                                Paid on {formatDate(record.rent.paidAt!)}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}