// app/routes/dashboard/owners/room-allocation/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLoadingStore } from "@/store/loading";
import {
  Building2,
  Search,
  Users,
  Bed,
  UserPlus,
  UserMinus,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Home,
  Phone,
  Mail,
  Calendar,
  IndianRupee,
  Plus,
  Settings,
  RefreshCw,
  ArrowRightLeft,
  CheckCircle,
  XCircle,
  Filter,
  Eye,
} from "lucide-react";

// Types
interface BedData {
  _id: string;
  bedNumber: string;
  bedLabel: string;
  status: "available" | "occupied" | "reserved" | "maintenance";
  tenant?: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  } | null;
  occupiedFrom?: string;
  expectedVacateDate?: string;
  noticeGiven?: boolean;
}

interface RoomData {
  _id: string;
  roomNumber: string;
  roomType: string;
  floor: number;
  status: "available" | "partial" | "full" | "maintenance";
  capacity: number;
  occupiedBeds: number;
  availableBeds: number;
  beds: BedData[];
  monthlyRent: number;
}

interface RoomTypeBreakdown {
  type: string;
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  occupancyRate: number;
  monthlyRent: number;
}

interface ListingStats {
  _id: string;
  pgName: string;
  location: {
    area: string;
    city: string;
  };
  roomTypes: Array<{
    _id: string;
    type: string;
    isAC: boolean;
    monthlyRent: number;
    capacityPerRoom: number;
  }>;
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  upcomingVacancies: number;
  activeTenants: number;
  tenantsInNoticePeriod: number;
  occupancyRate: number;
  roomTypeBreakdown: RoomTypeBreakdown[];
  rooms: RoomData[];
}

interface OverallStats {
  totalListings: number;
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  reservedBeds: number;
  maintenanceBeds: number;
  occupancyRate: number;
  tenantsInNoticePeriod: number;
  upcomingVacancies: number;
  monthlyRevenue: number;
}

interface PendingBooking {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  roomType: string;
  moveInDate: string;
  duration: string;
  status: string;
  amount: number;
  securityDeposit: number;
  listingId: {
    _id: string;
    pgName: string;
  };
}

