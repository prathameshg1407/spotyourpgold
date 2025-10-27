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
import { Textarea } from "@/components/ui/textarea";
import {
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Calendar,
  Building,
  Eye,
} from "lucide-react";

interface Commission {
  _id: string;
  ownerId: {
    _id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
  };
  bookingId: {
    _id: string;
    amount: number;
    securityDeposit: number;
    moveInDate: string;
    fullName: string;
    phoneNumber: string;
    email: string;
    address: {
      street: string;
      city: string;
      state: string;
      pincode: string;
    };
    aadhaarNumber: string;
    additionalRequirements: string;
    userId: {
      _id: string;
      fullName: string;
      email: string;
      phoneNumber: string;
    };
  };
  bookingAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: "pending" | "settled" | "overdue";
  settledAt: string | null;
  settledBy: {
    fullName: string;
  } | null;
  settlementMethod: string | null;
  settlementReference: string;
  dueDate: string;
  notes: string;
  createdAt: string;
}

export default function CommissionsPage() {
  // Local state
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("pending");
  const [summary, setSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCommission, setSelectedCommission] =
    useState<Commission | null>(null);
  const [selectedDetailCommission, setSelectedDetailCommission] =
    useState<Commission | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Settlement form
  const [settlementMethod, setSettlementMethod] = useState("cash");
  const [settlementReference, setSettlementReference] = useState("");
  const [settlementNotes, setSettlementNotes] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchCommissions = async (tab: string, page: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        `/api/admin/commissions?status=${
          tab === "all" ? "all" : tab
        }&page=${page}&per_page=20`
      );

      if (response.data.success) {
        setCommissions(response.data.data);
        setTotal(response.data.total);
        setTotalPages(response.data.totalPages);
        setSummary(response.data.summary);
      } else {
        throw new Error(response.data.message || "Failed to fetch commissions");
      }
    } catch (error) {
      console.error("Failed to fetch commissions:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch commissions"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions(activeTab, currentPage);
  }, [activeTab, currentPage]);

  const handleSettlement = async (commissionId: string) => {
    try {
      setActionLoading(commissionId);

      const response = await axios.patch("/api/admin/commissions", {
        commissionId,
        settlementMethod,
        settlementReference,
        notes: settlementNotes,
      });

      if (response.data.success) {
        toast.success("Commission marked as settled");
        setSettlementMethod("cash");
        setSettlementReference("");
        setSettlementNotes("");
        setSelectedCommission(null);

        // Update the commission in local state
        setCommissions((prevCommissions) =>
          prevCommissions.map((commission) =>
            commission._id === commissionId
              ? {
                  ...commission,
                  status: "settled" as const,
                  settledAt: new Date().toISOString(),
                  settlementMethod,
                  settlementReference,
                  notes: settlementNotes,
                }
              : commission
          )
        );
      }
    } catch (error) {
      console.error("Failed to settle commission:", error);
      toast.error("Failed to settle commission");
    } finally {
      setActionLoading(null);
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
      case "settled":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Settled
          </Badge>
        );
      case "overdue":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Overdue
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getSummaryData = (status: string) => {
    const data = summary.find((s) => s._id === status);
    return data
      ? { count: data.count, amount: data.totalAmount }
      : { count: 0, amount: 0 };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-HG-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading commissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-poppins">
          Commission <span className="text-HG-500">Management</span>
        </h1>
        <p className="text-gray-600 mt-1">
          Track and manage commission settlements from owners
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {getSummaryData("pending").count}
                </p>
                <p className="text-xs text-gray-500">
                  ₹{getSummaryData("pending").amount.toLocaleString()}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Settled</p>
                <p className="text-2xl font-bold text-green-600">
                  {getSummaryData("settled").count}
                </p>
                <p className="text-xs text-gray-500">
                  ₹{getSummaryData("settled").amount.toLocaleString()}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">
                  {getSummaryData("overdue").count}
                </p>
                <p className="text-xs text-gray-500">
                  ₹{getSummaryData("overdue").amount.toLocaleString()}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-HG-600">
                  {summary.reduce((sum, s) => sum + s.count, 0)}
                </p>
                <p className="text-xs text-gray-500">
                  ₹
                  {summary
                    .reduce((sum, s) => sum + s.totalAmount, 0)
                    .toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-HG-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger
            value="pending"
            className="text-xs sm:text-sm py-2 px-2 sm:px-4"
          >
            <span className="hidden sm:inline">Pending</span>
            <span className="sm:hidden">Pending</span>
          </TabsTrigger>
          <TabsTrigger
            value="settled"
            className="text-xs sm:text-sm py-2 px-2 sm:px-4"
          >
            <span className="hidden sm:inline">Settled</span>
            <span className="sm:hidden">Settled</span>
          </TabsTrigger>
          <TabsTrigger
            value="overdue"
            className="text-xs sm:text-sm py-2 px-2 sm:px-4"
          >
            <span className="hidden sm:inline">Overdue</span>
            <span className="sm:hidden">Overdue</span>
          </TabsTrigger>
          <TabsTrigger
            value="all"
            className="text-xs sm:text-sm py-2 px-2 sm:px-4"
          >
            <span className="hidden sm:inline">All</span>
            <span className="sm:hidden">All</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {error && (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-red-500">{error}</p>
                <Button
                  variant="outline"
                  onClick={() => fetchCommissions(activeTab, currentPage)}
                  className="mt-4"
                >
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}
          {!error && commissions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No {activeTab} commissions
                </h3>
                <p className="text-gray-600">
                  {activeTab === "pending"
                    ? "No pending commission settlements."
                    : `No ${activeTab} commissions found.`}
                </p>
              </CardContent>
            </Card>
          ) : !error ? (
            <div className="grid gap-3 sm:gap-4">
              {commissions.map((commission) => (
                <Card
                  key={commission._id}
                  className="hover:shadow-md transition-shadow border border-gray-200"
                >
                  <CardContent className="p-3 sm:p-4 md:p-6">
                    <div className="flex flex-col gap-3 sm:gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm sm:text-base md:text-lg text-gray-900 line-clamp-1">
                              {commission.ownerId.fullName}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1 mt-1">
                              <User className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">
                                {commission.ownerId.email}
                              </span>
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            {getStatusBadge(commission.status)}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                              <span>
                                Booking: ₹
                                {commission.bookingAmount.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Building className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                              <span>
                                Commission: ₹
                                {commission.commissionAmount.toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                              <span>Due: {formatDate(commission.dueDate)}</span>
                            </div>
                            {commission.settledAt && (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                                <span>
                                  Settled: {formatDate(commission.settledAt)}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                            <div>
                              <span className="text-gray-500">Rate: </span>
                              <span className="font-medium">
                                {(commission.commissionRate * 100).toFixed(1)}%
                              </span>
                            </div>
                            {commission.settlementMethod && (
                              <div>
                                <span className="text-gray-500">Method: </span>
                                <span className="font-medium capitalize">
                                  {commission.settlementMethod}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2 border-t gap-2">
                          <div className="text-xs sm:text-sm">
                            <span className="text-gray-500">Created: </span>
                            <span className="font-medium">
                              {formatDate(commission.createdAt)}
                            </span>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full sm:w-auto text-xs sm:text-sm"
                              onClick={() => {
                                setSelectedDetailCommission(commission);
                                setShowDetailModal(true);
                              }}
                            >
                              <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              View More Detail
                            </Button>

                            {commission.status === "pending" && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full sm:w-auto text-xs sm:text-sm"
                                    onClick={() =>
                                      setSelectedCommission(commission)
                                    }
                                  >
                                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                    Settle Commission
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Settle Commission</DialogTitle>
                                  </DialogHeader>

                                  {selectedCommission && (
                                    <div className="space-y-4">
                                      <div className="p-4 bg-gray-50 rounded-lg">
                                        <h4 className="font-semibold mb-2">
                                          Commission Details
                                        </h4>
                                        <div className="space-y-1 text-sm">
                                          <p>
                                            <span className="text-gray-500">
                                              Owner:
                                            </span>{" "}
                                            {
                                              selectedCommission.ownerId
                                                .fullName
                                            }
                                          </p>
                                          <p>
                                            <span className="text-gray-500">
                                              Amount:
                                            </span>{" "}
                                            ₹
                                            {selectedCommission.commissionAmount.toLocaleString()}
                                          </p>
                                          <p>
                                            <span className="text-gray-500">
                                              Due Date:
                                            </span>{" "}
                                            {formatDate(
                                              selectedCommission.dueDate
                                            )}
                                          </p>
                                        </div>
                                      </div>

                                      <div>
                                        <label className="text-sm font-medium text-gray-500 mb-2 block">
                                          Settlement Method
                                        </label>
                                        <select
                                          value={settlementMethod}
                                          onChange={(e) =>
                                            setSettlementMethod(e.target.value)
                                          }
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-HG-500 focus:border-transparent"
                                        >
                                          <option value="cash">Cash</option>
                                          <option value="bank_transfer">
                                            Bank Transfer
                                          </option>
                                          <option value="upi">UPI</option>
                                        </select>
                                      </div>

                                      <div>
                                        <label className="text-sm font-medium text-gray-500 mb-2 block">
                                          Reference Number
                                        </label>
                                        <Input
                                          value={settlementReference}
                                          onChange={(e) =>
                                            setSettlementReference(
                                              e.target.value
                                            )
                                          }
                                          placeholder="Transaction ID, receipt number, etc."
                                        />
                                      </div>

                                      <div>
                                        <label className="text-sm font-medium text-gray-500 mb-2 block">
                                          Notes (Optional)
                                        </label>
                                        <Textarea
                                          value={settlementNotes}
                                          onChange={(e) =>
                                            setSettlementNotes(e.target.value)
                                          }
                                          placeholder="Additional notes about the settlement..."
                                          rows={3}
                                        />
                                      </div>

                                      <Button
                                        onClick={() =>
                                          handleSettlement(
                                            selectedCommission._id
                                          )
                                        }
                                        disabled={
                                          actionLoading ===
                                          selectedCommission._id
                                        }
                                        className="w-full bg-green-600 hover:bg-green-700"
                                      >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Mark as Settled
                                      </Button>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}
        </TabsContent>
      </Tabs>

      {/* Commission Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              Commission Details
            </DialogTitle>
          </DialogHeader>

          {selectedDetailCommission && (
            <div className="space-y-4 sm:space-y-6">
              {/* Owner Details */}
              <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-3 text-base sm:text-lg">
                  Owner Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 block text-xs sm:text-sm">
                      Full Name:
                    </span>
                    <p className="font-medium text-sm sm:text-base">
                      {selectedDetailCommission.ownerId.fullName}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs sm:text-sm">
                      Email:
                    </span>
                    <p className="font-medium text-sm sm:text-base break-all">
                      {selectedDetailCommission.ownerId.email}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs sm:text-sm">
                      Phone:
                    </span>
                    <p className="font-medium text-sm sm:text-base">
                      {selectedDetailCommission.ownerId.phoneNumber}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs sm:text-sm">
                      Owner ID:
                    </span>
                    <p className="font-medium text-xs break-all">
                      {selectedDetailCommission.ownerId._id}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tenant Details */}
              <div className="p-3 sm:p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-3 text-base sm:text-lg">
                  Tenant Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 block text-xs sm:text-sm">
                      Full Name:
                    </span>
                    <p className="font-medium text-sm sm:text-base">
                      {selectedDetailCommission.bookingId.fullName}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs sm:text-sm">
                      Email:
                    </span>
                    <p className="font-medium text-sm sm:text-base break-all">
                      {selectedDetailCommission.bookingId.email}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs sm:text-sm">
                      Phone:
                    </span>
                    <p className="font-medium text-sm sm:text-base">
                      {selectedDetailCommission.bookingId.phoneNumber}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs sm:text-sm">
                      Aadhaar Number:
                    </span>
                    <p className="font-medium text-sm sm:text-base">
                      {selectedDetailCommission.bookingId.aadhaarNumber ||
                        "Not provided"}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-gray-500 block text-xs sm:text-sm">
                      Address:
                    </span>
                    <p className="font-medium text-sm sm:text-base">
                      {selectedDetailCommission.bookingId.address.street},{" "}
                      {selectedDetailCommission.bookingId.address.city},
                      {selectedDetailCommission.bookingId.address.state} -{" "}
                      {selectedDetailCommission.bookingId.address.pincode}
                    </p>
                  </div>
                  {selectedDetailCommission.bookingId
                    .additionalRequirements && (
                    <div className="sm:col-span-2">
                      <span className="text-gray-500 block text-xs sm:text-sm">
                        Additional Requirements:
                      </span>
                      <p className="font-medium text-sm sm:text-base">
                        {
                          selectedDetailCommission.bookingId
                            .additionalRequirements
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Commission Details */}
              <div className="p-3 sm:p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold mb-3 text-base sm:text-lg">
                  Commission Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 block text-xs sm:text-sm">
                      Commission Amount:
                    </span>
                    <p className="font-medium text-base sm:text-lg text-green-600">
                      ₹
                      {selectedDetailCommission.commissionAmount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs sm:text-sm">
                      Commission Rate:
                    </span>
                    <p className="font-medium text-sm sm:text-base">
                      {(selectedDetailCommission.commissionRate * 100).toFixed(
                        1
                      )}
                      %
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs sm:text-sm">
                      Booking Amount:
                    </span>
                    <p className="font-medium text-sm sm:text-base">
                      ₹{selectedDetailCommission.bookingAmount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs sm:text-sm">
                      Status:
                    </span>
                    <div className="mt-1">
                      {getStatusBadge(selectedDetailCommission.status)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs sm:text-sm">
                      Due Date:
                    </span>
                    <p className="font-medium text-sm sm:text-base">
                      {formatDate(selectedDetailCommission.dueDate)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs sm:text-sm">
                      Created:
                    </span>
                    <p className="font-medium text-sm sm:text-base">
                      {formatDate(selectedDetailCommission.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div className="p-3 sm:p-4 bg-purple-50 rounded-lg">
                <h4 className="font-semibold mb-3 text-base sm:text-lg">
                  Booking Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 block text-xs sm:text-sm">
                      Booking ID:
                    </span>
                    <p className="font-medium text-xs break-all">
                      {selectedDetailCommission.bookingId._id}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs sm:text-sm">
                      Move-in Date:
                    </span>
                    <p className="font-medium text-sm sm:text-base">
                      {formatDate(
                        selectedDetailCommission.bookingId.moveInDate
                      )}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs sm:text-sm">
                      Security Deposit:
                    </span>
                    <p className="font-medium text-sm sm:text-base">
                      ₹
                      {selectedDetailCommission.bookingId.securityDeposit.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Settlement Details (if settled) */}
              {selectedDetailCommission.status === "settled" && (
                <div className="p-3 sm:p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-semibold mb-3 text-base sm:text-lg">
                    Settlement Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 block text-xs sm:text-sm">
                        Settled At:
                      </span>
                      <p className="font-medium text-sm sm:text-base">
                        {selectedDetailCommission.settledAt
                          ? formatDate(selectedDetailCommission.settledAt)
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-xs sm:text-sm">
                        Settled By:
                      </span>
                      <p className="font-medium text-sm sm:text-base">
                        {selectedDetailCommission.settledBy?.fullName || "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-xs sm:text-sm">
                        Settlement Method:
                      </span>
                      <p className="font-medium text-sm sm:text-base capitalize">
                        {selectedDetailCommission.settlementMethod || "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-xs sm:text-sm">
                        Reference:
                      </span>
                      <p className="font-medium text-sm sm:text-base">
                        {selectedDetailCommission.settlementReference || "N/A"}
                      </p>
                    </div>
                  </div>
                  {selectedDetailCommission.notes && (
                    <div className="mt-3">
                      <span className="text-gray-500 block text-xs sm:text-sm">
                        Notes:
                      </span>
                      <p className="font-medium text-sm sm:text-base mt-1">
                        {selectedDetailCommission.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end pt-3 sm:pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() => setShowDetailModal(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
