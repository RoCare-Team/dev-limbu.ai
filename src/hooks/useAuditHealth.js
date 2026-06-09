"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { getLocalStorage } from "@/utils/storage";

export function useAuditHealth() {
  const { data: session } = useSession();
  const [locations, setLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [loading, setLoading] = useState(false);
  const [auditData, setAuditData] = useState(null);

  useEffect(() => {
    // Load locations
    const storedLocations = getLocalStorage("locationDetails");
    if (storedLocations) {
      try {
        const parsed = JSON.parse(storedLocations);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLocations(parsed);
          setSelectedLocationId(parsed[0].locationId);
        }
      } catch (e) {
        console.error("Failed to parse locations", e);
      }
    }
  }, []);

  const handleGenerateReport = useCallback(async () => {
    if (!selectedLocationId) {
      toast.error("Please select a location");
      return;
    }
    if (!session?.accessToken) {
      toast.error("Please log in to generate report");
      return;
    }

    const selectedLoc = locations.find((l) => l.locationId === selectedLocationId);
    if (!selectedLoc) {
      toast.error("Location details not found");
      return;
    }

    setLoading(true);
    setAuditData(null);

    try {
      const payload = [
        {
          location_id: selectedLoc.locationId,
          account_id: selectedLoc.accountId,
          token: session.accessToken,
        },
      ];

      const res = await fetch(
        "https://n8n.limbutech.in/webhook/10d9cd54-46a7-4c3b-9c61-0ce9cf666eac",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const rawText = await res.text();
      
      if (!rawText) {
        throw new Error("Received empty response from server");
      }

      const data = JSON.parse(rawText);

      let audit = data;
      if (Array.isArray(data) && data.length > 0) {
        audit = data[0];
      }

      if (audit && typeof audit === 'object' && "" in audit) {
        audit = audit[""];
      }

      console.log("SESSION");
console.log(session);

console.log("USER EMAIL");
console.log(session?.user?.email);

console.log("SELECTED LOCATION");
console.log(selectedLoc);


await fetch("/api/audit-tracking", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    email: session?.user?.email,
    locationId: selectedLoc.locationId,
    accountId: selectedLoc.accountId,
    businessName: selectedLoc.title,
  }),
});

setAuditData(audit);
toast.success("Report generated successfully!");

    } catch (error) {
      console.error("Audit Error:", error);
      toast.error("Failed to generate report. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [locations, selectedLocationId, session]);

  return {
    locations,
    selectedLocationId,
    setSelectedLocationId,
    loading,
    auditData,
    handleGenerateReport
  };
}
