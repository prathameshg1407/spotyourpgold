// app/routes/dashboard/admin/students/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
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
import {
  Users,
  Search,
  User,
  Phone,
  Mail,
  Calendar,
  Building,
  CreditCard,
  Ticket,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Home,
  Clock,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Heart,
  MessageSquare,
  TrendingUp,
  UserPlus,
  Filter,
} from "lucide-react";
import { BlurImage } from "@/components/BlurImage";

interface Student {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  registeredAt: string;
  watchlistCount: number;
  bookings: {
    total: number;
    confirmed: number;
    pending: number;
    cancelled: number;
    recent: any;
  };
  payments: {
    totalPaid: number;
    pendingPayment: number;
  };
  currentStay: {
    pgName: string;
    room: string;
    status: string;
    monthlyRent: number;
    moveInDate: string;
  } | null;
  tickets: {
    total: number;
    open: number;
    resolved: number;
  };
  isActive: boolean;
}

interface Summary {
  totalStudents: number;
  activeStudents: number;
  studentsWithBookings: number;
  newThisMonth: number;
}

interface StudentDetails {
  student: any;
  currentStay: any;
  bookings: any[];
  allocations: any[];
  tickets: any[];
  paymentHistory: any[];
  rentHistory: any[];
  watchlist: any[];
  stats: any;
}

