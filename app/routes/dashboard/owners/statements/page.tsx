// app/routes/dashboard/owners/statements/page.tsx
"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  FileText,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  RefreshCw,
  Building,
  Users,
  CheckCircle,
  Clock,
} from "lucide-react";

interface Statement {
  period: {
    startDate: string;
    endDate: string;
    label: string;
  };
  owner: {
    id: string;
    name: string;
    email: string;
  };
  summary: {
    totalRevenue: number;
    totalBookingRevenue: number;
    totalRentCollected: number;
    totalCommissionPending: number;
    totalCommissionPaid: number;
    netPayout: number;
    bookingsCount: number;
    rentCollectionsCount: number;
  };
  bookings: any[];
  rentCollections: any[];
  commissions: any[];
  generatedAt: string;
}

export default function StatementsPage() {
  const [statement, setStatement] = useState<Statement | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  // Generate month options
  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  // Generate year options (last 3 years)
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2].map((y) => ({
    value: y.toString(),
    label: y.toString(),
  }));

  const fetchStatement = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (selectedMonth && selectedYear) {
        params.append("month", `${selectedYear}-${selectedMonth}`);
      } else if (selectedYear) {
        params.append("year", selectedYear);
      }

      const response = await axios.get(`/api/owner/statements?${params}`);
      if (response.data.success) {
        setStatement(response.data.data);
      }
    } catch (error) {
      toast.error("Failed to fetch statement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatement();
  }, [selectedMonth, selectedYear]);

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const params = new URLSearchParams();
      params.append("format", "pdf");
      
      if (selectedMonth && selectedYear) {
        params.append("month", `${selectedYear}-${selectedMonth}`);
      } else if (selectedYear) {
        params.append("year", selectedYear);
      }

      const response = await axios.get(`/api/owner/statements?${params}`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `statement-${selectedMonth ? `${selectedYear}-${selectedMonth}` : selectedYear}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Statement downloaded successfully");
    } catch (error) {
      toast.error("Failed to download statement");
    } finally {
      setDownloading(false);
    }
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-HG-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading statement...</p>
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
            Financial <span className="text-HG-500">Statements</span>
          </h1>
          <p className="text-gray-600 mt-1">
            View and download your earnings statements
          </p>
        </div>
        <Button
          onClick={handleDownloadPDF}
          disabled={downloading || !statement}
          className="bg-HG-500 hover:bg-HG-600"
        >
          {downloading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Download PDF
        </Button>
      </div>

      {/* Period Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Select Month
              </label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Months" />
                </SelectTrigger>
                <SelectContent>
<SelectItem value="all">All Months</SelectItem>                
  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Select Year
              </label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year.value} value={year.value}>
                      {year.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={fetchStatement}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {statement && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-800">
                      {formatCurrency(statement.summary.totalRevenue)}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      {statement.summary.bookingsCount} bookings + {statement.summary.rentCollectionsCount} rent payments
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Booking Revenue</p>
                    <p className="text-2xl font-bold text-blue-800">
                      {formatCurrency(statement.summary.totalBookingRevenue)}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      {statement.summary.bookingsCount} new bookings
                    </p>
                  </div>
                  <Building className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-700">Total Commission</p>
                    <p className="text-2xl font-bold text-red-800">
                      {formatCurrency(
                        statement.summary.totalCommissionPaid +
                          statement.summary.totalCommissionPending
                      )}
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                      {formatCurrency(statement.summary.totalCommissionPending)} pending
                    </p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-HG-50 to-HG-100 border-HG-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-HG-700">Net Payout</p>
                    <p className="text-2xl font-bold text-HG-800">
                      {formatCurrency(statement.summary.netPayout)}
                    </p>
                    <p className="text-xs text-HG-600 mt-1">After all deductions</p>
                  </div>
                  <Wallet className="h-8 w-8 text-HG-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bookings Table */}
          {statement.bookings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-HG-500" />
                  New Bookings
                </CardTitle>
                <CardDescription>
                  {statement.bookings.length} bookings in this period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property</TableHead>
                        <TableHead>Tenant</TableHead>
                        <TableHead>Room</TableHead>
                        <TableHead>Move-in</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Deposit</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {statement.bookings.map((booking: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">
                            {booking.pgName || "N/A"}
                          </TableCell>
                          <TableCell>{booking.tenant}</TableCell>
                          <TableCell>{booking.roomType}</TableCell>
                          <TableCell>{formatDate(booking.moveInDate)}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(booking.amount)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(booking.securityDeposit)}
                          </TableCell>
                          <TableCell className="text-right font-medium text-green-600">
                            {formatCurrency(booking.total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rent Collections Table */}
          {statement.rentCollections.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-HG-500" />
                  Rent Collections
                </CardTitle>
                <CardDescription>
                  {statement.rentCollections.length} rent payments received
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property</TableHead>
                        <TableHead>Room</TableHead>
                        <TableHead>For Month</TableHead>
                        <TableHead>Paid On</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {statement.rentCollections.map((rent: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{rent.pgName}</TableCell>
                          <TableCell>{rent.roomNumber}</TableCell>
                          <TableCell>{formatDate(rent.month)}</TableCell>
                          <TableCell>{formatDate(rent.paidAt)}</TableCell>
                          <TableCell className="capitalize">{rent.paymentMethod}</TableCell>
                          <TableCell className="text-right font-medium text-green-600">
                            {formatCurrency(rent.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Commissions Table */}
          {statement.commissions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-HG-500" />
                  Commission Details
                </CardTitle>
                <CardDescription>
                  Platform commission breakdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property</TableHead>
                        <TableHead>Tenant</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {statement.commissions.map((commission: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">
                            {commission.pgName || "N/A"}
                          </TableCell>
                          <TableCell>{commission.tenant || "N/A"}</TableCell>
                          <TableCell>{formatDate(commission.date)}</TableCell>
                          <TableCell>
                            {commission.status === "settled" ? (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Settled
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-800">
                                <Clock className="w-3 h-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium text-red-600">
                            {formatCurrency(commission.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary Footer */}
          <Card className="bg-gray-50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-500">Period</p>
                  <p className="font-medium">
                    {formatDate(statement.period.startDate)} -{" "}
                    {formatDate(statement.period.endDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <p className="font-medium text-green-600">
                    {formatCurrency(statement.summary.totalRevenue)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Commission</p>
                  <p className="font-medium text-red-600">
                    {formatCurrency(
                      statement.summary.totalCommissionPaid +
                        statement.summary.totalCommissionPending
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Net Payout</p>
                  <p className="font-bold text-HG-600 text-lg">
                    {formatCurrency(statement.summary.netPayout)}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-400 text-center mt-4">
                Statement generated on {formatDate(statement.generatedAt)}
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}