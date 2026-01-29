"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Home,
  Bed,
  Users,
  Calendar,
  MapPin,
  Phone,
  Mail,
  IndianRupee,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Building,
  Wifi,
  Car,
  Utensils,
  Shield,
  LogOut,
  CreditCard,
  Receipt,
  User,
  ChevronRight,
} from "lucide-react";
import { useUserStore } from "@/store/userStore";
import { BlurImage } from "@/components/BlurImage";

interface Allocation {
  _id: string;
  pgName: string;
  roomNumber: string;
  bedNumber: string;
  roomType: string;
  status: string;
  moveInDate: string;
  expectedMoveOutDate: string;
  expectedVacateDate?: string;
  noticeGivenDate?: string;
  noticePeriodDays: number;
  monthlyRent: number;
  securityDeposit: number;
  securityDepositPaid: boolean;
  listingId: {
    _id: string;
    pgName: string;
    location: {
      area: string;
      city: string;
      state: string;
    };
    amenities: string[];
    primaryImage: string;
    detailedRules: any;
    mealTimings: any;
    rentInclusions: any;
  };
  room: {
    roomNumber: string;
    roomType: string;
    floor: number;
    isAC: boolean;
    hasAttachedBathroom: boolean;
    amenities: string[];
  };
  rentHistory: Array<{
    month: string;
    amount: number;
    status: string;
    paidAmount: number;
    paidAt: string;
    dueDate: string;
    lateFee: number;
  }>;
}

