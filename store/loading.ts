import { create } from "zustand";

// Define all container loading keys here
export type ContainerKey =
  | "homeContainer"
  // | "profileSidebar"
  // | "reviewSection"
  | "ownerListings"
  | "pgDetails"
  | "userFavorites"
  | "visitRequests"
  | "ownerVisitRequests";

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
    // profileSidebar: false,
    // reviewSection: false,
    pgDetails: true,
    userFavorites: true,
    visitRequests: true,
    ownerVisitRequests: true,
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
        // profileSidebar: false,
        // reviewSection: false,
        pgDetails: false,
        userFavorites: false,
        visitRequests: false,
        ownerVisitRequests: false,
      },
    }),
}));
