// app/routes/dashboard/owners/add-pg/types.ts

import type React from "react";

export interface PGFormData {
  id: string;
  pgName: string;
  primaryLine: string;
  type: "hostels" | "flats" | "pgs" | "rooms" | "commercial" | "";
  subType: string;

  roomTypes: {
    type: string;
    numberOfRooms: number;
    availableRooms: number;
    capacityPerRoom: number;
    monthlyRent: number;
    securityDeposit: number;
  }[];
  genderPreference: "male" | "female" | "both";

  additionalDetails: string[];
  additionalDetailsInput: string;

  location: {
    area: string;
    city: string;
    state: string;
    pincode: string;
    nearbyPlaces: string[];
    nearbyPlacesInput: string;
    coordinates: { lat: number; lng: number };
  };

  rulesAndRegulations: string[];
  newRuleInput: string;

  detailedRules: {
    lockInPeriod: string;
    noticePeriod: string;
    maintenanceCharges: string;
    entryTiming: string;
    exitTiming: string;
    guestStayPolicy: "allowed" | "not-allowed" | "limited-access" | "";
    smokingAlcoholPolicy: "allowed" | "not-allowed" | "limited-access" | "";
  };

  amenities: string[];
  customAmenities: string;

  images: File[];
  existingImageUrls: string[];
  videos: File[];
  existingVideoUrls: string[];

  foodIncluded: boolean;
  electricityIncluded: boolean;
  maintenanceIncluded: boolean;

  mealTimings: {
    morning: { enabled: boolean; from: string; to: string };
    noon: { enabled: boolean; from: string; to: string };
    evening: { enabled: boolean; from: string; to: string };
    night: { enabled: boolean; from: string; to: string };
  };

  planType?: "free" | "paid" | "subscription";
  paymentStatus?: "pending" | "completed" | "failed";
  paymentId?: string;
  paymentProof?: string | File;
}

export interface StepProps {
  formData: PGFormData;
  setFormData: React.Dispatch<React.SetStateAction<PGFormData>>;
  errors: any;
  setErrors: React.Dispatch<React.SetStateAction<any>>;
}

export interface ValidationErrors {
  pgName: boolean;
  primaryLine: boolean;
  monthlyRent: boolean;
  securityDeposit: boolean;
  numberOfRooms: boolean;
  capacityPerRoom: boolean;
  additionalDetails: boolean;
  rulesAndRegulations: boolean;
  genderPreference: boolean;
  images: boolean;
  videos: boolean;
  area: boolean;
  city: boolean;
  state: boolean;
  pincode: boolean;
  coordinates: boolean;
  latitude: boolean;
  longitude: boolean;
  general: string;
}