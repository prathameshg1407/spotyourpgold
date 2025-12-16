"use client";
import Link from "next/link";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUserStore } from "@/store/userStore";
import { toast } from "sonner";
import axios from "axios";
import { IconCrown } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { Input } from "./ui/input";
import { Search, X, Filter, MapPin } from "lucide-react";
import { useAdvancedFilters } from "@/hooks/useAdvancedFilters";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import AdvancedFilter from "./AdvancedFilter";
import { Badge } from "./ui/badge";
import SearchDropdown from "./SearchDropdown";
import EnhancedSearchDropdown from "./EnhancedSearchDropdown";

const NavBar = () => {
  const { user, setUser } = useUserStore();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // Use advanced filters hook
  const {
    filters,
    updateFilter,
    clearFilters,
    activeFiltersCount,
    searchWithFilters,
  } = useAdvancedFilters(20, false);

  // Ultra-fast debounce for real-time search
  const debouncedSearch = useDebouncedValue(searchQuery, 150);

  // Update filters when search query changes
  useEffect(() => {
    if (debouncedSearch !== filters.query) {
      updateFilter("query", debouncedSearch);
    }
  }, [debouncedSearch, filters.query, updateFilter]);

  // Trigger search immediately when filters change
  useEffect(() => {
    const hasActiveSearch = filters.query || activeFiltersCount > 0;
    if (hasActiveSearch) {
      searchWithFilters();
    }
  }, [filters, activeFiltersCount, searchWithFilters]);

  // Handle search input change - real-time
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery("");
    clearFilters();
  };

  // Remove specific filter
  const removeFilter = (key: string, value?: string) => {
    if (key === "query") {
      setSearchQuery("");
      updateFilter("query", "");
    } else if (
      key === "amenities" ||
      key === "roomTypes" ||
      key === "nearbyPlaces"
    ) {
      const currentArray = (filters as any)[key] as string[];
      updateFilter(
        key as any,
        currentArray.filter((item: string) => item !== value)
      );
    } else {
      updateFilter(key as any, "");
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post("/api/auth/logout");
      setUser(null);
      router.push("/");
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Error logging out");
    }
  };

  return (
    <nav className="w-full fixed top-0 left-0 z-50 backdrop-blur-md bg-white/20 py-3 md:py-4 md:px-4 shadow-2xl shadow-HG-500/10">
      <div className="flex items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-lg md:text-2xl font-semibold font-poppins"
        >
          <Image
            src="/logo.png"
            alt="Logo"
            width={64}
            height={64}
            className="h-12 w-12 md:h-16 md:w-16 object-contain"
          />
          SYPG
        </Link>

        {/* Search Section - Hidden on mobile */}
        <div className="hidden md:flex flex-1 max-w-xl mx-8">
          <div className="flex gap-2 w-full">
            <div className="flex-1">
              <EnhancedSearchDropdown
                value={searchQuery}
                onChange={handleSearchChange}
                onClear={handleClearSearch}
                onSelectProperty={(property) => {
                  // Navigate to property details page
                  router.push(`/routes/pg-details/${property.slug || property._id}`);
                }}
                onSelectLocation={(location) => {
                  // Update query filter with location name
                  updateFilter("query", location.name);
                }}
                placeholder="Search by location, PG name, or nearby..."
                showNearbyOption={true}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => router.push("/routes/location-search")}
              className="px-4 border-HG-500 text-HG-500 hover:bg-HG-50"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Location
            </Button>
          </div>

          {/* Advanced Filter Button - directly opens sidebar */}
          {/* <AdvancedFilter
            filters={filters}
            onFiltersChange={(newFilters) => {
              Object.entries(newFilters).forEach(([key, value]) => {
                updateFilter(key as any, value);
              });
            }}
            onApplyFilters={searchWithFilters}
            onClearFilters={clearFilters}
            activeFiltersCount={activeFiltersCount}
          /> */}
        </div>

        {/* Navigation Links */}
        <div className="flex items-center gap-2 md:gap-5">
          {/* List Now Button - Always visible */}
          <Link
            href={
              user?.role === "owner" || user?.role === "admin"
                ? "/routes/dashboard/owners/add-pg"
                : "/routes/owners/onboarding"
            }
          >
            <Button
              variant="outline"
              size="sm"
              className="border-HG-500 text-HG-500 hover:bg-HG-500 hover:text-white font-poppins font-medium transition-all duration-300 text-xs md:text-sm px-3 md:px-4"
            >
              List Now
            </Button>
          </Link>

          {/* User Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 outline-none">
                <Avatar className="h-8 w-8 border-2 border-HG-500">
                  <AvatarImage src="" alt="User" />
                  <AvatarFallback className="bg-HG-500 text-white font-poppins font-medium text-sm">
                    {user.fullName?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:block text-sm font-medium font-poppins">
                  {user.fullName}
                </span>
                {user.role === "admin" && (
                  <IconCrown className="h-4 w-4 text-yellow-500" />
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/routes/dashboard" className="cursor-pointer">
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/routes/watchlist" className="cursor-pointer">
                    Watchlist
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer"
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/routes/auth/login">
                <Button
                  variant="outline"
                  size="sm"
                  className="font-poppins text-xs md:text-sm px-3 md:px-4 bg-orange-500 text-white border-orange-500 hover:bg-orange-600 hover:border-orange-600"
                >
                  LOG IN
                </Button>
              </Link>
              <Link href="/routes/auth/signup">
                <Button
                  size="sm"
                  className="font-poppins text-xs md:text-sm px-3 md:px-4 hidden md:block"
                >
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Search Bar with Advanced Filter Button */}
      <div className="md:hidden px-4 mt-3 pb-3">
        <div className="flex gap-2 items-center">
          {/* Search Bar - takes most of the space */}
          <div className="flex-1">
            <EnhancedSearchDropdown
              value={searchQuery}
              onChange={handleSearchChange}
              onClear={handleClearSearch}
              onSelectProperty={(property) => {
                // Navigate to property details page
                router.push(`/routes/pg-details/${property.slug || property._id}`);
              }}
              onSelectLocation={(location) => {
                // Update query filter with location name
                updateFilter("query", location.name);
              }}
              placeholder="Search PGs, locations, or nearby..."
              showNearbyOption={true}
            />
          </div>

          {/* Location Search Button */}
          <Button
            variant="outline"
            onClick={() => router.push("/routes/location-search")}
            className="px-3 border-HG-500 text-HG-500 hover:bg-HG-50"
          >
            <MapPin className="w-4 h-4" />
          </Button>

          {/* Mobile Advanced Filter Button - Icon only on the right */}
          {/* <div className="[&>button]:p-2 [&>button]:bg-white/80 [&>button]:backdrop-blur-md [&>button]:border-white/20 [&>button]:hover:bg-white/90 [&>button]:aspect-square [&>button>span]:hidden">
            <AdvancedFilter
              filters={filters}
              onFiltersChange={(newFilters) => {
                Object.entries(newFilters).forEach(([key, value]) => {
                  updateFilter(key as any, value);
                });
              }}
              onApplyFilters={searchWithFilters}
              onClearFilters={clearFilters}
              activeFiltersCount={activeFiltersCount}
            />
          </div> */}
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white/90 backdrop-blur-md border-t border-white/20 px-4 py-2 shadow-sm z-30">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-700">
              Active filters:
            </span>

            {filters.query && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Search: {filters.query}
                <button
                  onClick={() => removeFilter("query")}
                  className="ml-1 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {filters.type && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Type: {filters.type}
                <button
                  onClick={() => removeFilter("type")}
                  className="ml-1 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {filters.amenities.map((amenity) => (
              <Badge
                key={amenity}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {amenity}
                <button
                  onClick={() => removeFilter("amenities", amenity)}
                  className="ml-1 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}

            {filters.roomTypes.map((roomType) => (
              <Badge
                key={roomType}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {roomType}
                <button
                  onClick={() => removeFilter("roomTypes", roomType)}
                  className="ml-1 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}

            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-red-500 hover:text-red-700"
            >
              Clear all
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
