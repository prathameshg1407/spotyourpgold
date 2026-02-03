// app/routes/dashboard/user/my-room/page.tsx
"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import {
  Home,
  Bed,
  User,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  IndianRupee,
  CheckCircle,
  AlertTriangle,
  LogOut,
  Users,
  Wifi,
  Car,
  Utensils,
  Shield,
  FileText,
  X,
} from "lucide-react";

// Types
interface RoommateData {
  name: string;
  bedNumber: string;
  moveInDate: string;
}

interface NextRentDue {
  amount: number;
  dueDate: string;
  status: string;
  lateFee: number;
}

interface AllocationData {
  _id: string;
  roomNumber: string;
  bedNumber: string;
  roomType: string;
  pgName: string;
  moveInDate: string;
  expectedMoveOutDate: string;
  status: string;
  noticePeriodDays: number;
  noticeGivenDate: string | null;
  expectedVacateDate: string | null;
  monthlyRent: number;
  securityDeposit: number;
  securityDepositPaid: boolean;
  room: {
    roomNumber: string;
    roomType: string;
    floor: number;
    isAC: boolean;
    hasAttachedBathroom: boolean;
    amenities: string[];
  };
  listing: {
    pgName: string;
    location: { area: string; city: string; state: string };
    amenities: string[];
    detailedRules: any;
    mealTimings: any;
    rentInclusions: any;
    primaryImage: string;
  };
}

