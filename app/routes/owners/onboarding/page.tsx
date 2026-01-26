"use client";

import type React from "react";
import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CreditCard,
  Phone,
  Upload,
  Building,
  User,
  Check,
  CheckCircle,
  Clock,
  Mail,
  MapPin,
  Map,
  Hash,
  X,
  IndianRupee,
  Lock,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ErrorMessage } from "../../auth/error-message";
import { FormInput } from "../../auth/form-input";
import { LoadingButton } from "@/components/loading-button";
import { BlurImage } from "@/components/BlurImage";
import {
  validateBankDetails,
  validateIdentity,
  validateOTP,
} from "../../auth/validation";
import axios from "axios";
// import { OTPInput } from "@/components/otp-input";
// import { useLoginForm } from "@/hooks/use-login-form";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/userStore";
import { useLoadingStore } from "@/store/loading";

// Types
type OnboardingStep =
  | "auth"
  | "identity"
  // | "phone-otp"
  | "bank-details"
  | "confirmation";

export interface AuthData {
  isNewUser: boolean;
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phone: string;
  otp: string[];
  showOTP: boolean;
}

export interface IdentityData {
  aadhaar: string;
  aadhaarFront: File | null;
  aadhaarBack: File | null;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  documents: File[];
}

export interface BankDetailsData {
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  bankName: string;
  upiId: string;
}

export interface OnboardingData {
  auth: AuthData;
  identity: IdentityData;
  bankDetails: BankDetailsData;
  phoneVerified: boolean;
}

export interface OnboardingErrors {
  email: boolean;
  password: boolean;
  confirmPassword: boolean;
  fullName: boolean;
  authPhone: boolean;
  aadhaar: boolean;
  phone: boolean;
  documents: boolean;
  aadharFront: boolean;
  aadharBack: boolean;
  address: {
    street: boolean;
    city: boolean;
    state: boolean;
    pincode: boolean;
  };
  accountNumber: boolean;
  ifscCode: boolean;
  accountHolderName: boolean;
  bankName: boolean;
  upiId: boolean;
  otp: boolean;
  general: string;
}

// Initial states
const initialErrors: OnboardingErrors = {
  email: false,
  password: false,
  confirmPassword: false,
  fullName: false,
  authPhone: false,
  aadhaar: false,
  phone: false,
  documents: false,
  aadharFront: false,
  aadharBack: false,
  address: {
    street: false,
    city: false,
    state: false,
    pincode: false,
  },
  accountNumber: false,
  ifscCode: false,
  accountHolderName: false,
  bankName: false,
  upiId: false,
  otp: false,
  general: "",
};

const initialOnboardingData: OnboardingData = {
  auth: {
    isNewUser: true,
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phone: "",
    otp: ["", "", "", "", ""],
    showOTP: false,
  },
  identity: {
    aadhaar: "",
    aadhaarFront: null,
    aadhaarBack: null,
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      pincode: "",
    },
    documents: [],
  },
  bankDetails: {
    accountNumber: "",
    ifscCode: "",
    accountHolderName: "",
    bankName: "",
    upiId: "",
  },
  phoneVerified: false,
};

// const OTP_LENGTH = 5;
// const OTP_PATTERN = /^\d*$/;
// const initialOTP: string[] = Array(OTP_LENGTH).fill("");

interface StepperProps {
  currentStep: number;
  completedSteps: number[];
  // onStepClick: (stepId: number) => void;
  orientation: "horizontal" | "vertical";
}

const steps = [
  { id: 1, title: "Authentication", subtitle: "Sign up or log in" },
  { id: 2, title: "Basic Info", subtitle: "Phone & address" },
  { id: 3, title: "Bank Details", subtitle: "Account information (optional)" },
  { id: 4, title: "Confirmation", subtitle: "Review & submit" },
];

