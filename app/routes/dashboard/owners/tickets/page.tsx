// app/routes/dashboard/owners/tickets/page.tsx
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
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  Phone,
  Mail,
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Send,
  User,
  Building,
  Star,
  ChevronRight,
  ChevronLeft,
  FileText,
  Search,
  Filter,
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
  Calendar,
  Timer,
  TrendingUp,
  TrendingDown,
  Inbox,
  CheckCheck,
  ArrowUpRight,
  Bell,
  Zap,
  ExternalLink,
  Copy,
  UserCheck,
  ClipboardList,
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
  };
  listingId?: {
    _id: string;
    pgName: string;
    location: { area: string; city: string };
    images?: string[];
  };
  bookingId?: {
    _id: string;
    roomType: string;
    moveInDate: string;
    status: string;
  };
  assignedTo?: {
    _id: string;
    fullName: string;
    email: string;
  };
  resolution: string;
  resolvedAt: string | null;
  satisfactionRating: number | null;
}

interface Comment {
  _id: string;
  userId: string;
  userRole: string;
  userName: string;
  message: string;
  createdAt: string;
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
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Constants
const TICKET_CATEGORIES = [
  { value: "maintenance", label: "Maintenance Issue", icon: Wrench, color: "text-orange-600" },
  { value: "food_complaint", label: "Food Complaint", icon: Utensils, color: "text-red-600" },
  { value: "cleanliness", label: "Cleanliness Issue", icon: Sparkles, color: "text-blue-600" },
  { value: "security", label: "Security Concern", icon: Shield, color: "text-purple-600" },
  { value: "noise_complaint", label: "Noise Complaint", icon: Volume2, color: "text-yellow-600" },
  { value: "roommate_issue", label: "Roommate Issue", icon: Users, color: "text-pink-600" },
  { value: "billing_payment", label: "Billing/Payment", icon: CreditCard, color: "text-green-600" },
  { value: "wifi_internet", label: "WiFi/Internet", icon: Wifi, color: "text-cyan-600" },
  { value: "water_electricity", label: "Water/Electricity", icon: Droplets, color: "text-blue-500" },
  { value: "furniture_appliance", label: "Furniture/Appliance", icon: Sofa, color: "text-amber-600" },
  { value: "booking_issue", label: "Booking Issue", icon: FileText, color: "text-indigo-600" },
  { value: "refund_request", label: "Refund Request", icon: CreditCard, color: "text-red-500" },
  { value: "general_inquiry", label: "General Inquiry", icon: HelpCircle, color: "text-gray-600" },
  { value: "suggestion", label: "Suggestion", icon: Lightbulb, color: "text-yellow-500" },
  { value: "other", label: "Other", icon: MoreHorizontal, color: "text-gray-500" },
];

const PRIORITY_CONFIG = {
  low: { label: "Low", color: "bg-gray-100 text-gray-700 border-gray-300", dotColor: "bg-gray-400" },
  medium: { label: "Medium", color: "bg-blue-100 text-blue-700 border-blue-300", dotColor: "bg-blue-500" },
  high: { label: "High", color: "bg-orange-100 text-orange-700 border-orange-300", dotColor: "bg-orange-500" },
  urgent: { label: "Urgent", color: "bg-red-100 text-red-700 border-red-300", dotColor: "bg-red-500" },
};

const STATUS_CONFIG = {
  open: { label: "Open", color: "bg-blue-100 text-blue-700", icon: AlertCircle },
  in_progress: { label: "In Progress", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  waiting_response: { label: "Awaiting User", color: "bg-purple-100 text-purple-700", icon: MessageCircle },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  closed: { label: "Closed", color: "bg-gray-100 text-gray-700", icon: XCircle },
  reopened: { label: "Reopened", color: "bg-orange-100 text-orange-700", icon: RefreshCw },
};

export default function OwnerTicketsPage() {
  const { user } = useUserStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [overdueCount, setOverdueCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Selected ticket for details
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketMetrics, setTicketMetrics] = useState<{
    hoursElapsed: number;
    daysElapsed: number;
    isOverdue: boolean;
    hoursOverdue: number;
    hoursUntilEscalation: number;
    willEscalateAt: string;
  } | null>(null);
  const [showTicketDetails, setShowTicketDetails] = useState(false);
  const [loadingTicketDetails, setLoadingTicketDetails] = useState(false);

  // Actions
  const [newComment, setNewComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolution, setResolution] = useState("");
  const [resolving, setResolving] = useState(false);
  const [showRequestInfoDialog, setShowRequestInfoDialog] = useState(false);
  const [requestInfoMessage, setRequestInfoMessage] = useState("");

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
        ownerId: user.id,
        page: currentPage.toString(),
        limit: "10",
      });

