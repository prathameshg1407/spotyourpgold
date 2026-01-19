"use client";

import { useState } from "react";
import EnhancedLocationSearchBox from "./EnhancedLocationSearchBox";
import { LocationData } from "@/hooks/useIndoreLocationSearch";

export default function IndoreLocationSearchDemo() {
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(
    null
  );
  const [searchResults, setSearchResults] = useState<string>("");

  const handleLocationSelect = (location: LocationData) => {
    setSelectedLocation(location);
    setSearchResults(`Searching for properties in ${location.displayName}...`);
  };

  const handleNearbySearch = (location: LocationData) => {
    setSelectedLocation(location);
    setSearchResults(
      `Searching for properties around ${location.displayName}...`
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Indore Location Search
        </h1>
        <p className="text-gray-600">
          Search for properties near hospitals, schools, malls, metro stations,
          and more in Indore
        </p>
      </div>

      <EnhancedLocationSearchBox
        onLocationSelect={handleLocationSelect}
        onNearbySearch={handleNearbySearch}
        placeholder="Try: Bombay Hospital, IIM Indore, C21 Mall, Sarafa Metro..."
        showSuggestions={true}
        showNearbyOption={true}
      />

      {selectedLocation && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-800 mb-2">
            Selected Location:
          </h3>
          <p className="text-green-700">
            <strong>Name:</strong> {selectedLocation.name}
          </p>
          <p className="text-green-700">
            <strong>Display Name:</strong> {selectedLocation.displayName}
          </p>
          <p className="text-green-700">
            <strong>Coordinates:</strong> {selectedLocation.lat},{" "}
            {selectedLocation.lng}
          </p>
        </div>
      )}

      {searchResults && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Search Status:</h3>
          <p className="text-blue-700">{searchResults}</p>
        </div>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 mb-2">Search Examples:</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <strong>Hospitals:</strong>
            <ul className="list-disc list-inside text-gray-600">
              <li>Bombay Hospital</li>
              <li>Apollo Hospital</li>
              <li>AIIMS Indore</li>
            </ul>
          </div>
          <div>
            <strong>Educational:</strong>
            <ul className="list-disc list-inside text-gray-600">
              <li>IIM Indore</li>
              <li>IIT Indore</li>
              <li>Daly College</li>
            </ul>
          </div>
          <div>
            <strong>Shopping:</strong>
            <ul className="list-disc list-inside text-gray-600">
              <li>C21 Mall</li>
              <li>Treasure Island Mall</li>
              <li>Sarafa Bazaar</li>
            </ul>
          </div>
          <div>
            <strong>Transport:</strong>
            <ul className="list-disc list-inside text-gray-600">
              <li>Sarafa Metro</li>
              <li>Indore Airport</li>
              <li>Railway Station</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}