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
        // Validate PG Name
        if (!formData.pgName.trim()) {
          newErrors.pgName = true;
          newErrors.general ||= "Please enter a name for the property";
        }

        // Validate Primary Line length
        if (formData.primaryLine && formData.primaryLine.length > 35) {
          newErrors.primaryLine = true;
          newErrors.general ||= "Primary line must be 35 characters or less";
        }

        // Validate property type is selected
        if (!formData.type) {
          newErrors.general ||= "Please select a property type";
        }

        // Validate room types
        if (
          !Array.isArray(formData.roomTypes) ||
          formData.roomTypes.length === 0
        ) {
          newErrors.general ||= "Add at least one room type";
        } else {
          formData.roomTypes.forEach((room, index) => {
            // Validate room type selection (skip for commercial)
            if (formData.type !== "commercial" && !room.type.trim()) {
              newErrors.general ||= `Room type is missing in room ${index + 1}`;
            }

            // Validate numberOfRooms (skip for commercial)
            if (formData.type !== "commercial") {
              const numberOfRooms = Number(room.numberOfRooms);
              if (isNaN(numberOfRooms) || numberOfRooms <= 0) {
                newErrors.numberOfRooms = true;
                newErrors.general ||= `Number of rooms must be > 0 in room ${index + 1}`;
              }
            }

            // Validate capacityPerRoom ONLY for PGs and Hostels
            if (formData.type === "pgs" || formData.type === "hostels") {
              const capacity = Number(room.capacityPerRoom);
              if (isNaN(capacity) || capacity <= 0) {
                newErrors.capacityPerRoom = true;
                newErrors.general ||= `Capacity must be > 0 in room ${index + 1}`;
              }
            }

            // Validate rent is not negative
            const monthlyRent = Number(room.monthlyRent);
            if (!isNaN(monthlyRent) && monthlyRent < 0) {
              newErrors.monthlyRent = true;
              newErrors.general ||= `Monthly rent cannot be negative in room ${index + 1}`;
            }

            // Validate deposit is not negative
            const securityDeposit = Number(room.securityDeposit);
            if (!isNaN(securityDeposit) && securityDeposit < 0) {
              newErrors.securityDeposit = true;
              newErrors.general ||= `Security deposit cannot be negative in room ${index + 1}`;
            }
          });
        }

        // Gender preference validation - only for non-commercial properties
        if (
          formData.type &&
          formData.type !== "commercial" &&
          !["male", "female", "unisex"].includes(formData.genderPreference)
        ) {
          newErrors.genderPreference = true;
          newErrors.general ||= "Please select a valid gender preference";
        }
        break;

      case 2:
        // Validate coordinates (optional but if provided, must be valid)
        const lat = formData.location.coordinates.lat;
        const lng = formData.location.coordinates.lng;

        if (lat && (isNaN(lat) || lat < -90 || lat > 90)) {
          newErrors.latitude = true;
          newErrors.general ||= "Latitude must be between -90 and 90";
        }

        if (lng && (isNaN(lng) || lng < -180 || lng > 180)) {
          newErrors.longitude = true;
          newErrors.general ||= "Longitude must be between -180 and 180";
        }

        // Address fields are always mandatory
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

        // Ensure we have valid coordinates
        const hasValidCoordinates =
          lat &&
          lng &&
          !isNaN(lat) &&
          !isNaN(lng) &&
          lat >= -90 &&
          lat <= 90 &&
          lng >= -180 &&
          lng <= 180;

        if (!hasValidCoordinates && !formData.location.coordinates) {
          newErrors.coordinates = true;
          newErrors.general ||= "Please select a location on map";
        }
        break;

      case 3:
        // Amenities step - no required validation
        break;

      case 4:
        // Rules step - no required validation
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

      case 6:
        // Final review step - no additional validation
        break;

      default:
        break;
    }

    setErrors(newErrors);
    return Object.values(newErrors).every((val) => val === false || val === "");
  };

  return { errors, setErrors, validateStep };
};