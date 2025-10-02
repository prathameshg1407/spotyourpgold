import type React from "react";
export interface PGFormData {
  id: string; // Unique identifier for the listing, can be empty for new listings
  pgName: string;
  primaryLine: string; // Optional 35 char max primary line
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

  // Enhanced Rules Structure
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

  // Meal timings (optional, only when foodIncluded is true)
  mealTimings: {
    morning: { enabled: boolean; from: string; to: string };
    noon: { enabled: boolean; from: string; to: string };
    evening: { enabled: boolean; from: string; to: string };
    night: { enabled: boolean; from: string; to: string };
  };

  // New fields for payment
  planType?: "free" | "paid" | "subscription";
  paymentStatus?: "pending" | "completed" | "failed";
  paymentId?: string;
  paymentProof?: string | File; // ✅ string (URL after upload) or File (before upload)
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
