// app/routes/dashboard/owners/tenants/page.tsx
"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Users,
  Search,
  Filter,
  User,
  Phone,
  Mail,
  Calendar,
  Building,
  Bed,
  Clock,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Eye,
  LogOut,
  RefreshCw,
  FileText,
  Home,
  CreditCard,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Tenant {
  allocationId: string;
  tenant: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  booking: {
    id: string;
    aadhaarNumber: string;
    address: {
      street: string;
      city: string;
      state: string;
      pincode: string;
    };
  };
  property: {
    id: string;
    name: string;
    location: any;
  };
  room: {
    id: string;
    number: string;
    bed: string;
    type: string;
  };
  dates: {
    moveIn: string;
    expectedMoveOut: string;
    actualMoveOut: string | null;
    allocatedAt: string;
  };
  status: string;
  noticePeriod: {
    inNotice: boolean;
    noticeGivenDate: string | null;
    expectedVacateDate: string | null;
    daysUntilMoveOut: number | null;
  };
  financial: {
    monthlyRent: number;
    securityDeposit: number;
    securityDepositPaid: boolean;
    currentRentStatus: string;
    currentRentPaid: number;
    totalRentPaid: number;
  };
  stayDuration: {
    months: number;
  };
}

interface Summary {
  totalTenants: number;
  activeTenants: number;
  inNoticePeriod: number;
  vacatedThisMonth: number;
  totalRevenue: number;
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [listings, setListings] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");
  const [selectedListing, setSelectedListing] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Action states
  const [showNoticeDialog, setShowNoticeDialog] = useState(false);
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [showMoveOutDialog, setShowMoveOutDialog] = useState(false);
  const [noticeDays, setNoticeDays] = useState("30");
  const [extensionMonths, setExtensionMonths] = useState("1");
  const [refundAmount, setRefundAmount] = useState("");
  const [actionNotes, setActionNotes] = useState("");

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeTab !== "all") params.append("status", activeTab);
      if (selectedListing !== "all") params.append("listingId", selectedListing);
      if (searchQuery) params.append("search", searchQuery);
      params.append("page", currentPage.toString());

      const response = await axios.get(`/api/owner/tenants?${params}`);
      if (response.data.success) {
        setTenants(response.data.data);
        setSummary(response.data.summary);
        setListings(response.data.listings);
        setTotalPages(response.data.totalPages);
        setTotal(response.data.total);
      }
    } catch (error) {
      toast.error("Failed to fetch tenants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, [activeTab, selectedListing, currentPage]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery !== "") {
        setCurrentPage(1);
        fetchTenants();
      }
    }, 500);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleAction = async (action: string, data: any = {}) => {
    if (!selectedTenant) return;

    try {
      setActionLoading(true);
      const response = await axios.patch(
        `/api/owner/tenants/${selectedTenant.allocationId}`,
        { action, data }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        setShowNoticeDialog(false);
        setShowExtendDialog(false);
        setShowMoveOutDialog(false);
        setSelectedTenant(null);
        fetchTenants();
      }
    } catch (error) {
      toast.error("Failed to perform action");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string, noticePeriod?: any) => {
    if (noticePeriod?.inNotice) {
      return (
        <Badge variant="outline" className="border-orange-300 text-orange-700">
          <Clock className="w-3 h-3 mr-1" />
          Notice ({noticePeriod.daysUntilMoveOut}d left)
        </Badge>
      );
    }

    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="border-green-300 text-green-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case "notice_period":
        return (
          <Badge variant="outline" className="border-orange-300 text-orange-700">
            <Clock className="w-3 h-3 mr-1" />
            Notice Period
          </Badge>
        );
      case "vacated":
        return (
          <Badge variant="outline" className="border-gray-300 text-gray-700">
            <LogOut className="w-3 h-3 mr-1" />
            Vacated
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRentStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Paid
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "overdue":
        return (
          <Badge className="bg-red-100 text-red-800">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Overdue
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

  if (loading && tenants.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-HG-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tenants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-poppins">
          Tenant <span className="text-HG-500">Management</span>
        </h1>
        <p className="text-gray-600 mt-1">
          View and manage all tenants across your properties
        </p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Tenants</p>
                  <p className="text-xl font-bold">{summary.totalTenants}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="text-xl font-bold">{summary.activeTenants}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">In Notice</p>
                  <p className="text-xl font-bold">{summary.inNoticePeriod}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <LogOut className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Vacated (Month)</p>
                  <p className="text-xl font-bold">{summary.vacatedThisMonth}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-HG-100 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-HG-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-lg font-bold text-HG-600">
                    {formatCurrency(summary.totalRevenue)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, email, phone, or room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedListing} onValueChange={setSelectedListing}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by Property" />
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
        <Button variant="outline" onClick={fetchTenants} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="notice_period">In Notice</TabsTrigger>
          <TabsTrigger value="vacated">Vacated</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {tenants.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No tenants found
                </h3>
                <p className="text-gray-600">
                  {activeTab === "active"
                    ? "You don't have any active tenants yet."
                    : `No ${activeTab.replace("_", " ")} tenants found.`}
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
                        <TableHead>Move-in Date</TableHead>
                        <TableHead>Rent Status</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tenants.map((tenant) => (
                        <TableRow key={tenant.allocationId}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-HG-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-HG-600" />
                              </div>
                              <div>
                                <p className="font-medium">{tenant.tenant.name}</p>
                                <p className="text-xs text-gray-500">{tenant.tenant.phone}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{tenant.property.name}</p>
                              <p className="text-xs text-gray-500">
                                Room {tenant.room.number}, Bed {tenant.room.bed}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p>{formatDate(tenant.dates.moveIn)}</p>
                              <p className="text-xs text-gray-500">
                                {tenant.stayDuration.months} months
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              {getRentStatusBadge(tenant.financial.currentRentStatus)}
                              <p className="text-xs text-gray-500 mt-1">
                                {formatCurrency(tenant.financial.monthlyRent)}/month
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(tenant.status, tenant.noticePeriod)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedTenant(tenant)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Tenant Details</DialogTitle>
                                    <DialogDescription>
                                      Complete profile and stay information
                                    </DialogDescription>
                                  </DialogHeader>
                                  {selectedTenant && (
                                    <div className="space-y-6">
                                      {/* Personal Info */}
                                      <div className="p-4 bg-gray-50 rounded-lg">
                                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                                          <User className="h-4 w-4" />
                                          Personal Information
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                          <div>
                                            <span className="text-gray-500">Name:</span>
                                            <p className="font-medium">
                                              {selectedTenant.tenant.name}
                                            </p>
                                          </div>
                                          <div>
                                            <span className="text-gray-500">Phone:</span>
                                            <p className="font-medium">
                                              {selectedTenant.tenant.phone}
                                            </p>
                                          </div>
                                          <div>
                                            <span className="text-gray-500">Email:</span>
                                            <p className="font-medium">
                                              {selectedTenant.tenant.email}
                                            </p>
                                          </div>
                                          <div>
                                            <span className="text-gray-500">Aadhaar:</span>
                                            <p className="font-medium">
                                              {selectedTenant.booking.aadhaarNumber || "Not provided"}
                                            </p>
                                          </div>
                                        </div>
                                        {selectedTenant.booking.address && (
                                          <div className="mt-3">
                                            <span className="text-gray-500 text-sm">Address:</span>
                                            <p className="font-medium text-sm">
                                              {selectedTenant.booking.address.street},{" "}
                                              {selectedTenant.booking.address.city},{" "}
                                              {selectedTenant.booking.address.state} -{" "}
                                              {selectedTenant.booking.address.pincode}
                                            </p>
                                          </div>
                                        )}
                                      </div>

                                      {/* Room Info */}
                                      <div className="p-4 bg-blue-50 rounded-lg">
                                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                                          <Home className="h-4 w-4" />
                                          Room Details
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                          <div>
                                            <span className="text-gray-500">Property:</span>
                                            <p className="font-medium">
                                              {selectedTenant.property.name}
                                            </p>
                                          </div>
                                          <div>
                                            <span className="text-gray-500">Room:</span>
                                            <p className="font-medium">
                                              {selectedTenant.room.type} - Room{" "}
                                              {selectedTenant.room.number}, Bed{" "}
                                              {selectedTenant.room.bed}
                                            </p>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Stay Info */}
                                      <div className="p-4 bg-green-50 rounded-lg">
                                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                                          <Calendar className="h-4 w-4" />
                                          Stay Information
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                          <div>
                                            <span className="text-gray-500">Move-in:</span>
                                            <p className="font-medium">
                                              {formatDate(selectedTenant.dates.moveIn)}
                                            </p>
                                          </div>
                                          <div>
                                            <span className="text-gray-500">Expected Move-out:</span>
                                            <p className="font-medium">
                                              {formatDate(selectedTenant.dates.expectedMoveOut)}
                                            </p>
                                          </div>
                                          <div>
                                            <span className="text-gray-500">Stay Duration:</span>
                                            <p className="font-medium">
                                              {selectedTenant.stayDuration.months} months
                                            </p>
                                          </div>
                                          <div>
                                            <span className="text-gray-500">Status:</span>
                                            <div className="mt-1">
                                              {getStatusBadge(
                                                selectedTenant.status,
                                                selectedTenant.noticePeriod
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Financial Info */}
                                      <div className="p-4 bg-yellow-50 rounded-lg">
                                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                                          <CreditCard className="h-4 w-4" />
                                          Financial Details
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                          <div>
                                            <span className="text-gray-500">Monthly Rent:</span>
                                            <p className="font-medium">
                                              {formatCurrency(selectedTenant.financial.monthlyRent)}
                                            </p>
                                          </div>
                                          <div>
                                            <span className="text-gray-500">Security Deposit:</span>
                                            <p className="font-medium">
                                              {formatCurrency(
                                                selectedTenant.financial.securityDeposit
                                              )}
                                              {selectedTenant.financial.securityDepositPaid && (
                                                <span className="text-green-600 ml-1">(Paid)</span>
                                              )}
                                            </p>
                                          </div>
                                          <div>
                                            <span className="text-gray-500">Current Month:</span>
                                            <div className="mt-1">
                                              {getRentStatusBadge(
                                                selectedTenant.financial.currentRentStatus
                                              )}
                                            </div>
                                          </div>
                                          <div>
                                            <span className="text-gray-500">Total Paid:</span>
                                            <p className="font-medium text-green-600">
                                              {formatCurrency(
                                                selectedTenant.financial.totalRentPaid
                                              )}
                                            </p>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Actions */}
                                      {selectedTenant.status !== "vacated" && (
                                        <div className="flex flex-wrap gap-2 pt-4 border-t">
                                          {selectedTenant.status === "active" && (
                                            <Button
                                              variant="outline"
                                              onClick={() => setShowNoticeDialog(true)}
                                              className="border-orange-300 text-orange-600 hover:bg-orange-50"
                                            >
                                              <Clock className="w-4 h-4 mr-2" />
                                              Record Notice
                                            </Button>
                                          )}
                                          <Button
                                            variant="outline"
                                            onClick={() => {
                                              setExtensionMonths("1");
                                              setShowExtendDialog(true);
                                            }}
                                            className="border-green-300 text-green-600 hover:bg-green-50"
                                          >
                                            <RefreshCw className="w-4 h-4 mr-2" />
                                            Extend Stay
                                          </Button>
                                          {selectedTenant.status === "notice_period" && (
                                            <Button
                                              variant="outline"
                                              onClick={() => {
                                                setRefundAmount(
                                                  selectedTenant.financial.securityDeposit.toString()
                                                );
                                                setShowMoveOutDialog(true);
                                              }}
                                              className="border-red-300 text-red-600 hover:bg-red-50"
                                            >
                                              <LogOut className="w-4 h-4 mr-2" />
                                              Process Move-out
                                            </Button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                            </div>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {tenants.length} of {total} tenants
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Notice Dialog */}
      <Dialog open={showNoticeDialog} onOpenChange={setShowNoticeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Notice Period</DialogTitle>
            <DialogDescription>
              Record that the tenant has given notice to vacate
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Notice Period (Days)</label>
              <Input
                type="number"
                value={noticeDays}
                onChange={(e) => setNoticeDays(e.target.value)}
                placeholder="30"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Notes (Optional)</label>
              <Textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Any notes about the notice..."
              />
            </div>
            <Button
              onClick={() =>
                handleAction("record_notice", {
                  noticePeriodDays: parseInt(noticeDays),
                  notes: actionNotes,
                })
              }
              disabled={actionLoading}
              className="w-full"
            >
              {actionLoading ? "Processing..." : "Record Notice"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Extend Stay Dialog */}
      <Dialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Stay</DialogTitle>
            <DialogDescription>Extend the tenant's stay duration</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Extension (Months)</label>
              <Input
                type="number"
                value={extensionMonths}
                onChange={(e) => setExtensionMonths(e.target.value)}
                placeholder="1"
                min="1"
              />
            </div>
            <Button
              onClick={() =>
                handleAction("extend_stay", { months: parseInt(extensionMonths) })
              }
              disabled={actionLoading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {actionLoading ? "Processing..." : "Extend Stay"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Move Out Dialog */}
      <Dialog open={showMoveOutDialog} onOpenChange={setShowMoveOutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Move-out</DialogTitle>
            <DialogDescription>
              Complete the tenant's move-out and process security deposit refund
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Security Deposit Refund (₹)</label>
              <Input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="Enter refund amount"
              />
              <p className="text-xs text-gray-500 mt-1">
                Original deposit: {formatCurrency(selectedTenant?.financial.securityDeposit || 0)}
              </p>
            </div>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This will mark the tenant as vacated and free up the
                bed for new allocation.
              </p>
            </div>
            <Button
              onClick={() =>
                handleAction("process_move_out", {
                  refundAmount: parseFloat(refundAmount),
                })
              }
              disabled={actionLoading}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? "Processing..." : "Complete Move-out"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}