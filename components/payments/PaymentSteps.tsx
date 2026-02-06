// components/payments/PaymentSteps.tsx
"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle,
  Circle,
  Clock,
  CreditCard,
  UserCheck,
  Home,
  Key,
  ChevronRight,
} from "lucide-react";

interface PaymentStepsProps {
  currentStep: number;
  steps?: StepConfig[];
  variant?: "horizontal" | "vertical";
  size?: "sm" | "md" | "lg";
  showLabels?: boolean;
  className?: string;
}

interface StepConfig {
  id: number;
  label: string;
  description?: string;
  icon?: React.ElementType;
  status: "completed" | "current" | "pending" | "error";
}

const DEFAULT_STEPS: StepConfig[] = [
  {
    id: 1,
    label: "Pay Booking Fee",
    description: "10% of monthly rent",
    icon: CreditCard,
    status: "pending",
  },
  {
    id: 2,
    label: "Owner Approval",
    description: "Wait for confirmation",
    icon: UserCheck,
    status: "pending",
  },
  {
    id: 3,
    label: "Complete Payment",
    description: "Deposit + First month rent",
    icon: Home,
    status: "pending",
  },
  {
    id: 4,
    label: "Move In Ready",
    description: "Room allocated",
    icon: Key,
    status: "pending",
  },
];

const STEP_STYLES = {
  completed: {
    circle: "bg-green-500 border-green-500 text-white",
    line: "bg-green-500",
    label: "text-green-700",
    description: "text-green-600",
  },
  current: {
    circle: "bg-HG-500 border-HG-500 text-white animate-pulse",
    line: "bg-gray-200",
    label: "text-HG-600 font-semibold",
    description: "text-HG-500",
  },
  pending: {
    circle: "bg-white border-gray-300 text-gray-400",
    line: "bg-gray-200",
    label: "text-gray-500",
    description: "text-gray-400",
  },
  error: {
    circle: "bg-red-500 border-red-500 text-white",
    line: "bg-red-200",
    label: "text-red-700",
    description: "text-red-600",
  },
};

const SIZE_STYLES = {
  sm: {
    circle: "w-6 h-6",
    icon: "w-3 h-3",
    label: "text-xs",
    description: "text-[10px]",
    gap: "gap-1",
    lineHeight: "h-0.5",
    lineWidth: "w-8",
  },
  md: {
    circle: "w-8 h-8",
    icon: "w-4 h-4",
    label: "text-sm",
    description: "text-xs",
    gap: "gap-2",
    lineHeight: "h-0.5",
    lineWidth: "w-12",
  },
  lg: {
    circle: "w-10 h-10",
    icon: "w-5 h-5",
    label: "text-base",
    description: "text-sm",
    gap: "gap-3",
    lineHeight: "h-1",
    lineWidth: "w-16",
  },
};

