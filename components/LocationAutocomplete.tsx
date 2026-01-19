// components/LocationAutocomplete.tsx
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from "lucide-react";

interface Prediction {
  place_id: string;
  description: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
}

interface LocationAutocompleteProps {
  onSelect: (prediction: Prediction) => void;
  placeholder?: string;
}

export default function LocationAutocomplete({
  onSelect,
  placeholder = "Search city, area...",
}: LocationAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const fetchPredictions = useCallback(async (input: string) => {
    if (input.length < 3) {
      setPredictions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/location/autocomplete?q=${encodeURIComponent(input)}`
      );
      const data = await response.json();
      setPredictions(data.predictions || []);
    } catch (error) {
      console.error("Autocomplete error:", error);
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // Debounce: 300ms
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      fetchPredictions(value);
    }, 300);
  };

  const handleSelect = (prediction: Prediction) => {
    setQuery(prediction.description);
    setPredictions([]);
    onSelect(prediction);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
        )}
      </div>

      {predictions.length > 0 && (
        <div className="absolute z-50 w-full bg-white border rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              onClick={() => handleSelect(prediction)}
              className="block w-full text-left px-4 py-3 hover:bg-gray-100 border-b last:border-0"
            >
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {prediction.city || prediction.state}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {prediction.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}