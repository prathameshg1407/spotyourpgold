"use client";

import { useEffect, useState } from "react";
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
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Eye,
} from "lucide-react";
import { useLoadingStore } from "@/store/loading";

interface Bed {
  bedNumber: string;
  status: "available" | "occupied" | "reserved" | "maintenance";
  tenant?: {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
  } | null;
  occupiedFrom?: string;
  expectedVacateDate?: string;
  noticeGiven?: boolean;
}

interface Room {
  _id: string;
  roomNumber: string;
  roomType: string;
  floor: number;
  status: "available" | "partial" | "full" | "maintenance";
  capacity: number;
  occupiedBeds: number;
  availableBeds: number;
  beds: Bed[];
  monthlyRent: number;
}

interface ListingStats {
  _id: string;
  pgName: string;
  location: {
    area: string;
    city: string;
  };
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  upcomingVacancies: number;
  occupancyRate: number;
  rooms: Room[];
  roomTypeBreakdown: Array<{
    type: string;
    totalRooms: number;
    totalBeds: number;
    occupiedBeds: number;
    availableBeds: number;
    occupancyRate: number;
  }>;
}

interface OverallStats {
  totalListings: number;
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  occupancyRate: number;
  tenantsInNoticePeriod: number;
  upcomingVacancies: number;
}

interface PendingBooking {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  roomType: string;
  moveInDate: string;
  status: string;
}