export default function RoomAllocationPage() {
  // State
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [listingsData, setListingsData] = useState<ListingStats[]>([]);
  const [pendingBookings, setPendingBookings] = useState<PendingBooking[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedListing, setSelectedListing] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedListings, setExpandedListings] = useState<Set<string>>(new Set());
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set());

  // Selected items for actions
  const [selectedRoom, setSelectedRoom] = useState<RoomData | null>(null);
  const [selectedBed, setSelectedBed] = useState<BedData | null>(null);
  const [selectedListingForAction, setSelectedListingForAction] = useState<ListingStats | null>(null);

  // Dialog states
  const [showAllocationDialog, setShowAllocationDialog] = useState(false);
  const [showVacateDialog, setShowVacateDialog] = useState(false);
  const [showNoticeDialog, setShowNoticeDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showBookingDetails, setShowBookingDetails] = useState(false);

  // Form states
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [moveInDate, setMoveInDate] = useState("");
  const [vacateDate, setVacateDate] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [vacateNotes, setVacateNotes] = useState("");
  const [noticeVacateDate, setNoticeVacateDate] = useState("");
  const [noticeReason, setNoticeReason] = useState("");
  const [transferRoomId, setTransferRoomId] = useState("");
  const [transferBedNumber, setTransferBedNumber] = useState("");

  // Deductions for vacate
  const [deductions, setDeductions] = useState({
    pendingDues: 0,
    damages: 0,
    otherCharges: 0,
    notes: "",
  });

  const [actionLoading, setActionLoading] = useState(false);
  const { containerLoading, setContainerLoading } = useLoadingStore();

  // Fetch data
  const fetchOccupancyData = useCallback(async () => {
    setContainerLoading("roomAllocation", true);
    try {
      const res = await axios.get("/api/owner/occupancy-dashboard");
      if (res.data.success) {
        setOverallStats(res.data.data.overall);
        setListingsData(res.data.data.listings);
        
        // Auto-expand first listing if only one
        if (res.data.data.listings.length === 1) {
          setExpandedListings(new Set([res.data.data.listings[0]._id]));
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch occupancy data");
    } finally {
      setContainerLoading("roomAllocation", false);
    }
  }, [setContainerLoading]);

  const fetchPendingBookings = useCallback(async () => {
    try {
      const res = await axios.get("/api/booking/owner-requests?status=confirmed");
      if (res.data.success) {
        setPendingBookings(res.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch pending bookings");
    }
  }, []);

  useEffect(() => {
    fetchOccupancyData();
    fetchPendingBookings();
  }, [fetchOccupancyData, fetchPendingBookings]);

  // Toggle handlers
  const toggleListingExpand = (listingId: string) => {
    setExpandedListings((prev) => {
      const next = new Set(prev);
      if (next.has(listingId)) {
        next.delete(listingId);
      } else {
        next.add(listingId);
      }
      return next;
    });
  };

  const toggleRoomExpand = (roomId: string) => {
    setExpandedRooms((prev) => {
      const next = new Set(prev);
      if (next.has(roomId)) {
        next.delete(roomId);
      } else {
        next.add(roomId);
      }
      return next;
    });
  };

  // Action handlers
  const handleBedClick = (listing: ListingStats, room: RoomData, bed: BedData) => {
    setSelectedListingForAction(listing);
    setSelectedRoom(room);
    setSelectedBed(bed);

    if (bed.status === "available") {
      // Filter bookings for this listing and room type
      const matchingBookings = pendingBookings.filter(
        (b) => b.listingId._id === listing._id && b.roomType.toLowerCase() === room.roomType.toLowerCase()
      );
      
      if (matchingBookings.length > 0) {
        setShowAllocationDialog(true);
      } else {
        toast.info(`No confirmed bookings for ${room.roomType} rooms at ${listing.pgName}`);
      }
    } else if (bed.status === "occupied") {
      setRefundAmount("");
      setVacateDate(new Date().toISOString().split("T")[0]);
      setVacateNotes("");
      setDeductions({ pendingDues: 0, damages: 0, otherCharges: 0, notes: "" });
      setShowVacateDialog(true);
    }
  };

  const handleAllocateTenant = async () => {
    if (!selectedRoom || !selectedBed || !selectedBookingId) {
      toast.error("Please select a booking to allocate");
      return;
    }

    setActionLoading(true);
    try {
      const payload: any = {
        bookingId: selectedBookingId,
        bedNumber: selectedBed.bedNumber,
      };

      if (moveInDate) {
        payload.moveInDate = moveInDate;
      }

      const res = await axios.post(`/api/owner/rooms/${selectedRoom._id}/allocate`, payload);

      if (res.data.success) {
        toast.success("Tenant allocated successfully!");
        closeAllDialogs();
        fetchOccupancyData();
        fetchPendingBookings();
      } else {
        toast.error(res.data.message || "Failed to allocate tenant");
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Failed to allocate tenant";
      const errors = error.response?.data?.errors;
      
      if (errors && errors.length > 0) {
        errors.forEach((err: string) => toast.error(err));
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleVacateTenant = async () => {
    if (!selectedRoom || !selectedBed) {
      toast.error("Please select a bed to vacate");
      return;
    }

    setActionLoading(true);
    try {
      const payload: any = {
        bedNumber: selectedBed.bedNumber,
        actualMoveOutDate: vacateDate || new Date().toISOString(),
        notes: vacateNotes,
      };

      // Add refund amount if specified
      if (refundAmount) {
        payload.refundAmount = parseFloat(refundAmount);
      }

      // Add deductions if any
      if (deductions.pendingDues || deductions.damages || deductions.otherCharges) {
        payload.deductions = deductions;
      }

      const res = await axios.post(`/api/owner/rooms/${selectedRoom._id}/vacate`, payload);

      if (res.data.success) {
        toast.success("Tenant vacated successfully!");
        if (res.data.data.refundAmount > 0) {
          toast.info(`Security deposit refund: ₹${res.data.data.refundAmount.toLocaleString()}`);
        }
        closeAllDialogs();
        fetchOccupancyData();
      } else {
        toast.error(res.data.message || "Failed to vacate tenant");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to vacate tenant");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordNotice = async () => {
    if (!selectedRoom || !selectedBed || !noticeVacateDate) {
      toast.error("Please enter expected vacate date");
      return;
    }

    setActionLoading(true);
    try {
      const res = await axios.put(`/api/owner/rooms/${selectedRoom._id}/vacate`, {
        bedNumber: selectedBed.bedNumber,
        expectedVacateDate: noticeVacateDate,
        reason: noticeReason,
      });

      if (res.data.success) {
        toast.success("Notice period recorded!");
        closeAllDialogs();
        fetchOccupancyData();
      } else {
        toast.error(res.data.message || "Failed to record notice");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to record notice");
    } finally {
      setActionLoading(false);
    }
  };

  const closeAllDialogs = () => {
    setShowAllocationDialog(false);
    setShowVacateDialog(false);
    setShowNoticeDialog(false);
    setShowTransferDialog(false);
    setShowBookingDetails(false);
    setSelectedRoom(null);
    setSelectedBed(null);
    setSelectedListingForAction(null);
    setSelectedBookingId("");
    setMoveInDate("");
    setVacateDate("");
    setRefundAmount("");
    setVacateNotes("");
    setNoticeVacateDate("");
    setNoticeReason("");
    setDeductions({ pendingDues: 0, damages: 0, otherCharges: 0, notes: "" });
  };

  // Get filtered bookings for selected room
  const getMatchingBookings = () => {
    if (!selectedListingForAction || !selectedRoom) return [];
    
    return pendingBookings.filter(
      (b) =>
        b.listingId._id === selectedListingForAction._id &&
        b.roomType.toLowerCase() === selectedRoom.roomType.toLowerCase()
    );
  };

  // Filter listings
  const filteredListings = listingsData.filter((listing) => {
    if (selectedListing !== "all" && listing._id !== selectedListing) return false;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        listing.pgName.toLowerCase().includes(query) ||
        listing.rooms.some((room) => room.roomNumber.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }
    
    return true;
  });

  // Status helpers
  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800 border-green-300";
      case "occupied":
        return "bg-red-100 text-red-800 border-red-300";
      case "partial":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "full":
        return "bg-red-100 text-red-800 border-red-300";
      case "reserved":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "maintenance":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-gray-100 text-gray-600 border-gray-300";
    }
  };

  const getBedIcon = (status: string) => {
    switch (status) {
      case "available":
        return <Bed className="w-5 h-5 text-green-600" />;
      case "occupied":
        return <Users className="w-5 h-5 text-red-600" />;
      case "reserved":
        return <Clock className="w-5 h-5 text-blue-600" />;
      case "maintenance":
        return <Settings className="w-5 h-5 text-gray-600" />;
      default:
        return <Bed className="w-5 h-5 text-gray-400" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Loading state
  if (containerLoading.roomAllocation) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-HG-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading allocation data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-14">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight font-poppins">
            Room <span className="text-HG-500">Allocation</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-lg font-inter mt-1">
            Allocate rooms to tenants and manage occupancy
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            fetchOccupancyData();
            fetchPendingBookings();
          }}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Overall Stats Cards */}
      {overallStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="text-xs text-blue-600 font-medium">Properties</p>
                  <p className="text-xl font-bold text-blue-800">
                    {overallStats.totalListings}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Home className="w-6 h-6 text-purple-600" />
                <div>
                  <p className="text-xs text-purple-600 font-medium">Total Rooms</p>
                  <p className="text-xl font-bold text-purple-800">
                    {overallStats.totalRooms}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Bed className="w-6 h-6 text-green-600" />
                <div>
                  <p className="text-xs text-green-600 font-medium">Available</p>
                  <p className="text-xl font-bold text-green-800">
                    {overallStats.availableBeds}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="w-6 h-6 text-red-600" />
                <div>
                  <p className="text-xs text-red-600 font-medium">Occupied</p>
                  <p className="text-xl font-bold text-red-800">
                    {overallStats.occupiedBeds}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-HG-50 to-HG-100 border-HG-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-HG-500 text-white flex items-center justify-center text-xs font-bold">
                  %
                </div>
                <div>
                  <p className="text-xs text-HG-600 font-medium">Occupancy</p>
                  <p className="text-xl font-bold text-HG-800">
                    {overallStats.occupancyRate}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
                <div>
                  <p className="text-xs text-orange-600 font-medium">Vacating</p>
                  <p className="text-xl font-bold text-orange-800">
                    {overallStats.upcomingVacancies}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pending Bookings Alert */}
      {pendingBookings.length > 0 && (
        <Card className="border-2 border-yellow-300 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-200 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-yellow-700" />
                </div>
                <div>
                  <p className="font-medium text-yellow-800">
                    {pendingBookings.length} Confirmed Booking(s) Awaiting Room Allocation
                  </p>
                  <p className="text-sm text-yellow-700">
                    Click on an available bed to allocate a tenant
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBookingDetails(true)}
                className="border-yellow-400 text-yellow-700 hover:bg-yellow-100"
              >
                <Eye className="w-4 h-4 mr-1" />
                View All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by property or room number..."
            className="pl-10"
          />
        </div>
        
        <Select value={selectedListing} onValueChange={setSelectedListing}>
          <SelectTrigger className="w-full md:w-[200px]">
            <Building2 className="w-4 h-4 mr-2" />
            <SelectValue placeholder="All Properties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Properties</SelectItem>
            {listingsData.map((listing) => (
              <SelectItem key={listing._id} value={listing._id}>
                {listing.pgName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[150px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="available">Has Available</SelectItem>
            <SelectItem value="full">Full</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Listings with Rooms */}
      {filteredListings.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600">No properties found</h3>
            <p className="text-gray-500 mt-2">
              {searchQuery
                ? "Try adjusting your search"
                : "Create rooms for your properties to start allocating tenants"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredListings.map((listing) => (
            <Card key={listing._id} className="overflow-hidden">
              {/* Listing Header */}
              <div
                className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => toggleListingExpand(listing._id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {expandedListings.has(listing._id) ? (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    )}
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{listing.pgName}</h3>
                      <p className="text-sm text-gray-500">
                        {listing.location?.area}, {listing.location?.city}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-center hidden md:block">
                      <p className="text-xs text-gray-500">Rooms</p>
                      <p className="font-bold">{listing.totalRooms}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Occupancy</p>
                      <p className="font-bold text-HG-600">{listing.occupancyRate}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Available</p>
                      <p className="font-bold text-green-600">{listing.availableBeds}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Occupied</p>
                      <p className="font-bold text-red-600">{listing.occupiedBeds}</p>
                    </div>
                    {listing.upcomingVacancies > 0 && (
                      <Badge className="bg-orange-100 text-orange-800 border-orange-300 hidden md:flex">
                        <Clock className="w-3 h-3 mr-1" />
                        {listing.upcomingVacancies} vacating
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Room Type Breakdown */}
                {expandedListings.has(listing._id) && listing.roomTypeBreakdown.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex flex-wrap gap-4">
                      {listing.roomTypeBreakdown.map((rt) => (
                        <div
                          key={rt.type}
                          className="flex items-center gap-3 px-3 py-2 bg-white rounded-lg border"
                        >
                          <div>
                            <p className="text-sm font-medium">{rt.type}</p>
                            <p className="text-xs text-gray-500">
                              ₹{rt.monthlyRent?.toLocaleString()}/mo
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-green-600 font-medium">{rt.availableBeds}</span>
                            <span className="text-gray-400">/</span>
                            <span>{rt.totalBeds}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Rooms Grid */}
              {expandedListings.has(listing._id) && (
                <CardContent className="p-4">
                  {listing.rooms.length === 0 ? (
                    <div className="text-center py-8">
                      <Bed className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No rooms created yet</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        asChild
                      >
                        <a href="/routes/dashboard/owners/room-management">
                          <Plus className="w-4 h-4 mr-1" />
                          Create Rooms
                        </a>
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {listing.rooms
                        .filter((room) => {
                          if (statusFilter === "available") return room.availableBeds > 0;
                          if (statusFilter === "full") return room.status === "full";
                          return true;
                        })
                        .map((room) => (
                          <div
                            key={room._id}
                            className={`border-2 rounded-xl p-4 transition-all hover:shadow-md ${getStatusColor(
                              room.status
                            )}`}
                          >
                            {/* Room Header */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Home className="w-5 h-5" />
                                <div>
                                  <p className="font-bold">Room {room.roomNumber}</p>
                                  <p className="text-xs capitalize">{room.roomType}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge variant="outline" className={getStatusColor(room.status)}>
                                  {room.status}
                                </Badge>
                                <p className="text-xs mt-1">
                                  {room.occupiedBeds}/{room.capacity} beds
                                </p>
                              </div>
                            </div>

                            {/* Beds Grid */}
                            <div className="grid grid-cols-2 gap-2">
                              {room.beds.map((bed) => (
                                <div
                                  key={bed._id}
                                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                                    bed.status === "available"
                                      ? "bg-green-50 border-green-200 hover:border-green-400"
                                      : bed.status === "occupied"
                                      ? "bg-red-50 border-red-200 hover:border-red-400"
                                      : bed.status === "maintenance"
                                      ? "bg-gray-50 border-gray-200"
                                      : "bg-blue-50 border-blue-200"
                                  }`}
                                  onClick={() => handleBedClick(listing, room, bed)}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    {getBedIcon(bed.status)}
                                    <span className="text-xs font-medium">
                                      Bed {bed.bedNumber}
                                    </span>
                                  </div>
                                  
                                  {bed.tenant && (
                                    <div className="mt-2 text-xs space-y-1">
                                      <p className="font-medium truncate">{bed.tenant.name}</p>
                                      {bed.noticeGiven && (
                                        <Badge className="text-[10px] bg-orange-100 text-orange-800 px-1.5">
                                          <Clock className="w-2 h-2 mr-0.5" />
                                          Vacating
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                  
                                  {bed.status === "available" && pendingBookings.some(
                                    (b) =>
                                      b.listingId._id === listing._id &&
                                      b.roomType.toLowerCase() === room.roomType.toLowerCase()
                                  ) && (
                                    <div className="mt-2">
                                      <Badge className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5">
                                        <UserPlus className="w-2 h-2 mr-0.5" />
                                        Allocate
                                      </Badge>
                                    </div>
                                  )}

                                  {bed.status === "maintenance" && (
                                    <p className="text-[10px] text-gray-500 mt-1">Under maintenance</p>
                                  )}
                                </div>
                              ))}
                            </div>

                            {/* Room Footer */}
                            <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-gray-600">
                              <span className="flex items-center gap-1">
                                <IndianRupee className="w-3 h-3" />
                                {room.monthlyRent?.toLocaleString()}/mo
                              </span>
                              <span>Floor {room.floor}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Allocation Dialog */}
      <Dialog open={showAllocationDialog} onOpenChange={setShowAllocationDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Allocate Tenant to Bed</DialogTitle>
            <DialogDescription>
              Assign a confirmed booking to this bed
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Room Info */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Property:</span>
                  <p className="font-medium">{selectedListingForAction?.pgName}</p>
                </div>
                <div>
                  <span className="text-gray-500">Room:</span>
                  <p className="font-medium">
                    {selectedRoom?.roomNumber} ({selectedRoom?.roomType})
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Bed:</span>
                  <p className="font-medium">{selectedBed?.bedNumber}</p>
                </div>
                <div>
                  <span className="text-gray-500">Rent:</span>
                  <p className="font-medium">₹{selectedRoom?.monthlyRent?.toLocaleString()}/month</p>
                </div>
              </div>
            </div>

            {/* Booking Selection */}
            <div>
              <Label>Select Confirmed Booking *</Label>
              <Select value={selectedBookingId} onValueChange={setSelectedBookingId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a booking..." />
                </SelectTrigger>
                <SelectContent>
                  {getMatchingBookings().map((booking) => (
                    <SelectItem key={booking._id} value={booking._id}>
                      <div className="flex flex-col">
                        <span>{booking.fullName}</span>
                        <span className="text-xs text-gray-500">
                          Move-in: {formatDate(booking.moveInDate)} • {booking.duration}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {getMatchingBookings().length === 0 && (
                <p className="text-sm text-yellow-600 mt-2 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  No confirmed bookings for {selectedRoom?.roomType} rooms
                </p>
              )}
            </div>

            {/* Optional Move-in Date Override */}
            <div>
              <Label>Move-in Date (Optional Override)</Label>
              <Input
                type="date"
                value={moveInDate}
                onChange={(e) => setMoveInDate(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to use bookings move-in date
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeAllDialogs}>
              Cancel
            </Button>
            <Button
              onClick={handleAllocateTenant}
              disabled={!selectedBookingId || actionLoading}
              className="bg-HG-500 hover:bg-HG-600"
            >
              {actionLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              Allocate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vacate Dialog */}
      <Dialog open={showVacateDialog} onOpenChange={setShowVacateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Vacate Tenant</DialogTitle>
            <DialogDescription>
              Process tenant move-out and security deposit refund
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Tenant Info */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Room:</span>
                  <p className="font-medium">{selectedRoom?.roomNumber}</p>
                </div>
                <div>
                  <span className="text-gray-500">Bed:</span>
                  <p className="font-medium">{selectedBed?.bedNumber}</p>
                </div>
                {selectedBed?.tenant && (
                  <>
                    <div className="col-span-2">
                      <span className="text-gray-500">Tenant:</span>
                      <p className="font-medium">{selectedBed.tenant.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Phone:</span>
                      <p className="font-medium">{selectedBed.tenant.phone}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <p className="font-medium text-xs">{selectedBed.tenant.email}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Move-out Date */}
            <div>
              <Label>Move-out Date</Label>
              <Input
                type="date"
                value={vacateDate}
                onChange={(e) => setVacateDate(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Deductions */}
            <div className="space-y-3">
              <Label>Deductions (Optional)</Label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Pending Dues</Label>
                  <Input
                    type="number"
                    value={deductions.pendingDues || ""}
                    onChange={(e) =>
                      setDeductions((prev) => ({
                        ...prev,
                        pendingDues: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Damages</Label>
                  <Input
                    type="number"
                    value={deductions.damages || ""}
                    onChange={(e) =>
                      setDeductions((prev) => ({
                        ...prev,
                        damages: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Other</Label>
                  <Input
                    type="number"
                    value={deductions.otherCharges || ""}
                    onChange={(e) =>
                      setDeductions((prev) => ({
                        ...prev,
                        otherCharges: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Refund Amount */}
            <div>
              <Label>Security Deposit Refund Amount (₹)</Label>
              <Input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="Auto-calculated if left empty"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to auto-calculate based on deductions
              </p>
            </div>

            {/* Notes */}
            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                value={vacateNotes}
                onChange={(e) => setVacateNotes(e.target.value)}
                placeholder="Any notes about the move-out..."
                className="mt-1"
                rows={2}
              />
            </div>

            {/* Record Notice Instead */}
            {!selectedBed?.noticeGiven && (
              <Button
                variant="outline"
                className="w-full border-orange-300 text-orange-600 hover:bg-orange-50"
                onClick={() => {
                  setShowVacateDialog(false);
                  setShowNoticeDialog(true);
                }}
              >
                <Clock className="w-4 h-4 mr-2" />
                Record Notice Period Instead
              </Button>
            )}

            {/* Warning */}
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This will mark the tenant as vacated and free up the
                bed for new allocation.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeAllDialogs}>
              Cancel
            </Button>
            <Button
              onClick={handleVacateTenant}
              disabled={actionLoading}
              variant="destructive"
            >
              {actionLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <UserMinus className="w-4 h-4 mr-2" />
              )}
              Process Move-out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notice Period Dialog */}
      <Dialog open={showNoticeDialog} onOpenChange={setShowNoticeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Notice Period</DialogTitle>
            <DialogDescription>
              Record that the tenant has given notice to vacate
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm">
                <strong>Room:</strong> {selectedRoom?.roomNumber}, Bed {selectedBed?.bedNumber}
              </p>
              {selectedBed?.tenant && (
                <p className="text-sm">
                  <strong>Tenant:</strong> {selectedBed.tenant.name}
                </p>
              )}
            </div>

            <div>
              <Label>Expected Vacate Date *</Label>
              <Input
                type="date"
                value={noticeVacateDate}
                onChange={(e) => setNoticeVacateDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Reason (Optional)</Label>
              <Textarea
                value={noticeReason}
                onChange={(e) => setNoticeReason(e.target.value)}
                placeholder="Reason for leaving..."
                className="mt-1"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeAllDialogs}>
              Cancel
            </Button>
            <Button
              onClick={handleRecordNotice}
              disabled={!noticeVacateDate || actionLoading}
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

      {/* Pending Bookings Details Dialog */}
      <Dialog open={showBookingDetails} onOpenChange={setShowBookingDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pending Booking Allocations</DialogTitle>
            <DialogDescription>
              Confirmed bookings awaiting room allocation
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            {pendingBookings.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-600">All bookings have been allocated!</p>
              </div>
            ) : (
              pendingBookings.map((booking) => (
                <div
                  key={booking._id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{booking.fullName}</h4>
                      <p className="text-sm text-gray-500">{booking.listingId.pgName}</p>
                    </div>
                    <Badge>{booking.roomType}</Badge>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Phone className="w-3 h-3" />
                      {booking.phoneNumber}
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{booking.email}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Calendar className="w-3 h-3" />
                      {formatDate(booking.moveInDate)}
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <IndianRupee className="w-3 h-3" />
                      {booking.amount.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}