"use client";

import { useState } from "react";
import type { PGFormData, ValidationErrors } from "../types";
import { initialErrors } from "../constants";

export const useFormValidation = (formData: PGFormData) => {
  const [errors, setErrors] = useState<ValidationErrors>(initialErrors);

  const validateStep = (step: number): boolean => {
    const newErrors: ValidationErrors = { ...initialErrors };

    switch (step) {
      case 1:
        if (!formData.pgName.trim()) {
          newErrors.pgName = true;
          newErrors.general ||= "Please enter a name for the property";
        }

        if (
          !Array.isArray(formData.roomTypes) ||
          formData.roomTypes.length === 0
        ) {
          newErrors.general ||= "Add at least one room type";
        } else {
          formData.roomTypes.forEach((room, index) => {
            if (!room.type.trim()) {
              newErrors.general ||= `Room type is missing in room ${index + 1}`;
            }
            if (room.numberOfRooms <= 0) {
              newErrors.general ||= `Number of rooms must be > 0 in room ${
                index + 1
              }`;
            }
            if (room.capacityPerRoom <= 0) {
              newErrors.general ||= `Capacity must be > 0 in room ${index + 1}`;
            }
            if (room.monthlyRent < 0) {
              newErrors.general ||= `Monthly rent cannot be negative in room ${
                index + 1
              }`;
            }
            if (room.securityDeposit < 0) {
              newErrors.general ||= `Security deposit cannot be negative in room ${
                index + 1
              }`;
            }
          });
        }

        if (!["male", "female", "both"].includes(formData.genderPreference)) {
          newErrors.genderPreference = true;
          newErrors.general ||= "Please select a valid gender preference";
        }
        break;

      case 2:
        if (!formData.location.area.trim()) {
          newErrors.area = true;
          newErrors.general ||= "Please enter a valid address";
        }
        if (!formData.location.city.trim()) {
          newErrors.city = true;
          newErrors.general ||= "Please enter a valid city";
        }
        if (!formData.location.state.trim()) {
          newErrors.state = true;
          newErrors.general ||= "Please enter a valid state";
        }
        if (!/^\d{5,6}$/.test(formData.location.pincode.trim())) {
          newErrors.pincode = true;
          newErrors.general ||= "Please enter a valid pincode";
        }
        if (!formData.location.coordinates) {
          newErrors.coordinates = true;
          newErrors.general ||= "Please select a location on map";
        }
        break;



      case 5:
        const totalImages =
          (formData.images?.length || 0) +
          (formData.existingImageUrls?.length || 0);
        const totalVideos =
          (formData.videos?.length || 0) +
          (formData.existingVideoUrls?.length || 0);

        if (totalImages === 0) {
          newErrors.images = true;
          newErrors.general = "Please upload at least one image";
        }

        if (totalImages > 12) {
          newErrors.images = true;
          newErrors.general = "Maximum 12 images allowed";
        }

        if (totalVideos > 3) {
          newErrors.videos = true;
          newErrors.general = "Maximum 3 videos allowed";
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
    return Object.values(newErrors).every((val) => val === false || val === "");
  };

  return { errors, setErrors, validateStep };
};
