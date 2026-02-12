"use client";

import { useState } from "react";
import type React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, CheckCircle, X, Clock, UploadCloud } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import paymentQr from "@/public/payment-qr.jpg";

interface PaymentModalProps {
  isOpen: boolean;
  paymentStatus: "pending" | "paid" | "failed";
  isSubmitting: boolean;
  onPayment: (payNow: boolean, proofFile?: File | null) => void;
  onNavigate: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  paymentStatus,
  isSubmitting,
  onPayment,
  onNavigate,
}) => {
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);

  return (
    <Dialog open={isOpen}>
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

        {/* Step 1: Show Fee and Pay Now */}
        {paymentStatus === "pending" && !isSubmitting && !showPaymentDetails && (
          <div className="space-y-6 py-4">
            <div className="text-center space-y-1.5">
              <div className="text-3xl font-poppins font-bold text-HG-500">₹999</div>
              <p className="text-[13px] text-gray-600">One-time listing fee</p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => setShowPaymentDetails(true)}
                className="w-full bg-HG-400 hover:bg-HG-500 text-white"
              >
                Pay Now & Publish Immediately
              </Button>
              <Button
                variant="outline"
                onClick={() => onPayment(false)}
                className="w-full"
              >
                Submit with Payment Pending
              </Button>
            </div>

            <p className="text-[12px] text-gray-500 text-center leading-snug">
              Listings with pending fees will be published after payment confirmation.
            </p>
          </div>
        )}

        {/* Step 2: Show QR, UPI, and Upload Proof */}
        {showPaymentDetails && paymentStatus === "pending" && !isSubmitting && (
          <div className="space-y-6 py-4">
            <div className="text-center space-y-2">
              <Image
                src={paymentQr}
                alt="QR Code"
                width={160}
                height={160}
                className="mx-auto border rounded"
              />
              <p className="text-sm text-gray-600">
                <strong>UPI ID:</strong> ashrivas5606-1@okhdfcbank
              </p>
              <p className="text-sm text-gray-600">
                <strong>Bank:</strong> HDFC Bank<br />
                <strong>Account No:</strong> 1234567890<br />
                <strong>IFSC:</strong> HDFC0001234
              </p>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Upload Payment Proof
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                className="text-sm file:mr-2 file:px-3 file:py-1 file:bg-HG-400 file:text-white file:rounded file:border-none"
              />
              {proofFile && (
                <p className="mt-1 text-xs text-green-600">
                  {proofFile.name}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => onPayment(true, proofFile)}
                className="w-full bg-HG-400 hover:bg-HG-500 text-white flex items-center gap-2"
              >
                <UploadCloud className="w-4 h-4" />
                Submit Payment
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setShowPaymentDetails(false)}
              >
                Back
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Submission in Progress */}
        {isSubmitting && (
          <div className="py-10 text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-HG-400 border-t-transparent mx-auto" />
            <p className="text-gray-600 text-sm">Processing your submission...</p>
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

        {/* Step 6: Pending (Fallback) */}
        {paymentStatus === "pending" && isSubmitting === false && !showPaymentDetails && (
          <div className="py-10 text-center space-y-4">
            <Clock className="w-12 h-12 text-yellow-500 mx-auto" />
            <h3 className="text-[16px] font-semibold text-yellow-700">Submission Successful!</h3>
            <p className="text-[13px] text-gray-600">Your listing is saved with fee pending.</p>
            <Button onClick={onNavigate} className="mt-4 w-full bg-HG-400 hover:bg-HG-500 text-white">
              Go to My Listings
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
