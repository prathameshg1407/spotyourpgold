"use client";

import { useState, useEffect } from "react";

// Static JSON data for testing
const testLocations = [
  {
    name: "Bombay Hospital",
    displayName: "Bombay Hospital, Indore",
    lat: 22.7196,
    lng: 75.8577,
    city: "Indore",
    aliases: ["Bombay Hospital Indore"],
  },
  {
    name: "IIM Indore",
    displayName: "IIM Indore, Indore",
    lat: 22.68,
    lng: 75.85,
    city: "Indore",
    aliases: ["Indian Institute of Management Indore"],
  },
  {
    name: "C21 Mall",
    displayName: "C21 Mall, Indore",
    lat: 22.77,
    lng: 75.94,
    city: "Indore",
    aliases: ["C21 Shopping Mall"],
  },
];

export default function StaticJsonTest() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const matches = testLocations.filter((location) => {
      const nameMatch = location.name.toLowerCase().includes(query);
      const aliasMatch = location.aliases.some((alias) =>
        alias.toLowerCase().includes(query)
      );
      return nameMatch || aliasMatch;
    });

    setResults(matches);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Static JSON Test (No Import)</h1>

      <div className="p-4 bg-green-100 rounded-md">
        <p className="font-semibold text-green-800">
          ✅ Using static data - should work immediately
        </p>
        <p className="text-sm text-green-700">
          Total locations: {testLocations.length}
        </p>
      </div>

      <div className="space-y-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for: Bombay Hospital, IIM, C21..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Search
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold">Results ({results.length}):</h3>
          {results.map((location, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded-md">
              <p className="font-medium">{location.name}</p>
              <p className="text-sm text-gray-600">{location.displayName}</p>
              <p className="text-xs text-gray-500">
                Coordinates: {location.lat}, {location.lng}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <h3 className="font-semibold text-yellow-800 mb-2">Test This First:</h3>
        <p className="text-sm">
          Try searching for: &quot;Bombay&quot;, &quot;IIM&quot;, or
          &quot;C21&quot;
        </p>
      </div>
    </div>
  );
}
