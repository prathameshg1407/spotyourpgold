import { create } from "zustand";

interface listingStore {
    listings: any[];
    userLocation : {lat:number,lng:number} | null;
    locationDenied: boolean;
    setLocationDenied: (locationDenied: boolean) => void;
    setUserLocation: (userLocation: {lat:number,lng:number} | null) => void;
    setListings: (listings: any[]) => void;
};

export const useListingStore = create<listingStore>((set) => ({
  listings: [],
  userLocation: null,
  locationDenied: false,
  setLocationDenied: (locationDenied) => set({ locationDenied }),
  setUserLocation: (userLocation) => set({ userLocation }),
  setListings: (listings) => set({ listings }),
}));
