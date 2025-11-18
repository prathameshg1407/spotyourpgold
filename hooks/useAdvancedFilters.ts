"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";

export interface FilterState {
  query: string;
  type: string;
  subType: string;
  minPrice: string;
  maxPrice: string;
  genderPreference: string;
  amenities: string[];
  roomTypes: string[];
  nearbyPlaces: string[];
  visible: string[];
  sortBy: string;
  lat: string;
  lng: string;
}

export interface UseAdvancedFiltersReturn {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  updateFilter: (key: keyof FilterState, value: any) => void;
  clearFilters: () => void;
  applyFilters: () => void;
  activeFiltersCount: number;
  listings: any[];
  loading: boolean;
  total: number;
  totalPages: number;
  currentPage: number;
  searchWithFilters: (
    customFilters?: Partial<FilterState>,
    forceSearch?: boolean
  ) => Promise<void>;
}

const initialFilters: FilterState = {
  query: "",
  type: "",
  subType: "",
  minPrice: "",
  maxPrice: "",
  genderPreference: "",
  amenities: [],
  roomTypes: [],
  nearbyPlaces: [],
  visible: [],
  sortBy: "",
  lat: "",
  lng: "",
};

export const useAdvancedFilters = (
  perPage: number = 20,
  autoSearch: boolean = true
): UseAdvancedFiltersReturn => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  // Initialize filters from URL parameters
  useEffect(() => {
    const urlFilters: FilterState = {
      query: searchParams.get("q") || "",
      type: searchParams.get("type") || "",
      subType: searchParams.get("subType") || "",
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      genderPreference: searchParams.get("genderPreference") || "",
      amenities:
        searchParams.get("amenities")?.split(",").filter(Boolean) || [],
      roomTypes:
        searchParams.get("roomTypes")?.split(",").filter(Boolean) || [],
      nearbyPlaces:
        searchParams.get("nearbyPlaces")?.split(",").filter(Boolean) || [],
      visible: searchParams.get("visible")?.split(",").filter(Boolean) || [],
      sortBy: searchParams.get("sortBy") || "",
      lat: searchParams.get("lat") || "",
      lng: searchParams.get("lng") || "",
    };

    setFilters(urlFilters);
    setCurrentPage(Math.max(1, Number(searchParams.get("page") || 1)));
  }, [searchParams]);

  // Calculate active filters count
  const activeFiltersCount = Object.entries(filters).reduce(
    (count, [key, value]) => {
      if (key === "query") return count; // Don't count query as a filter
      if (Array.isArray(value)) {
        return count + (value.length > 0 ? 1 : 0);
      }
      return count + (value ? 1 : 0);
    },
    0
  );

  // Build URL search parameters from filters
  const buildSearchParams = useCallback(
    (filterState: FilterState, page: number = 1) => {
      const params = new URLSearchParams();

      if (filterState.query) params.set("q", filterState.query);
      if (filterState.type) params.set("type", filterState.type);
      if (filterState.subType) params.set("subType", filterState.subType);
      if (filterState.minPrice) params.set("minPrice", filterState.minPrice);
      if (filterState.maxPrice) params.set("maxPrice", filterState.maxPrice);
      if (filterState.genderPreference)
        params.set("genderPreference", filterState.genderPreference);
      if (filterState.amenities.length > 0)
        params.set("amenities", filterState.amenities.join(","));
      if (filterState.roomTypes.length > 0)
        params.set("roomTypes", filterState.roomTypes.join(","));
      if (filterState.nearbyPlaces.length > 0)
        params.set("nearbyPlaces", filterState.nearbyPlaces.join(","));
      if (filterState.visible.length > 0)
        params.set("visible", filterState.visible.join(","));
      if (filterState.sortBy) params.set("sortBy", filterState.sortBy);
      if (filterState.lat) params.set("lat", filterState.lat);
      if (filterState.lng) params.set("lng", filterState.lng);

      params.set("page", page.toString());
      params.set("per_page", perPage.toString());

      return params;
    },
    [perPage]
  );

  // Search function
  const searchWithFilters = useCallback(
    async (
      customFilters?: Partial<FilterState>,
      forceSearch?: boolean,
      page?: number
    ): Promise<void> => {
      const searchFilters = customFilters
        ? { ...filters, ...customFilters }
        : filters;
      const hasActiveFilters = Object.entries(searchFilters).some(
        ([key, value]) => {
          if (Array.isArray(value)) return value.length > 0;
          return value !== "";
        }
      );

      // Special handling for location-based search
      const hasLocationSearch = searchFilters.lat && searchFilters.lng;

      // Don't search if no filters are active and not query and no location, unless forced
      if (
        !hasActiveFilters &&
        !searchFilters.query &&
        !hasLocationSearch &&
        !forceSearch
      ) {
        setListings([]);
        setTotal(0);
        setTotalPages(1);
        return;
      }

      setLoading(true);

      try {
        const searchParams = buildSearchParams(
          searchFilters,
          page || currentPage
        );
        const response = await axios.get(
          `/api/listing/search?${searchParams.toString()}`
        );

        if (response.data.success) {
          setListings(response.data.data);
          setTotal(response.data.total);
          setTotalPages(response.data.totalPages);
        } else {
          toast.error(response.data.message || "Search failed");
          setListings([]);
          setTotal(0);
          setTotalPages(1);
        }
      } catch (error: any) {
        toast.error("Failed to search properties");
        setListings([]);
        setTotal(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    },
    [filters, buildSearchParams, currentPage]
  );

  // Auto search when filters change (if enabled)
  useEffect(() => {
    if (autoSearch) {
      const timer = setTimeout(() => {
        searchWithFilters();
      }, 500); // Debounce

      return () => clearTimeout(timer);
    }
  }, [filters, autoSearch, searchWithFilters]);

  // Update single filter
  const updateFilter = useCallback((key: keyof FilterState, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Apply filters (update URL and trigger search)
  const applyFilters = useCallback(() => {
    const searchParams = buildSearchParams(filters, 1);
    router.push(`?${searchParams.toString()}`);

    if (!autoSearch) {
      searchWithFilters();
    }
  }, [filters, buildSearchParams, router, autoSearch, searchWithFilters]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
    setCurrentPage(1);
    router.push(window.location.pathname);

    if (!autoSearch) {
      setListings([]);
      setTotal(0);
      setTotalPages(1);
    }
  }, [router, autoSearch]);

  return {
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    applyFilters,
    activeFiltersCount,
    listings,
    loading,
    total,
    totalPages,
    currentPage,
    searchWithFilters,
  };
};
