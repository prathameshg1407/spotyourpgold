// app/routes/dashboard/owners/tenants/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Search,
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Eye,
  LogOut,
  RefreshCw,
  Home,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  ArrowRightLeft,
  FileText,
  Filter,
} from "lucide-react";

// Types
interface TenantData {
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
    location: { area: string; city: string };
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
    reason: string;
  };
  financial: {
    monthlyRent: number;
    securityDeposit: number;
    securityDepositPaid: boolean;
    currentRentStatus: string;
    currentRentPaid: number;
    totalRentPaid: number;
    overdueAmount: number;
  };
  stayDuration: {
    months: number;
    formatted: string;
  };
}

interface Summary {
  totalTenants: number;
  activeTenants: number;
  inNoticePeriod: number;
  vacatedThisMonth: number;
  newThisMonth: number;
  totalRevenue: number;
  overdueRents: number;
}

interface ListingOption {
  id: string;
  name: string;
}

export default function TenantsPage() {
  // State
  const [tenants, setTenants] = useState<TenantData[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [listings, setListings] = useState<ListingOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("current");
  const [selectedListing, setSelectedListing] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Selected tenant for actions
  const [selectedTenant, setSelectedTenant] = useState<TenantData | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Dialog states
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showNoticeDialog, setShowNoticeDialog] = useState(false);
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [showMoveOutDialog, setShowMoveOutDialog] = useState(false);

  // Form states
  const [noticeDays, setNoticeDays] = useState("30");
  const [noticeNotes, setNoticeNotes] = useState("");
  const [extensionMonths, setExtensionMonths] = useState("1");
  const [extensionReason, setExtensionReason] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [moveOutNotes, setMoveOutNotes] = useState("");

  // Fetch tenants
  const fetchTenants = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      // Map tab to status
      if (activeTab === "current") {
        params.append("status", "current"); // active + notice_period
      } else if (activeTab !== "all") {
        params.append("status", activeTab);
      }
      
      if (selectedListing !== "all") {
        params.append("listingId", selectedListing);
      }
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      params.append("page", currentPage.toString());
      params.append("per_page", "15");

      const response = await axios.get(`/api/owner/tenants?${params}`);
      
      if (response.data.success) {
        setTenants(response.data.data);
        setSummary(response.data.summary);
        setListings(response.data.listings);
        setTotalPages(response.data.totalPages);
        setTotal(response.data.total);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch tenants");
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedListing, searchQuery, currentPage]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== "") {
        setCurrentPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Action handlers
  const handleAction = async (action: string, data: any = {}) => {
    if (!selectedTenant) return;

    setActionLoading(true);
    try {
      const response = await axios.patch(
        `/api/owner/tenants/${selectedTenant.allocationId}`,
        { action, data }
      );

      if (response.data.success) {
        toast.success(response.data.message || `Action '${action}' completed`);
        closeAllDialogs();
        fetchTenants();
      } else {
        toast.error(response.data.message || "Action failed");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to perform action");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordNotice = () => {
    const vacateDate = new Date();
    vacateDate.setDate(vacateDate.getDate() + parseInt(noticeDays));
    
    handleAction("record_notice", {
      noticePeriodDays: parseInt(noticeDays),
      expectedVacateDate: vacateDate.toISOString(),
      notes: noticeNotes,
    });
  };

  const handleExtendStay = () => {
    handleAction("extend_stay", {
      months: parseInt(extensionMonths),
      reason: extensionReason,
    });
  };

  const handleProcessMoveOut = () => {
    handleAction("process_move_out", {
      refundAmount: parseFloat(refundAmount) || 0,
      notes: moveOutNotes,
    });
  };

  const closeAllDialogs = () => {
    setShowDetailsDialog(false);
    setShowNoticeDialog(false);
    setShowExtendDialog(false);
    setShowMoveOutDialog(false);
    setSelectedTenant(null);
    setNoticeDays("30");
    setNoticeNotes("");
    setExtensionMonths("1");
    setExtensionReason("");
    setRefundAmount("");
    setMoveOutNotes("");
  };

  const openTenantDetails = (tenant: TenantData) => {
    setSelectedTenant(tenant);
    setShowDetailsDialog(true);
  };

  // Helpers
  const getStatusBadge = (status: string, noticePeriod?: TenantData["noticePeriod"]) => {
    if (noticePeriod?.inNotice) {
      return (
        <Badge variant="outline" className="border-orange-300 text-orange-700 bg-orange-50">
          <Clock className="w-3 h-3 mr-1" />
          Notice ({noticePeriod.daysUntilMoveOut}d left)
        </Badge>
      );
    }

    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case "notice_period":
        return (
          <Badge variant="outline" className="border-orange-300 text-orange-700 bg-orange-50">
            <Clock className="w-3 h-3 mr-1" />
            Notice Period
          </Badge>
        );
      case "vacated":
        return (
          <Badge variant="outline" className="border-gray-300 text-gray-700 bg-gray-50">
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
      case "partial":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <DollarSign className="w-3 h-3 mr-1" />
            Partial
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

  // Loading state
  if (loading && tenants.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-HG-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading tenants...</p>
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
            Tenant <span className="text-HG-500">Management</span>
          </h1>
          <p className="text-gray-600 mt-1">
            View and manage all tenants across your properties
          </p>
        </div>
        <Button variant="outline" onClick={fetchTenants} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total</p>
                  <p className="text-lg font-bold">{summary.totalTenants}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Active</p>
                  <p className="text-lg font-bold">{summary.activeTenants}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">In Notice</p>
                  <p className="text-lg font-bold">{summary.inNoticePeriod}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <LogOut className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Vacated</p>
                  <p className="text-lg font-bold">{summary.vacatedThisMonth}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <User className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">New</p>
                  <p className="text-lg font-bold">{summary.newThisMonth}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Overdue</p>
                  <p className="text-lg font-bold">{summary.overdueRents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-HG-100 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-HG-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Revenue</p>
                  <p className="text-sm font-bold text-HG-600">
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
        <div className="relative flex-1 max-w-md">
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
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setCurrentPage(1); }}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="current">Current</TabsTrigger>
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
                  {searchQuery
                    ? "Try adjusting your search query"
                    : activeTab === "current"
                    ? "You don't have any current tenants"
                    : `No ${activeTab.replace("_", " ")} tenants found`}
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
                        <TableHead>Move-in</TableHead>
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
                              <p className="text-sm">{formatDate(tenant.dates.moveIn)}</p>
                              <p className="text-xs text-gray-500">
                                {tenant.stayDuration.formatted}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              {getRentStatusBadge(tenant.financial.currentRentStatus)}
                              <p className="text-xs text-gray-500 mt-1">
                                {formatCurrency(tenant.financial.monthlyRent)}/mo
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(tenant.status, tenant.noticePeriod)}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openTenantDetails(tenant)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                
                                {tenant.status !== "vacated" && (
                                  <>
                                    <DropdownMenuSeparator />
                                    
                                    {tenant.status === "active" && (
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setSelectedTenant(tenant);
                                          setShowNoticeDialog(true);
                                        }}
                                        className="text-orange-600"
                                      >
                                        <Clock className="w-4 h-4 mr-2" />
                                        Record Notice
                                      </DropdownMenuItem>
                                    )}
                                    
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedTenant(tenant);
                                        setShowExtendDialog(true);
                                      }}
                                      className="text-green-600"
                                    >
                                      <RefreshCw className="w-4 h-4 mr-2" />
                                      Extend Stay
                                    </DropdownMenuItem>
                                    
                                    {tenant.status === "notice_period" && (
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setSelectedTenant(tenant);
                                          setRefundAmount(tenant.financial.securityDeposit.toString());
                                          setShowMoveOutDialog(true);
                                        }}
                                        className="text-red-600"
                                      >
                                        <LogOut className="w-4 h-4 mr-2" />
                                        Process Move-out
                                      </DropdownMenuItem>
                                    )}
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
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
            <span className="text-sm px-2">
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

      {/* Tenant Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tenant Details</DialogTitle>
            <DialogDescription>Complete profile and stay information</DialogDescription>
          </DialogHeader>

          {selectedTenant && (
            <div className="space-y-6 py-4">
              {/* Personal Info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Personal Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span>
                    <p className="font-medium">{selectedTenant.tenant.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Phone:</span>
                    <p className="font-medium">{selectedTenant.tenant.phone}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <p className="font-medium">{selectedTenant.tenant.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Aadhaar:</span>
                    <p className="font-medium">
                      {selectedTenant.booking.aadhaarNumber || "Not provided"}
                    </p>
                  </div>
                </div>
                {selectedTenant.booking.address && (
                  <div className="mt-3 pt-3 border-t">
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
                    <p className="font-medium">{selectedTenant.property.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Room & Bed:</span>
                    <p className="font-medium">
                      {selectedTenant.room.type} - Room {selectedTenant.room.number}, Bed{" "}
                      {selectedTenant.room.bed}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Location:</span>
                    <p className="font-medium">
                      {selectedTenant.property.location?.area},{" "}
                      {selectedTenant.property.location?.city}
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
                    <span className="text-gray-500">Move-in Date:</span>
                    <p className="font-medium">{formatDate(selectedTenant.dates.moveIn)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Expected Move-out:</span>
                    <p className="font-medium">
                      {formatDate(selectedTenant.dates.expectedMoveOut)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Stay Duration:</span>
                    <p className="font-medium">{selectedTenant.stayDuration.formatted}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <div className="mt-1">
                      {getStatusBadge(selectedTenant.status, selectedTenant.noticePeriod)}
                    </div>
                  </div>
                  {selectedTenant.noticePeriod.inNotice && (
                    <>
                      <div>
                        <span className="text-gray-500">Notice Given:</span>
                        <p className="font-medium">
                          {formatDate(selectedTenant.noticePeriod.noticeGivenDate!)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Vacating On:</span>
                        <p className="font-medium text-orange-600">
                          {formatDate(selectedTenant.noticePeriod.expectedVacateDate!)}
                        </p>
                      </div>
                    </>
                  )}
                  {selectedTenant.dates.actualMoveOut && (
                    <div className="col-span-2">
                      <span className="text-gray-500">Actual Move-out:</span>
                      <p className="font-medium">
                        {formatDate(selectedTenant.dates.actualMoveOut)}
                      </p>
                    </div>
                  )}
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
                      {formatCurrency(selectedTenant.financial.securityDeposit)}
                      {selectedTenant.financial.securityDepositPaid && (
                        <span className="text-green-600 ml-1">(Paid)</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Current Month:</span>
                    <div className="mt-1">
                      {getRentStatusBadge(selectedTenant.financial.currentRentStatus)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Total Paid:</span>
                    <p className="font-medium text-green-600">
                      {formatCurrency(selectedTenant.financial.totalRentPaid)}
                    </p>
                  </div>
                  {selectedTenant.financial.overdueAmount > 0 && (
                    <div className="col-span-2">
                      <span className="text-gray-500">Overdue Amount:</span>
                      <p className="font-medium text-red-600">
                        {formatCurrency(selectedTenant.financial.overdueAmount)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              {selectedTenant.status !== "vacated" && (
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  {selectedTenant.status === "active" && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowDetailsDialog(false);
                        setShowNoticeDialog(true);
                      }}
                      className="border-orange-300 text-orange-600 hover:bg-orange-50"
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Record Notice
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDetailsDialog(false);
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
                        setShowDetailsDialog(false);
                        setRefundAmount(selectedTenant.financial.securityDeposit.toString());
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

      {/* Record Notice Dialog */}
      <Dialog open={showNoticeDialog} onOpenChange={setShowNoticeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Notice Period</DialogTitle>
            <DialogDescription>
              Record that the tenant has given notice to vacate
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedTenant && (
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <p>
                  <strong>Tenant:</strong> {selectedTenant.tenant.name}
                </p>
                <p>
                  <strong>Room:</strong> {selectedTenant.room.number}, Bed {selectedTenant.room.bed}
                </p>
              </div>
            )}

            <div>
              <Label>Notice Period (Days)</Label>
              <Input
                type="number"
                value={noticeDays}
                onChange={(e) => setNoticeDays(e.target.value)}
                placeholder="30"
                min="1"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Expected vacate date will be {noticeDays} days from today
              </p>
            </div>

            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                value={noticeNotes}
                onChange={(e) => setNoticeNotes(e.target.value)}
                placeholder="Reason for leaving, any special arrangements..."
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeAllDialogs}>
              Cancel
            </Button>
            <Button
              onClick={handleRecordNotice}
              disabled={actionLoading || !noticeDays}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {actionLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <Clock className="w-4 h-4 mr-2" />
              )}
              Record Notice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Stay Dialog */}
      <Dialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Stay</DialogTitle>
            <DialogDescription>Extend the tenants stay duration</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedTenant && (
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <p>
                  <strong>Tenant:</strong> {selectedTenant.tenant.name}
                </p>
                <p>
                  <strong>Current End Date:</strong>{" "}
                  {formatDate(selectedTenant.dates.expectedMoveOut)}
                </p>
              </div>
            )}

            <div>
              <Label>Extension Duration (Months)</Label>
              <Input
                type="number"
                value={extensionMonths}
                onChange={(e) => setExtensionMonths(e.target.value)}
                placeholder="1"
                min="1"
                max="12"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Reason (Optional)</Label>
              <Textarea
                value={extensionReason}
                onChange={(e) => setExtensionReason(e.target.value)}
                placeholder="Reason for extension..."
                className="mt-1"
                rows={2}
              />
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This will extend the stay by {extensionMonths} month(s) and
                generate additional rent entries. If tenant was in notice period, it will be reset.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeAllDialogs}>
              Cancel
            </Button>
            <Button
              onClick={handleExtendStay}
              disabled={actionLoading || !extensionMonths}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Extend Stay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Out Dialog */}
      <Dialog open={showMoveOutDialog} onOpenChange={setShowMoveOutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Move-out</DialogTitle>
            <DialogDescription>
              Complete the tenants move-out and process security deposit refund
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedTenant && (
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <p>
                  <strong>Tenant:</strong> {selectedTenant.tenant.name}
                </p>
                <p>
                  <strong>Room:</strong> {selectedTenant.room.number}, Bed {selectedTenant.room.bed}
                </p>
                <p>
                  <strong>Security Deposit:</strong>{" "}
                  {formatCurrency(selectedTenant.financial.securityDeposit)}
                </p>
              </div>
            )}

            <div>
              <Label>Security Deposit Refund Amount (₹)</Label>
              <Input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="Enter refund amount"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Deduct any pending dues, damages, or other charges from the refund
              </p>
            </div>

            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                value={moveOutNotes}
                onChange={(e) => setMoveOutNotes(e.target.value)}
                placeholder="Any notes about deductions or move-out..."
                className="mt-1"
                rows={2}
              />
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> This will mark the tenant as vacated and free up the bed
                for new allocation. This action cannot be undone.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeAllDialogs}>
              Cancel
            </Button>
            <Button
              onClick={handleProcessMoveOut}
              disabled={actionLoading}
              variant="destructive"
            >
              {actionLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <LogOut className="w-4 h-4 mr-2" />
              )}
              Complete Move-out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}