import type React from "react";

export interface PGFormData {
  id: string;
  pgName: string;
  primaryLine: string;
  type: "hostels" | "flats" | "pgs" | "rooms" | "commercial" | "";
  subType: string;

  roomTypes: {
    type: string;
    isAC: boolean;
    numberOfRooms: number;
    availableRooms: number;
    capacityPerRoom: number;
    monthlyRent: number;
    securityDeposit: number;
  }[];
  genderPreference: "male" | "female" | "unisex";
  isCoLiving: boolean; // NEW: For co-living option

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
    registrationFees: string; // NEW: Registration fees field
    entryTiming: string;
    exitTiming: string;
    guestStayPolicy: "allowed" | "not-allowed" | "limited-access" | "";
    smokingAlcoholPolicy: "allowed" | "not-allowed" | "limited-access" | "";
  };

  flatsDetails?: {
    carpetArea: number;
    furnishingLevel: "fully-furnished" | "semi-furnished" | "unfurnished" | "";
    bedrooms: number;
    bathrooms: number;
    parkingBike: boolean;
    parkingCar: boolean;
    balconyCount: number;
    hasTerrace: boolean;
    isPenthouse: boolean;
  };

  commercialDetails?: {
    carpetArea: number;
    floorNumber: number;
    furnishingLevel: "fully-furnished" | "semi-furnished" | "unfurnished" | "";
    hasPowderRoom: boolean;
    hasPowerBackup: boolean;
    electricityLoad: number;
    parkingType: "common" | "dedicated" | "";
    preferredTenant: "retail" | "corporate" | "bank" | "medical" | "any" | "";
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