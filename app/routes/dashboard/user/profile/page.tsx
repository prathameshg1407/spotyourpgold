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
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit,
  Save,
  X,
} from "lucide-react";
import { useUserStore } from "@/store/userStore";
import axios from "axios";
import { toast } from "sonner";
import ChangePasswordModal from "@/components/ChangePasswordModal";

interface UserProfile {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  ownerStatus: string;
  createdAt: string;
}

export default function UserProfilePage() {
  const { user, setUser } = useUserStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState({
    personal: false,
  });
  const [editForm, setEditForm] = useState({
    fullName: "",
    phone: "",
  });
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchUserProfile();
    }
  }, [user?.id]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/auth/getuser?id=${user?.id}`);
      if (response.data.success) {
        const userData = response.data.user;
        setProfile(userData);
        setEditForm({
          fullName: userData.fullName || "",
          phone: userData.phone || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (section: "personal") => {
    setEditing((prev) => ({ ...prev, [section]: true }));
  };

  const handleCancel = (section: "personal") => {
    setEditing((prev) => ({ ...prev, [section]: false }));
    setEditForm({
      fullName: profile?.fullName || "",
      phone: profile?.phone || "",
    });
  };

  const handleSave = async (section: "personal") => {
    setSaving(section);

    try {
      if (!editForm.fullName.trim()) {
        toast.error("Full name is required");
        return;
      }

      const payload: any = { userId: user?.id };

      if (editForm.fullName.trim()) {
        payload.fullName = editForm.fullName.trim();
      }

      if (editForm.phone.trim()) {
        payload.phone = editForm.phone.trim();
      }

      const response = await axios.put(`/api/auth/update-profile`, payload);

      if (response.data.success) {
        toast.success("Personal information updated successfully");
        setEditing((prev) => ({ ...prev, [section]: false }));
        fetchUserProfile();
        // Update the user store
        if (user) {
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
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "owner":
        return "bg-blue-100 text-blue-800";
      case "user":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getOwnerStatusColor = (status: string) => {
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

  return (
    <div className="space-y-6 pt-4 pb-14">
      <div>
        <h1 className="text-3xl font-bold text-HG-500">My Profile</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account information and preferences
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
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
                  <span>{profile.phone}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl bg-white">
          <CardHeader>
            <CardTitle className="text-HG-500">Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Account Role</Label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <User className="h-4 w-4 text-gray-500" />
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                    profile.role
                  )}`}
                >
                  {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                </span>
              </div>
            </div>

            {profile.role === "owner" && (
              <div className="space-y-2">
                <Label>Owner Status</Label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <User className="h-4 w-4 text-gray-500" />
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getOwnerStatusColor(
                      profile.ownerStatus
                    )}`}
                  >
                    {profile.ownerStatus.charAt(0).toUpperCase() +
                      profile.ownerStatus.slice(1)}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Member Since</Label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>{new Date(profile.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Account ID</Label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-mono text-gray-600">
                  {profile._id}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account Actions */}
      <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl bg-white">
        <CardHeader>
          <CardTitle className="text-HG-500">Account Actions</CardTitle>
          <CardDescription>
            Manage your account settings and preferences
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
