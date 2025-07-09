import React from "react";

import {
  IconAdjustmentsHorizontal,
  IconMenu2,
  IconSquareChevronDown,
} from "@tabler/icons-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "./ui/button";


const amenities = [
  "wifi",
  "parking",
  "meals",
  "gym",
  "tv",
  "ac",
  "laundry",
  "kitchen",
  "common-area",
  "24x7-security",
  "housekeeping",
  "cctv",
];



const FilterButton = () => {
  return (
    <Sheet >
      <SheetTrigger>
        <div className="flex select-none items-center justify-center px-4 py-2 gap-2 rounded-md bg-HG-400/20 hover:bg-HG-500/30 transition">
          <IconAdjustmentsHorizontal className="text-gray-500 w-4 h-4 md:w-5 md:h-5" />
          <p className="font-poppins text-black font-medium hidden md:block">
            Filters
          </p>
        </div>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full font-inter max-w-sm md:w-[500px] md:!max-w-none [scrollbar-width:none] overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle className="text-xl text-HG-500 -mb-2 font-semibold">
            Filter Results
          </SheetTitle>
          <SheetDescription className="text-sm text-gray-500">
            Refine your search based on your preferences
          </SheetDescription>
        </SheetHeader>

        {/* <div className="relative w-full block md:hidden mt-4">
              <input
                type="text"
                placeholder="Search by Location, Owner, or PG Name..."
                className="w-full pl-10 pr-4 py-2 focus:border-none font-poppins focus:outline-gray-200 rounded-lg placeholder:text-center bg-gray-50 text-black text-center"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
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
            </div> */}

        <div className="mt-6 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Search city or area"
              className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price Range (per month)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                placeholder="Min ₹"
                className="w-1/2 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
              <input
                type="number"
                placeholder="Max ₹"
                className="w-1/2 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div>
          </div>

          <div className="relative">
            <select className="w-full px-4 pr-10 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400 appearance-none bg-white">
              <option value="">Select room type</option>
              <option>Single</option>
              <option>Double</option>
              <option>Triple</option>
              <option>Quad</option>
              <option>Studio</option>
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <IconSquareChevronDown />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amenities
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-700">
              {amenities.map((amenity) => (
                <label key={amenity} className="flex items-center gap-2">
                  <input type="checkbox" className="accent-gray-600" />
                  {amenity}
                </label>
              ))}
            </div>
          </div>

          <div className="relative">
            <select className="w-full px-4 pr-10 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400 appearance-none bg-white">
              <option value="">Select preference</option>
              <option>Boys</option>
              <option>Girls</option>
              <option>Co-ed</option>
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <IconSquareChevronDown />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Owner Name
            </label>
            <input
              type="text"
              placeholder="Enter owner&apos;s name"
              className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-4">
            <button className="px-4 py-2 text-sm rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition">
              Clear
            </button>
            <Button>Apply</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default FilterButton;
