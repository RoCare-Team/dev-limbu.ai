"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Loader2, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import BusinessInformationPanel from "@/components/user-settings/BusinessInformationModal";

export default function OptimizationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userData, setUserData] = useState(null);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [gmbLocations, setGmbLocations] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [automationKeywords, setAutomationKeywords] = useState([]);
  const [profileDescription, setProfileDescription] = useState("");
  const [savePending, setSavePending] = useState(false);
  const [saveOk, setSaveOk] = useState("");

  const noop = useCallback(() => { }, []);

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

  const handleSaveDescription = useCallback(
    async (text) => {
      const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
      if (!userId) {
        setError("User ID not found.");
        return;
      }
      setSavePending(true);
      setSaveOk("");
      setError("");
      try {
        const res = await fetch("/api/user-settings/business-description", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, businessProfileDescription: text }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Save failed");
        setProfileDescription(data.businessProfileDescription ?? text);
        setSaveOk("Description saved.");
        setTimeout(() => setSaveOk(""), 4000);
      } catch (e) {
        setError(e.message || "Save failed");
      } finally {
        setSavePending(false);
      }
    },
    []
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
