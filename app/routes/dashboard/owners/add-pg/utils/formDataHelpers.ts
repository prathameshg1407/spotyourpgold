// app/routes/dashboard/owners/add-pg/utils/formDataHelpers.ts

import type { PGFormData } from '../types';

/**
 * Room type interface (matching the one in PGFormData)
 */
export interface RoomType {
  type: string;
  isAC: boolean;
  numberOfRooms: number;
  availableRooms: number;
  capacityPerRoom: number;
  monthlyRent: number;
  securityDeposit: number;
}

/**
 * Default location structure with all required fields
 */
export const DEFAULT_LOCATION = {
  area: '',
  city: '',
  state: '',
  pincode: '',
  nearbyPlaces: [] as string[],
  nearbyPlacesInput: '',
  coordinates: { lat: 0, lng: 0 },
};

/**
 * Get a default room type with valid values
 * IMPORTANT: numberOfRooms and capacityPerRoom default to 1, not 0
 */
export const getDefaultRoomType = (): RoomType => ({
  type: '',
  isAC: false,
  numberOfRooms: 1,      // Default to 1, not 0 - FIXES THE ERROR
  availableRooms: 0,
  capacityPerRoom: 1,    // Default to 1, not 0 - FIXES THE ERROR
  monthlyRent: 0,
  securityDeposit: 0,
});

/**
 * Normalize a single room type to ensure valid values
 * Ensures capacity and numberOfRooms are at least 1
 */
export const normalizeRoomType = (room: any): RoomType => {
  // Ensure capacityPerRoom is at least 1
  let capacityPerRoom = 1;
  if (room?.capacityPerRoom !== undefined && room?.capacityPerRoom !== null && room?.capacityPerRoom !== '') {
    const parsed = Number(room.capacityPerRoom);
    capacityPerRoom = !isNaN(parsed) && parsed > 0 ? parsed : 1;
  }

  // Ensure numberOfRooms is at least 1
  let numberOfRooms = 1;
  if (room?.numberOfRooms !== undefined && room?.numberOfRooms !== null && room?.numberOfRooms !== '') {
    const parsed = Number(room.numberOfRooms);
    numberOfRooms = !isNaN(parsed) && parsed > 0 ? parsed : 1;
  }

  // Ensure availableRooms is not negative and not more than numberOfRooms
  let availableRooms = 0;
  if (room?.availableRooms !== undefined && room?.availableRooms !== null) {
    const parsed = Number(room.availableRooms);
    availableRooms = !isNaN(parsed) && parsed >= 0 ? Math.min(parsed, numberOfRooms) : 0;
  }

  return {
    type: room?.type || '',
    isAC: Boolean(room?.isAC),
    numberOfRooms,
    availableRooms,
    capacityPerRoom,
    monthlyRent: Math.max(0, Number(room?.monthlyRent) || 0),
    securityDeposit: Math.max(0, Number(room?.securityDeposit) || 0),
  };
};

/**
 * Normalize room types array - ensures all rooms have valid capacity
 */
export const normalizeRoomTypes = (roomTypes: any): RoomType[] => {
  if (!Array.isArray(roomTypes) || roomTypes.length === 0) {
    return [getDefaultRoomType()];
  }

  return roomTypes.map((room) => normalizeRoomType(room));
};

/**
 * Default form data structure
 */
export const getDefaultFormData = (): PGFormData => ({
  id: '',
  pgName: '',
  primaryLine: '',
  type: '',
  subType: '',
  roomTypes: [getDefaultRoomType()], // Start with one valid room with capacity=1
  genderPreference: 'unisex',
  isCoLiving: false,
  additionalDetails: [],
  additionalDetailsInput: '',
  location: { ...DEFAULT_LOCATION },
  rulesAndRegulations: [],
  newRuleInput: '',
  detailedRules: {
    lockInPeriod: '',
    noticePeriod: '',
    maintenanceCharges: '',
    registrationFees: '',
    entryTiming: '',
    exitTiming: '',
    guestStayPolicy: '',
    smokingAlcoholPolicy: '',
  },
  amenities: [],
  customAmenities: '',
  images: [],
  existingImageUrls: [],
  videos: [],
  existingVideoUrls: [],
  foodIncluded: false,
  electricityIncluded: false,
  maintenanceIncluded: false,
  mealTimings: {
    morning: { enabled: false, from: '', to: '' },
    noon: { enabled: false, from: '', to: '' },
    evening: { enabled: false, from: '', to: '' },
    night: { enabled: false, from: '', to: '' },
  },
});

/**
 * Safely normalize location data from API/Database
 */
export function normalizeLocationData(location: any): PGFormData['location'] {
  if (!location || typeof location !== 'object') {
    return { ...DEFAULT_LOCATION };
  }

  return {
    area: location.area ?? DEFAULT_LOCATION.area,
    city: location.city ?? DEFAULT_LOCATION.city,
    state: location.state ?? DEFAULT_LOCATION.state,
    pincode: location.pincode ?? DEFAULT_LOCATION.pincode,
    nearbyPlaces: Array.isArray(location.nearbyPlaces)
      ? location.nearbyPlaces
      : DEFAULT_LOCATION.nearbyPlaces,
    nearbyPlacesInput: location.nearbyPlacesInput ?? DEFAULT_LOCATION.nearbyPlacesInput,
    coordinates: {
      lat: typeof location.coordinates?.lat === 'number'
        ? location.coordinates.lat
        : DEFAULT_LOCATION.coordinates.lat,
      lng: typeof location.coordinates?.lng === 'number'
        ? location.coordinates.lng
        : DEFAULT_LOCATION.coordinates.lng,
    },
  };
}

