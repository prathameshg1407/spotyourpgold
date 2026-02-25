"use client";

import { useState, useEffect } from "react";
import type React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, CheckCircle, X, Clock } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentModalProps {
  isOpen: boolean;
  paymentStatus: "pending" | "paid" | "failed";
  isSubmitting: boolean;
  listingId: string;
  onPaymentSuccess: () => void;
  onNavigate: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  paymentStatus,
  isSubmitting,
  listingId,
  onPaymentSuccess,
  onNavigate,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [showDialog, setShowDialog] = useState(true);

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const baseAmount = 999;
  const discountAmount = appliedCoupon ? Math.round((baseAmount * appliedCoupon.percentage) / 100) : 0;
  const payableAmount = baseAmount - discountAmount;

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setIsApplyingCoupon(true);
    try {
      const res = await axios.post("/api/coupon-validate", { couponCode });
      if (res.data.success) {
        setAppliedCoupon(res.data.data);
        toast.success(`Coupon applied: ${res.data.data.percentage}% off!`);
      } else {
        toast.error(res.data.message || "Invalid coupon");
        setAppliedCoupon(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to apply coupon");
      setAppliedCoupon(null);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setAppliedCoupon(null);
  };

  const handleRazorpayPayment = async () => {
    if (!razorpayLoaded) {
      toast.error("Payment system is loading. Please try again.");
      return;
    }

    setIsProcessing(true);

    try {
      // Create Razorpay order
      const orderRes = await axios.post("/api/owner/listPg/initiate-payment", {
        listingId,
        couponCode: appliedCoupon ? couponCode : undefined,
      });

      if (!orderRes.data.success) {
        toast.error(orderRes.data.message || "Failed to initiate payment");
        setIsProcessing(false);
        return;
      }

      const { orderId, amount, currency, keyId } = orderRes.data;

      // Hide dialog when Razorpay opens
      setShowDialog(false);

      // Razorpay options
      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: "SYPG",
        description: "PG Listing Fee",
        order_id: orderId,
        handler: async function (response: any) {
          try {
            setShowDialog(true);
            // Verify payment
            const verifyRes = await axios.post("/api/owner/listPg/verify-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              listingId,
            });

            if (verifyRes.data.success) {
              toast.success("Payment successful!");
              onPaymentSuccess();
            } else {
              toast.error("Payment verification failed");
              setIsProcessing(false);
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            toast.error("Payment verification failed");
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setShowDialog(true);
            setIsProcessing(false);
            toast.info("Payment cancelled");
          },
        },
        prefill: {
          name: "",
          email: "",
          contact: "",
        },
        theme: {
          color: "#10b981",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Payment initiation error:", error);
      toast.error("Failed to initiate payment");
      setShowDialog(true);
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen && showDialog}>
      <DialogContent className="max-w-md font-inter">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-HG-500 text-[17px] font-semibold">
            <CreditCard className="w-5 h-5" />
            Listing Fee Payment
          </DialogTitle>
          <DialogDescription className="text-[13px] text-gray-600 mt-1">
            Choose your payment option to complete the listing submission.
          </DialogDescription>
        </DialogHeader>

        {/* Payment Required */}
        {paymentStatus === "pending" && !isSubmitting && !isProcessing && (
          <div className="space-y-6 py-4">
            <div className="text-center space-y-1.5">
              <div className="text-3xl font-poppins font-bold text-HG-500">
                ₹{payableAmount}
              </div>
              {appliedCoupon && (
                <div className="text-sm text-green-600 line-through">
                  ₹{baseAmount}
                </div>
              )}
              <p className="text-[13px] text-gray-600">One-time listing fee</p>
            </div>

            <div className="space-y-3">
              {!appliedCoupon ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleApplyCoupon}
                    disabled={isApplyingCoupon || !couponCode}
                    variant="outline"
                  >
                    {isApplyingCoupon ? "Applying..." : "Apply"}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-200">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-green-700">{appliedCoupon.name} Applied</span>
                    <span className="text-xs text-green-600">You saved ₹{discountAmount}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={handleRemoveCoupon}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleRazorpayPayment}
                disabled={!razorpayLoaded}
                className="w-full bg-HG-400 hover:bg-HG-500 text-white"
              >
                {razorpayLoaded ? "Pay Now with Razorpay" : "Loading Payment..."}
              </Button>
            </div>

            <p className="text-[12px] text-gray-500 text-center leading-snug">
              Secure payment powered by Razorpay. Your listing will be published immediately after successful payment.
            </p>
          </div>
        )}

        {/* Processing Payment */}
        {(isSubmitting || isProcessing) && (
          <div className="py-10 text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-HG-400 border-t-transparent mx-auto" />
            <p className="text-gray-600 text-sm">Processing your payment...</p>
          </div>
        )}

        {/* Step 4: Success */}
        {paymentStatus === "paid" && (
          <div className="py-10 text-center space-y-4">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <h3 className="text-[16px] font-semibold text-green-700">Payment Successful!</h3>
            <p className="text-[13px] text-gray-600">Your PG listing has been published.</p>
            <Button onClick={onNavigate} className="mt-4 w-full bg-HG-400 hover:bg-HG-500 text-white">
              Go to My Listings
            </Button>
          </div>
        )}

        {/* Step 5: Failure */}
        {paymentStatus === "failed" && (
          <div className="py-10 text-center space-y-4">
            <X className="w-12 h-12 text-red-500 mx-auto" />
            <h3 className="text-[16px] font-semibold text-red-700">Payment Failed</h3>
            <p className="text-[13px] text-gray-600">Please try again after some time.</p>
          </div>
        )}


      </DialogContent>
    </Dialog>
  );
};