export default function StudentsManagementPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [hasBookingFilter, setHasBookingFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Student details
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentDetails, setStudentDetails] = useState<StudentDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [detailsTab, setDetailsTab] = useState("overview");

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      if (searchQuery) params.append("search", searchQuery);
      if (activeTab !== "all") params.append("status", activeTab);
      if (hasBookingFilter !== "all") params.append("hasBooking", hasBookingFilter);

      const response = await axios.get(`/api/admin/students?${params}`);
      if (response.data.success) {
        setStudents(response.data.data);
        setSummary(response.data.summary);
        setTotalPages(response.data.totalPages);
        setTotal(response.data.total);
      }
    } catch (error) {
      toast.error("Failed to fetch students");
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, activeTab, hasBookingFilter]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Debounced search
  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery !== "") {
        setCurrentPage(1);
        fetchStudents();
      }
    }, 500);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const fetchStudentDetails = async (studentId: string) => {
    try {
      setDetailsLoading(true);
      const response = await axios.get(`/api/admin/students/${studentId}`);
      if (response.data.success) {
        setStudentDetails(response.data.data);
      }
    } catch (error) {
      toast.error("Failed to fetch student details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleViewDetails = (student: Student) => {
    setSelectedStudent(student);
    setShowDetailsDialog(true);
    setDetailsTab("overview");
    fetchStudentDetails(student._id);
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800 border-green-300">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge variant="outline" className="text-gray-600">
        <Clock className="w-3 h-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "completed_cash":
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "pending_cash_payment":
        return <Badge className="bg-orange-100 text-orange-800">Awaiting Cash</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTicketStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-blue-100 text-blue-800">Open</Badge>;
      case "in_progress":
        return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      case "resolved":
        return <Badge className="bg-green-100 text-green-800">Resolved</Badge>;
      case "closed":
        return <Badge className="bg-gray-100 text-gray-800">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading && students.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-HG-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-poppins">
          Student <span className="text-HG-500">Management</span>
        </h1>
        <p className="text-gray-600 mt-1">
          Manage all registered students, their bookings, payments, and complaints
        </p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-blue-600">{summary.totalStudents}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Tenants</p>
                  <p className="text-2xl font-bold text-green-600">{summary.activeStudents}</p>
                </div>
                <Home className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-HG-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">With Bookings</p>
                  <p className="text-2xl font-bold text-HG-600">{summary.studentsWithBookings}</p>
                </div>
                <Building className="h-8 w-8 text-HG-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">New This Month</p>
                  <p className="text-2xl font-bold text-purple-600">{summary.newThisMonth}</p>
                </div>
                <UserPlus className="h-8 w-8 text-purple-600" />
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
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={hasBookingFilter} onValueChange={setHasBookingFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Booking Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Students</SelectItem>
            <SelectItem value="true">With Bookings</SelectItem>
            <SelectItem value="false">No Bookings</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchStudents} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Students</TabsTrigger>
          <TabsTrigger value="active">Active Tenants</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {students.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
                <p className="text-gray-600">
                  {searchQuery
                    ? "Try adjusting your search query."
                    : "No students match the current filters."}
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
                        <TableHead>Student</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Current Stay</TableHead>
                        <TableHead>Bookings</TableHead>
                        <TableHead>Payments</TableHead>
                        <TableHead>Tickets</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => (
                        <TableRow key={student._id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-HG-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-HG-600" />
                              </div>
                              <div>
                                <p className="font-medium">{student.fullName}</p>
                                <p className="text-xs text-gray-500">
                                  Joined {formatDate(student.registeredAt)}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p className="flex items-center gap-1">
                                <Mail className="h-3 w-3 text-gray-400" />
                                <span className="truncate max-w-[150px]">{student.email}</span>
                              </p>
                              {student.phone && (
                                <p className="flex items-center gap-1 text-gray-600">
                                  <Phone className="h-3 w-3 text-gray-400" />
                                  {student.phone}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {student.currentStay ? (
                              <div className="text-sm">
                                <p className="font-medium">{student.currentStay.pgName}</p>
                                <p className="text-xs text-gray-500">{student.currentStay.room}</p>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">No active stay</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p className="font-medium">{student.bookings.total} total</p>
                              <p className="text-xs text-gray-500">
                                {student.bookings.confirmed} confirmed
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p className="font-medium text-green-600">
                                {formatCurrency(student.payments.totalPaid)}
                              </p>
                              {student.payments.pendingPayment > 0 && (
                                <p className="text-xs text-yellow-600">
                                  {formatCurrency(student.payments.pendingPayment)} pending
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{student.tickets.total} total</p>
                              {student.tickets.open > 0 && (
                                <p className="text-xs text-red-600">
                                  {student.tickets.open} open
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(student.isActive)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(student)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
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
            Showing {students.length} of {total} students
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

      {/* Student Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-HG-500" />
              Student Details
            </DialogTitle>
            <DialogDescription>
              Complete profile, bookings, payments, and support history
            </DialogDescription>
          </DialogHeader>

          {detailsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-HG-500"></div>
            </div>
          ) : studentDetails ? (
            <div className="space-y-6">
              {/* Student Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-HG-100 flex items-center justify-center">
                    <User className="h-8 w-8 text-HG-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{studentDetails.student.fullName}</h3>
                    <p className="text-gray-600">{studentDetails.student.email}</p>
                    {studentDetails.student.phone && (
                      <p className="text-gray-600">{studentDetails.student.phone}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Registered</p>
                  <p className="font-medium">{formatDate(studentDetails.student.registeredAt)}</p>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {studentDetails.stats.totalBookings}
                  </p>
                  <p className="text-xs text-blue-700">Bookings</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(studentDetails.stats.totalPaid)}
                  </p>
                  <p className="text-xs text-green-700">Total Paid</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-yellow-600">
                    {formatCurrency(studentDetails.stats.pendingRent)}
                  </p>
                  <p className="text-xs text-yellow-700">Pending Rent</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {studentDetails.stats.openTickets}
                  </p>
                  <p className="text-xs text-purple-700">Open Tickets</p>
                </div>
              </div>

              {/* Current Stay */}
              {studentDetails.currentStay && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Current Stay
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Property:</span>
                      <p className="font-medium">{studentDetails.currentStay.pgName}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Room:</span>
                      <p className="font-medium">{studentDetails.currentStay.room}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Monthly Rent:</span>
                      <p className="font-medium">
                        {formatCurrency(studentDetails.currentStay.monthlyRent)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Move-in:</span>
                      <p className="font-medium">
                        {formatDate(studentDetails.currentStay.moveInDate)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tabs for Details */}
              <Tabs value={detailsTab} onValueChange={setDetailsTab}>
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="overview" className="text-xs sm:text-sm">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="bookings" className="text-xs sm:text-sm">
                    Bookings
                  </TabsTrigger>
                  <TabsTrigger value="payments" className="text-xs sm:text-sm">
                    Payments
                  </TabsTrigger>
                  <TabsTrigger value="rent" className="text-xs sm:text-sm">
                    Rent
                  </TabsTrigger>
                  <TabsTrigger value="tickets" className="text-xs sm:text-sm">
                    Tickets
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                  {/* Watchlist */}
                  {studentDetails.watchlist.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Heart className="h-4 w-4 text-red-500" />
                        Watchlist ({studentDetails.watchlist.length})
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {studentDetails.watchlist.slice(0, 4).map((property: any) => (
                          <div
                            key={property._id}
                            className="p-3 bg-gray-50 rounded-lg text-sm"
                          >
                            <p className="font-medium truncate">{property.pgName}</p>
                            <p className="text-xs text-gray-500 truncate">
                              {property.location?.city}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Activity Summary */}
                  <div>
                    <h4 className="font-semibold mb-3">Activity Summary</h4>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="text-gray-500">Total Bookings:</span>{" "}
                        <span className="font-medium">{studentDetails.stats.totalBookings}</span>
                      </p>
                      <p>
                        <span className="text-gray-500">Confirmed Bookings:</span>{" "}
                        <span className="font-medium text-green-600">
                          {studentDetails.stats.confirmedBookings}
                        </span>
                      </p>
                      <p>
                        <span className="text-gray-500">Total Paid:</span>{" "}
                        <span className="font-medium text-green-600">
                          {formatCurrency(
                            studentDetails.stats.totalPaid + studentDetails.stats.totalRentPaid
                          )}
                        </span>
                      </p>
                      <p>
                        <span className="text-gray-500">Stay Duration:</span>{" "}
                        <span className="font-medium">
                          {studentDetails.stats.stayDuration} months
                        </span>
                      </p>
                    </div>
                  </div>
                </TabsContent>

                {/* Bookings Tab */}
                <TabsContent value="bookings">
                  {studentDetails.bookings.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No bookings found</p>
                  ) : (
                    <div className="space-y-3">
                      {studentDetails.bookings.map((booking: any) => (
                        <div
                          key={booking._id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-200">
                              <BlurImage
                                src={booking.listingId?.primaryImage}
                                alt={booking.listingId?.pgName || "Property"}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="font-medium">
                                {booking.listingId?.pgName || "N/A"}
                              </p>
                              <p className="text-xs text-gray-500">
                                {booking.roomType} • {formatDate(booking.moveInDate)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatCurrency(booking.amount)}</p>
                            <Badge
                              className={
                                booking.status === "confirmed"
                                  ? "bg-green-100 text-green-800"
                                  : booking.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                              }
                            >
                              {booking.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Payments Tab */}
                <TabsContent value="payments">
                  {studentDetails.paymentHistory.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No payment history</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Property</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Deposit</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {studentDetails.paymentHistory.map((payment: any, idx: number) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">{payment.pgName}</TableCell>
                              <TableCell>{formatCurrency(payment.amount)}</TableCell>
                              <TableCell>{formatCurrency(payment.securityDeposit)}</TableCell>
                              <TableCell>{getPaymentStatusBadge(payment.status)}</TableCell>
                              <TableCell>{formatDate(payment.date)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>

                {/* Rent Tab */}
                <TabsContent value="rent">
                  {studentDetails.rentHistory.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No rent history</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Property</TableHead>
                            <TableHead>Room</TableHead>
                            <TableHead>Month</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Paid</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {studentDetails.rentHistory.slice(0, 12).map((rent: any, idx: number) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">{rent.pgName}</TableCell>
                              <TableCell>{rent.room}</TableCell>
                              <TableCell>{formatDate(rent.month)}</TableCell>
                              <TableCell>{formatCurrency(rent.amount)}</TableCell>
                              <TableCell>
                                <Badge
                                  className={
                                    rent.status === "paid"
                                      ? "bg-green-100 text-green-800"
                                      : rent.status === "pending"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                  }
                                >
                                  {rent.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {rent.paidAt ? formatDate(rent.paidAt) : "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>

                {/* Tickets Tab */}
                <TabsContent value="tickets">
                  {studentDetails.tickets.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No support tickets</p>
                  ) : (
                    <div className="space-y-3">
                      {studentDetails.tickets.map((ticket: any) => (
                        <div
                          key={ticket._id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{ticket.subject}</p>
                            <p className="text-xs text-gray-500">
                              {ticket.category} • {ticket.ticketNumber}
                            </p>
                          </div>
                          <div className="text-right">
                            {getTicketStatusBadge(ticket.status)}
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(ticket.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">Failed to load student details</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}