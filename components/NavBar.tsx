"use client";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
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
// import { logout } from "@/actions/auth";
import { toast } from "sonner";
import axios from "axios";
import { IconCrown } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import PropertyTypeFilter from "./PropertyTypeFilter";

const NavBar = ({
  searchQuery,
  setSearchQuery,
  selectedType,
  selectedSubType,
  onTypeChange,
}: {
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  selectedType: string;
  selectedSubType: string;
  onTypeChange: (type: string, subType: string) => void;
}) => {
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const { user, setUser } = useUserStore();

  // const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const router = useRouter();

  // useEffect(() => {
  //   if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

  //   if (searchQuery.trim().length === 0) return;

  //   debounceTimeout.current = setTimeout(() => {
  //     router.push(`/routes/search?q=${encodeURIComponent(searchQuery.trim())}`);
  //   }, 600); // 600ms debounce
  // }, [searchQuery, router]);

  return (
    <nav className="w-full fixed top-0 left-0 z-50 backdrop-blur-md bg-white/20 py-3 md:py-4 md:px-4 shadow-2xl shadow-HG-500/10   ">
      <div className="flex flex-wrap items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-lg md:text-2xl font-semibold font-poppins"
        >
          <img
            src="/logo.png"
            alt="Logo"
            className="h-12 w-12 md:h-16 md:w-16 object-contain"
          />
          SYPG
        </Link>

        {/* Search Input and Filter */}
        <div className="flex items-center gap-3 w-[70%] md:w-[50%] hidden md:flex">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Location, Owner, or PG Name..."
              className="w-full px-8 md:px-10 py-2 focus:border-none font-poppins text-xs md:text-base focus:outline-gray-200 rounded-lg placeholder:text-center bg-gray-50 text-black text-center"
            />

            {!searchQuery && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 ">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-4.35-4.35M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0z"
                  />
                </svg>
              </div>
            )}

            {searchQuery && (
              <div
                onClick={() => {
                  setSearchQuery("");
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer "
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Property Type Filter */}
          <PropertyTypeFilter
            selectedType={selectedType}
            selectedSubType={selectedSubType}
            onTypeChange={onTypeChange}
          />
        </div>

        <div className="flex items-center gap-3 md:gap-5">
          {/* List Now Button */}
          <Link href="/routes/owners/onboarding" className="hidden md:block">
            <Button
              variant="outline"
              size="sm"
              className="border-HG-500 text-HG-500 hover:bg-HG-500 hover:text-white font-poppins font-medium transition-all duration-300"
            >
              List Now
            </Button>
          </Link>

          {!showMobileSearch ? (
            <div
              onClick={() => {
                setShowMobileSearch(true);
              }}
              className=" cursor-pointer  text-gray-400 md:hidden "
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0z"
                />
              </svg>
            </div>
          ) : (
            <div
              onClick={() => {
                setSearchQuery("");
                setShowMobileSearch(false);
              }}
              className=" text-gray-400 cursor-pointer "
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer">
                  {/* <AvatarImage src={user.avatarUrl} /> */}
                  <AvatarFallback className="text-HG-500 text-xl font-poppins">
                    {user?.fullName?.slice(0, 1).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                className="w-[200px] mr-5 md:mr-8"
                align="start"
              >
                {/* Common for all logged-in users */}
                {/* <DropdownMenuItem
                  // onClick={() => router.push("/profile")}
                  className="cursor-pointer"
                >
                  Profile
                </DropdownMenuItem> */}

                {/* If user has applied but pending */}
                {user?.role === "user" && user?.ownerStatus === "pending" && (
                  <Link href={"/routes/owners/onboarding"} prefetch={true}>
                    <DropdownMenuItem className="opacity-70 cursor-pointer">
                      Verification Pending *
                    </DropdownMenuItem>
                  </Link>
                )}

                {/* For verified owners */}
                {user?.role === "owner" && user?.ownerStatus === "verified" && (
                  <DropdownMenuItem
                    onClick={() => router.push("/routes/dashboard")}
                    className="cursor-pointer"
                  >
                    Owner Dashboard
                  </DropdownMenuItem>
                )}

                {/* For admin */}
                {user?.role === "admin" && (
                  <DropdownMenuItem
                    onClick={() => router.push("/routes/dashboard")}
                    className="cursor-pointer"
                  >
                    Admin Panel
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                {/* Log out */}
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={async () => {
                    const loadingToast = toast.loading("logging out...", {
                      closeButton: true,
                    });

                    const res = await axios.post("/api/auth/logout");
                    toast.dismiss(loadingToast);
                    if (res && res?.data && res?.data?.success) {
                      toast.dismiss(loadingToast);
                      setUser(null);
                      toast.success(
                        res?.data?.message || "Logged out successfully.",
                        {
                          closeButton: true,
                          duration: 2000,
                        }
                      );
                    } else {
                      toast.dismiss(loadingToast);
                      toast.error(res.data?.message || "Failed to logout.", {
                        closeButton: true,
                        duration: 2000,
                      });
                    }
                  }}
                >
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            // </div>
            <Link href={"/routes/auth/login"} prefetch={true}>
              <Button className="font-poppins uppercase">Log In</Button>
            </Link>
          )}
        </div>
      </div>

      {showMobileSearch && (
        <div className="w-[90%] mx-auto mt-4 md:hidden space-y-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Location, Owner, or PG Name..."
              className="w-full px-8 md:px-10 py-2 focus:border-none font-poppins text-xs md:text-base focus:outline-gray-200 rounded-lg placeholder:text-center bg-gray-50 text-black text-center"
            />

            {!searchQuery && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 ">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-4.35-4.35M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0z"
                  />
                </svg>
              </div>
            )}

            {searchQuery && (
              <div
                onClick={() => {
                  setSearchQuery("");
                  setShowMobileSearch(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer "
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Mobile List Now Button */}
          <div className="flex justify-center">
            <Link href="/routes/owners/onboarding">
              <Button
                size="sm"
                className="bg-HG-500 hover:bg-HG-600 text-white font-poppins font-medium transition-all duration-300"
              >
                List Your Property
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
