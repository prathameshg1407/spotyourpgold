import {
  Wifi,
  Car,
  Utensils,
  Dumbbell,
  Tv,
  AirVent,
  Shirt,
  Coffee,
  Users,
  Shield,
  BrushIcon as BrushCleaning,
  Camera,
  Zap,
  Droplets,
  Sofa,
  Bed,
  Refrigerator,
  BookOpen,
  Lightbulb,
  Home,
  Bath,
} from "lucide-react";
import type { PGFormData, ValidationErrors } from "./types";

export const predefinedAmenities = [
  { id: "wifi", label: "Wi-Fi", icon: Wifi },
  { id: "ac", label: "Air Conditioning", icon: AirVent },
  { id: "geyser", label: "Geyser", icon: Zap },
  { id: "water-purifier", label: "Water Purifier", icon: Droplets },
  { id: "laundry", label: "Laundry Facility", icon: Shirt },
  { id: "housekeeping", label: "Housekeeping", icon: BrushCleaning },
  { id: "cctv", label: "CCTV", icon: Camera },
  { id: "combined-cooking", label: "Combined Cooking area", icon: Coffee },
  { id: "common-area", label: "Common Area / Lounge", icon: Users },
  { id: "study-desk", label: "Study Desk", icon: BookOpen },
  { id: "mattress-wardrobe", label: "Mattress and Wardrobe", icon: Bed },
  {
    id: "common-refrigerator",
    label: "Common Refrigerator",
    icon: Refrigerator,
  },
  {
    id: "separate-refrigerator",
    label: "Separate Refrigerator",
    icon: Refrigerator,
  },
  { id: "gym", label: "GYM", icon: Dumbbell },
  { id: "power-backup", label: "Power backup", icon: Zap },
  { id: "library", label: "Library", icon: BookOpen },
  { id: "parking", label: "Parking", icon: Car },
  { id: "meals", label: "Meals", icon: Utensils },
  { id: "24x7-security", label: "24x7 Security", icon: Shield },
  { id: "tv", label: "TV/Entertainment", icon: Tv },
];

// NEW: Predefined general rules
export const predefinedRules = [
  "No pets allowed",
  "No smoking inside the premises",
  "No alcohol consumption",
  "Visitors allowed only during designated hours",
  "Keep common areas clean",
  "Respect quiet hours (10 PM - 7 AM)",
  "Report maintenance issues immediately",
  "No unauthorized guests overnight",
  "Regular room cleaning is mandatory",
  "Adhere to waste disposal guidelines",
];

// Room types based on property type and AC status
export const roomTypesByCategory = {
  hostels: {
    nonAC: [
      { id: "single-occupancy", label: "Single Occupancy" },
      { id: "double-occupancy", label: "Double Occupancy" },
      { id: "triple-occupancy", label: "Triple Occupancy" },
      { id: "quadruple-occupancy", label: "Quadruple Occupancy" },
    ],
    AC: [
      { id: "single-occupancy-ac", label: "Single Occupancy (AC)" },
      { id: "double-occupancy-ac", label: "Double Occupancy (AC)" },
      { id: "triple-occupancy-ac", label: "Triple Occupancy (AC)" },
      { id: "quadruple-occupancy-ac", label: "Quadruple Occupancy (AC)" },
    ],
  },
  pgs: {
    nonAC: [
      { id: "single-occupancy", label: "Single Occupancy" },
      { id: "double-occupancy", label: "Double Occupancy" },
      { id: "triple-occupancy", label: "Triple Occupancy" },
      { id: "quadruple-occupancy", label: "Quadruple Occupancy" },
    ],
    AC: [
      { id: "single-occupancy-ac", label: "Single Occupancy (AC)" },
      { id: "double-occupancy-ac", label: "Double Occupancy (AC)" },
      { id: "triple-occupancy-ac", label: "Triple Occupancy (AC)" },
      { id: "quadruple-occupancy-ac", label: "Quadruple Occupancy (AC)" },
    ],
  },
  rooms: {
    nonAC: [
      { id: "studio-room", label: "Studio Room" },
      { id: "1rk", label: "1 RK" },
    ],
    AC: [
      { id: "studio-room-ac", label: "Studio Room (AC)" },
      { id: "1rk-ac", label: "1 RK (AC)" },
    ],
  },
  flats: {
    nonAC: [
      { id: "1bhk", label: "1 BHK" },
      { id: "2bhk", label: "2 BHK" },
      { id: "3bhk-villa", label: "3 BHK Villa" },
      { id: "4bhk-villa", label: "4 BHK Villa" },
      { id: "bungalow", label: "Bungalow" },
    ],
    AC: [
      { id: "1bhk-ac", label: "1 BHK (AC)" },
      { id: "2bhk-ac", label: "2 BHK (AC)" },
      { id: "3bhk-villa-ac", label: "3 BHK Villa (AC)" },
      { id: "4bhk-villa-ac", label: "4 BHK Villa (AC)" },
      { id: "bungalow-ac", label: "Bungalow (AC)" },
    ],
  },
  commercial: {
    all: [
      { id: "shop", label: "Shop" },
      { id: "office", label: "Office" },
      { id: "showroom", label: "Showroom" },
      { id: "warehouse", label: "Warehouse" },
      { id: "godown", label: "Godown" },
      { id: "coworking-space", label: "Co-working Space" },
    ],
  },
};

