// components/payments/RazorpayCheckout.tsx
"use client";

import { useEffect, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, AlertCircle } from "lucide-react";
import { toast } from "sonner";

// Declare Razorpay on window
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayCheckoutProps {
  orderId: string;
  amount: number;
  currency?: string;
  name?: string;
  description?: string;
  image?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  onSuccess: (response: RazorpaySuccessResponse) => void;
  onFailure?: (error: any) => void;
  onDismiss?: () => void;
  buttonText?: string;
  buttonClassName?: string;
  disabled?: boolean;
  loading?: boolean;
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  fullWidth?: boolean;
}

export interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export default function RazorpayCheckout({
  orderId,
  amount,
  currency = "INR",
  name = "SpotYourPG",
  description = "Payment",
  image = "/logo.png",
  prefill = {},
  notes = {},
  onSuccess,
  onFailure,
  onDismiss,
  buttonText = "Pay Now",
  buttonClassName = "",
  disabled = false,
  loading = false,
  variant = "default",
  size = "default",
  fullWidth = false,
}: RazorpayCheckoutProps) {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    if (typeof window !== "undefined" && !window.Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => setIsScriptLoaded(true);
      script.onerror = () => {
        console.error("Failed to load Razorpay script");
        toast.error("Failed to load payment gateway");
      };
      document.body.appendChild(script);
    } else if (window.Razorpay) {
      setIsScriptLoaded(true);
    }
  }, []);

  const handlePayment = useCallback(() => {
    if (!isScriptLoaded || !window.Razorpay) {
      toast.error("Payment gateway not loaded. Please refresh and try again.");
      return;
    }

    if (!orderId) {
      toast.error("Invalid payment order. Please try again.");
      return;
    }

    setIsProcessing(true);

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: Math.round(amount * 100), // Amount in paise
      currency,
      name,
      description,
      image,
      order_id: orderId,
      prefill: {
        name: prefill.name || "",
        email: prefill.email || "",
        contact: prefill.contact || "",
      },
      notes,
      theme: {
        color: "#E67E22", // HG-500 color
      },
      modal: {
        ondismiss: () => {
          setIsProcessing(false);
          onDismiss?.();
        },
        escape: true,
        animation: true,
      },
      handler: (response: RazorpaySuccessResponse) => {
        setIsProcessing(false);
        onSuccess(response);
      },
    };

    try {
      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", (response: any) => {
        setIsProcessing(false);
        console.error("Payment failed:", response.error);
        toast.error(response.error.description || "Payment failed. Please try again.");
        onFailure?.(response.error);
      });

      razorpay.open();
    } catch (error) {
      setIsProcessing(false);
      console.error("Razorpay error:", error);
      toast.error("Failed to open payment gateway");
      onFailure?.(error);
    }
  }, [
    isScriptLoaded,
    orderId,
    amount,
    currency,
    name,
    description,
    image,
    prefill,
    notes,
    onSuccess,
    onFailure,
    onDismiss,
  ]);

  const isDisabled = disabled || loading || isProcessing || !isScriptLoaded;

  return (
    <Button
      onClick={handlePayment}
      disabled={isDisabled}
      variant={variant}
      size={size}
      className={`${fullWidth ? "w-full" : ""} ${buttonClassName}`}
    >
      {(loading || isProcessing) ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : !isScriptLoaded ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Loading...
        </>
      ) : (
        <>
          <CreditCard className="h-4 w-4 mr-2" />
          {buttonText}
        </>
      )}
    </Button>
  );
}

// Inline payment button component for quick use
export function PayNowButton({
  amount,
  orderId,
  onSuccess,
  onFailure,
  prefill,
  description,
  disabled,
  loading,
  className,
}: {
  amount: number;
  orderId: string;
  onSuccess: (response: RazorpaySuccessResponse) => void;
  onFailure?: (error: any) => void;
  prefill?: { name?: string; email?: string; contact?: string };
  description?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}) {
  return (
    <RazorpayCheckout
      orderId={orderId}
      amount={amount}
      description={description || `Payment of ₹${amount.toLocaleString()}`}
      prefill={prefill}
      onSuccess={onSuccess}
      onFailure={onFailure}
      buttonText={`Pay ₹${amount.toLocaleString()}`}
      buttonClassName={className}
      disabled={disabled}
      loading={loading}
      fullWidth
    />
  );
}