function Stepper({
  currentStep,
  // completedSteps,
  // onStepClick,
  orientation,
}: StepperProps) {
  const completedSteps = steps
    .filter((step) => step.id < currentStep)
    .map((step) => step.id);

  const isStepCompleted = (stepId: number) => completedSteps.includes(stepId);
  const isStepActive = (stepId: number) => stepId === currentStep;
  const isStepClickable = (stepId: number) =>
    stepId <= currentStep || completedSteps.includes(stepId);

  if (orientation === "horizontal") {
    return (
      <div className="w-full">
        <div className="relative mb-4">
          <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-200">
            <motion.div
              className="h-full bg-gradient-to-r from-green-500/80 to-HG-400"
              initial={{ width: "0%" }}
              animate={{
                width: `${(completedSteps.length / (steps.length - 1)) * 100}%`,
              }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>

          <div className="relative flex justify-around pt-1 gap-4">
            {steps.map((step) => (
              <div
                key={step.id}
                className="flex flex-col justify-start items-center"
              >
                <div className="flex">
                  <button
                    // onClick={() =>
                    //   isStepClickable(step.id) && onStepClick(step.id)
                    // }
                    className={cn(
                      "relative flex items-center justify-center w-8 h-8 rounded-full",
                      isStepCompleted(step.id)
                        ? "bg-green-500 text-white"
                        : isStepActive(step.id)
                        ? "text-white bg-HG-400"
                        : "bg-white text-gray-500",
                      isStepClickable(step.id)
                        ? "cursor-pointer"
                        : "cursor-not-allowed"
                    )}
                  >
                    {isStepCompleted(step.id) ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <span className="text-sm font-poppins font-semibold">
                        {step.id}
                      </span>
                    )}
                  </button>
                </div>

                <div className="leading-none">
                  <button
                    // onClick={() =>
                    //   isStepClickable(step.id) && onStepClick(step.id)
                    // }
                    className={cn(
                      "text-left transition-all duration-200 group",
                      isStepClickable(step.id)
                        ? "cursor-pointer"
                        : "cursor-not-allowed"
                    )}
                  >
                    <h3
                      className={cn(
                        "text-xs text-center font-poppins font-thin tracking-tighter transition-colors pt-2",
                        isStepActive(step.id)
                          ? "text-HG-400"
                          : isStepCompleted(step.id)
                          ? "text-green-500/80"
                          : "text-gray-500"
                      )}
                    >
                      {step.title}
                    </h3>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-start">
          <div className="flex flex-col items-center mr-5">
            <button
              // onClick={() => isStepClickable(step.id) && onStepClick(step.id)}
              className={cn(
                "relative flex items-center justify-center w-8 h-8 rounded-full",
                isStepCompleted(step.id)
                  ? "bg-green-500/80 text-white"
                  : isStepActive(step.id)
                  ? "text-white bg-HG-400"
                  : "bg-white text-gray-500",
                isStepClickable(step.id)
                  ? "cursor-pointer"
                  : "cursor-not-allowed"
              )}
            >
              {isStepCompleted(step.id) ? (
                <Check className="w-4 h-4" />
              ) : (
                <span className="text-sm font-poppins font-semibold">
                  {step.id}
                </span>
              )}
            </button>

            {index < steps.length - 1 && (
              <div className="w-1 rounded-full h-10 mt-2 bg-gray-300 relative overflow-hidden">
                <motion.div
                  className="w-full bg-gradient-to-b from-green-500/80 to-HG-400"
                  initial={{ height: "0%" }}
                  animate={{
                    height: isStepCompleted(step.id) ? "100%" : "0%",
                  }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />
              </div>
            )}
          </div>

          <div className="">
            <button
              // onClick={() => isStepClickable(step.id) && onStepClick(step.id)}
              className={cn(
                "text-left transition-all duration-200 group",
                isStepClickable(step.id)
                  ? "cursor-pointer"
                  : "cursor-not-allowed"
              )}
            >
              <h3
                className={cn(
                  "text-lg font-medium transition-colors font-poppins pt-0.5",
                  isStepActive(step.id)
                    ? "text-HG-400"
                    : isStepCompleted(step.id)
                    ? "text-green-500/80"
                    : "text-gray-500"
                )}
              >
                {step.title}
              </h3>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// Main Component
export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("auth");
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>(
    initialOnboardingData
  );
  // const [otp, setOtp] = useState<string[]>(initialOTP);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<OnboardingErrors>(initialErrors);
  // const [timer, setTimer] = useState(300);

  const { user, setUser } = useUserStore();
  const { setLoading } = useLoadingStore();

  useEffect(() => {
    const fetchOwnerStatus = async () => {
      if (!user) {
        setCurrentStep("auth");
        return;
      }

      setLoading(true);

      try {
        if (user.ownerStatus === "pending") {
          setCurrentStep("confirmation");
          return;
        }

        const res = await axios.get("/api/owner/getOwner");

        if (res?.data?.success) {
          setCurrentStep("bank-details");
        } else {
          setCurrentStep("identity");
        }
      } catch (error) {
        if (!user) {
          setCurrentStep("auth");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOwnerStatus();
  }, [user, setLoading]);

  // const {
  //   handleOTPChange,
  //   handleOTPKeyDown,
  //   isOTPComplete,
  //   isTimerExpired,
  //   otp,
  // } = useLoginForm();

  const router = useRouter();

  // Timer effect for OTP
  // useEffect(() => {
  //   if (currentStep === "phone-otp" && timer > 0) {
  //     requestAnimationFrame(() => {
  //       const input = document.getElementById("otp-0");
  //       if (input) input.focus();
  //     });
  //     const interval = setInterval(() => setTimer((t) => t - 1), 1000);
  //     return () => clearInterval(interval);
  //   }
  // }, [currentStep]);

  const clearErrors = useCallback(() => {
    setErrors(initialErrors);
  }, []);

  const updateOnboardingData = useCallback(
    (section: keyof OnboardingData, data: any) => {
      setOnboardingData((prev) => ({
        ...prev,
        [section]:
          typeof data === "object" && !Array.isArray(data)
            ? //@ts-ignore
              { ...prev[section], ...data }
            : data,
      }));
    },
    []
  );

  const goToStep = useCallback(
    (step: OnboardingStep) => {
      setCurrentStep(step);
      clearErrors();
    },
    [clearErrors]
  );

  const goToNextStep = useCallback(() => {
    const steps: OnboardingStep[] = [
      "auth",
      "identity",
      // "phone-otp",
      "bank-details",
      "confirmation",
    ];
    const currentIndex = steps.indexOf(currentStep);

    if (currentIndex < steps.length - 1) {
      const currentStepNumber = currentIndex + 1;
      setCompletedSteps((prev) => [
        ...prev.filter((s) => s !== currentStepNumber),
        currentStepNumber,
      ]);
      setCurrentStep(steps[currentIndex + 1]);
      clearErrors();
    }
  }, [currentStep, clearErrors]);

  // const goToPreviousStep = useCallback(() => {
  //   const steps: OnboardingStep[] = [
  //     "identity",
  //     // "phone-otp",
  //     "bank-details",
  //     "confirmation",
  //   ];
  //   const currentIndex = steps.indexOf(currentStep);

  //   if (currentIndex > 0) {
  //     setCurrentStep(steps[currentIndex - 1]);
  //     clearErrors();
  //   }
  // }, [currentStep, clearErrors]);

  // const handleStepClick = (stepId: number) => {
  //   const stepNames: OnboardingStep[] = [
  //     "identity",
  //     // "phone-otp",
  //     "bank-details",
  //     "confirmation",
  //   ];
  //   const currentStepNumber = stepNames.indexOf(currentStep) + 1;

  //   if (stepId <= currentStepNumber || completedSteps.includes(stepId)) {
  //     goToStep(stepNames[stepId - 1]);
  //   }
  // };

  const getCurrentStepNumber = () => {
    const steps: OnboardingStep[] = [
      "auth",
      "identity",
      // "phone-otp",
      "bank-details",
      "confirmation",
    ];
    return steps.indexOf(currentStep) + 1;
  };

  // const formatTimer = (seconds: number) => {
  //   const mins = Math.floor(seconds / 60);
  //   const secs = seconds % 60;
  //   return `${mins}:${secs.toString().padStart(2, "0")}`;
  // };

  const toBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleOTPChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...onboardingData.auth.otp];
    newOtp[index] = value;
    updateOnboardingData("auth", { otp: newOtp });

    if (value && index < 4) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !onboardingData.auth.otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const submitAuthStep = async (e: React.FormEvent) => {
    e.preventDefault();

    clearErrors();
    setIsLoading(true);

    try {
      if (onboardingData.auth.isNewUser) {
        if (!onboardingData.auth.showOTP) {
          if (
            !onboardingData.auth.email ||
            !onboardingData.auth.password ||
            !onboardingData.auth.fullName ||
            !onboardingData.auth.phone
          ) {
            setErrors((prev) => ({
              ...prev,
              general: "Please fill all required fields",
            }));
            return;
          }

          if (
            onboardingData.auth.password !== onboardingData.auth.confirmPassword
          ) {
            setErrors((prev) => ({
              ...prev,
              confirmPassword: true,
              general: "Passwords don't match",
            }));
            return;
          }

          const res = await axios.post("/api/auth/register", {
            email: onboardingData.auth.email,
            password: onboardingData.auth.password,
            fullName: onboardingData.auth.fullName,
            mobile: onboardingData.auth.phone,
          });

          if (res?.data?.success) {
            updateOnboardingData("auth", { showOTP: true });
            toast.success("OTP sent to your email!", { duration: 3000 });
          } else {
            setErrors((prev) => ({
              ...prev,
              general: res.data?.message || "Signup failed",
            }));
          }
        } else {
          const otpString = onboardingData.auth.otp.join("");
          if (otpString.length !== 5) {
            setErrors((prev) => ({
              ...prev,
              otp: true,
              general: "Please enter complete OTP",
            }));
            return;
          }

          const res = await axios.post("/api/auth/verify-otp", {
            email: onboardingData.auth.email,
            otp: otpString,
            purpose: "signup",
          });

          if (res?.data?.success) {
            setUser(res.data.user);
            toast.success("Account created successfully!", { duration: 3000 });
            goToNextStep();
          } else {
            setErrors((prev) => ({
              ...prev,
              otp: true,
              general: res.data?.message || "Invalid OTP",
            }));
          }
        }
      } else {
        if (!onboardingData.auth.email || !onboardingData.auth.password) {
          setErrors((prev) => ({
            ...prev,
            general: "Please enter email and password",
          }));
          return;
        }

        const res = await axios.post("/api/auth/login", {
          email: onboardingData.auth.email,
          password: onboardingData.auth.password,
        });

        if (res?.data?.success) {
          setUser(res.data.user);
          toast.success("Login successful!", { duration: 3000 });
          goToNextStep();
        } else {
          setErrors((prev) => ({
            ...prev,
            general: res.data?.message || "Login failed",
          }));
        }
      }
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        general: "Authentication failed. Please try again.",
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const submitIdentityStep = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate only required fields: phone and address
    if (!onboardingData.identity.phone) {
      setErrors((prev) => ({
        ...prev,
        phone: true,
        general: "Phone number is required",
      }));
      return;
    }

    if (
      !onboardingData.identity.address.street ||
      !onboardingData.identity.address.city ||
      !onboardingData.identity.address.state ||
      !onboardingData.identity.address.pincode
    ) {
      setErrors((prev) => ({
        ...prev,
        address: {
          street: !onboardingData.identity.address.street,
          city: !onboardingData.identity.address.city,
          state: !onboardingData.identity.address.state,
          pincode: !onboardingData.identity.address.pincode,
        },
        general: "Please fill all address fields",
      }));
      return;
    }

    clearErrors();
    setIsLoading(true);
    const loadingToast = toast.loading("Saving your information...", {
      closeButton: true,
    });

    try {
      const aadhaarFrontBase64 = onboardingData.identity.aadhaarFront
        ? await toBase64(onboardingData.identity.aadhaarFront)
        : null;

      const aadhaarBackBase64 = onboardingData.identity.aadhaarBack
        ? await toBase64(onboardingData.identity.aadhaarBack)
        : null;

      const documentsBase64 = await Promise.all(
        onboardingData.identity.documents.map((file) => toBase64(file))
      );

      const res = await axios.post("/api/owner/register", {
        aadhaarNumber: onboardingData.identity.aadhaar || "",
        phone: onboardingData.identity.phone,
        aadhaarFront: aadhaarFrontBase64,
        aadhaarBack: aadhaarBackBase64,
        street: onboardingData.identity.address.street,
        city: onboardingData.identity.address.city,
        state: onboardingData.identity.address.state,
        pincode: onboardingData.identity.address.pincode,
        documents: documentsBase64,
      });

      toast.dismiss(loadingToast);

      if (res?.data?.success) {
        toast.success(res.data.message || "Information saved!", {
          duration: 3000,
          closeButton: true,
        });
        goToNextStep();
      } else {
        toast.error(res.data?.message || "Something went wrong", {
          duration: 3000,
          closeButton: true,
        });
        setErrors((prev) => ({
          ...prev,
          general: res.data?.message,
        }));
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("Failed to submit information. Try again.", {
        duration: 3000,
        closeButton: true,
      });
      setErrors((prev) => ({
        ...prev,
        general: "Failed to submit information. Try again.",
      }));
    } finally {
      setIsLoading(false);
      toast.dismiss(loadingToast);
    }
  };

  // const submitPhoneOTP = async (e: React.FormEvent) => {
  //   e.preventDefault();

  //   if (!validateOTP(otp)) {
  //     setErrors((prev) => ({ ...prev, otp: "Please enter complete OTP" }));
  //     return;
  //   }

  //   clearErrors();
  //   setIsLoading(true);

  //   const loadingToast = toast.loading("Verifying OTP...", {
  //     closeButton: true,
  //   });

  //   try {
  //     // Simulate API call
  //     await new Promise((resolve) => setTimeout(resolve, 1500));

  //     toast.dismiss(loadingToast);
  //     toast.success("Phone verified successfully!", {
  //       closeButton: true,
  //       duration: 2000,
  //     });

  //     updateOnboardingData("phoneVerified", true);
  //     goToNextStep();
  //   } catch (error) {
  //     toast.dismiss(loadingToast);
  //     toast.error("OTP verification failed. Please try again.", {
  //       closeButton: true,
  //       duration: 2000,
  //     });
  //     setOtp(initialOTP);
  //     const input = document.getElementById("otp-0");
  //     if (input) input.focus();
  //     setErrors((prev) => ({
  //       ...prev,
  //       otp: "OTP verification failed. Please try again.",
  //     }));
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const skipBankDetails = async () => {
    setIsLoading(true);

    try {
      const res = await axios.post("/api/owner/saveBankDetails", {
        userId: user?.id,
        accountNumber: "",
        ifscCode: "",
        accountHolderName: "",
        bankName: "",
        upiId: "",
      });

      if (res?.data?.success) {
        if (user) {
          const updatedUser = {
            ...user,
            ownerStatus: "pending",
          };
          setUser(updatedUser);
        }

        toast.success("Bank details skipped. You can add them later.", {
          duration: 3000,
        });
        goToNextStep();
      } else {
        toast.error("Failed to skip bank details. Please try again.", {
          duration: 3000,
        });
      }
    } catch (error) {
      toast.error("Failed to skip bank details. Please try again.", {
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const submitBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateBankDetails(onboardingData.bankDetails);
    if (
      Object.values(validationErrors).some(
        (v) =>
          v === true ||
          (typeof v === "object" && Object.values(v).some(Boolean))
      )
    ) {
      setErrors((prev) => ({ ...prev, ...validationErrors }));
      return;
    }

    clearErrors();
    setIsLoading(true);

    const loadingToast = toast.loading("uploading bank details...", {
      closeButton: true,
    });

    try {
      const res = await axios.post("/api/owner/saveBankDetails", {
        userId: user?.id,
        accountNumber: onboardingData.bankDetails.accountNumber,
        ifscCode: onboardingData.bankDetails.ifscCode,
        accountHolderName: onboardingData.bankDetails.accountHolderName,
        bankName: onboardingData.bankDetails.bankName,
        upiId: onboardingData.bankDetails.upiId,
      });

      toast.dismiss(loadingToast);

      if (res?.data?.success) {
        toast.success(res.data.message || "Bank details updated!", {
          closeButton: true,
          duration: 2000,
        });

        if (user) {
          const updatedUser = {
            ...user,
            ownerStatus: "pending",
          };

          setUser(updatedUser);
        }

        goToNextStep();
      } else {
        toast.error(res.data.message || "Failed to update bank details.", {
          closeButton: true,
          duration: 2000,
        });
        setErrors((prev) => ({
          ...prev,
          general: res.data.message,
        }));
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("Bank details verification failed. Please try again.", {
        closeButton: true,
        duration: 2000,
      });
      setErrors((prev) => ({
        ...prev,
        general: "Bank details verification failed. Please try again.",
      }));
    } finally {
      setIsLoading(false);
      toast.dismiss(loadingToast);
    }
  };

  // const resendOTP = async () => {
  //   clearErrors();
  //   setOtp(initialOTP);
  //   setTimer(300);

  //   const loadingToast = toast.loading("Resending OTP...", {
  //     closeButton: true,
  //   });

  //   try {
  //     // Simulate API call
  //     await new Promise((resolve) => setTimeout(resolve, 1000));

  //     toast.dismiss(loadingToast);
  //     toast.success("OTP resent successfully!", {
  //       closeButton: true,
  //       duration: 2000,
  //     });

  //     requestAnimationFrame(() => {
  //       const input = document.getElementById("otp-0");
  //       if (input) input.focus();
  //     });
  //   } catch (error) {
  //     toast.dismiss(loadingToast);
  //     toast.error("Failed to resend OTP. Please try again.", {
  //       closeButton: true,
  //       duration: 2000,
  //     });
  //     setErrors((prev) => ({
  //       ...prev,
  //       general: "Failed to resend OTP. Please try again.",
  //     }));
  //   }
  // };

  // const completeOnboarding = async () => {
  //   setIsLoading(true);

  //   const loadingToast = toast.loading("Completing onboarding...", {
  //     closeButton: true,
  //   });

  //   try {
  //     // Simulate API call
  //     await new Promise((resolve) => setTimeout(resolve, 2000));

  //     toast.dismiss(loadingToast);
  //     toast.success("Onboarding completed successfully!", {
  //       closeButton: true,
  //       duration: 3000,
  //     });

  //     setTimeout(() => {
  //       router.push("/dashboard");
  //     }, 2000);
  //   } catch (error) {
  //     toast.dismiss(loadingToast);
  //     toast.error("Failed to complete onboarding. Please try again.", {
  //       closeButton: true,
  //       duration: 2000,
  //     });
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    const existingFiles = onboardingData.identity.documents;

    // Max limit of 6 files
    if (existingFiles.length + newFiles.length > 6) {
      alert("You can upload a maximum of 6 documents.");
      return;
    }

    updateOnboardingData("identity", {
      documents: [...existingFiles, ...newFiles],
    });
  };

  // Auto-send OTP when reaching phone-otp step
  // useEffect(() => {
  //   if (
  //     currentStep === "phone-otp" &&
  //     onboardingData.identity.phone &&
  //     !onboardingData.phoneVerified
  //   ) {
  //     const sendOTP = async () => {
  //       const loadingToast = toast.loading("Sending OTP...", {
  //         closeButton: true,
  //       });
  //       try {
  //         await new Promise((resolve) => setTimeout(resolve, 1000));
  //         toast.dismiss(loadingToast);
  //         toast.success("OTP sent successfully!", {
  //           closeButton: true,
  //           duration: 2000,
  //         });
  //         requestAnimationFrame(() => {
  //           const input = document.getElementById("otp-0");
  //           if (input) input.focus();
  //         });
  //       } catch (error) {
  //         toast.dismiss(loadingToast);
  //         toast.error("Failed to send OTP. Please try again.", {
  //           closeButton: true,
  //           duration: 2000,
  //         });
  //       }
  //     };
  //     sendOTP();
  //   }
  // }, [
  //   currentStep,
  //   onboardingData.identity.phone,
  //   onboardingData.phoneVerified,
  // ]);

  const removeDocument = (index: number) => {
    const updatedDocuments = onboardingData.identity.documents.filter(
      (_, i) => i !== index
    );
    updateOnboardingData("identity", { documents: updatedDocuments });
  };

  const renderCurrentStep = () => {
    const containerVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.08,
          delayChildren: 0.1,
        },
      },
    };

    const itemVariants = {
      hidden: { opacity: 0, y: 10 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring" as const, stiffness: 300, damping: 24 },
      },
    };

    switch (currentStep) {
      case "auth":
        return (
          <>
            <motion.h2
              variants={itemVariants}
              className="md:text-[22px] font-normal text-gray-900 mb-1 font-poppins"
            >
              {onboardingData.auth.isNewUser
                ? "Create Your Account"
                : "Welcome Back"}
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="text-xs md:text-[15px] text-gray-500 mb-8 md:mb-10 font-inter"
            >
              {onboardingData.auth.isNewUser
                ? "Sign up to start your owner journey"
                : "Sign in to continue your onboarding"}
            </motion.p>

            <ErrorMessage message={errors.general} />

            {!onboardingData.auth.showOTP ? (
              <form onSubmit={submitAuthStep}>
                <motion.div variants={containerVariants} className="space-y-4">
                  <motion.div
                    variants={itemVariants}
                    className="flex gap-2 p-1 bg-gray-100 rounded-lg"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        updateOnboardingData("auth", { isNewUser: true })
                      }
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        onboardingData.auth.isNewUser
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Sign Up
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateOnboardingData("auth", { isNewUser: false })
                      }
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        !onboardingData.auth.isNewUser
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Log In
                    </button>
                  </motion.div>

                  {onboardingData.auth.isNewUser && (
                    <FormInput
                      id="fullName"
                      label="Full Name"
                      type="text"
                      value={onboardingData.auth.fullName}
                      onChange={(value) =>
                        updateOnboardingData("auth", { fullName: value })
                      }
                      placeholder="John Doe"
                      icon={User}
                      hasError={errors.fullName}
                    />
                  )}

                  <FormInput
                    id="email"
                    label="Email"
                    type="email"
                    value={onboardingData.auth.email}
                    onChange={(value) =>
                      updateOnboardingData("auth", { email: value })
                    }
                    placeholder="you@company.com"
                    icon={Mail}
                    hasError={errors.email}
                  />

                  {onboardingData.auth.isNewUser && (
                    <FormInput
                      id="authPhone"
                      label="Phone Number"
                      type="tel"
                      value={onboardingData.auth.phone}
                      onChange={(value) =>
                        updateOnboardingData("auth", {
                          phone: value.replace(/\D/g, ""),
                        })
                      }
                      placeholder="9876543210"
                      icon={Phone}
                      hasError={errors.authPhone}
                    />
                  )}

                  <FormInput
                    id="password"
                    label="Password"
                    type="password"
                    value={onboardingData.auth.password}
                    onChange={(value) =>
                      updateOnboardingData("auth", { password: value })
                    }
                    placeholder="••••••••"
                    icon={Lock}
                    hasError={errors.password}
                  />

                  {onboardingData.auth.isNewUser && (
                    <FormInput
                      id="confirmPassword"
                      label="Confirm Password"
                      type="password"
                      value={onboardingData.auth.confirmPassword}
                      onChange={(value) =>
                        updateOnboardingData("auth", { confirmPassword: value })
                      }
                      placeholder="••••••••"
                      icon={Lock}
                      hasError={errors.confirmPassword}
                    />
                  )}

                  <motion.div variants={itemVariants} className="pt-2">
                    <LoadingButton
                      type="submit"
                      isLoading={isLoading}
                      loadingText={
                        onboardingData.auth.isNewUser
                          ? "Creating Account"
                          : "Signing In"
                      }
                    >
                      {onboardingData.auth.isNewUser
                        ? "Create Account"
                        : "Sign In"}
                    </LoadingButton>
                  </motion.div>
                </motion.div>
              </form>
            ) : (
              <form onSubmit={submitAuthStep}>
                <motion.div variants={containerVariants} className="space-y-6">
                  <motion.div variants={itemVariants} className="text-center">
                    <h3 className="text-[18px] font-medium text-gray-900 mb-2">
                      Verify your email
                    </h3>
                    <p className="text-[14px] text-gray-500 mb-8">
                      We&apos;ve sent a 5-digit code to{" "}
                      {onboardingData.auth.email}
                    </p>
                  </motion.div>

                  <motion.div
                    variants={itemVariants}
                    className="flex gap-3 justify-center"
                  >
                    {onboardingData.auth.otp.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOTPChange(index, e.target.value)}
                        onKeyDown={(e) => handleOTPKeyDown(index, e)}
                        className={`w-12 h-12 text-center text-lg font-medium border rounded-lg focus:outline-none focus:ring-2 focus:ring-HG-500 ${
                          errors.otp ? "border-red-400" : "border-gray-300"
                        }`}
                      />
                    ))}
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <LoadingButton
                      type="submit"
                      isLoading={isLoading}
                      loadingText="Verifying"
                      disabled={onboardingData.auth.otp.join("").length !== 5}
                    >
                      Verify & Continue
                    </LoadingButton>
                  </motion.div>

                  <motion.div variants={itemVariants} className="text-center">
                    <button
                      type="button"
                      onClick={() =>
                        updateOnboardingData("auth", {
                          showOTP: false,
                          otp: ["", "", "", "", ""],
                        })
                      }
                      className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      ← Back to signup
                    </button>
                  </motion.div>
                </motion.div>
              </form>
            )}
          </>
        );

      case "identity":
        return (
          <>
            <motion.h2
              variants={itemVariants}
              className="md:text-[22px] font-normal text-gray-900 mb-1 font-poppins"
            >
              Step 2: Basic Information
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="text-xs md:text-[15px] text-gray-500 mb-8 md:mb-10 font-inter"
            >
              Enter your phone and address. You can add Aadhaar & documents
              later from your profile.
            </motion.p>

            <ErrorMessage message={errors.general} />

            <form onSubmit={submitIdentityStep}>
              <motion.div variants={containerVariants} className="space-y-4">
                <FormInput
                  id="phone"
                  label="Phone Number *"
                  type="tel"
                  value={onboardingData.identity.phone}
                  onChange={(value) =>
                    updateOnboardingData("identity", {
                      phone: value.replace(/\D/g, ""),
                    })
                  }
                  placeholder="9876543210"
                  icon={Phone}
                  hasError={errors.phone}
                />

                <FormInput
                  id="aadhaar"
                  label="Aadhaar Number (Optional)"
                  type="text"
                  value={onboardingData.identity.aadhaar}
                  onChange={(value) =>
                    updateOnboardingData("identity", {
                      aadhaar: value.replace(/\D/g, ""),
                    })
                  }
                  placeholder="1234 5678 9012 (can add later)"
                  icon={CreditCard}
                  hasError={errors.aadhaar}
                />

                <motion.div variants={itemVariants} className="flex gap-4">
                  <div className="relative w-[65vw] h-[25vw] md:h-[45vw] max-w-[300px] max-h-[150px] overflow-hidden">
                    <input
                      type="file"
                      id="aadhaarFront"
                      name="aadhaarFront"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => {
                        updateOnboardingData("identity", {
                          aadhaarFront: e.target.files?.[0],
                        });
                      }}
                    />
                    <label
                      htmlFor="aadhaarFront"
                      className="cursor-pointer select-none"
                    >
                      {onboardingData.identity.aadhaarFront ? (
                        <BlurImage
                          src={URL.createObjectURL(
                            onboardingData.identity.aadhaarFront
                          )}
                          alt="Selected"
                          className=" object-cover rounded-xl border"
                          width={200}
                          height={200}
                        />
                      ) : (
                        <div
                          className={`flex gap-2 text-xs md:text-base  flex-col justify-center items-center h-full bg-HG-400/10  border-2 border-dashed  rounded-lg   text-center hover:border-gray-400 transition-colors ${
                            errors.aadharFront
                              ? "border-red-400"
                              : "border-gray-300"
                          }`}
                        >
                          <Upload className="w-4 h-4 md:w-6 md:h-6 text-gray-400 mx-auto " />
                          <p className="text-xs md:text-sm text-gray-600 ">
                            Upload aadhaar front (optional)
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                  <div className="relative w-[65vw] h-[25vw] md:h-[45vw] max-w-[300px] max-h-[150px] overflow-hidden">
                    <input
                      type="file"
                      id="aadhaarBack"
                      name="aadhaarBack"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => {
                        updateOnboardingData("identity", {
                          aadhaarBack: e.target.files?.[0],
                        });
                      }}
                    />
                    <label
                      htmlFor="aadhaarBack"
                      className="cursor-pointer select-none"
                    >
                      {onboardingData.identity.aadhaarBack ? (
                        <BlurImage
                          src={URL.createObjectURL(
                            onboardingData.identity.aadhaarBack
                          )}
                          alt="Selected"
                          className=" object-cover rounded-xl border"
                          width={200}
                          height={200}
                        />
                      ) : (
                        <div
                          className={`flex gap-2 text-xs md:text-base  flex-col justify-center items-center h-full bg-HG-400/10  border-2 border-dashed  rounded-lg   text-center hover:border-gray-400 transition-colors ${
                            errors.aadharBack
                              ? "border-red-400"
                              : "border-gray-300"
                          }`}
                        >
                          <Upload className="w-4 h-4 md:w-6 md:h-6 text-gray-400 mx-auto " />
                          <p className="text-xs md:text-sm text-gray-600 ">
                            Upload aadhaar back (optional)
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                </motion.div>

                <FormInput
                  id="street"
                  label="Street Address *"
                  type="text"
                  value={onboardingData.identity.address.street}
                  onChange={(value) =>
                    updateOnboardingData("identity", {
                      address: {
                        ...onboardingData.identity.address,
                        street: value,
                      },
                    })
                  }
                  placeholder="Sector 10, Near Market"
                  icon={MapPin}
                  hasError={errors.address.street}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    id="city"
                    label="City *"
                    type="text"
                    value={onboardingData.identity.address.city}
                    onChange={(value) =>
                      updateOnboardingData("identity", {
                        address: {
                          ...onboardingData.identity.address,
                          city: value,
                        },
                      })
                    }
                    placeholder="Chandigarh"
                    icon={Map}
                    hasError={errors.address.city}
                  />

                  <FormInput
                    id="state"
                    label="State *"
                    type="text"
                    value={onboardingData.identity.address.state}
                    onChange={(value) =>
                      updateOnboardingData("identity", {
                        address: {
                          ...onboardingData.identity.address,
                          state: value,
                        },
                      })
                    }
                    placeholder="Punjab"
                    icon={Building}
                    hasError={errors.address.state}
                  />
                </div>

                <FormInput
                  id="pincode"
                  label="Pincode *"
                  type="text"
                  value={onboardingData.identity.address.pincode}
                  onChange={(value) =>
                    updateOnboardingData("identity", {
                      address: {
                        ...onboardingData.identity.address,
                        pincode: value.replace(/\D/g, ""),
                      },
                    })
                  }
                  placeholder="160017"
                  icon={Hash}
                  hasError={errors.address.pincode}
                />

                <motion.div variants={itemVariants}>
                  <label className="text-[14px] font-normal text-gray-700 mb-1.5 block">
                    Upload Additional Documents (optional)
                  </label>

                  <label
                    htmlFor="document-upload"
                    className="cursor-pointer border-2 border-dashed border-gray-300 bg-HG-400/10 rounded-lg flex items-center justify-between gap-2 px-4 py-2 text-center hover:border-gray-400 transition-colors"
                  >
                    <p className="text-sm text-gray-600">
                      Upload PAN card or other ID documents
                    </p>
                    <Upload className="h-4 w-4 md:w-6 md:h-6 text-gray-400" />
                  </label>

                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="document-upload"
                  />

                  {onboardingData.identity.documents.length > 0 && (
                    <>
                      <p className="text-sm font-medium text-gray-700 py-4">
                        Uploaded Documents (
                        {onboardingData.identity.documents.length})
                      </p>
                      <div className="flex flex-wrap gap-2 items-center justify-start">
                        {onboardingData.identity.documents.map((doc, index) => (
                          <div
                            key={index}
                            className="overflow-hidden relative rounded-xl w-24 h-24"
                          >
                            <button
                              type="button"
                              onClick={() => removeDocument(index)}
                              className="p-1 absolute z-30 top-0 right-0 bg-white hover:bg-gray-200 rounded-full transition-colors"
                            >
                              <X className="h-4 w-4 text-gray-900" />
                            </button>

                            <BlurImage
                              src={URL.createObjectURL(doc)}
                              alt="Selected"
                              className="w-24 h-24 object-cover rounded-xl border"
                              width={20}
                              height={20}
                            />
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </motion.div>

                <motion.div
                  variants={itemVariants}
                  className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Complete profile later</p>
                      <p>
                        Aadhaar card upload and additional documents can be
                        added anytime from your dashboard → Profile section.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              <motion.div variants={itemVariants} className="pt-5">
                <LoadingButton type="submit" isLoading={isLoading}>
                  Continue → Bank Details (Optional)
                </LoadingButton>
              </motion.div>
            </form>
          </>
        );

      // case "phone-otp":
      //   return (
      //     <div className="bg-white rounded-lg  border-gray-200 p-8">
      //       <motion.div
      //         initial="hidden"
      //         animate="visible"
      //         variants={containerVariants}
      //       >
      //         <motion.div variants={itemVariants} className="mb-8 text-center">
      //           <h2 className="text-[22px] font-normal text-gray-900 mb-2">
      //             Step 2: Verify your phone number
      //           </h2>
      //           <p className="text-[15px] text-gray-500">
      //             We've sent a 5-digit code to +91{" "}
      //             {onboardingData.identity.phone}. Enter it below to continue.
      //           </p>
      //         </motion.div>

      //         <ErrorMessage message={errors.general} />

      //         <form>
      //           {/* <form onSubmit={submitPhoneOTP}> */}
      //           <motion.div variants={containerVariants} className="space-y-6">
      //             <OTPInput
      //               otp={otp}
      //               onChange={handleOTPChange}
      //               onKeyDown={handleOTPKeyDown}
      //             />

      //             <motion.div variants={itemVariants} className="pt-2">
      //               <LoadingButton
      //                 type="submit"
      //                 isLoading={isLoading}
      //                 loadingText="Verifying"
      //                 disabled={!isOTPComplete || otp.some((digit) => !digit)}
      //               >
      //                 Verify & Continue
      //               </LoadingButton>
      //             </motion.div>

      //             <motion.div variants={itemVariants} className="text-center">
      //               <p className="text-[14px] text-gray-500">
      //                 Didn&apos;t receive the code?{" "}
      //                 {isTimerExpired ? (
      //                   <motion.button
      //                     type="button"
      //                     // onClick={resendOTP}
      //                     whileHover={{ scale: 1.02 }}
      //                     whileTap={{ scale: 0.98 }}
      //                     className="font-normal text-gray-900 hover:text-gray-700 transition-colors"
      //                   >
      //                     Resend code
      //                   </motion.button>
      //                 ) : (
      //                   <span className="font-normal text-gray-500">
      //                     Resend code in {formatTimer(timer)}
      //                   </span>
      //                 )}
      //               </p>
      //             </motion.div>
      //           </motion.div>
      //         </form>
      //       </motion.div>
      //     </div>
      //   );

      case "bank-details":
        return (
          <div className="bg-white rounded-lg">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
            >
              <motion.div variants={itemVariants} className="mb-8">
                <h2 className="md:text-[22px] font-normal text-gray-900 mb-1">
                  Step 3: Bank account details (Optional)
                </h2>
                <p className="text-xs md:text-[15px] text-gray-500">
                  Enter your bank account information for payments, or skip to
                  add later
                </p>
              </motion.div>

              <ErrorMessage message={errors.general} />

              <form onSubmit={submitBankDetails}>
                <motion.div variants={containerVariants} className="space-y-4">
                  <div className="flex gap-4 w-full flex-col md:flex-row">
                    <FormInput
                      id="accountNumber"
                      label="Account Number"
                      type="text"
                      value={onboardingData.bankDetails.accountNumber}
                      onChange={(value) =>
                        updateOnboardingData("bankDetails", {
                          accountNumber: value.replace(/\D/g, ""),
                        })
                      }
                      placeholder="1234567890123456"
                      icon={CreditCard}
                      hasError={errors.accountNumber}
                    />

                    <FormInput
                      id="ifscCode"
                      label="IFSC Code"
                      type="text"
                      value={onboardingData.bankDetails.ifscCode}
                      onChange={(value) =>
                        updateOnboardingData("bankDetails", {
                          ifscCode: value.toUpperCase(),
                        })
                      }
                      placeholder="SBIN0001234"
                      icon={Building}
                      hasError={errors.ifscCode}
                    />
                  </div>

                  <div className="flex gap-4 w-full flex-col md:flex-row">
                    <FormInput
                      id="accountHolderName"
                      label="Account Holder Name"
                      type="text"
                      value={onboardingData.bankDetails.accountHolderName}
                      onChange={(value) =>
                        updateOnboardingData("bankDetails", {
                          accountHolderName: value,
                        })
                      }
                      placeholder="John Doe"
                      icon={User}
                      hasError={errors.accountHolderName}
                    />

                    <FormInput
                      id="bankName"
                      label="Bank Name"
                      type="text"
                      value={onboardingData.bankDetails.bankName}
                      onChange={(value) =>
                        updateOnboardingData("bankDetails", { bankName: value })
                      }
                      placeholder="State Bank of India"
                      icon={Building}
                      hasError={errors.bankName}
                    />
                  </div>

                  <FormInput
                    id="upiId"
                    label="UPI ID (optional)"
                    type="text"
                    value={onboardingData.bankDetails.upiId}
                    onChange={(value) =>
                      updateOnboardingData("bankDetails", {
                        upiId: value,
                      })
                    }
                    placeholder="john@upi"
                    icon={IndianRupee}
                    hasError={errors.upiId}
                  />
                </motion.div>

                <motion.div variants={itemVariants} className="pt-5 space-y-3">
                  <LoadingButton
                    type="submit"
                    isLoading={isLoading}
                    loadingText="Saving Bank Details"
                  >
                    Save & Continue
                  </LoadingButton>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={skipBankDetails}
                    disabled={isLoading}
                    className="w-full"
                  >
                    Skip for now
                  </Button>
                </motion.div>
              </form>
            </motion.div>
          </div>
        );

      case "confirmation":
        return (
          <div className="bg-white rounded-lg">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
            >
              <motion.div
                variants={itemVariants}
                className="text-center pt-4 mb-8"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="md:text-[22px] font-normal text-gray-900 mb-2 font-poppins">
                  Step 4: Application Submitted Successfully!
                </h2>
                <p className="text-xs md:text-[15px] text-gray-500 font-poppins">
                  Your onboarding application is now under review
                </p>
              </motion.div>

              <motion.div variants={containerVariants} className="space-y-6">
                <motion.div
                  variants={itemVariants}
                  className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
                >
                  <div className="flex items-start">
                    <Clock className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-medium text-yellow-800 mb-1">
                        Admin Approval Pending
                      </h3>
                      <p className="text-xs md:text-sm text-yellow-700">
                        Our team will review your application within 24-48
                        hours. You&apos;ll receive an email notification once
                        approved.
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  variants={itemVariants}
                  className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                >
                  <h3 className="text-sm font-medium text-blue-800 mb-4 md:mb-2">
                    What happens next?
                  </h3>
                  <ul className="text-xs md:text-sm text-blue-700 space-y-1">
                    <li className="flex items-center">
                      <Mail className="w-4 h-4 mr-4 md:mr-2 flex-shrink-0" />
                      You&apos;ll receive email updates on your application
                      status
                    </li>
                    <li className="flex items-center">
                      <Phone className="w-4 h-4 mr-4 md:mr-2 flex-shrink-0" />
                      Our team may contact you for additional verification
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-4 md:mr-2 flex-shrink-0" />
                      Once approved, you can start using your account
                      immediately
                    </li>
                  </ul>
                </motion.div>
              </motion.div>
              <motion.div variants={itemVariants} className="pt-5">
                <Button
                  onClick={() => {
                    router.replace("/");
                  }}
                  className="w-full py-6"
                >
                  Continue
                </Button>
              </motion.div>
            </motion.div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      <div className="md:hidden bg-HG-400/10 items-center justify-center px-4 pt-4 pb-1">
        <div className="flex items-start justify-start flex-col">
          <h1 className="text-[18px] font-inter leading-[1.2] text-gray-600 mb-1">
            Get Started as an Owner
          </h1>
          <p className="text-gray-500 text-[14px] tracking-wide">
            Complete your setup in minutes
          </p>
        </div>
        <div className="mt-4">
          <Stepper
            currentStep={getCurrentStepNumber()}
            completedSteps={completedSteps}
            orientation="horizontal"
          />
        </div>
      </div>

      <div className="hidden md:flex md:w-[35%] bg-HG-400/10 items-center justify-center p-12">
        <div className="max-w-md">
          <div className="mb-12">
            <Link href={"/"}>
              <p className="font-poppins font-bold text-HG-500 text-2xl pb-10">
                SYPG
              </p>
            </Link>
            <h1 className="text-[28px] font-inter leading-[1.2] font-light text-gray-600 mb-2">
              Get Started as an Owner
            </h1>
            <p className="text-gray-500 text-[15px] leading-relaxed">
              Complete your setup in minutes
            </p>
          </div>

          <div>
            <Stepper
              currentStep={getCurrentStepNumber()}
              completedSteps={completedSteps}
              orientation="vertical"
            />
          </div>
        </div>
      </div>

      <div className="w-full md:w-7/12 mx-auto flex items-center justify-center p-6 md:pb-10 bg-white">
        <motion.div
          initial="hidden"
          animate="visible"
          exit={{ opacity: 0, x: -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="w-full max-w-[600px]"
        >
          {renderCurrentStep()}
        </motion.div>
      </div>
    </div>
  );
}