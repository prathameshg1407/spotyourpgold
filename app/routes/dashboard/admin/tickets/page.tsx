// app/routes/dashboard/admin/tickets/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Phone,
  Mail,
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Send,
  Building,
  Star,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  FileText,
  Search,
  RefreshCw,
  AlertTriangle,
  Wrench,
  Utensils,
  Sparkles,
  Shield,
  Volume2,
  Users,
  CreditCard,
  Wifi,
  Droplets,
  Sofa,
  HelpCircle,
  Lightbulb,
  MoreHorizontal,
  MoreVertical,
  Eye,
  MessageSquare,
  Inbox,
  Download,
  Flag,
  UserCheck,
  UserPlus,
  SlidersHorizontal,
  History,
  Flame,
  ShieldAlert,
  UserCog,
  Copy,
} from "lucide-react";
import { useUserStore } from "@/store/userStore";
import axios from "axios";
import { toast } from "sonner";
import { formatDistanceToNow, format, differenceInHours, differenceInDays } from "date-fns";

// Types
interface Ticket {
  _id: string;
  ticketNumber: string;
  category: string;
  priority: string;
  subject: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  expectedResolutionDate: string;
  firstResponseAt: string | null;
  isEscalated: boolean;
  escalatedAt: string | null;
  escalationReason: string;
  comments: Comment[];
  userId: {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
    profileImage?: string;
    role?: string;
    createdAt?: string;
  };
  listingId?: {
    _id: string;
    pgName: string;
    location: { area: string; city: string };
    images?: string[];
    ownerId?: {
      _id: string;
      fullName: string;
      email: string;
      phone: string;
    };
  };
  bookingId?: {
    _id: string;
    roomType: string;
    moveInDate: string;
    status: string;
    totalAmount?: number;
    paymentStatus?: string;
  };
  assignedTo?: {
    _id: string;
    fullName: string;
    email: string;
    role?: string;
  };
  resolvedBy?: {
    _id: string;
    fullName: string;
    email: string;
  };
  resolution: string;
  resolvedAt: string | null;
  satisfactionRating: number | null;
  satisfactionFeedback: string;
}

interface Comment {
  _id: string;
  userId: string;
  userRole: string;
  userName: string;
  message: string;
  createdAt: string;
  attachments?: { url: string; name: string; type: string }[];
}

interface Stats {
  total: number;
  open: number;
  inProgress: number;
  waitingResponse: number;
  resolved: number;
  closed: number;
  escalated: number;
  urgent: number;
  high: number;
  unassigned: number;
  overdue: number;
  assignedToMe: number;
}

interface CategoryStat {
  _id: string;
  count: number;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface AdminUser {
  _id: string;
  fullName: string;
  email: string;
  role: string;
}

interface UserTicketHistory {
  ticketNumber: string;
  subject: string;
  status: string;
  createdAt: string;
  category: string;
}

// Constants
const TICKET_CATEGORIES = [
  { value: "maintenance", label: "Maintenance", icon: Wrench, color: "text-orange-600", bgColor: "bg-orange-100" },
  { value: "food_complaint", label: "Food", icon: Utensils, color: "text-red-600", bgColor: "bg-red-100" },
  { value: "cleanliness", label: "Cleanliness", icon: Sparkles, color: "text-blue-600", bgColor: "bg-blue-100" },
  { value: "security", label: "Security", icon: Shield, color: "text-purple-600", bgColor: "bg-purple-100" },
  { value: "noise_complaint", label: "Noise", icon: Volume2, color: "text-yellow-600", bgColor: "bg-yellow-100" },
  { value: "roommate_issue", label: "Roommate", icon: Users, color: "text-pink-600", bgColor: "bg-pink-100" },
  { value: "billing_payment", label: "Billing", icon: CreditCard, color: "text-green-600", bgColor: "bg-green-100" },
  { value: "wifi_internet", label: "WiFi", icon: Wifi, color: "text-cyan-600", bgColor: "bg-cyan-100" },
  { value: "water_electricity", label: "Utilities", icon: Droplets, color: "text-blue-500", bgColor: "bg-blue-100" },
  { value: "furniture_appliance", label: "Furniture", icon: Sofa, color: "text-amber-600", bgColor: "bg-amber-100" },
  { value: "booking_issue", label: "Booking", icon: FileText, color: "text-indigo-600", bgColor: "bg-indigo-100" },
  { value: "refund_request", label: "Refund", icon: CreditCard, color: "text-red-500", bgColor: "bg-red-100" },
  { value: "general_inquiry", label: "General", icon: HelpCircle, color: "text-gray-600", bgColor: "bg-gray-100" },
  { value: "suggestion", label: "Suggestion", icon: Lightbulb, color: "text-yellow-500", bgColor: "bg-yellow-100" },
  { value: "other", label: "Other", icon: MoreHorizontal, color: "text-gray-500", bgColor: "bg-gray-100" },
];

const PRIORITY_CONFIG = {
  low: { 
    label: "Low", 
    color: "bg-gray-100 text-gray-700 border-gray-300", 
    dotColor: "bg-gray-400",
    sortOrder: 1 
  },
  medium: { 
    label: "Medium", 
    color: "bg-blue-100 text-blue-700 border-blue-300", 
    dotColor: "bg-blue-500",
    sortOrder: 2 
  },
  high: { 
    label: "High", 
    color: "bg-orange-100 text-orange-700 border-orange-300", 
    dotColor: "bg-orange-500",
    sortOrder: 3 
  },
  urgent: { 
    label: "Urgent", 
    color: "bg-red-100 text-red-700 border-red-300", 
    dotColor: "bg-red-500",
    sortOrder: 4 
  },
};

const STATUS_CONFIG = {
  open: { label: "Open", color: "bg-blue-100 text-blue-700", icon: AlertCircle, textColor: "text-blue-600" },
  in_progress: { label: "In Progress", color: "bg-yellow-100 text-yellow-700", icon: Clock, textColor: "text-yellow-600" },
  waiting_response: { label: "Awaiting User", color: "bg-purple-100 text-purple-700", icon: MessageCircle, textColor: "text-purple-600" },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-700", icon: CheckCircle2, textColor: "text-green-600" },
  closed: { label: "Closed", color: "bg-gray-100 text-gray-700", icon: XCircle, textColor: "text-gray-600" },
  reopened: { label: "Reopened", color: "bg-orange-100 text-orange-700", icon: RefreshCw, textColor: "text-orange-600" },
};

export default function AdminTicketsPage() {
  const { user } = useUserStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [activeTab, setActiveTab] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showEscalatedOnly, setShowEscalatedOnly] = useState(false);
  const [showAssignedToMe, setShowAssignedToMe] = useState(false);

