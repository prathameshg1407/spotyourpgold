"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { propertyTypes } from "@/app/routes/dashboard/owners/add-pg/constants";
import { ChevronDown, Home } from "lucide-react";

interface PropertyTypeFilterProps {
  selectedType: string;
  selectedSubType: string;
  onTypeChange: (type: string, subType: string) => void;
}

export default function PropertyTypeFilter({
  selectedType,
  selectedSubType,
  onTypeChange,
}: PropertyTypeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleTypeSelect = (typeId: string) => {
    onTypeChange(typeId, "");
    setIsOpen(false);
  };

  const getDisplayText = () => {
    if (selectedType) {
      const type = propertyTypes.find((t) => t.id === selectedType);
      return type?.label || "All Types";
    }
    return "All Types";
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:border-HG-300 transition-colors"
      >
        <Home className="w-4 h-4 text-gray-500" />
        <span className="text-gray-700">{getDisplayText()}</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
          >
            <div className="p-2">
              {/* All Types Option */}
              <button
                onClick={() => {
                  onTypeChange("", "");
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                  !selectedType
                    ? "bg-HG-400/10 text-HG-500"
                    : "hover:bg-gray-100"
                }`}
              >
                All Types
              </button>

              {/* Property Types */}
              {propertyTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleTypeSelect(type.id)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                    selectedType === type.id
                      ? "bg-HG-400/10 text-HG-500"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Click outside to close */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
        </>
      )}
    </div>
  );
}