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

    const selectedLoc = locations.find(
      (l) => l.locationId === selectedLocationId,
    );
    if (!selectedLoc) {
      toast.error("Location details not found");
      return;
    }

    setLoading(true);
    setAuditData(null);

    try {
      // New audit engine (v2) — single-object payload, structured JSON response.
      const payload = {
        location_id: selectedLoc.locationId,
        account_id: selectedLoc.accountId,
        token: session.accessToken,
      };

      const res = await fetch("https://gmb-auditor.limbutech.in/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const rawText = await res.text();

      if (!res.ok) {
        // The API returns { detail: "..." } on errors — surface it if present.
        let detail = `HTTP error! status: ${res.status}`;
        try {
          const errJson = JSON.parse(rawText);
          if (errJson?.detail) detail = errJson.detail;
        } catch {
          /* non-JSON error body */
        }
        throw new Error(detail);
      }

      if (!rawText) {
        throw new Error("Received empty response from server");
      }

      // v2 returns the AuditResponse object directly — no array / "" unwrapping.
      const audit = JSON.parse(rawText);

      // Raw API response — inspect / copy from the browser console.
      console.log("=== RAW AUDIT RESPONSE (gmb-auditor v2) ===");
      console.log(JSON.stringify(audit, null, 2));

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
      const msg = /401|unauthorized|token/i.test(error?.message || "")
        ? "Your Google session expired. Please log in again."
        : "Failed to generate report. Please try again.";
      toast.error(msg);
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
    handleGenerateReport,
  };
}
