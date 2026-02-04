// app/routes/dashboard/admin/commission-settings/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Settings,
  User,
  Percent,
  CheckCircle,
  Edit,
  RefreshCw,
  Search,
  Mail,
  Phone,
  Building,
  AlertTriangle,
  Info,
} from "lucide-react";

interface Owner {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  commissionSettings: {
    customRate: number | null;
    isCustomRateActive: boolean;
    customRateApprovedAt: string | null;
    notes: string;
  };
  settlementSummary: {
    totalPayoutReceived: number;
    pendingPayoutAmount: number;
    totalCommissionPaid: number;
    pendingCommissionAmount: number;
  };
}

export default function AdminCommissionSettingsPage() {
  // State
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [defaultRate] = useState(10); // 10%

  // Edit dialog state
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);
  const [customRate, setCustomRate] = useState("");
  const [isCustomRateActive, setIsCustomRateActive] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Fetch owners
  const fetchOwners = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/admin/commission-settings");

      if (response.data.success) {
        setOwners(response.data.data.owners);
      }
    } catch (error) {
      toast.error("Failed to fetch owners");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOwners();
  }, [fetchOwners]);

  // Open edit dialog
  const handleEditClick = (owner: Owner) => {
    setSelectedOwner(owner);
    setCustomRate(
      owner.commissionSettings?.customRate !== null
        ? (owner.commissionSettings.customRate * 100).toString()
        : ""
    );
    setIsCustomRateActive(owner.commissionSettings?.isCustomRateActive || false);
    setNotes(owner.commissionSettings?.notes || "");
    setShowEditDialog(true);
  };

  // Save commission settings
  const handleSave = async () => {
    if (!selectedOwner) return;

    // Validate rate
    const rateValue = parseFloat(customRate);
    if (isCustomRateActive && (isNaN(rateValue) || rateValue < 0 || rateValue > 50)) {
      toast.error("Commission rate must be between 0% and 50%");
      return;
    }

    setSaving(true);

    try {
      const response = await axios.put("/api/admin/commission-settings", {
        ownerId: selectedOwner._id,
        customRatePercent: isCustomRateActive ? rateValue : null,
        isActive: isCustomRateActive,
        notes,
      });

      if (response.data.success) {
        toast.success("Commission settings updated");
        setShowEditDialog(false);
        fetchOwners();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  // Filter owners
  const filteredOwners = owners.filter(
    (owner) =>
      owner.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      owner.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      owner.phone?.includes(searchQuery)
  );

  // Get effective rate
  const getEffectiveRate = (owner: Owner) => {
    if (owner.commissionSettings?.isCustomRateActive && owner.commissionSettings.customRate !== null) {
      return owner.commissionSettings.customRate * 100;
    }
    return defaultRate;
  };

  // Format currency
  const formatCurrency = (amount: number) =>
    `₹${amount.toLocaleString("en-IN")}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading owners...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-poppins">
            Commission <span className="text-primary">Settings</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Manage commission rates for property owners
          </p>
        </div>
        <Button variant="outline" onClick={fetchOwners}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Default Commission Rate: {defaultRate}%</p>
              <p className="text-blue-700">
                You can set custom commission rates for individual owners. Custom rates
                override the default rate for all their future bookings and rent collections.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Owners</p>
                <p className="text-2xl font-bold text-gray-900">{owners.length}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Default Rate</p>
                <p className="text-2xl font-bold text-green-600">{defaultRate}%</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <Percent className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Custom Rates</p>
                <p className="text-2xl font-bold text-orange-600">
                  {owners.filter((o) => o.commissionSettings?.isCustomRateActive).length}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Settings className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Owners Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Owner</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-center">Commission Rate</TableHead>
                <TableHead className="text-right">Pending Payout</TableHead>
                <TableHead className="text-right">Pending Commission</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOwners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <User className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No owners found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOwners.map((owner) => (
                  <TableRow key={owner._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{owner.fullName}</p>
                          <p className="text-xs text-gray-500">ID: {owner._id.slice(-8)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="flex items-center gap-1 text-gray-600">
                          <Mail className="h-3 w-3" />
                          {owner.email}
                        </p>
                        {owner.phone && (
                          <p className="flex items-center gap-1 text-gray-600">
                            <Phone className="h-3 w-3" />
                            {owner.phone}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Badge
                          className={
                            owner.commissionSettings?.isCustomRateActive
                              ? "bg-orange-100 text-orange-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {getEffectiveRate(owner)}%
                        </Badge>
                        {owner.commissionSettings?.isCustomRateActive && (
                          <span className="text-xs text-orange-600">Custom</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium text-yellow-600">
                        {formatCurrency(owner.settlementSummary?.pendingPayoutAmount || 0)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium text-red-600">
                        {formatCurrency(owner.settlementSummary?.pendingCommissionAmount || 0)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(owner)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Commission Settings</DialogTitle>
            <DialogDescription>
              Set custom commission rate for {selectedOwner?.fullName}
            </DialogDescription>
          </DialogHeader>

          {selectedOwner && (
            <div className="space-y-4 py-4">
              {/* Owner Info */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{selectedOwner.fullName}</p>
                    <p className="text-sm text-gray-500">{selectedOwner.email}</p>
                  </div>
                </div>
              </div>

              {/* Custom Rate Toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label htmlFor="custom-rate-toggle" className="font-medium">
                    Use Custom Rate
                  </Label>
                  <p className="text-sm text-gray-500">
                    Override the default {defaultRate}% rate
                  </p>
                </div>
                <Switch
                  id="custom-rate-toggle"
                  checked={isCustomRateActive}
                  onCheckedChange={setIsCustomRateActive}
                />
              </div>

              {/* Custom Rate Input */}
              {isCustomRateActive && (
                <div>
                  <Label htmlFor="custom-rate">Custom Commission Rate (%)</Label>
                  <div className="relative mt-1">
                    <Input
                      id="custom-rate"
                      type="number"
                      min="0"
                      max="50"
                      step="0.5"
                      value={customRate}
                      onChange={(e) => setCustomRate(e.target.value)}
                      placeholder="e.g., 8"
                      className="pr-10"
                    />
                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Must be between 0% and 50%
                  </p>
                </div>
              )}

              {/* Preview */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Effective Rate:</strong>{" "}
                  {isCustomRateActive && customRate
                    ? `${customRate}% (Custom)`
                    : `${defaultRate}% (Default)`}
                </p>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Reason for custom rate, special agreement, etc."
                  className="mt-1"
                  rows={3}
                />
              </div>

              {/* Warning */}
              {isCustomRateActive && parseFloat(customRate) < defaultRate && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-yellow-800">
                    This rate is lower than the default. Make sure this is intentional.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}