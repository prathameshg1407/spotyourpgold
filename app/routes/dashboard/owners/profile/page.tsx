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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit,
  Save,
  X,
  Upload,
  FileText,
  Building,
  CreditCard,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useUserStore } from "@/store/userStore";
import axios from "axios";
import { toast } from "sonner";
import ChangePasswordModal from "@/components/ChangePasswordModal";

interface OwnerProfile {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  ownerStatus: string;
  createdAt: string;
  ownerProfile?: {
    _id: string;
    userId: string;
    phone: string;
    phoneVerified: boolean;
    aadhaarNumber: string;
    address: {
      street: string;
      city: string;
      state: string;
      pincode: string;
      country: string;
      coordinates?: {
        lat: number;
        lng: number;
      };
    };
    documents: {
      aadhaarFrontUrl?: string;
      aadhaarBackUrl?: string;
      aadhaarFrontPublicId?: string;
      aadhaarBackPublicId?: string;
      additionalDocuments: Array<{
        url: string;
        public_id: string;
      }>;
    };
    paymentDetails: {
      accountNumber: string;
      ifscCode: string;
      accountHolderName: string;
      bankName: string;
      upiId: string;
    };
    createdAt: string;
    updatedAt: string;
  };
}

export default function OwnerProfilePage() {
  const { user, setUser } = useUserStore();
  const [profile, setProfile] = useState<OwnerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState({
    personal: false,
    owner: false,
    payment: false,
  });
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: "",
    phone: "",
    aadhaarNumber: "",
    address: {
      street: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
    },
    paymentDetails: {
      accountNumber: "",
      ifscCode: "",
      accountHolderName: "",
      bankName: "",
      upiId: "",
    },
  });

  useEffect(() => {
    if (user?.id) {
      fetchOwnerProfile();
    }
  }, [user?.id]);

  const fetchOwnerProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/auth/getuser?id=${user?.id}`);
      if (response.data.success) {
        const userData = response.data.user;
        setProfile(userData);
        setEditForm({
          fullName: userData.fullName || "",
          phone: userData.ownerProfile?.phone || userData.phone || "",
          aadhaarNumber: userData.ownerProfile?.aadhaarNumber || "",
          address: {
            street: userData.ownerProfile?.address?.street || "",
            city: userData.ownerProfile?.address?.city || "",
            state: userData.ownerProfile?.address?.state || "",
            pincode: userData.ownerProfile?.address?.pincode || "",
            country: userData.ownerProfile?.address?.country || "India",
          },
          paymentDetails: {
            accountNumber:
              userData.ownerProfile?.paymentDetails?.accountNumber || "",
            ifscCode: userData.ownerProfile?.paymentDetails?.ifscCode || "",
            accountHolderName:
              userData.ownerProfile?.paymentDetails?.accountHolderName || "",
            bankName: userData.ownerProfile?.paymentDetails?.bankName || "",
            upiId: userData.ownerProfile?.paymentDetails?.upiId || "",
          },
        });
      }
    } catch (error) {
      toast.error("Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (section: "personal" | "owner" | "payment") => {
    setEditing((prev) => ({ ...prev, [section]: true }));
  };

  const handleCancel = (section: "personal" | "owner" | "payment") => {
    setEditing((prev) => ({ ...prev, [section]: false }));
    setEditForm({
      fullName: profile?.fullName || "",
      phone: profile?.ownerProfile?.phone || profile?.phone || "",
      aadhaarNumber: profile?.ownerProfile?.aadhaarNumber || "",
      address: {
        street: profile?.ownerProfile?.address?.street || "",
        city: profile?.ownerProfile?.address?.city || "",
        state: profile?.ownerProfile?.address?.state || "",
        pincode: profile?.ownerProfile?.address?.pincode || "",
        country: profile?.ownerProfile?.address?.country || "India",
      },
      paymentDetails: {
        accountNumber:
          profile?.ownerProfile?.paymentDetails?.accountNumber || "",
        ifscCode: profile?.ownerProfile?.paymentDetails?.ifscCode || "",
        accountHolderName:
          profile?.ownerProfile?.paymentDetails?.accountHolderName || "",
        bankName: profile?.ownerProfile?.paymentDetails?.bankName || "",
        upiId: profile?.ownerProfile?.paymentDetails?.upiId || "",
      },
    });
  };

  const handleSave = async (section: "personal" | "owner" | "payment") => {
    setSaving(section);

    try {
      const payload: any = { userId: user?.id };

      if (section === "personal") {
        if (!editForm.fullName.trim()) {
          toast.error("Full name is required");
          setSaving(null);
          return;
        }
        payload.fullName = editForm.fullName;
        payload.phone = editForm.phone;
      }

      if (section === "owner") {
        if (!editForm.aadhaarNumber.trim()) {
          toast.error("Aadhaar number is required");
          setSaving(null);
          return;
        }
        payload.aadhaarNumber = editForm.aadhaarNumber;
        payload.address = editForm.address;
      }

      if (section === "payment") {
        payload.paymentDetails = editForm.paymentDetails;
      }

      const response = await axios.put(`/api/owner/update-profile`, payload);

      if (response.data.success) {
        toast.success(
          `${
            section.charAt(0).toUpperCase() + section.slice(1)
          } information updated successfully`
        );
        setEditing((prev) => ({ ...prev, [section]: false }));
        fetchOwnerProfile();

        if (section === "personal" && user) {
          setUser({
            ...user,
            fullName: editForm.fullName,
            phone: editForm.phone,
          });
        }
      } else {
        toast.error("Failed to update profile");
      }
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setSaving(null);
    }
  };

  const handleDocumentUpload = async (documentType: string, file: File) => {
    if (!user?.id) {
      toast.error("User not found");
      return;
    }

    setUploading(documentType);
    try {
      const formData = new FormData();
      formData.append("userId", user.id);
      formData.append("documentType", documentType);
      formData.append("file", file);

      const response = await axios.post(
        "/api/owner/upload-document",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        toast.success("Document uploaded successfully");
        fetchOwnerProfile();
      } else {
        toast.error(response.data.message || "Failed to upload document");
      }
    } catch (error) {
      toast.error("Failed to upload document");
    } finally {
      setUploading(null);
    }
  };

  const handleFileSelect = (documentType: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/jpg,image/png,application/pdf";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleDocumentUpload(documentType, file);
      }
    };
    input.click();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="h-4 w-4" />;
      case "pending":
        return <AlertCircle className="h-4 w-4" />;
      case "rejected":
        return <X className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  // Helper function to get missing profile items
  const getMissingProfileItems = () => {
    if (!profile) return [];

    const missingItems: string[] = [];

    if (!profile.ownerProfile?.aadhaarNumber) {
      missingItems.push("Aadhaar number");
    }
    if (!profile.ownerProfile?.documents?.aadhaarFrontUrl) {
      missingItems.push("Aadhaar front document");
    }
    if (!profile.ownerProfile?.documents?.aadhaarBackUrl) {
      missingItems.push("Aadhaar back document");
    }
    if (!profile.ownerProfile?.paymentDetails?.accountNumber) {
      missingItems.push("bank account details");
    }
    if (!profile.ownerProfile?.address?.street) {
      missingItems.push("address");
    }

    return missingItems;
  };

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 pt-4 pb-14">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-HG-500"></div>
          <span className="ml-2 text-muted-foreground">Loading profile...</span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6 pt-4 pb-14">
        <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl bg-white">
          <CardContent className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              Profile Not Found
            </h3>
            <p className="text-gray-500">
              Unable to load your profile information.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const missingItems = getMissingProfileItems();
  const showCompleteBanner =
    missingItems.length > 0 && profile.ownerStatus !== "verified";

  return (
    <div className="space-y-6 pt-4 pb-14">
      <div>
        <h1 className="text-3xl font-bold text-HG-500">Owner Profile</h1>
        <p className="text-muted-foreground mt-2">
          Manage your business information and documents
        </p>
      </div>

      {/* Status Card */}
      <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl bg-white">
        <CardHeader>
          <CardTitle className="text-HG-500">Account Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            {getStatusIcon(profile.ownerStatus)}
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                profile.ownerStatus
              )}`}
            >
              {profile.ownerStatus.charAt(0).toUpperCase() +
                profile.ownerStatus.slice(1)}
            </span>
            <span className="text-sm text-gray-600">
              {profile.ownerStatus === "verified"
                ? "Your account is verified and active"
                : profile.ownerStatus === "pending"
                ? "Your account is under review"
                : "Your account needs attention"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Complete Profile Banner - Show if profile is incomplete and not verified */}
      {showCompleteBanner && (
        <Card className="border border-orange-300 bg-orange-50 shadow-md rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <AlertCircle className="h-6 w-6 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-orange-900 mb-1">
                    Complete Your Profile to Get Verified
                  </p>
                  <p className="text-sm text-orange-700">
                    Missing: {missingItems.join(", ")}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => {
                  // Determine which section to scroll to based on what's missing
                  if (
                    !profile.ownerProfile?.aadhaarNumber ||
                    !profile.ownerProfile?.address?.street
                  ) {
                    scrollToSection("owner-info-section");
                  } else if (
                    !profile.ownerProfile?.documents?.aadhaarFrontUrl ||
                    !profile.ownerProfile?.documents?.aadhaarBackUrl
                  ) {
                    scrollToSection("documents-section");
                  } else if (
                    !profile.ownerProfile?.paymentDetails?.accountNumber
                  ) {
                    scrollToSection("payment-section");
                  }
                }}
                className="bg-orange-600 hover:bg-orange-700 whitespace-nowrap"
              >
                Complete Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal Information */}
        <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-HG-500">
                Personal Information
              </CardTitle>
              {!editing.personal ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit("personal")}
                  className="border-HG-500 text-HG-500 hover:bg-HG-50"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSave("personal")}
                    disabled={saving === "personal"}
                    className="bg-HG-500 hover:bg-HG-600 text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving === "personal" ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCancel("personal")}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              {editing.personal ? (
                <Input
                  id="fullName"
                  value={editForm.fullName}
                  onChange={(e) =>
                    setEditForm({ ...editForm, fullName: e.target.value })
                  }
                  className="border-gray-300 focus:ring-HG-500 focus:border-HG-500"
                />
              ) : (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <User className="h-4 w-4 text-gray-500" />
                  <span>{profile.fullName}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Mail className="h-4 w-4 text-gray-500" />
                <span>{profile.email}</span>
              </div>
              <p className="text-xs text-gray-500">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              {editing.personal ? (
                <Input
                  id="phone"
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phone: e.target.value })
                  }
                  className="border-gray-300 focus:ring-HG-500 focus:border-HG-500"
                />
              ) : (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>{profile.phone || "Not provided"}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Member Since</Label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>{new Date(profile.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Owner Information */}
        <Card
          id="owner-info-section"
          className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl bg-white"
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-HG-500">Owner Information</CardTitle>
              {!editing.owner ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit("owner")}
                  className="border-HG-500 text-HG-500 hover:bg-HG-50"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSave("owner")}
                    disabled={saving === "owner"}
                    className="bg-HG-500 hover:bg-HG-600 text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving === "owner" ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCancel("owner")}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="aadhaarNumber">Aadhaar Number</Label>
              {editing.owner ? (
                <Input
                  id="aadhaarNumber"
                  value={editForm.aadhaarNumber}
                  onChange={(e) =>
                    setEditForm({ ...editForm, aadhaarNumber: e.target.value })
                  }
                  className="border-gray-300 focus:ring-HG-500 focus:border-HG-500"
                  placeholder="Enter your Aadhaar number"
                />
              ) : (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <CreditCard className="h-4 w-4 text-gray-500" />
                  <span>
                    {profile.ownerProfile?.aadhaarNumber || "Not provided"}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Address</Label>
              {editing.owner ? (
                <div className="space-y-2">
                  <Input
                    value={editForm.address.street}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        address: {
                          ...editForm.address,
                          street: e.target.value,
                        },
                      })
                    }
                    placeholder="Street Address"
                    className="border-gray-300 focus:ring-HG-500 focus:border-HG-500"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={editForm.address.city}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          address: {
                            ...editForm.address,
                            city: e.target.value,
                          },
                        })
                      }
                      placeholder="City"
                      className="border-gray-300 focus:ring-HG-500 focus:border-HG-500"
                    />
                    <Input
                      value={editForm.address.state}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          address: {
                            ...editForm.address,
                            state: e.target.value,
                          },
                        })
                      }
                      placeholder="State"
                      className="border-gray-300 focus:ring-HG-500 focus:border-HG-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={editForm.address.pincode}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          address: {
                            ...editForm.address,
                            pincode: e.target.value,
                          },
                        })
                      }
                      placeholder="Pincode"
                      className="border-gray-300 focus:ring-HG-500 focus:border-HG-500"
                    />
                    <Input
                      value={editForm.address.country}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          address: {
                            ...editForm.address,
                            country: e.target.value,
                          },
                        })
                      }
                      placeholder="Country"
                      className="border-gray-300 focus:ring-HG-500 focus:border-HG-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                  <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div>
                    {profile.ownerProfile?.address?.street ? (
                      <div className="text-sm">
                        <p>{profile.ownerProfile.address.street}</p>
                        <p>
                          {profile.ownerProfile.address.city},{" "}
                          {profile.ownerProfile.address.state} -{" "}
                          {profile.ownerProfile.address.pincode}
                        </p>
                        <p>{profile.ownerProfile.address.country}</p>
                      </div>
                    ) : (
                      <span className="text-gray-500">Not provided</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Phone Verification Status - Commented out until phone verification is implemented */}
            {/* <div className="space-y-2">
              <Label>Phone Verification Status</Label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                {profile.ownerProfile?.phoneVerified ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                )}
                <span
                  className={
                    profile.ownerProfile?.phoneVerified
                      ? "text-green-600"
                      : "text-yellow-600"
                  }
                >
                  {profile.ownerProfile?.phoneVerified
                    ? "Verified"
                    : "Not Verified"}
                </span>
              </div>
            </div> */}
          </CardContent>
        </Card>
      </div>

      {/* Documents Section */}
      <Card
        id="documents-section"
        className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl bg-white"
      >
        <CardHeader>
          <CardTitle className="text-HG-500">
            Documents & Verification
          </CardTitle>
          <CardDescription>
            Upload and manage your business documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Aadhaar Front */}
            <div className="space-y-2">
              <Label>Aadhaar Front</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                {profile.ownerProfile?.documents?.aadhaarFrontUrl ? (
                  <div className="space-y-2">
                    <FileText className="h-8 w-8 text-green-500 mx-auto" />
                    <p className="text-sm text-green-600">
                      Aadhaar Front Uploaded
                    </p>
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          window.open(
                            profile.ownerProfile?.documents?.aadhaarFrontUrl,
                            "_blank"
                          )
                        }
                      >
                        View Document
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleFileSelect("aadhaarFront")}
                        disabled={uploading === "aadhaarFront"}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        {uploading === "aadhaarFront"
                          ? "Uploading..."
                          : "Replace"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                    <p className="text-sm text-gray-500">
                      Upload Aadhaar Front
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleFileSelect("aadhaarFront")}
                      disabled={uploading === "aadhaarFront"}
                    >
                      {uploading === "aadhaarFront" ? "Uploading..." : "Upload"}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Aadhaar Back */}
            <div className="space-y-2">
              <Label>Aadhaar Back</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                {profile.ownerProfile?.documents?.aadhaarBackUrl ? (
                  <div className="space-y-2">
                    <FileText className="h-8 w-8 text-green-500 mx-auto" />
                    <p className="text-sm text-green-600">
                      Aadhaar Back Uploaded
                    </p>
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          window.open(
                            profile.ownerProfile?.documents?.aadhaarBackUrl,
                            "_blank"
                          )
                        }
                      >
                        View Document
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleFileSelect("aadhaarBack")}
                        disabled={uploading === "aadhaarBack"}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        {uploading === "aadhaarBack"
                          ? "Uploading..."
                          : "Replace"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                    <p className="text-sm text-gray-500">Upload Aadhaar Back</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleFileSelect("aadhaarBack")}
                      disabled={uploading === "aadhaarBack"}
                    >
                      {uploading === "aadhaarBack" ? "Uploading..." : "Upload"}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Documents */}
            <div className="space-y-2">
              <Label>Additional Documents</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                {profile.ownerProfile?.documents?.additionalDocuments &&
                profile.ownerProfile.documents.additionalDocuments.length >
                  0 ? (
                  <div className="space-y-2">
                    <FileText className="h-8 w-8 text-green-500 mx-auto" />
                    <p className="text-sm text-green-600">
                      {
                        profile.ownerProfile.documents.additionalDocuments
                          .length
                      }{" "}
                      Document(s) Uploaded
                    </p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {profile.ownerProfile.documents.additionalDocuments.map(
                        (doc, index) => (
                          <Button
                            key={index}
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(doc.url, "_blank")}
                            className="w-full"
                          >
                            View Doc {index + 1}
                          </Button>
                        )
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleFileSelect("additional")}
                      disabled={uploading === "additional"}
                      className="text-gray-500 hover:text-gray-700 mt-2"
                    >
                      {uploading === "additional" ? "Uploading..." : "Add More"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                    <p className="text-sm text-gray-500">
                      Upload Additional Documents
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleFileSelect("additional")}
                      disabled={uploading === "additional"}
                    >
                      {uploading === "additional" ? "Uploading..." : "Upload"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Details Section */}
      <Card
        id="payment-section"
        className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl bg-white"
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-HG-500">Payment Details</CardTitle>
              <CardDescription>
                Manage your bank account and payment information
              </CardDescription>
            </div>
            {!editing.payment ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit("payment")}
                className="border-HG-500 text-HG-500 hover:bg-HG-50"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleSave("payment")}
                  disabled={saving === "payment"}
                  className="bg-HG-500 hover:bg-HG-600 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving === "payment" ? "Saving..." : "Save"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCancel("payment")}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              {editing.payment ? (
                <Input
                  id="accountNumber"
                  value={editForm.paymentDetails.accountNumber}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      paymentDetails: {
                        ...editForm.paymentDetails,
                        accountNumber: e.target.value,
                      },
                    })
                  }
                  className="border-gray-300 focus:ring-HG-500 focus:border-HG-500"
                  placeholder="Enter account number"
                />
              ) : (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <CreditCard className="h-4 w-4 text-gray-500" />
                  <span>
                    {profile.ownerProfile?.paymentDetails?.accountNumber ||
                      "Not provided"}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ifscCode">IFSC Code</Label>
              {editing.payment ? (
                <Input
                  id="ifscCode"
                  value={editForm.paymentDetails.ifscCode}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      paymentDetails: {
                        ...editForm.paymentDetails,
                        ifscCode: e.target.value,
                      },
                    })
                  }
                  className="border-gray-300 focus:ring-HG-500 focus:border-HG-500"
                  placeholder="Enter IFSC code"
                />
              ) : (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <CreditCard className="h-4 w-4 text-gray-500" />
                  <span>
                    {profile.ownerProfile?.paymentDetails?.ifscCode ||
                      "Not provided"}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountHolderName">Account Holder Name</Label>
              {editing.payment ? (
                <Input
                  id="accountHolderName"
                  value={editForm.paymentDetails.accountHolderName}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      paymentDetails: {
                        ...editForm.paymentDetails,
                        accountHolderName: e.target.value,
                      },
                    })
                  }
                  className="border-gray-300 focus:ring-HG-500 focus:border-HG-500"
                  placeholder="Enter account holder name"
                />
              ) : (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <User className="h-4 w-4 text-gray-500" />
                  <span>
                    {profile.ownerProfile?.paymentDetails?.accountHolderName ||
                      "Not provided"}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              {editing.payment ? (
                <Input
                  id="bankName"
                  value={editForm.paymentDetails.bankName}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      paymentDetails: {
                        ...editForm.paymentDetails,
                        bankName: e.target.value,
                      },
                    })
                  }
                  className="border-gray-300 focus:ring-HG-500 focus:border-HG-500"
                  placeholder="Enter bank name"
                />
              ) : (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Building className="h-4 w-4 text-gray-500" />
                  <span>
                    {profile.ownerProfile?.paymentDetails?.bankName ||
                      "Not provided"}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="upiId">UPI ID</Label>
              {editing.payment ? (
                <Input
                  id="upiId"
                  value={editForm.paymentDetails.upiId}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      paymentDetails: {
                        ...editForm.paymentDetails,
                        upiId: e.target.value,
                      },
                    })
                  }
                  className="border-gray-300 focus:ring-HG-500 focus:border-HG-500"
                  placeholder="Enter UPI ID"
                />
              ) : (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <CreditCard className="h-4 w-4 text-gray-500" />
                  <span>
                    {profile.ownerProfile?.paymentDetails?.upiId ||
                      "Not provided"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl bg-white">
        <CardHeader>
          <CardTitle className="text-HG-500">Account Actions</CardTitle>
          <CardDescription>
            Manage your account settings and security
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-start">
            <Button
              variant="outline"
              className="border-HG-500 text-HG-500 hover:bg-HG-50"
              onClick={() => setShowChangePasswordModal(true)}
            >
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        userEmail={profile.email}
      />
    </div>
  );
}