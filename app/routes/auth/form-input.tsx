"use client";

import type React from "react";

import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LucideIcon } from "lucide-react";

interface FormInputProps {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon?: LucideIcon;
  hasError: boolean;
  required?: boolean;
  rightElement?: React.ReactNode;
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
};

export const FormInput = ({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  icon: Icon,
  hasError,
  required = false,
  rightElement,
}: FormInputProps) => {
  return (
    <motion.div variants={itemVariants} className="w-full">
      <Label
        htmlFor={id}
        className={`${
          hasError ? "text-red-400" : "text-gray-700"
        } text-[14px] font-inter font-normal block`}
      >
        {label}
      </Label>
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}

        <Input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`h-11 pl-10 bg-white rounded-md text-[15px]
    ${hasError ? "border-red-400 border-2" : "border-gray-200"}
    ${rightElement ? "pr-10" : ""}
    border focus:border-HG-400 placeholder:font-inter focus:outline-none placeholder:opacity-80 outline-none focus-visible:ring-HG-400 focus-visible:ring-1`}
          placeholder={placeholder}
          required={required}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${id}-error` : undefined}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
    </motion.div>
  );
};
