"use client";

import { useState, useEffect } from "react";
import indoreLocations from "@/data/indore-locations.json";

export default function SimpleIndoreTest() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    console.log("Indore locations loaded:", indoreLocations.length);
    setIsLoaded(true);
  }, []);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const matches = indoreLocations.filter((location) => {
      const nameMatch = location.name.toLowerCase().includes(query);
      const aliasMatch = location.aliases.some((alias) =>
        alias.toLowerCase().includes(query)
      );
      return nameMatch || aliasMatch;
    });

    setResults(matches.slice(0, 5));
    console.log("Search results:", matches.length);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Simple Indore Search Test</h1>

      <div className="space-y-2">
        <p className="text-sm text-gray-600">
          Status: {isLoaded ? "✅ JSON Loaded" : "⏳ Loading..."}
        </p>
        <p className="text-sm text-gray-600">
          Total locations: {indoreLocations.length}
        </p>
      </div>

      <div className="space-y-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for: Bombay Hospital, IIM Indore, C21 Mall..."
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
              {location.aliases.length > 0 && (
                <p className="text-xs text-gray-500">
                  Aliases: {location.aliases.join(", ")}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <h3 className="font-semibold text-yellow-800 mb-2">Test Queries:</h3>
        <div className="space-y-1 text-sm">
          <p>Try these searches:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Bombay Hospital</li>
            <li>IIM</li>
            <li>C21</li>
            <li>Sarafa</li>
            <li>Apollo</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