export default function RoomAllocationPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedListing, setSelectedListing] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [listingsData, setListingsData] = useState<ListingStats[]>([]);
  const [expandedListings, setExpandedListings] = useState<Set<string>>(new Set());
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set());
  const [pendingBookings, setPendingBookings] = useState<PendingBooking[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [showAllocationDialog, setShowAllocationDialog] = useState(false);
  const [showVacateDialog, setShowVacateDialog] = useState(false);
  const [showCreateRoomDialog, setShowCreateRoomDialog] = useState(false);
  const [selectedBookingForAllocation, setSelectedBookingForAllocation] = useState<string>("");
  const [vacateDate, setVacateDate] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [vacateNotes, setVacateNotes] = useState("");
  const { containerLoading, setContainerLoading } = useLoadingStore();

  // Create room form state
  const [createRoomForm, setCreateRoomForm] = useState({
    listingId: "",
    roomType: "",
    roomNumber: "",
    floor: 0,
    capacity: 1,
    isAC: false,
    hasAttachedBathroom: false,
    monthlyRent: 0,
    securityDeposit: 0,
  });

  useEffect(() => {
    fetchOccupancyData();
    fetchPendingBookings();
  }, []);

  const fetchOccupancyData = async () => {
    setContainerLoading("roomAllocation", true);
    try {
      const res = await axios.get("/api/owner/occupancy-dashboard");
      if (res.data.success) {
        setOverallStats(res.data.data.overall);
        setListingsData(res.data.data.listings);
        // Auto-expand first listing
        if (res.data.data.listings.length > 0) {
          setExpandedListings(new Set([res.data.data.listings[0]._id]));
        }
      }
    } catch (error) {
      toast.error("Failed to fetch occupancy data");
    } finally {
      setContainerLoading("roomAllocation", false);
    }
  };

  const fetchPendingBookings = async () => {
    try {
      const res = await axios.get("/api/booking/owner-requests?status=confirmed");
      if (res.data.success) {
        setPendingBookings(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch pending bookings");
    }
  };

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

  const handleAllocateTenant = async () => {
    if (!selectedRoom || !selectedBed || !selectedBookingForAllocation) {
      toast.error("Please select a booking to allocate");
      return;
    }

    const loadingToast = toast.loading("Allocating tenant...");
    try {
      const res = await axios.post(`/api/owner/rooms/${selectedRoom._id}/allocate`, {
        bookingId: selectedBookingForAllocation,
        bedNumber: selectedBed.bedNumber,
      });

      if (res.data.success) {
        toast.dismiss(loadingToast);
        toast.success("Tenant allocated successfully!");
        setShowAllocationDialog(false);
        setSelectedRoom(null);
        setSelectedBed(null);
        setSelectedBookingForAllocation("");
        fetchOccupancyData();
        fetchPendingBookings();
      } else {
        toast.dismiss(loadingToast);
        toast.error(res.data.message || "Failed to allocate tenant");
      }
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.response?.data?.message || "Failed to allocate tenant");
    }
  };

  const handleVacateTenant = async () => {
    if (!selectedRoom || !selectedBed) {
      toast.error("Please select a bed to vacate");
      return;
    }

    const loadingToast = toast.loading("Processing move-out...");
    try {
      const res = await axios.post(`/api/owner/rooms/${selectedRoom._id}/vacate`, {
        bedNumber: selectedBed.bedNumber,
        actualMoveOutDate: vacateDate || new Date().toISOString(),
        refundAmount: parseFloat(refundAmount) || 0,
        notes: vacateNotes,
      });

      if (res.data.success) {
        toast.dismiss(loadingToast);
        toast.success("Tenant vacated successfully!");
        setShowVacateDialog(false);
        setSelectedRoom(null);
        setSelectedBed(null);
        setVacateDate("");
        setRefundAmount("");
        setVacateNotes("");
        fetchOccupancyData();
      } else {
        toast.dismiss(loadingToast);
        toast.error(res.data.message || "Failed to vacate tenant");
      }
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.response?.data?.message || "Failed to vacate tenant");
    }
  };

  const handleRecordNotice = async (room: Room, bed: Bed) => {
    const expectedDate = prompt("Enter expected vacate date (YYYY-MM-DD):");
    if (!expectedDate) return;

    const loadingToast = toast.loading("Recording notice...");
    try {
      const res = await axios.put(`/api/owner/rooms/${room._id}/vacate`, {
        bedNumber: bed.bedNumber,
        expectedVacateDate: expectedDate,
      });

      if (res.data.success) {
        toast.dismiss(loadingToast);
        toast.success("Notice period recorded!");
        fetchOccupancyData();
      } else {
        toast.dismiss(loadingToast);
        toast.error(res.data.message || "Failed to record notice");
      }
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.response?.data?.message || "Failed to record notice");
    }
  };

  const handleCreateRoom = async () => {
    if (!createRoomForm.listingId || !createRoomForm.roomNumber || !createRoomForm.roomType) {
      toast.error("Please fill all required fields");
      return;
    }

    const loadingToast = toast.loading("Creating room...");
    try {
      const res = await axios.post("/api/owner/rooms", {
        listingId: createRoomForm.listingId,
        roomType: createRoomForm.roomType,
        rooms: [
          {
            roomNumber: createRoomForm.roomNumber,
            floor: createRoomForm.floor,
            capacity: createRoomForm.capacity,
            isAC: createRoomForm.isAC,
            hasAttachedBathroom: createRoomForm.hasAttachedBathroom,
            monthlyRent: createRoomForm.monthlyRent,
            securityDeposit: createRoomForm.securityDeposit,
          },
        ],
      });

      if (res.data.success) {
        toast.dismiss(loadingToast);
        toast.success("Room created successfully!");
        setShowCreateRoomDialog(false);
        setCreateRoomForm({
          listingId: "",
          roomType: "",
          roomNumber: "",
          floor: 0,
          capacity: 1,
          isAC: false,
          hasAttachedBathroom: false,
          monthlyRent: 0,
          securityDeposit: 0,
        });
        fetchOccupancyData();
      } else {
        toast.dismiss(loadingToast);
        toast.error(res.data.message || "Failed to create room");
      }
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.response?.data?.message || "Failed to create room");
    }
  };

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

  const filteredListings = listingsData.filter((listing) => {
    if (selectedListing !== "all" && listing._id !== selectedListing) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        listing.pgName.toLowerCase().includes(query) ||
        listing.rooms.some((room) => room.roomNumber.toLowerCase().includes(query))
      );
    }
    return true;
  });

  if (containerLoading.roomAllocation) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-HG-500"></div>
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
            Manage room allocations and track occupancy across all properties
          </p>
        </div>
        <Button
          onClick={() => setShowCreateRoomDialog(true)}
          className="bg-HG-500 hover:bg-HG-600 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Room
        </Button>
      </div>

      {/* Overall Stats Cards */}
      {overallStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Building2 className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-xs text-blue-600 font-medium">Properties</p>
                  <p className="text-2xl font-bold text-blue-800">
                    {overallStats.totalListings}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Home className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-xs text-purple-600 font-medium">Total Rooms</p>
                  <p className="text-2xl font-bold text-purple-800">
                    {overallStats.totalRooms}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Bed className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-xs text-green-600 font-medium">Available Beds</p>
                  <p className="text-2xl font-bold text-green-800">
                    {overallStats.availableBeds}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-red-600" />
                <div>
                  <p className="text-xs text-red-600 font-medium">Occupied Beds</p>
                  <p className="text-2xl font-bold text-red-800">
                    {overallStats.occupiedBeds}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-HG-50 to-HG-100 border-HG-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-HG-500 text-white flex items-center justify-center text-sm font-bold">
                  %
                </div>
                <div>
                  <p className="text-xs text-HG-600 font-medium">Occupancy Rate</p>
                  <p className="text-2xl font-bold text-HG-800">
                    {overallStats.occupancyRate}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="text-xs text-orange-600 font-medium">Vacating Soon</p>
                  <p className="text-2xl font-bold text-orange-800">
                    {overallStats.upcomingVacancies}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search rooms..."
            className="pl-10"
          />
        </div>
        <Select value={selectedListing} onValueChange={setSelectedListing}>
          <SelectTrigger className="w-full md:w-[200px]">
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
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="full">Full</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Pending Bookings Alert */}
      {pendingBookings.length > 0 && (
        <Card className="border-2 border-yellow-300 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">
                  {pendingBookings.length} Confirmed Booking(s) Awaiting Room Allocation
                </p>
                <p className="text-sm text-yellow-700">
                  Click on an available bed to allocate a tenant
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Listings with Rooms */}
      {filteredListings.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600">No rooms found</h3>
            <p className="text-gray-500 mt-2">
              Create rooms for your properties to start managing allocations
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
                  <div className="flex items-center gap-4">
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
                      <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                        {listing.upcomingVacancies} vacating soon
                      </Badge>
                    )}
                  </div>
                </div>
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
                        onClick={() => {
                          setCreateRoomForm((prev) => ({ ...prev, listingId: listing._id }));
                          setShowCreateRoomDialog(true);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Create Rooms
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {listing.rooms.map((room) => (
                        <div
                          key={room._id}
                          className={`border-2 rounded-xl p-4 transition-all ${getStatusColor(
                            room.status
                          )}`}
                        >
                          {/* Room Header */}
                          <div
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => toggleRoomExpand(room._id)}
                          >
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
                          <div className="mt-4 grid grid-cols-2 gap-2">
                            {room.beds.map((bed) => (
                              <div
                                key={bed.bedNumber}
                                className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                                  bed.status === "available"
                                    ? "bg-green-50 border-green-200 hover:border-green-400"
                                    : bed.status === "occupied"
                                    ? "bg-red-50 border-red-200"
                                    : "bg-gray-50 border-gray-200"
                                }`}
                                onClick={() => {
                                  setSelectedRoom(room);
                                  setSelectedBed(bed);
                                  if (bed.status === "available") {
                                    setShowAllocationDialog(true);
                                  } else if (bed.status === "occupied") {
                                    setShowVacateDialog(true);
                                  }
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  {getBedIcon(bed.status)}
                                  <span className="text-xs font-medium">
                                    Bed {bed.bedNumber}
                                  </span>
                                </div>
                                {bed.tenant && (
                                  <div className="mt-2 text-xs">
                                    <p className="font-medium truncate">{bed.tenant.fullName}</p>
                                    {bed.noticeGiven && (
                                      <p className="text-orange-600 flex items-center gap-1 mt-1">
                                        <Clock className="w-3 h-3" />
                                        Vacating
                                      </p>
                                    )}
                                  </div>
                                )}
                                {bed.status === "available" && pendingBookings.length > 0 && (
                                  <div className="mt-2">
                                    <Badge className="text-[10px] bg-yellow-100 text-yellow-800">
                                      Click to allocate
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Room Footer */}
                          <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs">
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
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm">
                <strong>Room:</strong> {selectedRoom?.roomNumber}
              </p>
              <p className="text-sm">
                <strong>Bed:</strong> {selectedBed?.bedNumber}
              </p>
              <p className="text-sm">
                <strong>Type:</strong> {selectedRoom?.roomType}
              </p>
              <p className="text-sm">
                <strong>Rent:</strong> ₹{selectedRoom?.monthlyRent?.toLocaleString()}/month
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Select Confirmed Booking</label>
              <Select
                value={selectedBookingForAllocation}
                onValueChange={setSelectedBookingForAllocation}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a booking..." />
                </SelectTrigger>
                <SelectContent>
                  {pendingBookings
                    .filter((b) => b.roomType === selectedRoom?.roomType)
                    .map((booking) => (
                      <SelectItem key={booking._id} value={booking._id}>
                        {booking.fullName} - {booking.roomType} (
                        {new Date(booking.moveInDate).toLocaleDateString()})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {pendingBookings.filter((b) => b.roomType === selectedRoom?.roomType).length ===
                0 && (
                <p className="text-sm text-gray-500 mt-2">
                  No confirmed bookings for {selectedRoom?.roomType} room type
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAllocationDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAllocateTenant}
              disabled={!selectedBookingForAllocation}
              className="bg-HG-500 hover:bg-HG-600"
            >
              <UserPlus className="w-4 h-4 mr-2" />
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
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm">
                <strong>Room:</strong> {selectedRoom?.roomNumber}
              </p>
              <p className="text-sm">
                <strong>Bed:</strong> {selectedBed?.bedNumber}
              </p>
              {selectedBed?.tenant && (
                <>
                  <p className="text-sm">
                    <strong>Tenant:</strong> {selectedBed.tenant.fullName}
                  </p>
                  <p className="text-sm">
                    <strong>Email:</strong> {selectedBed.tenant.email}
                  </p>
                </>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Move-out Date</label>
              <Input
                type="date"
                value={vacateDate}
                onChange={(e) => setVacateDate(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Security Deposit Refund Amount</label>
              <Input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="0"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Notes</label>
              <Input
                value={vacateNotes}
                onChange={(e) => setVacateNotes(e.target.value)}
                placeholder="Any notes about move-out..."
                className="mt-1"
              />
            </div>

            {!selectedBed?.noticeGiven && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  if (selectedRoom && selectedBed) {
                    handleRecordNotice(selectedRoom, selectedBed);
                    setShowVacateDialog(false);
                  }
                }}
              >
                <Clock className="w-4 h-4 mr-2" />
                Record Notice Period Instead
              </Button>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVacateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleVacateTenant} variant="destructive">
              <UserMinus className="w-4 h-4 mr-2" />
              Process Move-out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Room Dialog */}
      <Dialog open={showCreateRoomDialog} onOpenChange={setShowCreateRoomDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Room</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Property *</label>
              <Select
                value={createRoomForm.listingId}
                onValueChange={(v) => setCreateRoomForm((prev) => ({ ...prev, listingId: v }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select property..." />
                </SelectTrigger>
                <SelectContent>
                  {listingsData.map((listing) => (
                    <SelectItem key={listing._id} value={listing._id}>
                      {listing.pgName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Room Number *</label>
                <Input
                  value={createRoomForm.roomNumber}
                  onChange={(e) =>
                    setCreateRoomForm((prev) => ({ ...prev, roomNumber: e.target.value }))
                  }
                  placeholder="e.g., 101, A1"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Room Type *</label>
                <Select
                  value={createRoomForm.roomType}
                  onValueChange={(v) =>
                    setCreateRoomForm((prev) => ({ ...prev, roomType: v }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="double">Double</SelectItem>
                    <SelectItem value="triple">Triple</SelectItem>
                    <SelectItem value="dormitory">Dormitory</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Floor</label>
                <Input
                  type="number"
                  value={createRoomForm.floor}
                  onChange={(e) =>
                    setCreateRoomForm((prev) => ({
                      ...prev,
                      floor: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Capacity (Beds)</label>
                <Input
                  type="number"
                  min={1}
                  value={createRoomForm.capacity}
                  onChange={(e) =>
                    setCreateRoomForm((prev) => ({
                      ...prev,
                      capacity: parseInt(e.target.value) || 1,
                    }))
                  }
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Monthly Rent (₹)</label>
                <Input
                  type="number"
                  value={createRoomForm.monthlyRent}
                  onChange={(e) =>
                    setCreateRoomForm((prev) => ({
                      ...prev,
                      monthlyRent: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Security Deposit (₹)</label>
                <Input
                  type="number"
                  value={createRoomForm.securityDeposit}
                  onChange={(e) =>
                    setCreateRoomForm((prev) => ({
                      ...prev,
                      securityDeposit: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={createRoomForm.isAC}
                  onChange={(e) =>
                    setCreateRoomForm((prev) => ({ ...prev, isAC: e.target.checked }))
                  }
                  className="rounded"
                />
                <span className="text-sm">AC Room</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={createRoomForm.hasAttachedBathroom}
                  onChange={(e) =>
                    setCreateRoomForm((prev) => ({
                      ...prev,
                      hasAttachedBathroom: e.target.checked,
                    }))
                  }
                  className="rounded"
                />
                <span className="text-sm">Attached Bathroom</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateRoomDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRoom} className="bg-HG-500 hover:bg-HG-600">
              <Plus className="w-4 h-4 mr-2" />
              Create Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}