  // Selected ticket for details
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketMetrics, setTicketMetrics] = useState<{
    hoursElapsed: number;
    daysElapsed: number;
    isOverdue: boolean;
    responseTimeHours: number | null;
    isEscalated: boolean;
    escalatedDaysAgo: number | null;
  } | null>(null);
  const [userHistory, setUserHistory] = useState<UserTicketHistory[]>([]);
  const [showTicketSheet, setShowTicketSheet] = useState(false);
  const [loadingTicketDetails, setLoadingTicketDetails] = useState(false);

  // Admin list for assignment
  const [admins, setAdmins] = useState<AdminUser[]>([]);

  // Actions
  const [newComment, setNewComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolution, setResolution] = useState("");
  const [resolving, setResolving] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [assigning, setAssigning] = useState(false);

  // Bulk actions
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);

  // Fetch tickets
  const fetchTickets = useCallback(async (showRefreshIndicator = false) => {
    if (!user?.id) return;

    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const params = new URLSearchParams({
        adminId: user.id,
        page: currentPage.toString(),
        limit: "15",
      });

      if (statusFilter !== "all") params.append("status", statusFilter);
      if (priorityFilter !== "all") params.append("priority", priorityFilter);
      if (categoryFilter !== "all") params.append("category", categoryFilter);
      if (showEscalatedOnly) params.append("escalated", "true");
      if (showAssignedToMe) params.append("assignedToMe", "true");
      if (searchQuery) params.append("search", searchQuery);

      const response = await axios.get(`/api/admin/tickets?${params.toString()}`);

      if (response.data.success) {
        setTickets(response.data.data);
        setStats(response.data.stats);
        setCategoryStats(response.data.categoryStats || []);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, currentPage, statusFilter, priorityFilter, categoryFilter, showEscalatedOnly, showAssignedToMe, searchQuery]);

  // Fetch admin users for assignment
  const fetchAdmins = async () => {
    try {
      const response = await axios.get("/api/admin/getOwner?role=admin");
      if (response.data.success) {
        setAdmins(response.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch admins:", error);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchAdmins();
  }, [fetchTickets]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, priorityFilter, categoryFilter, showEscalatedOnly, showAssignedToMe, searchQuery]);

  // Fetch single ticket details
  const fetchTicketDetails = async (ticketId: string) => {
    try {
      setLoadingTicketDetails(true);
      const response = await axios.get(`/api/admin/tickets/${ticketId}`);

      if (response.data.success) {
        setSelectedTicket(response.data.data);
        setTicketMetrics(response.data.metrics);
        setUserHistory(response.data.userHistory || []);
        setShowTicketSheet(true);
      }
    } catch (error) {
      console.error("Failed to fetch ticket details:", error);
      toast.error("Failed to load ticket details");
    } finally {
      setLoadingTicketDetails(false);
    }
  };

  // Add comment
  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedTicket) return;

    try {
      setSendingComment(true);
      const response = await axios.post(`/api/admin/tickets/${selectedTicket._id}`, {
        action: "add_comment",
        adminId: user?.id,
        adminName: user?.fullName,
        message: newComment,
      });

      if (response.data.success) {
        setSelectedTicket(response.data.data);
        setNewComment("");
        fetchTickets();
        toast.success("Response sent successfully");
      }
    } catch (error) {
      console.error("Failed to send comment:", error);
      toast.error("Failed to send response");
    } finally {
      setSendingComment(false);
    }
  };

  // Resolve ticket
  const handleResolve = async () => {
    if (!resolution.trim() || !selectedTicket) return;

    try {
      setResolving(true);
      const response = await axios.post(`/api/admin/tickets/${selectedTicket._id}`, {
        action: "resolve",
        adminId: user?.id,
        adminName: user?.fullName,
        resolution,
      });

      if (response.data.success) {
        setSelectedTicket(response.data.data);
        setShowResolveDialog(false);
        setResolution("");
        fetchTickets();
        toast.success("Ticket resolved successfully");
      }
    } catch (error) {
      console.error("Failed to resolve ticket:", error);
      toast.error("Failed to resolve ticket");
    } finally {
      setResolving(false);
    }
  };

  // Update status
  const handleUpdateStatus = async (status: string) => {
    if (!selectedTicket) return;

    try {
      const response = await axios.post(`/api/admin/tickets/${selectedTicket._id}`, {
        action: "update_status",
        adminId: user?.id,
        status,
      });

      if (response.data.success) {
        setSelectedTicket(response.data.data);
        fetchTickets();
        toast.success(`Status updated to ${status.replace("_", " ")}`);
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update status");
    }
  };

  // Update priority
  const handleUpdatePriority = async (priority: string) => {
    if (!selectedTicket) return;

    try {
      const response = await axios.post(`/api/admin/tickets/${selectedTicket._id}`, {
        action: "update_priority",
        adminId: user?.id,
        priority,
      });

      if (response.data.success) {
        setSelectedTicket(response.data.data);
        fetchTickets();
        toast.success(`Priority updated to ${priority}`);
      }
    } catch (error) {
      console.error("Failed to update priority:", error);
      toast.error("Failed to update priority");
    }
  };

  // Assign ticket
  const handleAssignTicket = async (assignToId?: string) => {
    if (!selectedTicket) return;

    const targetId = assignToId || selectedAssignee;
    if (!targetId) {
      toast.error("Please select an assignee");
      return;
    }

    try {
      setAssigning(true);
      const response = await axios.post(`/api/admin/tickets`, {
        ticketId: selectedTicket._id,
        adminId: user?.id,
        action: targetId === user?.id ? "assign_self" : "assign_to",
        assignToId: targetId,
      });

      if (response.data.success) {
        setSelectedTicket(response.data.data);
        setShowAssignDialog(false);
        setSelectedAssignee("");
        fetchTickets();
        toast.success("Ticket assigned successfully");
      }
    } catch (error) {
      console.error("Failed to assign ticket:", error);
      toast.error("Failed to assign ticket");
    } finally {
      setAssigning(false);
    }
  };

  // Close ticket
  const handleCloseTicket = async () => {
    if (!selectedTicket) return;

    try {
      const response = await axios.post(`/api/admin/tickets/${selectedTicket._id}`, {
        action: "close",
        adminId: user?.id,
        adminName: user?.fullName,
      });

      if (response.data.success) {
        setSelectedTicket(response.data.data);
        fetchTickets();
        toast.success("Ticket closed");
      }
    } catch (error) {
      console.error("Failed to close ticket:", error);
      toast.error("Failed to close ticket");
    }
  };

  // Bulk assign
  const handleBulkAssign = async (assignToId: string) => {
    if (selectedTickets.length === 0) {
      toast.error("No tickets selected");
      return;
    }

    try {
      const promises = selectedTickets.map((ticketId) =>
        axios.post(`/api/admin/tickets`, {
          ticketId,
          adminId: user?.id,
          action: assignToId === user?.id ? "assign_self" : "assign_to",
          assignToId,
        })
      );

      await Promise.all(promises);
      setSelectedTickets([]);
      fetchTickets();
      toast.success(`${selectedTickets.length} tickets assigned successfully`);
    } catch (error) {
      console.error("Failed to bulk assign:", error);
      toast.error("Failed to assign some tickets");
    }
  };

  // Helpers
  const getCategoryInfo = (category: string) => {
    return TICKET_CATEGORIES.find((c) => c.value === category) || TICKET_CATEGORIES[TICKET_CATEGORIES.length - 1];
  };

  const getPriorityBadge = (priority: string, size: "sm" | "default" = "default") => {
    const config = PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.medium;
    return (
      <Badge 
        variant="outline" 
        className={`${config.color} flex items-center gap-1 ${size === "sm" ? "text-xs px-1.5 py-0" : ""}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${config.dotColor}`} />
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string, size: "sm" | "default" = "default") => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.open;
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} flex items-center gap-1 ${size === "sm" ? "text-xs px-1.5 py-0" : ""}`}>
        <Icon className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />
        {config.label}
      </Badge>
    );
  };

  const getTimeInfo = (ticket: Ticket) => {
    const now = new Date();
    const created = new Date(ticket.createdAt);
    const hoursElapsed = differenceInHours(now, created);
    const daysElapsed = differenceInDays(now, created);

    if (["resolved", "closed"].includes(ticket.status)) {
      return { text: `${daysElapsed}d ago`, color: "text-gray-500", urgent: false };
    }

    const expected = new Date(ticket.expectedResolutionDate);
    const isOverdue = now > expected;

    if (isOverdue) {
      const hoursOverdue = differenceInHours(now, expected);
      return { text: `${hoursOverdue}h overdue`, color: "text-red-600", urgent: true };
    }

    const hoursLeft = differenceInHours(expected, now);
    if (hoursLeft < 4) {
      return { text: `${hoursLeft}h left`, color: "text-red-500", urgent: true };
    } else if (hoursLeft < 24) {
      return { text: `${hoursLeft}h left`, color: "text-orange-500", urgent: false };
    } else {
      const daysLeft = Math.floor(hoursLeft / 24);
      return { text: `${daysLeft}d left`, color: "text-green-600", urgent: false };
    }
  };

  const copyTicketNumber = (ticketNumber: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(ticketNumber);
    toast.success("Ticket number copied");
  };

  // Filter tickets by search
  const filteredTickets = tickets;

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
          <span className="ml-3 text-muted-foreground">Loading tickets...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Support Ticket Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor, manage, and resolve all support tickets
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchTickets(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <FileText className="h-4 w-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileText className="h-4 w-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Critical Alerts */}
      {(stats?.escalated ?? 0) > 0 && (
        <Card className="border-red-400 bg-gradient-to-r from-red-50 to-orange-50 shadow-md">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center animate-pulse">
                <ShieldAlert className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-red-800 text-lg">
                  {stats?.escalated} Escalated Ticket{(stats?.escalated ?? 0) > 1 ? "s" : ""} Require Immediate Attention
                </p>
                <p className="text-sm text-red-600">
                  These tickets were not resolved by owners within 3 days
                </p>
              </div>
              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={() => {
                  setShowEscalatedOnly(true);
                  setActiveTab("escalated");
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Escalated
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${activeTab === "all" ? "ring-2 ring-purple-500" : ""}`}
          onClick={() => { setActiveTab("all"); setShowEscalatedOnly(false); setShowAssignedToMe(false); setStatusFilter("all"); }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total</p>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
              </div>
              <Inbox className="h-5 w-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-md border-l-4 border-l-red-500 ${activeTab === "escalated" ? "ring-2 ring-red-500" : ""}`}
          onClick={() => { setActiveTab("escalated"); setShowEscalatedOnly(true); setShowAssignedToMe(false); }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Escalated</p>
                <p className="text-2xl font-bold text-red-600">{stats?.escalated || 0}</p>
              </div>
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${activeTab === "unassigned" ? "ring-2 ring-orange-500" : ""}`}
          onClick={() => { setActiveTab("unassigned"); setShowEscalatedOnly(false); setShowAssignedToMe(false); }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Unassigned</p>
                <p className="text-2xl font-bold text-orange-600">{stats?.unassigned || 0}</p>
              </div>
              <UserPlus className="h-5 w-5 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${activeTab === "mine" ? "ring-2 ring-purple-500" : ""}`}
          onClick={() => { setActiveTab("mine"); setShowEscalatedOnly(false); setShowAssignedToMe(true); }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Assigned to Me</p>
                <p className="text-2xl font-bold text-purple-600">{stats?.assignedToMe || 0}</p>
              </div>
              <UserCheck className="h-5 w-5 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === "open" ? "ring-2 ring-blue-500" : ""}`}
          onClick={() => { setStatusFilter(statusFilter === "open" ? "all" : "open"); setShowEscalatedOnly(false); setShowAssignedToMe(false); }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Open</p>
                <p className="text-2xl font-bold text-blue-600">{stats?.open || 0}</p>
              </div>
              <AlertCircle className="h-5 w-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === "in_progress" ? "ring-2 ring-yellow-500" : ""}`}
          onClick={() => { setStatusFilter(statusFilter === "in_progress" ? "all" : "in_progress"); setShowEscalatedOnly(false); setShowAssignedToMe(false); }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">{stats?.inProgress || 0}</p>
              </div>
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${activeTab === "urgent" ? "ring-2 ring-red-500" : ""}`}
          onClick={() => { setActiveTab("urgent"); setPriorityFilter("urgent"); setShowEscalatedOnly(false); setShowAssignedToMe(false); }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Urgent/High</p>
                <p className="text-2xl font-bold text-red-600">{(stats?.urgent || 0) + (stats?.high || 0)}</p>
              </div>
              <Flame className="h-5 w-5 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === "resolved" ? "ring-2 ring-green-500" : ""}`}
          onClick={() => { setStatusFilter(statusFilter === "resolved" ? "all" : "resolved"); setShowEscalatedOnly(false); setShowAssignedToMe(false); }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{stats?.resolved || 0}</p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Stats */}
      {categoryStats.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Tickets by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {categoryStats.slice(0, 8).map((cat) => {
                const catInfo = getCategoryInfo(cat._id);
                const CatIcon = catInfo.icon;
                return (
                  <Button
                    key={cat._id}
                    variant={categoryFilter === cat._id ? "default" : "outline"}
                    size="sm"
                    className={categoryFilter === cat._id ? "bg-purple-600" : ""}
                    onClick={() => setCategoryFilter(categoryFilter === cat._id ? "all" : cat._id)}
                  >
                    <CatIcon className="h-3 w-3 mr-1" />
                    {catInfo.label}
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                      {cat.count}
                    </Badge>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ticket #, subject, user, or PG name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <config.icon className={`h-3 w-3 ${config.textColor}`} />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${config.dotColor}`} />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {TICKET_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center gap-2">
                        <cat.icon className={`h-3 w-3 ${cat.color}`} />
                        {cat.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2 px-3 border rounded-md">
                <Checkbox
                  id="escalated"
                  checked={showEscalatedOnly}
                  onCheckedChange={(checked) => setShowEscalatedOnly(checked as boolean)}
                />
                <label htmlFor="escalated" className="text-sm cursor-pointer">
                  Escalated Only
                </label>
              </div>

              {(statusFilter !== "all" || priorityFilter !== "all" || categoryFilter !== "all" || showEscalatedOnly || showAssignedToMe || searchQuery) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatusFilter("all");
                    setPriorityFilter("all");
                    setCategoryFilter("all");
                    setShowEscalatedOnly(false);
                    setShowAssignedToMe(false);
                    setSearchQuery("");
                    setActiveTab("all");
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card className="shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Support Tickets</CardTitle>
              <CardDescription>
                {pagination?.total || 0} ticket{(pagination?.total || 0) !== 1 ? "s" : ""} found
              </CardDescription>
            </div>
            {selectedTickets.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{selectedTickets.length} selected</Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <UserCog className="h-4 w-4 mr-1" />
                      Bulk Assign
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleBulkAssign(user?.id || "")}>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Assign to Me
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {admins.map((admin) => (
                      <DropdownMenuItem key={admin._id} onClick={() => handleBulkAssign(admin._id)}>
                        <Avatar className="h-5 w-5 mr-2">
                          <AvatarFallback className="text-xs">
                            {admin.fullName?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        {admin.fullName}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" size="sm" onClick={() => setSelectedTickets([])}>
                  Clear
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredTickets.length === 0 ? (
            <div className="text-center py-20 px-4">
              <Inbox className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Tickets Found</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {searchQuery || statusFilter !== "all" || priorityFilter !== "all" || categoryFilter !== "all" || showEscalatedOnly
                  ? "No tickets match your current filters."
                  : "No support tickets have been raised yet."}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-10">
                        <Checkbox
                          checked={selectedTickets.length === filteredTickets.length && filteredTickets.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedTickets(filteredTickets.map((t) => t._id));
                            } else {
                              setSelectedTickets([]);
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead className="min-w-[140px]">Ticket</TableHead>
                      <TableHead className="min-w-[200px]">Subject</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets.map((ticket) => {
                      const categoryInfo = getCategoryInfo(ticket.category);
                      const CategoryIcon = categoryInfo.icon;
                      const timeInfo = getTimeInfo(ticket);

                      return (
                        <TableRow
                          key={ticket._id}
                          className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                            ticket.isEscalated ? "bg-red-50/50" : ""
                          } ${ticket.priority === "urgent" ? "border-l-4 border-l-red-500" : ""}`}
                          onClick={() => fetchTicketDetails(ticket._id)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedTickets.includes(ticket._id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedTickets([...selectedTickets, ticket._id]);
                                } else {
                                  setSelectedTickets(selectedTickets.filter((id) => id !== ticket._id));
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`h-8 w-8 rounded-lg ${categoryInfo.bgColor} flex items-center justify-center`}>
                                <CategoryIcon className={`h-4 w-4 ${categoryInfo.color}`} />
                              </div>
                              <div>
                                <div className="flex items-center gap-1">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          className="font-mono text-xs text-purple-600 hover:text-purple-700 font-medium"
                                          onClick={(e) => copyTicketNumber(ticket.ticketNumber, e)}
                                        >
                                          {ticket.ticketNumber}
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent>Click to copy</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  {ticket.isEscalated && (
                                    <Badge className="bg-red-600 text-white text-[10px] px-1 py-0">
                                      ESC
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-[10px] text-muted-foreground">
                                  {categoryInfo.label}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[200px]">
                              <p className="font-medium text-sm truncate">{ticket.subject}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarImage src={ticket.userId?.profileImage} />
                                <AvatarFallback className="text-xs bg-purple-100 text-purple-600">
                                  {ticket.userId?.fullName?.charAt(0) || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium truncate max-w-[100px]">
                                  {ticket.userId?.fullName || "Unknown"}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {ticket.listingId ? (
                              <div className="max-w-[120px]">
                                <p className="text-sm font-medium truncate">
                                  {ticket.listingId.pgName}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {ticket.listingId.location?.city}
                                </p>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>{getPriorityBadge(ticket.priority, "sm")}</TableCell>
                          <TableCell>{getStatusBadge(ticket.status, "sm")}</TableCell>
                          <TableCell>
                            {ticket.assignedTo ? (
                              <div className="flex items-center gap-1">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-[10px] bg-gray-100">
                                    {ticket.assignedTo.fullName?.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs truncate max-w-[60px]">
                                  {ticket.assignedTo._id === user?.id ? "You" : ticket.assignedTo.fullName?.split(" ")[0]}
                                </span>
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-orange-600 border-orange-300 text-[10px]">
                                Unassigned
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className={`text-xs font-medium ${timeInfo.color}`}>
                              {timeInfo.text}
                            </span>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => fetchTicketDetails(ticket._id)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => {
                                  setSelectedTicket(ticket);
                                  handleAssignTicket(user?.id);
                                }}>
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Assign to Me
                                </DropdownMenuItem>
                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger>
                                    <Flag className="h-4 w-4 mr-2" />
                                    Change Priority
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent>
                                    {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                                      <DropdownMenuItem
                                        key={key}
                                        onClick={async () => {
                                          try {
                                            await axios.post(`/api/admin/tickets/${ticket._id}`, {
                                              action: "update_priority",
                                              adminId: user?.id,
                                              priority: key,
                                            });
                                            fetchTickets();
                                            toast.success(`Priority updated to ${config.label}`);
                                          } catch {
                                            toast.error("Failed to update priority");
                                          }
                                        }}
                                      >
                                        <span className={`h-2 w-2 rounded-full ${config.dotColor} mr-2`} />
                                        {config.label}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          className={currentPage === pageNum ? "bg-purple-600" : ""}
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === pagination.totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Ticket Details Sheet */}
      <Sheet open={showTicketSheet} onOpenChange={setShowTicketSheet}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {loadingTicketDetails ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : selectedTicket ? (
            <div className="space-y-6">
              <SheetHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <SheetTitle className="text-lg">{selectedTicket.ticketNumber}</SheetTitle>
                      {getPriorityBadge(selectedTicket.priority)}
                      {getStatusBadge(selectedTicket.status)}
                      {selectedTicket.isEscalated && (
                        <Badge className="bg-red-600 text-white">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Escalated
                        </Badge>
                      )}
                    </div>
                    <SheetDescription className="text-base font-medium text-gray-900">
                      {selectedTicket.subject}
                    </SheetDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyTicketNumber(selectedTicket.ticketNumber)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </SheetHeader>

              {/* Quick Actions Bar */}
              {!["resolved", "closed"].includes(selectedTicket.status) && (
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => setShowResolveDialog(true)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Resolve
                  </Button>
                  {!selectedTicket.assignedTo || selectedTicket.assignedTo._id !== user?.id ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAssignTicket(user?.id)}
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      Assign to Me
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAssignDialog(true)}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Reassign
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline">
                        <SlidersHorizontal className="h-4 w-4 mr-1" />
                        More
                        <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleUpdateStatus("in_progress")}>
                        <Clock className="h-4 w-4 mr-2 text-yellow-600" />
                        In Progress
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateStatus("waiting_response")}>
                        <MessageCircle className="h-4 w-4 mr-2 text-purple-600" />
                        Awaiting User
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Change Priority</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                        <DropdownMenuItem key={key} onClick={() => handleUpdatePriority(key)}>
                          <span className={`h-2 w-2 rounded-full ${config.dotColor} mr-2`} />
                          {config.label}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={handleCloseTicket}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Close Ticket
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}

              {/* Metrics */}
              {ticketMetrics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Time Elapsed</p>
                    <p className="font-semibold">
                      {ticketMetrics.daysElapsed}d {ticketMetrics.hoursElapsed % 24}h
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${ticketMetrics.isOverdue ? "bg-red-50" : "bg-gray-50"}`}>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className={`font-semibold ${ticketMetrics.isOverdue ? "text-red-600" : "text-green-600"}`}>
                      {ticketMetrics.isOverdue ? "Overdue" : "On Track"}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-muted-foreground">First Response</p>
                    <p className={`font-semibold ${ticketMetrics.responseTimeHours === null ? "text-orange-600" : "text-green-600"}`}>
                      {ticketMetrics.responseTimeHours !== null ? `${ticketMetrics.responseTimeHours}h` : "Pending"}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${ticketMetrics.isEscalated ? "bg-red-50" : "bg-gray-50"}`}>
                    <p className="text-xs text-muted-foreground">Escalation</p>
                    <p className={`font-semibold ${ticketMetrics.isEscalated ? "text-red-600" : ""}`}>
                      {ticketMetrics.isEscalated ? `${ticketMetrics.escalatedDaysAgo}d ago` : "Not escalated"}
                    </p>
                  </div>
                </div>
              )}

              {/* Category & Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {(() => {
                    const cat = getCategoryInfo(selectedTicket.category);
                    const CatIcon = cat.icon;
                    return (
                      <>
                        <div className={`h-10 w-10 rounded-lg ${cat.bgColor} flex items-center justify-center`}>
                          <CatIcon className={`h-5 w-5 ${cat.color}`} />
                        </div>
                        <div>
                          <p className="font-medium">{cat.label}</p>
                          <p className="text-sm text-muted-foreground">
                            Created {format(new Date(selectedTicket.createdAt), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Description */}
                <div>
                  <Label className="text-sm text-muted-foreground">Description</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    <p className="whitespace-pre-wrap text-sm">{selectedTicket.description}</p>
                  </div>
                </div>

                {/* Resolution */}
                {selectedTicket.resolution && (
                  <div>
                    <Label className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      Resolution
                    </Label>
                    <div className="mt-1 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="whitespace-pre-wrap text-sm text-green-800">{selectedTicket.resolution}</p>
                      {selectedTicket.resolvedAt && (
                        <p className="text-xs text-green-600 mt-2">
                          Resolved by {selectedTicket.resolvedBy?.fullName || "Admin"} on{" "}
                          {format(new Date(selectedTicket.resolvedAt), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Satisfaction */}
                {selectedTicket.satisfactionRating && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
                    <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                    <span className="font-medium">User Rating: {selectedTicket.satisfactionRating}/5</span>
                    {selectedTicket.satisfactionFeedback && (
                      <span className="text-sm text-muted-foreground">- &quot;{selectedTicket.satisfactionFeedback}&quot;</span>
                    )}
                  </div>
                )}

                {/* Escalation Info */}
                {selectedTicket.isEscalated && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700 font-medium mb-1">
                      <AlertTriangle className="h-4 w-4" />
                      Escalated Ticket
                    </div>
                    <p className="text-sm text-red-600">{selectedTicket.escalationReason}</p>
                    {selectedTicket.escalatedAt && (
                      <p className="text-xs text-red-500 mt-1">
                        Escalated on {format(new Date(selectedTicket.escalatedAt), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    )}
                  </div>
                )}

                <Separator />

                {/* User & Property Info */}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* User Info */}
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm text-muted-foreground">User</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={selectedTicket.userId?.profileImage} />
                          <AvatarFallback className="bg-purple-100 text-purple-600">
                            {selectedTicket.userId?.fullName?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{selectedTicket.userId?.fullName}</p>
                          <p className="text-xs text-muted-foreground truncate">{selectedTicket.userId?.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => window.open(`tel:${selectedTicket.userId?.phone}`)}
                        >
                          <Phone className="h-3 w-3 mr-1" />
                          Call
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => window.open(`mailto:${selectedTicket.userId?.email}`)}
                        >
                          <Mail className="h-3 w-3 mr-1" />
                          Email
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Property Info */}
                  {selectedTicket.listingId && (
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm text-muted-foreground">Property</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                            {selectedTicket.listingId.images?.[0] ? (
                              <img
                                src={selectedTicket.listingId.images[0]}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Building className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{selectedTicket.listingId.pgName}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {selectedTicket.listingId.location?.area}, {selectedTicket.listingId.location?.city}
                            </p>
                          </div>
                        </div>
                        {selectedTicket.listingId.ownerId && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-muted-foreground mb-1">Owner</p>
                            <p className="text-sm font-medium">{selectedTicket.listingId.ownerId.fullName}</p>
                            <p className="text-xs text-muted-foreground">{selectedTicket.listingId.ownerId.phone}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* User Ticket History */}
                {userHistory.length > 0 && (
                  <div>
                    <Label className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                      <History className="h-4 w-4" />
                      User&apos;s Other Tickets ({userHistory.length})
                    </Label>
                    <div className="space-y-2">
                      {userHistory.map((hist) => (
                        <div
                          key={hist.ticketNumber}
                          className="p-2 bg-gray-50 rounded-lg flex items-center justify-between text-sm"
                        >
                          <div>
                            <span className="font-mono text-xs text-purple-600">{hist.ticketNumber}</span>
                            <span className="mx-2">-</span>
                            <span className="truncate max-w-[200px]">{hist.subject}</span>
                          </div>
                          {getStatusBadge(hist.status, "sm")}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Conversation */}
                <div>
                  <Label className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
                    <MessageSquare className="h-4 w-4" />
                    Conversation ({selectedTicket.comments.length})
                  </Label>

                  {selectedTicket.comments.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <MessageCircle className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-muted-foreground text-sm">No responses yet</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-3 pr-4">
                        {selectedTicket.comments.map((comment, index) => (
                          <div
                            key={comment._id || index}
                            className={`flex gap-2 ${
                              comment.userRole === "admin" ? "flex-row-reverse" : ""
                            }`}
                          >
                            <Avatar className="h-7 w-7 shrink-0">
                              <AvatarFallback
                                className={`text-xs ${
                                  comment.userRole === "admin"
                                    ? "bg-purple-100 text-purple-600"
                                    : comment.userRole === "owner"
                                    ? "bg-orange-100 text-orange-600"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {comment.userName?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`max-w-[80%] ${comment.userRole === "admin" ? "items-end" : ""}`}>
                              <div
                                className={`p-2.5 rounded-lg text-sm ${
                                  comment.userRole === "admin"
                                    ? "bg-purple-600 text-white rounded-tr-none"
                                    : comment.userRole === "owner"
                                    ? "bg-orange-100 text-orange-900 rounded-tl-none"
                                    : "bg-gray-100 text-gray-800 rounded-tl-none"
                                }`}
                              >
                                <p className="whitespace-pre-wrap">{comment.message}</p>
                              </div>
                              <p className={`text-[10px] text-muted-foreground mt-0.5 ${
                                comment.userRole === "admin" ? "text-right" : ""
                              }`}>
                                {comment.userName}
                                {comment.userRole === "admin" && " (Admin)"}
                                {comment.userRole === "owner" && " (Owner)"}
                                {" • "}
                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}

                  {/* Reply Box */}
                  {!["resolved", "closed"].includes(selectedTicket.status) && (
                    <div className="flex gap-2 mt-4">
                      <Input
                        placeholder="Type your response..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleAddComment()}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleAddComment}
                        disabled={!newComment.trim() || sendingComment}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {sendingComment ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Resolve Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Resolve Ticket
            </DialogTitle>
            <DialogDescription>
              Provide resolution details for {selectedTicket?.ticketNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Resolution Details *</Label>
              <Textarea
                placeholder="Describe how the issue was resolved..."
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={5}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolveDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleResolve}
              disabled={!resolution.trim() || resolving}
              className="bg-green-600 hover:bg-green-700"
            >
              {resolving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Resolving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Resolve Ticket
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-purple-600" />
              Assign Ticket
            </DialogTitle>
            <DialogDescription>
              Assign {selectedTicket?.ticketNumber} to an admin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Select Assignee</Label>
              <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Choose an admin..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={user?.id || ""}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs bg-purple-100 text-purple-600">
                          {user?.fullName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      {user?.fullName} (Me)
                    </div>
                  </SelectItem>
                  {admins
                    .filter((a) => a._id !== user?.id)
                    .map((admin) => (
                      <SelectItem key={admin._id} value={admin._id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-gray-100">
                              {admin.fullName?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          {admin.fullName}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTicket?.assignedTo && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Currently assigned to:</p>
                <p className="font-medium">{selectedTicket.assignedTo.fullName}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleAssignTicket()}
              disabled={!selectedAssignee || assigning}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {assigning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Assigning...
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Assign
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}