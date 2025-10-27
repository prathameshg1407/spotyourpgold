"use client";

import { useState, useEffect } from "react";

export default function JsonImportTest() {
  const [status, setStatus] = useState("Testing...");
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const testImport = async () => {
      try {
        // Test dynamic import
        const indoreData = await import("@/data/indore-locations.json");
        console.log("Dynamic import successful:", indoreData.default.length);
        setData(indoreData.default);
        setStatus(
          `✅ Dynamic import successful: ${indoreData.default.length} locations`
        );
      } catch (error) {
        console.error("Dynamic import failed:", error);
        setStatus(`❌ Dynamic import failed: ${error}`);
      }
    };

    testImport();
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">JSON Import Test</h1>

      <div className="p-4 bg-gray-100 rounded-md">
        <p className="font-semibold">Status: {status}</p>
      </div>

      {data && (
        <div className="space-y-2">
          <h3 className="font-semibold">Sample Data:</h3>
          <div className="p-3 bg-gray-50 rounded-md">
            <p>
              <strong>Name:</strong> {data[0].name}
            </p>
            <p>
              <strong>Display Name:</strong> {data[0].displayName}
            </p>
            <p>
              <strong>Coordinates:</strong> {data[0].lat}, {data[0].lng}
            </p>
            <p>
              <strong>Aliases:</strong> {data[0].aliases.join(", ")}
            </p>
          </div>
        </div>
      )}

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h3 className="font-semibold text-blue-800 mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Open browser console (F12)</li>
          <li>Look for &quot;Dynamic import successful&quot; message</li>
          <li>Check if any errors appear</li>
        </ol>
      </div>
    </div>
  );
}
