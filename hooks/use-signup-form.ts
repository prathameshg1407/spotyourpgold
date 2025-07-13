"use client";

import type React from "react";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { FormErrors, SignupFormData } from "@/app/routes/auth/auth";
import { validateSignupForm, validateOTP } from "@/app/routes/auth/validation";
// import { register, resendOtp, verifyOtp } from "@/actions/auth";
import { toast } from "sonner";
import { useUserStore } from "@/store/userStore";
import axios from "axios";

const initialErrors: FormErrors = {
  fullName: false,
  email: false,
  password: false,
  confirmPassword: false,
  otp: false,
  general: "",
};

const OTP_LENGTH = 5;
const OTP_PATTERN = /^\d*$/;

const initialFormData: SignupFormData = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const initialOTP: string[] = Array(OTP_LENGTH).fill("");

export const useSignupForm = () => {
  const [formData, setFormData] = useState<SignupFormData>(initialFormData);
  const [otp, setOtp] = useState<string[]>(initialOTP);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>(initialErrors);
  const [timer, setTimer] = useState(300); // 5 minutes = 300 seconds
  const [termsAccepted, setTermsAccepted] = useState(false);

  const router = useRouter();

  const { setUser } = useUserStore();

  useEffect(() => {
    if (showOTP && timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer, showOTP]);

  const updateFormData = useCallback(
    (field: keyof SignupFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const clearErrors = useCallback(() => {
    setErrors(initialErrors);
  }, []);

  const handleOTPChange = useCallback(
    (index: number, value: string) => {
      if (value.length > 1 || !OTP_PATTERN.test(value)) return;

      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next input
      if (value && index < OTP_LENGTH - 1) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        nextInput?.focus();
      }
    },
    [otp]
  );

  const handleOTPKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      if (e.key === "Backspace" && !otp[index] && index > 0) {
        const prevInput = document.getElementById(`otp-${index - 1}`);
        prevInput?.focus();
      }
    },
    [otp]
  );

  const submitSignupForm = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Check if terms are accepted
      if (!termsAccepted) {
        setErrors({
          ...initialErrors,
          general:
            "Please accept the Terms of Service and Privacy Policy to continue.",
        });
        return;
      }

      const validationErrors = validateSignupForm(formData);
      if (validationErrors.general) {
        setErrors(validationErrors);
        return;
      }

      clearErrors();
      setIsLoading(true);

      // Show loading toast manually
      const loadingToast = toast.loading("Sending OTP...", {
        closeButton: true,
      });

      try {
        // const formDataToSend = new FormData();
        // formDataToSend.append("fullName", formData.fullName);
        // formDataToSend.append("email", formData.email);
        // formDataToSend.append("password", formData.password);

        // const res = await register(formDataToSend);

        const res = await axios.post("/api/auth/register", formData);

        // Dismiss loading toast
        toast.dismiss(loadingToast);

        if (res && res?.data && res?.data?.success) {
          toast.success(res.data.message || "OTP sent successfully.", {
            closeButton: true,
            duration: 2000,
          });

          setShowOTP(true);
          setTimer(300);
          requestAnimationFrame(() => {
            const input = document.getElementById("otp-0");
            if (input) input.focus();
          });
        } else {
          toast.error(res.data.message || "Failed to register.", {
            closeButton: true,
            duration: 2000,
          });

          setErrors((prev) => ({
            ...prev,
            general: res.data.message,
          }));
        }
      } catch (error: any) {
        // Dismiss loading toast
        toast.dismiss(loadingToast);

        toast.error("We couldn't verify your credentials. Please try again.", {
          closeButton: true,
          duration: 2000,
        });

        setErrors((prev) => ({
          ...prev,
          general: "We couldn't verify your credentials. Please try again.",
        }));
      } finally {
        setIsLoading(false);
        toast.dismiss(loadingToast);
      }
    },
    [formData, clearErrors, termsAccepted]
  );

  const submitOTP = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const validation = validateOTP(otp);
      if (!validation) {
        setErrors((prev) => ({
          ...prev,
          general: "Invalid OTP",
        }));
        return;
      }

      clearErrors();
      setIsLoading(true);
      // Show loading toast manually
      const loadingToast = toast.loading("Verifying...", {
        closeButton: true,
      });

      try {
        // const formDataToSend = new FormData();
        // formDataToSend.append("email", formData.email);
        // formDataToSend.append("otp", otp.join(""));
        // formDataToSend.append("purpose", "signup");

        // const res = await verifyOtp(formDataToSend);

        const res = await axios.post("/api/auth/verify-otp", {
          email: formData.email,
          otp: otp.join(""),
          purpose: "signup",
        });

        // Dismiss loading toast
        toast.dismiss(loadingToast);

        if (res && res?.data && res?.data?.success) {
          setUser(res?.data?.user ?? null);
          router.replace("/");
          toast.success(res.data.message || "OTP Verified successfully.", {
            closeButton: true,
            duration: 2000,
          });
        } else {
          toast.error(res.data?.message || "Failed to verify OTP", {
            closeButton: true,
            duration: 2000,
          });

          setOtp(initialOTP);

          const input = document.getElementById("otp-0");
          if (input) input.focus();

          setErrors((prev) => ({
            ...prev,
            general: res.data?.message,
          }));
        }
      } catch (error: any) {
        // Dismiss loading toast
        toast.dismiss(loadingToast);

        toast.error(" Verification failed. Please try again.", {
          closeButton: true,
          duration: 2000,
        });

        setErrors((prev) => ({
          ...prev,
          general: "Verification failed. Please try again.",
        }));
      } finally {
        setIsLoading(false);
        toast.dismiss(loadingToast);
      }
    },
    [otp, router, clearErrors, formData.email]
  );

  const resendOTP = useCallback(async () => {
    clearErrors();
    setOtp(initialOTP);
    setTimer(300); // Reset timer to 5 minutes

    const loadingToast = toast.loading("Resending OTP...", {
      closeButton: true,
    });

    try {
      // const formDataToSend = new FormData();
      // formDataToSend.append("email", formData.email);
      // formDataToSend.append("purpose", "signup");

      // const res = await resendOtp(formDataToSend);

      const res = await axios.post("/api/auth/resend-otp", {
        email: formData.email,
        purpose: "signup",
      });

      toast.dismiss(loadingToast);

      if (res && res?.data && res?.data?.success) {
        toast.success(res.data.message || "OTP resent successfully!", {
          closeButton: true,
          duration: 2000,
        });

        setErrors((prev) => ({
          ...prev,
          general: res.data.message || "OTP resent successfully!",
        }));

        requestAnimationFrame(() => {
          const input = document.getElementById("otp-0");
          if (input) input.focus();
        });
      } else {
        toast.error(res.data.message || "Failed to resend OTP", {
          closeButton: true,
          duration: 2000,
        });

        setErrors((prev) => ({
          ...prev,
          general: res.data.message || "Failed to resend OTP",
        }));
      }
    } catch (error) {
      toast.dismiss(loadingToast);

      toast.error("Error resending OTP. Please try again.", {
        closeButton: true,
        duration: 2000,
      });

      setErrors((prev) => ({
        ...prev,
        general: "Error resending OTP. Please try again.",
      }));
    }
  }, [formData.email, clearErrors]);

  const backToSignup = useCallback(() => {
    setShowOTP(false);
    setOtp(initialOTP);
    clearErrors();
  }, [clearErrors]);

  return {
    // State
    formData,
    otp,
    showPassword,
    showConfirmPassword,
    showOTP,
    isLoading,
    errors,
    timer, // Add timer to returned state
    termsAccepted,

    // Actions
    updateFormData,
    setShowPassword,
    setShowConfirmPassword,
    handleOTPChange,
    handleOTPKeyDown,
    submitSignupForm,
    submitOTP,
    resendOTP,
    backToSignup,
    setTermsAccepted,

    // Computed
    isOTPComplete: otp.every((digit) => digit !== ""),
    isTimerExpired: timer === 0, // Add computed property for timer expiry
  };
};
