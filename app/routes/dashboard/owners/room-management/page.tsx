// app/routes/dashboard/owners/room-management/page.tsx
"use client";

import { useEffect, useState, useCallback, Fragment } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useLoadingStore } from "@/store/loading";
import {
  Building2,
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Bed,
  Users,
  Home,
  Settings,
  AlertCircle,
  CheckCircle2,
  Wrench,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  IndianRupee,
  Layers,
  Filter,
} from "lucide-react";

// Types
interface BedData {
  _id: string;
  bedNumber: string;
  bedLabel: string;
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

interface RoomData {
  _id: string;
  roomNumber: string;
  roomType: string;
  floor: number;
  capacity: number;
  beds: BedData[];
  status: "available" | "partial" | "full" | "maintenance";
  occupiedBeds: number;
  availableBeds: number;
  reservedBeds: number;
  isAC: boolean;
  hasAttachedBathroom: boolean;
  amenities: string[];
  notes: string;
  monthlyRent: number;
  securityDeposit: number;
  isActive: boolean;
  listingId: {
    _id: string;
    pgName: string;
    location: { area: string; city: string };
  };
}

interface RoomTypeConfig {
  _id: string;
  type: string;
  isAC: boolean;
  numberOfRooms: number;
  availableRooms: number;
  capacityPerRoom: number;
  monthlyRent: number;
  securityDeposit: number;
}

interface ListingData {
  _id: string;
  pgName: string;
  location: { area: string; city: string };
  roomTypes: RoomTypeConfig[];
  isActive: boolean;
  isApproved: boolean;
}

interface RoomSummary {
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  reservedBeds: number;
  maintenanceBeds: number;
  occupancyRate: number;
  upcomingVacancies: number;
}

interface CreateRoomFormData {
  listingId: string;
  roomTypeId: string;
  roomNumber: string;
  floor: number;
  capacity: number;
  isAC: boolean;
  hasAttachedBathroom: boolean;
  monthlyRent: number;
  securityDeposit: number;
}

interface BulkCreateFormData {
  listingId: string;
  roomTypeId: string;
  startNumber: number;
  count: number;
  floor: number;
  numberingFormat: "numeric" | "alpha" | "floor-based";
}

const initialCreateRoomForm: CreateRoomFormData = {
  listingId: "",
  roomTypeId: "",
  roomNumber: "",
  floor: 0,
  capacity: 1,
  isAC: false,
  hasAttachedBathroom: false,
  monthlyRent: 0,
  securityDeposit: 0,
};

const initialBulkCreateForm: BulkCreateFormData = {
  listingId: "",
  roomTypeId: "",
  startNumber: 1,
  count: 5,
  floor: 0,
  numberingFormat: "numeric",
};

export default function RoomManagementPage() {
  // State
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [listings, setListings] = useState<ListingData[]>([]);
  const [summary, setSummary] = useState<RoomSummary | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedListing, setSelectedListing] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roomTypeFilter, setRoomTypeFilter] = useState("all");
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set());

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showBulkCreateDialog, setShowBulkCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Form states
  const [createForm, setCreateForm] =
    useState<CreateRoomFormData>(initialCreateRoomForm);
  const [bulkForm, setBulkForm] =
    useState<BulkCreateFormData>(initialBulkCreateForm);
  const [editForm, setEditForm] = useState<Partial<RoomData> | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<RoomData | null>(null);
  const [selectedListingForForm, setSelectedListingForForm] =
    useState<ListingData | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const { containerLoading, setContainerLoading } = useLoadingStore();

  // Fetch data
  const fetchRooms = useCallback(async () => {
    setContainerLoading("roomManagement", true);
    try {
      const params = new URLSearchParams();
      if (selectedListing !== "all")
        params.append("listingId", selectedListing);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (roomTypeFilter !== "all") params.append("roomType", roomTypeFilter);

      const res = await axios.get(`/api/owner/rooms?${params}`);
      if (res.data.success) {
        setRooms(res.data.data);
        setSummary(res.data.summary);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to fetch rooms");
    } finally {
      setContainerLoading("roomManagement", false);
    }
  }, [selectedListing, statusFilter, roomTypeFilter, setContainerLoading]);

  const fetchListings = useCallback(async () => {
    try {
      const res = await axios.get("/api/owner/getOwnerPg");
      if (res.data.success) {
        setListings(res.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch listings", error);
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Handlers
  const handleListingChangeForForm = (
    listingId: string,
    formType: "create" | "bulk"
  ) => {
    const listing = listings.find((l) => l._id === listingId);
    setSelectedListingForForm(listing || null);

    if (formType === "create") {
      setCreateForm((prev) => ({
        ...prev,
        listingId,
        roomTypeId: "",
        capacity: 1,
        monthlyRent: 0,
        securityDeposit: 0,
        isAC: false,
      }));
    } else {
      setBulkForm((prev) => ({
        ...prev,
        listingId,
        roomTypeId: "",
      }));
    }
  };

  const handleRoomTypeChange = (
    roomTypeId: string,
    formType: "create" | "bulk"
  ) => {
    const roomType = selectedListingForForm?.roomTypes.find(
      (rt) => rt._id === roomTypeId
    );
    if (!roomType) return;

    if (formType === "create") {
      setCreateForm((prev) => ({
        ...prev,
        roomTypeId,
        capacity: roomType.capacityPerRoom,
        isAC: roomType.isAC,
        monthlyRent: roomType.monthlyRent,
        securityDeposit: roomType.securityDeposit,
      }));
    } else {
      setBulkForm((prev) => ({
        ...prev,
        roomTypeId,
      }));
    }
  };

  const handleCreateRoom = async () => {
    if (
      !createForm.listingId ||
      !createForm.roomTypeId ||
      !createForm.roomNumber
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    setActionLoading(true);
    try {
      const res = await axios.post("/api/owner/rooms", {
        listingId: createForm.listingId,
        roomTypeId: createForm.roomTypeId,
        rooms: [
          {
            roomNumber: createForm.roomNumber,
            floor: createForm.floor,
            capacity: createForm.capacity,
            isAC: createForm.isAC,
            hasAttachedBathroom: createForm.hasAttachedBathroom,
            monthlyRent: createForm.monthlyRent,
            securityDeposit: createForm.securityDeposit,
          },
        ],
      });

      if (res.data.success) {
        toast.success(res.data.message || "Room created successfully");
        setShowCreateDialog(false);
        setCreateForm(initialCreateRoomForm);
        setSelectedListingForForm(null);
        fetchRooms();
      } else {
        toast.error(res.data.message || "Failed to create room");
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to create room");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkCreate = async () => {
    if (!bulkForm.listingId || !bulkForm.roomTypeId || bulkForm.count < 1) {
      toast.error("Please fill all required fields");
      return;
    }

    setActionLoading(true);
    try {
      const res = await axios.post("/api/owner/rooms/bulk", {
        listingId: bulkForm.listingId,
        roomTypeId: bulkForm.roomTypeId,
        startNumber: bulkForm.startNumber,
        count: bulkForm.count,
        floor: bulkForm.floor,
        numberingFormat: bulkForm.numberingFormat,
      });

      if (res.data.success) {
        toast.success(
          res.data.message || `Created ${res.data.data.created} rooms`
        );
        if (res.data.data.skipped > 0) {
          toast.info(`Skipped ${res.data.data.skipped} duplicate room numbers`);
        }
        setShowBulkCreateDialog(false);
        setBulkForm(initialBulkCreateForm);
        setSelectedListingForForm(null);
        fetchRooms();
      } else {
        toast.error(res.data.message || "Failed to create rooms");
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to create rooms");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateRoom = async () => {
    if (!selectedRoom || !editForm) return;

    setActionLoading(true);
    try {
      const res = await axios.put(
        `/api/owner/rooms/${selectedRoom._id}`,
        editForm
      );

      if (res.data.success) {
        toast.success("Room updated successfully");
        setShowEditDialog(false);
        setSelectedRoom(null);
        setEditForm(null);
        fetchRooms();
      } else {
        toast.error(res.data.message || "Failed to update room");
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to update room");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRoom = async () => {
    if (!selectedRoom) return;

    setActionLoading(true);
    try {
      const res = await axios.delete(`/api/owner/rooms/${selectedRoom._id}`);

      if (res.data.success) {
        toast.success("Room deleted successfully");
        setShowDeleteDialog(false);
        setSelectedRoom(null);
        fetchRooms();
      } else {
        toast.error(res.data.message || "Failed to delete room");
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to delete room");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetBedMaintenance = async (
    room: RoomData,
    bed: BedData,
    inMaintenance: boolean
  ) => {
    try {
      const res = await axios.patch(`/api/owner/rooms/${room._id}`, {
        action: inMaintenance ? "set_maintenance" : "remove_maintenance",
        bedNumber: bed.bedNumber,
      });

      if (res.data.success) {
        toast.success(
          inMaintenance
            ? "Bed set to maintenance"
            : "Bed removed from maintenance"
        );
        fetchRooms();
      } else {
        toast.error(res.data.message || "Failed to update bed");
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to update bed");
    }
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

  const openEditDialog = (room: RoomData) => {
    setSelectedRoom(room);
    setEditForm({
      roomNumber: room.roomNumber,
      floor: room.floor,
      isAC: room.isAC,
      hasAttachedBathroom: room.hasAttachedBathroom,
      amenities: room.amenities,
      notes: room.notes,
      monthlyRent: room.monthlyRent,
      securityDeposit: room.securityDeposit,
      isActive: room.isActive,
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (room: RoomData) => {
    setSelectedRoom(room);
    setShowDeleteDialog(true);
  };

  // Filter rooms
  const filteredRooms = rooms.filter((room) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        room.roomNumber.toLowerCase().includes(query) ||
        room.roomType.toLowerCase().includes(query) ||
        room.listingId?.pgName?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }
    return true;
  });

  // Group rooms by listing
  const roomsByListing = filteredRooms.reduce(
    (acc, room) => {
      const listingId = room.listingId?._id || "unknown";
      if (!acc[listingId]) {
        acc[listingId] = {
          listing: room.listingId,
          rooms: [],
        };
      }
      acc[listingId].rooms.push(room);
      return acc;
    },
    {} as Record<
      string,
      {
        listing: {
          _id: string;
          pgName: string;
          location: { area: string; city: string };
        };
        rooms: RoomData[];
      }
    >
  );

  // Get unique room types for filter
  const uniqueRoomTypes = Array.from(new Set(rooms.map((r) => r.roomType)));

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
        return <Bed className="w-4 h-4 text-green-600" />;
      case "occupied":
        return <Users className="w-4 h-4 text-red-600" />;
      case "reserved":
        return <Settings className="w-4 h-4 text-blue-600" />;
      case "maintenance":
        return <Wrench className="w-4 h-4 text-gray-600" />;
      default:
        return <Bed className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-14">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight font-poppins">
            Room <span className="text-HG-500">Management</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-lg font-inter mt-1">
            Create, manage, and monitor rooms across all your properties
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowBulkCreateDialog(true)}
            disabled={listings.length === 0}
          >
            <Layers className="w-4 h-4 mr-2" />
            Bulk Create
          </Button>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-HG-500 hover:bg-HG-600 text-white"
            disabled={listings.length === 0}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Room
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Home className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="text-xs text-blue-600 font-medium">
                    Total Rooms
                  </p>
                  <p className="text-xl font-bold text-blue-800">
                    {summary.totalRooms}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Bed className="w-6 h-6 text-purple-600" />
                <div>
                  <p className="text-xs text-purple-600 font-medium">
                    Total Beds
                  </p>
                  <p className="text-xl font-bold text-purple-800">
                    {summary.totalBeds}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <div>
                  <p className="text-xs text-green-600 font-medium">
                    Available
                  </p>
                  <p className="text-xl font-bold text-green-800">
                    {summary.availableBeds}
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
                    {summary.occupiedBeds}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Settings className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="text-xs text-blue-600 font-medium">Reserved</p>
                  <p className="text-xl font-bold text-blue-800">
                    {summary.reservedBeds}
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
                    {summary.occupancyRate}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-orange-600" />
                <div>
                  <p className="text-xs text-orange-600 font-medium">
                    Vacating
                  </p>
                  <p className="text-xl font-bold text-orange-800">
                    {summary.upcomingVacancies}
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
            placeholder="Search rooms by number, type, or property..."
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
            {listings.map((listing) => (
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
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="full">Full</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>

        <Select value={roomTypeFilter} onValueChange={setRoomTypeFilter}>
          <SelectTrigger className="w-full md:w-[150px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {uniqueRoomTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={fetchRooms} className="shrink-0">
          <RefreshCw
            className={`w-4 h-4 ${containerLoading.roomManagement ? "animate-spin" : ""}`}
          />
        </Button>
      </div>

      {/* Content */}
      {containerLoading.roomManagement ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-HG-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading rooms...</p>
          </div>
        </div>
      ) : listings.length === 0 ? (
        <Card className="py-16">
          <CardContent className="text-center">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No Properties Yet
            </h3>
            <p className="text-gray-500 mb-4">
              Create a property listing first to manage rooms
            </p>
            <Button asChild className="bg-HG-500 hover:bg-HG-600">
              <a href="/routes/dashboard/owners/add-pg">Create Property</a>
            </Button>
          </CardContent>
        </Card>
      ) : filteredRooms.length === 0 ? (
        <Card className="py-16">
          <CardContent className="text-center">
            <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No Rooms Found
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery ||
              statusFilter !== "all" ||
              roomTypeFilter !== "all"
                ? "Try adjusting your filters"
                : "Create rooms for your properties to get started"}
            </p>
            {!searchQuery &&
              statusFilter === "all" &&
              roomTypeFilter === "all" && (
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-HG-500 hover:bg-HG-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Room
                </Button>
              )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.values(roomsByListing).map(
            ({ listing, rooms: listingRooms }) => (
              <Card
                key={listing?._id || "unknown"}
                className="overflow-hidden"
              >
                <CardHeader className="bg-gray-50 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold">
                        {listing?.pgName || "Unknown Property"}
                      </CardTitle>
                      {listing?.location && (
                        <p className="text-sm text-gray-500">
                          {listing.location.area}, {listing.location.city}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <p className="text-gray-500">Rooms</p>
                        <p className="font-bold">{listingRooms.length}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500">Beds</p>
                        <p className="font-bold">
                          {listingRooms.reduce(
                            (acc, r) => acc + r.beds.length,
                            0
                          )}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500">Available</p>
                        <p className="font-bold text-green-600">
                          {listingRooms.reduce(
                            (acc, r) => acc + r.availableBeds,
                            0
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10"></TableHead>
                        <TableHead>Room</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Floor</TableHead>
                        <TableHead>Beds</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Rent</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
        
                 <TableBody>
  {listingRooms.map((room) => (
    <Fragment key={room._id}>
      <TableRow
        className="cursor-pointer hover:bg-gray-50"
        onClick={() => toggleRoomExpand(room._id)}
      >
        <TableCell>
          {expandedRooms.has(room._id) ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </TableCell>
        <TableCell className="font-medium">
          <div className="flex items-center gap-2">
            <Home className="w-4 h-4 text-gray-400" />
            Room {room.roomNumber}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            {room.roomType}
            {room.isAC && (
              <Badge variant="outline" className="text-xs ml-1">
                AC
              </Badge>
            )}
          </div>
        </TableCell>
        <TableCell>{room.floor}</TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            <span className="text-green-600 font-medium">
              {room.availableBeds}
            </span>
            <span className="text-gray-400">/</span>
            <span>{room.capacity}</span>
          </div>
        </TableCell>
        <TableCell>
          <Badge
            variant="outline"
            className={getStatusColor(room.status)}
          >
            {room.status}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex items-center">
            <IndianRupee className="w-3 h-3" />
            {room.monthlyRent.toLocaleString()}
          </div>
        </TableCell>
        <TableCell className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger
              asChild
              onClick={(e) => e.stopPropagation()}
            >
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  openEditDialog(room);
                }}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Room
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  openDeleteDialog(room);
                }}
                className="text-red-600"
                disabled={room.occupiedBeds > 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Room
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      {/* Expanded Beds Row */}
      {expandedRooms.has(room._id) && (
        <TableRow>
          <TableCell colSpan={8} className="bg-gray-50 p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {room.beds.map((bed) => (
                <div
                  key={bed._id}
                  className={`p-3 rounded-lg border-2 ${getStatusColor(bed.status)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    {getBedIcon(bed.status)}
                    <span className="text-sm font-medium">
                      Bed {bed.bedNumber}
                    </span>
                  </div>
                  <p className="text-xs capitalize mb-2">
                    {bed.status}
                  </p>
                  {bed.tenant && (
                    <div className="text-xs space-y-1 border-t pt-2">
                      <p className="font-medium truncate">
                        {bed.tenant.fullName}
                      </p>
                      <p className="text-gray-500 truncate">
                        {bed.tenant.phone}
                      </p>
                      {bed.noticeGiven && (
                        <Badge className="text-[10px] bg-orange-100 text-orange-800">
                          Vacating
                        </Badge>
                      )}
                    </div>
                  )}
                  {bed.status === "available" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2 text-xs h-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetBedMaintenance(room, bed, true);
                      }}
                    >
                      <Wrench className="w-3 h-3 mr-1" />
                      Set Maintenance
                    </Button>
                  )}
                  {bed.status === "maintenance" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2 text-xs h-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetBedMaintenance(room, bed, false);
                      }}
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Mark Available
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {room.notes && (
              <p className="text-sm text-gray-600 mt-3 pt-3 border-t">
                <strong>Notes:</strong> {room.notes}
              </p>
            )}
          </TableCell>
        </TableRow>
      )}
    </Fragment>
  ))}
</TableBody>
                  </Table>
                </CardContent>
              </Card>
            )
          )}
        </div>
      )}

      {/* Create Room Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Room</DialogTitle>
            <DialogDescription>Add a new room to your property</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Property *</Label>
              <Select
                value={createForm.listingId}
                onValueChange={(v) => handleListingChangeForForm(v, "create")}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select property..." />
                </SelectTrigger>
                <SelectContent>
                  {listings.map((listing) => (
                    <SelectItem key={listing._id} value={listing._id}>
                      {listing.pgName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedListingForForm &&
              selectedListingForForm.roomTypes.length > 0 && (
                <div>
                  <Label>Room Type *</Label>
                  <Select
                    value={createForm.roomTypeId}
                    onValueChange={(v) => handleRoomTypeChange(v, "create")}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select room type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedListingForForm.roomTypes.map((rt) => (
                        <SelectItem key={rt._id} value={rt._id}>
                          {rt.type} {rt.isAC ? "(AC)" : "(Non-AC)"} - ₹
                          {rt.monthlyRent.toLocaleString()} -{" "}
                          {rt.capacityPerRoom} bed(s)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

            {selectedListingForForm &&
              selectedListingForForm.roomTypes.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    ⚠️ This property has no room types configured. Please add
                    room types in the listing settings first.
                  </p>
                </div>
              )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Room Number *</Label>
                <Input
                  value={createForm.roomNumber}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      roomNumber: e.target.value,
                    }))
                  }
                  placeholder="e.g., 101, A1"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Floor</Label>
                <Input
                  type="number"
                  value={createForm.floor}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      floor: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Capacity (Beds)</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={createForm.capacity}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      capacity: parseInt(e.target.value) || 1,
                    }))
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Monthly Rent (₹)</Label>
                <Input
                  type="number"
                  value={createForm.monthlyRent}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      monthlyRent: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Security Deposit (₹)</Label>
              <Input
                type="number"
                value={createForm.securityDeposit}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    securityDeposit: parseInt(e.target.value) || 0,
                  }))
                }
                className="mt-1"
              />
            </div>

            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  id="isAC"
                  checked={createForm.isAC}
                  onCheckedChange={(checked: boolean) =>
                    setCreateForm((prev) => ({ ...prev, isAC: checked }))
                  }
                />
                <Label htmlFor="isAC">AC Room</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="hasAttachedBathroom"
                  checked={createForm.hasAttachedBathroom}
                  onCheckedChange={(checked: boolean) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      hasAttachedBathroom: checked,
                    }))
                  }
                />
                <Label htmlFor="hasAttachedBathroom">Attached Bathroom</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateRoom}
              className="bg-HG-500 hover:bg-HG-600"
              disabled={
                actionLoading ||
                !createForm.listingId ||
                !createForm.roomTypeId ||
                !createForm.roomNumber
              }
            >
              {actionLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Create Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Create Dialog */}
      <Dialog
        open={showBulkCreateDialog}
        onOpenChange={setShowBulkCreateDialog}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Bulk Create Rooms</DialogTitle>
            <DialogDescription>Create multiple rooms at once</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Property *</Label>
              <Select
                value={bulkForm.listingId}
                onValueChange={(v) => handleListingChangeForForm(v, "bulk")}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select property..." />
                </SelectTrigger>
                <SelectContent>
                  {listings.map((listing) => (
                    <SelectItem key={listing._id} value={listing._id}>
                      {listing.pgName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedListingForForm &&
              selectedListingForForm.roomTypes.length > 0 && (
                <div>
                  <Label>Room Type *</Label>
                  <Select
                    value={bulkForm.roomTypeId}
                    onValueChange={(v) => handleRoomTypeChange(v, "bulk")}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select room type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedListingForForm.roomTypes.map((rt) => (
                        <SelectItem key={rt._id} value={rt._id}>
                          {rt.type} {rt.isAC ? "(AC)" : "(Non-AC)"} -{" "}
                          {rt.capacityPerRoom} bed(s)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Number</Label>
                <Input
                  type="number"
                  min={1}
                  value={bulkForm.startNumber}
                  onChange={(e) =>
                    setBulkForm((prev) => ({
                      ...prev,
                      startNumber: parseInt(e.target.value) || 1,
                    }))
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Number of Rooms *</Label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={bulkForm.count}
                  onChange={(e) =>
                    setBulkForm((prev) => ({
                      ...prev,
                      count: parseInt(e.target.value) || 1,
                    }))
                  }
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Floor</Label>
                <Input
                  type="number"
                  value={bulkForm.floor}
                  onChange={(e) =>
                    setBulkForm((prev) => ({
                      ...prev,
                      floor: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Numbering Format</Label>
                <Select
                  value={bulkForm.numberingFormat}
                  onValueChange={(v: "numeric" | "alpha" | "floor-based") =>
                    setBulkForm((prev) => ({ ...prev, numberingFormat: v }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="numeric">
                      Numeric (101, 102...)
                    </SelectItem>
                    <SelectItem value="alpha">Alpha (A1, A2, B1...)</SelectItem>
                    <SelectItem value="floor-based">
                      Floor-based (101, 102, 201...)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                This will create {bulkForm.count} room(s) starting from number{" "}
                {bulkForm.startNumber}. Existing room numbers will be skipped.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBulkCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkCreate}
              className="bg-HG-500 hover:bg-HG-600"
              disabled={
                actionLoading || !bulkForm.listingId || !bulkForm.roomTypeId
              }
            >
              {actionLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <Layers className="w-4 h-4 mr-2" />
              )}
              Create {bulkForm.count} Rooms
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Room Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Room {selectedRoom?.roomNumber}</DialogTitle>
            <DialogDescription>Update room details</DialogDescription>
          </DialogHeader>

          {editForm && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Room Number</Label>
                  <Input
                    value={editForm.roomNumber || ""}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        roomNumber: e.target.value,
                      }))
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Floor</Label>
                  <Input
                    type="number"
                    value={editForm.floor || 0}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        floor: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Monthly Rent (₹)</Label>
                  <Input
                    type="number"
                    value={editForm.monthlyRent || 0}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        monthlyRent: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Security Deposit (₹)</Label>
                  <Input
                    type="number"
                    value={editForm.securityDeposit || 0}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        securityDeposit: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>Notes</Label>
                <Input
                  value={editForm.notes || ""}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Any notes about the room..."
                  className="mt-1"
                />
              </div>

              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    id="editIsAC"
                    checked={editForm.isAC || false}
                    onCheckedChange={(checked: boolean) =>
                      setEditForm((prev) => ({ ...prev, isAC: checked }))
                    }
                  />
                  <Label htmlFor="editIsAC">AC Room</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="editHasAttachedBathroom"
                    checked={editForm.hasAttachedBathroom || false}
                    onCheckedChange={(checked: boolean) =>
                      setEditForm((prev) => ({
                        ...prev,
                        hasAttachedBathroom: checked,
                      }))
                    }
                  />
                  <Label htmlFor="editHasAttachedBathroom">
                    Attached Bathroom
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="editIsActive"
                    checked={editForm.isActive !== false}
                    onCheckedChange={(checked: boolean) =>
                      setEditForm((prev) => ({ ...prev, isActive: checked }))
                    }
                  />
                  <Label htmlFor="editIsActive">Active</Label>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateRoom}
              className="bg-HG-500 hover:bg-HG-600"
              disabled={actionLoading}
            >
              {actionLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Room</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete Room {selectedRoom?.roomNumber}?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {selectedRoom && selectedRoom.occupiedBeds > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">
                ⚠️ This room has {selectedRoom.occupiedBeds} occupied bed(s).
                Please vacate all tenants before deleting.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteRoom}
              disabled={actionLoading || (selectedRoom?.occupiedBeds || 0) > 0}
            >
              {actionLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}