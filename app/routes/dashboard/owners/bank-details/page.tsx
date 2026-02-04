// app/routes/dashboard/owners/bank-details/page.tsx
"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Building,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Save,
  Smartphone,
  Info,
  Lock,
} from "lucide-react";

interface BankDetails {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
  upiId: string;
  isVerified: boolean;
  verifiedAt: string | null;
}

export default function OwnerBankDetailsPage() {
  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    branchName: "",
    upiId: "",
    isVerified: false,
    verifiedAt: null,
  });

  // Fetch bank details
  useEffect(() => {
    fetchBankDetails();
  }, []);

  const fetchBankDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/owner/bank-details");

      if (response.data.success && response.data.data) {
        setBankDetails(response.data.data);
      }
    } catch (error) {
      // No bank details yet - that's okay
      console.log("No bank details found");
    } finally {
      setLoading(false);
    }
  };

  // Handle input change
  const handleChange = (field: keyof BankDetails, value: string) => {
    setBankDetails((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Save bank details
  const handleSave = async () => {
    // Validation
    if (!bankDetails.accountHolderName.trim()) {
      toast.error("Account holder name is required");
      return;
    }

    if (!bankDetails.accountNumber.trim()) {
      toast.error("Account number is required");
      return;
    }

    if (!bankDetails.ifscCode.trim()) {
      toast.error("IFSC code is required");
      return;
    }

    // IFSC validation
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(bankDetails.ifscCode.toUpperCase())) {
      toast.error("Invalid IFSC code format");
      return;
    }

    setSaving(true);

    try {
      const response = await axios.post("/api/owner/bank-details", {
        ...bankDetails,
        ifscCode: bankDetails.ifscCode.toUpperCase(),
      });

      if (response.data.success) {
        toast.success("Bank details saved successfully");
        setBankDetails(response.data.data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save bank details");
    } finally {
      setSaving(false);
    }
  };

  // Fetch bank name from IFSC
  const fetchBankFromIFSC = async () => {
    if (!bankDetails.ifscCode || bankDetails.ifscCode.length !== 11) {
      return;
    }

    try {
      const response = await fetch(
        `https://ifsc.razorpay.com/${bankDetails.ifscCode.toUpperCase()}`
      );

      if (response.ok) {
        const data = await response.json();
        setBankDetails((prev) => ({
          ...prev,
          bankName: data.BANK || prev.bankName,
          branchName: data.BRANCH || prev.branchName,
          ifscCode: bankDetails.ifscCode.toUpperCase(),
        }));
        toast.success("Bank details fetched from IFSC");
      }
    } catch (error) {
      // Silently fail - user can enter manually
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading bank details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-poppins">
          Bank <span className="text-primary">Details</span>
        </h1>
        <p className="text-gray-600 mt-1">
          Add your bank details to receive payouts from admin
        </p>
      </div>

      {/* Status Card */}
      <Card
        className={
          bankDetails.isVerified
            ? "bg-green-50 border-green-200"
            : "bg-yellow-50 border-yellow-200"
        }
      >
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            {bankDetails.isVerified ? (
              <>
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Bank Details Verified</p>
                  <p className="text-sm text-green-600">
                    Your bank details have been verified by admin
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">
                    {bankDetails.accountNumber ? "Pending Verification" : "Add Bank Details"}
                  </p>
                  <p className="text-sm text-yellow-600">
                    {bankDetails.accountNumber
                      ? "Your bank details are pending admin verification"
                      : "Add your bank details to receive payouts"}
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bank Details Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Bank Account Details
          </CardTitle>
          <CardDescription>
            Enter your bank account details for receiving payouts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Account Holder Name */}
          <div>
            <Label htmlFor="accountHolderName">Account Holder Name *</Label>
            <Input
              id="accountHolderName"
              value={bankDetails.accountHolderName}
              onChange={(e) => handleChange("accountHolderName", e.target.value)}
              placeholder="Enter name as per bank records"
              className="mt-1"
            />
          </div>

          {/* Account Number */}
          <div>
            <Label htmlFor="accountNumber">Account Number *</Label>
            <Input
              id="accountNumber"
              value={bankDetails.accountNumber}
              onChange={(e) => handleChange("accountNumber", e.target.value.replace(/\D/g, ""))}
              placeholder="Enter account number"
              className="mt-1"
            />
          </div>

          {/* IFSC Code */}
          <div>
            <Label htmlFor="ifscCode">IFSC Code *</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="ifscCode"
                value={bankDetails.ifscCode}
                onChange={(e) =>
                  handleChange("ifscCode", e.target.value.toUpperCase().slice(0, 11))
                }
                placeholder="e.g., SBIN0001234"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={fetchBankFromIFSC}
                disabled={bankDetails.ifscCode.length !== 11}
              >
                Fetch
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              11 character IFSC code (e.g., SBIN0001234)
            </p>
          </div>

          {/* Bank Name */}
          <div>
            <Label htmlFor="bankName">Bank Name</Label>
            <Input
              id="bankName"
              value={bankDetails.bankName}
              onChange={(e) => handleChange("bankName", e.target.value)}
              placeholder="e.g., State Bank of India"
              className="mt-1"
            />
          </div>

          {/* Branch Name */}
          <div>
            <Label htmlFor="branchName">Branch Name</Label>
            <Input
              id="branchName"
              value={bankDetails.branchName}
              onChange={(e) => handleChange("branchName", e.target.value)}
              placeholder="e.g., Main Branch"
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* UPI Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            UPI Details (Optional)
          </CardTitle>
          <CardDescription>
            Add your UPI ID for faster payouts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="upiId">UPI ID</Label>
            <Input
              id="upiId"
              value={bankDetails.upiId}
              onChange={(e) => handleChange("upiId", e.target.value)}
              placeholder="e.g., yourname@upi"
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Note */}
      <Card className="bg-gray-50">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-800">Your data is secure</p>
              <p className="mt-1">
                Your bank details are encrypted and stored securely. They are only used
                for processing payouts and are never shared with third parties.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={fetchBankDetails}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Bank Details
            </>
          )}
        </Button>
      </div>
    </div>
  );
}