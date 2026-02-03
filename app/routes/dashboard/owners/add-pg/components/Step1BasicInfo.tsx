"use client";

import type React from "react";
import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { FormInput } from "@/app/routes/auth/form-input";
import {
  Building,
  IndianRupee,
  Shield,
  BedDouble,
  Users,
  Home,
  AirVent,
  Fan,
  Zap,
} from "lucide-react";
import type { StepProps } from "../types";
import { propertyTypes, roomTypesByCategory } from "../constants";
import { getDefaultRoomType } from "../utils/formDataHelpers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Step1BasicInfo: React.FC<StepProps> = ({
  formData,
  setFormData,
  errors,
}) => {
  // Ensure roomTypes is properly initialized with valid values
  useEffect(() => {
    if (!formData.roomTypes || formData.roomTypes.length === 0) {
      // No room types - add a default one
      setFormData((prev) => ({
        ...prev,
        roomTypes: [getDefaultRoomType()],
      }));
    } else {
      // Check if any room has invalid capacity or numberOfRooms
      const needsFix = formData.roomTypes.some((room) => {
        const hasInvalidNumberOfRooms = !room.numberOfRooms || Number(room.numberOfRooms) <= 0;
        const hasInvalidCapacity = 
          (formData.type === "pgs" || formData.type === "hostels") &&
          (!room.capacityPerRoom || Number(room.capacityPerRoom) <= 0);
        return hasInvalidNumberOfRooms || hasInvalidCapacity;
      });

      if (needsFix) {
        setFormData((prev) => ({
          ...prev,
          roomTypes: prev.roomTypes.map((room) => ({
            ...room,
            numberOfRooms: room.numberOfRooms && Number(room.numberOfRooms) > 0 
              ? Number(room.numberOfRooms) 
              : 1,
            capacityPerRoom: room.capacityPerRoom && Number(room.capacityPerRoom) > 0 
              ? Number(room.capacityPerRoom) 
              : 1,
          })),
        }));
      }
    }
  }, []); // Run only on mount

  // Helper function to create a new room with valid defaults
  const createNewRoom = () => ({
    type: "",
    isAC: false,
    numberOfRooms: 1, // Default to 1, not 0
    availableRooms: 0,
    capacityPerRoom: 1, // Default to 1, not 0
    monthlyRent: 0,
    securityDeposit: 0,
  });

  // Handle adding a new room type
  const handleAddRoom = () => {
    setFormData((prev) => ({
      ...prev,
      roomTypes: [...prev.roomTypes, createNewRoom()],
    }));
  };

  // Handle removing a room type
  const handleRemoveRoom = (index: number) => {
    if (formData.roomTypes.length <= 1) return; // Keep at least one room
    setFormData((prev) => ({
      ...prev,
      roomTypes: prev.roomTypes.filter((_, i) => i !== index),
    }));
  };

  // Handle numberOfRooms change with validation
  const handleNumberOfRoomsChange = (index: number, value: string) => {
    const numValue = parseInt(value) || 0;
    setFormData((prev) => {
      const updated = [...prev.roomTypes];
      updated[index] = { ...updated[index], numberOfRooms: numValue };
      return { ...prev, roomTypes: updated };
    });
  };

  // Ensure numberOfRooms is at least 1 on blur
  const handleNumberOfRoomsBlur = (index: number) => {
    setFormData((prev) => {
      const updated = [...prev.roomTypes];
      if (!updated[index].numberOfRooms || updated[index].numberOfRooms <= 0) {
        updated[index] = { ...updated[index], numberOfRooms: 1 };
      }
      return { ...prev, roomTypes: updated };
    });
  };

  // Handle capacityPerRoom change with validation
  const handleCapacityChange = (index: number, value: string) => {
    const numValue = parseInt(value) || 0;
    setFormData((prev) => {
      const updated = [...prev.roomTypes];
      updated[index] = { ...updated[index], capacityPerRoom: numValue };
      return { ...prev, roomTypes: updated };
    });
  };

  // Ensure capacityPerRoom is at least 1 on blur
  const handleCapacityBlur = (index: number) => {
    setFormData((prev) => {
      const updated = [...prev.roomTypes];
      if (!updated[index].capacityPerRoom || updated[index].capacityPerRoom <= 0) {
        updated[index] = { ...updated[index], capacityPerRoom: 1 };
      }
      return { ...prev, roomTypes: updated };
    });
  };

  // Handle property type change - reset roomTypes with valid defaults
  const handlePropertyTypeChange = (typeId: string) => {
    setFormData((prev) => ({
      ...prev,
      type: typeId as "hostels" | "flats" | "pgs" | "rooms" | "commercial",
      subType: "",
      roomTypes: [createNewRoom()], // Always start with valid room
    }));
  };

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
          placeholder="Enter your property name"
          hasError={errors?.pgName}
          icon={Building}
        />

        <FormInput
          id="primaryLine"
          label="Primary Line (Tagline)"
          type="text"
          value={formData?.primaryLine}
          onChange={(value) =>
            setFormData((prev) => ({
              ...prev,
              primaryLine: value.slice(0, 35),
            }))
          }
          placeholder="e.g., Best PG in town, Near Metro (max 35 chars)"
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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {propertyTypes.map((type) => (
                <div
                  key={type.id}
                  onClick={() => handlePropertyTypeChange(type.id)}
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
        </div>

        {/* Room Types Section - For Non-Commercial */}
        {formData?.type && formData.type !== "commercial" && (
          <div className="space-y-4">
            {formData?.roomTypes?.map((room, index) => (
              <div key={index} className="border p-4 rounded-lg space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="font-semibold text-sm text-gray-700">
                    Room Configuration {index + 1}
                  </Label>
                  {formData.roomTypes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRoom(index)}
                      className="text-sm text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {/* AC/Non-AC Toggle */}
                <div className="space-y-2">
                  <Label className="text-gray-700 text-[14px]">
                    Air Conditioning
                  </Label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => {
                          const updated = [...prev.roomTypes];
                          updated[index] = { ...updated[index], isAC: false, type: "" };
                          return { ...prev, roomTypes: updated };
                        })
                      }
                      className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-md border transition-all ${
                        !room.isAC
                          ? "bg-blue-50 border-blue-400 text-blue-700"
                          : "bg-white border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Fan className="w-4 h-4" />
                      <span>Non-AC</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => {
                          const updated = [...prev.roomTypes];
                          updated[index] = { ...updated[index], isAC: true, type: "" };
                          return { ...prev, roomTypes: updated };
                        })
                      }
                      className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-md border transition-all ${
                        room.isAC
                          ? "bg-green-50 border-green-400 text-green-700"
                          : "bg-white border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <AirVent className="w-4 h-4" />
                      <span>AC</span>
                    </button>
                  </div>
                </div>

                {/* Room Type Dropdown */}
                <div className="space-y-2">
                  <Label className="text-gray-700 text-[14px]">
                    Room Type
                  </Label>
                  <Select
                    value={room.type}
                    onValueChange={(value) =>
                      setFormData((prev) => {
                        const updated = [...prev.roomTypes];
                        updated[index] = { ...updated[index], type: value };
                        return { ...prev, roomTypes: updated };
                      })
                    }
                  >
                    <SelectTrigger
                      className={`w-full ${
                        errors[`roomTypes.${index}.type`]
                          ? "border-red-400"
                          : ""
                      }`}
                    >
                      <SelectValue placeholder="Select room type" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.type &&
                        roomTypesByCategory[
                          formData.type as keyof typeof roomTypesByCategory
                        ] &&
                        (roomTypesByCategory[
                          formData.type as keyof typeof roomTypesByCategory
                        ] as any)[room.isAC ? "AC" : "nonAC"]?.map(
                          (roomType: { id: string; label: string }) => (
                            <SelectItem key={roomType.id} value={roomType.id}>
                              {roomType.label}
                            </SelectItem>
                          )
                        )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-4 flex-col md:flex-row">
                  <FormInput
                    id={`numberOfRooms-${index}`}
                    label="Number of Rooms"
                    type="number"
                    value={
                      room.numberOfRooms === 0
                        ? ""
                        : room.numberOfRooms.toString()
                    }
                    onChange={(value) => handleNumberOfRoomsChange(index, value)}
                    onBlur={() => handleNumberOfRoomsBlur(index)}
                    placeholder="e.g. 3"
                    hasError={errors[`roomTypes.${index}.numberOfRooms`]}
                    icon={Building}
                    min={1}
                  />

                  {/* Only show capacity for PGs/Hostels */}
                  {(formData.type === "pgs" || formData.type === "hostels") && (
                    <FormInput
                      id={`capacity-${index}`}
                      label="Capacity per Room"
                      type="number"
                      value={
                        room.capacityPerRoom === 0
                          ? ""
                          : room.capacityPerRoom.toString()
                      }
                      onChange={(value) => handleCapacityChange(index, value)}
                      onBlur={() => handleCapacityBlur(index)}
                      placeholder="e.g. 2"
                      hasError={errors[`roomTypes.${index}.capacityPerRoom`] || errors.capacityPerRoom}
                      icon={Users}
                      min={1}
                    />
                  )}
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
                        updated[index] = { 
                          ...updated[index], 
                          monthlyRent: parseInt(value) || 0 
                        };
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
                        updated[index] = { 
                          ...updated[index], 
                          securityDeposit: parseInt(value) || 0 
                        };
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
            <button
              type="button"
              onClick={handleAddRoom}
              className="text-lg text-HG-500 hover:underline"
            >
              + Add Another Room Type
            </button>
          </div>
        )}

        {/* Commercial Property - Simplified */}
        {formData?.type === "commercial" && (
          <div className="space-y-4">
            {formData?.roomTypes?.map((room, index) => (
              <div key={index} className="border p-4 rounded-lg space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-700 text-[14px]">
                    Property Type
                  </Label>
                  <Select
                    value={room.type}
                    onValueChange={(value) =>
                      setFormData((prev) => {
                        const updated = [...prev.roomTypes];
                        updated[index] = { ...updated[index], type: value };
                        return { ...prev, roomTypes: updated };
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select property type" />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        roomTypesByCategory.commercial as {
                          all: { id: string; label: string }[];
                        }
                      ).all.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                        updated[index] = { 
                          ...updated[index], 
                          monthlyRent: parseInt(value) || 0 
                        };
                        return { ...prev, roomTypes: updated };
                      })
                    }
                    placeholder="e.g. 25000"
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
                        updated[index] = { 
                          ...updated[index], 
                          securityDeposit: parseInt(value) || 0 
                        };
                        return { ...prev, roomTypes: updated };
                      })
                    }
                    placeholder="e.g. 50000"
                    hasError={errors[`roomTypes.${index}.securityDeposit`]}
                    icon={Shield}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Flats/Villas Additional Fields */}
        {formData?.type === "flats" && (
          <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
            <Label className="font-semibold text-base text-gray-700">
              Property Details
            </Label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                id="carpetArea"
                label="Carpet Area (sq ft)"
                type="number"
                value={
                  formData.flatsDetails?.carpetArea === 0
                    ? ""
                    : formData.flatsDetails?.carpetArea?.toString() || ""
                }
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    flatsDetails: {
                      ...prev.flatsDetails!,
                      carpetArea: parseInt(value) || 0,
                    },
                  }))
                }
                placeholder="e.g. 1200"
                hasError={false}
                icon={Building}
              />

              <div className="space-y-2">
                <Label className="text-gray-700 text-[14px]">
                  Furnishing Level
                </Label>
                <Select
                  value={formData.flatsDetails?.furnishingLevel || ""}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      flatsDetails: {
                        ...prev.flatsDetails!,
                        furnishingLevel: value as
                          | "fully-furnished"
                          | "semi-furnished"
                          | "unfurnished",
                      },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select furnishing level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fully-furnished">
                      Fully Furnished
                    </SelectItem>
                    <SelectItem value="semi-furnished">
                      Semi Furnished
                    </SelectItem>
                    <SelectItem value="unfurnished">Unfurnished</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <FormInput
                id="bedrooms"
                label="Bedrooms"
                type="number"
                value={
                  formData.flatsDetails?.bedrooms === 0
                    ? ""
                    : formData.flatsDetails?.bedrooms?.toString() || ""
                }
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    flatsDetails: {
                      ...prev.flatsDetails!,
                      bedrooms: parseInt(value) || 0,
                    },
                  }))
                }
                placeholder="e.g. 3"
                hasError={false}
                icon={BedDouble}
              />

              <FormInput
                id="bathrooms"
                label="Bathrooms"
                type="number"
                value={
                  formData.flatsDetails?.bathrooms === 0
                    ? ""
                    : formData.flatsDetails?.bathrooms?.toString() || ""
                }
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    flatsDetails: {
                      ...prev.flatsDetails!,
                      bathrooms: parseInt(value) || 0,
                    },
                  }))
                }
                placeholder="e.g. 2"
                hasError={false}
                icon={Home}
              />

              <FormInput
                id="balconyCount"
                label="Balcony Count"
                type="number"
                value={
                  formData.flatsDetails?.balconyCount === 0
                    ? ""
                    : formData.flatsDetails?.balconyCount?.toString() || ""
                }
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    flatsDetails: {
                      ...prev.flatsDetails!,
                      balconyCount: parseInt(value) || 0,
                    },
                  }))
                }
                placeholder="e.g. 2"
                hasError={false}
                icon={Home}
              />
            </div>

            <div className="space-y-3">
              <Label className="text-gray-700 text-[14px]">Parking</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.flatsDetails?.parkingBike || false}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        flatsDetails: {
                          ...prev.flatsDetails!,
                          parkingBike: e.target.checked,
                        },
                      }))
                    }
                  />
                  <span>Bike Parking</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.flatsDetails?.parkingCar || false}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        flatsDetails: {
                          ...prev.flatsDetails!,
                          parkingCar: e.target.checked,
                        },
                      }))
                    }
                  />
                  <span>Car Parking</span>
                </label>
              </div>
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.flatsDetails?.hasTerrace || false}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      flatsDetails: {
                        ...prev.flatsDetails!,
                        hasTerrace: e.target.checked,
                      },
                    }))
                  }
                />
                <span>Terrace</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.flatsDetails?.isPenthouse || false}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      flatsDetails: {
                        ...prev.flatsDetails!,
                        isPenthouse: e.target.checked,
                      },
                    }))
                  }
                />
                <span>Penthouse</span>
              </label>
            </div>
          </div>
        )}

        {/* Commercial Property Additional Fields */}
        {formData?.type === "commercial" && (
          <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
            <Label className="font-semibold text-base text-gray-700">
              Commercial Property Details
            </Label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                id="carpetArea"
                label="Carpet Area (sq ft)"
                type="number"
                value={
                  formData.commercialDetails?.carpetArea === 0
                    ? ""
                    : formData.commercialDetails?.carpetArea?.toString() || ""
                }
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    commercialDetails: {
                      ...prev.commercialDetails!,
                      carpetArea: parseInt(value) || 0,
                    },
                  }))
                }
                placeholder="e.g. 2000"
                hasError={false}
                icon={Building}
              />

              <FormInput
                id="floorNumber"
                label="Floor Number"
                type="number"
                value={
                  formData.commercialDetails?.floorNumber === 0
                    ? ""
                    : formData.commercialDetails?.floorNumber?.toString() || ""
                }
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    commercialDetails: {
                      ...prev.commercialDetails!,
                      floorNumber: parseInt(value) || 0,
                    },
                  }))
                }
                placeholder="e.g. 3"
                hasError={false}
                icon={Building}
              />

              <div className="space-y-2">
                <Label className="text-gray-700 text-[14px]">
                  Furnishing Level
                </Label>
                <Select
                  value={formData.commercialDetails?.furnishingLevel || ""}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      commercialDetails: {
                        ...prev.commercialDetails!,
                        furnishingLevel: value as
                          | "fully-furnished"
                          | "semi-furnished"
                          | "unfurnished",
                      },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select furnishing level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fully-furnished">
                      Fully Furnished
                    </SelectItem>
                    <SelectItem value="semi-furnished">
                      Semi Furnished
                    </SelectItem>
                    <SelectItem value="unfurnished">Unfurnished</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <FormInput
                id="electricityLoad"
                label="Electricity Load (KVA)"
                type="number"
                value={
                  formData.commercialDetails?.electricityLoad === 0
                    ? ""
                    : formData.commercialDetails?.electricityLoad?.toString() ||
                      ""
                }
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    commercialDetails: {
                      ...prev.commercialDetails!,
                      electricityLoad: parseInt(value) || 0,
                    },
                  }))
                }
                placeholder="e.g. 50"
                hasError={false}
                icon={Zap}
              />

              <div className="space-y-2">
                <Label className="text-gray-700 text-[14px]">
                  Parking Type
                </Label>
                <Select
                  value={formData.commercialDetails?.parkingType || ""}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      commercialDetails: {
                        ...prev.commercialDetails!,
                        parkingType: value as "common" | "dedicated",
                      },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parking type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="common">Common Parking</SelectItem>
                    <SelectItem value="dedicated">Dedicated Parking</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700 text-[14px]">
                  Preferred Tenant
                </Label>
                <Select
                  value={formData.commercialDetails?.preferredTenant || ""}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      commercialDetails: {
                        ...prev.commercialDetails!,
                        preferredTenant: value as
                          | "retail"
                          | "corporate"
                          | "bank"
                          | "medical"
                          | "any",
                      },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select preferred tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                    <SelectItem value="bank">Bank</SelectItem>
                    <SelectItem value="medical">Medical/Clinic</SelectItem>
                    <SelectItem value="any">Any</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.commercialDetails?.hasPowderRoom || false}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      commercialDetails: {
                        ...prev.commercialDetails!,
                        hasPowderRoom: e.target.checked,
                      },
                    }))
                  }
                />
                <span>Powder Room Inside</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.commercialDetails?.hasPowerBackup || false}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      commercialDetails: {
                        ...prev.commercialDetails!,
                        hasPowerBackup: e.target.checked,
                      },
                    }))
                  }
                />
                <span>Power Backup</span>
              </label>
            </div>
          </div>
        )}

        {/* Gender Preference - Only show for non-commercial properties */}
        {formData?.type !== "commercial" && formData?.type && (
          <div className="space-y-3 font-inter pt-4 border-t">
            <Label className="text-gray-700 text-[14px] font-inter font-semibold">
              Gender Preference
            </Label>
            <div className="space-y-3">
              {/* Radio Buttons for Male, Female, Unisex */}
              <div className="flex gap-4">
                {["male", "female", "unisex"].map((gender) => (
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
                            | "unisex",
                        }))
                      }
                      className="w-4 h-4 text-HG-500 focus:ring-HG-400"
                    />
                    <span className="capitalize">{gender}</span>
                  </label>
                ))}
              </div>

              {/* Co-living Checkbox - Only show when Unisex is selected */}
              {formData?.genderPreference === "unisex" && (
                <div className="ml-6 mt-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData?.isCoLiving || false}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          isCoLiving: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 text-HG-500 focus:ring-HG-400 rounded"
                    />
                    <span className="font-medium text-gray-700">
                      Co-living (Mixed gender accommodation)
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 ml-6 mt-1">
                    Enable this if both male and female tenants share common
                    areas
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </form>
  );
};