export const propertyTypes = [
  {
    id: "hostels",
    label: "Hostels",
    subTypes: [],
  },
  {
    id: "flats",
    label: "Flats/Villas",
    subTypes: [],
  },
  {
    id: "pgs",
    label: "PGs",
    subTypes: [],
  },
  {
    id: "rooms",
    label: "Rooms",
    subTypes: [],
  },
  {
    id: "commercial",
    label: "Commercial Properties",
    subTypes: [],
  },
];

export const initialErrors: ValidationErrors = {
  pgName: false,
  primaryLine: false,
  monthlyRent: false,
  additionalDetails: false,
  rulesAndRegulations: false,
  images: false,
  videos: false,
  area: false,
  city: false,
  state: false,
  pincode: false,
  coordinates: false,
  latitude: false,
  longitude: false,
  general: "",
  securityDeposit: false,
  numberOfRooms: false,
  capacityPerRoom: false,
  genderPreference: false,
};

export const initialFormData: PGFormData = {
  id: "",
  pgName: "",
  primaryLine: "",
  type: "",
  subType: "",
  roomTypes: [
    {
      type: "",
      isAC: false,
      numberOfRooms: 0,
      availableRooms: 0,
      capacityPerRoom: 0,
      monthlyRent: 0,
      securityDeposit: 0,
    },
  ],
  genderPreference: "unisex",
  isCoLiving: false, // NEW
  additionalDetails: [],
  additionalDetailsInput: "",
  location: {
    area: "",
    city: "",
    state: "",
    pincode: "",
    nearbyPlaces: [],
    nearbyPlacesInput: "",
    coordinates: { lat: 30.7333, lng: 76.7794 },
  },
  rulesAndRegulations: [],
  newRuleInput: "",

  detailedRules: {
    lockInPeriod: "",
    noticePeriod: "",
    maintenanceCharges: "",
    registrationFees: "", // NEW
    entryTiming: "",
    exitTiming: "",
    guestStayPolicy: "",
    smokingAlcoholPolicy: "",
  },

  flatsDetails: {
    carpetArea: 0,
    furnishingLevel: "",
    bedrooms: 0,
    bathrooms: 0,
    parkingBike: false,
    parkingCar: false,
    balconyCount: 0,
    hasTerrace: false,
    isPenthouse: false,
  },

  commercialDetails: {
    carpetArea: 0,
    floorNumber: 0,
    furnishingLevel: "",
    hasPowderRoom: false,
    hasPowerBackup: false,
    electricityLoad: 0,
    parkingType: "",
    preferredTenant: "",
  },

  images: [],
  existingImageUrls: [],
  videos: [],
  existingVideoUrls: [],
  amenities: [],
  customAmenities: "",
  foodIncluded: false,
  electricityIncluded: false,
  maintenanceIncluded: false,
  mealTimings: {
    morning: { enabled: false, from: "07:00", to: "09:00" },
    noon: { enabled: false, from: "12:00", to: "14:00" },
    evening: { enabled: false, from: "18:00", to: "20:00" },
    night: { enabled: false, from: "21:00", to: "23:00" },
  },
  planType: "free",
  paymentStatus: "pending",
  paymentId: "",
  paymentProof: "",
};

export const stepTitles = {
  1: "Basic Information",
  2: "Location",
  3: "Amenities & Details",
  4: "Rules & Regulations",
  5: "Upload Images",
  6: "Review & Submit",
};