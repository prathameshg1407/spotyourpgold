"use client";

import type React from "react";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plus, X, ListCollapse } from "lucide-react";
import type { StepProps } from "../types";
import { predefinedAmenities } from "../constants";

export const Step3Amenities: React.FC<StepProps> = ({
  formData,
  setFormData,
  errors,
}) => {
  return (
    <form>
      <div className="space-y-6 text-left pb-10">
        <div className="space-y-1">
          <Label className="text-gray-700 text-[14px] font-inter">
            Available Amenities
          </Label>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {predefinedAmenities.map((amenity) => {
              const isSelected = formData.amenities.includes(amenity.id);
              return (
                <div
                  key={amenity.id}
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      amenities: isSelected
                        ? prev.amenities.filter((a) => a !== amenity.id)
                        : [...prev.amenities, amenity.id],
                    }))
                  }
                  className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer text-sm border-2 font-inter transition-all duration-300 min-h-[60px] ${
                    isSelected
                      ? "bg-HG-50 border-HG-400 text-HG-600 shadow-md"
                      : "bg-white border-gray-200 hover:border-HG-300 hover:shadow-sm"
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg flex-shrink-0 ${
                      isSelected ? "bg-HG-100" : "bg-gray-100"
                    }`}
                  >
                    <amenity.icon className="w-5 h-5" />
                  </div>
                  <span className="flex-grow text-left font-medium">
                    {amenity.label}
                  </span>
                </div>
              );
            })}

            {formData.amenities
              .filter(
                (amenityId) =>
                  !predefinedAmenities.some((a) => a.id === amenityId)
              )
              .map((amenityId) => (
                <div
                  key={amenityId}
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      amenities: prev.amenities.filter((a) => a !== amenityId),
                    }))
                  }
                  className="flex items-center gap-3 p-4 rounded-lg cursor-pointer text-sm border-2 font-inter transition-all duration-300 min-h-[60px] bg-HG-50 border-HG-400 text-HG-600 shadow-md"
                >
                  <div className="p-2 bg-HG-100 rounded-lg flex-shrink-0">
                    <span className="w-5 h-5 inline-block bg-HG-500/70 rounded-full" />
                  </div>
                  <span className="flex-grow text-left font-medium capitalize">
                    {amenityId}
                  </span>
                </div>
              ))}
          </div>
        </div>

        <div className="relative">
          <Input
            id="customAmenities"
            value={formData.customAmenities}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                customAmenities: e.target.value,
              }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const value = formData.customAmenities.trim();
                const alreadyExists = formData.amenities.includes(value);
                if (value && !alreadyExists) {
                  setFormData((prev) => ({
                    ...prev,
                    amenities: [...prev.amenities, value],
                    customAmenities: "",
                  }));
                }
              }
            }}
            placeholder="Type and press Enter or Tap +"
            className="h-11 bg-white rounded-md border-gray-200 focus:border-HG-400 focus:ring-HG-400 pl-4 pr-10"
          />

          <button
            type="button"
            onClick={() => {
              const value = formData.customAmenities.trim();
              const alreadyExists = formData.amenities.includes(value);
              if (value && !alreadyExists) {
                setFormData((prev) => ({
                  ...prev,
                  amenities: [...prev.amenities, value],
                  customAmenities: "",
                }));
              }
            }}
            className="absolute inset-y-0 right-3 flex items-center justify-center text-HG-500 hover:text-HG-600"
            title="Add Custom Amenity"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        <ul className="space-y-2">
          {Array.isArray(formData.additionalDetails) &&
            formData.additionalDetails.map((item, idx) => (
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
                      additionalDetails: prev.additionalDetails.filter(
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
              transition: { type: "spring", stiffness: 300, damping: 24 },
            },
          }}
          className="w-full"
        >
          <Label
            htmlFor="additionalDetails"
            className={`${
              errors.additionalDetails ? "text-red-400" : "text-gray-700"
            } text-[14px] font-inter font-normal block`}
          >
            Additional Details
          </Label>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <ListCollapse className="h-5 w-5 text-gray-400" />
            </div>

            <Input
              id="additionalDetails"
              type="text"
              value={formData.additionalDetailsInput || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  additionalDetailsInput: e.target.value,
                }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const value = formData.additionalDetailsInput?.trim();
                  if (value) {
                    setFormData((prev) => ({
                      ...prev,
                      additionalDetails: [
                        ...(prev.additionalDetails || []),
                        value,
                      ],
                      additionalDetailsInput: "",
                    }));
                  }
                }
              }}
              placeholder="Type and Press Enter or Tap +"
              className={`h-11 pl-10 pr-10 bg-white rounded-md text-[15px] ${
                errors.additionalDetails
                  ? "border-red-400 border-2"
                  : "border-gray-200"
              } border focus:border-HG-400 placeholder:font-inter focus:outline-none placeholder:opacity-80 focus-visible:ring-HG-400 focus-visible:ring-1`}
            />

            <button
              type="button"
              onClick={() => {
                const value = formData.additionalDetailsInput?.trim();
                if (value) {
                  setFormData((prev) => ({
                    ...prev,
                    additionalDetails: [
                      ...(prev.additionalDetails || []),
                      value,
                    ],
                    additionalDetailsInput: "",
                  }));
                }
              }}
              className="absolute inset-y-0 right-3 flex items-center justify-center text-HG-500 hover:text-HG-600"
              title="Add"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </motion.div>

        <div className="space-y-2">
          <Label className="text-gray-700 text-[14px] font-inter">
            Included in Rent
          </Label>
          <div className="flex items-center gap-8">
            {[
              { key: "foodIncluded", label: "Food/Meals" },
              { key: "electricityIncluded", label: "Electricity" },
              { key: "maintenanceIncluded", label: "Maintenance" },
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-center gap-2 text-sm cursor-pointer font-inter"
              >
                <input
                  type="checkbox"
                  checked={!!formData[item.key as keyof typeof formData]}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      [item.key]: e.target.checked,
                    }))
                  }
                  className="accent-HG-400/40 w-4 h-4 rounded-sm border-gray-300"
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>

          {/* Meal Timings - Only show when Food/Meals is selected */}
          {formData.foodIncluded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <Label className="text-gray-700 text-[14px] font-inter mb-3 block">
                Meal Timings (Optional)
              </Label>
              <div className="space-y-3 sm:space-y-4">
                {[
                  { key: "morning", label: "Morning" },
                  { key: "noon", label: "Noon" },
                  { key: "evening", label: "Evening" },
                  { key: "night", label: "Night" },
                ].map((meal) => (
                  <div
                    key={meal.key}
                    className="p-3 sm:p-4 border border-gray-200 rounded-lg bg-white"
                  >
                    <label className="flex items-center gap-3 text-sm cursor-pointer font-inter mb-3">
                      <input
                        type="checkbox"
                        checked={
                          formData.mealTimings[
                            meal.key as keyof typeof formData.mealTimings
                          ].enabled
                        }
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            mealTimings: {
                              ...prev.mealTimings,
                              [meal.key]: {
                                ...prev.mealTimings[
                                  meal.key as keyof typeof prev.mealTimings
                                ],
                                enabled: e.target.checked,
                              },
                            },
                          }))
                        }
                        className="accent-HG-400/40 w-4 h-4 rounded-sm border-gray-300 flex-shrink-0"
                      />
                      <div className="font-medium text-gray-800">
                        {meal.label}
                      </div>
                    </label>

                    {formData.mealTimings[
                      meal.key as keyof typeof formData.mealTimings
                    ].enabled && (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 ml-0 sm:ml-7">
                        <div className="flex items-center gap-2 flex-1">
                          <label className="text-xs text-gray-600 whitespace-nowrap">
                            From:
                          </label>
                          <input
                            type="time"
                            value={
                              formData.mealTimings[
                                meal.key as keyof typeof formData.mealTimings
                              ].from
                            }
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                mealTimings: {
                                  ...prev.mealTimings,
                                  [meal.key]: {
                                    ...prev.mealTimings[
                                      meal.key as keyof typeof prev.mealTimings
                                    ],
                                    from: e.target.value,
                                  },
                                },
                              }))
                            }
                            className="px-2 py-1 text-xs border border-gray-300 rounded focus:border-HG-400 focus:outline-none w-full sm:w-auto"
                          />
                        </div>
                        <div className="flex items-center gap-2 flex-1">
                          <label className="text-xs text-gray-600 whitespace-nowrap">
                            To:
                          </label>
                          <input
                            type="time"
                            value={
                              formData.mealTimings[
                                meal.key as keyof typeof formData.mealTimings
                              ].to
                            }
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                mealTimings: {
                                  ...prev.mealTimings,
                                  [meal.key]: {
                                    ...prev.mealTimings[
                                      meal.key as keyof typeof prev.mealTimings
                                    ],
                                    to: e.target.value,
                                  },
                                },
                              }))
                            }
                            className="px-2 py-1 text-xs border border-gray-300 rounded focus:border-HG-400 focus:outline-none w-full sm:w-auto"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </form>
  );
};
