// app/routes/dashboard/admin/kyc/page.tsx
"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Eye,
  ExternalLink,
  CreditCard,
  Building,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Owner {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  ownerStatus: string;
  registeredAt: string;
  profile: {
    aadhaarNumber: string;
    phoneVerified: boolean;
    address: {
      street: string;
      city: string;
      state: string;
      pincode: string;
    };
    documents: {
      aadhaarFront: string;
      aadhaarBack: string;
      additionalDocuments: { url: string; public_id: string }[];
    };
    paymentDetails: {
      accountNumber: string;
      ifscCode: string;
      accountHolderName: string;
      bankName: string;
      upiId: string;
    };
  } | null;
}

interface Summary {
  pending: number;
  verified: number;
  rejected: number;
  none: number;
}

export default function KYCVerificationPage() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchOwners = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/api/admin/kyc?status=${activeTab}&page=${currentPage}`
      );
      if (response.data.success) {
        setOwners(response.data.data);
        setSummary(response.data.summary);
        setTotalPages(response.data.totalPages);
        setTotal(response.data.total);
      }
    } catch (error) {
      toast.error("Failed to fetch KYC data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwners();
  }, [activeTab, currentPage]);

  const handleAction = async (action: "approve" | "reject") => {
    if (!selectedOwner) return;

    try {
      setActionLoading(true);
      const response = await axios.patch("/api/admin/kyc", {
        userId: selectedOwner.userId,
        action,
        rejectionReason: action === "reject" ? rejectionReason : undefined,
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setSelectedOwner(null);
        setRejectionReason("");
        fetchOwners();
      }
    } catch (error) {
      toast.error("Failed to perform action");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="border-yellow-300 text-yellow-700">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "verified":
        return (
          <Badge variant="outline" className="border-green-300 text-green-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="border-red-300 text-red-700">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-gray-300 text-gray-700">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Not Submitted
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const maskAadhaar = (aadhaar: string) => {
    if (!aadhaar) return "Not provided";
    return `XXXX-XXXX-${aadhaar.slice(-4)}`;
  };

  if (loading && owners.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-HG-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading KYC data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-poppins">
          KYC <span className="text-HG-500">Verification</span>
        </h1>
        <p className="text-gray-600 mt-1">
          Verify owner identity documents and approve registrations
        </p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{summary.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Verified</p>
                  <p className="text-2xl font-bold text-green-600">{summary.verified}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">{summary.rejected}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-gray-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Not Submitted</p>
                  <p className="text-2xl font-bold text-gray-600">{summary.none}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="verified">Verified</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {owners.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No {activeTab} KYC requests
                </h3>
                <p className="text-gray-600">
                  {activeTab === "pending"
                    ? "No pending KYC verifications at the moment."
                    : `No ${activeTab} owners found.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Owner</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Documents</TableHead>
                        <TableHead>Registered</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {owners.map((owner) => (
                        <TableRow key={owner.userId}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-HG-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-HG-600" />
                              </div>
                              <div>
                                <p className="font-medium">{owner.fullName}</p>
                                <p className="text-xs text-gray-500">{owner.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{owner.phone || "No phone"}</p>
                              {owner.profile?.phoneVerified && (
                                <Badge
                                  variant="outline"
                                  className="text-xs border-green-300 text-green-600"
                                >
                                  Verified
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {owner.profile?.documents?.aadhaarFront ? (
                                <span className="text-green-600 flex items-center gap-1">
                                  <FileText className="w-3 h-3" />
                                  Aadhaar Uploaded
                                </span>
                              ) : (
                                <span className="text-gray-500">No documents</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(owner.registeredAt)}</TableCell>
                          <TableCell>{getStatusBadge(owner.ownerStatus)}</TableCell>
                          <TableCell className="text-right">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedOwner(owner)}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  Review
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>KYC Verification Details</DialogTitle>
                                  <DialogDescription>
                                    Review owner documents and verify identity
                                  </DialogDescription>
                                </DialogHeader>
                                {selectedOwner && (
                                  <div className="space-y-6">
                                    {/* Basic Info */}
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        Personal Information
                                      </h4>
                                      <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                          <span className="text-gray-500">Full Name:</span>
                                          <p className="font-medium">{selectedOwner.fullName}</p>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Email:</span>
                                          <p className="font-medium">{selectedOwner.email}</p>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Phone:</span>
                                          <p className="font-medium">
                                            {selectedOwner.phone || "Not provided"}
                                            {selectedOwner.profile?.phoneVerified && (
                                              <Badge className="ml-2 text-xs" variant="outline">
                                                ✓ Verified
                                              </Badge>
                                            )}
                                          </p>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Aadhaar:</span>
                                          <p className="font-medium">
                                            {maskAadhaar(selectedOwner.profile?.aadhaarNumber || "")}
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Address */}
                                    {selectedOwner.profile?.address && (
                                      <div className="p-4 bg-blue-50 rounded-lg">
                                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                                          <MapPin className="h-4 w-4" />
                                          Address
                                        </h4>
                                        <p className="text-sm">
                                          {selectedOwner.profile.address.street},{" "}
                                          {selectedOwner.profile.address.city},{" "}
                                          {selectedOwner.profile.address.state} -{" "}
                                          {selectedOwner.profile.address.pincode}
                                        </p>
                                      </div>
                                    )}

                                    {/* Documents */}
                                    <div className="p-4 bg-green-50 rounded-lg">
                                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        Identity Documents
                                      </h4>
                                      <div className="grid grid-cols-2 gap-4">
                                        {selectedOwner.profile?.documents?.aadhaarFront ? (
                                          <div>
                                            <p className="text-sm text-gray-500 mb-2">
                                              Aadhaar Front
                                            </p>
                                            <a
                                              href={selectedOwner.profile.documents.aadhaarFront}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="flex items-center gap-2 text-HG-600 hover:text-HG-700"
                                            >
                                              <ExternalLink className="w-4 h-4" />
                                              View Document
                                            </a>
                                          </div>
                                        ) : (
                                          <p className="text-sm text-gray-500">
                                            Aadhaar Front: Not uploaded
                                          </p>
                                        )}

                                        {selectedOwner.profile?.documents?.aadhaarBack ? (
                                          <div>
                                            <p className="text-sm text-gray-500 mb-2">
                                              Aadhaar Back
                                            </p>
                                            <a
                                              href={selectedOwner.profile.documents.aadhaarBack}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="flex items-center gap-2 text-HG-600 hover:text-HG-700"
                                            >
                                              <ExternalLink className="w-4 h-4" />
                                              View Document
                                            </a>
                                          </div>
                                        ) : (
                                          <p className="text-sm text-gray-500">
                                            Aadhaar Back: Not uploaded
                                          </p>
                                        )}
                                      </div>

                                      {selectedOwner.profile?.documents?.additionalDocuments &&
                                        selectedOwner.profile.documents.additionalDocuments.length >
                                          0 && (
                                          <div className="mt-4">
                                            <p className="text-sm text-gray-500 mb-2">
                                              Additional Documents
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                              {selectedOwner.profile.documents.additionalDocuments.map(
                                                (doc, index) => (
                                                  <a
                                                    key={index}
                                                    href={doc.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 px-2 py-1 bg-white rounded border text-sm text-HG-600 hover:bg-gray-50"
                                                  >
                                                    <FileText className="w-3 h-3" />
                                                    Doc {index + 1}
                                                  </a>
                                                )
                                              )}
                                            </div>
                                          </div>
                                        )}
                                    </div>

                                    {/* Bank Details */}
                                    {selectedOwner.profile?.paymentDetails && (
                                      <div className="p-4 bg-yellow-50 rounded-lg">
                                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                                          <CreditCard className="h-4 w-4" />
                                          Payment Details
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                          {selectedOwner.profile.paymentDetails.bankName && (
                                            <div>
                                              <span className="text-gray-500">Bank:</span>
                                              <p className="font-medium">
                                                {selectedOwner.profile.paymentDetails.bankName}
                                              </p>
                                            </div>
                                          )}
                                          {selectedOwner.profile.paymentDetails.accountNumber && (
                                            <div>
                                              <span className="text-gray-500">Account:</span>
                                              <p className="font-medium">
                                                XXXX
                                                {selectedOwner.profile.paymentDetails.accountNumber.slice(
                                                  -4
                                                )}
                                              </p>
                                            </div>
                                          )}
                                          {selectedOwner.profile.paymentDetails.ifscCode && (
                                            <div>
                                              <span className="text-gray-500">IFSC:</span>
                                              <p className="font-medium">
                                                {selectedOwner.profile.paymentDetails.ifscCode}
                                              </p>
                                            </div>
                                          )}
                                          {selectedOwner.profile.paymentDetails.upiId && (
                                            <div>
                                              <span className="text-gray-500">UPI:</span>
                                              <p className="font-medium">
                                                {selectedOwner.profile.paymentDetails.upiId}
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* Current Status */}
                                    <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg">
                                      <div>
                                        <p className="text-sm text-gray-500">Current Status</p>
                                        {getStatusBadge(selectedOwner.ownerStatus)}
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-500">Registered On</p>
                                        <p className="font-medium">
                                          {formatDate(selectedOwner.registeredAt)}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Actions */}
                                    {selectedOwner.ownerStatus === "pending" && (
                                      <div className="space-y-4 pt-4 border-t">
                                        <div>
                                          <label className="text-sm font-medium mb-2 block">
                                            Rejection Reason (if rejecting)
                                          </label>
                                          <Textarea
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            placeholder="Enter reason for rejection..."
                                          />
                                        </div>
                                        <div className="flex gap-3">
                                          <Button
                                            onClick={() => handleAction("approve")}
                                            disabled={actionLoading}
                                            className="flex-1 bg-green-600 hover:bg-green-700"
                                          >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            {actionLoading ? "Processing..." : "Approve KYC"}
                                          </Button>
                                          <Button
                                            onClick={() => handleAction("reject")}
                                            disabled={actionLoading}
                                            variant="destructive"
                                            className="flex-1"
                                          >
                                            <XCircle className="w-4 h-4 mr-2" />
                                            {actionLoading ? "Processing..." : "Reject KYC"}
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {owners.length} of {total} owners
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}