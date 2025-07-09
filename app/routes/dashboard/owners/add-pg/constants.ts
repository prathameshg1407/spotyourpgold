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
} from "lucide-react"
import type { PGFormData, ValidationErrors } from "./types"

export const predefinedAmenities = [
  { id: "wifi", label: "WiFi", icon: Wifi },
  { id: "parking", label: "Parking", icon: Car },
  { id: "meals", label: "Meals", icon: Utensils },
  { id: "gym", label: "Gym", icon: Dumbbell },
  { id: "tv", label: "TV/Entertainment", icon: Tv },
  { id: "ac", label: "Air Conditioning", icon: AirVent },
  { id: "laundry", label: "Laundry", icon: Shirt },
  { id: "kitchen", label: "Kitchen Access", icon: Coffee },
  { id: "common-area", label: "Common Area", icon: Users },
  { id: "24x7-security", label: "24x7 Security", icon: Shield },
  { id: "housekeeping", label: "Housekeeping", icon: BrushCleaning },
  { id: "cctv", label: "CCTV", icon: Camera },
]

export const initialErrors: ValidationErrors = {
  pgName: false,
  monthlyRent: false,
  additionalDetails: false,
  rulesAndRegulations: false,
  images: false,
  area: false,
  city: false,
  state: false,
  pincode: false,
  coordinates: false,
  general: "",
  securityDeposit: false,
  numberOfRooms: false,
  capacityPerRoom: false,
  genderPreference: false,
}

export const initialFormData: PGFormData = {
  id: "",
  pgName: "",
  roomTypes: [ {
    type: "",
    numberOfRooms: 0,
    capacityPerRoom: 0,
    monthlyRent: 0,
    securityDeposit: 0,
  } ],
  genderPreference: "both",
  additionalDetails: [],
  additionalDetailsInput: "",
  location: {
    area: "",
    city: "",
    state: "",
    pincode: "",
    coordinates: { lat: 30.7333, lng: 76.7794 },
  },
  rulesAndRegulations: [],
  newRuleInput: "",
  images: [],
  existingImageUrls: [],
  amenities: [],
  customAmenities: "",
  foodIncluded: false,
  electricityIncluded: false,
  maintenanceIncluded: false,
  // New fields for payment
  planType: "free", 
  paymentStatus: "pending",
  paymentId: "",
  paymentProof: "",
  // paymentProof: File,


}

export const stepTitles = {
  1: "Basic Information",
  2: "Location",
  3: "Amenities & Details",
  4: "Rules & Regulations",
  5: "Upload Images",
  6: "Review & Submit",
}