      if (statusFilter !== "all") params.append("status", statusFilter);
      if (priorityFilter !== "all") params.append("priority", priorityFilter);
      if (categoryFilter !== "all") params.append("category", categoryFilter);

      const response = await axios.get(`/api/owner/tickets?${params.toString()}`);

      if (response.data.success) {
        setTickets(response.data.data);
        setStats(response.data.stats);
        setPagination(response.data.pagination);
        setOverdueCount(response.data.overdueCount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, currentPage, statusFilter, priorityFilter, categoryFilter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Fetch single ticket details
  const fetchTicketDetails = async (ticketId: string) => {
    try {
      setLoadingTicketDetails(true);
      const response = await axios.get(`/api/owner/tickets/${ticketId}?ownerId=${user?.id}`);

      if (response.data.success) {
        setSelectedTicket(response.data.data);
        setTicketMetrics(response.data.metrics);
        setShowTicketDetails(true);
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
      const response = await axios.post(`/api/owner/tickets/${selectedTicket._id}`, {
        action: "add_comment",
        ownerId: user?.id,
        ownerName: user?.fullName,
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
      const response = await axios.post(`/api/owner/tickets/${selectedTicket._id}`, {
        action: "resolve",
        ownerId: user?.id,
        ownerName: user?.fullName,
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

  // Request more info
  const handleRequestInfo = async () => {
    if (!selectedTicket) return;

    try {
      const response = await axios.post(`/api/owner/tickets/${selectedTicket._id}`, {
        action: "request_more_info",
        ownerId: user?.id,
        ownerName: user?.fullName,
        message: requestInfoMessage || "Please provide more information to help us resolve your issue.",
      });

      if (response.data.success) {
        setSelectedTicket(response.data.data);
        setShowRequestInfoDialog(false);
        setRequestInfoMessage("");
        fetchTickets();
        toast.success("Information request sent");
      }
    } catch (error) {
      console.error("Failed to request info:", error);
      toast.error("Failed to send request");
    }
  };

  // Update status
  const handleUpdateStatus = async (status: string) => {
    if (!selectedTicket) return;

    try {
      const response = await axios.post(`/api/owner/tickets/${selectedTicket._id}`, {
        action: "update_status",
        ownerId: user?.id,
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

  // Helpers
  const getCategoryInfo = (category: string) => {
    return TICKET_CATEGORIES.find((c) => c.value === category) || TICKET_CATEGORIES[TICKET_CATEGORIES.length - 1];
  };

  const getPriorityBadge = (priority: string) => {
    const config = PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.medium;
    return (
      <Badge variant="outline" className={`${config.color} flex items-center gap-1`}>
        <span className={`h-2 w-2 rounded-full ${config.dotColor}`} />
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.open;
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getTimeRemaining = (ticket: Ticket) => {
    if (["resolved", "closed"].includes(ticket.status)) return null;
    
    const now = new Date();
    const expected = new Date(ticket.expectedResolutionDate);
    const diff = expected.getTime() - now.getTime();
    
    if (diff < 0) {
      const hoursOverdue = Math.abs(Math.floor(diff / (1000 * 60 * 60)));
      return { isOverdue: true, text: `${hoursOverdue}h overdue`, color: "text-red-600" };
    }
    
    const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
    if (hoursLeft < 4) {
      return { isOverdue: false, text: `${hoursLeft}h left`, color: "text-red-500" };
    } else if (hoursLeft < 24) {
      return { isOverdue: false, text: `${hoursLeft}h left`, color: "text-orange-500" };
    } else {
      const daysLeft = Math.floor(hoursLeft / 24);
      return { isOverdue: false, text: `${daysLeft}d left`, color: "text-green-600" };
    }
  };

  const copyTicketNumber = (ticketNumber: string) => {
    navigator.clipboard.writeText(ticketNumber);
    toast.success("Ticket number copied");
  };

  // Filter tickets by search
  const filteredTickets = tickets.filter((ticket) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      ticket.ticketNumber.toLowerCase().includes(search) ||
      ticket.subject.toLowerCase().includes(search) ||
      ticket.userId?.fullName?.toLowerCase().includes(search) ||
      ticket.listingId?.pgName?.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-muted-foreground">Loading support tickets...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-orange-600">Support Tickets</h1>
          <p className="text-muted-foreground mt-1">
            Manage and resolve tenant support requests
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
        </div>
      </div>

      {/* Alert for escalated/overdue tickets */}
      {(stats?.escalated ?? 0) > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div className="flex-1">
                <p className="font-semibold text-red-800">
                  {stats?.escalated} ticket(s) have been escalated to admin
                </p>
                <p className="text-sm text-red-600">
                  These tickets were not resolved within 3 days and have been escalated for admin intervention.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {overdueCount > 0 && (
        <Card className="border-orange-300 bg-orange-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Timer className="h-6 w-6 text-orange-600" />
              <div className="flex-1">
                <p className="font-semibold text-orange-800">
                  {overdueCount} ticket(s) are overdue
                </p>
                <p className="text-sm text-orange-600">
                  Please resolve these tickets to avoid escalation to admin.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-orange-500 text-orange-600 hover:bg-orange-100"
                onClick={() => {
                  setStatusFilter("all");
                  setPriorityFilter("all");
                }}
              >
                View Overdue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setStatusFilter("all")}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total</p>
                <p className="text-2xl font-bold text-gray-800">{stats?.total || 0}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Inbox className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer ${statusFilter === "open" ? "ring-2 ring-blue-500" : ""}`}
          onClick={() => setStatusFilter(statusFilter === "open" ? "all" : "open")}
        >
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Open</p>
                <p className="text-2xl font-bold text-blue-600">{stats?.open || 0}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer ${statusFilter === "in_progress" ? "ring-2 ring-yellow-500" : ""}`}
          onClick={() => setStatusFilter(statusFilter === "in_progress" ? "all" : "in_progress")}
        >
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">{stats?.inProgress || 0}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer ${statusFilter === "waiting_response" ? "ring-2 ring-purple-500" : ""}`}
          onClick={() => setStatusFilter(statusFilter === "waiting_response" ? "all" : "waiting_response")}
        >
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Awaiting</p>
                <p className="text-2xl font-bold text-purple-600">{stats?.waitingResponse || 0}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer ${statusFilter === "resolved" ? "ring-2 ring-green-500" : ""}`}
          onClick={() => setStatusFilter(statusFilter === "resolved" ? "all" : "resolved")}
        >
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{stats?.resolved || 0}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setPriorityFilter(priorityFilter === "urgent" ? "all" : "urgent")}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Urgent</p>
                <p className="text-2xl font-bold text-red-600">{stats?.urgent || 0}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <Zap className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white shadow-sm">
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ticket #, subject, tenant name, or PG..."
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
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="waiting_response">Awaiting Response</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {TICKET_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(statusFilter !== "all" || priorityFilter !== "all" || categoryFilter !== "all" || searchQuery) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatusFilter("all");
                    setPriorityFilter("all");
                    setCategoryFilter("all");
                    setSearchQuery("");
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card className="bg-white shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Support Tickets</CardTitle>
              <CardDescription>
                {pagination?.total || 0} ticket(s) found
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTickets.length === 0 ? (
            <div className="text-center py-16">
              <Inbox className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Tickets Found</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {searchQuery || statusFilter !== "all" || priorityFilter !== "all" || categoryFilter !== "all"
                  ? "No tickets match your current filters. Try adjusting your search criteria."
                  : "Great news! You don't have any support tickets yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTickets.map((ticket) => {
                const categoryInfo = getCategoryInfo(ticket.category);
                const CategoryIcon = categoryInfo.icon;
                const timeRemaining = getTimeRemaining(ticket);

                return (
                  <div
                    key={ticket._id}
                    className={`border rounded-lg p-4 hover:bg-gray-50 transition-all cursor-pointer ${
                      ticket.isEscalated ? "border-red-300 bg-red-50/50" : ""
                    } ${ticket.priority === "urgent" ? "border-l-4 border-l-red-500" : ""}`}
                    onClick={() => fetchTicketDetails(ticket._id)}
                  >
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      {/* Left: Category Icon & Ticket Info */}
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 ${categoryInfo.color}`}>
                          <CategoryIcon className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    className="font-mono text-sm text-orange-600 hover:text-orange-700 font-medium"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyTicketNumber(ticket.ticketNumber);
                                    }}
                                  >
                                    {ticket.ticketNumber}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>Click to copy</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            {getPriorityBadge(ticket.priority)}
                            {getStatusBadge(ticket.status)}
                            {ticket.isEscalated && (
                              <Badge className="bg-red-600 text-white">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Escalated
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-medium text-gray-900 truncate">{ticket.subject}</h4>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {ticket.userId?.fullName || "Unknown"}
                            </span>
                            {ticket.listingId && (
                              <span className="flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                {ticket.listingId.pgName}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Time & Actions */}
                      <div className="flex items-center gap-3 md:flex-col md:items-end">
                        {timeRemaining && (
                          <div className={`text-sm font-medium ${timeRemaining.color} flex items-center gap-1`}>
                            <Timer className="h-4 w-4" />
                            {timeRemaining.text}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          {ticket.comments.length > 0 && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {ticket.comments.length}
                            </Badge>
                          )}
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
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
                  Previous
                </Button>
                <span className="text-sm px-2">
                  Page {currentPage} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === pagination.totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Details Dialog */}
      <Dialog open={showTicketDetails} onOpenChange={setShowTicketDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          {loadingTicketDetails ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : selectedTicket ? (
            <>
              {/* Header */}
              <div className="p-6 border-b bg-gray-50">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h2 className="text-xl font-bold text-gray-900">{selectedTicket.ticketNumber}</h2>
                      {getPriorityBadge(selectedTicket.priority)}
                      {getStatusBadge(selectedTicket.status)}
                      {selectedTicket.isEscalated && (
                        <Badge className="bg-red-600 text-white">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Escalated
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-lg text-gray-700">{selectedTicket.subject}</h3>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        {(() => {
                          const cat = getCategoryInfo(selectedTicket.category);
                          const CatIcon = cat.icon;
                          return (
                            <>
                              <CatIcon className={`h-4 w-4 ${cat.color}`} />
                              {cat.label}
                            </>
                          );
                        })()}
                      </span>
                      <span>•</span>
                      <span>Created {format(new Date(selectedTicket.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  {!["resolved", "closed"].includes(selectedTicket.status) && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => setShowResolveDialog(true)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Resolve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowRequestInfoDialog(true)}
                      >
                        <HelpCircle className="h-4 w-4 mr-1" />
                        Request Info
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleUpdateStatus("in_progress")}>
                            <Clock className="h-4 w-4 mr-2" />
                            Mark In Progress
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus("waiting_response")}>
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Awaiting User Response
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>

                {/* Time Metrics Bar */}
                {ticketMetrics && !["resolved", "closed"].includes(selectedTicket.status) && (
                  <div className="mt-4 p-3 bg-white rounded-lg border">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Time Elapsed</p>
                        <p className="font-semibold">
                          {ticketMetrics.daysElapsed}d {ticketMetrics.hoursElapsed % 24}h
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Expected Resolution</p>
                        <p className={`font-semibold ${ticketMetrics.isOverdue ? "text-red-600" : "text-green-600"}`}>
                          {format(new Date(selectedTicket.expectedResolutionDate), "MMM d, h:mm a")}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Escalation In</p>
                        <p className={`font-semibold ${ticketMetrics.hoursUntilEscalation < 24 ? "text-orange-600" : ""}`}>
                          {ticketMetrics.hoursUntilEscalation > 0 ? `${Math.floor(ticketMetrics.hoursUntilEscalation / 24)}d ${ticketMetrics.hoursUntilEscalation % 24}h` : "Escalated"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">First Response</p>
                        <p className={`font-semibold ${!selectedTicket.firstResponseAt ? "text-orange-600" : "text-green-600"}`}>
                          {selectedTicket.firstResponseAt
                            ? formatDistanceToNow(new Date(selectedTicket.firstResponseAt), { addSuffix: true })
                            : "Pending"}
                        </p>
                      </div>
                    </div>
                    {ticketMetrics.isOverdue && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-red-600 text-sm flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4" />
                          This ticket is {ticketMetrics.hoursOverdue} hours overdue!
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Content */}
              <ScrollArea className="flex-1 p-6">
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Left Column - Ticket Details & Conversation */}
                  <div className="md:col-span-2 space-y-6">
                    {/* Description */}
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Description</h4>
                      <div className="p-4 bg-gray-50 rounded-lg border">
                        <p className="whitespace-pre-wrap text-gray-600">{selectedTicket.description}</p>
                      </div>
                    </div>

                    {/* Resolution (if resolved) */}
                    {selectedTicket.resolution && (
                      <div>
                        <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5" />
                          Resolution
                        </h4>
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <p className="whitespace-pre-wrap text-green-800">{selectedTicket.resolution}</p>
                          {selectedTicket.resolvedAt && (
                            <p className="text-sm text-green-600 mt-2">
                              Resolved on {format(new Date(selectedTicket.resolvedAt), "MMM d, yyyy 'at' h:mm a")}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Satisfaction Rating */}
                    {selectedTicket.satisfactionRating && (
                      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="font-medium text-yellow-800 flex items-center gap-2">
                          <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                          User rated this resolution: {selectedTicket.satisfactionRating}/5 stars
                        </p>
                      </div>
                    )}

                    <Separator />

                    {/* Conversation */}
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Conversation ({selectedTicket.comments.length})
                      </h4>

                      {selectedTicket.comments.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                          <MessageCircle className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                          <p className="text-muted-foreground">No responses yet</p>
                          <p className="text-sm text-gray-400">Be the first to respond to this ticket</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {selectedTicket.comments.map((comment, index) => (
                            <div
                              key={comment._id || index}
                              className={`flex gap-3 ${
                                comment.userRole === "owner" ? "flex-row-reverse" : ""
                              }`}
                            >
                              <Avatar className="h-8 w-8 shrink-0">
                                <AvatarFallback
                                  className={
                                    comment.userRole === "owner"
                                      ? "bg-orange-100 text-orange-600"
                                      : comment.userRole === "admin"
                                      ? "bg-purple-100 text-purple-600"
                                      : "bg-gray-100 text-gray-600"
                                  }
                                >
                                  {comment.userName?.charAt(0) || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div
                                className={`max-w-[75%] ${
                                  comment.userRole === "owner" ? "items-end" : ""
                                }`}
                              >
                                <div
                                  className={`p-3 rounded-lg ${
                                    comment.userRole === "owner"
                                      ? "bg-orange-500 text-white rounded-tr-none"
                                      : comment.userRole === "admin"
                                      ? "bg-purple-100 text-purple-900 rounded-tl-none"
                                      : "bg-gray-100 text-gray-800 rounded-tl-none"
                                  }`}
                                >
                                  <p className="text-sm whitespace-pre-wrap">{comment.message}</p>
                                </div>
                                <p
                                  className={`text-xs text-muted-foreground mt-1 ${
                                    comment.userRole === "owner" ? "text-right" : ""
                                  }`}
                                >
                                  {comment.userName}
                                  {comment.userRole === "admin" && " (Admin)"}
                                  {" • "}
                                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reply Box */}
                      {!["resolved", "closed"].includes(selectedTicket.status) && (
                        <div className="mt-4 flex gap-2">
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
                            className="bg-orange-500 hover:bg-orange-600"
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

                  {/* Right Column - Tenant & PG Info */}
                  <div className="space-y-6">
                    {/* Tenant Info */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Tenant Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-3 mb-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={selectedTicket.userId?.profileImage} />
                            <AvatarFallback className="bg-orange-100 text-orange-600">
                              {selectedTicket.userId?.fullName?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{selectedTicket.userId?.fullName || "Unknown"}</p>
                            <p className="text-sm text-muted-foreground">Tenant</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          {selectedTicket.userId?.email && (
                            <a
                              href={`mailto:${selectedTicket.userId.email}`}
                              className="flex items-center gap-2 text-muted-foreground hover:text-orange-600"
                            >
                              <Mail className="h-4 w-4" />
                              {selectedTicket.userId.email}
                            </a>
                          )}
                          {selectedTicket.userId?.phone && (
                            <a
                              href={`tel:${selectedTicket.userId.phone}`}
                              className="flex items-center gap-2 text-muted-foreground hover:text-orange-600"
                            >
                              <Phone className="h-4 w-4" />
                              {selectedTicket.userId.phone}
                            </a>
                          )}
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => window.open(`tel:${selectedTicket.userId?.phone}`)}
                          >
                            <Phone className="h-4 w-4 mr-1" />
                            Call
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => window.open(`mailto:${selectedTicket.userId?.email}`)}
                          >
                            <Mail className="h-4 w-4 mr-1" />
                            Email
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* PG Info */}
                    {selectedTicket.listingId && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            Related Property
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                              {selectedTicket.listingId.images?.[0] ? (
                                <img
                                  src={selectedTicket.listingId.images[0]}
                                  alt={selectedTicket.listingId.pgName}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Building className="h-6 w-6 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold">{selectedTicket.listingId.pgName}</p>
                              <p className="text-sm text-muted-foreground">
                                {selectedTicket.listingId.location?.area},{" "}
                                {selectedTicket.listingId.location?.city}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Booking Info */}
                    {selectedTicket.bookingId && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            Booking Details
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Room Type</span>
                            <span className="font-medium capitalize">
                              {selectedTicket.bookingId.roomType?.replace("_", " ")}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Move-in Date</span>
                            <span className="font-medium">
                              {format(new Date(selectedTicket.bookingId.moveInDate), "MMM d, yyyy")}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Status</span>
                            <Badge variant="outline" className="capitalize">
                              {selectedTicket.bookingId.status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Escalation Info */}
                    {selectedTicket.isEscalated && (
                      <Card className="border-red-300 bg-red-50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Escalation Details
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-2">
                          <p className="text-red-600">{selectedTicket.escalationReason}</p>
                          {selectedTicket.escalatedAt && (
                            <p className="text-red-500 text-xs">
                              Escalated on {format(new Date(selectedTicket.escalatedAt), "MMM d, yyyy 'at' h:mm a")}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Ticket</DialogTitle>
            <DialogDescription>
              Provide resolution details for ticket {selectedTicket?.ticketNumber}
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
                  Mark as Resolved
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Info Dialog */}
      <Dialog open={showRequestInfoDialog} onOpenChange={setShowRequestInfoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request More Information</DialogTitle>
            <DialogDescription>
              Ask the tenant for additional details to help resolve their issue
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Message (Optional)</Label>
              <Textarea
                placeholder="What additional information do you need?"
                value={requestInfoMessage}
                onChange={(e) => setRequestInfoMessage(e.target.value)}
                rows={4}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to send a default request message
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestInfoDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRequestInfo} className="bg-orange-500 hover:bg-orange-600">
              <HelpCircle className="h-4 w-4 mr-2" />
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}