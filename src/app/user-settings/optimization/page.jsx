"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import toast, { Toaster } from "react-hot-toast";
import BusinessInformationPanel from "@/components/user-settings/BusinessInformationModal";

function BackRow({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 16,
        padding: 0,
        border: "none",
        background: "none",
        cursor: "pointer",
        fontSize: 14,
        fontWeight: 600,
        color: "#475569",
        fontFamily: "inherit",
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      Back to Settings
    </button>
  );
}

export default function OptimizationPage() {
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userData, setUserData] = useState(null);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [gmbLocations, setGmbLocations] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [automationKeywords, setAutomationKeywords] = useState([]);
  const [profileDescription, setProfileDescription] = useState("");
  const [savePending, setSavePending] = useState(false);
  const [gmbRefreshPending, setGmbRefreshPending] = useState(false);
  const [syncToGmbPending, setSyncToGmbPending] = useState(false);

  const noop = useCallback(() => {}, []);

  const accountId =
    selectedBusiness?.projectId ||
    selectedBusiness?.googleId ||
    selectedBusiness?.email ||
    "";

  const refreshGmbLocations = useCallback(async () => {
    if (!accountId) return null;
    setGmbRefreshPending(true);
    setError("");
    try {
      const res = await fetch(
        `/api/gmb/location-optimization?accountId=${encodeURIComponent(accountId)}`
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.error || "Could not refresh locations from Google.";
        setError((prev) => prev || msg);
        return null;
      }
      if (Array.isArray(data.locations) && data.locations.length > 0) {
        setGmbLocations(data.locations);
        try {
          localStorage.setItem("locationDetails", JSON.stringify(data.locations));
        } catch {
          /* ignore */
        }
        return data.locations;
      }
      return [];
    } catch (e) {
      setError((prev) => prev || e.message || "GMB refresh failed");
      return null;
    } finally {
      setGmbRefreshPending(false);
    }
  }, [accountId]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
        if (!userId) {
          setError("User ID not found. Please log in again.");
          setLoading(false);
          return;
        }

        try {
          const raw = localStorage.getItem("locationDetails");
          if (raw) {
            const locs = JSON.parse(raw);
            if (Array.isArray(locs)) setGmbLocations(locs);
          }
        } catch {
          /* ignore */
        }

        const [userR, settingsR] = await Promise.allSettled([
          fetch(`/api/auth/signup?userId=${encodeURIComponent(userId)}`),
          fetch("/api/user-settings"),
        ]);

        if (userR.status === "fulfilled" && userR.value.ok) {
          setUserData(await userR.value.json());
        }

        if (settingsR.status === "fulfilled" && settingsR.value.ok) {
          const s = await settingsR.value.json();
          const as = s.automationSettings;
          if (as) {
            setAutomationKeywords(Array.isArray(as.keywords) ? as.keywords : []);
            setProfileDescription(
              typeof as.businessProfileDescription === "string"
                ? as.businessProfileDescription
                : (as.topic || "")
            );
          }
          const savedBiz = s.selectedBusiness;
          if (savedBiz?.projectId || savedBiz?.googleId) {
            setSelectedBusiness(savedBiz);
          }
          if (Array.isArray(s.savedLocations) && s.savedLocations.length > 0) {
            setSelectedLocations(s.savedLocations);
          }
        }
      } catch (e) {
        setError(e.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (sessionStatus !== "authenticated" || !accountId) return;
    void refreshGmbLocations();
  }, [sessionStatus, accountId, refreshGmbLocations]);

  const handleSaveOptimization = useCallback(
    async ({ locationId, description, services, websiteUri, chatUrl, serviceAreaPlaces, regularHours }) => {
      const locId =
        String(locationId || "").trim() ||
        selectedLocations[0]?.locationId ||
        gmbLocations[0]?.locationId ||
        "";
      const desc = typeof description === "string" ? description.trim() : "";
      const svc = typeof services === "string" ? services.trim() : "";
      const website = typeof websiteUri === "string" ? websiteUri.trim() : "";
      const chat = typeof chatUrl === "string" ? chatUrl.trim() : "";
      const places = Array.isArray(serviceAreaPlaces) ? serviceAreaPlaces.map((s) => String(s).trim()).filter(Boolean) : [];
      const hasHours =
        regularHours && typeof regularHours === "object" && Array.isArray(regularHours.periods);

      if (!accountId || !locId) {
        toast.error("Select a Google location, then try again.");
        return;
      }
      if (!desc && !svc && !website && !chat && places.length === 0 && !hasHours) {
        toast.error("Add a description, services, website, WhatsApp or service area to save.");
        return;
      }

      setSavePending(true);
      setError("");
      try {
        const patchBody = { accountId, locationId: locId };
        if (desc) patchBody.description = desc;
        if (svc) patchBody.services = svc;
        if (website) patchBody.websiteUri = website;
        if (chat) patchBody.chatUrl = chat;
        if (places.length > 0) patchBody.serviceAreaPlaces = places;
        if (hasHours) patchBody.regularHours = regularHours;
        const gRes = await fetch("/api/gmb/patch-location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patchBody),
        });
        const gData = await gRes.json().catch(() => ({}));
        if (!gRes.ok) {
          const detailMsg =
            gData.detail?.error?.message ||
            (Array.isArray(gData.results) && gData.results.find((r) => !r.ok)?.data?.error?.message);
          throw new Error(gData.error || detailMsg || "Google update failed");
        }

        const refreshed = await refreshGmbLocations();
        const loc = Array.isArray(refreshed) ? refreshed.find((l) => l.locationId === locId) : null;
        const liveDesc =
          loc && typeof loc.profileDescription === "string" && loc.profileDescription.trim()
            ? loc.profileDescription.trim()
            : desc;
        setProfileDescription(liveDesc);

        toast.success("Updated on Google. Listing refreshed from Google.");
      } catch (e) {
        const msg = e.message || "Save failed";
        setError(msg);
        toast.error(msg);
      } finally {
        setSavePending(false);
      }
    },
    [accountId, selectedLocations, gmbLocations, refreshGmbLocations]
  );

  const handleSyncToGmb = useCallback(
    async (payload) => {
      const locId =
        selectedLocations[0]?.locationId ||
        gmbLocations[0]?.locationId ||
        "";
      if (!accountId || !locId) {
        const msg = "Select a business with a Google location, then try again.";
        setError(msg);
        toast.error(msg);
        throw new Error(msg);
      }
      setSyncToGmbPending(true);
      setError("");
      try {
        const res = await fetch("/api/gmb/patch-location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountId,
            locationId: locId,
            description: payload?.description,
            services:
              typeof payload?.services === "string" && payload.services.trim()
                ? payload.services.trim()
                : undefined,
            // Phone is intentionally not synced to Google.
            websiteUri: payload?.websiteUri,
            chatUrl: payload?.chatUrl,
            serviceAreaText: payload?.serviceAreaText,
            serviceAreaPlaces:
              Array.isArray(payload?.serviceAreaPlaces) && payload.serviceAreaPlaces.length
                ? payload.serviceAreaPlaces
                : undefined,
            regularHours:
              payload?.regularHours &&
              typeof payload.regularHours === "object" &&
              Array.isArray(payload.regularHours.periods)
                ? payload.regularHours
                : undefined,
            googleAccessToken:
              typeof payload?.googleAccessToken === "string" && payload.googleAccessToken.trim()
                ? payload.googleAccessToken.trim()
                : undefined,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const detailMsg =
            data.detail?.error?.message ||
            (Array.isArray(data.results) && data.results.find((r) => !r.ok)?.data?.error?.message);
          throw new Error(data.error || detailMsg || "Google sync failed");
        }
        const n = Array.isArray(data.results) ? data.results.length : 0;
        const refreshed = await refreshGmbLocations();
        const loc = Array.isArray(refreshed) && locId ? refreshed.find((l) => l.locationId === locId) : null;
        if (loc && typeof loc.profileDescription === "string") {
          setProfileDescription(loc.profileDescription.trim());
        }
        toast.success(
          n > 0
            ? `Synced ${n} field${n === 1 ? "" : "s"} to Google. Data reloaded from Google.`
            : "Synced to Google. Data reloaded from Google."
        );
      } catch (e) {
        const msg = e.message || "Google sync failed";
        setError(msg);
        toast.error(msg);
        throw e;
      } finally {
        setSyncToGmbPending(false);
      }
    },
    [accountId, selectedLocations, gmbLocations, refreshGmbLocations]
  );

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "24px 20px 48px" }}>
      <Toaster position="top-right" />
      <BackRow onClick={() => router.push("/user-settings")} />

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
          Business optimization
        </h1>
        <p style={{ margin: "8px 0 0", fontSize: 14, color: "#64748b", lineHeight: 1.55, maxWidth: 720 }}>
          Data loads from the Google Business Information API (<code style={{ fontSize: 12, background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>GET …/locations/&#123;id&#125;</code>
          ) and attributes for WhatsApp. Updates use the official PATCH masks (<code style={{ fontSize: 12, background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>title</code>,{" "}
          <code style={{ fontSize: 12, background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>profile</code>, <code style={{ fontSize: 12, background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>phoneNumbers</code>,{" "}
          <code style={{ fontSize: 12, background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>websiteUri</code>,           <code style={{ fontSize: 12, background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>storefrontAddress</code>,{" "}
          <code style={{ fontSize: 12, background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>serviceArea</code>). Map coordinates are not edited here; service-area search uses your Google address or listing coordinates.{" "}
          <strong>Save changes</strong> (or per-field <strong>Save</strong>) PATCHes Google, then refetches live data. Website Builder saves generated HTML to your account and can push the URL to Google.
        </p>
        {gmbRefreshPending && (
          <p style={{ margin: "8px 0 0", fontSize: 12, color: "#6366f1", fontWeight: 600 }}>
            Refreshing locations from Google…
          </p>
        )}
        {error && (
          <p style={{ margin: "10px 0 0", fontSize: 13, fontWeight: 600, color: "#b91c1c" }}>{error}</p>
        )}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#64748b", fontSize: 14 }}>Loading…</div>
      ) : (
        <BusinessInformationPanel
          layout="embedded"
          manageLocations={false}
          savePending={savePending}
          selectedLocations={selectedLocations}
          setSelectedLocations={noop}
          gmbLocations={gmbLocations}
          preselectedLocationId={selectedLocations[0]?.locationId}
          selectedBusiness={selectedBusiness}
          userData={userData}
          automationKeywords={automationKeywords}
          profileDescription={profileDescription}
          onSaveOptimization={handleSaveOptimization}
          onSyncToGmb={handleSyncToGmb}
          syncToGmbPending={syncToGmbPending}
          onBack={() => router.push("/user-settings")}
        />
      )}
    </div>
  );
}
