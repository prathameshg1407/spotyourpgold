"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { X, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  label: string;
  count?: number;
}

interface LocationCategoryFilterProps {
  categories: Category[];
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
  onClearAll: () => void;
  className?: string;
  showCounts?: boolean;
}

const defaultCategories: Category[] = [
  { id: "pgs", name: "pgs", label: "PGs" },
  { id: "hostels", name: "hostels", label: "Hostels" },
  { id: "rooms", name: "rooms", label: "Rooms" },
  { id: "flats", name: "flats", label: "Flats" },
  { id: "commercial", name: "commercial", label: "Commercial" },
];

export default function LocationCategoryFilter({
  categories = defaultCategories,
  selectedCategories = [],
  onCategoryChange,
  onClearAll,
  className,
  showCounts = false,
}: LocationCategoryFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCategoryToggle = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      onCategoryChange(selectedCategories.filter((id) => id !== categoryId));
    } else {
      onCategoryChange([...selectedCategories, categoryId]);
    }
  };

  const handleClearAll = () => {
    onClearAll();
    setIsExpanded(false);
  };

  const hasSelectedCategories = selectedCategories.length > 0;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">
            Property Type
          </span>
          {hasSelectedCategories && (
            <Badge variant="secondary" className="text-xs">
              {selectedCategories.length}
            </Badge>
          )}
        </div>

        {hasSelectedCategories && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-xs h-auto p-1 text-HG-500 hover:text-HG-600"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Categories */}
      <div className="space-y-2">
        {/* Always visible categories */}
        <div className="flex flex-wrap gap-2">
          {categories.slice(0, 3).map((category) => (
            <Button
              key={category.id}
              variant={
                selectedCategories.includes(category.id) ? "default" : "outline"
              }
              size="sm"
              onClick={() => handleCategoryToggle(category.id)}
              className={cn(
                "text-xs h-8 px-3",
                selectedCategories.includes(category.id)
                  ? "bg-HG-500 text-white hover:bg-HG-600"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              )}
            >
              {category.label}
              {showCounts && category.count !== undefined && (
                <span className="ml-1 text-xs opacity-75">
                  ({category.count})
                </span>
              )}
            </Button>
          ))}
        </div>

        {/* Expandable categories */}
        {categories.length > 3 && (
          <>
            {isExpanded && (
              <div className="flex flex-wrap gap-2">
                {categories.slice(3).map((category) => (
                  <Button
                    key={category.id}
                    variant={
                      selectedCategories.includes(category.id)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => handleCategoryToggle(category.id)}
                    className={cn(
                      "text-xs h-8 px-3",
                      selectedCategories.includes(category.id)
                        ? "bg-HG-500 text-white hover:bg-HG-600"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    {category.label}
                    {showCounts && category.count !== undefined && (
                      <span className="ml-1 text-xs opacity-75">
                        ({category.count})
                      </span>
                    )}
                  </Button>
                ))}
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs h-auto p-1 text-gray-500 hover:text-gray-700"
            >
              {isExpanded ? "Show Less" : `+${categories.length - 3} More`}
            </Button>
          </>
        )}
      </div>

      {/* Selected Categories Display */}
      {hasSelectedCategories && (
        <div className="flex flex-wrap gap-1">
          {selectedCategories.map((categoryId) => {
            const category = categories.find((c) => c.id === categoryId);
            if (!category) return null;

            return (
              <Badge
                key={categoryId}
                variant="secondary"
                className="flex items-center gap-1 text-xs"
              >
                {category.label}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-red-500"
                  onClick={() => handleCategoryToggle(categoryId)}
                />
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