/**
 * Safely normalize full form data from API/Database
 */
export function normalizeFormData(data: any): PGFormData {
  const defaults = getDefaultFormData();

  if (!data || typeof data !== 'object') {
    return defaults;
  }

  return {
    id: data.id ?? defaults.id,
    pgName: data.pgName ?? defaults.pgName,
    primaryLine: data.primaryLine ?? defaults.primaryLine,
    type: data.type ?? defaults.type,
    subType: data.subType ?? defaults.subType,
    roomTypes: normalizeRoomTypes(data.roomTypes), // Use normalization function
    genderPreference: data.genderPreference ?? defaults.genderPreference,
    isCoLiving: data.isCoLiving ?? defaults.isCoLiving,
    additionalDetails: Array.isArray(data.additionalDetails)
      ? data.additionalDetails
      : defaults.additionalDetails,
    additionalDetailsInput: data.additionalDetailsInput ?? defaults.additionalDetailsInput,
    location: normalizeLocationData(data.location),
    rulesAndRegulations: Array.isArray(data.rulesAndRegulations)
      ? data.rulesAndRegulations
      : defaults.rulesAndRegulations,
    newRuleInput: data.newRuleInput ?? defaults.newRuleInput,
    detailedRules: {
      lockInPeriod: data.detailedRules?.lockInPeriod ?? defaults.detailedRules.lockInPeriod,
      noticePeriod: data.detailedRules?.noticePeriod ?? defaults.detailedRules.noticePeriod,
      maintenanceCharges: data.detailedRules?.maintenanceCharges ?? defaults.detailedRules.maintenanceCharges,
      registrationFees: data.detailedRules?.registrationFees ?? defaults.detailedRules.registrationFees,
      entryTiming: data.detailedRules?.entryTiming ?? defaults.detailedRules.entryTiming,
      exitTiming: data.detailedRules?.exitTiming ?? defaults.detailedRules.exitTiming,
      guestStayPolicy: data.detailedRules?.guestStayPolicy ?? defaults.detailedRules.guestStayPolicy,
      smokingAlcoholPolicy: data.detailedRules?.smokingAlcoholPolicy ?? defaults.detailedRules.smokingAlcoholPolicy,
    },
    amenities: Array.isArray(data.amenities) ? data.amenities : defaults.amenities,
    customAmenities: data.customAmenities ?? defaults.customAmenities,
    images: Array.isArray(data.images) ? data.images : defaults.images,
    existingImageUrls: Array.isArray(data.existingImageUrls)
      ? data.existingImageUrls
      : defaults.existingImageUrls,
    videos: Array.isArray(data.videos) ? data.videos : defaults.videos,
    existingVideoUrls: Array.isArray(data.existingVideoUrls)
      ? data.existingVideoUrls
      : defaults.existingVideoUrls,
    foodIncluded: data.foodIncluded ?? defaults.foodIncluded,
    electricityIncluded: data.electricityIncluded ?? defaults.electricityIncluded,
    maintenanceIncluded: data.maintenanceIncluded ?? defaults.maintenanceIncluded,
    mealTimings: {
      morning: {
        enabled: data.mealTimings?.morning?.enabled ?? defaults.mealTimings.morning.enabled,
        from: data.mealTimings?.morning?.from ?? defaults.mealTimings.morning.from,
        to: data.mealTimings?.morning?.to ?? defaults.mealTimings.morning.to,
      },
      noon: {
        enabled: data.mealTimings?.noon?.enabled ?? defaults.mealTimings.noon.enabled,
        from: data.mealTimings?.noon?.from ?? defaults.mealTimings.noon.from,
        to: data.mealTimings?.noon?.to ?? defaults.mealTimings.noon.to,
      },
      evening: {
        enabled: data.mealTimings?.evening?.enabled ?? defaults.mealTimings.evening.enabled,
        from: data.mealTimings?.evening?.from ?? defaults.mealTimings.evening.from,
        to: data.mealTimings?.evening?.to ?? defaults.mealTimings.evening.to,
      },
      night: {
        enabled: data.mealTimings?.night?.enabled ?? defaults.mealTimings.night.enabled,
        from: data.mealTimings?.night?.from ?? defaults.mealTimings.night.from,
        to: data.mealTimings?.night?.to ?? defaults.mealTimings.night.to,
      },
    },
    // Optional fields
    flatsDetails: data.flatsDetails,
    commercialDetails: data.commercialDetails,
    planType: data.planType,
    paymentStatus: data.paymentStatus,
    paymentId: data.paymentId,
    paymentProof: data.paymentProof,
  };
}

/**
 * Safe string accessor with trim support
 */
export function safeString(value: any): string {
  return typeof value === 'string' ? value : '';
}

/**
 * Safe array accessor
 */
export function safeArray<T>(value: any): T[] {
  return Array.isArray(value) ? value : [];
}