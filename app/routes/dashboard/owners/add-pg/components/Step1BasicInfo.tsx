"use client";

import type React from "react";
import { Label } from "@/components/ui/label";
import { FormInput } from "@/app/routes/auth/form-input";
import {
  Building,
  IndianRupee,
  Shield,
  BedDouble,
  Users,
  Home,
} from "lucide-react";
import type { StepProps } from "../types";
import { propertyTypes } from "../constants";

export const Step1BasicInfo: React.FC<StepProps> = ({
  formData,
  setFormData,
  errors,
}) => {
  return (
    <form>
      <div className="space-y-4 text-left pb-10">
        <FormInput
          id="pgName"
          label="Name"
          type="text"
          value={formData?.pgName}
          onChange={(value) =>
            setFormData((prev) => ({
              ...prev,
              pgName: value,
            }))
          }
          placeholder="Enter your PG name"
          hasError={errors?.pgName}
          icon={Building}
        />

        <FormInput
          id="primaryLine"
          label="Primary Line (Optional)"
          type="text"
          value={formData?.primaryLine}
          onChange={(value) =>
            setFormData((prev) => ({
              ...prev,
              primaryLine: value.slice(0, 35), // Limit to 35 characters
            }))
          }
          placeholder="Enter primary line (max 35 characters)"
          hasError={errors?.primaryLine}
          icon={Building}
          maxLength={35}
        />

        {/* Property Type Selection */}
        <div className="space-y-4">
          <div className="space-y-1 font-inter">
            <Label className="text-gray-700 text-[14px] font-inter">
              Property Type
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {propertyTypes.map((type) => (
                <div
                  key={type.id}
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      type: type.id as
                        | "hostels"
                        | "flats"
                        | "pgs"
                        | "rooms"
                        | "commercial",
                      subType: "", // Reset subtype when type changes
                    }))
                  }
                  className={`flex items-center justify-center p-3 rounded-md cursor-pointer text-sm border font-inter transition-all ${
                    formData?.type === type.id
                      ? "bg-HG-400/10 border-HG-400 text-HG-500"
                      : "bg-white border-gray-200 hover:border-HG-300"
                  }`}
                >
                  <Home className="w-4 h-4 mr-2" />
                  <span>{type.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sub-type Selection */}
          {formData?.type &&
            propertyTypes.find((t) => t.id === formData.type)?.subTypes &&
            propertyTypes.find((t) => t.id === formData.type)!.subTypes.length >
              0 && (
              <div className="space-y-1 font-inter">
                <Label className="text-gray-700 text-[14px] font-inter">
                  Sub Category
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {propertyTypes
                    .find((t) => t.id === formData.type)!
                    .subTypes.map((subType) => (
                      <div
                        key={subType.id}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            subType: subType.id,
                          }))
                        }
                        className={`flex items-center justify-center p-3 rounded-md cursor-pointer text-sm border font-inter transition-all ${
                          formData?.subType === subType.id
                            ? "bg-HG-400/10 border-HG-400 text-HG-500"
                            : "bg-white border-gray-200 hover:border-HG-300"
                        }`}
                      >
                        <span>{subType.label}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
        </div>

        {formData?.roomTypes?.map((room, index) => (
          <div key={index} className="border p-4 rounded-lg space-y-4">
            <div className="flex justify-between items-center">
              <Label className="font-semibold text-sm text-gray-700">
                Room Type {index + 1}
              </Label>
              {formData.roomTypes.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      roomTypes: prev.roomTypes.filter((_, i) => i !== index),
                    }))
                  }
                  className="text-sm text-red-500 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>

            <FormInput
              id={`roomType-${index}`}
              label="Room Type"
              type="text"
              value={room.type}
              onChange={(value) =>
                setFormData((prev) => {
                  const updated = [...prev.roomTypes];
                  updated[index].type = value;
                  return { ...prev, roomTypes: updated };
                })
              }
              placeholder="e.g. Single, Double"
              hasError={errors[`roomTypes.${index}.type`]}
              icon={BedDouble}
            />

            <div className="flex gap-4 flex-col md:flex-row">
              <FormInput
                id={`numberOfRooms-${index}`}
                label="Number of Rooms"
                type="number"
                value={
                  room.numberOfRooms === 0 ? "" : room.numberOfRooms.toString()
                }
                onChange={(value) =>
                  setFormData((prev) => {
                    const updated = [...prev.roomTypes];
                    updated[index].numberOfRooms = parseInt(value) || 0;
                    return { ...prev, roomTypes: updated };
                  })
                }
                placeholder="e.g. 3"
                hasError={errors[`roomTypes.${index}.numberOfRooms`]}
                icon={Building}
              />
              <FormInput
                id={`capacity-${index}`}
                label="Capacity per Room"
                type="number"
                value={
                  room.capacityPerRoom === 0
                    ? ""
                    : room.capacityPerRoom.toString()
                }
                onChange={(value) =>
                  setFormData((prev) => {
                    const updated = [...prev.roomTypes];
                    updated[index].capacityPerRoom = parseInt(value) || 0;
                    return { ...prev, roomTypes: updated };
                  })
                }
                placeholder="e.g. 2"
                hasError={errors[`roomTypes.${index}.capacityPerRoom`]}
                icon={Users}
              />
            </div>

            <div className="flex gap-4 flex-col md:flex-row">
              <FormInput
                id={`rent-${index}`}
                label="Monthly Rent (₹)"
                type="number"
                value={
                  room.monthlyRent === 0 ? "" : room.monthlyRent.toString()
                }
                onChange={(value) =>
                  setFormData((prev) => {
                    const updated = [...prev.roomTypes];
                    updated[index].monthlyRent = parseInt(value) || 0;
                    return { ...prev, roomTypes: updated };
                  })
                }
                placeholder="e.g. 5000"
                hasError={errors[`roomTypes.${index}.monthlyRent`]}
                icon={IndianRupee}
              />
              <FormInput
                id={`deposit-${index}`}
                label="Security Deposit (₹)"
                type="number"
                value={
                  room.securityDeposit === 0
                    ? ""
                    : room.securityDeposit.toString()
                }
                onChange={(value) =>
                  setFormData((prev) => {
                    const updated = [...prev.roomTypes];
                    updated[index].securityDeposit = parseInt(value) || 0;
                    return { ...prev, roomTypes: updated };
                  })
                }
                placeholder="e.g. 10000"
                hasError={errors[`roomTypes.${index}.securityDeposit`]}
                icon={Shield}
              />
            </div>
          </div>
        ))}

        {/* Add Room Type Button */}
        <div className="pt-4 flex justify-between items-center">
          <button
            type="button"
            onClick={() =>
              setFormData((prev) => ({
                ...prev,
                roomTypes: [
                  ...prev?.roomTypes,
                  {
                    type: "",
                    numberOfRooms: 0,
                    availableRooms: 0,
                    capacityPerRoom: 0,
                    monthlyRent: 0,
                    securityDeposit: 0,
                  },
                ],
              }))
            }
            className="text-lg text-HG-500 hover:underline"
          >
            + Add Room Type
          </button>

          {/* Gender Preference - Only show for non-commercial properties */}
          {formData?.type !== "commercial" && (
            <div className="space-y-1 font-inter">
              <Label className="text-gray-700 text-[14px] font-inter">
                Gender Preference
              </Label>
              <div className="flex gap-4">
                {["male", "female", "both"].map((gender) => (
                  <label
                    key={gender}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="genderPreference"
                      value={gender}
                      checked={formData?.genderPreference === gender}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          genderPreference: e.target.value as
                            | "male"
                            | "female"
                            | "both",
                        }))
                      }
                    />
                    <span className="capitalize">{gender}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  );
};