export default function MyRoomPage() {
  // State
  const [allocation, setAllocation] = useState<AllocationData | null>(null);
  const [roommates, setRoommates] = useState<RoommateData[]>([]);
  const [nextRentDue, setNextRentDue] = useState<NextRentDue | null>(null);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [showNoticeDialog, setShowNoticeDialog] = useState(false);
  const [showCancelNoticeDialog, setShowCancelNoticeDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Notice form state
  const [vacateDate, setVacateDate] = useState("");
  const [vacateReason, setVacateReason] = useState("");

  // Fetch allocation data
  useEffect(() => {
    fetchAllocation();
  }, []);

  const fetchAllocation = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/user/allocation");
      
      if (response.data.success && response.data.data) {
        setAllocation(response.data.data.allocation);
        setRoommates(response.data.data.roommates || []);
        setNextRentDue(response.data.data.nextRentDue);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch room data");
    } finally {
      setLoading(false);
    }
  };

  const handleGiveNotice = async () => {
    if (!vacateDate) {
      toast.error("Please select a vacate date");
      return;
    }

    setActionLoading(true);
    try {
      const response = await axios.post("/api/user/allocation", {
        expectedVacateDate: vacateDate,
        reason: vacateReason,
      });

      if (response.data.success) {
        toast.success("Notice submitted successfully!");
        setShowNoticeDialog(false);
        setVacateDate("");
        setVacateReason("");
        fetchAllocation();
      } else {
        toast.error(response.data.message || "Failed to submit notice");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit notice");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelNotice = async () => {
    setActionLoading(true);
    try {
      const response = await axios.put("/api/user/allocation");

      if (response.data.success) {
        toast.success("Notice cancelled successfully!");
        setShowCancelNoticeDialog(false);
        fetchAllocation();
      } else {
        toast.error(response.data.message || "Failed to cancel notice");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to cancel notice");
    } finally {
      setActionLoading(false);
    }
  };

  // Calculate minimum vacate date based on notice period
  const getMinVacateDate = () => {
    if (!allocation) return "";
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + allocation.noticePeriodDays);
    return minDate.toISOString().split("T")[0];
  };

  // Helpers
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

  const getDaysRemaining = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-HG-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading your room details...</p>
        </div>
      </div>
    );
  }

  // No allocation state
  if (!allocation) {
    return (
      <div className="space-y-6 pb-10">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-poppins">
            My <span className="text-HG-500">Room</span>
          </h1>
          <p className="text-gray-600 mt-1">View your room details and manage your stay</p>
        </div>

        <Card className="py-16">
          <CardContent className="text-center">
            <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Room Allocated</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              You do not have a room allocated yet. Once your booking is confirmed and you are
              allocated a room, your details will appear here.
            </p>
            <Button asChild className="bg-HG-500 hover:bg-HG-600">
              <a href="/routes/all-listings">Browse PGs</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isInNoticePeriod = allocation.status === "notice_period";

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-poppins">
            My <span className="text-HG-500">Room</span>
          </h1>
          <p className="text-gray-600 mt-1">View your room details and manage your stay</p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {isInNoticePeriod ? (
            <Badge className="bg-orange-100 text-orange-800 border-orange-300 px-4 py-2">
              <Clock className="w-4 h-4 mr-2" />
              Notice Period - {getDaysRemaining(allocation.expectedVacateDate!)} days left
            </Badge>
          ) : (
            <Badge className="bg-green-100 text-green-800 border-green-300 px-4 py-2">
              <CheckCircle className="w-4 h-4 mr-2" />
              Active Tenant
            </Badge>
          )}
        </div>
      </div>

      {/* Notice Period Alert */}
      {isInNoticePeriod && (
        <Card className="border-2 border-orange-300 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-800">
                    You are in your notice period
                  </p>
                  <p className="text-sm text-orange-700 mt-1">
                    Expected move-out date: {formatDate(allocation.expectedVacateDate!)}
                  </p>
                  <p className="text-xs text-orange-600 mt-2">
                    Notice given on: {formatDate(allocation.noticeGivenDate!)}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelNoticeDialog(true)}
                className="border-orange-400 text-orange-700 hover:bg-orange-100"
              >
                <X className="w-4 h-4 mr-1" />
                Cancel Notice
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Room Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property & Room Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5 text-HG-500" />
                Room Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Property Info */}
              <div className="flex items-start gap-4">
                {allocation.listing?.primaryImage && (
                  <img
                    src={allocation.listing.primaryImage}
                    alt={allocation.pgName}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                )}
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{allocation.pgName}</h3>
                  <p className="text-gray-600 flex items-center gap-1 mt-1">
                    <MapPin className="w-4 h-4" />
                    {allocation.listing?.location?.area}, {allocation.listing?.location?.city}
                  </p>
                </div>
              </div>

              {/* Room Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Room Number</p>
                  <p className="text-lg font-bold text-gray-900">{allocation.roomNumber}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Bed</p>
                  <p className="text-lg font-bold text-gray-900">{allocation.bedNumber}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Type</p>
                  <p className="text-lg font-bold text-gray-900 capitalize">{allocation.roomType}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Floor</p>
                  <p className="text-lg font-bold text-gray-900">{allocation.room?.floor || 0}</p>
                </div>
              </div>

              {/* Room Features */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                {allocation.room?.isAC && (
                  <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                    ❄️ Air Conditioned
                  </Badge>
                )}
                {allocation.room?.hasAttachedBathroom && (
                  <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                    🚿 Attached Bathroom
                  </Badge>
                )}
                {allocation.room?.amenities?.map((amenity, index) => (
                  <Badge key={index} variant="outline">
                    {amenity}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stay Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-HG-500" />
                Stay Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-xs text-green-600 font-medium">Move-in Date</p>
                  <p className="text-lg font-bold text-green-800">
                    {formatDate(allocation.moveInDate)}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-600 font-medium">Expected Move-out</p>
                  <p className="text-lg font-bold text-blue-800">
                    {formatDate(allocation.expectedMoveOutDate)}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-lg font-bold text-purple-800">
                    {allocation.noticePeriodDays} days
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Roommates */}
          {roommates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-HG-500" />
                  Your Roommates
                </CardTitle>
                <CardDescription>
                  Other tenants sharing the same room
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {roommates.map((roommate, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="h-10 w-10 rounded-full bg-HG-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-HG-600" />
                      </div>
                      <div>
                        <p className="font-medium">{roommate.name}</p>
                        <p className="text-xs text-gray-500">
                          Bed {roommate.bedNumber} • Since{" "}
                          {new Date(roommate.moveInDate).toLocaleDateString("en-IN", {
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Property Amenities */}
          {allocation.listing?.amenities && allocation.listing.amenities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-HG-500" />
                  Property Amenities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {allocation.listing.amenities.map((amenity, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rules & Policies */}
          {allocation.listing?.detailedRules && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-HG-500" />
                  Rules & Policies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {allocation.listing.detailedRules.entryTiming && (
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium">Entry Timing</p>
                        <p className="text-gray-600">{allocation.listing.detailedRules.entryTiming}</p>
                      </div>
                    </div>
                  )}
                  {allocation.listing.detailedRules.exitTiming && (
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium">Exit Timing</p>
                        <p className="text-gray-600">{allocation.listing.detailedRules.exitTiming}</p>
                      </div>
                    </div>
                  )}
                  {allocation.listing.detailedRules.guestStayPolicy && (
                    <div className="flex items-start gap-2">
                      <Users className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium">Guest Policy</p>
                        <p className="text-gray-600 capitalize">
                          {allocation.listing.detailedRules.guestStayPolicy.replace("-", " ")}
                        </p>
                      </div>
                    </div>
                  )}
                  {allocation.listing.detailedRules.smokingAlcoholPolicy && (
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium">Smoking/Alcohol</p>
                        <p className="text-gray-600 capitalize">
                          {allocation.listing.detailedRules.smokingAlcoholPolicy.replace("-", " ")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Financial & Actions */}
        <div className="space-y-6">
          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-HG-500" />
                Financial Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-HG-50 rounded-lg">
                <p className="text-xs text-HG-600 font-medium">Monthly Rent</p>
                <p className="text-2xl font-bold text-HG-800">
                  {formatCurrency(allocation.monthlyRent)}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 font-medium">Security Deposit</p>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-gray-800">
                    {formatCurrency(allocation.securityDeposit)}
                  </p>
                  {allocation.securityDepositPaid ? (
                    <Badge className="bg-green-100 text-green-800">Paid</Badge>
                  ) : (
                    <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                  )}
                </div>
              </div>

              {/* Rent Inclusions */}
              {allocation.listing?.rentInclusions && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-gray-700 mb-2">Rent Includes:</p>
                  <div className="space-y-2">
                    {allocation.listing.rentInclusions.foodIncluded && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <Utensils className="w-4 h-4" />
                        <span>Food/Meals</span>
                      </div>
                    )}
                    {allocation.listing.rentInclusions.electricityIncluded && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <Wifi className="w-4 h-4" />
                        <span>Electricity</span>
                      </div>
                    )}
                    {allocation.listing.rentInclusions.maintenanceIncluded && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <Shield className="w-4 h-4" />
                        <span>Maintenance</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Rent Due */}
          {nextRentDue && (
            <Card
              className={`border-2 ${
                nextRentDue.status === "overdue"
                  ? "border-red-300 bg-red-50"
                  : nextRentDue.status === "pending"
                  ? "border-yellow-300 bg-yellow-50"
                  : "border-green-300 bg-green-50"
              }`}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  {nextRentDue.status === "overdue" ? (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  ) : nextRentDue.status === "pending" ? (
                    <Clock className="w-5 h-5 text-yellow-600" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                  {nextRentDue.status === "paid" ? "Current Month Paid" : "Rent Due"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {nextRentDue.status !== "paid" ? (
                  <>
                    <p
                      className={`text-2xl font-bold ${
                        nextRentDue.status === "overdue" ? "text-red-800" : "text-yellow-800"
                      }`}
                    >
                      {formatCurrency(nextRentDue.amount)}
                    </p>
                    <p
                      className={`text-sm ${
                        nextRentDue.status === "overdue" ? "text-red-600" : "text-yellow-600"
                      }`}
                    >
                      Due: {formatDate(nextRentDue.dueDate)}
                    </p>
                    {nextRentDue.lateFee > 0 && (
                      <p className="text-sm text-red-600 mt-1">
                        Late fee: {formatCurrency(nextRentDue.lateFee)}
                      </p>
                    )}
                    <Button className="w-full mt-4 bg-HG-500 hover:bg-HG-600" asChild>
                      <a href="/routes/dashboard/user/payments">Pay Now</a>
                    </Button>
                  </>
                ) : (
                  <p className="text-green-700">Your rent for this month is paid. Thank you!</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="/routes/dashboard/user/payments">
                  <IndianRupee className="w-4 h-4 mr-2" />
                  View Payment History
                </a>
              </Button>

              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="/routes/dashboard/user/support">
                  <FileText className="w-4 h-4 mr-2" />
                  Raise Support Ticket
                </a>
              </Button>

              {!isInNoticePeriod && (
                <Button
                  variant="outline"
                  className="w-full justify-start border-orange-300 text-orange-600 hover:bg-orange-50"
                  onClick={() => setShowNoticeDialog(true)}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Give Notice to Vacate
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Phone className="w-4 h-4 text-HG-500" />
                Need Help?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p className="text-gray-600">
                Contact property owner or support for any issues.
              </p>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <a href="/routes/dashboard/user/support">Contact Support</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Give Notice Dialog */}
      <Dialog open={showNoticeDialog} onOpenChange={setShowNoticeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Give Notice to Vacate</DialogTitle>
            <DialogDescription>
              Submit your notice to vacate the room. Minimum notice period is{" "}
              {allocation.noticePeriodDays} days.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
                <strong>Important:</strong> Once you submit notice, you will be expected to vacate by
                the selected date. Notice can only be cancelled within 48 hours of submission.
              </p>
            </div>

            <div>
              <Label>Expected Vacate Date *</Label>
              <Input
                type="date"
                value={vacateDate}
                onChange={(e) => setVacateDate(e.target.value)}
                min={getMinVacateDate()}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum date: {formatDate(getMinVacateDate())} ({allocation.noticePeriodDays} days
                from today)
              </p>
            </div>

            <div>
              <Label>Reason for Leaving (Optional)</Label>
              <Textarea
                value={vacateReason}
                onChange={(e) => setVacateReason(e.target.value)}
                placeholder="Let us know why you're leaving..."
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoticeDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleGiveNotice}
              disabled={actionLoading || !vacateDate}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {actionLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <LogOut className="w-4 h-4 mr-2" />
              )}
              Submit Notice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Notice Dialog */}
      <Dialog open={showCancelNoticeDialog} onOpenChange={setShowCancelNoticeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Notice</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your notice to vacate?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Notice can only be cancelled within 48 hours of submission.
                If approved, you will continue as an active tenant with your original expected
                move-out date.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelNoticeDialog(false)}>
              Keep Notice
            </Button>
            <Button
              onClick={handleCancelNotice}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Cancel Notice & Stay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}                  