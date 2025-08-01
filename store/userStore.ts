import { create } from "zustand";

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  ownerStatus: string;
}

interface UserState {
  user: User | null;
  setUser: (user: User | null) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
