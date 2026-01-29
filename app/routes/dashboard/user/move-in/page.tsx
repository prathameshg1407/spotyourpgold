// app/routes/dashboard/user/move-in/page.tsx
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
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Download,
  FileText,
  CheckCircle2,
  Circle,
  AlertCircle,
  Clock,
  Calendar,
  MapPin,
  Phone,
  Mail,
  User,
  Home,
  Shield,
  Briefcase,
  Coffee,
  Moon,
  Users,
  Cigarette,
  Car,
  Wifi,
  Utensils,
  Key,
  ClipboardCheck,
  FileCheck,
  Building,
  IndianRupee,
  Info,
  ChevronRight,
  Printer,
  Eye,
} from "lucide-react";
import { useUserStore } from "@/store/userStore";
import axios from "axios";
import { toast } from "sonner";

interface BookingDetails {
  _id: string;
  listingId: {
    _id: string;
    pgName: string;
    location: {
      area: string;
      city: string;
      state: string;
      pincode: string;
    };
    genderPreference: string;
    amenities: string[];
    rulesAndRegulations: string[];
    detailedRules: {
      lockInPeriod: string;
      noticePeriod: string;
      maintenanceCharges: string;
      registrationFees: string;
      entryTiming: string;
      exitTiming: string;
      guestStayPolicy: string;
      smokingAlcoholPolicy: string;
    };
    mealTimings: {
      morning: { enabled: boolean; from: string; to: string };
      noon: { enabled: boolean; from: string; to: string };
      evening: { enabled: boolean; from: string; to: string };
      night: { enabled: boolean; from: string; to: string };
    };
    rentInclusions: {
      foodIncluded: boolean;
      electricityIncluded: boolean;
      maintenanceIncluded: boolean;
    };
    ownerId: {
      _id: string;
      fullName: string;
      email: string;
      phone: string;
    };
  };
  roomType: string;
  moveInDate: string;
  duration: string;
  amount: number;
  securityDeposit: number;
  status: string;
  paymentStatus: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  createdAt: string;
}

interface ChecklistItem {
  id: string;
  category: string;
  title: string;
  description: string;
  required: boolean;
  completed: boolean;
}

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  // Identity Documents
  {
    id: "aadhar",
    category: "Identity Documents",
    title: "Aadhaar Card",
    description: "Original + 2 photocopies of your Aadhaar card",
    required: true,
    completed: false,
  },
  {
    id: "pan",
    category: "Identity Documents",
    title: "PAN Card",
    description: "Original + 1 photocopy (for agreement)",
    required: false,
    completed: false,
  },
  {
    id: "photo",
    category: "Identity Documents",
    title: "Passport Size Photos",
    description: "4-6 recent passport size photographs",
    required: true,
    completed: false,
  },
  {
    id: "address_proof",
    category: "Identity Documents",
    title: "Address Proof",
    description: "Electricity bill, bank statement, or any government ID with address",
    required: true,
    completed: false,
  },
  // Work/Education
  {
    id: "work_id",
    category: "Work/Education",
    title: "Office/College ID",
    description: "Current employment or student ID card",
    required: true,
    completed: false,
  },
  {
    id: "offer_letter",
    category: "Work/Education",
    title: "Offer Letter / Admission Letter",
    description: "For working professionals or students",
    required: false,
    completed: false,
  },
  // Emergency Contact
  {
    id: "emergency_contact",
    category: "Emergency Contact",
    title: "Emergency Contact Details",
    description: "Name, phone, and relationship of 2 emergency contacts",
    required: true,
    completed: false,
  },
  {
    id: "parent_contact",
    category: "Emergency Contact",
    title: "Parent/Guardian Contact",
    description: "Parent's phone number and address",
    required: true,
    completed: false,
  },
  // Luggage & Belongings
  {
    id: "luggage_check",
    category: "Luggage & Belongings",
    title: "Luggage Size Check",
    description: "Maximum 2 suitcases + 1 bag (check PG policy)",
    required: true,
    completed: false,
  },
  {
    id: "electronics",
    category: "Luggage & Belongings",
    title: "Electronics List",
    description: "Laptop, mobile, chargers - list for security",
    required: false,
    completed: false,
  },
  {
    id: "bedding",
    category: "Luggage & Belongings",
    title: "Bedding (if not provided)",
    description: "Bedsheet, pillow, blanket - check if PG provides",
    required: false,
    completed: false,
  },
  // Payments
  {
    id: "first_rent",
    category: "Payments",
    title: "First Month Rent",
    description: "Cash or online transfer ready",
    required: true,
    completed: false,
  },
  {
    id: "security_deposit",
    category: "Payments",
    title: "Security Deposit",
    description: "As per booking amount",
    required: true,
    completed: false,
  },
  // Move-in Day
  {
    id: "key_collection",
    category: "Move-in Day",
    title: "Room Key Collection",
    description: "Collect room keys and any access cards",
    required: true,
    completed: false,
  },
  {
    id: "room_inspection",
    category: "Move-in Day",
    title: "Room Inspection",
    description: "Check room condition, furniture, and note any damages",
    required: true,
    completed: false,
  },
  {
    id: "wifi_setup",
    category: "Move-in Day",
    title: "WiFi Password",
    description: "Get WiFi credentials from owner/warden",
    required: false,
    completed: false,
  },
];

