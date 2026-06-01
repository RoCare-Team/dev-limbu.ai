"use client";
import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { getLocalStorage, setLocalStorage } from "@/utils/storage";

function getActiveUserId() {
  const isImpersonating = getLocalStorage("isImpersonating") === "true";
  return isImpersonating
    ? getLocalStorage("impersonatedUser")
    : getLocalStorage("userId");
}

function mapListingToLocation(item) {
  const locationId = item?.name?.split("/").pop();
  return {
    locationId,
    accountId: item.accountId || "",
    locality: item.storefrontAddress?.locality || "",
    address: item.storefrontAddress?.addressLines?.[0] || "",
    title: item.title || "",
    websiteUrl: item.websiteUri || "",
    reviewUri: item.metadata?.newReviewUri || "",
    isVerified: item.hasVoiceOfMerchant === true || item.verified === true,
    businessProfileId: item.name || "",
    name: item.name,
    websiteUri: item.websiteUri,
    storefrontAddress: item.storefrontAddress,
    phoneNumbers: item.phoneNumbers,
    categories: item.categories,
    openInfo: item.openInfo,
    metadata: item.metadata,
  };
}

function normalizeAuditResponse(data) {
  let audit = data;
  if (Array.isArray(data) && data.length > 0) {
    audit = data[0];
  }

  if (audit && typeof audit === "object" && "" in audit) {
    audit = audit[""];
  }

  return audit;
}

export function useAuditHealth() {
  const [locations, setLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [loading, setLoading] = useState(false);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [auditData, setAuditData] = useState(null);

  useEffect(() => {
    const loadLocations = async () => {
      const activeId = getActiveUserId();
      if (!activeId) {
        setLocationsLoading(false);
        return;
      }

      const storedLocations = getLocalStorage("locationDetails");
      if (storedLocations) {
        try {
          const parsed = JSON.parse(storedLocations);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setLocations(parsed);
            setSelectedLocationId(parsed[0].locationId);
            setLocationsLoading(false);
            return;
          }
        } catch (e) {
          console.error("Failed to parse locations", e);
        }
      }

      try {
        const res = await fetch(
          `/api/gmb/pages?userId=${encodeURIComponent(activeId)}&refresh=false`,
          { cache: "no-store" },
        );
        const data = await res.json();
        if (!res.ok || data.success === false) {
          throw new Error(data.error || "Failed to load GMB locations");
        }

        const nextLocations = (data.accounts || [])
          .flatMap((account) => account.listings || [])
          .map(mapListingToLocation)
          .filter((location) => location.locationId);

        setLocations(nextLocations);
        setSelectedLocationId(nextLocations[0]?.locationId || "");
        setLocalStorage("locationDetails", JSON.stringify(nextLocations));
      } catch (error) {
        console.error("Failed to load GMB locations", error);
        toast.error("Failed to load connected GMB locations");
      } finally {
        setLocationsLoading(false);
      }
    };

    loadLocations();
  }, []);

  const handleGenerateReport = useCallback(async () => {
    const activeId = getActiveUserId();

    if (!activeId) {
      toast.error("User ID not found");
      return;
    }

    if (!selectedLocationId) {
      toast.error("Please select a location");
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
      const res = await fetch("/api/gmb/health-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: activeId,
          locationId: selectedLoc.locationId,
          accountId: selectedLoc.accountId,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.error || "Failed to generate report");
      }

      setAuditData(normalizeAuditResponse(data.data));
      toast.success("Report generated successfully!");
    } catch (error) {
      console.error("Audit Error:", error);
      toast.error("Failed to generate report. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [locations, selectedLocationId]);

  return {
    locations,
    selectedLocationId,
    setSelectedLocationId,
    loading: loading || locationsLoading,
    auditData,
    handleGenerateReport,
  };
}
