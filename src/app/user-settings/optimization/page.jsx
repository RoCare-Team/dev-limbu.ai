"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import toast, { Toaster } from "react-hot-toast";
import BusinessInformationPanel from "@/components/user-settings/BusinessInformationModal";

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

  const noop = useCallback(() => { }, []);

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
    async ({ locationId, description, serviceAreaPlaces }) => {
      const locId =
        String(locationId || "").trim() ||
        selectedLocations[0]?.locationId ||
        gmbLocations[0]?.locationId ||
        "";
      const desc = typeof description === "string" ? description.trim() : "";
      const places = Array.isArray(serviceAreaPlaces) ? serviceAreaPlaces.map((s) => String(s).trim()).filter(Boolean) : [];

      if (!accountId || !locId) {
        toast.error("Select a Google location, then try again.");
        return;
      }
      if (!desc && places.length === 0) {
        toast.error("Add a description or at least one service area to save.");
        return;
      }

      setSavePending(true);
      setError("");
      try {
        const patchBody = { accountId, locationId: locId };
        if (desc) patchBody.description = desc;
        if (places.length > 0) patchBody.serviceAreaPlaces = places;
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
            primaryPhone: payload?.primaryPhone,
            websiteUri: payload?.websiteUri,
            chatUrl: payload?.chatUrl,
            serviceAreaText: payload?.serviceAreaText,
            serviceAreaPlaces: Array.isArray(payload?.serviceAreaPlaces) ? payload.serviceAreaPlaces : undefined,
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
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-start gap-4">
            <button
              onClick={() => router.push("/user-settings")}
              className="p-2.5 mt-1 rounded-xl border border-black/5 bg-white hover:bg-slate-50 transition-all shadow-sm group shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-black group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-tighter leading-none mb-2" style={{ fontFamily: "var(--font-heading)" }}>
                Business <span className="text-lemon-hover">Optimization</span>
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] max-w-lg leading-relaxed">
                Review contact details, locations, and optimize your business description with AI.
              </p>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {(saveOk || error) && (
          <div className={`p-4 rounded-2xl mb-8 flex items-center gap-3 border shadow-sm transition-all animate-fadeIn ${error
              ? "bg-red-50 border-red-100 text-red-800"
              : "bg-green-50 border-green-100 text-green-800"
            }`}>
            {error ? <AlertCircle className="w-5 h-5 text-red-500" /> : <CheckCircle2 className="w-5 h-5 text-green-500" />}
            <p className="text-sm font-bold tracking-tight">
              {error || saveOk}
            </p>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-black/5 p-6 sm:p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-50">
              <Loader2 className="w-8 h-8 animate-spin text-black mb-4" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Data...</p>
            </div>
          ) : (
            <div className="animate-fadeIn">
              <BusinessInformationPanel
                layout="embedded"
                manageLocations={false}
                savePending={savePending}
                platformGmb
                setPlatformGmb={noop}
                selectedLocations={selectedLocations}
                setSelectedLocations={noop}
                gmbLocations={gmbLocations}
                selectedBusiness={selectedBusiness}
                userData={userData}
                automationKeywords={automationKeywords}
                profileDescription={profileDescription}
                onConfirmProfileDescription={handleSaveDescription}
                onBack={() => router.push("/user-settings")}
              />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
