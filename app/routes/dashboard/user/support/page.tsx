// app/routes/dashboard/user/support/page.tsx
"use client";

import { useState, useEffect } from "react";
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
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  Phone,
  Mail,
  MessageCircle,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Send,
  Paperclip,
  User,
  Building,
  Star,
  ExternalLink,
  ChevronRight,
  Headphones,
  FileText,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
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
  Eye,
  MessageSquare,
} from "lucide-react";
import { useUserStore } from "@/store/userStore";
import axios from "axios";
import { toast } from "sonner";

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
  comments: Comment[];
  listingId?: {
    _id: string;
    pgName: string;
    location: { area: string; city: string };
    ownerId?: {
      fullName: string;
      email: string;
      phone: string;
    };
  };
  bookingId?: {
    _id: string;
    roomType: string;
  };
  resolution: string;
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

interface OwnerContact {
  listingId: string;
  pgName: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  location: string;
}

const TICKET_CATEGORIES = [
  { value: "maintenance", label: "Maintenance Issue", icon: Wrench },
  { value: "food_complaint", label: "Food Complaint", icon: Utensils },
  { value: "cleanliness", label: "Cleanliness Issue", icon: Sparkles },
  { value: "security", label: "Security Concern", icon: Shield },
  { value: "noise_complaint", label: "Noise Complaint", icon: Volume2 },
  { value: "roommate_issue", label: "Roommate Issue", icon: Users },
  { value: "billing_payment", label: "Billing/Payment", icon: CreditCard },
  { value: "wifi_internet", label: "WiFi/Internet", icon: Wifi },
  { value: "water_electricity", label: "Water/Electricity", icon: Droplets },
  { value: "furniture_appliance", label: "Furniture/Appliance", icon: Sofa },
  { value: "booking_issue", label: "Booking Issue", icon: FileText },
  { value: "refund_request", label: "Refund Request", icon: CreditCard },
  { value: "general_inquiry", label: "General Inquiry", icon: HelpCircle },
  { value: "suggestion", label: "Suggestion", icon: Lightbulb },
  { value: "other", label: "Other", icon: MoreHorizontal },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low", color: "bg-gray-100 text-gray-800", description: "72 hours response" },
  { value: "medium", label: "Medium", color: "bg-blue-100 text-blue-800", description: "48 hours response" },
  { value: "high", label: "High", color: "bg-orange-100 text-orange-800", description: "24 hours response" },
  { value: "urgent", label: "Urgent", color: "bg-red-100 text-red-800", description: "4 hours response" },
];

