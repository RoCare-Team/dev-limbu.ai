"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
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

  const noop = useCallback(() => {}, []);

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
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 20px 48px" }}>
      <BackRow onClick={() => router.push("/user-settings")} />

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
          Business optimization
        </h1>
        <p style={{ margin: "8px 0 0", fontSize: 14, color: "#64748b", lineHeight: 1.55, maxWidth: 560 }}>
          Google-style business information editor: review contact details, locations (read-only from Settings), and generate or edit your description with AI.
        </p>
        {saveOk && (
          <p style={{ margin: "10px 0 0", fontSize: 13, fontWeight: 600, color: "#15803d" }}>{saveOk}</p>
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
      )}
    </div>
  );
}
