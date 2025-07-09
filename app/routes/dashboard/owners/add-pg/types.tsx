import type React from "react"
export interface PGFormData {
  id: string; // Unique identifier for the listing, can be empty for new listings
  pgName: string;

  roomTypes: {
    type: string;
    numberOfRooms: number;
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
    coordinates: { lat: number; lng: number };
  };

  rulesAndRegulations: string[];
  newRuleInput: string;

  amenities: string[];
  customAmenities: string;

  images: File[];
  existingImageUrls: string[];

  foodIncluded: boolean;
  electricityIncluded: boolean;
  maintenanceIncluded: boolean;

  // New fields for payment
  planType?: "free" | "paid" | "subscription";
  paymentStatus?: "pending" | "completed" | "failed";
  paymentId?: string;
  paymentProof?: string | File; // ✅ string (URL after upload) or File (before upload)
}

export interface StepProps {
  formData: PGFormData
  setFormData: React.Dispatch<React.SetStateAction<PGFormData>>
  errors: any
  setErrors: React.Dispatch<React.SetStateAction<any>>
}

export interface ValidationErrors {
  pgName: boolean
  monthlyRent: boolean
  securityDeposit: boolean
  numberOfRooms: boolean
  capacityPerRoom: boolean
  additionalDetails: boolean
  rulesAndRegulations: boolean
  genderPreference: boolean
  images: boolean
  area: boolean
  city: boolean
  state: boolean
  pincode: boolean
  coordinates: boolean
  general: string
}