export default function SupportPage() {
  const { user } = useUserStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ownerContacts, setOwnerContacts] = useState<OwnerContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTicketDialog, setShowNewTicketDialog] = useState(false);
  const [showTicketDetails, setShowTicketDetails] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  // New ticket form
  const [newTicket, setNewTicket] = useState({
    category: "",
    priority: "medium",
    subject: "",
    description: "",
    listingId: "",
    bookingId: "",
  });

  useEffect(() => {
    if (user?.id) {
      fetchTickets();
      fetchOwnerContacts();
    }
  }, [user?.id]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/user/tickets?userId=${user?.id}`);
      if (response.data.success) {
        setTickets(response.data.data);
      }
    } catch (error) {
      toast.error("Failed to fetch tickets");
    } finally {
      setLoading(false);
    }
  };

  const fetchOwnerContacts = async () => {
    try {
      const response = await axios.get(`/api/user/owner-contacts?userId=${user?.id}`);
      if (response.data.success) {
        setOwnerContacts(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch owner contacts");
    }
  };

  const handleCreateTicket = async () => {
    if (!newTicket.category || !newTicket.subject || !newTicket.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setSubmitting(true);
      const response = await axios.post("/api/user/tickets", {
        ...newTicket,
        userId: user?.id,
      });

      if (response.data.success) {
        toast.success(`Ticket ${response.data.data.ticketNumber} created successfully`);
        setShowNewTicketDialog(false);
        setNewTicket({
          category: "",
          priority: "medium",
          subject: "",
          description: "",
          listingId: "",
          bookingId: "",
        });
        fetchTickets();
      }
    } catch (error) {
      toast.error("Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedTicket) return;

    try {
      setSendingComment(true);
      const response = await axios.post(`/api/user/tickets/${selectedTicket._id}`, {
        action: "add_comment",
        userId: user?.id,
        userName: user?.fullName,
        userRole: user?.role,
        message: newComment,
      });

      if (response.data.success) {
        setSelectedTicket(response.data.data);
        setNewComment("");
        fetchTickets();
        toast.success("Reply sent successfully");
      }
    } catch (error) {
      toast.error("Failed to send reply");
    } finally {
      setSendingComment(false);
    }
  };

  const handleRateResolution = async (rating: number) => {
    if (!selectedTicket) return;

    try {
      const response = await axios.post(`/api/user/tickets/${selectedTicket._id}`, {
        action: "rate",
        userId: user?.id,
        rating,
      });

      if (response.data.success) {
        setSelectedTicket(response.data.data);
        fetchTickets();
        toast.success("Thank you for your feedback!");
      }
    } catch (error) {
      toast.error("Failed to submit rating");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      open: { color: "bg-blue-100 text-blue-800", icon: <AlertCircle className="h-3 w-3" />, label: "Open" },
      in_progress: { color: "bg-yellow-100 text-yellow-800", icon: <Clock className="h-3 w-3" />, label: "In Progress" },
      waiting_response: { color: "bg-purple-100 text-purple-800", icon: <MessageCircle className="h-3 w-3" />, label: "Awaiting Response" },
      resolved: { color: "bg-green-100 text-green-800", icon: <CheckCircle2 className="h-3 w-3" />, label: "Resolved" },
      closed: { color: "bg-gray-100 text-gray-800", icon: <XCircle className="h-3 w-3" />, label: "Closed" },
      reopened: { color: "bg-orange-100 text-orange-800", icon: <RefreshCw className="h-3 w-3" />, label: "Reopened" },
    };

    const config = statusConfig[status] || statusConfig.open;
    return (
      <Badge variant="outline" className={`${config.color} flex items-center gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const config = PRIORITY_OPTIONS.find((p) => p.value === priority) || PRIORITY_OPTIONS[1];
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getCategoryIcon = (category: string) => {
    const cat = TICKET_CATEGORIES.find((c) => c.value === category);
    return cat ? <cat.icon className="h-4 w-4" /> : <HelpCircle className="h-4 w-4" />;
  };

  const getCategoryLabel = (category: string) => {
    return TICKET_CATEGORIES.find((c) => c.value === category)?.label || category;
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesFilter = filter === "all" || ticket.status === filter;
    const matchesSearch =
      ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const openTicketsCount = tickets.filter((t) => ["open", "in_progress", "waiting_response", "reopened"].includes(t.status)).length;
  const resolvedTicketsCount = tickets.filter((t) => ["resolved", "closed"].includes(t.status)).length;

  if (loading) {
    return (
      <div className="space-y-6 pt-4 pb-14">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-HG-500"></div>
          <span className="ml-2 text-muted-foreground">Loading support center...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4 pb-14">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-HG-500">Support Center</h1>
          <p className="text-muted-foreground mt-2">
            Get help, raise issues, and track your support requests
          </p>
        </div>
        <Button
          onClick={() => setShowNewTicketDialog(true)}
          className="bg-HG-500 hover:bg-HG-600 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Raise a Ticket
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border border-HG-400/20 shadow-sm rounded-2xl bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Open Tickets</p>
                <p className="text-2xl font-bold text-blue-600">{openTicketsCount}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-HG-400/20 shadow-sm rounded-2xl bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{resolvedTicketsCount}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-HG-400/20 shadow-sm rounded-2xl bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tickets</p>
                <p className="text-2xl font-bold text-HG-500">{tickets.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-HG-100 flex items-center justify-center">
                <FileText className="h-6 w-6 text-HG-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-HG-400/20 shadow-sm rounded-2xl bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Response</p>
                <p className="text-2xl font-bold text-purple-600">{"< 24h"}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="tickets" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-HG-50">
          <TabsTrigger value="tickets" className="data-[state=active]:bg-HG-500 data-[state=active]:text-white">
            <FileText className="h-4 w-4 mr-2" />
            My Tickets
          </TabsTrigger>
          <TabsTrigger value="contacts" className="data-[state=active]:bg-HG-500 data-[state=active]:text-white">
            <Phone className="h-4 w-4 mr-2" />
            PG Contacts
          </TabsTrigger>
          <TabsTrigger value="helpline" className="data-[state=active]:bg-HG-500 data-[state=active]:text-white">
            <Headphones className="h-4 w-4 mr-2" />
            Helpline
          </TabsTrigger>
        </TabsList>

        {/* Tickets Tab */}
        <TabsContent value="tickets" className="space-y-4">
          {/* Filters */}
          <Card className="border border-HG-400/20 shadow-sm rounded-2xl bg-white">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by ticket number or subject..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tickets</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="waiting_response">Awaiting Response</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tickets List */}
          <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl bg-white">
            <CardHeader>
              <CardTitle className="text-HG-500">Support Tickets</CardTitle>
              <CardDescription>View and manage your support requests</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredTickets.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Tickets Found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchQuery || filter !== "all"
                      ? "No tickets match your search criteria."
                      : "You haven't raised any support tickets yet."}
                  </p>
                  <Button
                    onClick={() => setShowNewTicketDialog(true)}
                    className="bg-HG-500 hover:bg-HG-600 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Raise a Ticket
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTickets.map((ticket) => (
                    <div
                      key={ticket._id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedTicket(ticket);
                        setShowTicketDetails(true);
                      }}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="h-10 w-10 rounded-full bg-HG-100 flex items-center justify-center">
                            {getCategoryIcon(ticket.category)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-sm text-HG-500">{ticket.ticketNumber}</span>
                              {getPriorityBadge(ticket.priority)}
                              {getStatusBadge(ticket.status)}
                            </div>
                            <h4 className="font-medium">{ticket.subject}</h4>
                            <p className="text-sm text-muted-foreground">
                              {getCategoryLabel(ticket.category)} • Created {new Date(ticket.createdAt).toLocaleDateString('en-IN')}
                            </p>
                          </div>
                        </div>
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
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PG Contacts Tab */}
        <TabsContent value="contacts" className="space-y-4">
          <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl bg-white">
            <CardHeader>
              <CardTitle className="text-HG-500">PG Owner/Warden Contacts</CardTitle>
              <CardDescription>Direct contact information for your PGs</CardDescription>
            </CardHeader>
            <CardContent>
              {ownerContacts.length === 0 ? (
                <div className="text-center py-12">
                  <Building className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No PG Bookings</h3>
                  <p className="text-gray-500">
                    You dont have any active PG bookings to show contacts for.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {ownerContacts.map((contact) => (
                    <Card key={contact.listingId} className="border-2 border-HG-200">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className="h-14 w-14 rounded-full bg-HG-500 flex items-center justify-center">
                            <User className="h-7 w-7 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{contact.ownerName}</h4>
                            <p className="text-sm text-muted-foreground">{contact.pgName}</p>
                            <p className="text-xs text-muted-foreground">{contact.location}</p>
                          </div>
                        </div>
                        <Separator className="my-4" />
                        <div className="flex gap-2">
                          <Button
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => window.open(`tel:${contact.ownerPhone}`)}
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            Call
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 border-HG-500 text-HG-500 hover:bg-HG-50"
                            onClick={() => window.open(`mailto:${contact.ownerEmail}`)}
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Email
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Helpline Tab */}
        <TabsContent value="helpline" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* SpotYourPG Support */}
            <Card className="border-2 border-HG-400 shadow-lg rounded-2xl bg-gradient-to-br from-HG-50 to-orange-50">
              <CardHeader>
                <CardTitle className="text-HG-500 flex items-center gap-2">
                  <Headphones className="h-6 w-6" />
                  SpotYourPG Support
                </CardTitle>
                <CardDescription>24/7 Customer Support</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                    <Phone className="h-5 w-5 text-HG-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Helpline</p>
                      <p className="font-semibold">1800-XXX-XXXX</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                    <Mail className="h-5 w-5 text-HG-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email Support</p>
                      <p className="font-semibold">support@spotyourpg.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                    <MessageCircle className="h-5 w-5 text-HG-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">WhatsApp</p>
                      <p className="font-semibold">+91 98XXX XXXXX</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1 bg-green-600 hover:bg-green-700">
                    <Phone className="h-4 w-4 mr-2" />
                    Call Now
                  </Button>
                  <Button variant="outline" className="flex-1 border-HG-500 text-HG-500">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Help */}
            <Card className="border border-HG-400/20 shadow-sm rounded-2xl bg-white">
              <CardHeader>
                <CardTitle className="text-HG-500 flex items-center gap-2">
                  <HelpCircle className="h-6 w-6" />
                  Quick Help
                </CardTitle>
                <CardDescription>Common issues and FAQs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { q: "How to request a refund?", link: "#" },
                    { q: "Change my move-in date", link: "#" },
                    { q: "Report maintenance issue", link: "#" },
                    { q: "Cancel my booking", link: "#" },
                    { q: "Update my profile", link: "#" },
                  ].map((faq, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <span className="text-sm">{faq.q}</span>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Emergency Contact */}
          <Card className="border-2 border-red-300 shadow-sm rounded-2xl bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-7 w-7 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-800">Emergency Contact</h3>
                  <p className="text-sm text-red-600">
                    For urgent safety concerns, medical emergencies, or security issues
                  </p>
                </div>
                <Button className="bg-red-600 hover:bg-red-700">
                  <Phone className="h-4 w-4 mr-2" />
                  Emergency: 112
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Ticket Dialog */}
      <Dialog open={showNewTicketDialog} onOpenChange={setShowNewTicketDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-HG-500">Raise a Support Ticket</DialogTitle>
            <DialogDescription>
              Describe your issue and we will get back to you as soon as possible
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Category Selection */}
            <div className="space-y-2">
              <Label>Issue Category *</Label>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {TICKET_CATEGORIES.slice(0, 10).map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setNewTicket({ ...newTicket, category: cat.value })}
                    className={`p-3 rounded-lg border-2 text-center transition-colors ${
                      newTicket.category === cat.value
                        ? "border-HG-500 bg-HG-50"
                        : "border-gray-200 hover:border-HG-300"
                    }`}
                  >
                    <cat.icon className={`h-5 w-5 mx-auto mb-1 ${
                      newTicket.category === cat.value ? "text-HG-500" : "text-gray-500"
                    }`} />
                    <span className="text-xs">{cat.label}</span>
                  </button>
                ))}
              </div>
              <Select
                value={newTicket.category || undefined}
                onValueChange={(value) => setNewTicket({ ...newTicket, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Or select from full list..." />
                </SelectTrigger>
                <SelectContent>
                  {TICKET_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center gap-2">
                        <cat.icon className="h-4 w-4" />
                        {cat.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label>Priority Level *</Label>
              <div className="grid grid-cols-4 gap-2">
                {PRIORITY_OPTIONS.map((priority) => (
                  <button
                    key={priority.value}
                    type="button"
                    onClick={() => setNewTicket({ ...newTicket, priority: priority.value })}
                    className={`p-3 rounded-lg border-2 text-center transition-colors ${
                      newTicket.priority === priority.value
                        ? "border-HG-500 bg-HG-50"
                        : "border-gray-200 hover:border-HG-300"
                    }`}
                  >
                    <Badge className={`${priority.color} mb-1`}>{priority.label}</Badge>
                    <p className="text-xs text-muted-foreground">{priority.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Related PG (Optional) */}
            {ownerContacts.length > 0 && (
              <div className="space-y-2">
                <Label>Related PG (Optional)</Label>
                <Select
                  value={newTicket.listingId || undefined}
                  onValueChange={(value) => setNewTicket({ ...newTicket, listingId: value || "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select PG if applicable..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {ownerContacts.map((contact) => (
                      <SelectItem key={contact.listingId} value={contact.listingId}>
                        {contact.pgName} - {contact.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Subject */}
            <div className="space-y-2">
              <Label>Subject *</Label>
              <Input
                placeholder="Brief description of your issue"
                value={newTicket.subject}
                onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground text-right">
                {newTicket.subject.length}/200
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Detailed Description *</Label>
              <Textarea
                placeholder="Please provide as much detail as possible about your issue..."
                value={newTicket.description}
                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                rows={5}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewTicketDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateTicket}
              disabled={submitting || !newTicket.category || !newTicket.subject || !newTicket.description}
              className="bg-HG-500 hover:bg-HG-600 text-white"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Ticket
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ticket Details Dialog */}
      <Dialog open={showTicketDetails} onOpenChange={setShowTicketDetails}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-HG-500 flex items-center gap-2">
                  <span className="font-mono">{selectedTicket?.ticketNumber}</span>
                  {selectedTicket && getStatusBadge(selectedTicket.status)}
                </DialogTitle>
                <DialogDescription>{selectedTicket?.subject}</DialogDescription>
              </div>
              {selectedTicket && getPriorityBadge(selectedTicket.priority)}
            </div>
          </DialogHeader>

          {selectedTicket && (
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-6 py-4">
                {/* Ticket Info */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Category</p>
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(selectedTicket.category)}
                      <span className="font-medium">{getCategoryLabel(selectedTicket.category)}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Created On</p>
                    <p className="font-medium">
                      {new Date(selectedTicket.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Expected Resolution</p>
                    <p className="font-medium">
                      {new Date(selectedTicket.expectedResolutionDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">First Response</p>
                    <p className="font-medium">
                      {selectedTicket.firstResponseAt
                        ? new Date(selectedTicket.firstResponseAt).toLocaleDateString('en-IN')
                        : "Awaiting response"}
                    </p>
                  </div>
                </div>

                {/* Related PG */}
                {selectedTicket.listingId && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Related PG</p>
                    <div className="flex items-center gap-3">
                      <Building className="h-5 w-5 text-HG-500" />
                      <div>
                        <p className="font-medium">{selectedTicket.listingId.pgName}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedTicket.listingId.location.area}, {selectedTicket.listingId.location.city}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Description</p>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="whitespace-pre-wrap">{selectedTicket.description}</p>
                  </div>
                </div>

                {/* Resolution (if resolved) */}
                {selectedTicket.resolution && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-green-600">Resolution</p>
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="whitespace-pre-wrap">{selectedTicket.resolution}</p>
                    </div>
                  </div>
                )}

                {/* Satisfaction Rating (for resolved tickets) */}
                {selectedTicket.status === "resolved" && !selectedTicket.satisfactionRating && (
                  <div className="p-4 bg-HG-50 border border-HG-200 rounded-lg">
                    <p className="text-sm font-medium mb-3">How was your experience?</p>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => handleRateResolution(rating)}
                          className="h-10 w-10 rounded-full border-2 border-HG-300 hover:border-HG-500 hover:bg-HG-100 transition-colors flex items-center justify-center"
                        >
                          <Star className={`h-5 w-5 ${rating <= 3 ? "text-gray-400" : "text-yellow-500"}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTicket.satisfactionRating && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-600 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      You rated this resolution {selectedTicket.satisfactionRating}/5 stars
                    </p>
                  </div>
                )}

                <Separator />

                {/* Comments/Conversation */}
                <div className="space-y-4">
                  <p className="text-sm font-medium">Conversation</p>
                  
                  {selectedTicket.comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No responses yet. We will get back to you soon!
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {selectedTicket.comments.map((comment) => (
                        <div
                          key={comment._id}
                          className={`flex gap-3 ${
                            comment.userRole === "user" ? "justify-end" : ""
                          }`}
                        >
                          {comment.userRole !== "user" && (
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                              comment.userRole === "admin" ? "bg-purple-100" : "bg-HG-100"
                            }`}>
                              <User className={`h-4 w-4 ${
                                comment.userRole === "admin" ? "text-purple-600" : "text-HG-600"
                              }`} />
                            </div>
                          )}
                          <div className={`max-w-[70%] ${
                            comment.userRole === "user" ? "order-1" : ""
                          }`}>
                            <div className={`p-3 rounded-lg ${
                              comment.userRole === "user"
                                ? "bg-HG-500 text-white"
                                : "bg-gray-100"
                            }`}>
                              <p className="text-sm">{comment.message}</p>
                            </div>
                            <p className={`text-xs mt-1 ${
                              comment.userRole === "user" ? "text-right" : ""
                            } text-muted-foreground`}>
                              {comment.userName} • {new Date(comment.createdAt).toLocaleString('en-IN')}
                            </p>
                          </div>
                          {comment.userRole === "user" && (
                            <div className="h-8 w-8 rounded-full bg-HG-500 flex items-center justify-center order-2">
                              <User className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add Comment (if ticket is not closed) */}
                {!["closed", "resolved"].includes(selectedTicket.status) && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type your reply..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleAddComment()}
                    />
                    <Button
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || sendingComment}
                      className="bg-HG-500 hover:bg-HG-600"
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
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}