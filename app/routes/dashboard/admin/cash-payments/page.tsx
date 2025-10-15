"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Eye,
  DollarSign,
  Shield,
} from "lucide-react";
import { BlurImage } from "@/components/BlurImage";

interface CashPayment {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
  };
  listingId: {
    _id: string;
    pgName: string;
    location: {
      area: string;
      city: string;
    };
    primaryImage: string;
    ownerId: string;
  };
  roomType: string;
  moveInDate: string;
  duration: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  amount: number;
  securityDeposit: number;
  paymentStatus: string;
  cashPaymentProof: string;
  cashCollectedBy: string;
  cashCollectedAt: string;
  adminVerifiedAt: string | null;
  createdAt: string;
}

export default function CashPaymentsPage() {
  const [payments, setPayments] = useState<CashPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<CashPayment | null>(
    null
  );
  const [verificationNotes, setVerificationNotes] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchCashPayments();
  }, []);

  const fetchCashPayments = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/admin/verify-cash-payment");

      if (response.data.success) {
        setPayments(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch cash payments:", error);
      toast.error("Failed to fetch cash payments");
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (
    paymentId: string,
    action: "verify" | "reject"
  ) => {
    try {
      setActionLoading(paymentId);

      const response = await axios.post("/api/admin/verify-cash-payment", {
        bookingId: paymentId,
        action,
        notes: verificationNotes.trim() || undefined,
      });

      if (response.data.success) {
        toast.success(
          `Payment ${
            action === "verify" ? "verified" : "rejected"
          } successfully`
        );
        setVerificationNotes("");
        setSelectedPayment(null);
        fetchCashPayments();
      }
    } catch (error) {
      console.error(`Failed to ${action} payment:`, error);
      toast.error(`Failed to ${action} payment`);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-HG-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cash payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-poppins">
          Cash Payment <span className="text-HG-500">Verification</span>
        </h1>
        <p className="text-gray-600 mt-1">
          Verify cash payments collected by owners
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Pending Verification
                </p>
                <p className="text-2xl font-bold text-yellow-600">
                  {payments.length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Amount
                </p>
                <p className="text-2xl font-bold text-HG-600">
                  ₹
                  {payments
                    .reduce((sum, payment) => sum + payment.amount, 0)
                    .toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-HG-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Commission Due
                </p>
                <p className="text-2xl font-bold text-red-600">
                  ₹
                  {Math.round(
                    payments.reduce((sum, payment) => sum + payment.amount, 0) *
                      0.05
                  ).toLocaleString()}
                </p>
              </div>
              <Shield className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments List */}
      {payments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No pending cash payments
            </h3>
            <p className="text-gray-600">
              All cash payments have been verified.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {payments.map((payment) => (
            <Card
              key={payment._id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Property Image */}
                  <div className="w-full md:w-32 h-32 rounded-lg overflow-hidden bg-gray-100">
                    <BlurImage
                      src={payment.listingId.primaryImage}
                      alt={payment.listingId.pgName}
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Payment Details */}
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">
                          {payment.listingId.pgName}
                        </h3>
                        <p className="text-gray-600 flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {payment.listingId.location.area},{" "}
                          {payment.listingId.location.city}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-yellow-100 text-yellow-800"
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        Pending Verification
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">
                            {payment.fullName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span>{payment.phoneNumber}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <span>{payment.email}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span>
                            Collected: {formatDate(payment.cashCollectedAt)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Collected By: </span>
                          <span className="font-medium">
                            {payment.cashCollectedBy}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Amount: </span>
                          <span className="font-semibold text-HG-600">
                            ₹{payment.amount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="text-sm">
                        <span className="text-gray-500">Commission (5%): </span>
                        <span className="font-semibold text-red-600">
                          ₹{Math.round(payment.amount * 0.05).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedPayment(payment)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Verify Payment
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>
                                Cash Payment Verification
                              </DialogTitle>
                            </DialogHeader>

                            {selectedPayment && (
                              <div className="space-y-6">
                                {/* Property Info */}
                                <div className="flex gap-4">
                                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
                                    <BlurImage
                                      src={
                                        selectedPayment.listingId.primaryImage
                                      }
                                      alt={selectedPayment.listingId.pgName}
                                      width={96}
                                      height={96}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div>
                                    <h3 className="font-semibold text-lg">
                                      {selectedPayment.listingId.pgName}
                                    </h3>
                                    <p className="text-gray-600">
                                      {selectedPayment.listingId.location.area},{" "}
                                      {selectedPayment.listingId.location.city}
                                    </p>
                                  </div>
                                </div>

                                {/* Payment Details */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium text-gray-500">
                                      Amount
                                    </label>
                                    <p className="font-medium text-HG-600">
                                      ₹{selectedPayment.amount.toLocaleString()}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-500">
                                      Commission (5%)
                                    </label>
                                    <p className="font-medium text-red-600">
                                      ₹
                                      {Math.round(
                                        selectedPayment.amount * 0.05
                                      ).toLocaleString()}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-500">
                                      Collected By
                                    </label>
                                    <p className="font-medium">
                                      {selectedPayment.cashCollectedBy}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-500">
                                      Collected At
                                    </label>
                                    <p className="font-medium">
                                      {formatDate(
                                        selectedPayment.cashCollectedAt
                                      )}
                                    </p>
                                  </div>
                                </div>

                                {/* Tenant Information */}
                                <div>
                                  <h4 className="font-semibold mb-3">
                                    Tenant Information
                                  </h4>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium text-gray-500">
                                        Full Name
                                      </label>
                                      <p className="font-medium">
                                        {selectedPayment.fullName}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-500">
                                        Phone
                                      </label>
                                      <p className="font-medium">
                                        {selectedPayment.phoneNumber}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-500">
                                        Email
                                      </label>
                                      <p className="font-medium">
                                        {selectedPayment.email}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-500">
                                        Room Type
                                      </label>
                                      <p className="font-medium">
                                        {selectedPayment.roomType}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Payment Proof */}
                                {selectedPayment.cashPaymentProof && (
                                  <div>
                                    <h4 className="font-semibold mb-3">
                                      Payment Proof
                                    </h4>
                                    <div className="border rounded-lg p-4 bg-gray-50">
                                      <a
                                        href={selectedPayment.cashPaymentProof}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-HG-600 hover:text-HG-700 underline"
                                      >
                                        View Payment Proof
                                      </a>
                                    </div>
                                  </div>
                                )}

                                {/* Verification Notes */}
                                <div>
                                  <label className="text-sm font-medium text-gray-500 mb-2 block">
                                    Verification Notes (Optional)
                                  </label>
                                  <Textarea
                                    value={verificationNotes}
                                    onChange={(e) =>
                                      setVerificationNotes(e.target.value)
                                    }
                                    placeholder="Add any notes about the verification..."
                                    rows={3}
                                  />
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-4 border-t">
                                  <Button
                                    onClick={() =>
                                      handleVerification(
                                        selectedPayment._id,
                                        "verify"
                                      )
                                    }
                                    disabled={
                                      actionLoading === selectedPayment._id
                                    }
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Verify Payment
                                  </Button>
                                  <Button
                                    onClick={() =>
                                      handleVerification(
                                        selectedPayment._id,
                                        "reject"
                                      )
                                    }
                                    disabled={
                                      actionLoading === selectedPayment._id
                                    }
                                    variant="destructive"
                                    className="flex-1"
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Reject Payment
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