export default function MoveInSupportPage() {
  const { user } = useUserStore();
  const [bookings, setBookings] = useState<BookingDetails[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(DEFAULT_CHECKLIST);
  const [savingChecklist, setSavingChecklist] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);
  const [downloadingAgreement, setDownloadingAgreement] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchBookings();
    }
  }, [user?.id]);

  useEffect(() => {
    if (selectedBooking) {
      loadChecklist(selectedBooking._id);
    }
  }, [selectedBooking]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/user/move-in?userId=${user?.id}`);
      if (response.data.success) {
        setBookings(response.data.data);
        if (response.data.data.length > 0) {
          setSelectedBooking(response.data.data[0]);
        }
      }
    } catch (error) {
      toast.error("Failed to fetch booking details");
    } finally {
      setLoading(false);
    }
  };

  const loadChecklist = async (bookingId: string) => {
    try {
      const response = await axios.get(`/api/user/checklist?bookingId=${bookingId}`);
      if (response.data.success && response.data.data) {
        setChecklist(response.data.data.items);
      } else {
        setChecklist(DEFAULT_CHECKLIST);
      }
    } catch (error) {
      setChecklist(DEFAULT_CHECKLIST);
    }
  };

  const handleChecklistToggle = async (itemId: string) => {
    const updatedChecklist = checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    setChecklist(updatedChecklist);

    // Auto-save
    try {
      setSavingChecklist(true);
      await axios.post("/api/user/checklist", {
        bookingId: selectedBooking?._id,
        userId: user?.id,
        items: updatedChecklist,
      });
    } catch (error) {
      toast.error("Failed to save checklist");
    } finally {
      setSavingChecklist(false);
    }
  };

  const handleDownloadAgreement = async () => {
    if (!selectedBooking) return;
    
    try {
      setDownloadingAgreement(true);
      const response = await axios.get(
        `/api/user/agreement/${selectedBooking._id}`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `rental-agreement-${selectedBooking._id}.html`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Agreement downloaded successfully");
    } catch (error) {
      toast.error("Failed to download agreement");
    } finally {
      setDownloadingAgreement(false);
    }
  };

  const getCompletionPercentage = () => {
    const completed = checklist.filter((item) => item.completed).length;
    return Math.round((completed / checklist.length) * 100);
  };

  const getRequiredIncomplete = () => {
    return checklist.filter((item) => item.required && !item.completed).length;
  };

  const groupedChecklist = checklist.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  const getRuleIcon = (rule: string) => {
    const lowerRule = rule.toLowerCase();
    if (lowerRule.includes("smoking") || lowerRule.includes("alcohol")) return <Cigarette className="h-4 w-4" />;
    if (lowerRule.includes("visitor") || lowerRule.includes("guest")) return <Users className="h-4 w-4" />;
    if (lowerRule.includes("time") || lowerRule.includes("curfew")) return <Clock className="h-4 w-4" />;
    if (lowerRule.includes("food") || lowerRule.includes("meal")) return <Utensils className="h-4 w-4" />;
    if (lowerRule.includes("parking") || lowerRule.includes("vehicle")) return <Car className="h-4 w-4" />;
    if (lowerRule.includes("wifi") || lowerRule.includes("internet")) return <Wifi className="h-4 w-4" />;
    return <Shield className="h-4 w-4" />;
  };

  const getPolicyBadge = (policy: string) => {
    switch (policy) {
      case "allowed":
        return <Badge className="bg-green-100 text-green-800">Allowed</Badge>;
      case "not-allowed":
        return <Badge className="bg-red-100 text-red-800">Not Allowed</Badge>;
      case "limited-access":
        return <Badge className="bg-yellow-100 text-yellow-800">Limited</Badge>;
      default:
        return <Badge variant="outline">Not Specified</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 pt-4 pb-14">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-HG-500"></div>
          <span className="ml-2 text-muted-foreground">Loading move-in details...</span>
        </div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="space-y-6 pt-4 pb-14">
        <div>
          <h1 className="text-3xl font-bold text-HG-500">Move-in Support</h1>
          <p className="text-muted-foreground mt-2">
            Prepare for your move-in with our comprehensive guide
          </p>
        </div>

        <Card className="border border-HG-400/20 shadow-sm rounded-2xl bg-white">
          <CardContent className="text-center py-12">
            <Home className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Active Bookings</h3>
            <p className="text-gray-500 mb-4">
              You dont have any confirmed bookings yet.
            </p>
            <Button className="bg-HG-500 hover:bg-HG-600 text-white">
              Browse PGs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4 pb-14">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-HG-500">Move-in Support</h1>
          <p className="text-muted-foreground mt-2">
            Everything you need for a smooth move-in experience
          </p>
        </div>

        {/* Booking Selector (if multiple bookings) */}
        {bookings.length > 1 && (
          <select
            className="border rounded-lg px-4 py-2 bg-white"
            value={selectedBooking?._id}
            onChange={(e) => {
              const booking = bookings.find((b) => b._id === e.target.value);
              setSelectedBooking(booking || null);
            }}
          >
            {bookings.map((booking) => (
              <option key={booking._id} value={booking._id}>
                {booking.listingId.pgName} - {booking.roomType}
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedBooking && (
        <>
          {/* Booking Summary Card */}
          <Card className="border-2 border-HG-400/30 shadow-sm rounded-2xl bg-gradient-to-r from-HG-50 to-orange-50">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-xl bg-HG-500 flex items-center justify-center">
                    <Building className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{selectedBooking.listingId.pgName}</h2>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {selectedBooking.listingId.location.area}, {selectedBooking.listingId.location.city}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="bg-white">
                        {selectedBooking.roomType}
                      </Badge>
                      <Badge 
                        className={
                          selectedBooking.status === "confirmed" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Move-in: {new Date(selectedBooking.moveInDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-HG-500 flex items-center">
                      <IndianRupee className="h-5 w-5" />
                      {selectedBooking.amount.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Tabs */}
          <Tabs defaultValue="checklist" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-HG-50">
              <TabsTrigger value="checklist" className="data-[state=active]:bg-HG-500 data-[state=active]:text-white">
                <ClipboardCheck className="h-4 w-4 mr-2" />
                Checklist
              </TabsTrigger>
              <TabsTrigger value="agreement" className="data-[state=active]:bg-HG-500 data-[state=active]:text-white">
                <FileText className="h-4 w-4 mr-2" />
                Agreement
              </TabsTrigger>
              <TabsTrigger value="rules" className="data-[state=active]:bg-HG-500 data-[state=active]:text-white">
                <Shield className="h-4 w-4 mr-2" />
                PG Rules
              </TabsTrigger>
            </TabsList>

            {/* Checklist Tab */}
            <TabsContent value="checklist" className="space-y-6">
              {/* Progress Card */}
              <Card className="border border-HG-400/20 shadow-sm rounded-2xl bg-white">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">Move-in Checklist Progress</h3>
                      <p className="text-sm text-muted-foreground">
                        {getRequiredIncomplete() > 0 
                          ? `${getRequiredIncomplete()} required items remaining`
                          : "All required items completed! 🎉"
                        }
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-bold text-HG-500">{getCompletionPercentage()}%</span>
                      <p className="text-xs text-muted-foreground">Complete</p>
                    </div>
                  </div>
                  <Progress value={getCompletionPercentage()} className="h-3" />
               {savingChecklist && (
  <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-HG-500" />
    Saving...
  </div>
)}
                </CardContent>
              </Card>

              {/* Checklist Items */}
              <Card className="border border-HG-400/20 shadow-sm rounded-2xl bg-white">
                <CardHeader>
                  <CardTitle className="text-HG-500">Documents & Items Checklist</CardTitle>
                  <CardDescription>
                    Check off items as you prepare them for move-in
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" className="space-y-2" defaultValue={Object.keys(groupedChecklist)}>
                    {Object.entries(groupedChecklist).map(([category, items]) => (
                      <AccordionItem key={category} value={category} className="border rounded-lg px-4">
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                              items.every(i => i.completed) 
                                ? 'bg-green-100' 
                                : 'bg-gray-100'
                            }`}>
                              {items.every(i => i.completed) ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              ) : (
                                <Circle className="h-5 w-5 text-gray-400" />
                              )}
                            </div>
                            <div className="text-left">
                              <p className="font-medium">{category}</p>
                              <p className="text-xs text-muted-foreground">
                                {items.filter(i => i.completed).length} / {items.length} completed
                              </p>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 pb-4">
                          <div className="space-y-3">
                            {items.map((item) => (
                              <div
                                key={item.id}
                                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                                  item.completed 
                                    ? 'bg-green-50 border-green-200' 
                                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                }`}
                              >
                                <Checkbox
                                  id={item.id}
                                  checked={item.completed}
                                  onCheckedChange={() => handleChecklistToggle(item.id)}
                                  className="mt-1"
                                />
                                <div className="flex-1">
                                  <label
                                    htmlFor={item.id}
                                    className={`font-medium cursor-pointer flex items-center gap-2 ${
                                      item.completed ? 'line-through text-gray-500' : ''
                                    }`}
                                  >
                                    {item.title}
                                    {item.required && (
                                      <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200">
                                        Required
                                      </Badge>
                                    )}
                                  </label>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {item.description}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Agreement Tab */}
            <TabsContent value="agreement" className="space-y-6">
              <Card className="border border-HG-400/20 shadow-sm rounded-2xl bg-white">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-HG-500">Rental Agreement</CardTitle>
                      <CardDescription>
                        Digital copy of your rental agreement and terms
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowAgreement(true)}
                        className="border-HG-500 text-HG-500 hover:bg-HG-50"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button
                        onClick={handleDownloadAgreement}
                        disabled={downloadingAgreement}
                        className="bg-HG-500 hover:bg-HG-600 text-white"
                      >
                        {downloadingAgreement ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        Download
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Agreement Summary */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        <User className="h-4 w-4 text-HG-500" />
                        Tenant Details
                      </h4>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <p><span className="text-muted-foreground">Name:</span> {selectedBooking.fullName}</p>
                        <p><span className="text-muted-foreground">Email:</span> {selectedBooking.email}</p>
                        <p><span className="text-muted-foreground">Phone:</span> {selectedBooking.phoneNumber}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Building className="h-4 w-4 text-HG-500" />
                        Property Details
                      </h4>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <p><span className="text-muted-foreground">PG Name:</span> {selectedBooking.listingId.pgName}</p>
                        <p><span className="text-muted-foreground">Room Type:</span> {selectedBooking.roomType}</p>
                        <p><span className="text-muted-foreground">Location:</span> {selectedBooking.listingId.location.area}, {selectedBooking.listingId.location.city}</p>
                      </div>
                    </div>
                  </div>

                  {/* Financial Terms */}
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <IndianRupee className="h-4 w-4 text-HG-500" />
                      Financial Terms
                    </h4>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-green-50 rounded-lg p-4 text-center">
                        <p className="text-sm text-muted-foreground">Monthly Rent</p>
                        <p className="text-2xl font-bold text-green-600">₹{selectedBooking.amount.toLocaleString()}</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4 text-center">
                        <p className="text-sm text-muted-foreground">Security Deposit</p>
                        <p className="text-2xl font-bold text-blue-600">₹{selectedBooking.securityDeposit.toLocaleString()}</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4 text-center">
                        <p className="text-sm text-muted-foreground">Duration</p>
                        <p className="text-2xl font-bold text-purple-600">{selectedBooking.duration} Months</p>
                      </div>
                    </div>
                  </div>

                  {/* Key Terms */}
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Key className="h-4 w-4 text-HG-500" />
                      Key Terms
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      {selectedBooking.listingId.detailedRules.lockInPeriod && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Clock className="h-5 w-5 text-HG-500" />
                          <div>
                            <p className="text-sm text-muted-foreground">Lock-in Period</p>
                            <p className="font-medium">{selectedBooking.listingId.detailedRules.lockInPeriod}</p>
                          </div>
                        </div>
                      )}
                      {selectedBooking.listingId.detailedRules.noticePeriod && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Calendar className="h-5 w-5 text-HG-500" />
                          <div>
                            <p className="text-sm text-muted-foreground">Notice Period</p>
                            <p className="font-medium">{selectedBooking.listingId.detailedRules.noticePeriod}</p>
                          </div>
                        </div>
                      )}
                      {selectedBooking.listingId.detailedRules.maintenanceCharges && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <IndianRupee className="h-5 w-5 text-HG-500" />
                          <div>
                            <p className="text-sm text-muted-foreground">Maintenance Charges</p>
                            <p className="font-medium">{selectedBooking.listingId.detailedRules.maintenanceCharges}</p>
                          </div>
                        </div>
                      )}
                      {selectedBooking.listingId.detailedRules.registrationFees && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <FileCheck className="h-5 w-5 text-HG-500" />
                          <div>
                            <p className="text-sm text-muted-foreground">Registration Fees</p>
                            <p className="font-medium">{selectedBooking.listingId.detailedRules.registrationFees}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rent Inclusions */}
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-HG-500" />
                      Rent Inclusions
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      <Badge 
                        variant="outline" 
                        className={selectedBooking.listingId.rentInclusions.foodIncluded 
                          ? "bg-green-50 text-green-700 border-green-300" 
                          : "bg-gray-50 text-gray-500"
                        }
                      >
                        <Utensils className="h-3 w-3 mr-1" />
                        Food {selectedBooking.listingId.rentInclusions.foodIncluded ? "Included" : "Not Included"}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={selectedBooking.listingId.rentInclusions.electricityIncluded 
                          ? "bg-green-50 text-green-700 border-green-300" 
                          : "bg-gray-50 text-gray-500"
                        }
                      >
                        ⚡ Electricity {selectedBooking.listingId.rentInclusions.electricityIncluded ? "Included" : "Not Included"}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={selectedBooking.listingId.rentInclusions.maintenanceIncluded 
                          ? "bg-green-50 text-green-700 border-green-300" 
                          : "bg-gray-50 text-gray-500"
                        }
                      >
                        🔧 Maintenance {selectedBooking.listingId.rentInclusions.maintenanceIncluded ? "Included" : "Not Included"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Rules Tab */}
            <TabsContent value="rules" className="space-y-6">
              {/* Timing Rules */}
              <Card className="border border-HG-400/20 shadow-sm rounded-2xl bg-white">
                <CardHeader>
                  <CardTitle className="text-HG-500 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Timing & Curfew
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {selectedBooking.listingId.detailedRules.entryTiming && (
                      <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
                        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                          <Moon className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Entry Timing</p>
                          <p className="text-lg font-semibold">{selectedBooking.listingId.detailedRules.entryTiming}</p>
                        </div>
                      </div>
                    )}
                    {selectedBooking.listingId.detailedRules.exitTiming && (
                      <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-lg">
                        <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                          <Coffee className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Exit Timing</p>
                          <p className="text-lg font-semibold">{selectedBooking.listingId.detailedRules.exitTiming}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Meal Timings */}
              {selectedBooking.listingId.rentInclusions.foodIncluded && (
                <Card className="border border-HG-400/20 shadow-sm rounded-2xl bg-white">
                  <CardHeader>
                    <CardTitle className="text-HG-500 flex items-center gap-2">
                      <Utensils className="h-5 w-5" />
                      Meal Timings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-4 gap-4">
                      {selectedBooking.listingId.mealTimings.morning.enabled && (
                        <div className="p-4 bg-yellow-50 rounded-lg text-center">
                          <p className="text-2xl mb-2">🌅</p>
                          <p className="font-medium">Breakfast</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedBooking.listingId.mealTimings.morning.from} - {selectedBooking.listingId.mealTimings.morning.to}
                          </p>
                        </div>
                      )}
                      {selectedBooking.listingId.mealTimings.noon.enabled && (
                        <div className="p-4 bg-orange-50 rounded-lg text-center">
                          <p className="text-2xl mb-2">☀️</p>
                          <p className="font-medium">Lunch</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedBooking.listingId.mealTimings.noon.from} - {selectedBooking.listingId.mealTimings.noon.to}
                          </p>
                        </div>
                      )}
                      {selectedBooking.listingId.mealTimings.evening.enabled && (
                        <div className="p-4 bg-purple-50 rounded-lg text-center">
                          <p className="text-2xl mb-2">🌆</p>
                          <p className="font-medium">Snacks</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedBooking.listingId.mealTimings.evening.from} - {selectedBooking.listingId.mealTimings.evening.to}
                          </p>
                        </div>
                      )}
                      {selectedBooking.listingId.mealTimings.night.enabled && (
                        <div className="p-4 bg-blue-50 rounded-lg text-center">
                          <p className="text-2xl mb-2">🌙</p>
                          <p className="font-medium">Dinner</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedBooking.listingId.mealTimings.night.from} - {selectedBooking.listingId.mealTimings.night.to}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Policies */}
              <Card className="border border-HG-400/20 shadow-sm rounded-2xl bg-white">
                <CardHeader>
                  <CardTitle className="text-HG-500 flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Policies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-HG-500" />
                        <span className="font-medium">Guest/Visitor Policy</span>
                      </div>
                      {getPolicyBadge(selectedBooking.listingId.detailedRules.guestStayPolicy)}
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Cigarette className="h-5 w-5 text-HG-500" />
                        <span className="font-medium">Smoking/Alcohol Policy</span>
                      </div>
                      {getPolicyBadge(selectedBooking.listingId.detailedRules.smokingAlcoholPolicy)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* General Rules */}
              {selectedBooking.listingId.rulesAndRegulations.length > 0 && (
                <Card className="border border-HG-400/20 shadow-sm rounded-2xl bg-white">
                  <CardHeader>
                    <CardTitle className="text-HG-500 flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      General Rules & Regulations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedBooking.listingId.rulesAndRegulations.map((rule, index) => (
                        <div 
                          key={index}
                          className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="h-8 w-8 rounded-full bg-HG-100 flex items-center justify-center flex-shrink-0">
                            {getRuleIcon(rule)}
                          </div>
                          <p className="text-sm pt-1">{rule}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Owner Contact */}
              <Card className="border-2 border-HG-400 shadow-sm rounded-2xl bg-gradient-to-r from-HG-50 to-orange-50">
                <CardHeader>
                  <CardTitle className="text-HG-500 flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    PG Owner/Warden Contact
                  </CardTitle>
                  <CardDescription>
                    Contact for any queries or emergencies
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="h-14 w-14 rounded-full bg-HG-500 flex items-center justify-center">
                        <User className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{selectedBooking.listingId.ownerId?.fullName || "PG Owner"}</p>
                        <p className="text-muted-foreground">{selectedBooking.listingId.pgName}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      {selectedBooking.listingId.ownerId?.phone && (
                        <Button 
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => window.open(`tel:${selectedBooking.listingId.ownerId.phone}`)}
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          Call
                        </Button>
                      )}
                      {selectedBooking.listingId.ownerId?.email && (
                        <Button 
                          variant="outline"
                          className="border-HG-500 text-HG-500 hover:bg-HG-50"
                          onClick={() => window.open(`mailto:${selectedBooking.listingId.ownerId.email}`)}
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Email
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Agreement Preview Dialog */}
      <Dialog open={showAgreement} onOpenChange={setShowAgreement}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-HG-500">Rental Agreement Preview</DialogTitle>
            <DialogDescription>
              Review your rental agreement terms
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4">
            {selectedBooking && (
              <div className="space-y-6 py-4">
                <div className="text-center border-b pb-6">
                  <h2 className="text-2xl font-bold">RENTAL AGREEMENT</h2>
                  <p className="text-muted-foreground">SpotYourPG - PG Accommodation Agreement</p>
                </div>

                <div className="space-y-4">
                  <p>
                    This Rental Agreement is entered into on{" "}
                    <strong>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>{" "}
                    between:
                  </p>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold mb-2">LANDLORD/OWNER</h4>
                      <p>{selectedBooking.listingId.ownerId?.fullName || "PG Owner"}</p>
                      <p className="text-sm text-muted-foreground">{selectedBooking.listingId.pgName}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedBooking.listingId.location.area}, {selectedBooking.listingId.location.city}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold mb-2">TENANT</h4>
                      <p>{selectedBooking.fullName}</p>
                      <p className="text-sm text-muted-foreground">{selectedBooking.email}</p>
                      <p className="text-sm text-muted-foreground">{selectedBooking.phoneNumber}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">1. PROPERTY DETAILS</h4>
                    <p>
                      The Landlord hereby agrees to let out the following accommodation to the Tenant:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground">
                      <li>Property: {selectedBooking.listingId.pgName}</li>
                      <li>Room Type: {selectedBooking.roomType}</li>
                      <li>Address: {selectedBooking.listingId.location.area}, {selectedBooking.listingId.location.city}, {selectedBooking.listingId.location.state} - {selectedBooking.listingId.location.pincode}</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">2. TERM OF AGREEMENT</h4>
                    <ul className="list-disc list-inside text-muted-foreground">
                      <li>Commencement Date: {new Date(selectedBooking.moveInDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</li>
                      <li>Duration: {selectedBooking.duration} months</li>
                      {selectedBooking.listingId.detailedRules.lockInPeriod && (
                        <li>Lock-in Period: {selectedBooking.listingId.detailedRules.lockInPeriod}</li>
                      )}
                      {selectedBooking.listingId.detailedRules.noticePeriod && (
                        <li>Notice Period: {selectedBooking.listingId.detailedRules.noticePeriod}</li>
                      )}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">3. RENT AND DEPOSIT</h4>
                    <ul className="list-disc list-inside text-muted-foreground">
                      <li>Monthly Rent: ₹{selectedBooking.amount.toLocaleString()}</li>
                      <li>Security Deposit: ₹{selectedBooking.securityDeposit.toLocaleString()} (Refundable)</li>
                      <li>Rent Due Date: Same date as move-in date each month</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">4. RULES AND REGULATIONS</h4>
                    <p>The Tenant agrees to abide by the following rules:</p>
                    <ul className="list-disc list-inside text-muted-foreground">
                      {selectedBooking.listingId.rulesAndRegulations.map((rule, index) => (
                        <li key={index}>{rule}</li>
                      ))}
                      {selectedBooking.listingId.detailedRules.entryTiming && (
                        <li>Entry Timing: {selectedBooking.listingId.detailedRules.entryTiming}</li>
                      )}
                      {selectedBooking.listingId.detailedRules.guestStayPolicy && (
                        <li>Guest Policy: {selectedBooking.listingId.detailedRules.guestStayPolicy.replace("-", " ")}</li>
                      )}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">5. TERMINATION</h4>
                    <p className="text-muted-foreground">
                      Either party may terminate this agreement by providing the required notice period as mentioned above. 
                      The security deposit will be refunded after deducting any outstanding dues and damages (if any).
                    </p>
                  </div>

                  <div className="border-t pt-6 mt-8">
                    <div className="grid md:grid-cols-2 gap-8">
                      <div>
                        <p className="font-semibold mb-8">Landlord Signature</p>
                        <div className="border-t border-dashed pt-2">
                          <p className="text-sm text-muted-foreground">{selectedBooking.listingId.ownerId?.fullName || "PG Owner"}</p>
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold mb-8">Tenants Signature</p>
                        <div className="border-t border-dashed pt-2">
                          <p className="text-sm text-muted-foreground">{selectedBooking.fullName}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowAgreement(false)}>
              Close
            </Button>
            <Button 
              onClick={handleDownloadAgreement}
              disabled={downloadingAgreement}
              className="bg-HG-500 hover:bg-HG-600 text-white"
            >
              {downloadingAgreement ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Download Agreement
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}