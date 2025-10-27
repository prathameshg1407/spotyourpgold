"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Calendar,
  Users,
  Percent,
} from "lucide-react";

interface Coupon {
  _id: string;
  name: string;
  percentage: number;
  isActive: boolean;
  usageCount: number;
  maxUsage: number | null;
  validFrom: string;
  validUntil: string | null;
  createdBy: {
    _id: string;
    fullName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    percentage: "",
    maxUsage: "",
    validUntil: "",
  });

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get("/api/admin/coupons");
      if (response.data.success) {
        setCoupons(response.data.data);
      } else {
        setError(response.data.message || "Failed to fetch coupons");
      }
    } catch (error) {
      console.error("Failed to fetch coupons:", error);
      setError("Failed to fetch coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async () => {
    try {
      setActionLoading("create");
      const response = await axios.post("/api/admin/coupons", {
        name: formData.name,
        percentage: parseInt(formData.percentage),
        maxUsage: formData.maxUsage ? parseInt(formData.maxUsage) : null,
        validUntil: formData.validUntil || null,
      });

      if (response.data.success) {
        toast.success("Coupon created successfully");
        setShowCreateDialog(false);
        setFormData({ name: "", percentage: "", maxUsage: "", validUntil: "" });
        fetchCoupons();
      } else {
        toast.error(response.data.message || "Failed to create coupon");
      }
    } catch (error: any) {
      console.error("Failed to create coupon:", error);
      toast.error(error.response?.data?.message || "Failed to create coupon");
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditCoupon = async () => {
    if (!selectedCoupon) return;

    try {
      setActionLoading("edit");
      const response = await axios.put(
        `/api/admin/coupons/${selectedCoupon._id}`,
        {
          name: formData.name,
          percentage: parseInt(formData.percentage),
          maxUsage: formData.maxUsage ? parseInt(formData.maxUsage) : null,
          validUntil: formData.validUntil || null,
        }
      );

      if (response.data.success) {
        toast.success("Coupon updated successfully");
        setShowEditDialog(false);
        setSelectedCoupon(null);
        setFormData({ name: "", percentage: "", maxUsage: "", validUntil: "" });
        fetchCoupons();
      } else {
        toast.error(response.data.message || "Failed to update coupon");
      }
    } catch (error: any) {
      console.error("Failed to update coupon:", error);
      toast.error(error.response?.data?.message || "Failed to update coupon");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (coupon: Coupon) => {
    try {
      setActionLoading(coupon._id);
      const response = await axios.put(`/api/admin/coupons/${coupon._id}`, {
        isActive: !coupon.isActive,
      });

      if (response.data.success) {
        toast.success(
          `Coupon ${
            !coupon.isActive ? "activated" : "deactivated"
          } successfully`
        );
        fetchCoupons();
      } else {
        toast.error(response.data.message || "Failed to update coupon");
      }
    } catch (error: any) {
      console.error("Failed to toggle coupon status:", error);
      toast.error(error.response?.data?.message || "Failed to update coupon");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;

    try {
      setActionLoading(couponId);
      const response = await axios.delete(`/api/admin/coupons/${couponId}`);

      if (response.data.success) {
        toast.success("Coupon deleted successfully");
        fetchCoupons();
      } else {
        toast.error(response.data.message || "Failed to delete coupon");
      }
    } catch (error: any) {
      console.error("Failed to delete coupon:", error);
      toast.error(error.response?.data?.message || "Failed to delete coupon");
    } finally {
      setActionLoading(null);
    }
  };

  const openEditDialog = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setFormData({
      name: coupon.name,
      percentage: coupon.percentage.toString(),
      maxUsage: coupon.maxUsage?.toString() || "",
      validUntil: coupon.validUntil
        ? new Date(coupon.validUntil).toISOString().split("T")[0]
        : "",
    });
    setShowEditDialog(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-HG-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading coupons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 font-poppins">
            Coupon <span className="text-HG-500">Management</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Create and manage discount coupons for bookings
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Create Coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Coupon</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Coupon Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="e.g., WELCOME10"
                  className="uppercase"
                />
              </div>
              <div>
                <Label htmlFor="percentage">Discount Percentage</Label>
                <Input
                  id="percentage"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.percentage}
                  onChange={(e) =>
                    setFormData({ ...formData, percentage: e.target.value })
                  }
                  placeholder="e.g., 10"
                />
              </div>
              <div>
                <Label htmlFor="maxUsage">Max Usage (Optional)</Label>
                <Input
                  id="maxUsage"
                  type="number"
                  min="1"
                  value={formData.maxUsage}
                  onChange={(e) =>
                    setFormData({ ...formData, maxUsage: e.target.value })
                  }
                  placeholder="Leave empty for unlimited"
                />
              </div>
              <div>
                <Label htmlFor="validUntil">Valid Until (Optional)</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) =>
                    setFormData({ ...formData, validUntil: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleCreateCoupon}
                  disabled={
                    !formData.name ||
                    !formData.percentage ||
                    actionLoading === "create"
                  }
                  className="flex-1"
                >
                  {actionLoading === "create" ? "Creating..." : "Create Coupon"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-red-500">{error}</p>
            <Button variant="outline" onClick={fetchCoupons} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Coupons Table */}
      {!error && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="w-5 h-5" />
              Coupons ({coupons.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {coupons.length === 0 ? (
              <div className="text-center py-12">
                <Percent className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No coupons found
                </h3>
                <p className="text-gray-600">
                  Create your first coupon to start offering discounts.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Coupon Name</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Valid Until</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coupons.map((coupon) => (
                      <TableRow key={coupon._id}>
                        <TableCell className="font-mono font-medium">
                          {coupon.name}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-800"
                          >
                            {coupon.percentage}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">
                              {coupon.usageCount}
                              {coupon.maxUsage && ` / ${coupon.maxUsage}`}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={coupon.isActive ? "default" : "secondary"}
                            className={
                              coupon.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }
                          >
                            {coupon.isActive ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 mr-1" />
                                Inactive
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {coupon.validUntil ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">
                                {formatDate(coupon.validUntil)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">
                              No expiry
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">
                              {coupon.createdBy?.fullName || "Unknown User"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(coupon.createdAt)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(coupon)}
                              disabled={actionLoading === coupon._id}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleStatus(coupon)}
                              disabled={actionLoading === coupon._id}
                              className={
                                coupon.isActive
                                  ? "border-red-300 text-red-600 hover:bg-red-50"
                                  : "border-green-300 text-green-600 hover:bg-green-50"
                              }
                            >
                              {coupon.isActive ? (
                                <XCircle className="w-3 h-3" />
                              ) : (
                                <CheckCircle className="w-3 h-3" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteCoupon(coupon._id)}
                              disabled={actionLoading === coupon._id}
                              className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Coupon</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Coupon Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    name: e.target.value.toUpperCase(),
                  })
                }
                placeholder="e.g., WELCOME10"
                className="uppercase"
              />
            </div>
            <div>
              <Label htmlFor="edit-percentage">Discount Percentage</Label>
              <Input
                id="edit-percentage"
                type="number"
                min="1"
                max="100"
                value={formData.percentage}
                onChange={(e) =>
                  setFormData({ ...formData, percentage: e.target.value })
                }
                placeholder="e.g., 10"
              />
            </div>
            <div>
              <Label htmlFor="edit-maxUsage">Max Usage (Optional)</Label>
              <Input
                id="edit-maxUsage"
                type="number"
                min="1"
                value={formData.maxUsage}
                onChange={(e) =>
                  setFormData({ ...formData, maxUsage: e.target.value })
                }
                placeholder="Leave empty for unlimited"
              />
            </div>
            <div>
              <Label htmlFor="edit-validUntil">Valid Until (Optional)</Label>
              <Input
                id="edit-validUntil"
                type="date"
                value={formData.validUntil}
                onChange={(e) =>
                  setFormData({ ...formData, validUntil: e.target.value })
                }
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleEditCoupon}
                disabled={
                  !formData.name ||
                  !formData.percentage ||
                  actionLoading === "edit"
                }
                className="flex-1"
              >
                {actionLoading === "edit" ? "Updating..." : "Update Coupon"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