export default function PaymentSteps({
  currentStep,
  steps,
  variant = "horizontal",
  size = "md",
  showLabels = true,
  className = "",
}: PaymentStepsProps) {
  const stepsWithStatus = useMemo(() => {
    const baseSteps = steps || DEFAULT_STEPS;
    return baseSteps.map((step) => ({
      ...step,
      status:
        step.id < currentStep
          ? "completed"
          : step.id === currentStep
          ? "current"
          : "pending",
    })) as StepConfig[];
  }, [steps, currentStep]);

  const sizeStyles = SIZE_STYLES[size];

  if (variant === "vertical") {
    return (
      <div className={cn("space-y-4", className)}>
        {stepsWithStatus.map((step, index) => {
          const styles = STEP_STYLES[step.status];
          const Icon = step.icon || Circle;
          const isLast = index === stepsWithStatus.length - 1;

          return (
            <div key={step.id} className="flex gap-4">
              {/* Step indicator with line */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "rounded-full flex items-center justify-center border-2 transition-all",
                    sizeStyles.circle,
                    styles.circle
                  )}
                >
                  {step.status === "completed" ? (
                    <CheckCircle className={sizeStyles.icon} />
                  ) : step.status === "current" ? (
                    <Icon className={sizeStyles.icon} />
                  ) : (
                    <span className="text-xs font-medium">{step.id}</span>
                  )}
                </div>
                {!isLast && (
                  <div
                    className={cn(
                      "w-0.5 flex-1 min-h-[24px] mt-2",
                      step.status === "completed" ? styles.line : "bg-gray-200"
                    )}
                  />
                )}
              </div>

              {/* Content */}
              {showLabels && (
                <div className="pb-4">
                  <p className={cn("font-medium", sizeStyles.label, styles.label)}>
                    {step.label}
                  </p>
                  {step.description && (
                    <p className={cn(sizeStyles.description, styles.description)}>
                      {step.description}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Horizontal variant
  return (
    <div className={cn("flex items-center justify-between", className)}>
      {stepsWithStatus.map((step, index) => {
        const styles = STEP_STYLES[step.status];
        const Icon = step.icon || Circle;
        const isLast = index === stepsWithStatus.length - 1;

        return (
          <div key={step.id} className="flex items-center flex-1">
            <div className={cn("flex flex-col items-center", sizeStyles.gap)}>
              {/* Circle */}
              <div
                className={cn(
                  "rounded-full flex items-center justify-center border-2 transition-all",
                  sizeStyles.circle,
                  styles.circle
                )}
              >
                {step.status === "completed" ? (
                  <CheckCircle className={sizeStyles.icon} />
                ) : step.status === "current" ? (
                  <Icon className={sizeStyles.icon} />
                ) : (
                  <span className="font-medium">{step.id}</span>
                )}
              </div>

              {/* Labels */}
              {showLabels && (
                <div className="text-center mt-1">
                  <p className={cn("font-medium whitespace-nowrap", sizeStyles.label, styles.label)}>
                    {step.label}
                  </p>
                  {step.description && (
                    <p className={cn("whitespace-nowrap", sizeStyles.description, styles.description)}>
                      {step.description}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Connector line */}
            {!isLast && (
              <div
                className={cn(
                  "flex-1 mx-2",
                  sizeStyles.lineHeight,
                  step.status === "completed" ? styles.line : "bg-gray-200"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Compact step indicator for cards
export function CompactPaymentSteps({
  bookingFeePaid,
  approved,
  remainingPaid,
  isComplete,
}: {
  bookingFeePaid: boolean;
  approved: boolean;
  remainingPaid: boolean;
  isComplete: boolean;
}) {
  return (
    <div className="flex items-center gap-1 text-xs">
      <div
        className={cn(
          "w-5 h-5 rounded-full flex items-center justify-center",
          bookingFeePaid ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
        )}
      >
        {bookingFeePaid ? (
          <CheckCircle className="w-3 h-3" />
        ) : (
          <Clock className="w-3 h-3" />
        )}
      </div>
      <ChevronRight className="w-3 h-3 text-gray-300" />
      <div
        className={cn(
          "w-5 h-5 rounded-full flex items-center justify-center",
          approved ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
        )}
      >
        {approved ? (
          <CheckCircle className="w-3 h-3" />
        ) : (
          <Clock className="w-3 h-3" />
        )}
      </div>
      <ChevronRight className="w-3 h-3 text-gray-300" />
      <div
        className={cn(
          "w-5 h-5 rounded-full flex items-center justify-center",
          remainingPaid ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
        )}
      >
        {remainingPaid ? (
          <CheckCircle className="w-3 h-3" />
        ) : (
          <Clock className="w-3 h-3" />
        )}
      </div>
      <ChevronRight className="w-3 h-3 text-gray-300" />
      <div
        className={cn(
          "w-5 h-5 rounded-full flex items-center justify-center",
          isComplete ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
        )}
      >
        {isComplete ? (
          <CheckCircle className="w-3 h-3" />
        ) : (
          <Clock className="w-3 h-3" />
        )}
      </div>
    </div>
  );
}

// Mini progress bar for tables
export function PaymentProgress({
  progress,
  className,
}: {
  progress: number; // 0-100
  className?: string;
}) {
  return (
    <div className={cn("w-full bg-gray-200 rounded-full h-1.5", className)}>
      <div
        className={cn(
          "h-1.5 rounded-full transition-all duration-500",
          progress === 100 ? "bg-green-500" : "bg-HG-500"
        )}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}