interface Roommate {
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

export default function MyRoomPage() {
  const { user } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [allocation, setAllocation] = useState<Allocation | null>(null);
  const [roommates, setRoommates] = useState<Roommate[]>([]);
  const [nextRentDue, setNextRentDue] = useState<NextRentDue | null>(null);
  const [showNoticeDialog, setShowNoticeDialog] = useState(false);
  const [noticeForm, setNoticeForm] = useState({
    expectedVacateDate: "",
    reason: "",
  });
  const [submittingNotice, setSubmittingNotice] = useState(false);

  useEffect(() => {
    fetchAllocation();
  }, []);

  const fetchAllocation = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/user/allocation");
      if (res.data.success) {
        setAllocation(res.data.data?.allocation || null);
        setRoommates(res.data.data?.roommates || []);
        setNextRentDue(res.data.data?.nextRentDue || null);
      }
    } catch (error) {
      console.error("Failed to fetch allocation");
    } finally {
      setLoading(false);
    }
  };

  const handleGiveNotice = async () => {
    if (!noticeForm.expectedVacateDate) {
      toast.error("Please select an expected vacate date");
      return;
    }

    setSubmittingNotice(true);
    try {
      const res = await axios.post("/api/user/allocation", {
        expectedVacateDate: noticeForm.expectedVacateDate,
        reason: noticeForm.reason,
      });

      if (res.data.success) {
        toast.success("Notice period recorded successfully");
        setShowNoticeDialog(false);
        fetchAllocation();
      } else {
        toast.error(res.data.message || "Failed to record notice");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to record notice");
    } finally {
      setSubmittingNotice(false);
    }
  };

  const getMinVacateDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + (allocation?.noticePeriodDays || 30));
    return date.toISOString().split("T")[0];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case "notice_period":
        return (
          <Badge className="bg-orange-100 text-orange-800">
            <Clock className="w-3 h-3 mr-1" />
            Notice Period
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
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
            <CreditCard className="w-3 h-3 mr-1" />
            Partial
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-HG-500"></div>
      </div>
    );
  }

  if (!allocation) {
    return (
      <div className="space-y-6 pb-14">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-poppins">
            My <span className="text-HG-500">Room</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            View your room details and manage your stay
          </p>
        </div>

        <Card className="py-16">
          <CardContent className="text-center">
            <Home className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No Room Allocated
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              You don't have an active room allocation. Once your booking is
              confirmed and you're allocated a room, you'll see the details here.
            </p>
            <Button className="mt-6 bg-HG-500 hover:bg-HG-600">
              Browse PGs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const listing = allocation.listingId;
  const room = allocation.room;
  const daysRemaining = Math.ceil(
    (new Date(allocation.expectedMoveOutDate).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div className="space-y-6 pb-14">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-poppins">
            My <span className="text-HG-500">Room</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            View your room details and manage your stay
          </p>
        </div>
        {getStatusBadge(allocation.status)}
      </div>

      {/* Alert for Notice Period */}
      {allocation.status === "notice_period" && allocation.expectedVacateDate && (
        <Card className="border-2 border-orange-300 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-medium text-orange-800">Notice Period Active</p>
                <p className="text-sm text-orange-700">
                  You have given notice to vacate. Expected move-out date:{" "}
                  <strong>
                    {new Date(allocation.expectedVacateDate).toLocaleDateString()}
                  </strong>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PG & Room Card */}
      <Card className="overflow-hidden">
        <div className="md:flex">
          {/* Image */}
          <div className="md:w-1/3 h-48 md:h-auto relative">
            <BlurImage
              src={listing.primaryImage || "/placeholder.svg"}
              alt={listing.pgName}
              fill
              className="object-cover"
            />
          </div>

          {/* Details */}
          <div className="flex-1 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{listing.pgName}</h2>
                <p className="text-gray-600 flex items-center gap-1 mt-1">
                  <MapPin className="w-4 h-4" />
                  {listing.location.area}, {listing.location.city}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-HG-500">
                  ₹{allocation.monthlyRent.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">/month</p>
              </div>
            </div>

            {/* Room Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Home className="w-4 h-4" />
                  <span className="text-xs">Room</span>
                </div>
                <p className="font-bold text-lg">{room.roomNumber}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Bed className="w-4 h-4" />
                  <span className="text-xs">Bed</span>
                </div>
                <p className="font-bold text-lg">{allocation.bedNumber}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Building className="w-4 h-4" />
                  <span className="text-xs">Floor</span>
                </div>
                <p className="font-bold text-lg">{room.floor}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs">Days Left</span>
                </div>
                <p className="font-bold text-lg">{daysRemaining > 0 ? daysRemaining : 0}</p>
              </div>
            </div>

            {/* Room Features */}
            <div className="flex flex-wrap gap-2 mt-4">
              {room.isAC && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  AC Room
                </Badge>
              )}
              {room.hasAttachedBathroom && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700">
                  Attached Bathroom
                </Badge>
              )}
              <Badge variant="outline" className="bg-gray-50 capitalize">
                {room.roomType}
              </Badge>
            </div>

            {/* Dates */}
            <div className="flex flex-wrap gap-6 mt-6 text-sm">
              <div>
                <span className="text-gray-500">Move-in:</span>
                <span className="ml-2 font-medium">
                  {new Date(allocation.moveInDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Expected Move-out:</span>
                <span className="ml-2 font-medium">
                  {new Date(allocation.expectedMoveOutDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Security Deposit:</span>
                <span className="ml-2 font-medium">
                  ₹{allocation.securityDeposit.toLocaleString()}
                  {allocation.securityDepositPaid ? (
                    <Badge className="ml-2 bg-green-100 text-green-700 text-xs">Paid</Badge>
                  ) : (
                    <Badge className="ml-2 bg-yellow-100 text-yellow-700 text-xs">Pending</Badge>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="rent" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-HG-50">
          <TabsTrigger
            value="rent"
            className="data-[state=active]:bg-HG-500 data-[state=active]:text-white"
          >
            <Receipt className="w-4 h-4 mr-2" />
            Rent History
          </TabsTrigger>
          <TabsTrigger
            value="roommates"
            className="data-[state=active]:bg-HG-500 data-[state=active]:text-white"
          >
            <Users className="w-4 h-4 mr-2" />
            Roommates
          </TabsTrigger>
          <TabsTrigger
            value="amenities"
            className="data-[state=active]:bg-HG-500 data-[state=active]:text-white"
          >
            <Wifi className="w-4 h-4 mr-2" />
            Amenities
          </TabsTrigger>
        </TabsList>

        {/* Rent History */}
        <TabsContent value="rent" className="space-y-4">
          {/* Next Due Card */}
          {nextRentDue && (
            <Card
              className={`border-2 ${
                nextRentDue.status === "overdue"
                  ? "border-red-300 bg-red-50"
                  : "border-yellow-300 bg-yellow-50"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {nextRentDue.status === "overdue" ? "Overdue Rent" : "Next Rent Due"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Due: {new Date(nextRentDue.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      ₹{nextRentDue.amount.toLocaleString()}
                    </p>
                    {nextRentDue.lateFee > 0 && (
                      <p className="text-sm text-red-600">
                        + ₹{nextRentDue.lateFee.toLocaleString()} late fee
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rent History List */}
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {allocation.rentHistory?.map((rent, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {new Date(rent.month).toLocaleDateString("en-IN", {
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-sm text-gray-500">
                        Due: {new Date(rent.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">₹{rent.amount.toLocaleString()}</p>
                      {rent.paidAt && (
                        <p className="text-xs text-gray-500">
                          Paid: {new Date(rent.paidAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div>{getRentStatusBadge(rent.status)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roommates */}
        <TabsContent value="roommates">
          <Card>
            <CardHeader>
              <CardTitle>Your Roommates</CardTitle>
              <CardDescription>
                People sharing the room with you
              </CardDescription>
            </CardHeader>
            <CardContent>
              {roommates.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No roommates yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {roommates.map((roommate, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="w-12 h-12 rounded-full bg-HG-100 flex items-center justify-center">
                        <User className="w-6 h-6 text-HG-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{roommate.name}</p>
                        <p className="text-sm text-gray-500">
                          Bed {roommate.bedNumber}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500">
                        Since{" "}
                        {new Date(roommate.moveInDate).toLocaleDateString("en-IN", {
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Amenities */}
        <TabsContent value="amenities">
          <Card>
            <CardHeader>
              <CardTitle>PG Amenities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {listing.amenities?.map((amenity, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
                  >
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm capitalize">{amenity}</span>
                  </div>
                ))}
              </div>

              {/* Rent Inclusions */}
              {listing.rentInclusions && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Included in Rent</h4>
                  <div className="flex flex-wrap gap-2">
                    {listing.rentInclusions.foodIncluded && (
                      <Badge className="bg-green-100 text-green-800">
                        <Utensils className="w-3 h-3 mr-1" />
                        Food
                      </Badge>
                    )}
                    {listing.rentInclusions.electricityIncluded && (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        ⚡ Electricity
                      </Badge>
                    )}
                    {listing.rentInclusions.maintenanceIncluded && (
                      <Badge className="bg-blue-100 text-blue-800">
                        🔧 Maintenance
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      {allocation.status === "active" && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <Button
                variant="outline"
                className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-50"
                onClick={() => setShowNoticeDialog(true)}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Give Notice to Vacate
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  window.location.href = "/routes/dashboard/user/support";
                }}
              >
                <Shield className="w-4 h-4 mr-2" />
                Raise Support Ticket
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notice Dialog */}
      <Dialog open={showNoticeDialog} onOpenChange={setShowNoticeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Give Notice to Vacate</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Notice Period:</strong> Minimum {allocation.noticePeriodDays} days
                required before vacating.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Expected Vacate Date *</label>
              <Input
                type="date"
                min={getMinVacateDate()}
                value={noticeForm.expectedVacateDate}
                onChange={(e) =>
                  setNoticeForm({ ...noticeForm, expectedVacateDate: e.target.value })
                }
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Reason (Optional)</label>
              <Textarea
                value={noticeForm.reason}
                onChange={(e) =>
                  setNoticeForm({ ...noticeForm, reason: e.target.value })
                }
                placeholder="Why are you leaving? (e.g., job relocation, end of studies)"
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="font-medium mb-2">What happens next?</p>
              <ul className="space-y-1 text-gray-600">
                <li>• Your notice will be recorded</li>
                <li>• Owner will be notified</li>
                <li>• Security deposit will be processed after move-out</li>
                <li>• Room inspection will be scheduled</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoticeDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleGiveNotice}
              disabled={!noticeForm.expectedVacateDate || submittingNotice}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {submittingNotice ? "Submitting..." : "Confirm Notice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}