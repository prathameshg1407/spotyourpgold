"use client";

import type React from "react";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import type {
  FormErrors,
  LoginFormData,
  ForgotPasswordData,
  LoginStep,
} from "@/app/routes/auth/auth";
import {
  validateLoginForm,
  validateForgotPasswordForm,
  validateOTP,
} from "@/app/routes/auth/validation";
import { toast } from "sonner";
// import {
//   forgotPassword,
//   login,
//   resendOtp,
//   resetPassword,
//   verifyOtp,
// } from "@/actions/auth";
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

const initialLoginData: LoginFormData = {
  email: "",
  password: "",
};

const initialForgotPasswordData: ForgotPasswordData = {
  email: "",
  newPassword: "",
  confirmPassword: "",
};

const OTP_LENGTH = 5;
const OTP_PATTERN = /^\d*$/;

const initialOTP: string[] = Array(OTP_LENGTH).fill("");

export const useLoginForm = () => {
  const [currentStep, setCurrentStep] = useState<LoginStep>("login");
  const [loginData, setLoginData] = useState<LoginFormData>(initialLoginData);
  const [forgotPasswordData, setForgotPasswordData] =
    useState<ForgotPasswordData>(initialForgotPasswordData);
  const [otp, setOtp] = useState<string[]>(initialOTP);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>(initialErrors);
  const [timer, setTimer] = useState(300);

  const router = useRouter();

  const { setUser } = useUserStore();

  useEffect(() => {
    if (currentStep === "forgot-otp" && timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer, currentStep]);

  const updateLoginData = useCallback(
    (field: keyof LoginFormData, value: string) => {
      setLoginData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const updateForgotPasswordData = useCallback(
    (field: keyof ForgotPasswordData, value: string) => {
      setForgotPasswordData((prev) => ({ ...prev, [field]: value }));
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

  const submitLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const validationErrors = validateLoginForm(loginData);
      if (validationErrors.general) {
        setErrors(validationErrors);
        return;
      }

      clearErrors();
      setIsLoading(true);

      // Show loading toast manually
      const loadingToast = toast.loading("Validating...", {
        closeButton: true,
      });

      try {
        // const formDataToSend = new FormData();
        // formDataToSend.append("email", loginData.email);
        // formDataToSend.append("password", loginData.password);

        // const res = await login(formDataToSend);

        const res = await axios.post("/api/auth/login", {
          email: loginData.email,
          password: loginData.password,
        });

        // Dismiss loading toast
        toast.dismiss(loadingToast);

        if (res && res?.data && res?.data?.success) {
          setUser(res?.data?.user ?? null);
          router.replace("/");

          toast.success(res.data.message || "Logged in successfully.", {
            closeButton: true,
            duration: 2000,
          });
        } else {
          toast.error(res.data?.message || "Failed to Login.", {
            closeButton: true,
            duration: 2000,
          });

          setErrors((prev) => ({
            ...prev,
            general: res.data?.message,
          }));
        }
      } catch (error) {
        setErrors((prev) => ({
          ...prev,
          general: "Login failed. Please try again.",
        }));
      } finally {
        setIsLoading(false);
        toast.dismiss(loadingToast);
      }
    },
    [loginData, clearErrors, router]
  );

  const submitForgotPassword = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!forgotPasswordData.email.trim()) {
        setErrors((prev) => ({
          ...prev,
          email: true,
          general: "Email is required.",
        }));
        return;
      }

      if (!/\S+@\S+\.\S+/.test(forgotPasswordData.email)) {
        setErrors((prev) => ({
          ...prev,
          email: true,
          general: "Enter a valid email.",
        }));
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
        // formDataToSend.append("email", forgotPasswordData.email);

        // const res = await forgotPassword(formDataToSend);

        const res = await axios.post(
          "/api/auth/forgot-password",
          forgotPasswordData
        );

        // Dismiss loading toast
        toast.dismiss(loadingToast);

        if (res && res?.data && res?.data?.success) {
          toast.success(res.data.message || "OTP sent successfully.", {
            closeButton: true,
            duration: 2000,
          });

          setCurrentStep("forgot-otp");
          setTimer(300);
          requestAnimationFrame(() => {
            const input = document.getElementById("otp-0");
            if (input) input.focus();
          });
        } else {
          toast.error(res.data.message || "Failed to send OTP.", {
            closeButton: true,
            duration: 2000,
          });

          setErrors((prev) => ({
            ...prev,
            general: res.data.message || "Failed to send OTP",
          }));
        }
      } catch (error) {
        setErrors((prev) => ({
          ...prev,
          general: "Failed to send reset code. Please try again.",
        }));
      } finally {
        setIsLoading(false);
        toast.dismiss(loadingToast);
      }
    },
    [forgotPasswordData.email, clearErrors]
  );

  const submitOTP = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const isValid = validateOTP(otp);
      if (!isValid) {
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
        // formDataToSend.append("email", forgotPasswordData.email);
        // formDataToSend.append("otp", otp.join(""));
        // formDataToSend.append("purpose", "reset_password");

        // const res = await verifyOtp(formDataToSend);

        const res = await axios.post("/api/auth/verify-otp", {
          email: forgotPasswordData.email,
          otp: otp.join(""),
          purpose: "reset_password",
        });

        // Dismiss loading toast
        toast.dismiss(loadingToast);

        if (res && res?.data && res?.data?.success) {
          toast.success(res.data.message || "OTP Verified successfully.", {
            closeButton: true,
            duration: 2000,
          });

          setCurrentStep("reset-password");
        } else {
          toast.error(res.data.message || "Failed to verify OTP", {
            closeButton: true,
            duration: 2000,
          });

          setOtp(initialOTP);

          const input = document.getElementById("otp-0");
          if (input) input.focus();

          setErrors((prev) => ({
            ...prev,
            general: res.data.message,
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
    [otp, router, clearErrors, forgotPasswordData.email]
  );

  const submitResetPassword = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const validationErrors = validateForgotPasswordForm(forgotPasswordData);
      if (validationErrors.general) {
        setErrors(validationErrors);
        return;
      }

      clearErrors();
      setIsLoading(true);

      // Show loading toast manually
      const loadingToast = toast.loading("Resetting password...", {
        closeButton: true,
      });

      try {
        // const formDataToSend = new FormData();
        // formDataToSend.append("email", forgotPasswordData.email);
        // formDataToSend.append("password", forgotPasswordData.newPassword);

        // const res = await resetPassword(formDataToSend);

        const res = await axios.post("/api/auth/reset-password", {
          email: forgotPasswordData.email,
          password: forgotPasswordData.newPassword,
        });

        // Dismiss loading toast
        toast.dismiss(loadingToast);

        if (res && res?.data && res?.data?.success) {
          toast.success(res.data.message || "Password reset successfully.", {
            closeButton: true,
            duration: 2000,
          });

          setCurrentStep("login");
          setLoginData(initialLoginData);
          setForgotPasswordData(initialForgotPasswordData);
          setOtp(initialOTP);

          setErrors((prev) => ({
            ...prev,
            general: res.data.message || "Password reset successfully.",
          }));
        } else {
          toast.error(res.data.message || "Failed to reset password.", {
            closeButton: true,
            duration: 2000,
          });

          setErrors((prev) => ({
            ...prev,
            general: res.data.message || "Failed to reset password.",
          }));
        }
      } catch (error) {
        setErrors((prev) => ({
          ...prev,
          general: "Failed to reset password. Please try again.",
        }));
      } finally {
        setIsLoading(false);
        toast.dismiss(loadingToast);
      }
    },
    [forgotPasswordData, clearErrors]
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
      // formDataToSend.append("email", forgotPasswordData.email);
      // formDataToSend.append("purpose", "reset_password");

      // const res = await resendOtp(formDataToSend);

      const res = await axios.post("/api/auth/resend-otp", {
        email: forgotPasswordData.email,
        purpose: "reset_password",
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
  }, [forgotPasswordData.email, clearErrors]);

  const goToForgotPassword = useCallback(() => {
    setCurrentStep("forgot-password");
    clearErrors();
  }, [clearErrors]);

  const backToLogin = useCallback(() => {
    setCurrentStep("login");
    setForgotPasswordData(initialForgotPasswordData);
    setOtp(initialOTP);
    clearErrors();
  }, [clearErrors]);

  const backToForgotPassword = useCallback(() => {
    setCurrentStep("forgot-password");
    setOtp(initialOTP);
    clearErrors();
  }, [clearErrors]);

  return {
    currentStep,
    loginData,
    forgotPasswordData,
    otp,
    showPassword,
    showNewPassword,
    showConfirmPassword,
    isLoading,
    errors,
    timer,
    updateLoginData,
    updateForgotPasswordData,
    setShowPassword,
    setShowNewPassword,
    setShowConfirmPassword,
    handleOTPChange,
    handleOTPKeyDown,
    submitLogin,
    submitForgotPassword,
    submitOTP,
    submitResetPassword,
    resendOTP,
    goToForgotPassword,
    backToLogin,
    backToForgotPassword,
    isOTPComplete: otp.every((digit) => digit !== ""),
    isTimerExpired: timer === 0,
  };
};
