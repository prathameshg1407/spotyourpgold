"use client"

import type React from "react"
import { motion } from "framer-motion"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Plus, X, ListCollapse } from "lucide-react"
import type { StepProps } from "../types"

export const Step4Rules: React.FC<StepProps> = ({ formData, setFormData, errors }) => {
  return (
    <form>
      <div className="space-y-6 text-left pb-10 font-inter">
        <ul className="space-y-2">
          {Array.isArray(formData.rulesAndRegulations) &&
            formData.rulesAndRegulations.map((item, idx) => (
              <li
                key={idx}
                className="flex items-center justify-between bg-HG-400/10 px-3 py-1 rounded-md text-sm -tracking-wide"
              >
                <span className="list-disc list-inside">{item}</span>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      rulesAndRegulations: prev.rulesAndRegulations.filter((_, i) => i !== idx),
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
            } text-[14px] font-inter font-normal block`}
          >
            Rules & Regulations
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
                  e.preventDefault()
                  const value = formData.newRuleInput?.trim()
                  if (value) {
                    setFormData((prev) => ({
                      ...prev,
                      rulesAndRegulations: [...(prev.rulesAndRegulations || []), value],
                      newRuleInput: "",
                    }))
                  }
                }
              }}
              placeholder="Type and Press Enter or Tap +"
              className={`h-11 pl-10 pr-10 bg-white rounded-md text-[15px] ${
                errors.rulesAndRegulations ? "border-red-400 border-2" : "border-gray-200"
              } border focus:border-HG-400 placeholder:font-inter focus:outline-none placeholder:opacity-80 focus-visible:ring-HG-400 focus-visible:ring-1`}
              aria-invalid={errors.rulesAndRegulations}
              aria-describedby={errors.rulesAndRegulations ? `rulesAndRegulations-error` : undefined}
            />

            <button
              type="button"
              onClick={() => {
                const value = formData.newRuleInput?.trim()
                if (value) {
                  setFormData((prev) => ({
                    ...prev,
                    rulesAndRegulations: [...(prev.rulesAndRegulations || []), value],
                    newRuleInput: "",
                  }))
                }
              }}
              className="absolute inset-y-0 right-3 flex items-center justify-center text-HG-500 hover:text-HG-600"
              title="Add Rule"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </motion.div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h4 className="font-semibold text-blue-800 mb-2 text-[15px]">Suggested Rules to Include:</h4>
          <ul className="text-sm text-blue-700 space-y-1 font-inter list-disc list-inside">
            <li>Visitor timings and policies</li>
            <li>Noise and music restrictions</li>
            <li>Smoking and drinking policies</li>
            <li>Rent payment terms and late fees</li>
            <li>Notice period for leaving</li>
            <li>Maintenance and cleanliness expectations</li>
            <li>Security deposit refund conditions</li>
          </ul>
        </div>
      </div>
    </form>
  )
}
