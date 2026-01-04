"use client";
import { useState } from "react";
import ProfileScore from "@/components/ProfileScore";

export default function BusinessLocationSearch() {
  const [businessName, setBusinessName] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleSearch = async () => {
    if (!businessName || !location) {
      setError("Please fill both fields");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(
        "https://n8n.limbutech.in/webhook/89c34fc8-2a74-4d91-a3d9-4d8468bd25e0",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify([
            {
              "business-name ": businessName,
              "location ": location,
            },
          ]),
        }
      );

      if (!response.ok) throw new Error("Webhook failed");

      const data = await response.json();
      setResult(Array.isArray(data) ? data[0] : data);
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const getComponent = (type) =>
    result?.addressComponents?.find(c => c.types.includes(type))?.longText;

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white border rounded-2xl shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Business Location Search</h2>

      <div className="space-y-4">
        <input
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="Business name"
          className="w-full border rounded-lg px-4 py-2"
        />

        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location"
          className="w-full border rounded-lg px-4 py-2"
        />

        <button
          onClick={handleSearch}
          disabled={loading}
          className="w-full py-3 rounded-lg bg-indigo-600 text-white font-bold"
        >
          {loading ? "Fetching..." : "Search"}
        </button>
      </div>

      {error && <p className="text-red-600 mt-4">{error}</p>}

      {result && (
        <>
          {/* LOCATION DETAILS */}
          <div className="mt-6 bg-green-50 p-4 rounded-xl">
            <h3 className="font-semibold">{result?.displayName?.text}</h3>
            <p className="text-sm">{result?.formattedAddress}</p>
            <p className="text-sm mt-2">
              {getComponent("locality")}, {getComponent("administrative_area_level_1")} – {getComponent("postal_code")}
            </p>
          </div>

          {/* ✅ SCORE COMPONENT */}
          <ProfileScore place={result} />
        </>
      )}
    </div>
  );
}
