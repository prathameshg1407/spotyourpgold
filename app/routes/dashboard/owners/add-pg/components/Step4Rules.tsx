"use client";

import type React from "react";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Plus,
  X,
  ListCollapse,
  Clock,
  Calendar,
  CreditCard,
  DoorOpen,
  Users,
  Cigarette,
  CheckCircle,
  XCircle,
  AlertCircle,
  Receipt,
} from "lucide-react";
import type { StepProps } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { predefinedRules } from "../constants";

export const Step4Rules: React.FC<StepProps> = ({
  formData,
  setFormData,
  errors,
}) => {
  const PolicyIcon = ({ policy }: { policy: string }) => {
    switch (policy) {
      case "allowed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "not-allowed":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "limited-access":
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  return (
    <form>
      <div className="space-y-6 text-left pb-10 font-inter">
        {/* Detailed Rules Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Lock In Period */}
          <Card className="border-2 border-gray-200 hover:border-HG-400 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-HG-600" />
                Lock In Period
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={formData.detailedRules?.lockInPeriod || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    detailedRules: {
                      ...prev.detailedRules,
                      lockInPeriod: e.target.value,
                    },
                  }))
                }
                placeholder="e.g., 11 months, No lock-in"
                className="h-10 text-sm"
              />
            </CardContent>
          </Card>

          {/* Notice Period */}
          <Card className="border-2 border-gray-200 hover:border-HG-400 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-HG-600" />
                Notice Period for Vacating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={formData.detailedRules?.noticePeriod || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    detailedRules: {
                      ...prev.detailedRules,
                      noticePeriod: e.target.value,
                    },
                  }))
                }
                placeholder="e.g., 1 month, 15 days"
                className="h-10 text-sm"
              />
            </CardContent>
          </Card>

          {/* Maintenance Charges */}
          <Card className="border-2 border-gray-200 hover:border-HG-400 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-HG-600" />
                Maintenance Charges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={formData.detailedRules?.maintenanceCharges || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    detailedRules: {
                      ...prev.detailedRules,
                      maintenanceCharges: e.target.value,
                    },
                  }))
                }
                placeholder="e.g., ₹500/month, Included in rent"
                className="h-10 text-sm"
              />
            </CardContent>
          </Card>

          {/* ✅ NEW: Registration Fees */}
          <Card className="border-2 border-gray-200 hover:border-HG-400 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-HG-600" />
                Registration Fees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={formData.detailedRules?.registrationFees || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    detailedRules: {
                      ...prev.detailedRules,
                      registrationFees: e.target.value,
                    },
                  }))
                }
                placeholder="e.g., ₹1000 (one-time), Free"
                className="h-10 text-sm"
              />
            </CardContent>
          </Card>

          {/* Entry Timing */}
          <Card className="border-2 border-gray-200 hover:border-HG-400 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <DoorOpen className="w-4 h-4 text-HG-600" />
                Entry Timing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={formData.detailedRules?.entryTiming || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    detailedRules: {
                      ...prev.detailedRules,
                      entryTiming: e.target.value,
                    },
                  }))
                }
                placeholder="e.g., 6:00 AM - 11:00 PM"
                className="h-10 text-sm"
              />
            </CardContent>
          </Card>

          {/* Exit Timing */}
          <Card className="border-2 border-gray-200 hover:border-HG-400 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <DoorOpen className="w-4 h-4 text-HG-600 rotate-180" />
                Exit Timing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={formData.detailedRules?.exitTiming || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    detailedRules: {
                      ...prev.detailedRules,
                      exitTiming: e.target.value,
                    },
                  }))
                }
                placeholder="e.g., 6:00 AM - 11:00 PM"
                className="h-10 text-sm"
              />
            </CardContent>
          </Card>

          {/* Guest Stay Policy */}
          <Card className="border-2 border-gray-200 hover:border-HG-400 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-HG-600" />
                Guest Stay Policy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={formData.detailedRules?.guestStayPolicy || ""}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    detailedRules: {
                      ...prev.detailedRules,
                      guestStayPolicy: value as
                        | "allowed"
                        | "not-allowed"
                        | "limited-access"
                        | "",
                    },
                  }))
                }
              >
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue placeholder="Select guest policy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="allowed">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Allowed
                    </div>
                  </SelectItem>
                  <SelectItem value="not-allowed">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      Not Allowed
                    </div>
                  </SelectItem>
                  <SelectItem value="limited-access">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      Allowed with Limited Access
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Smoking/Alcohol Policy */}
          <Card className="border-2 border-gray-200 hover:border-HG-400 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Cigarette className="w-4 h-4 text-HG-600" />
                Smoking/Alcohol Policy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={formData.detailedRules?.smokingAlcoholPolicy || ""}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    detailedRules: {
                      ...prev.detailedRules,
                      smokingAlcoholPolicy: value as
                        | "allowed"
                        | "not-allowed"
                        | "limited-access"
                        | "",
                    },
                  }))
                }
              >
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue placeholder="Select smoking/alcohol policy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="allowed">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Allowed
                    </div>
                  </SelectItem>
                  <SelectItem value="not-allowed">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      Not Allowed
                    </div>
                  </SelectItem>
                  <SelectItem value="limited-access">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      Allowed with Limited Access
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* General Rules Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            General Rules & Regulations
          </h3>

          {/* ✅ NEW: Predefined Rules Dropdown */}
          <div className="mb-4">
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Quick Add Common Rules
            </Label>
            <Select
              value=""
              onValueChange={(value) => {
                if (
                  value &&
                  !formData.rulesAndRegulations.includes(value)
                ) {
                  setFormData((prev) => ({
                    ...prev,
                    rulesAndRegulations: [
                      ...(prev.rulesAndRegulations || []),
                      value,
                    ],
                  }));
                }
              }}
            >
              <SelectTrigger className="h-10 text-sm">
                <SelectValue placeholder="Select a common rule to add" />
              </SelectTrigger>
              <SelectContent>
                {predefinedRules
                  .filter(
                    (rule) => !formData.rulesAndRegulations.includes(rule)
                  )
                  .map((rule, idx) => (
                    <SelectItem key={idx} value={rule}>
                      {rule}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <ul className="space-y-2 mb-4">
            {Array.isArray(formData.rulesAndRegulations) &&
              formData.rulesAndRegulations.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between bg-HG-400/10 px-3 py-2 rounded-md text-sm"
                >
                  <span className="list-disc list-inside">{item}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        rulesAndRegulations: prev.rulesAndRegulations.filter(
                          (_, i) => i !== idx
                        ),
                      }))
                    }
                    className="text-gray-400 hover:text-red-500 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </li>
              ))}
          </ul>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: {
                opacity: 1,
                y: 0,
                transition: {
                  type: "spring" as const,
                  stiffness: 300,
                  damping: 24,
                },
              },
            }}
            className="w-full"
          >
            <Label
              htmlFor="rulesAndRegulations"
              className={`${
                errors.rulesAndRegulations ? "text-red-400" : "text-gray-700"
              } text-[14px] font-inter font-normal block mb-2`}
            >
              Add Custom Rules
            </Label>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <ListCollapse className="h-5 w-5 text-gray-400" />
              </div>

              <Input
                id="rulesAndRegulations"
                type="text"
                value={formData.newRuleInput || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    newRuleInput: e.target.value,
                  }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const value = formData.newRuleInput?.trim();
                    if (value) {
                      setFormData((prev) => ({
                        ...prev,
                        rulesAndRegulations: [
                          ...(prev.rulesAndRegulations || []),
                          value,
                        ],
                        newRuleInput: "",
                      }));
                    }
                  }
                }}
                placeholder="Type your own rule and Press Enter or Tap +"
                className={`h-11 pl-10 pr-10 bg-white rounded-md text-[15px] ${
                  errors.rulesAndRegulations
                    ? "border-red-400 border-2"
                    : "border-gray-200"
                } border focus:border-HG-400 placeholder:font-inter focus:outline-none placeholder:opacity-80 focus-visible:ring-HG-400 focus-visible:ring-1`}
                aria-invalid={errors.rulesAndRegulations}
                aria-describedby={
                  errors.rulesAndRegulations
                    ? `rulesAndRegulations-error`
                    : undefined
                }
              />

              <button
                type="button"
                onClick={() => {
                  const value = formData.newRuleInput?.trim();
                  if (value) {
                    setFormData((prev) => ({
                      ...prev,
                      rulesAndRegulations: [
                        ...(prev.rulesAndRegulations || []),
                        value,
                      ],
                      newRuleInput: "",
                    }));
                  }
                }}
                className="absolute inset-y-0 right-3 flex items-center justify-center text-HG-500 hover:text-HG-600"
                title="Add Rule"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </form>
  );
};