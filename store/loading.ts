// store/loading.ts
import { create } from "zustand";

// Define all container loading keys here
export type ContainerKey =
  | "homeContainer"
  | "ownerListings"
  | "pgDetails"
  | "userFavorites"
  | "visitRequests"
  | "roomManagement"
  | "ownerVisitRequests"
  | "roomAllocation";

type LoadingState = {
  isLoading: boolean;
  containerLoading: Record<ContainerKey, boolean>;
  setLoading: (value: boolean) => void;
  setContainerLoading: (key: ContainerKey, value: boolean) => void;
  resetContainerLoading: () => void;
};

export const useLoadingStore = create<LoadingState>((set) => ({
  isLoading: true,
  containerLoading: {
    homeContainer: true,
    ownerListings: true,
    pgDetails: true,
    userFavorites: true,
    visitRequests: true,
    roomManagement: true,  // Added here
    ownerVisitRequests: true,
    roomAllocation: true,
  },
  setLoading: (value) => set({ isLoading: value }),
  setContainerLoading: (key, value) =>
    set((state) => ({
      containerLoading: { ...state.containerLoading, [key]: value },
    })),
  resetContainerLoading: () =>
    set({
      containerLoading: {
        homeContainer: false,
        ownerListings: false,
        pgDetails: false,
        userFavorites: false,
        visitRequests: false,
        roomManagement: false,  // Added here
        ownerVisitRequests: false,
        roomAllocation: false,
      },
    }),
}));