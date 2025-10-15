import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export interface BookingRequest {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
  };
  listingId: {
    _id: string;
    pgName: string;
    location: {
      area: string;
      city: string;
    };
    primaryImage: string;
  };
  roomType: string;
  moveInDate: string;
  duration: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  aadhaarNumber?: string;
  additionalRequirements?: string;
  amount: number;
  securityDeposit: number;
  status: "pending" | "confirmed" | "rejected" | "cancelled";
  paymentStatus:
    | "pending"
    | "pending_cash_payment"
    | "completed_cash"
    | "failed"
    | "refunded";
  ownerNotes?: string;
  createdAt: string;
}

interface BookingState {
  // Data
  bookings: BookingRequest[];
  total: number;
  totalPages: number;
  currentPage: number;
  activeTab: string;

  // Loading states
  loading: boolean;
  error: string | null;

  // Cache timestamps
  lastFetched: { [key: string]: number };

  // Actions
  setBookings: (
    bookings: BookingRequest[],
    total: number,
    totalPages: number
  ) => void;
  setCurrentPage: (page: number) => void;
  setActiveTab: (tab: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateBooking: (bookingId: string, updates: Partial<BookingRequest>) => void;
  removeBooking: (bookingId: string) => void;
  clearCache: () => void;
  shouldFetch: (tab: string, page: number) => boolean;
  setLastFetched: (tab: string, page: number) => void;
  fetchBookings: (tab: string, page: number) => Promise<void>;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useBookingStore = create<BookingState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        bookings: [],
        total: 0,
        totalPages: 0,
        currentPage: 1,
        activeTab: "pending",
        loading: false,
        error: null,
        lastFetched: {},

        // Actions
        setBookings: (bookings, total, totalPages) =>
          set({ bookings, total, totalPages, error: null }),

        setCurrentPage: (currentPage) => set({ currentPage }),

        setActiveTab: (activeTab) => set({ activeTab, currentPage: 1 }),

        setLoading: (loading) => set({ loading }),

        setError: (error) => set({ error }),

        updateBooking: (bookingId, updates) =>
          set((state) => ({
            bookings: state.bookings.map((booking) =>
              booking._id === bookingId ? { ...booking, ...updates } : booking
            ),
          })),

        removeBooking: (bookingId) =>
          set((state) => ({
            bookings: state.bookings.filter(
              (booking) => booking._id !== bookingId
            ),
            total: state.total - 1,
          })),

        clearCache: () => set({ lastFetched: {} }),

        shouldFetch: (tab, page) => {
          const state = get();
          const key = `${tab}-${page}`;
          const lastFetched = state.lastFetched[key];
          return !lastFetched || Date.now() - lastFetched > CACHE_DURATION;
        },

        setLastFetched: (tab, page) =>
          set((state) => ({
            lastFetched: {
              ...state.lastFetched,
              [`${tab}-${page}`]: Date.now(),
            },
          })),

        fetchBookings: async (tab, page) => {
          const state = get();

          // Check if we should fetch (cache check)
          if (!state.shouldFetch(tab, page)) {
            return;
          }

          try {
            state.setLoading(true);
            state.setError(null);

            const response = await fetch(
              `/api/booking/owner-requests?status=${
                tab === "all" ? "all" : tab
              }&page=${page}&per_page=20`
            );

            if (!response.ok) {
              throw new Error("Failed to fetch bookings");
            }

            const data = await response.json();

            if (data.success) {
              state.setBookings(data.data, data.total, data.totalPages);
              state.setLastFetched(tab, page);
            } else {
              throw new Error(data.message || "Failed to fetch bookings");
            }
          } catch (error) {
            console.error("Failed to fetch booking requests:", error);
            state.setError(
              error instanceof Error
                ? error.message
                : "Failed to fetch booking requests"
            );
          } finally {
            state.setLoading(false);
          }
        },
      }),
      {
        name: "booking-store",
        partialize: (state) => ({
          lastFetched: state.lastFetched,
        }),
      }
    ),
    { name: "booking-store" }
  )
);
