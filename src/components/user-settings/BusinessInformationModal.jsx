"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { normalizeGmbLocationRecord } from "@/lib/gmbLocationDataset";
import { GMB_PROFILE_DESCRIPTION_MAX, clampGmbDescription } from "@/lib/gmbConstants";
import {
  getNearbyServiceAreaSuggestions,
  parseServiceAreaPlacesFromText,
  parseAiServiceAreaSuggestionText,
} from "@/lib/gmbServiceAreaSuggestions";
import { clonePeriods } from "@/lib/gmbRegularHours";
import { resolveSiteUserId, isChatbotSiteOwnerId } from "@/lib/resolveSiteUserId";
import OpeningHoursEditor from "@/components/user-settings/OpeningHoursEditor";

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_BUSINESS = {
  title: "DoctorFresh Water Technologies",
  address: "42 Clean Water Ave",
  locality: "Mumbai, Maharashtra",
  websiteUrl: "https://doctorfresh.in",
};
const MOCK_USER = {
  phone: "+91 98765 43210",
  website: "https://doctorfresh.in",
  topic: "Water Purification, RO Systems, Water Filtration, Drinking Water Solutions, Water Treatment",
};
const MOCK_LOCATIONS = [
  { locationId: "loc1", title: "DoctorFresh – Andheri", address: "42 Clean Water Ave", locality: "Andheri West, Mumbai", isVerified: true },
  { locationId: "loc2", title: "DoctorFresh – Pune", address: "7 Hydro Park", locality: "Koregaon Park, Pune", isVerified: false },
];

const TabIconBuilding = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4"/><path d="M9 9v.01M9 12v.01M9 15v.01M9 18v.01"/></svg>
);
const TabIconPhone = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
);
const TabIconPin = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
);
const TabIconClock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
);
const TabIconMore = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
);
const TabIconCategory = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/></svg>
);
const TabIconMenu = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 11h18M3 7h18M3 15h12M3 19h8"/></svg>
);

// `cap` = the location-metadata capability that must be true for the tab to appear
// (drives the profile-aware editor: e.g. Menu only for food-eligible locations).
const TABS = [
  { id: "about", label: "About", Icon: TabIconBuilding },
  { id: "contact", label: "Contact", Icon: TabIconPhone },
  { id: "location", label: "Location", Icon: TabIconPin },
  { id: "hours", label: "Hours", Icon: TabIconClock },
  { id: "category", label: "Attributes", Icon: TabIconCategory },
  { id: "menu", label: "Menu", Icon: TabIconMenu, cap: "canHaveFoodMenus" },
  { id: "more", label: "More", Icon: TabIconMore },
];

/** Slim `locationDetails` rows or full Business Information API `locations[]` items. */
function enrichGmbLocation(loc) {
  if (!loc) return null;
  const accountId = loc.accountId || "";
  const normalized = normalizeGmbLocationRecord(loc, accountId);
  if (!normalized) return null;
  if (Object.prototype.hasOwnProperty.call(loc, "whatsappUri")) {
    return { ...normalized, whatsappUri: typeof loc.whatsappUri === "string" ? loc.whatsappUri.trim() : "" };
  }
  return normalized;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const CheckIcon = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const EditIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const SparkIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
  </svg>
);
const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
);

// ─── Typing animation hook ───────────────────────────────────────────────────
function useTypewriter(text, speed = 16) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed("");
    setDone(false);
    if (!text) { setDone(true); return; }
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(id); setDone(true); }
    }, speed);
    return () => clearInterval(id);
  }, [text]);
  return { displayed, done };
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────
function ConfirmModal({ field, aiContent, onConfirm, onCancel }) {
  const previewText = Array.isArray(aiContent) ? aiContent.join(" · ") : (aiContent || "");
  const { displayed, done } = useTypewriter(previewText, 14);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(15,23,42,.5)", backdropFilter: "blur(5px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{
        background: "#fff", borderRadius: 20, width: "100%", maxWidth: 540,
        boxShadow: "0 24px 60px rgba(0,0,0,.18)",
        animation: "modalIn .25s cubic-bezier(.34,1.56,.64,1)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px 16px",
          background: "linear-gradient(135deg, #FFFDF5, #FEF9C3)",
          borderBottom: "1px solid #FEF08A",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: 13,
            background: "linear-gradient(135deg, #CA8A04, #EAB308)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 14px rgba(202,138,4,.35)",
          }}>
            <SparkIcon size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#1e1b4b" }}>AI Generated Content</div>
            <div style={{ fontSize: 12, color: "#EAB308" }}>
              Review before inserting into <strong style={{ color: "#CA8A04" }}>{field}</strong>
            </div>
          </div>
          <button type="button" onClick={onCancel} style={{
            background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4, display: "flex",
          }}>
            <CloseIcon />
          </button>
        </div>

        {/* Preview with typewriter */}
        <div style={{ padding: "20px 24px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10 }}>
            ✦ Preview
          </div>
          <div style={{
            background: "#f8fafc", borderRadius: 12, padding: "16px",
            border: "1.5px solid #FEF08A", minHeight: 90,
            fontSize: 13, lineHeight: 1.75, color: "#334155",
          }}>
            {Array.isArray(aiContent) ? (
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {aiContent.map((s, i) => (
                  <li key={i} style={{ marginBottom: 5, color: "#334155" }}>{s}</li>
                ))}
              </ul>
            ) : (
              <>
                {displayed}
                {!done && (
                  <span style={{
                    display: "inline-block", width: 2, height: 14,
                    background: "#CA8A04", marginLeft: 1, verticalAlign: "middle",
                    animation: "blink .9s infinite",
                  }} />
                )}
              </>
            )}
          </div>

          {done && (
            <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
              {["✓ SEO Optimized", "✓ Google-ready", "✓ Local keywords"].map(t => (
                <span key={t} style={{
                  fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                  background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534",
                }}>{t}</span>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "12px 24px 20px",
          borderTop: "1px solid #f1f5f9",
          display: "flex", gap: 10, justifyContent: "flex-end",
        }}>
          <button type="button" onClick={onCancel} style={{
            padding: "10px 22px", borderRadius: 10, border: "1.5px solid #e2e8f0",
            background: "#fff", color: "#64748b", fontSize: 13, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
          }}>Cancel</button>
          <button type="button" onClick={() => done && onConfirm(aiContent)} style={{
            padding: "10px 28px", borderRadius: 10, border: "none",
            background: done ? "linear-gradient(135deg, #CA8A04, #EAB308)" : "#FEF08A",
            color: done ? "#fff" : "#9ca3af",
            fontSize: 13, fontWeight: 800,
            cursor: done ? "pointer" : "not-allowed",
            fontFamily: "inherit",
            boxShadow: done ? "0 4px 14px rgba(202,138,4,.35)" : "none",
            transition: "all .3s",
            display: "flex", alignItems: "center", gap: 7,
          }}>
            {done ? <><CheckIcon size={13} color="#fff" /> Insert into Field</> : "Writing…"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Chooser Dropdown ────────────────────────────────────────────────────
function EditChooser({ fieldLabel, onAiClick, onManualClick }) {
  return (
    <div style={{
      position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 300,
      background: "#fff", borderRadius: 14, width: 252,
      boxShadow: "0 8px 32px rgba(0,0,0,.13)", border: "1px solid #FEF08A",
      animation: "popIn .18s cubic-bezier(.34,1.56,.64,1)",
      overflow: "hidden",
    }}>
      <div style={{ padding: "10px 14px 8px", borderBottom: "1px solid #f1f5f9" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".07em" }}>
          Edit · {fieldLabel}
        </span>
      </div>
      <div style={{ padding: 8 }}>
        {/* AI Generated option */}
        <button type="button" onClick={onAiClick} style={{
          width: "100%", display: "flex", alignItems: "center", gap: 10,
          padding: "11px 12px", borderRadius: 10, border: "1.5px solid #FEF08A",
          background: "linear-gradient(135deg, #FFFDF5, #FEF9C3)",
          cursor: "pointer", textAlign: "left", fontFamily: "inherit",
          marginBottom: 7, transition: "all .15s",
        }}
          onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg, #FEF9C3, #FEF9C3)"; e.currentTarget.style.borderColor = "#FDE047"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg, #FFFDF5, #FEF9C3)"; e.currentTarget.style.borderColor = "#FEF08A"; }}
        >
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: "linear-gradient(135deg, #CA8A04, #EAB308)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            boxShadow: "0 3px 8px rgba(202,138,4,.3)",
          }}>
            <SparkIcon />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#854D0E" }}>AI Generated</div>
            <div style={{ fontSize: 11, color: "#EAB308" }}>OpenAI (server) + live GMB facts</div>
          </div>
        </button>

        {/* Manual option */}
        <button type="button" onClick={onManualClick} style={{
          width: "100%", display: "flex", alignItems: "center", gap: 10,
          padding: "11px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0",
          background: "#f8fafc", cursor: "pointer", textAlign: "left",
          fontFamily: "inherit", transition: "all .15s",
        }}
          onMouseEnter={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.borderColor = "#cbd5e1"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
        >
          <div style={{
            width: 34, height: 34, borderRadius: 10, background: "#e2e8f0",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <EditIcon />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#334155" }}>Manual Edit</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>Type your own content</div>
          </div>
        </button>
      </div>
    </div>
  );
}

// ─── Editable Field Row ───────────────────────────────────────────────────────
function FieldRow({
  label,
  fieldId,
  value,
  onChange,
  onSaveField,
  multiline = false,
  businessName,
  categoryHint,
  userData,
  primaryLoc,
  aiContext = {},
  noBottomRule = false,
  aiLoaderSubtitle = "OpenAI is writing this field…",
  maxLength = null,
  /** No AI / Edit menu — always type directly (e.g. description + WhatsApp per Google API). */
  manualOnly = false,
  manualHint = "",
  /** With manualOnly: show “AI Suggestion” while editing (opens preview modal). */
  suggestAiInEdit = false,
  /** With manualOnly + website field: show “AI Website Builder” in edit mode. */
  websiteBuilderInEdit = false,
  onWebsiteBuilder,
  websiteBuilderPending = false,
}) {
  const [showChooser, setShowChooser] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [draftValue, setDraftValue] = useState("");
  const [aiPending, setAiPending] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiSource, setAiSource] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (manualOnly) return;
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowChooser(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [manualOnly]);

  useEffect(() => {
    if (manualMode) return;
    setDraftValue(String(value ?? ""));
  }, [value, manualMode]);

  const startEdit = () => {
    setDraftValue(String(value ?? ""));
    setManualMode(true);
  };

  const cancelEdit = () => {
    setDraftValue(String(value ?? ""));
    setManualMode(false);
  };

  const saveEdit = async () => {
    let next = String(draftValue ?? "");
    if (maxLength != null) next = next.slice(0, maxLength);
    onChange(next);
    if (typeof onSaveField === "function") {
      await Promise.resolve(onSaveField({ fieldId, fieldLabel: label, value: next }));
    }
    setManualMode(false);
  };

  const generateAI = async () => {
    setShowChooser(false);
    setLoading(true);
    try {
      const ctx = {
        ...aiContext,
        businessNameHint: businessName,
        categoryHints: categoryHint,
        websiteHint: userData?.website || primaryLoc?.websiteUrl,
        localityHint: primaryLoc?.locality,
      };
      const res = await fetch("/api/user-settings/business-optimization-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "field",
          fieldId,
          fieldLabel: label,
          context: ctx,
          currentValue: manualMode ? draftValue : value,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAiPending(data.error || "Generation failed. Check OPENAI_API_KEY and try again.");
        return;
      }
      if (fieldId === "services" && Array.isArray(data.value)) {
        setAiPending(data.value);
      } else if (fieldId === "services") {
        try {
          const arr = JSON.parse(String(data.value || "").replace(/```json|```/g, "").trim());
          setAiPending(Array.isArray(arr) ? arr : data.value);
        } catch {
          setAiPending(data.value || "");
        }
      } else {
        let out = String(data.value ?? "").trim() || "No output.";
        if (maxLength != null && fieldId === "description") out = clampGmbDescription(out);
        setAiPending(out);
      }
    } catch {
      setAiPending("Generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const confirmInsert = (content) => {
    let v = Array.isArray(content) ? content.join(", ") : content;
    if (maxLength != null && typeof v === "string" && v.length > maxLength) v = v.slice(0, maxLength);
    onChange(v);
    setAiSource(true);
    setAiPending(null);
  };

  const len = String(value || "").length;

  if (manualOnly) {
    return (
      <div style={{
        marginBottom: noBottomRule ? 0 : 20,
        paddingBottom: noBottomRule ? 0 : 20,
        borderBottom: noBottomRule ? "none" : "1px solid #eef2f6",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: ".07em" }}>
              {label}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em",
              color: "#475569", background: "#f1f5f9", border: "1px solid #e2e8f0",
              padding: "3px 8px", borderRadius: 20,
            }}>
              Manual
            </span>
          </div>
          <button
            type="button"
            onClick={startEdit}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 11, fontWeight: 800,
              color: "#A16207",
              background: "#fff",
              border: "1.5px solid #FDE047",
              borderRadius: 9, padding: "6px 12px",
              cursor: "pointer", fontFamily: "inherit",
              boxShadow: "0 1px 2px rgba(15,23,42,.06)",
            }}
          >
            <EditIcon /> Edit
          </button>
        </div>
        {manualHint ? (
          <p style={{ margin: "0 0 10px", fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{manualHint}</p>
        ) : null}
        {loading && suggestAiInEdit ? <MagicAiLoader marginTop={10} subtitle="Generating suggestion…" /> : null}
        {manualMode ? (
          multiline ? (
            <textarea
              autoFocus
              value={draftValue}
              onChange={(e) => {
                let v = e.target.value;
                if (maxLength != null) v = v.slice(0, maxLength);
                setDraftValue(v);
              }}
              rows={5}
              maxLength={maxLength != null ? maxLength : undefined}
              placeholder={`Enter ${label.toLowerCase()}…`}
              style={{
                width: "100%", boxSizing: "border-box", fontSize: 14, lineHeight: 1.7,
                color: "#334155", border: "1.5px solid #CA8A04", borderRadius: 10,
                padding: "12px 14px", resize: "vertical", fontFamily: "inherit",
                outline: "none", background: "#FFFDF5",
              }}
            />
          ) : (
            <input
              autoFocus
              type="text"
              value={draftValue}
              onChange={(e) => {
                let v = e.target.value;
                if (maxLength != null) v = v.slice(0, maxLength);
                setDraftValue(v);
              }}
              maxLength={maxLength != null ? maxLength : undefined}
              placeholder={`Enter ${label.toLowerCase()}…`}
              style={{
                width: "100%", boxSizing: "border-box", fontSize: 14, color: "#334155",
                border: "1.5px solid #CA8A04", borderRadius: 10, padding: "11px 14px",
                fontFamily: "inherit", outline: "none", background: "#FFFDF5",
              }}
            />
          )
        ) : (
          <div
            style={{
              fontSize: 14, color: value ? "#334155" : "#94a3b8",
              padding: "11px 14px",
              background: "#f8fafc",
              borderRadius: 10,
              border: "1px solid #e8edf5",
              lineHeight: 1.7,
              minHeight: multiline ? 72 : "auto",
              whiteSpace: multiline ? "pre-wrap" : "normal",
              wordBreak: "break-word",
            }}
          >
            {value || `Click Edit to add ${label.toLowerCase()}`}
          </div>
        )}
        {manualMode ? (
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => void saveEdit()}
              style={{
                border: "none",
                borderRadius: 8,
                padding: "8px 14px",
                background: "#CA8A04",
                color: "#fff",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Save
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              style={{
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                padding: "8px 14px",
                background: "#fff",
                color: "#334155",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Cancel
            </button>
            {suggestAiInEdit ? (
              <button
                type="button"
                onClick={() => void generateAI()}
                disabled={loading}
                style={{
                  border: "1px solid #FDE047",
                  borderRadius: 8,
                  padding: "8px 14px",
                  background: loading ? "#FEF9C3" : "#fff",
                  color: "#854D0E",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                {loading ? "…" : "AI Suggestion"}
              </button>
            ) : null}
            {websiteBuilderInEdit && fieldId === "website" && typeof onWebsiteBuilder === "function" ? (
              <button
                type="button"
                onClick={() => void onWebsiteBuilder()}
                disabled={websiteBuilderPending}
                style={{
                  border: "1px solid #FDE047",
                  borderRadius: 8,
                  padding: "8px 14px",
                  background: websiteBuilderPending ? "#f3f4f6" : "#FEFCE8",
                  color: websiteBuilderPending ? "#9ca3af" : "#854D0E",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: websiteBuilderPending ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                {websiteBuilderPending ? "Building…" : "AI Website Builder"}
              </button>
            ) : null}
          </div>
        ) : null}
        {manualOnly && suggestAiInEdit && aiPending !== null ? (
          <ConfirmModal field={label} aiContent={aiPending} onConfirm={confirmInsert} onCancel={() => setAiPending(null)} />
        ) : null}
        {multiline && maxLength != null ? (
          <div style={{
            fontSize: 11, fontWeight: 700, color: "#94a3b8", textAlign: "right", marginTop: 8,
          }}>
            {len} / {maxLength} (Google limit)
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div style={{
      marginBottom: noBottomRule ? 0 : 20,
      paddingBottom: noBottomRule ? 0 : 20,
      borderBottom: noBottomRule ? "none" : "1px solid #eef2f6",
    }}>
      {/* Label + Edit button */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: ".07em" }}>
            {label}
          </span>
          {aiSource && (
            <span style={{
              fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 20,
              background: "linear-gradient(135deg, #FEF9C3, #FEF9C3)",
              border: "1px solid #FDE047", color: "#CA8A04",
              textTransform: "uppercase", letterSpacing: ".05em",
            }}>✦ AI</span>
          )}
        </div>

        <div ref={wrapRef} style={{ position: "relative" }}>
          <button type="button" onClick={() => { setShowChooser(v => !v); setManualMode(false); }} style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 11, fontWeight: 800,
            color: showChooser ? "#fff" : "#A16207",
            background: showChooser ? "linear-gradient(135deg, #CA8A04, #A16207)" : "#fff",
            border: `1.5px solid ${showChooser ? "transparent" : "#FDE047"}`,
            borderRadius: 9, padding: "6px 12px",
            cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
            boxShadow: showChooser ? "0 4px 12px rgba(202,138,4,.35)" : "0 1px 2px rgba(15,23,42,.06)",
          }}>
            <EditIcon /> Edit
          </button>
          {showChooser && (
            <EditChooser
              fieldLabel={label}
              onAiClick={generateAI}
              onManualClick={() => { startEdit(); setShowChooser(false); setAiSource(false); }}
            />
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <MagicAiLoader marginTop={18} subtitle={aiLoaderSubtitle} />
      )}

      {/* Value display */}
      {!loading && (manualMode ? (
          <textarea
            autoFocus
            value={draftValue}
            onChange={(e) => {
              let v = e.target.value;
              if (maxLength != null) v = v.slice(0, maxLength);
              setDraftValue(v);
            }}
            rows={5}
            maxLength={maxLength != null ? maxLength : undefined}
            style={{
              width: "100%", boxSizing: "border-box", fontSize: 14, lineHeight: 1.7,
              color: "#334155", border: "1.5px solid #CA8A04", borderRadius: 10,
              padding: "12px 14px", resize: "vertical", fontFamily: "inherit",
              outline: "none", background: "#FFFDF5",
            }}
          />
      ) : (
        <div style={{
          fontSize: 14, color: value ? "#334155" : "#94a3b8",
          padding: "11px 14px",
          background: aiSource ? "#FFFDF5" : "#f8fafc",
          borderRadius: 10,
          border: aiSource ? "1.5px solid #FDE047" : "1px solid #e8edf5",
          lineHeight: 1.7, minHeight: multiline ? 72 : "auto",
          whiteSpace: multiline ? "pre-wrap" : "normal",
          wordBreak: "break-word",
          transition: "all .3s",
        }}>
          {value || `Click Edit to add ${label.toLowerCase()}`}
        </div>
      ))}
      {manualMode ? (
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button
            type="button"
            onClick={() => void saveEdit()}
            style={{
              border: "none",
              borderRadius: 8,
              padding: "8px 14px",
              background: "#CA8A04",
              color: "#fff",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Save
          </button>
          <button
            type="button"
            onClick={cancelEdit}
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              padding: "8px 14px",
              background: "#fff",
              color: "#334155",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Cancel
          </button>
        </div>
      ) : null}

      {multiline && maxLength != null ? (
        <div style={{
          fontSize: 11,
          fontWeight: 700,
          color: len > maxLength ? "#b91c1c" : "#94a3b8",
          textAlign: "right",
          marginTop: 8,
        }}>
          {len} / {maxLength} (Google limit)
        </div>
      ) : null}

      {aiPending !== null && (
        <ConfirmModal field={label} aiContent={aiPending} onConfirm={confirmInsert} onCancel={() => setAiPending(null)} />
      )}
    </div>
  );
}

/** Grey “Google fields” row — not editable from this screen. */
function DisabledInfoRow({ label, value, hint }) {
  return (
    <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid #eef2f6" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: ".07em" }}>
          {label}
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: ".06em",
            color: "#64748b",
            background: "#f1f5f9",
            border: "1px solid #e2e8f0",
            padding: "4px 10px",
            borderRadius: 20,
          }}
        >
          Not editable
        </span>
      </div>
      <div
        style={{
          fontSize: 14,
          color: value ? "#64748b" : "#94a3b8",
          padding: "11px 14px",
          background: "#f8fafc",
          borderRadius: 10,
          border: "1px solid #e8edf5",
          lineHeight: 1.65,
        }}
      >
        {value || "—"}
      </div>
      {hint ? <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 8, lineHeight: 1.45 }}>{hint}</div> : null}
    </div>
  );
}

function ReadOnlyAddressRow({ label, value, hint, pendingReviewWarning }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 8 }}>
        {label}
      </div>
      {pendingReviewWarning ? (
        <div style={{
          fontSize: 12,
          color: "#92400e",
          background: "#fffbeb",
          border: "1px solid #fde68a",
          borderRadius: 10,
          padding: "10px 12px",
          marginBottom: 10,
          lineHeight: 1.5,
        }}>
          {pendingReviewWarning}
        </div>
      ) : null}
      <div style={{
        fontSize: 14, color: value ? "#334155" : "#94a3b8",
        padding: "12px 14px",
        background: "#f8fafc",
        borderRadius: 10,
        border: "1px solid #e8edf5",
        lineHeight: 1.65,
      }}>
        {value || "—"}
      </div>
      {hint ? <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 8, lineHeight: 1.45 }}>{hint}</div> : null}
    </div>
  );
}

function ReadOnlyLinkRow({ label, href, hint }) {
  if (!href) return null;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 8 }}>
        {label}
      </div>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "#CA8A04",
          textDecoration: "none",
          display: "inline-block",
          padding: "10px 14px",
          background: "#fff",
          borderRadius: 10,
          border: "1px solid #dadce0",
        }}
      >
        Open link
      </a>
      {hint ? <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 8, lineHeight: 1.45 }}>{hint}</div> : null}
    </div>
  );
}

function buildGeocodePayloadFromPrimaryLoc(primaryLoc) {
  if (!primaryLoc || typeof primaryLoc !== "object") return null;
  return {
    fullAddress: typeof primaryLoc.fullAddress === "string" ? primaryLoc.fullAddress.trim() : "",
    address: typeof primaryLoc.address === "string" ? primaryLoc.address.trim() : "",
    locality: typeof primaryLoc.locality === "string" ? primaryLoc.locality.trim() : "",
    administrativeArea: typeof primaryLoc.administrativeArea === "string" ? primaryLoc.administrativeArea.trim() : "",
    postalCode: typeof primaryLoc.postalCode === "string" ? primaryLoc.postalCode.trim() : "",
    regionCode: typeof primaryLoc.regionCode === "string" ? primaryLoc.regionCode.trim() : "",
    businessTitle: typeof primaryLoc.title === "string" ? primaryLoc.title.trim() : "",
  };
}

function hasEnoughAddressForGeocode(payload) {
  if (!payload) return false;
  if (payload.fullAddress && payload.fullAddress.length >= 5) return true;
  if (payload.address && payload.address.length >= 5) return true;
  if (payload.locality && payload.locality.trim().length >= 2) return true;
  return false;
}

// ─── Category attribute helpers ───────────────────────────────────────────────
function attrValuesEqual(a, b) {
  if (Array.isArray(a) || Array.isArray(b)) {
    const aa = Array.isArray(a) ? a : [];
    const bb = Array.isArray(b) ? b : [];
    if (aa.length !== bb.length) return false;
    const sa = [...aa].map(String).sort();
    const sb = [...bb].map(String).sort();
    return sa.every((v, i) => v === sb[i]);
  }
  if (typeof a === "boolean" || typeof b === "boolean") return !!a === !!b;
  return String(a ?? "") === String(b ?? "");
}

function attrIsSet(value, valueType) {
  if (valueType === "BOOL") return value === true;
  if (valueType === "REPEATED_ENUM") return Array.isArray(value) && value.length > 0;
  return value != null && String(value).trim() !== "";
}

const ATTR_TYPE_ICON = {
  URL: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
  ),
  BOOL: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="6" width="22" height="12" rx="6"/><circle cx="16" cy="12" r="3"/></svg>
  ),
  ENUM: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
  ),
  REPEATED_ENUM: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
  ),
};

// ─── Category Attribute Row (BOOL / ENUM / REPEATED_ENUM / URL) ────────────────
// Renders one Google category attribute by its valueType, with an AI-suggest button
// that proposes a value the user reviews (ConfirmModal) before it is applied. The
// list of attributes is category-driven (from /api/gmb/category-fields). The per-row
// Save button only appears once the value differs from what is live on Google.
function AttributeRow({ attr, value, original, onChange, onSave, saving }) {
  const { displayName, valueType, options = [] } = attr;
  const dirty = !attrValuesEqual(value, original);
  const isSet = attrIsSet(value, valueType);

  const toggleRepeated = (optVal) => {
    const cur = Array.isArray(value) ? value : [];
    onChange(cur.includes(optVal) ? cur.filter((v) => v !== optVal) : [...cur, optVal]);
  };

  const chipBtn = (active) => ({
    padding: "7px 13px", borderRadius: 9, cursor: "pointer", fontFamily: "inherit",
    fontSize: 12.5, fontWeight: 700, transition: "all .15s",
    border: active ? "1.5px solid #CA8A04" : "1.5px solid #e2e8f0",
    background: active ? "rgba(202,138,4,.08)" : "#fff",
    color: active ? "#854D0E" : "#64748b",
  });

  return (
    <div
      style={{
        marginBottom: 10,
        padding: "13px 15px",
        borderRadius: 13,
        border: `1.5px solid ${dirty ? "#FDE047" : "#eef2f6"}`,
        background: dirty ? "linear-gradient(135deg,#FFFDF5,#FEFCE8)" : "#fff",
        boxShadow: dirty ? "0 4px 14px rgba(202,138,4,.10)" : "0 1px 2px rgba(15,23,42,.03)",
        transition: "all .18s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
          <span style={{
            width: 26, height: 26, borderRadius: 8, flexShrink: 0,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            background: isSet ? "linear-gradient(135deg,#FEF9C3,#FEF9C3)" : "#f1f5f9",
            color: isSet ? "#CA8A04" : "#94a3b8",
          }}>
            {ATTR_TYPE_ICON[valueType] || ATTR_TYPE_ICON.BOOL}
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis" }}>
            {displayName}
          </span>
          {dirty && (
            <span style={{
              fontSize: 9.5, fontWeight: 800, letterSpacing: ".04em", textTransform: "uppercase",
              color: "#CA8A04", background: "#FEF9C3", border: "1px solid #FDE047",
              padding: "2px 7px", borderRadius: 20, flexShrink: 0,
            }}>
              Unsaved
            </span>
          )}
        </div>
        <span style={{
          fontSize: 10.5, fontWeight: 700, padding: "3px 9px", borderRadius: 20, flexShrink: 0,
          color: isSet ? "#166534" : "#94a3b8",
          background: isSet ? "#f0fdf4" : "#f8fafc",
          border: `1px solid ${isSet ? "#bbf7d0" : "#e2e8f0"}`,
        }}>
          {isSet ? "✓ Set" : "Not set"}
        </span>
      </div>

      {valueType === "BOOL" && (
        <div style={{ display: "inline-flex", gap: 6, background: "#f1f5f9", padding: 3, borderRadius: 11 }}>
          {[{ v: false, l: "No" }, { v: true, l: "Yes" }].map((o) => {
            const active = !!value === o.v;
            return (
              <button
                key={o.l}
                type="button"
                onClick={() => onChange(o.v)}
                style={{
                  padding: "6px 20px", borderRadius: 9, border: "none", cursor: "pointer",
                  fontFamily: "inherit", fontSize: 12.5, fontWeight: 800, transition: "all .15s",
                  background: active ? (o.v ? "linear-gradient(135deg,#CA8A04,#EAB308)" : "#fff") : "transparent",
                  color: active ? (o.v ? "#fff" : "#0f172a") : "#94a3b8",
                  boxShadow: active ? "0 2px 6px rgba(15,23,42,.10)" : "none",
                }}
              >
                {o.l}
              </button>
            );
          })}
        </div>
      )}

      {valueType === "ENUM" && (
        <select
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0",
            fontSize: 13, fontFamily: "inherit", color: "#0f172a", background: "#fff", cursor: "pointer",
          }}
        >
          <option value="">— Select —</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      )}

      {valueType === "REPEATED_ENUM" && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {options.map((o) => {
            const on = Array.isArray(value) && value.includes(o.value);
            return (
              <button key={o.value} type="button" onClick={() => toggleRepeated(o.value)} style={{ ...chipBtn(on), borderRadius: 20 }}>
                {on ? "✓ " : ""}{o.label}
              </button>
            );
          })}
        </div>
      )}

      {valueType === "URL" && (
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex" }}>
            {ATTR_TYPE_ICON.URL}
          </span>
          <input
            type="url"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://…"
            style={{
              width: "100%", padding: "10px 12px 10px 32px", borderRadius: 10, border: "1.5px solid #e2e8f0",
              fontSize: 13, fontFamily: "inherit", color: "#0f172a",
            }}
          />
        </div>
      )}

      {dirty && typeof onSave === "function" && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 11, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => void onSave()}
            disabled={saving}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 16px", borderRadius: 9,
              border: "none", cursor: saving ? "wait" : "pointer",
              background: "linear-gradient(135deg, #CA8A04, #EAB308)", color: "#fff",
              fontSize: 12, fontWeight: 800, fontFamily: "inherit",
              boxShadow: "0 3px 10px rgba(202,138,4,.3)",
            }}
          >
            {saving ? "Saving…" : "Save to Google"}
          </button>
          <span style={{ fontSize: 11.5, color: "#94a3b8" }}>
            or use <strong style={{ color: "#CA8A04" }}>Save changes</strong> below
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Service price helpers ────────────────────────────────────────────────────
// Service price uses Google's real ServiceItem.price (Money) field — the same one the
// GMB dashboard edits. No price → omit; Free → zero amount; Fixed → the entered amount.
// (The public API has no "From/starts-at" flag, so it is not offered here.)
const SERVICE_PRICE_TYPES = [
  { value: "none", label: "No price" },
  { value: "free", label: "Free" },
  { value: "fixed", label: "Fixed" },
];
/** Hydrate raw Google serviceItems [{title, description, priceType, price, category}] into UI items. */
function hydrateServiceItems(list) {
  return (Array.isArray(list) ? list : []).map((s) => ({
    title: String(s?.title || "").trim(),
    description: String(s?.description || "").trim(),
    priceType: s?.priceType || "none",
    price: s?.price != null ? String(s.price) : "",
    // Category (gcid) this service belongs to — empty means the primary category.
    category: String(s?.category || s?.categoryGcid || "").replace(/^categories\//, "").trim(),
  }));
}
/** Collapse UI items back to the shape the API expects (title + description + price + category). */
function serviceItemsForGoogle(list) {
  return (Array.isArray(list) ? list : [])
    .map((s) => ({
      title: String(s?.title || "").trim(),
      description: String(s?.description || "").trim(),
      priceType: s?.priceType || "none",
      price: s?.price || "",
      category: String(s?.category || "").replace(/^categories\//, "").trim(),
    }))
    .filter((s) => s.title);
}

// Minimal CSV parser — handles quoted fields, embedded commas, escaped quotes ("") and CRLF.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  const s = String(text || "").replace(/^﻿/, ""); // strip BOM
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field); field = "";
    } else if (c === "\n") {
      row.push(field); rows.push(row); row = []; field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => String(c).trim() !== ""));
}

// Map parsed CSV rows -> service items. Recognises a header row (Service/Title,
// Description, Price) or falls back to positional columns [title, description, price].
function csvRowsToServiceItems(rows) {
  if (!rows.length) return [];
  const header = rows[0].map((h) => String(h).trim().toLowerCase());
  const looksLikeHeader = header.some((h) => /service|title|name|desc|price/.test(h));
  let idx = { title: 0, description: 1, price: 2 };
  let dataRows = rows;
  if (looksLikeHeader) {
    const find = (...keys) => header.findIndex((h) => keys.some((k) => h.includes(k)));
    const tIdx = find("service", "title", "name");
    idx = { title: tIdx < 0 ? 0 : tIdx, description: find("desc"), price: find("price", "amount", "cost") };
    dataRows = rows.slice(1);
  }
  const out = [];
  for (const r of dataRows) {
    const title = String(r[idx.title] ?? "").trim();
    if (!title) continue;
    const description = idx.description >= 0 ? String(r[idx.description] ?? "").trim() : "";
    const priceRaw = idx.price >= 0 ? String(r[idx.price] ?? "").trim() : "";
    let priceType = "none";
    let price = "";
    if (/^free$/i.test(priceRaw)) {
      priceType = "free";
    } else {
      const num = priceRaw.replace(/[^\d.]/g, "");
      if (num) { priceType = "fixed"; price = num; }
    }
    out.push({ title: title.slice(0, 140), description: description.slice(0, 300), priceType, price });
  }
  return out;
}

// ─── Services editor (title + description + price per service) ─────────────────
// Each service is { title, description, priceType, price }. AI generates title +
// description; user reviews in the ConfirmModal before they replace the list. Saved as
// Google free-form serviceItems with a real ServiceItem.price (Money).
// One editable service row (title + description + price + per-row AI description).
function ServiceRow({ it, gi, onUpdate, onRemove, onGenDesc, descBusy }) {
  return (
    <div style={{ marginBottom: 10, padding: "12px 13px", borderRadius: 12, border: "1.5px solid #eef2f6", background: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <input
          value={it.title || ""}
          onChange={(e) => onUpdate(gi, "title", e.target.value)}
          placeholder="Service title (e.g. RO Water Purifier Installation)"
          maxLength={140}
          style={{ flex: 1, padding: "9px 11px", borderRadius: 9, border: "1.5px solid #e2e8f0", fontSize: 13, fontWeight: 600, fontFamily: "inherit", color: "#0f172a" }}
        />
        <button
          type="button"
          onClick={() => onRemove(gi)}
          aria-label="Remove service"
          style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 8, border: "1.5px solid #fee2e2", background: "#fff5f5", color: "#ef4444", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
        >
          <CloseIcon />
        </button>
      </div>
      <div style={{ position: "relative" }}>
        <textarea
          value={it.description || ""}
          onChange={(e) => onUpdate(gi, "description", e.target.value)}
          placeholder="Short description (optional, max 300 chars)"
          maxLength={300}
          rows={2}
          style={{ width: "100%", boxSizing: "border-box", padding: "9px 11px 9px 11px", paddingRight: it.title ? 96 : 11, borderRadius: 9, border: "1.5px solid #e2e8f0", fontSize: 12.5, fontFamily: "inherit", color: "#334155", resize: "vertical" }}
        />
        {it.title && String(it.title).trim() ? (
          <button
            type="button"
            onClick={() => void onGenDesc(gi)}
            disabled={descBusy}
            title="Generate description from the title with AI"
            style={{
              position: "absolute", top: 7, right: 7,
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "5px 9px", borderRadius: 8,
              border: `1px solid ${!(it.description || "").trim() ? "#CA8A04" : "#FDE047"}`,
              background: descBusy ? "#FEF9C3" : !(it.description || "").trim() ? "#CA8A04" : "#FEFCE8",
              color: descBusy ? "#854D0E" : !(it.description || "").trim() ? "#fff" : "#854D0E",
              fontSize: 11, fontWeight: 800, cursor: descBusy ? "wait" : "pointer", fontFamily: "inherit",
            }}
          >
            <SparkIcon size={11} /> {descBusy ? "…" : "AI"}
          </button>
        ) : null}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: "#64748b" }}>Price</span>
        <select
          value={it.priceType || "none"}
          onChange={(e) => onUpdate(gi, "priceType", e.target.value)}
          style={{ padding: "8px 11px", borderRadius: 9, border: "1.5px solid #e2e8f0", fontSize: 12.5, fontFamily: "inherit", color: "#0f172a", background: "#fff", cursor: "pointer" }}
        >
          {SERVICE_PRICE_TYPES.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {it.priceType === "fixed" && (
          <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
            <span style={{ position: "absolute", left: 10, color: "#94a3b8", fontSize: 12.5 }}>₹</span>
            <input
              value={it.price || ""}
              onChange={(e) => onUpdate(gi, "price", e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="Service price (INR)"
              inputMode="decimal"
              style={{ width: 150, padding: "8px 11px 8px 22px", borderRadius: 9, border: "1.5px solid #e2e8f0", fontSize: 12.5, fontFamily: "inherit", color: "#0f172a" }}
            />
          </div>
        )}
        <span style={{ fontSize: 10.5, color: "#94a3b8" }}>Saved to Google&apos;s service price field.</span>
      </div>
    </div>
  );
}

// Services editor — grouped BY CATEGORY (primary + each sub-category). Every service
// is { title, description, priceType, price, category } where `category` is the gcid
// it belongs to (empty = primary). Each category gets its own section with three easy
// ways to add services: one-click (Google's predefined types for that exact category),
// manual (+ Add service), and CSV import. AI generate is a per-category fallback for
// categories Google has no predefined types for. Saved as free-form serviceItems
// tagged with their category.
function ServiceItemsEditor({
  items,
  onChange,
  aiContext,
  businessName,
  categoryHint,
  onSave,
  savePending,
  categories,
  regionCode,
  languageCode,
  accountId,
}) {
  const list = Array.isArray(items) ? items : [];
  const [err, setErr] = useState("");
  const [descBusyIdx, setDescBusyIdx] = useState(-1);
  const [csvTargetGcid, setCsvTargetGcid] = useState("");
  const [aiBusyGcid, setAiBusyGcid] = useState(null);
  const [pending, setPending] = useState(null); // { gcid, items: [{ title, description }] }
  const [predefined, setPredefined] = useState({}); // { gcid: [{ serviceTypeId, displayName }] }
  const fileRef = useRef(null);

  // The category sections. In GMB-sync mode we get the real primary + sub-categories;
  // otherwise fall back to a single un-tagged section so the editor still works.
  const sections = useMemo(() => {
    const real = (Array.isArray(categories) ? categories : []).filter((c) => c && c.gcid);
    if (real.length) {
      return real.map((c, i) => ({
        gcid: c.gcid,
        displayName: c.displayName || (i === 0 ? "Primary category" : "Category"),
        primary: c.primary ?? i === 0,
      }));
    }
    return [{ gcid: "", displayName: categoryHint?.[0] || "Services", primary: true }];
  }, [categories, categoryHint]);

  const defaultGcid = sections[0]?.gcid || "";
  const knownGcids = useMemo(() => new Set(sections.map((s) => s.gcid).filter(Boolean)), [sections]);

  // Which section an item belongs to: its own category if it's one of ours, else primary.
  const sectionGcidFor = useCallback(
    (it) => {
      const c = String(it?.category || "").replace(/^categories\//, "").trim();
      return c && knownGcids.has(c) ? c : defaultGcid;
    },
    [knownGcids, defaultGcid]
  );

  // Group items -> Map(gcid -> [{ it, gi }]), keeping the global index for edits.
  const grouped = useMemo(() => {
    const map = new Map(sections.map((s) => [s.gcid, []]));
    list.forEach((it, gi) => {
      const g = sectionGcidFor(it);
      if (!map.has(g)) map.set(g, []);
      map.get(g).push({ it, gi });
    });
    return map;
  }, [list, sections, sectionGcidFor]);

  // Predefined Google service types per category (the one-click source). Live, no DB.
  const gcidsKey = useMemo(() => sections.map((s) => s.gcid).filter(Boolean).join(","), [sections]);
  useEffect(() => {
    if (!gcidsKey) { setPredefined({}); return; }
    let cancelled = false;
    (async () => {
      try {
        const params = new URLSearchParams({
          names: gcidsKey,
          regionCode: regionCode || "IN",
          languageCode: languageCode || "en",
          accountId: accountId || "",
        });
        const res = await fetch(`/api/gmb/category-service-types?${params.toString()}`);
        const data = await res.json().catch(() => ({}));
        if (cancelled || !res.ok) return;
        const out = {};
        for (const [g, v] of Object.entries(data.byCategory || {})) {
          out[g] = Array.isArray(v?.serviceTypes) ? v.serviceTypes : [];
        }
        setPredefined(out);
      } catch {
        /* one-click just won't show — manual / CSV / AI still work */
      }
    })();
    return () => { cancelled = true; };
  }, [gcidsKey, regionCode, languageCode, accountId]);

  // ── Mutations (all update the flat list) ──────────────────────────────────────
  const updateItem = (gi, key, val) =>
    onChange(list.map((it, idx) => (idx === gi ? { ...it, [key]: val } : it)));
  const removeItem = (gi) => onChange(list.filter((_, idx) => idx !== gi));
  const addManual = (gcid) =>
    onChange([...list, { title: "", description: "", priceType: "none", price: "", category: gcid }]);
  const addPredefined = (gcid, displayName) => {
    const dn = String(displayName || "").trim();
    if (!dn) return;
    const target = gcid || defaultGcid;
    const exists = list.some(
      (it) => sectionGcidFor(it) === target && String(it.title || "").trim().toLowerCase() === dn.toLowerCase()
    );
    if (exists) return;
    onChange([...list, { title: dn, description: "", priceType: "none", price: "", category: gcid }]);
  };

  // Per-row AI description.
  const genDescription = async (gi) => {
    const title = String(list[gi]?.title || "").trim();
    if (!title) return;
    setDescBusyIdx(gi);
    try {
      const gcid = sectionGcidFor(list[gi]);
      const catName = sections.find((s) => s.gcid === gcid)?.displayName || categoryHint?.[0] || "";
      const ctx = {
        ...(aiContext || {}),
        businessNameHint: businessName,
        categoryHints: catName ? [catName] : categoryHint,
        primaryCategory: catName || categoryHint?.[0] || "",
      };
      const res = await fetch("/api/user-settings/business-optimization-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "serviceDescription", title, context: ctx }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.error || "Could not generate description"); return; }
      const desc = String(data.description || "").trim();
      if (desc) updateItem(gi, "description", desc.slice(0, 300));
    } catch {
      toast.error("Could not generate description");
    } finally {
      setDescBusyIdx(-1);
    }
  };

  // CSV import into ONE category.
  const importCsvInto = async (gcid, file) => {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = csvRowsToServiceItems(parseCsv(text)).map((s) => ({ ...s, category: gcid }));
      if (!parsed.length) {
        setErr("No valid rows found. Use columns: Service, Description, Price.");
        return;
      }
      onChange([...list, ...parsed]);
      setErr("");
      toast.success(`Imported ${parsed.length} service${parsed.length === 1 ? "" : "s"} from CSV.`);
    } catch {
      setErr("Could not read the CSV file. Make sure it is a valid .csv.");
    }
  };

  // AI generate (fallback) for ONE category -> review -> append tagged to that category.
  const generateFor = async (gcid, displayName) => {
    setAiBusyGcid(gcid || "__primary__");
    setErr("");
    try {
      const hints = displayName ? [displayName] : categoryHint;
      const ctx = {
        ...(aiContext || {}),
        businessNameHint: businessName,
        categoryHints: hints,
        primaryCategory: displayName || categoryHint?.[0] || "",
      };
      const res = await fetch("/api/user-settings/business-optimization-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "serviceItems", context: ctx }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(data.error || "AI generation failed. Check OPENAI_API_KEY."); return; }
      const gen = Array.isArray(data.items) ? data.items : [];
      if (!gen.length) { setErr("AI returned no services. Try again."); return; }
      setPending({
        gcid,
        items: gen.map((p) => ({ title: String(p.title || "").trim(), description: String(p.description || "").trim() })),
      });
    } catch {
      setErr("AI generation failed. Try again.");
    } finally {
      setAiBusyGcid(null);
    }
  };

  const applyPending = () => {
    if (pending) {
      const tagged = pending.items
        .filter((p) => p.title)
        .map((p) => ({ title: p.title, description: p.description, priceType: "none", price: "", category: pending.gcid }));
      onChange([...list, ...tagged]);
    }
    setPending(null);
  };

  const smallBtn = (extra) => ({
    display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 9,
    fontSize: 12, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", ...extra,
  });

  return (
    <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid #eef2f6" }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Services by category</div>
        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
          Every category has its own services. Add with one click from Google&apos;s suggestions, type your own, or import a CSV (<strong>Service, Description, Price</strong>).
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; void importCsvInto(csvTargetGcid, f); }}
      />

      {sections.map((section) => {
        const sectionItems = grouped.get(section.gcid) || [];
        const added = new Set(sectionItems.map(({ it }) => String(it.title || "").trim().toLowerCase()));
        const chips = (predefined[section.gcid] || []).filter((t) => !added.has(t.displayName.toLowerCase()));
        const aiBusy = aiBusyGcid === (section.gcid || "__primary__");
        return (
          <div key={section.gcid || "__primary__"} style={{ marginBottom: 16, padding: 14, borderRadius: 14, border: "1.5px solid #F1E4B8", background: "#FFFDF5" }}>
            {/* Section header */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13.5, fontWeight: 800, color: "#713F12" }}>
                {section.displayName}
                <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 6, background: section.primary ? "#CA8A04" : "#FEF08A", color: section.primary ? "#fff" : "#854D0E" }}>
                  {section.primary ? "Primary" : "Sub"}
                </span>
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#a1863b", background: "#FEF9C3", border: "1px solid #FEF08A", borderRadius: 20, padding: "2px 9px" }}>
                {sectionItems.length} service{sectionItems.length === 1 ? "" : "s"}
              </span>
            </div>

            {/* One-click predefined Google service types */}
            {chips.length ? (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#854D0E", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 7, display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <SparkIcon size={12} /> One-click from Google
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {chips.map((t) => (
                    <button
                      key={t.serviceTypeId || t.displayName}
                      type="button"
                      onClick={() => addPredefined(section.gcid, t.displayName)}
                      style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, padding: "6px 12px", borderRadius: 20, background: "#fff", color: "#854D0E", fontWeight: 700, border: "1.5px dashed #FDE047", cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#FEFCE8"; e.currentTarget.style.borderStyle = "solid"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderStyle = "dashed"; }}
                    >
                      <span style={{ color: "#CA8A04", fontWeight: 900 }}>+</span> {t.displayName}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Rows */}
            {sectionItems.length === 0 ? (
              <div style={{ padding: "12px", borderRadius: 10, border: "1px dashed #E4CE86", background: "#fff", color: "#a1863b", fontSize: 12, textAlign: "center", marginBottom: 10 }}>
                No services in this category yet — add one below.
              </div>
            ) : (
              sectionItems.map(({ it, gi }) => (
                <ServiceRow
                  key={gi}
                  it={it}
                  gi={gi}
                  onUpdate={updateItem}
                  onRemove={removeItem}
                  onGenDesc={genDescription}
                  descBusy={descBusyIdx === gi}
                />
              ))
            )}

            {/* Per-category actions */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
              <button type="button" onClick={() => addManual(section.gcid)} style={smallBtn({ border: "1.5px solid #e2e8f0", background: "#fff", color: "#475569" })}>
                + Add service
              </button>
              <button
                type="button"
                onClick={() => { setCsvTargetGcid(section.gcid); fileRef.current?.click(); }}
                style={smallBtn({ border: "1.5px solid #FDE047", background: "#fff", color: "#854D0E" })}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 15V3M7 8l5-5 5 5M5 21h14" /></svg>
                Import CSV
              </button>
              <button
                type="button"
                onClick={() => void generateFor(section.gcid, section.displayName)}
                disabled={aiBusy}
                style={smallBtn({ border: "1.5px solid #FEF08A", background: "linear-gradient(135deg, #FFFDF5, #FEF9C3)", color: "#854D0E", cursor: aiBusy ? "wait" : "pointer" })}
              >
                <SparkIcon /> {aiBusy ? "Generating…" : "AI generate"}
              </button>
            </div>
          </div>
        );
      })}

      {err ? <div style={{ marginTop: 8, fontSize: 12, color: "#b91c1c", fontWeight: 600 }}>{err}</div> : null}

      {typeof onSave === "function" && list.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <button
            type="button"
            onClick={() => void onSave()}
            disabled={savePending}
            style={{
              padding: "7px 16px", borderRadius: 9, border: "none", cursor: savePending ? "wait" : "pointer",
              background: "linear-gradient(135deg, #CA8A04, #EAB308)", color: "#fff",
              fontSize: 12, fontWeight: 800, fontFamily: "inherit", boxShadow: "0 3px 10px rgba(202,138,4,.3)",
            }}
          >
            {savePending ? "Saving…" : "Save services to Google"}
          </button>
        </div>
      )}

      {pending && (
        <ConfirmModal
          field="Services"
          aiContent={pending.items.map((p) => (p.description ? `${p.title} — ${p.description}` : p.title))}
          onConfirm={applyPending}
          onCancel={() => setPending(null)}
        />
      )}
    </div>
  );
}

// ─── Category picker (editable primary + Google-supported sub categories) ──────
// Primary + additional (sub) categories are searched against Google's category
// catalog (/api/gmb/categories-search) so only Google-supported categories can be
// chosen. When a primary is set, related sub-categories are suggested automatically.
// Saved via categories PATCH (updateMask=categories).
function useCategorySearch(regionCode, languageCode, accountId) {
  const base = `regionCode=${encodeURIComponent(regionCode || "IN")}&languageCode=${encodeURIComponent(
    languageCode || "en"
  )}&accountId=${encodeURIComponent(accountId || "")}`;

  const search = useCallback(
    async (query) => {
      const q = String(query || "").trim();
      if (q.length < 2) return [];
      try {
        const res = await fetch(`/api/gmb/categories-search?query=${encodeURIComponent(q)}&${base}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return [];
        return Array.isArray(data.categories) ? data.categories : [];
      } catch {
        return [];
      }
    },
    [base]
  );

  // Name-similarity sub-category suggestions for a chosen primary (fetched live from
  // Google and ranked by token overlap — no local catalog).
  const suggest = useCallback(
    async (displayName, exclude = []) => {
      const dn = String(displayName || "").trim();
      if (!dn) return [];
      try {
        const res = await fetch(
          `/api/gmb/categories-search?similarTo=${encodeURIComponent(dn)}&exclude=${encodeURIComponent(
            (exclude || []).join(",")
          )}&${base}`
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return [];
        return Array.isArray(data.categories) ? data.categories : [];
      } catch {
        return [];
      }
    },
    [base]
  );

  return { search, suggest };
}

// Gold-on-white theme for the category editor (primary #CA8A04).
const CAT = {
  gold: "#CA8A04",
  goldHover: "#A16207",
  goldText: "#854D0E",
  goldDeep: "#713F12",
  g50: "#FEFCE8",
  g100: "#FEF9C3",
  g200: "#FEF08A",
  g300: "#FDE047",
  softBorder: "#F1E4B8",
  ring: "rgba(202,138,4,.16)",
};

function CategorySearchBox({ placeholder, search, exclude, onPick, autoFocus = false }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef(null);
  const excludeSet = useMemo(() => new Set((exclude || []).map((n) => n)), [exclude]);

  useEffect(() => {
    const handler = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setResults([]); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    const id = setTimeout(async () => {
      const r = await search(q);
      if (cancelled) return;
      setResults(r.filter((c) => !excludeSet.has(c.name)));
      setActive(0);
      setLoading(false);
      setOpen(true);
    }, 280);
    return () => { cancelled = true; clearTimeout(id); };
  }, [query, search, excludeSet]);

  const pick = (c) => { onPick(c); setQuery(""); setResults([]); setOpen(false); setActive(0); };

  const onKeyDown = (e) => {
    if (!open || !results.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (results[active]) pick(results[active]); }
    else if (e.key === "Escape") { setOpen(false); }
  };

  return (
    <div ref={boxRef} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: focused ? CAT.gold : "#9ca3af", display: "flex", transition: "color .15s" }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
        </span>
        <input
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { setFocused(true); if (results.length) setOpen(true); }}
          onBlur={() => setFocused(false)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          style={{
            width: "100%", boxSizing: "border-box", padding: "13px 40px", borderRadius: 12,
            border: `1.5px solid ${focused ? CAT.gold : "#e5e7eb"}`, fontSize: 15, fontFamily: "inherit",
            color: "#111827", background: "#fff", outline: "none",
            transition: "border-color .15s, box-shadow .15s",
            boxShadow: focused ? `0 0 0 4px ${CAT.ring}` : "0 1px 2px rgba(0,0,0,.04)",
          }}
        />
        {loading ? (
          <span style={{ position: "absolute", right: 14, top: "50%", marginTop: -8, width: 16, height: 16, borderRadius: "50%", border: `2px solid ${CAT.g200}`, borderTopColor: CAT.gold, animation: "spin .7s linear infinite" }} />
        ) : null}
      </div>
      {open && (loading || results.length > 0) && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 300,
          background: "#fff", borderRadius: 14, border: `1px solid ${CAT.softBorder}`,
          boxShadow: "0 12px 34px rgba(120,90,10,.14)", maxHeight: 300, overflowY: "auto", padding: 6,
          animation: "popIn .16s ease",
        }}>
          {loading ? (
            <div style={{ padding: "12px 14px", fontSize: 14, color: "#9ca3af" }}>Searching…</div>
          ) : (
            results.map((c, i) => (
              <button
                key={c.name}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(c)}
                style={{
                  width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 10, padding: "11px 13px",
                  borderRadius: 10, border: "none", cursor: "pointer", fontSize: 14.5, color: "#1f2937", fontFamily: "inherit",
                  background: i === active ? CAT.g50 : "#fff", transition: "background .12s",
                }}
              >
                <span style={{ width: 22, height: 22, borderRadius: 7, background: i === active ? CAT.g100 : "#f3f4f6", color: CAT.gold, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14" /></svg>
                </span>
                {c.displayName}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function CategoryEditor({
  disabled,
  primary,          // { name, displayName } | null
  additional,       // [{ name, displayName }]
  onChange,         // ({ primary?, additional? }) => void
  onSave,
  saving,
  dirty,
  regionCode,
  languageCode,
  accountId,
  fallbackChips = [],
}) {
  const { search, suggest } = useCategorySearch(regionCode, languageCode, accountId);
  const [editingPrimary, setEditingPrimary] = useState(false);
  const [suggested, setSuggested] = useState([]);

  const excludeNames = useMemo(
    () => [primary?.name, ...additional.map((a) => a.name)].filter(Boolean),
    [primary, additional]
  );

  // Suggest Google-supported sub-categories related to the primary category, ranked
  // by name similarity. Categories come live from Google — show all of them.
  useEffect(() => {
    const dn = primary?.displayName || "";
    if (disabled || !dn) { setSuggested([]); return; }
    let cancelled = false;
    (async () => {
      const r = await suggest(dn, excludeNames);
      if (cancelled) return;
      setSuggested(r);
    })();
    return () => { cancelled = true; };
  }, [primary?.displayName, disabled, suggest, excludeNames]);

  const sectionCard = {
    marginBottom: 22,
    padding: 20,
    borderRadius: 16,
    background: "#fff",
    border: `1px solid ${CAT.softBorder}`,
    boxShadow: "0 1px 2px rgba(120,90,10,.05)",
  };
  const sectionTitle = (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 8, flexWrap: "wrap" }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 9, fontSize: 14, fontWeight: 800, color: CAT.goldDeep }}>
        <span style={{ width: 28, height: 28, borderRadius: 9, background: CAT.g100, color: CAT.gold, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <TabIconCategory />
        </span>
        Business categories
      </span>
      {dirty ? (
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".04em", textTransform: "uppercase", color: CAT.goldText, background: CAT.g50, border: `1px solid ${CAT.g200}`, padding: "4px 10px", borderRadius: 20 }}>● Unsaved</span>
      ) : null}
    </div>
  );

  if (disabled) {
    return (
      <div style={sectionCard}>
        {sectionTitle}
        <p style={{ margin: "0 0 14px", fontSize: 13.5, color: "#6b7280", lineHeight: 1.6 }}>
          Connect a Google location to edit your primary category and add Google-supported sub-categories.
        </p>
        {fallbackChips.length ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {fallbackChips.map((c, i) => (
              <span key={`${c}-${i}`} style={{ fontSize: 13.5, padding: "8px 15px", borderRadius: 22, background: i === 0 ? CAT.g100 : "#f3f4f6", color: i === 0 ? CAT.goldText : "#4b5563", fontWeight: i === 0 ? 800 : 600, border: `1px solid ${i === 0 ? CAT.g200 : "#e5e7eb"}` }}>{c}</span>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  const atMax = additional.length >= 9;

  return (
    <div style={sectionCard}>
      {sectionTitle}

      {/* Primary category */}
      <div style={{ fontSize: 12.5, fontWeight: 800, color: "#374151", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 9 }}>Primary category</div>
      {editingPrimary ? (
        <div style={{ marginBottom: 8 }}>
          <CategorySearchBox
            autoFocus
            placeholder="Search Google categories — e.g. Water Purification Company"
            search={search}
            exclude={excludeNames}
            onPick={(c) => { onChange({ primary: c }); setEditingPrimary(false); }}
          />
          <button type="button" onClick={() => setEditingPrimary(false)} style={{ marginTop: 10, border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "8px 15px", background: "#fff", color: "#4b5563", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 15, padding: "9px 16px", borderRadius: 12, background: CAT.g50, color: CAT.goldText, fontWeight: 800, border: `1.5px solid ${CAT.g200}` }}>
            {primary?.displayName || "No primary category"}
            <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: ".06em", padding: "2px 8px", borderRadius: 6, background: CAT.gold, color: "#fff", textTransform: "uppercase" }}>Primary</span>
          </span>
          <button
            type="button"
            onClick={() => setEditingPrimary(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 800, color: CAT.goldText, background: "#fff", border: `1.5px solid ${CAT.g300}`, borderRadius: 10, padding: "8px 15px", cursor: "pointer", fontFamily: "inherit", transition: "background .15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = CAT.g50; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
          >
            <EditIcon /> Change
          </button>
        </div>
      )}

      {/* Additional (sub) categories */}
      <div style={{ fontSize: 12.5, fontWeight: 800, color: "#374151", textTransform: "uppercase", letterSpacing: ".04em", margin: "20px 0 9px", display: "flex", alignItems: "center", gap: 8 }}>
        Additional (sub) categories
        <span style={{ fontSize: 11.5, fontWeight: 700, color: atMax ? CAT.goldText : "#9ca3af", background: atMax ? CAT.g50 : "#f3f4f6", border: `1px solid ${atMax ? CAT.g200 : "#e5e7eb"}`, padding: "2px 9px", borderRadius: 20, letterSpacing: 0, textTransform: "none" }}>
          {additional.length} / 9
        </span>
      </div>
      {additional.length ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {additional.map((c) => (
            <span key={c.name} style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13.5, padding: "8px 8px 8px 15px", borderRadius: 22, background: "#fff", color: "#374151", fontWeight: 600, border: "1.5px solid #e5e7eb" }}>
              {c.displayName}
              <button
                type="button"
                aria-label={`Remove ${c.displayName}`}
                onClick={() => onChange({ additional: additional.filter((x) => x.name !== c.name) })}
                style={{ width: 20, height: 20, borderRadius: 10, border: "none", background: "#f3f4f6", color: "#6b7280", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, lineHeight: 1, transition: "all .15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#dc2626"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#f3f4f6"; e.currentTarget.style.color = "#6b7280"; }}
              >×</button>
            </span>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 13.5, color: "#9ca3af", marginBottom: 12 }}>No sub-categories yet. Add Google-supported ones below.</div>
      )}
      {!atMax ? (
        <CategorySearchBox
          placeholder="Search to add a sub-category…"
          search={search}
          exclude={excludeNames}
          onPick={(c) => onChange({ additional: [...additional, c] })}
        />
      ) : null}

      {/* Suggested sub-categories for the chosen primary */}
      {suggested.length && !atMax ? (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px dashed ${CAT.g200}` }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 800, color: CAT.goldText, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 10 }}>
            <SparkIcon size={13} /> Suggested for {primary?.displayName}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {suggested.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => onChange({ additional: [...additional, c] })}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13.5, padding: "8px 14px", borderRadius: 22, background: "#fff", color: CAT.goldText, fontWeight: 700, border: `1.5px dashed ${CAT.g300}`, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = CAT.g50; e.currentTarget.style.borderStyle = "solid"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderStyle = "dashed"; }}
              >
                <span style={{ color: CAT.gold, fontWeight: 900 }}>+</span> {c.displayName}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {typeof onSave === "function" && dirty ? (
        <div style={{ marginTop: 18 }}>
          <button
            type="button"
            onClick={() => void onSave()}
            disabled={saving || !primary?.name}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 22px", borderRadius: 12, border: "none",
              cursor: saving || !primary?.name ? "not-allowed" : "pointer",
              background: saving || !primary?.name ? "#f3f4f6" : CAT.gold,
              color: saving || !primary?.name ? "#9ca3af" : "#fff",
              fontSize: 14, fontWeight: 800, fontFamily: "inherit",
              boxShadow: saving || !primary?.name ? "none" : "0 4px 14px rgba(202,138,4,.32)",
              transition: "background .15s",
            }}
            onMouseEnter={(e) => { if (!(saving || !primary?.name)) e.currentTarget.style.background = CAT.goldHover; }}
            onMouseLeave={(e) => { if (!(saving || !primary?.name)) e.currentTarget.style.background = CAT.gold; }}
          >
            {saving ? "Saving…" : "Save categories to Google"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

// ─── Description generator (guided inputs -> AI GMB description) ────────────────
// Collects city / address / keyword / intent (category comes automatically from the
// primary category) and asks the server AI to write a Google-ready description. The
// result is reviewed in the ConfirmModal, then inserted into the Description field
// (which itself syncs to Google from the About tab).
function DescriptionGenerator({ aiContext, businessName, categoryHint, primaryLoc, onInsert }) {
  const [inputs, setInputs] = useState({ city: "", address: "", keyword: "", intent: "" });
  const [loading, setLoading] = useState(false);
  const [variants, setVariants] = useState(null); // string[] | null
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(false);

  const set = (k) => (e) => setInputs((p) => ({ ...p, [k]: e.target.value }));
  const category = categoryHint?.[0] || "";

  // Prefill city / address from the connected Google location when empty.
  useEffect(() => {
    setInputs((p) => ({
      ...p,
      city: p.city || primaryLoc?.locality || "",
      address: p.address || primaryLoc?.fullAddress || primaryLoc?.address || "",
    }));
  }, [primaryLoc?.locality, primaryLoc?.fullAddress, primaryLoc?.address]);

  const generate = async () => {
    setLoading(true);
    setErr("");
    try {
      const ctx = {
        ...(aiContext || {}),
        businessNameHint: businessName,
        categoryHints: categoryHint,
        primaryCategory: category,
        city: inputs.city.trim(),
        address: inputs.address.trim(),
        keyword: inputs.keyword.trim(),
        intent: inputs.intent.trim(),
      };
      const res = await fetch("/api/user-settings/business-optimization-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "descriptionVariants", count: 3, context: ctx }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error || "Generation failed. Check OPENAI_API_KEY and try again.");
        return;
      }
      const list = (Array.isArray(data.variants) ? data.variants : [])
        .map((v) => clampGmbDescription(String(v || "").trim()))
        .filter(Boolean);
      if (!list.length) {
        setErr("AI returned no descriptions. Try again.");
        return;
      }
      setVariants(list);
    } catch {
      setErr("Generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", boxSizing: "border-box", padding: "9px 11px", borderRadius: 9,
    border: "1.5px solid #e2e8f0", fontSize: 12.5, fontFamily: "inherit", color: "#0f172a",
  };

  return (
    <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid #eef2f6" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ color: "#CA8A04", display: "flex" }}><SparkIcon /></span> AI description generator
          </div>
          <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 2 }}>
            Add a few details — category is used automatically. The result goes into the Description below.
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          style={{ fontSize: 11.5, fontWeight: 800, color: open ? "#fff" : "#A16207", background: open ? "linear-gradient(135deg, #CA8A04, #A16207)" : "#fff", border: `1.5px solid ${open ? "transparent" : "#FDE047"}`, borderRadius: 9, padding: "7px 13px", cursor: "pointer", fontFamily: "inherit" }}
        >
          {open ? "Close" : "Generate with AI"}
        </button>
      </div>

      {open ? (
        <div style={{ marginTop: 12, padding: 14, borderRadius: 12, border: "1.5px solid #FEF08A", background: "linear-gradient(135deg,#FFFDF5,#FEFCE8)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontSize: 12, color: "#475569" }}>
            <span style={{ fontWeight: 700, color: "#64748b" }}>Category:</span>
            <span style={{ fontWeight: 800, color: "#854D0E", background: "#FEFCE8", border: "1px solid #FDE047", padding: "3px 10px", borderRadius: 20 }}>
              {category || "—"}
            </span>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>(automatic)</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>City</label>
              <input value={inputs.city} onChange={set("city")} placeholder="e.g. Mumbai" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>Address / area</label>
              <input value={inputs.address} onChange={set("address")} placeholder="e.g. Andheri West" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>Keyword</label>
              <input value={inputs.keyword} onChange={set("keyword")} placeholder="e.g. RO water purifier" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>Customer intent</label>
              <input value={inputs.intent} onChange={set("intent")} placeholder="e.g. book same-day installation" style={inputStyle} />
            </div>
          </div>
          {err ? <div style={{ marginTop: 8, fontSize: 12, color: "#b91c1c", fontWeight: 600 }}>{err}</div> : null}
          <div style={{ marginTop: 12 }}>
            <button
              type="button"
              onClick={() => void generate()}
              disabled={loading}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, border: "none", cursor: loading ? "wait" : "pointer", background: "linear-gradient(135deg, #CA8A04, #EAB308)", color: "#fff", fontSize: 12, fontWeight: 800, fontFamily: "inherit", boxShadow: "0 3px 10px rgba(202,138,4,.25)" }}
            >
              <SparkIcon /> {loading ? "Generating…" : "Generate 3 options"}
            </button>
          </div>
        </div>
      ) : null}

      {variants !== null ? (
        <DescriptionVariantsModal
          variants={variants}
          onUse={(text) => { onInsert(clampGmbDescription(String(text || ""))); setVariants(null); setOpen(false); }}
          onCancel={() => setVariants(null)}
          onRegenerate={() => { setVariants(null); void generate(); }}
        />
      ) : null}
    </div>
  );
}

// ─── Description variants chooser ──────────────────────────────────────────────
// Shows the 2–3 AI-generated description options as selectable cards. The user picks
// one and inserts it into the Description field (which then syncs to Google).
function DescriptionVariantsModal({ variants, onUse, onCancel, onRegenerate }) {
  const [selected, setSelected] = useState(0);
  const list = Array.isArray(variants) ? variants : [];
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(15,23,42,.5)", backdropFilter: "blur(5px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 620, maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 60px rgba(0,0,0,.18)", animation: "modalIn .25s cubic-bezier(.34,1.56,.64,1)", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px 16px", background: "linear-gradient(135deg, #FFFDF5, #FEF9C3)", borderBottom: "1px solid #FEF08A", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 13, background: "linear-gradient(135deg, #CA8A04, #EAB308)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(202,138,4,.35)" }}>
            <SparkIcon size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#1e1b4b" }}>Choose a description</div>
            <div style={{ fontSize: 12, color: "#EAB308" }}>{list.length} AI options · pick the one you like</div>
          </div>
          <button type="button" onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4, display: "flex" }}>
            <CloseIcon />
          </button>
        </div>

        <div style={{ padding: "16px 24px", overflowY: "auto" }}>
          {list.map((v, i) => {
            const active = selected === i;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setSelected(i)}
                style={{
                  width: "100%", textAlign: "left", display: "block", marginBottom: 12, padding: "14px 16px",
                  borderRadius: 12, cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
                  border: active ? "1.5px solid #CA8A04" : "1.5px solid #e2e8f0",
                  background: active ? "linear-gradient(135deg,#FFFDF5,#FEFCE8)" : "#fff",
                  boxShadow: active ? "0 4px 14px rgba(202,138,4,.12)" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: active ? "#854D0E" : "#94a3b8", textTransform: "uppercase", letterSpacing: ".05em" }}>
                    Option {i + 1}
                  </span>
                  <span style={{ width: 18, height: 18, borderRadius: 9, border: `2px solid ${active ? "#CA8A04" : "#cbd5e1"}`, background: active ? "#CA8A04" : "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                    {active ? <CheckIcon size={11} color="#fff" /> : null}
                  </span>
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.7, color: "#334155", whiteSpace: "pre-wrap" }}>{v}</div>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textAlign: "right", marginTop: 6 }}>
                  {v.length} / {GMB_PROFILE_DESCRIPTION_MAX}
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ padding: "12px 24px 20px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 10, justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
          <button type="button" onClick={onRegenerate} style={{ padding: "10px 18px", borderRadius: 10, border: "1.5px solid #FDE047", background: "#fff", color: "#A16207", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <SparkIcon /> Regenerate
          </button>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" onClick={onCancel} style={{ padding: "10px 22px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
            <button type="button" onClick={() => onUse(list[selected])} style={{ padding: "10px 28px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #CA8A04, #EAB308)", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 14px rgba(202,138,4,.35)", display: "flex", alignItems: "center", gap: 7 }}>
              <CheckIcon size={13} color="#fff" /> Use this description
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Food Menu editor (sections -> items with name / description / price) ──────
// Shown only for food-eligible locations (metadata.canHaveFoodMenus). Saved via the
// v4 Food Menu API. AI can generate the whole menu; the user reviews before saving.
function FoodMenuEditor({ menu, onChange, aiContext, businessName, categoryHint, onSave, savePending }) {
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(null); // { currency, sections }
  const [err, setErr] = useState("");
  const currency = menu?.currency || "INR";
  const sections = Array.isArray(menu?.sections) ? menu.sections : [];

  const setSections = (next) => onChange({ currency, sections: next });
  const addSection = () => setSections([...sections, { name: "", items: [] }]);
  const removeSection = (si) => setSections(sections.filter((_, i) => i !== si));
  const renameSection = (si, name) => setSections(sections.map((s, i) => (i === si ? { ...s, name } : s)));
  const addItem = (si) =>
    setSections(sections.map((s, i) => (i === si ? { ...s, items: [...(s.items || []), { name: "", description: "", price: "" }] } : s)));
  const removeItem = (si, ii) =>
    setSections(sections.map((s, i) => (i === si ? { ...s, items: s.items.filter((_, j) => j !== ii) } : s)));
  const updateItem = (si, ii, key, val) =>
    setSections(sections.map((s, i) => (i === si ? { ...s, items: s.items.map((it, j) => (j === ii ? { ...it, [key]: val } : it)) } : s)));

  const generate = async () => {
    setLoading(true);
    setErr("");
    try {
      const ctx = { ...(aiContext || {}), businessNameHint: businessName, categoryHints: categoryHint };
      const res = await fetch("/api/user-settings/business-optimization-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "foodMenu", context: ctx, currency }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error || "AI generation failed. Check OPENAI_API_KEY.");
        return;
      }
      const secs = Array.isArray(data.sections) ? data.sections : [];
      if (!secs.length) {
        setErr("AI returned no menu. Try again.");
        return;
      }
      setPending({ currency: data.currency || currency, sections: secs });
    } catch {
      setErr("AI generation failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const applyPending = () => {
    if (pending) onChange(pending);
    setPending(null);
  };

  const itemCount = sections.reduce((n, s) => n + (Array.isArray(s.items) ? s.items.length : 0), 0);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "#475569", background: "#f1f5f9", padding: "4px 11px", borderRadius: 20 }}>
            {sections.length} section{sections.length === 1 ? "" : "s"}
          </span>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "#475569", background: "#f1f5f9", padding: "4px 11px", borderRadius: 20 }}>
            {itemCount} item{itemCount === 1 ? "" : "s"}
          </span>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "#94a3b8" }}>Prices in {currency}</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => void generate()}
            disabled={loading}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 9,
              border: "1.5px solid #FEF08A", cursor: loading ? "wait" : "pointer",
              background: "linear-gradient(135deg, #FFFDF5, #FEF9C3)", color: "#854D0E",
              fontSize: 12, fontWeight: 700, fontFamily: "inherit",
            }}
          >
            <SparkIcon /> {loading ? "Generating…" : "AI generate menu"}
          </button>
          <button
            type="button"
            onClick={addSection}
            style={{ padding: "7px 13px", borderRadius: 9, border: "1.5px solid #e2e8f0", cursor: "pointer", background: "#fff", color: "#475569", fontSize: 12, fontWeight: 700, fontFamily: "inherit" }}
          >
            + Section
          </button>
        </div>
      </div>

      {sections.length === 0 ? (
        <div style={{ padding: "20px 14px", borderRadius: 12, border: "1px dashed #cbd5e1", background: "#f8fafc", color: "#94a3b8", fontSize: 12.5, textAlign: "center" }}>
          No menu yet. Use <strong style={{ color: "#CA8A04" }}>AI generate menu</strong> or <strong>+ Section</strong>.
        </div>
      ) : (
        sections.map((sec, si) => (
          <div key={si} style={{ marginBottom: 14, borderRadius: 13, border: "1.5px solid #eef2f6", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "linear-gradient(135deg,#FFFDF5,#FEFCE8)", borderBottom: "1px solid #eef2f6" }}>
              <input
                value={sec.name || ""}
                onChange={(e) => renameSection(si, e.target.value)}
                placeholder="Section name (e.g. Sweets, Namkeen)"
                style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, fontWeight: 700, fontFamily: "inherit", color: "#0f172a", background: "#fff" }}
              />
              <button type="button" onClick={() => addItem(si)} style={{ padding: "7px 11px", borderRadius: 8, border: "1.5px solid #FDE047", background: "#FEF9C3", color: "#854D0E", fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>+ Item</button>
              <button type="button" onClick={() => removeSection(si)} aria-label="Remove section" style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 8, border: "1.5px solid #fee2e2", background: "#fff5f5", color: "#ef4444", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><CloseIcon /></button>
            </div>
            <div style={{ padding: 12 }}>
              {(Array.isArray(sec.items) ? sec.items : []).length === 0 ? (
                <div style={{ fontSize: 12, color: "#94a3b8", padding: "6px 2px" }}>No items — tap “+ Item”.</div>
              ) : (
                sec.items.map((it, ii) => (
                  <div key={ii} style={{ marginBottom: 10, padding: "10px 11px", borderRadius: 10, border: "1px solid #eef2f6", background: "#fff" }}>
                    <div style={{ display: "flex", gap: 8, marginBottom: 7 }}>
                      <input
                        value={it.name || ""}
                        onChange={(e) => updateItem(si, ii, "name", e.target.value)}
                        placeholder="Item name (e.g. Kaju Katli)"
                        style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, fontWeight: 600, fontFamily: "inherit", color: "#0f172a" }}
                      />
                      <div style={{ display: "flex", alignItems: "center", gap: 4, border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "0 10px", background: "#fff" }}>
                        <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700 }}>{currency}</span>
                        <input
                          value={it.price ?? ""}
                          onChange={(e) => updateItem(si, ii, "price", e.target.value.replace(/[^\d.]/g, ""))}
                          placeholder="0"
                          inputMode="decimal"
                          style={{ width: 64, padding: "8px 2px", border: "none", outline: "none", fontSize: 13, fontFamily: "inherit", color: "#0f172a", background: "transparent" }}
                        />
                      </div>
                      <button type="button" onClick={() => removeItem(si, ii)} aria-label="Remove item" style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 8, border: "1.5px solid #fee2e2", background: "#fff5f5", color: "#ef4444", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><CloseIcon /></button>
                    </div>
                    <input
                      value={it.description || ""}
                      onChange={(e) => updateItem(si, ii, "description", e.target.value)}
                      placeholder="Short description (optional)"
                      maxLength={300}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 12.5, fontFamily: "inherit", color: "#334155" }}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        ))
      )}

      {err ? <div style={{ marginTop: 8, fontSize: 12, color: "#b91c1c", fontWeight: 600 }}>{err}</div> : null}

      {typeof onSave === "function" && (
        <div style={{ marginTop: 12 }}>
          <button
            type="button"
            onClick={() => void onSave()}
            disabled={savePending || itemCount === 0}
            style={{
              padding: "9px 20px", borderRadius: 10, border: "none",
              cursor: savePending || itemCount === 0 ? "not-allowed" : "pointer",
              background: savePending || itemCount === 0 ? "#FEF08A" : "linear-gradient(135deg, #CA8A04, #A16207)",
              color: savePending || itemCount === 0 ? "#9ca3af" : "#fff",
              fontSize: 13, fontWeight: 800, fontFamily: "inherit",
              boxShadow: savePending || itemCount === 0 ? "none" : "0 4px 14px rgba(202,138,4,.3)",
            }}
          >
            {savePending ? "Saving…" : "Save menu to Google"}
          </button>
        </div>
      )}

      {pending && (
        <ConfirmModal
          field="Menu"
          aiContent={pending.sections.flatMap((s) => [`◆ ${s.name}`, ...s.items.map((it) => `   • ${it.name}${it.price ? ` — ${currency} ${it.price}` : ""}`)])}
          onConfirm={applyPending}
          onCancel={() => setPending(null)}
        />
      )}
    </div>
  );
}

function SectionBlock({ title, hint, children }) {
  return (
    <div style={{
      borderRadius: 16,
      border: "1px solid #e2e8f0",
      background: "linear-gradient(165deg, #ffffff 0%, #f8fafc 55%, #f1f5f9 100%)",
      padding: "20px 22px 8px",
      marginBottom: 18,
      boxShadow: "0 4px 24px rgba(15,23,42,.045)",
    }}>
      <div style={{
        marginBottom: 14,
        paddingBottom: 12,
        borderBottom: "1px solid #e8edf5",
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
      }}>
        <span style={{
          width: 3, alignSelf: "stretch", minHeight: 36, borderRadius: 2,
          background: "linear-gradient(180deg, #CA8A04, #A16207)", flexShrink: 0,
        }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", letterSpacing: "-.02em" }}>{title}</div>
          {hint ? (
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 4, lineHeight: 1.5 }}>{hint}</div>
          ) : null}
        </div>
      </div>
      {children}
    </div>
  );
}

/** Service areas: Google optimization uses storefront address → geocode → OSM radius search; optional AI name hints. */
function ServiceAreaMultiSelect({
  primaryLoc,
  listingLat,
  listingLng,
  selectedPlaces,
  onChange,
  noBottomRule = false,
  enableRadiusSearch = false,
  aiContext = {},
  onSaveServiceAreas,
  saveServiceAreasPending = false,
}) {
  const staticSuggestions = useMemo(
    () =>
      getNearbyServiceAreaSuggestions({
        locality: primaryLoc?.locality,
        administrativeArea: primaryLoc?.administrativeArea,
        regionCode: primaryLoc?.regionCode,
        fullAddress: primaryLoc?.fullAddress,
      }),
    [primaryLoc?.locality, primaryLoc?.administrativeArea, primaryLoc?.regionCode, primaryLoc?.fullAddress]
  );

  const [radiusKm, setRadiusKm] = useState(2);
  const [dynamicSuggestions, setDynamicSuggestions] = useState([]);
  const [aiAreaSuggestions, setAiAreaSuggestions] = useState([]);
  const [aiAreaPending, setAiAreaPending] = useState(false);
  const [fetchingNearby, setFetchingNearby] = useState(false);
  const [nearbyError, setNearbyError] = useState("");
  const [customLine, setCustomLine] = useState("");
  const [geocodedLat, setGeocodedLat] = useState(null);
  const [geocodedLng, setGeocodedLng] = useState(null);

  const geocodePayload = useMemo(() => buildGeocodePayloadFromPrimaryLoc(primaryLoc), [primaryLoc]);
  const canGeocodeFromAddress = hasEnoughAddressForGeocode(geocodePayload);

  const listingPinOk =
    listingLat != null &&
    listingLng != null &&
    Number.isFinite(Number(listingLat)) &&
    Number.isFinite(Number(listingLng));

  useEffect(() => {
    setDynamicSuggestions([]);
    setNearbyError("");
    setAiAreaSuggestions([]);
  }, [primaryLoc?.fullAddress, listingLat, listingLng]);

  const mergedSuggestions = useMemo(() => {
    const sourceSuggestions = enableRadiusSearch
      ? [...dynamicSuggestions, ...aiAreaSuggestions]
      : staticSuggestions;
    const seen = new Set();
    const out = [];
    for (const p of sourceSuggestions) {
      const k = String(p).toLowerCase();
      if (!seen.has(k)) {
        seen.add(k);
        out.push(String(p));
      }
    }
    return out;
  }, [dynamicSuggestions, aiAreaSuggestions, staticSuggestions, enableRadiusSearch]);

  const suggestAreasWithAi = async () => {
    setAiAreaPending(true);
    try {
      const res = await fetch("/api/user-settings/business-optimization-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "field",
          fieldId: "serviceArea",
          fieldLabel: "Nearby service areas",
          context: {
            ...aiContext,
            searchRadiusKm: radiusKm,
            storefrontAddress: primaryLoc?.fullAddress || primaryLoc?.address || "",
            locality: primaryLoc?.locality || "",
            administrativeArea: primaryLoc?.administrativeArea || "",
            ...(listingPinOk
              ? { listingLatitude: Number(listingLat), listingLongitude: Number(listingLng) }
              : {}),
          },
          currentValue: selectedPlaces.join(", "),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "AI area suggestions failed");
      const raw = String(data.value ?? "").trim();
      const parts = parseAiServiceAreaSuggestionText(raw);
      setAiAreaSuggestions(parts);
      if (parts.length) toast.success(`AI suggested ${parts.length} area name(s) — tap to add.`);
      else toast.error("No areas returned — try again or use Find nearby areas.");
    } catch (e) {
      toast.error(e.message || "AI suggest failed");
    } finally {
      setAiAreaPending(false);
    }
  };

  const fetchNearby = async () => {
    if (!enableRadiusSearch) return;
    setFetchingNearby(true);
    setNearbyError("");
    try {
      let lat = listingPinOk ? Number(listingLat) : null;
      let lng = listingPinOk ? Number(listingLng) : null;

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        if (Number.isFinite(geocodedLat) && Number.isFinite(geocodedLng)) {
          lat = geocodedLat;
          lng = geocodedLng;
        }
      }

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        if (!canGeocodeFromAddress || !geocodePayload) {
          setNearbyError(
            "Add a complete storefront address on Google Business Profile so we can locate your business and search within the radius."
          );
          return;
        }
        const gRes = await fetch("/api/gmb/geocode-address", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(geocodePayload),
        });
        const gData = await gRes.json().catch(() => ({}));
        if (!gRes.ok || !Number.isFinite(Number(gData.lat)) || !Number.isFinite(Number(gData.lng))) {
          throw new Error(gData.error || "Could not place your business on the map from this address.");
        }
        lat = Number(gData.lat);
        lng = Number(gData.lng);
        setGeocodedLat(lat);
        setGeocodedLng(lng);
        toast.success("Located your business from address — searching nearby areas…", { duration: 3500 });
      }

      const res = await fetch("/api/gmb/nearby-service-areas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          radiusKm,
          locality: primaryLoc?.locality,
          administrativeArea: primaryLoc?.administrativeArea,
          regionCode: primaryLoc?.regionCode,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not load nearby areas");
      setDynamicSuggestions(Array.isArray(data.places) ? data.places : []);
    } catch (e) {
      setNearbyError(e.message || "Nearby search failed");
      toast.error(e.message || "Nearby search failed");
    } finally {
      setFetchingNearby(false);
    }
  };

  const toggle = (place) => {
    if (!place) return;
    if (selectedPlaces.includes(place)) onChange(selectedPlaces.filter((p) => p !== place));
    else onChange([...selectedPlaces, place]);
  };

  const addCustom = () => {
    const t = customLine.trim();
    if (!t) return;
    if (selectedPlaces.includes(t)) {
      setCustomLine("");
      return;
    }
    onChange([...selectedPlaces, t]);
    setCustomLine("");
  };

  const cityLabel = [primaryLoc?.locality, primaryLoc?.administrativeArea].filter(Boolean).join(", ") || "your storefront";
  const hasResolvedPin = Number.isFinite(geocodedLat) && Number.isFinite(geocodedLng);
  const findButtonEnabled =
    enableRadiusSearch && (listingPinOk || canGeocodeFromAddress || hasResolvedPin);

  return (
    <div
      style={{
        marginBottom: noBottomRule ? 0 : 20,
        paddingBottom: noBottomRule ? 0 : 20,
        borderBottom: noBottomRule ? "none" : "1px solid #eef2f6",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
        <span style={{ width: 28, height: 28, borderRadius: 9, background: "#FEF9C3", color: "#CA8A04", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <TabIconPin />
        </span>
        <span style={{ fontSize: 14, fontWeight: 800, color: "#713F12" }}>Service areas</span>
      </div>
      <p style={{ margin: "0 0 14px", fontSize: 13.5, color: "#6b7280", lineHeight: 1.6 }}>
        The towns, cities and localities where you <strong>serve customers at their location</strong> (e.g. RO installation at home).
        Add the areas around {cityLabel}, then <strong style={{ color: "#CA8A04" }}>Save service areas</strong>. Google allows up to 20.
      </p>

      {enableRadiusSearch ? (
        <div style={{
          marginBottom: 14,
          padding: "12px 14px",
          background: "#f8fafc",
          borderRadius: 12,
          border: "1px solid #e8edf5",
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", marginBottom: 8 }}>Nearby search (OpenStreetMap, radius from your business location)</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#334155" }}>
              <span style={{ fontWeight: 600 }}>Radius</span>
              <select
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                style={{
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  fontFamily: "inherit",
                  fontSize: 13,
                  background: "#fff",
                }}
              >
                {[2, 4, 6, 8].map((k) => (
                  <option key={k} value={k}>{k} km</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => void suggestAreasWithAi()}
              disabled={aiAreaPending || !enableRadiusSearch}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "9px 18px",
                borderRadius: 9,
                border: "none",
                background: aiAreaPending || !enableRadiusSearch ? "#FEF08A" : "#CA8A04",
                color: aiAreaPending || !enableRadiusSearch ? "#9ca3af" : "#fff",
                fontSize: 13,
                fontWeight: 800,
                cursor: aiAreaPending || !enableRadiusSearch ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                boxShadow: aiAreaPending || !enableRadiusSearch ? "none" : "0 3px 12px rgba(202,138,4,.3)",
              }}
            >
              <SparkIcon size={13} /> {aiAreaPending ? "Suggesting…" : "AI suggest areas"}
            </button>
            <button
              type="button"
              onClick={() => void fetchNearby()}
              disabled={fetchingNearby || !findButtonEnabled}
              style={{
                padding: "9px 16px",
                borderRadius: 9,
                border: `1.5px solid ${fetchingNearby || !findButtonEnabled ? "#e5e7eb" : "#FDE047"}`,
                background: "#fff",
                color: fetchingNearby || !findButtonEnabled ? "#9ca3af" : "#854D0E",
                fontSize: 13,
                fontWeight: 700,
                cursor: fetchingNearby || !findButtonEnabled ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {fetchingNearby ? "Loading…" : "Find nearby (radius)"}
            </button>
            {typeof onSaveServiceAreas === "function" ? (
              <button
                type="button"
                onClick={() => void onSaveServiceAreas()}
                disabled={saveServiceAreasPending}
                style={{
                  padding: "9px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: saveServiceAreasPending ? "#FEF08A" : "linear-gradient(135deg, #CA8A04, #A16207)",
                  color: saveServiceAreasPending ? "#9ca3af" : "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: saveServiceAreasPending ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                {saveServiceAreasPending ? "Saving…" : "Save service areas"}
              </button>
            ) : null}
          </div>
          {!listingPinOk && canGeocodeFromAddress ? (
            <p style={{ margin: "10px 0 0", fontSize: 11, color: "#b45309", lineHeight: 1.5 }}>
              Google did not return coordinates for this listing. Tap <strong>Find nearby areas</strong> — we geocode your{" "}
              <strong>storefront address</strong>, then load place names within the radius.
            </p>
          ) : null}
          {!listingPinOk && !canGeocodeFromAddress ? (
            <p style={{ margin: "10px 0 0", fontSize: 11, color: "#b45309", lineHeight: 1.5 }}>
              Add a complete storefront address on Google Business Profile so we can locate the business and search within the radius.
            </p>
          ) : null}
          {listingPinOk ? (
            <p style={{ margin: "8px 0 0", fontSize: 11, color: "#047857" }}>Using coordinates from your Google listing for distance search.</p>
          ) : null}
          {nearbyError ? (
            <p style={{ margin: "10px 0 0", fontSize: 12, color: "#b91c1c" }}>{nearbyError}</p>
          ) : null}
          {dynamicSuggestions.length > 0 ? (
            <p style={{ margin: "8px 0 0", fontSize: 11, color: "#059669", fontWeight: 600 }}>
              Found {dynamicSuggestions.length} areas within ~{radiusKm} km (approximate).
            </p>
          ) : null}
        </div>
      ) : null}

      {selectedPlaces.length > 0 ? (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#374151", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 9 }}>
            Your service areas ({selectedPlaces.length}{selectedPlaces.length >= 20 ? " · max" : ""})
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {selectedPlaces.map((p) => (
              <span
                key={p}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  fontSize: 13.5, fontWeight: 600, color: "#713F12",
                  background: "#FEF9C3", border: "1.5px solid #FDE047",
                  borderRadius: 22, padding: "7px 8px 7px 14px",
                  maxWidth: "100%", lineHeight: 1.4,
                }}
              >
                <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{p}</span>
                <button
                  type="button"
                  onClick={() => toggle(p)}
                  aria-label={`Remove ${p}`}
                  title="Remove"
                  style={{ width: 20, height: 20, flexShrink: 0, borderRadius: 10, border: "none", background: "#FDE047", color: "#854D0E", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, lineHeight: 1, transition: "all .15s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#dc2626"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#FDE047"; e.currentTarget.style.color = "#854D0E"; }}
                >×</button>
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 14, padding: "12px 14px", background: "#FFFDF5", borderRadius: 12, border: "1px dashed #FDE047" }}>
          No areas added yet. Tap <strong style={{ color: "#854D0E" }}>AI suggest areas</strong>, pick from the list below, or type a custom area.
        </div>
      )}

      <div style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>
        Suggested areas{" "}
        {enableRadiusSearch ? "(Find + AI — tap Find or AI first)" : "(local presets)"}
      </div>
      <div
        style={{
          maxHeight: 280,
          overflowY: "auto",
          border: "1px solid #e8edf5",
          borderRadius: 12,
          background: "#fff",
          marginBottom: 14,
        }}
      >
        {mergedSuggestions.length === 0 ? (
          <div style={{ padding: 16, fontSize: 13, color: "#94a3b8" }}>
            {enableRadiusSearch ? "Choose a radius and tap “Find nearby areas”, or add custom lines." : "No preset list — use custom area below."}
          </div>
        ) : (
          mergedSuggestions.map((line, idx) => {
            const sel = selectedPlaces.includes(line);
            return (
              <button
                key={`${line}-${idx}`}
                type="button"
                onClick={() => toggle(line)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  textAlign: "left",
                  padding: "12px 14px",
                  border: "none",
                  borderBottom: idx < mergedSuggestions.length - 1 ? "1px solid #f1f5f9" : "none",
                  background: sel ? "#FEF9C3" : "#fff",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: 13,
                  color: "#334155",
                  lineHeight: 1.45,
                }}
              >
                <span style={{ flex: 1, minWidth: 0 }}>{line}</span>
                <span
                  style={{
                    flexShrink: 0,
                    fontSize: 11,
                    fontWeight: 800,
                    color: sel ? "#854D0E" : "#64748b",
                  }}
                >
                  {sel ? "✓ Added" : "+ Add"}
                </span>
              </button>
            );
          })
        )}
      </div>

      <div style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>
        Add custom area
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          value={customLine}
          onChange={(e) => setCustomLine(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())}
          placeholder='e.g. Boring Road, Patna, Bihar, India'
          style={{
            flex: "1 1 200px",
            fontSize: 14,
            padding: "10px 12px",
            borderRadius: 10,
            border: "1.5px solid #e2e8f0",
            fontFamily: "inherit",
            minWidth: 0,
            boxSizing: "border-box",
          }}
        />
        <button
          type="button"
          onClick={addCustom}
          style={{
            padding: "10px 18px",
            borderRadius: 10,
            border: "none",
            background: "linear-gradient(135deg, #CA8A04, #A16207)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 800,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
}

// ─── Special hours: generate India public holidays → select → insert + save to GMB ──
// Holidays are generated by the server AI for the chosen year (movable festival dates
// change yearly), listed with checkboxes, written as readable notes, and pushed to
// Google as structured specialHours (each selected holiday = closed that day).
function SpecialHoursHolidays({ enabled, onInsertNotes, onSaveToGoogle, savePending }) {
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const [holidays, setHolidays] = useState([]);
  const [selected, setSelected] = useState(() => new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const formatDate = (iso) => {
    const d = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
  };

  const generate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/user-settings/business-optimization-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "holidays", year }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not generate holidays");
      const list = Array.isArray(data.holidays) ? data.holidays : [];
      // Only future-or-today holidays are worth pushing to Google.
      const todayIso = new Date().toISOString().slice(0, 10);
      const usable = list.filter((h) => h.date >= todayIso || year > thisYear);
      setHolidays(usable);
      setSelected(new Set(usable.map((h) => h.date)));
      if (!usable.length) setError("No upcoming holidays found for this year.");
    } catch (e) {
      setError(e.message || "Could not generate holidays");
    } finally {
      setLoading(false);
    }
  };

  const toggle = (date) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  const chosen = holidays.filter((h) => selected.has(h.date));

  const insertNotes = () => {
    if (!chosen.length) return;
    const lines = chosen.map((h) => `${formatDate(h.date)} — ${h.name} (Closed)`);
    onInsertNotes(`Holiday closures (${year}):\n${lines.join("\n")}`);
    toast.success(`Inserted ${chosen.length} holiday note(s).`);
  };

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          style={{ padding: "8px 10px", borderRadius: 9, border: "1.5px solid #e2e8f0", fontSize: 13, fontFamily: "inherit", color: "#0f172a", background: "#fff" }}
        >
          {[thisYear, thisYear + 1].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void generate()}
          disabled={loading}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9,
            border: "1.5px solid #FEF08A", background: loading ? "#FEF9C3" : "linear-gradient(135deg, #FFFDF5, #FEF9C3)",
            color: "#854D0E", fontSize: 12.5, fontWeight: 800, cursor: loading ? "wait" : "pointer", fontFamily: "inherit",
          }}
        >
          <SparkIcon /> {loading ? "Generating…" : "Generate India holidays"}
        </button>
      </div>

      {error ? <p style={{ margin: "0 0 8px", fontSize: 12, color: "#b91c1c" }}>{error}</p> : null}

      {holidays.length > 0 ? (
        <>
          <div style={{ border: "1px solid #eef2f6", borderRadius: 12, overflow: "hidden", marginBottom: 10 }}>
            {holidays.map((h, i) => {
              const on = selected.has(h.date);
              return (
                <button
                  key={h.date}
                  type="button"
                  onClick={() => toggle(h.date)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                    textAlign: "left", padding: "10px 13px", border: "none",
                    borderBottom: i < holidays.length - 1 ? "1px solid #f1f5f9" : "none",
                    background: on ? "#FEF9C3" : "#fff", cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  <span style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{h.name}</span>
                    <span style={{ fontSize: 11.5, color: "#64748b" }}>{formatDate(h.date)}</span>
                  </span>
                  <span style={{
                    width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                    border: `1.5px solid ${on ? "#CA8A04" : "#cbd5e1"}`, background: on ? "#CA8A04" : "#fff",
                    display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff",
                  }}>
                    {on ? <CheckIcon size={12} color="#fff" /> : null}
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <button
              type="button"
              onClick={insertNotes}
              disabled={!chosen.length}
              style={{
                padding: "8px 14px", borderRadius: 9, border: "1.5px solid #e2e8f0",
                background: "#fff", color: chosen.length ? "#334155" : "#9ca3af",
                fontSize: 12, fontWeight: 700, cursor: chosen.length ? "pointer" : "not-allowed", fontFamily: "inherit",
              }}
            >
              Insert into notes
            </button>
            {enabled && typeof onSaveToGoogle === "function" ? (
              <button
                type="button"
                onClick={() => void onSaveToGoogle(chosen)}
                disabled={!chosen.length || savePending}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, border: "none",
                  background: !chosen.length || savePending ? "#f3f4f6" : "linear-gradient(135deg, #CA8A04, #EAB308)",
                  color: !chosen.length || savePending ? "#9ca3af" : "#fff",
                  fontSize: 12, fontWeight: 800, cursor: !chosen.length || savePending ? "not-allowed" : "pointer", fontFamily: "inherit",
                  boxShadow: !chosen.length || savePending ? "none" : "0 3px 10px rgba(202,138,4,.3)",
                }}
              >
                {savePending ? "Saving…" : `Save ${chosen.length} holiday closure${chosen.length === 1 ? "" : "s"} to Google`}
              </button>
            ) : null}
          </div>
          <p style={{ margin: "8px 0 0", fontSize: 11, color: "#94a3b8", lineHeight: 1.5 }}>
            Selected holidays are saved to Google as special hours marked <strong>Closed</strong> for that date.
          </p>
        </>
      ) : null}
    </div>
  );
}

// ─── AI loading: top margin, “magic” motion, elapsed time ────────────────────
function MagicAiLoader({ marginTop = 20, subtitle = "OpenAI is crafting…" }) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(null);

  useEffect(() => {
    startRef.current = Date.now();
    setElapsed(0);
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 200);
    return () => clearInterval(id);
  }, []);

  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  const timeStr = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

  return (
    <>
      <style>{`
        @keyframes magic-ai-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(167, 139, 250, 0.45), 0 0 48px rgba(99, 102, 241, 0.2), inset 0 1px 0 rgba(255,255,255,0.12); }
          50% { box-shadow: 0 0 32px rgba(192, 132, 252, 0.55), 0 0 64px rgba(99, 102, 241, 0.35), inset 0 1px 0 rgba(255,255,255,0.18); }
        }
        @keyframes magic-ai-ring {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes magic-ai-spark {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.85; }
          50% { transform: translateY(-5px) scale(1.12); opacity: 1; }
        }
        @keyframes magic-ai-shimmer-bg {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
      <div
        style={{
          marginTop,
          position: "relative",
          borderRadius: 16,
          padding: "20px 22px 18px",
          overflow: "hidden",
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 42%, #854D0E 100%)",
          animation: "magic-ai-glow 2.4s ease-in-out infinite",
          border: "1px solid rgba(199, 210, 254, 0.35)",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.35,
            background: "linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.07) 45%, transparent 90%)",
            backgroundSize: "200% 100%",
            animation: "magic-ai-shimmer-bg 2.8s ease infinite",
            pointerEvents: "none",
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(167,139,250,0.5) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 16, position: "relative", zIndex: 1 }}>
          <div style={{ position: "relative", width: 56, height: 56, flexShrink: 0 }}>
            <div
              style={{
                position: "absolute",
                inset: -4,
                borderRadius: "50%",
                border: "2px dashed rgba(196, 181, 253, 0.55)",
                animation: "magic-ai-ring 8s linear infinite",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 14,
                background: "linear-gradient(145deg, rgba(255,255,255,0.18), rgba(129, 140, 248, 0.25))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: "magic-ai-spark 1.8s ease-in-out infinite",
                boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
              }}
            >
              <SparkIcon size={22} />
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(224, 231, 255, 0.85)",
                marginBottom: 6,
              }}
            >
              ✦ Creating magic
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", lineHeight: 1.45, marginBottom: 10 }}>
              {subtitle}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span
                style={{
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  fontSize: 20,
                  fontWeight: 800,
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: "0.06em",
                  color: "#e9d5ff",
                  textShadow: "0 0 20px rgba(216, 180, 254, 0.7)",
                  padding: "6px 12px",
                  borderRadius: 10,
                  background: "rgba(15, 23, 42, 0.35)",
                  border: "1px solid rgba(167, 139, 250, 0.4)",
                }}
              >
                {timeStr}
              </span>
              <span style={{ fontSize: 11, color: "rgba(199, 210, 254, 0.75)", fontWeight: 600 }}>
                elapsed
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main panel (GMB-style fields) ────────────────────────────────────────────
export default function BusinessInformationPanel({
  layout = "page",
  manageLocations = true,
  savePending = false,
  selectedLocations: selectedLocationsProp = [],
  setSelectedLocations: setSelectedLocationsProp,
  gmbLocations: gmbLocationsProp,
  selectedBusiness: selectedBusinessProp,
  userData: userDataProp,
  automationKeywords: automationKeywordsProp,
  profileDescription: profileDescriptionProp = "",
  onConfirmProfileDescription,
  /**
   * Optimization: Save changes → local automation + Google PATCH for description & serviceArea (Business Information API).
   */
  onSaveOptimization,
  /**
   * Optimization page: sync editable fields (description, phone, website, WhatsApp attribute, service area, lat/lng) to Google.
   * When set, business name / categories / storefront address are read-only (pending-review risk).
   */
  onSyncToGmb,
  syncToGmbPending = false,
  onBack,
  requireLocationPick,
  preselectedLocationId,
} = {}) {
  const embedded = layout === "embedded";
  const gmbSyncMode = typeof onSyncToGmb === "function";
  const savePushesDescriptionAndServiceArea = Boolean(gmbSyncMode && typeof onSaveOptimization === "function");
  const [tab, setTab] = useState("about");
  const [editorPhase, setEditorPhase] = useState("edit");
  const [activeEditorLocationId, setActiveEditorLocationId] = useState(null);
  const [pickSelectionId, setPickSelectionId] = useState(null);

  const gmbLocations = useMemo(() => {
    if (!Array.isArray(gmbLocationsProp)) {
      return MOCK_LOCATIONS.map(enrichGmbLocation).filter((l) => l?.locationId);
    }
    if (gmbLocationsProp.length === 0) return [];
    return gmbLocationsProp.map(enrichGmbLocation).filter((l) => l?.locationId);
  }, [gmbLocationsProp]);

  const locationSetSignature = useMemo(
    () => gmbLocations.map((l) => l.locationId).sort().join(","),
    [gmbLocations]
  );

  useEffect(() => {
    if (gmbLocations.length === 0) {
      setEditorPhase("edit");
      setActiveEditorLocationId(null);
      setPickSelectionId(null);
      return;
    }
    const needPick = requireLocationPick ?? (embedded && gmbLocations.length > 1);
    if (!needPick) {
      setEditorPhase("edit");
      const id = gmbLocations[0].locationId;
      setActiveEditorLocationId(id);
      setPickSelectionId(id);
      return;
    }
    setEditorPhase("pick");
    setActiveEditorLocationId(null);
    const pre = preselectedLocationId != null ? String(preselectedLocationId) : "";
    setPickSelectionId(pre && gmbLocations.some((l) => l.locationId === pre) ? pre : null);
  }, [locationSetSignature, embedded, requireLocationPick, preselectedLocationId]);

  const activeEnriched = useMemo(
    () => gmbLocations.find((l) => l.locationId === activeEditorLocationId) || null,
    [gmbLocations, activeEditorLocationId]
  );

  const [internalSelected, setInternalSelected] = useState([]);
  useEffect(() => {
    if (!manageLocations) return;
    setInternalSelected((prev) => {
      if (prev.length > 0) return prev;
      if (!gmbLocations.length) return prev;
      const loc = gmbLocations[0];
      return [
        {
          locationId: loc.locationId,
          name: loc.title,
          address: loc.address,
          locality: loc.locality,
          websiteUrl: loc.websiteUrl || "",
        },
      ];
    });
  }, [manageLocations, gmbLocations]);

  const selectedLocations = manageLocations ? internalSelected : (selectedLocationsProp || []);
  const setSelectedLocations = manageLocations ? setInternalSelected : (setSelectedLocationsProp || (() => {}));

  const userData = useMemo(() => {
    const u = userDataProp && typeof userDataProp === "object" ? userDataProp : {};
    return { ...MOCK_USER, ...u };
  }, [userDataProp]);

  const selectedBusiness = useMemo(() => {
    const b = selectedBusinessProp && typeof selectedBusinessProp === "object" ? selectedBusinessProp : {};
    return { ...MOCK_BUSINESS, ...b };
  }, [selectedBusinessProp]);

  const primaryLoc = useMemo(() => {
    if (activeEnriched) {
      return {
        address: activeEnriched.address,
        locality: activeEnriched.locality,
        websiteUrl: activeEnriched.websiteUrl,
        title: activeEnriched.title,
        fullAddress: activeEnriched.fullAddress,
        mapsUri: activeEnriched.mapsUri,
        placeId: activeEnriched.placeId,
        administrativeArea: activeEnriched.administrativeArea,
        postalCode: activeEnriched.postalCode,
        regionCode: activeEnriched.regionCode,
        openStatus: activeEnriched.openStatus,
        newReviewUri: activeEnriched.newReviewUri,
        profileDescription: activeEnriched.profileDescription,
        serviceAreaText: activeEnriched.serviceAreaText,
        hoursSummaryText: activeEnriched.hoursSummaryText,
      };
    }
    const s0 = selectedLocations[0];
    if (s0) {
      return {
        address: s0.address || "",
        locality: s0.locality || "",
        websiteUrl: s0.websiteUrl || "",
        title: s0.name || s0.title || "",
        fullAddress: [s0.address, s0.locality].filter(Boolean).join(", "),
        mapsUri: "",
        placeId: "",
        openStatus: "",
        newReviewUri: "",
        administrativeArea: s0.administrativeArea || "",
        postalCode: s0.postalCode || "",
        regionCode: s0.regionCode || "",
      };
    }
    const g0 = gmbLocations[0];
    if (g0) {
      return {
        address: g0.address || "",
        locality: g0.locality || "",
        websiteUrl: g0.websiteUrl || "",
        title: g0.title || "",
        fullAddress: g0.fullAddress || [g0.address, g0.locality].filter(Boolean).join(", "),
        mapsUri: g0.mapsUri || "",
        placeId: g0.placeId || "",
        openStatus: g0.openStatus || "",
        newReviewUri: g0.newReviewUri || "",
        administrativeArea: g0.administrativeArea || "",
        postalCode: g0.postalCode || "",
        regionCode: g0.regionCode || "",
      };
    }
    return { fullAddress: "", mapsUri: "", placeId: "", openStatus: "", newReviewUri: "" };
  }, [activeEnriched, selectedLocations, gmbLocations]);

  const categoryHint = useMemo(() => {
    const fromGoogle = activeEnriched?.primaryCategory ? [activeEnriched.primaryCategory] : [];
    const kw = Array.isArray(automationKeywordsProp) ? automationKeywordsProp.filter(Boolean) : [];
    const merged = [...fromGoogle, ...kw];
    const uniq = [...new Set(merged.map((s) => String(s).trim()).filter(Boolean))];
    if (uniq.length) return uniq.slice(0, 8);
    const t = (userData.topic || userData.keywords || "").toString();
    return t.split(/[,;|]/).map((s) => s.trim()).filter(Boolean).slice(0, 8);
  }, [activeEnriched, automationKeywordsProp, userData]);

  const [fields, setFields] = useState({
    businessName: "",
    tagline: "",
    description: "",
    phone: "",
    website: "",
    services: "",
    serviceItems: [],
    bookingUrl: "",
    serviceAreaPlaces: [],
    hoursSummary: "",
    specialHours: "",
    yearEstablished: "",
    accessibility: "",
    additionalInfo: "",
    primaryCategory: "",
    chatUrl: "",
    googleOpenStatus: "",
    regularHoursPeriods: [],
  });
  const [hoursBaseline, setHoursBaseline] = useState("[]");
  const [websiteBuilderPending, setWebsiteBuilderPending] = useState(false);
  // Tracks the last hydrated location + which fields the user has manually edited, so a
  // gmbLocations refresh keeps the user's edits but still fills clean fields from Google
  // (fixes services/serviceArea showing empty when the first hydrate used stale cache).
  const lastHydratedLocRef = useRef(null);
  const dirtyFieldsRef = useRef(new Set());

  // Category-driven attributes (menu link, dine-in, payments, …) — fetched per
  // location from /api/gmb/category-fields. attrDirtyRef tracks user edits so a
  // refresh doesn't clobber them and "Save changes" only sends changed attributes.
  const [categoryAttrs, setCategoryAttrs] = useState([]);
  const [attrValues, setAttrValues] = useState({});
  const [attrLoading, setAttrLoading] = useState(false);
  const [attrError, setAttrError] = useState("");
  const attrDirtyRef = useRef(new Set());
  const categoryReqRef = useRef(0);

  // Editable business categories (primary + additional/sub). Loaded from the same
  // category-fields call; edited/saved via categories PATCH (updateMask=categories).
  const [categoryPrimary, setCategoryPrimary] = useState(null); // { name, displayName }
  const [categoryAdditional, setCategoryAdditional] = useState([]); // [{ name, displayName }]
  const [categoryDirty, setCategoryDirty] = useState(false);
  const [categorySaving, setCategorySaving] = useState(false);

  // Category sections for the services editor — primary first, then each sub-category.
  // Each service is filed under one of these. Empty in non-sync mode (editor falls back
  // to a single un-tagged section).
  const serviceCategories = useMemo(() => {
    const norm = (n) => String(n || "").replace(/^categories\//, "").trim();
    const out = [];
    if (categoryPrimary?.name) {
      out.push({ gcid: norm(categoryPrimary.name), displayName: categoryPrimary.displayName || "Primary category", primary: true });
    }
    for (const c of categoryAdditional) {
      if (c?.name) out.push({ gcid: norm(c.name), displayName: c.displayName || "Category", primary: false });
    }
    return out;
  }, [categoryPrimary, categoryAdditional]);

  // Capabilities (from location metadata) decide which optional editors appear.
  const [capabilities, setCapabilities] = useState({});

  // Food menu (only for canHaveFoodMenus locations). { currency, sections }.
  const [foodMenu, setFoodMenu] = useState({ currency: "INR", sections: [] });
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuError, setMenuError] = useState("");
  const [menuSaving, setMenuSaving] = useState(false);
  const menuReqRef = useRef(0);
  const menuDirtyRef = useRef(false);

  const setAttrValue = useCallback((name, val) => {
    attrDirtyRef.current.add(name);
    setAttrValues((p) => ({ ...p, [name]: val }));
  }, []);

  const setField = useCallback(
    (key) => (val) => {
      dirtyFieldsRef.current.add(key);
      setFields((p) => ({ ...p, [key]: val }));
    },
    []
  );

  const optimizationContext = useMemo(() => {
    const base = activeEnriched?.aiContext || {};
    const kw = Array.isArray(automationKeywordsProp) ? automationKeywordsProp.filter(Boolean) : [];
    const draft =
      Array.isArray(fields.serviceAreaPlaces) && fields.serviceAreaPlaces.length
        ? { serviceAreaPlacesDraft: fields.serviceAreaPlaces }
        : {};
    // Give every field's AI generator the real offerings + description so suggestions are
    // grounded in this exact business, not generic category filler.
    const serviceTitles = Array.isArray(fields.serviceItems)
      ? fields.serviceItems.map((s) => String(s?.title || "").trim()).filter(Boolean).slice(0, 20)
      : [];
    const extra = {
      ...(serviceTitles.length ? { services: serviceTitles } : {}),
      ...(fields.description ? { currentDescription: String(fields.description).slice(0, 750) } : {}),
      ...(fields.primaryCategory ? { primaryCategory: fields.primaryCategory } : {}),
    };
    if (!kw.length) return { ...base, ...extra, ...draft };
    return { ...base, automationKeywords: kw, ...extra, ...draft };
  }, [activeEnriched, automationKeywordsProp, fields.serviceAreaPlaces, fields.serviceItems, fields.description, fields.primaryCategory]);

  useEffect(() => {
    if (profileDescriptionProp === undefined || profileDescriptionProp === null) return;
    if (gmbSyncMode && activeEditorLocationId) return;
    setFields((f) => ({ ...f, description: clampGmbDescription(profileDescriptionProp) }));
  }, [profileDescriptionProp, gmbSyncMode, activeEditorLocationId]);

  useEffect(() => {
    if (activeEditorLocationId) return;
    const t = selectedBusiness.title || selectedBusiness.name;
    if (t) setFields((f) => ({ ...f, businessName: f.businessName || t }));
  }, [selectedBusiness.title, selectedBusiness.name, activeEditorLocationId]);


  useEffect(() => {
    if (activeEditorLocationId) return;
    const w = userDataProp?.website || primaryLoc.websiteUrl;
    if (w) setFields((f) => ({ ...f, website: f.website || w }));
  }, [userDataProp?.website, primaryLoc.websiteUrl, activeEditorLocationId]);

  useEffect(() => {
    if (activeEditorLocationId) return;
    const p = userDataProp?.phone;
    if (p) setFields((f) => ({ ...f, phone: f.phone || p }));
  }, [userDataProp?.phone, activeEditorLocationId]);

  useEffect(() => {
    if (!activeEditorLocationId) return;
    const loc = gmbLocations.find((l) => l.locationId === activeEditorLocationId);
    if (!loc) return;
    // Full hydrate only when the editor switches to a different location. When the
    // SAME location's gmbLocations array merely refreshes (e.g. after a save), we
    // must NOT overwrite the user's in-progress edits (service areas, hours, phone,
    // website, WhatsApp) — that was wiping serviceAreaPlaces to [] before save.
    const locationChanged = lastHydratedLocRef.current !== activeEditorLocationId;
    lastHydratedLocRef.current = activeEditorLocationId;
    // Switching location forgets previous edits; same-location refresh keeps them.
    if (locationChanged) dirtyFieldsRef.current = new Set();
    const keep = (key, freshVal, curVal) =>
      dirtyFieldsRef.current.has(key) ? curVal : freshVal;

    const saList =
      Array.isArray(loc.serviceAreaPlaces) && loc.serviceAreaPlaces.length > 0
        ? [...loc.serviceAreaPlaces]
        : parseServiceAreaPlacesFromText(loc.serviceAreaText || "");
    const googleDesc =
      loc.profileDescription != null && String(loc.profileDescription).trim() !== ""
        ? clampGmbDescription(loc.profileDescription)
        : null;
    const descFromSettings =
      profileDescriptionProp != null && String(profileDescriptionProp).trim() !== ""
        ? clampGmbDescription(profileDescriptionProp)
        : null;
    const nextDescription = googleDesc != null ? googleDesc : descFromSettings;
    const wa =
      Object.prototype.hasOwnProperty.call(loc, "whatsappUri") && typeof loc.whatsappUri === "string"
        ? loc.whatsappUri.trim()
        : null;
    const rp = clonePeriods(loc.regularHours?.periods || []);
    if (locationChanged) setHoursBaseline(JSON.stringify(rp));
    setFields((f) => ({
      ...f,
      // Display / read-only fields can always refresh from Google:
      businessName: loc.title || f.businessName,
      primaryCategory: loc.primaryCategory || f.primaryCategory,
      googleOpenStatus: loc.openStatus || f.googleOpenStatus,
      hoursSummary: loc.hoursSummaryText || f.hoursSummary,
      // User-editable fields: fill from Google unless the user edited them this session.
      ...(nextDescription != null && !dirtyFieldsRef.current.has("description")
        ? { description: nextDescription }
        : {}),
      phone: keep("phone", loc.phone || f.phone, f.phone),
      website: keep("website", loc.websiteUrl || f.website, f.website),
      chatUrl: keep("chatUrl", wa !== null ? wa : f.chatUrl, f.chatUrl),
      services: keep("services", loc.services || "", f.services),
      serviceItems: keep(
        "serviceItems",
        hydrateServiceItems(Array.isArray(loc.serviceItemsList) ? loc.serviceItemsList : []),
        f.serviceItems
      ),
      serviceAreaPlaces: keep("serviceAreaPlaces", saList, f.serviceAreaPlaces),
      regularHoursPeriods: keep("regularHoursPeriods", rp, f.regularHoursPeriods),
    }));
  }, [activeEditorLocationId, gmbLocations, profileDescriptionProp]);

  const businessName = fields.businessName || selectedBusiness.title || "";

  const groupedAttrs = useMemo(() => {
    const m = new Map();
    for (const a of categoryAttrs) {
      const g = a.group || "Other";
      if (!m.has(g)) m.set(g, []);
      m.get(g).push(a);
    }
    return [...m.entries()];
  }, [categoryAttrs]);

  const attrStats = useMemo(() => {
    let set = 0;
    let unsaved = 0;
    for (const a of categoryAttrs) {
      if (attrIsSet(attrValues[a.name], a.valueType)) set++;
      if (!attrValuesEqual(attrValues[a.name], a.currentValue)) unsaved++;
    }
    return { total: categoryAttrs.length, set, unsaved };
  }, [categoryAttrs, attrValues]);

  // Load the category's attribute set + current values for the active location.
  // Only relevant on the Google-sync optimization page (gmbSyncMode). Guards stale
  // responses with a request token so a fast location switch doesn't apply old data.
  const reloadCategoryFields = useCallback(async () => {
    const accountId = activeEnriched?.accountId || "";
    const locationId = activeEditorLocationId;
    const reqToken = ++categoryReqRef.current;
    if (!gmbSyncMode || !accountId || !locationId) {
      setCategoryAttrs([]);
      setAttrValues({});
      setCapabilities({});
      setCategoryPrimary(null);
      setCategoryAdditional([]);
      setCategoryDirty(false);
      attrDirtyRef.current = new Set();
      return;
    }
    setAttrLoading(true);
    setAttrError("");
    try {
      const res = await fetch(
        `/api/gmb/category-fields?accountId=${encodeURIComponent(accountId)}&locationId=${encodeURIComponent(locationId)}`
      );
      const data = await res.json().catch(() => ({}));
      if (categoryReqRef.current !== reqToken) return; // a newer request superseded this one
      if (!res.ok) {
        setAttrError(data.error || "Could not load category fields from Google.");
        setCategoryAttrs([]);
        setAttrValues({});
        return;
      }
      setCapabilities(data.capabilities || {});
      const attrs = Array.isArray(data.attributes) ? data.attributes : [];
      const seeded = {};
      for (const a of attrs) {
        seeded[a.name] =
          a.currentValue ?? (a.valueType === "REPEATED_ENUM" ? [] : a.valueType === "BOOL" ? false : "");
      }
      setCategoryAttrs(attrs);
      setAttrValues(seeded);
      attrDirtyRef.current = new Set();

      // Reflect currently-SET accessibility / amenity attributes from Google into the
      // "Accessibility and amenities" More-tab field as a readable summary (those are the
      // only More-tab data Google actually exposes — via attributes).
      const amenityLabels = [];
      for (const a of attrs) {
        const g = String(a.group || "").toLowerCase();
        if (!/accessib|amenit|service option|offerings|highlight|payment|from the business|planning/.test(g)) continue;
        const v = seeded[a.name];
        if (a.valueType === "BOOL" && v === true) amenityLabels.push(a.displayName);
        else if (a.valueType === "REPEATED_ENUM" && Array.isArray(v) && v.length) {
          const opts = new Map((a.options || []).map((o) => [String(o.value), o.label]));
          for (const val of v) amenityLabels.push(`${a.displayName}: ${opts.get(String(val)) || val}`);
        } else if (a.valueType === "ENUM" && v) {
          const opts = new Map((a.options || []).map((o) => [String(o.value), o.label]));
          amenityLabels.push(`${a.displayName}: ${opts.get(String(v)) || v}`);
        }
      }
      const amenitySummary = amenityLabels.join(", ");
      // Sync the editable category picker with the live categories from Google.
      setCategoryPrimary(
        data.primaryCategoryName
          ? { name: data.primaryCategoryName, displayName: data.primaryCategory || data.primaryCategoryName }
          : null
      );
      setCategoryAdditional(
        Array.isArray(data.additionalCategories)
          ? data.additionalCategories
              .map((c) => ({ name: String(c?.name || "").trim(), displayName: String(c?.displayName || "").trim() }))
              .filter((c) => c.name)
          : []
      );
      setCategoryDirty(false);

      // Pre-fill Contact-tab WhatsApp & Booking from Google's current URL attributes
      // (they live in attributes, not the main location fetch). Also seed the live
      // description here — the single-location GET returns profile.description reliably,
      // while the list endpoint that feeds gmbLocations often omits it. Respect edits.
      const ca = data.contactAttributes || {};
      const liveDesc = typeof data.profileDescription === "string" ? data.profileDescription.trim() : "";
      const liveServices = Array.isArray(data.serviceItemsList)
        ? hydrateServiceItems(data.serviceItemsList)
        : [];
      const liveAreas = Array.isArray(data.serviceAreaPlaces)
        ? data.serviceAreaPlaces.map((s) => String(s).trim()).filter(Boolean)
        : [];
      const liveHours = Array.isArray(data.regularHoursPeriods) ? clonePeriods(data.regularHoursPeriods) : [];
      // Keep the dirty-baseline in sync so a fresh fetch of hours doesn't look "unsaved".
      if (liveHours.length && !dirtyFieldsRef.current.has("regularHoursPeriods")) {
        setHoursBaseline(JSON.stringify(liveHours));
      }
      setFields((f) => ({
        ...f,
        chatUrl: dirtyFieldsRef.current.has("chatUrl") ? f.chatUrl : (ca.whatsappUri || f.chatUrl || ""),
        bookingUrl: dirtyFieldsRef.current.has("bookingUrl") ? f.bookingUrl : (ca.bookingUri || f.bookingUrl || ""),
        description:
          dirtyFieldsRef.current.has("description") || !liveDesc
            ? f.description
            : clampGmbDescription(liveDesc),
        serviceItems:
          dirtyFieldsRef.current.has("serviceItems") || !liveServices.length
            ? f.serviceItems
            : liveServices,
        serviceAreaPlaces:
          dirtyFieldsRef.current.has("serviceAreaPlaces") || !liveAreas.length
            ? f.serviceAreaPlaces
            : liveAreas,
        regularHoursPeriods:
          dirtyFieldsRef.current.has("regularHoursPeriods") || !liveHours.length
            ? f.regularHoursPeriods
            : liveHours,
        accessibility:
          dirtyFieldsRef.current.has("accessibility") || !amenitySummary
            ? f.accessibility
            : amenitySummary,
      }));
    } catch {
      if (categoryReqRef.current === reqToken) setAttrError("Could not load category fields from Google.");
    } finally {
      if (categoryReqRef.current === reqToken) setAttrLoading(false);
    }
  }, [gmbSyncMode, activeEnriched?.accountId, activeEditorLocationId]);

  useEffect(() => {
    void reloadCategoryFields();
  }, [reloadCategoryFields]);

  const canHaveFoodMenus = !!capabilities.canHaveFoodMenus;

  const reloadFoodMenu = useCallback(async () => {
    const accountId = activeEnriched?.accountId || "";
    const locationId = activeEditorLocationId;
    const reqToken = ++menuReqRef.current;
    if (!gmbSyncMode || !accountId || !locationId || !canHaveFoodMenus) {
      setFoodMenu({ currency: "INR", sections: [] });
      menuDirtyRef.current = false;
      return;
    }
    setMenuLoading(true);
    setMenuError("");
    try {
      const res = await fetch(
        `/api/gmb/food-menu?accountId=${encodeURIComponent(accountId)}&locationId=${encodeURIComponent(locationId)}`
      );
      const data = await res.json().catch(() => ({}));
      if (menuReqRef.current !== reqToken) return;
      if (!res.ok) {
        setMenuError(data.error || "Could not load menu from Google.");
        return;
      }
      setFoodMenu(data.menu && typeof data.menu === "object" ? data.menu : { currency: "INR", sections: [] });
      menuDirtyRef.current = false;
    } catch {
      if (menuReqRef.current === reqToken) setMenuError("Could not load menu from Google.");
    } finally {
      if (menuReqRef.current === reqToken) setMenuLoading(false);
    }
  }, [gmbSyncMode, activeEnriched?.accountId, activeEditorLocationId, canHaveFoodMenus]);

  useEffect(() => {
    void reloadFoodMenu();
  }, [reloadFoodMenu]);

  // If the active tab requires a capability the current location lacks, fall back.
  useEffect(() => {
    if (tab === "menu" && !canHaveFoodMenus) setTab("about");
  }, [tab, canHaveFoodMenus]);

  const handleSaveFoodMenu = useCallback(async () => {
    const accountId = activeEnriched?.accountId || "";
    if (!gmbSyncMode || !accountId || !activeEditorLocationId) return;
    setMenuSaving(true);
    try {
      const res = await fetch("/api/gmb/food-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, locationId: activeEditorLocationId, menu: foodMenu }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not save menu");
      if (data.menu) setFoodMenu(data.menu);
      menuDirtyRef.current = false;
      toast.success("Menu saved to Google.");
    } catch (e) {
      toast.error(e.message || "Could not save menu");
    } finally {
      setMenuSaving(false);
    }
  }, [gmbSyncMode, activeEnriched?.accountId, activeEditorLocationId, foodMenu]);

  const setFoodMenuDirty = useCallback((next) => {
    menuDirtyRef.current = true;
    setFoodMenu(next);
  }, []);

  const hoursDirty = useMemo(
    () => JSON.stringify(fields.regularHoursPeriods || []) !== hoursBaseline,
    [fields.regularHoursPeriods, hoursBaseline]
  );

  // Every Google write MUST target the location the user is actually editing. The parent
  // otherwise falls back to the first location, so editing a non-first location (e.g. a
  // second branch) would silently update the wrong listing. Inject the active location
  // (and its account) into every sync payload so the correct location is patched.
  const syncToGmb = useCallback(
    (payload) => {
      if (typeof onSyncToGmb !== "function") return Promise.resolve();
      return onSyncToGmb({
        ...(activeEditorLocationId ? { locationId: activeEditorLocationId } : {}),
        ...(activeEnriched?.accountId ? { accountId: activeEnriched.accountId } : {}),
        ...payload,
      });
    },
    [onSyncToGmb, activeEditorLocationId, activeEnriched?.accountId]
  );

  const handleSave = useCallback(async () => {
    try {
      const desc = clampGmbDescription((fields.description || "").trim());
      const places = Array.isArray(fields.serviceAreaPlaces) ? fields.serviceAreaPlaces : [];
      const dirtyAttrs = categoryAttrs
        .filter((a) => attrDirtyRef.current.has(a.name))
        .map((a) => ({ name: a.name, valueType: a.valueType, values: attrValues[a.name] }));
      // Only send services when the editor was touched, so untouched listings are not
      // re-converted/cleared. Structured serviceItems carry title + description.
      const serviceItemsDirty = dirtyFieldsRef.current.has("serviceItems");
      const serviceItemsClean = serviceItemsForGoogle(fields.serviceItems);
      const categoriesDirty = categoryDirty && Boolean(categoryPrimary?.name);
      if (gmbSyncMode && activeEditorLocationId && typeof onSyncToGmb === "function") {
        await syncToGmb({
          description: desc,
          ...(serviceItemsDirty ? { serviceItems: serviceItemsClean } : {}),
          primaryPhone: (fields.phone || "").trim(),
          websiteUri: (fields.website || "").trim(),
          chatUrl: (fields.chatUrl || "").trim(),
          bookingUrl: (fields.bookingUrl || "").trim(),
          serviceAreaPlaces: places,
          ...(hoursDirty ? { regularHours: { periods: fields.regularHoursPeriods || [] } } : {}),
          ...(dirtyAttrs.length ? { attributes: dirtyAttrs } : {}),
          ...(categoriesDirty
            ? {
                categories: {
                  primary: categoryPrimary.name,
                  additional: categoryAdditional.map((c) => c.name).filter(Boolean),
                },
              }
            : {}),
        });
        if (dirtyAttrs.length || categoriesDirty) {
          setCategoryDirty(false);
          await reloadCategoryFields();
        }
        return;
      }
      if (savePushesDescriptionAndServiceArea && typeof onSaveOptimization === "function") {
        await onSaveOptimization({
          locationId: activeEditorLocationId,
          description: desc,
          ...(serviceItemsDirty ? { serviceItems: serviceItemsClean } : {}),
          // Phone is intentionally not synced to Google.
          websiteUri: (fields.website || "").trim(),
          chatUrl: (fields.chatUrl || "").trim(),
          serviceAreaPlaces: places,
          ...(hoursDirty ? { regularHours: { periods: fields.regularHoursPeriods || [] } } : {}),
        });
        return;
      }
      if (onConfirmProfileDescription) await Promise.resolve(onConfirmProfileDescription(desc));
    } catch (e) {
      toast.error(e.message || "Save failed");
    }
  }, [
    savePushesDescriptionAndServiceArea,
    gmbSyncMode,
    onSyncToGmb,
    onSaveOptimization,
    activeEditorLocationId,
    onConfirmProfileDescription,
    fields.description,
    fields.serviceItems,
    fields.serviceAreaPlaces,
    fields.phone,
    fields.website,
    fields.chatUrl,
    hoursDirty,
    fields.regularHoursPeriods,
    categoryAttrs,
    attrValues,
    reloadCategoryFields,
    categoryDirty,
    categoryPrimary,
    categoryAdditional,
  ]);

  const canSyncGmb =
    Boolean(activeEditorLocationId) &&
    Boolean(
      (fields.description || "").trim() ||
        (fields.phone || "").trim() ||
        (fields.website || "").trim() ||
        (fields.chatUrl || "").trim() ||
        (Array.isArray(fields.serviceAreaPlaces) && fields.serviceAreaPlaces.length > 0) ||
        hoursDirty ||
        (categoryDirty && Boolean(categoryPrimary?.name))
    );

  const handleSaveServiceAreasToGoogle = useCallback(async () => {
    if (!gmbSyncMode || !activeEditorLocationId || typeof onSyncToGmb !== "function") return;
    try {
      await syncToGmb({
        serviceAreaPlaces: Array.isArray(fields.serviceAreaPlaces) ? fields.serviceAreaPlaces : [],
      });
    } catch (e) {
      toast.error(e.message || "Could not save service areas");
    }
  }, [gmbSyncMode, activeEditorLocationId, onSyncToGmb, fields.serviceAreaPlaces]);

  // Push holidays as Google structured special hours (each holiday = closed that day).
  const handleSaveSpecialHoursToGoogle = useCallback(
    async (holidays) => {
      if (!gmbSyncMode || !activeEditorLocationId || typeof onSyncToGmb !== "function") return;
      const specialHours = (Array.isArray(holidays) ? holidays : [])
        .map((h) => ({ date: String(h?.date || "").trim(), closed: true }))
        .filter((h) => /^\d{4}-\d{2}-\d{2}$/.test(h.date));
      if (!specialHours.length) {
        toast.error("Generate and select at least one holiday first.");
        return;
      }
      try {
        await syncToGmb({ specialHours });
      } catch (e) {
        toast.error(e.message || "Could not save special hours");
      }
    },
    [gmbSyncMode, activeEditorLocationId, onSyncToGmb, syncToGmb]
  );

  const handleSaveServiceItems = useCallback(async () => {
    if (!gmbSyncMode || !activeEditorLocationId || typeof onSyncToGmb !== "function") return;
    const cleaned = serviceItemsForGoogle(fields.serviceItems);
    try {
      await syncToGmb({ serviceItems: cleaned });
    } catch (e) {
      toast.error(e.message || "Could not save services");
    }
  }, [gmbSyncMode, activeEditorLocationId, onSyncToGmb, fields.serviceItems]);

  const handleGenerateWebsiteFromBuilder = useCallback(async () => {
    const title = (fields.businessName || primaryLoc.title || selectedBusiness.title || "").trim();
    const locality = (primaryLoc.locality || "").trim();
    const primaryCategory = (fields.primaryCategory || categoryHint[0] || activeEnriched?.primaryCategory || "").trim();
    if (!title || !primaryCategory) {
      toast.error("Business name and primary category are required to generate website.");
      return;
    }
    const storedUserId =
      typeof window !== "undefined" ? localStorage.getItem("userId") : null;
    const chatbotPhone =
      typeof window !== "undefined" ? localStorage.getItem("chatbotPhone") : null;
    const siteOwnerId = resolveSiteUserId({
      userId: storedUserId,
      phone: chatbotPhone || fields.phone || userData?.phone,
    });
    if (!siteOwnerId) {
      toast.error(
        "User ID or phone not found. Connect Google Business or log in to save the site."
      );
      return;
    }
    setWebsiteBuilderPending(true);
    try {
      const aiRes = await fetch("/api/ai-genrated-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          locality,
          primaryCategory,
          additionalCategories: categoryHint.slice(1),
        }),
      });
      const aiData = await aiRes.json().catch(() => ({}));
      if (!aiRes.ok || !aiData?.content) {
        throw new Error(aiData?.error || "Website builder generation failed");
      }

      const slug = String(aiData.slug || "").trim();
      const saveRes = await fetch("/api/save-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          userId: siteOwnerId,
          phone: chatbotPhone || fields.phone || userData?.phone || undefined,
          locationId: activeEditorLocationId || undefined,
          type: isChatbotSiteOwnerId(siteOwnerId) ? "chatbot" : undefined,
          business: {
            title,
            locality,
            primaryCategory,
            additionalCategories: categoryHint.slice(1),
            address: primaryLoc.address || "",
            primaryPhone: (fields.phone || "").trim() || undefined,
            phoneNumbers: (fields.phone || "").trim()
              ? { primaryPhone: (fields.phone || "").trim() }
              : undefined,
          },
          aiContent: aiData.content,
          mediaImages: [],
        }),
      });
      const saveData = await saveRes.json().catch(() => ({}));
      if (!saveRes.ok) {
        throw new Error(saveData?.error || "Could not save website to database.");
      }

      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "limbu.ai";
      const websiteUri = slug ? `https://${slug}.${rootDomain}` : "";
      if (!websiteUri) throw new Error("Website URL generation failed");
      setFields((f) => ({ ...f, website: websiteUri }));
      if (gmbSyncMode && activeEditorLocationId && typeof onSyncToGmb === "function") {
        await syncToGmb({ websiteUri });
      }
      toast.success(
        gmbSyncMode && activeEditorLocationId
          ? "Site saved to your account and website URL synced to Google."
          : "Website generated and saved to your account."
      );
    } catch (e) {
      toast.error(e.message || "Could not generate website");
    } finally {
      setWebsiteBuilderPending(false);
    }
  }, [
    fields.businessName,
    fields.primaryCategory,
    primaryLoc.title,
    primaryLoc.locality,
    primaryLoc.address,
    selectedBusiness.title,
    categoryHint,
    activeEnriched?.primaryCategory,
    activeEditorLocationId,
    gmbSyncMode,
    onSyncToGmb,
    fields.phone,
    userData?.phone,
  ]);

  const handleFieldSave = useCallback(
    async ({ fieldId, value: nextValue }) => {
      if (!gmbSyncMode || !activeEditorLocationId || typeof onSyncToGmb !== "function") return;
      const text = String(nextValue ?? "").trim();
      if (!text && fieldId !== "description") return;
      const payload = {};
      if (fieldId === "description") payload.description = clampGmbDescription(text);
      if (fieldId === "services") payload.services = text;
      if (fieldId === "phone") payload.primaryPhone = text;
      if (fieldId === "website") payload.websiteUri = text;
      if (fieldId === "chatUrl") payload.chatUrl = text;
      if (fieldId === "bookingUrl") payload.bookingUrl = text;
      if (Object.keys(payload).length === 0) return;
      try {
        await syncToGmb(payload);
      } catch (e) {
        toast.error(e.message || "Could not sync this field");
      }
    },
    [gmbSyncMode, activeEditorLocationId, onSyncToGmb]
  );

  const handleAttributeSave = useCallback(
    async (name) => {
      if (!gmbSyncMode || !activeEditorLocationId || typeof onSyncToGmb !== "function") return;
      const a = categoryAttrs.find((x) => x.name === name);
      if (!a) return;
      try {
        await syncToGmb({
          attributes: [{ name: a.name, valueType: a.valueType, values: attrValues[a.name] }],
        });
        await reloadCategoryFields();
      } catch (e) {
        toast.error(e.message || "Could not save attribute");
      }
    },
    [gmbSyncMode, activeEditorLocationId, onSyncToGmb, categoryAttrs, attrValues, reloadCategoryFields]
  );

  const handleCategoryChange = useCallback((next) => {
    setCategoryDirty(true);
    if (next.primary !== undefined) setCategoryPrimary(next.primary);
    if (next.additional !== undefined) setCategoryAdditional(next.additional);
  }, []);

  const handleSaveCategories = useCallback(async () => {
    if (!gmbSyncMode || !activeEditorLocationId || typeof onSyncToGmb !== "function") return;
    if (!categoryPrimary?.name) {
      toast.error("Pick a primary category first.");
      return;
    }
    setCategorySaving(true);
    try {
      await syncToGmb({
        categories: {
          primary: categoryPrimary.name,
          additional: categoryAdditional.map((c) => c.name).filter(Boolean),
        },
      });
      setCategoryDirty(false);
      // Changing the category changes the available attribute set — reload both.
      await reloadCategoryFields();
    } catch (e) {
      toast.error(e.message || "Could not save categories");
    } finally {
      setCategorySaving(false);
    }
  }, [gmbSyncMode, activeEditorLocationId, onSyncToGmb, categoryPrimary, categoryAdditional, reloadCategoryFields]);

  const categoryRegionCode = primaryLoc?.regionCode || activeEnriched?.regionCode || "IN";

  const sharedFieldProps = {
    businessName,
    categoryHint,
    userData,
    primaryLoc,
    aiContext: optimizationContext,
    onSaveField: handleFieldSave,
  };

  const categoryBlock = useMemo(
    () => (
      <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid #eef2f6" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: ".07em" }}>
            Business categories
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: ".06em",
              color: "#64748b",
              background: "#f1f5f9",
              border: "1px solid #e2e8f0",
              padding: "4px 10px",
              borderRadius: 20,
            }}
          >
            Not editable
          </span>
        </div>
        <p style={{ margin: "0 0 12px", fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>
          Shown from Google. Update categories in Google Business Profile if needed.
        </p>
        {categoryHint.length ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {categoryHint.map((c, i) => (
              <span
                key={`${c}-${i}`}
                style={{
                  fontSize: 12,
                  padding: "6px 14px",
                  borderRadius: 20,
                  background: i === 0 ? "linear-gradient(135deg, #FEFCE8, #FEF9C3)" : "#f1f5f9",
                  color: i === 0 ? "#854D0E" : "#475569",
                  fontWeight: i === 0 ? 800 : 500,
                  border: i === 0 ? "1px solid #FDE047" : "1px solid #e2e8f0",
                }}
              >
                {c}
                {i === 0 && (
                  <span style={{ fontSize: 9, marginLeft: 6, opacity: 0.75, textTransform: "uppercase" }}>Primary</span>
                )}
              </span>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: "#94a3b8" }}>Connect a location or add keywords in Settings to improve AI suggestions.</div>
        )}
      </div>
    ),
    [categoryHint]
  );

  const handleContinuePick = useCallback(() => {
    if (!pickSelectionId) return;
    setActiveEditorLocationId(pickSelectionId);
    setEditorPhase("edit");
  }, [pickSelectionId]);

  const handleChangeLocation = useCallback(() => {
    setPickSelectionId(activeEditorLocationId || null);
    setEditorPhase("pick");
    setActiveEditorLocationId(null);
  }, [activeEditorLocationId]);

  const shellPad = embedded ? "0" : "28px 40px 0";
  const gridPad = embedded ? "0 0 24px" : "0 40px 40px";
  const gridColumns = "minmax(0, 1fr)";
  const gridMinHeight = embedded ? "auto" : "calc(100vh - 148px)";


  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&family=Sora:wght@700;800&display=swap');
        .biz-opt-scope * { box-sizing: border-box; }
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes slideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes popIn{from{opacity:0;transform:scale(.92) translateY(-4px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes modalIn{from{opacity:0;transform:scale(.92) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        .biz-opt-scope ::-webkit-scrollbar{width:6px}
        .biz-opt-scope ::-webkit-scrollbar-track{background:transparent}
        .biz-opt-scope ::-webkit-scrollbar-thumb{background:rgba(202,138,4,.25);border-radius:6px}
        ${!embedded ? `body{background:#eef1f8;font-family:'DM Sans',system-ui,sans-serif;}` : ""}
      `}</style>

      <div className="biz-opt-scope" style={{ minHeight: embedded ? "auto" : "100vh", background: embedded ? "transparent" : "#eef1f8" }}>
        {!embedded && (
          <div style={{ padding: shellPad }}>
            <button
              type="button"
              onClick={() => onBack?.()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                fontWeight: 600,
                color: "#64748b",
                background: "none",
                border: "none",
                cursor: onBack ? "pointer" : "default",
                padding: 0,
                fontFamily: "inherit",
                marginBottom: 16,
                opacity: onBack ? 1 : 0.5,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to Settings
            </button>
            <div style={{ marginBottom: 24 }}>
              <h1
                style={{
                  fontSize: 30,
                  fontWeight: 800,
                  color: "#0f172a",
                  fontFamily: "'Sora', sans-serif",
                  letterSpacing: "-.025em",
                  marginBottom: 6,
                }}
              >
                Business Optimization
              </h1>
              <p style={{ fontSize: 13, color: "#64748b", maxWidth: 640, lineHeight: 1.55 }}>
                Google Business Profile style editor — use <strong style={{ color: "#CA8A04" }}>Edit</strong> on supported fields for drafts, then save or sync.
              </p>
            </div>
          </div>
        )}

        {embedded && editorPhase !== "pick" && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", letterSpacing: "-.02em" }}>Profile fields</div>
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 6, lineHeight: 1.5 }}>
              Choose a location if you have several. Edits use the Business Information API; after <strong style={{ color: "#CA8A04" }}>Save changes</strong>,
              the app refetches live data from Google.
            </p>
          </div>
        )}

        {editorPhase === "pick" && gmbLocations.length > 0 ? (
          <div style={{ padding: gridPad }}>
            <div
              style={{
                background: "#fff",
                borderRadius: 18,
                border: `1px solid ${CAT.softBorder}`,
                boxShadow: "0 4px 28px rgba(120,90,10,.08)",
                maxWidth: 640,
                margin: "0 auto",
                overflow: "hidden",
              }}
            >
              <div style={{ padding: "22px 24px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: 13 }}>
                <div style={{ width: 44, height: 44, borderRadius: 13, background: CAT.g100, color: CAT.gold, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <TabIconPin />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: "#111827" }}>
                    Choose a location
                  </h2>
                  <p style={{ margin: "3px 0 0", fontSize: 13.5, color: "#6b7280", lineHeight: 1.45 }}>
                    Pick which listing to edit. You can switch anytime.
                  </p>
                </div>
              </div>
              <div style={{ padding: 14, maxHeight: "min(440px, 55vh)", overflowY: "auto" }}>
                {gmbLocations.map((loc) => {
                  const selected = pickSelectionId === loc.locationId;
                  const line = loc.fullAddress || [loc.address, loc.locality].filter(Boolean).join(", ");
                  return (
                    <button
                      key={loc.locationId}
                      type="button"
                      onClick={() => setPickSelectionId(loc.locationId)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                        padding: "15px 16px",
                        marginBottom: 10,
                        borderRadius: 14,
                        border: `1.5px solid ${selected ? CAT.gold : "#e5e7eb"}`,
                        background: selected ? CAT.g50 : "#fff",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        transition: "border-color .15s, background .15s, box-shadow .15s",
                        boxShadow: selected ? `0 0 0 4px ${CAT.ring}` : "none",
                      }}
                    >
                      <span
                        style={{
                          width: 22, height: 22, marginTop: 2, flexShrink: 0, borderRadius: "50%",
                          border: `2px solid ${selected ? CAT.gold : "#d1d5db"}`,
                          background: selected ? CAT.gold : "#fff",
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        {selected ? <CheckIcon size={12} color="#fff" /> : null}
                      </span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "block", fontSize: 15.5, fontWeight: 700, color: "#111827" }}>{loc.title}</span>
                        <span style={{ display: "block", fontSize: 13.5, color: "#6b7280", marginTop: 5, lineHeight: 1.5 }}>{line || "—"}</span>
                        {loc.isVerified && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: "#137333", marginTop: 7 }}>
                            <CheckIcon size={11} color="#137333" /> Verified on Google
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div
                style={{
                  padding: "14px 20px",
                  borderTop: "1px solid #f3f4f6",
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  gap: 12,
                  background: "#fffdf5",
                }}
              >
                <button
                  type="button"
                  onClick={handleContinuePick}
                  disabled={!pickSelectionId}
                  style={{
                    background: pickSelectionId ? CAT.gold : "#f3f4f6",
                    color: pickSelectionId ? "#fff" : "#9ca3af",
                    border: "none",
                    borderRadius: 11,
                    padding: "11px 30px",
                    fontWeight: 800,
                    fontSize: 14,
                    cursor: pickSelectionId ? "pointer" : "not-allowed",
                    fontFamily: "inherit",
                    boxShadow: pickSelectionId ? "0 4px 14px rgba(202,138,4,.32)" : "none",
                    transition: "background .15s",
                  }}
                  onMouseEnter={(e) => { if (pickSelectionId) e.currentTarget.style.background = CAT.goldHover; }}
                  onMouseLeave={(e) => { if (pickSelectionId) e.currentTarget.style.background = CAT.gold; }}
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: gridColumns,
            gap: 20,
            padding: gridPad,
            minHeight: gridMinHeight,
            alignContent: "start",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 18,
              boxShadow: "0 4px 32px rgba(15,23,42,.08)",
              border: "1px solid #e4e9f2",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              minHeight: embedded ? 520 : 0,
            }}
          >
            <div
              style={{
                padding: "18px 26px 14px",
                borderBottom: "1px solid #f3f4f6",
                background: "linear-gradient(135deg, #fffdf5, #fefce8)",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: CAT.gold,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  boxShadow: "0 6px 18px rgba(202,138,4,.32)",
                }}
              >
                <TabIconBuilding />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>Business information</div>
                <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 500, marginTop: 2 }}>
                  <strong style={{ color: CAT.goldText }}>Edit</strong> per field — AI draft or type yourself
                </div>
              </div>
            </div>

            {activeEnriched ? (
              <div
                style={{
                  padding: "12px 26px",
                  borderBottom: "1px solid #f0f4f8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                  background: "#FFFDF5",
                }}
              >
                <div style={{ fontSize: 13, color: "#5f6368" }}>
                  <span style={{ fontWeight: 700, color: "#202124" }}>{activeEnriched.title}</span>
                  {activeEnriched.isVerified ? (
                    <span style={{ marginLeft: 8, color: "#137333", fontWeight: 600 }}>· Verified</span>
                  ) : null}
                </div>
                {(requireLocationPick ?? (embedded && gmbLocations.length > 1)) ? (
                  <button
                    type="button"
                    onClick={handleChangeLocation}
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#CA8A04",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Change location
                  </button>
                ) : null}
              </div>
            ) : null}

            <div
              style={{
                display: "flex",
                padding: "0 12px",
                borderBottom: "1px solid #f0f4f8",
                overflowX: "auto",
                flexShrink: 0,
                gap: 2,
              }}
            >
              {TABS.filter((tb) => !tb.cap || capabilities[tb.cap]).map((tb) => {
                const active = tab === tb.id;
                const Icon = tb.Icon;
                return (
                  <button
                    key={tb.id}
                    type="button"
                    onClick={() => setTab(tb.id)}
                    style={{
                      flex: "0 0 auto",
                      padding: "12px 14px",
                      fontSize: 12,
                      fontWeight: active ? 800 : 500,
                      color: active ? "#A16207" : "#64748b",
                      background: active ? "rgba(202,138,4,.06)" : "none",
                      border: "none",
                      borderBottom: active ? "2.5px solid #CA8A04" : "2.5px solid transparent",
                      marginBottom: -1,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      whiteSpace: "nowrap",
                      transition: "color .15s",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      borderRadius: "10px 10px 0 0",
                    }}
                  >
                    <span style={{ color: active ? "#CA8A04" : "#94a3b8", display: "flex" }}>
                      <Icon />
                    </span>
                    {tb.label}
                    {tb.id === "category" && attrStats.unsaved > 0 && (
                      <span style={{
                        minWidth: 16, height: 16, padding: "0 4px", borderRadius: 8,
                        background: "#CA8A04", color: "#fff", fontSize: 10, fontWeight: 800,
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {attrStats.unsaved}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "22px 26px" }}>
              {tab === "about" && (
                <div style={{ animation: "slideIn .25s ease" }}>
                  <SectionBlock title="About your business" hint={`Description is limited to ${GMB_PROFILE_DESCRIPTION_MAX} characters on Google.`}>
                    <DisabledInfoRow
                      label="Business name"
                      value={fields.businessName}
                      hint="Update the title in Google Business Profile if you need to change it."
                    />
                    {gmbSyncMode ? (
                      <CategoryEditor
                        disabled={!activeEditorLocationId}
                        primary={categoryPrimary}
                        additional={categoryAdditional}
                        onChange={handleCategoryChange}
                        onSave={handleSaveCategories}
                        saving={categorySaving}
                        dirty={categoryDirty}
                        regionCode={categoryRegionCode}
                        languageCode="en"
                        accountId={activeEnriched?.accountId || ""}
                        fallbackChips={categoryHint}
                      />
                    ) : (
                      categoryBlock
                    )}
                    <ServiceItemsEditor
                      items={fields.serviceItems}
                      onChange={setField("serviceItems")}
                      aiContext={optimizationContext}
                      businessName={businessName}
                      categoryHint={categoryHint}
                      onSave={gmbSyncMode ? handleSaveServiceItems : undefined}
                      savePending={syncToGmbPending}
                      categories={gmbSyncMode ? serviceCategories : []}
                      regionCode={categoryRegionCode}
                      languageCode="en"
                      accountId={activeEnriched?.accountId || ""}
                    />
                    <DescriptionGenerator
                      aiContext={optimizationContext}
                      businessName={businessName}
                      categoryHint={categoryHint}
                      primaryLoc={primaryLoc}
                      onInsert={(text) => setField("description")(text)}
                    />
                    <FieldRow
                      label="Description"
                      fieldId="description"
                      value={fields.description}
                      onChange={setField("description")}
                      multiline
                      maxLength={GMB_PROFILE_DESCRIPTION_MAX}
                      manualOnly
                      suggestAiInEdit
                      onSaveField={handleFieldSave}
                      manualHint={
                        savePushesDescriptionAndServiceArea
                          ? `Google profile.description (max ${GMB_PROFILE_DESCRIPTION_MAX} chars). Tap Edit, then Save, Cancel, or AI Suggestion. Save changes syncs everything.`
                          : "Google profile.description — tap Edit, then Save, Cancel, or AI Suggestion."
                      }
                      noBottomRule
                    />
                    {gmbSyncMode ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          onClick={() =>
                            void handleFieldSave({ fieldId: "description", value: fields.description })
                          }
                          disabled={syncToGmbPending || !String(fields.description || "").trim()}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 22px",
                            borderRadius: 12, border: "none",
                            cursor: syncToGmbPending || !String(fields.description || "").trim() ? "not-allowed" : "pointer",
                            background:
                              syncToGmbPending || !String(fields.description || "").trim() ? "#f3f4f6" : "#CA8A04",
                            color: syncToGmbPending || !String(fields.description || "").trim() ? "#9ca3af" : "#fff",
                            fontSize: 14, fontWeight: 800, fontFamily: "inherit",
                            boxShadow:
                              syncToGmbPending || !String(fields.description || "").trim()
                                ? "none"
                                : "0 4px 14px rgba(202,138,4,.32)",
                          }}
                        >
                          {syncToGmbPending ? "Saving…" : "Save description to Google"}
                        </button>
                        <span style={{ fontSize: 12, color: "#94a3b8" }}>
                          {String(fields.description || "").length} / {GMB_PROFILE_DESCRIPTION_MAX} chars — saves straight to your Google profile.
                        </span>
                      </div>
                    ) : null}
                  </SectionBlock>
                </div>
              )}

              {tab === "contact" && (
                <div style={{ animation: "slideIn .25s ease" }}>
                  <SectionBlock title="Contact" hint="Phone, WhatsApp, Website and Booking all use Edit → Save / Cancel and sync to Google. For WhatsApp just enter the number — the chat link is built automatically.">
                    <FieldRow
                      label="Phone number"
                      fieldId="phone"
                      value={fields.phone}
                      onChange={setField("phone")}
                      manualOnly
                      onSaveField={gmbSyncMode ? handleFieldSave : undefined}
                      manualHint="Saved to Google as the primary phone. Enter a 10-digit number (or with +country code)."
                    />
                    <FieldRow
                      label="WhatsApp number"
                      fieldId="chatUrl"
                      value={fields.chatUrl}
                      onChange={setField("chatUrl")}
                      manualOnly
                      onSaveField={handleFieldSave}
                      manualHint="Just enter the WhatsApp number — the wa.me chat link is built automatically and saved to Google (url_whatsapp)."
                    />
                    <FieldRow
                      label="Website"
                      fieldId="website"
                      value={fields.website}
                      onChange={setField("website")}
                      manualOnly
                      websiteBuilderInEdit
                      websiteBuilderPending={websiteBuilderPending}
                      onWebsiteBuilder={() => void handleGenerateWebsiteFromBuilder()}
                      onSaveField={handleFieldSave}
                      manualHint="Edit the URL, or use AI Website Builder (generates a hosted page and can sync the URL to Google)."
                    />
                    <FieldRow
                      label="Booking / appointment link"
                      fieldId="bookingUrl"
                      value={fields.bookingUrl}
                      onChange={setField("bookingUrl")}
                      manualOnly
                      onSaveField={gmbSyncMode ? handleFieldSave : undefined}
                      manualHint="Full URL (https://…). Saved to Google as the appointment link (url_appointment) when your category supports it."
                      noBottomRule
                    />
                  </SectionBlock>
                </div>
              )}

              {tab === "location" && (
                <div style={{ animation: "slideIn .25s ease" }}>
                  <SectionBlock
                    title="Location and areas"
                    hint="Storefront address is read-only. Service areas load from Google; use radius (2–8 km), AI names, or custom lines, then Save changes."
                  >
                    <DisabledInfoRow
                      label="Business address (storefront)"
                      value={primaryLoc.fullAddress || [primaryLoc.address, primaryLoc.locality].filter(Boolean).join(", ")}
                      hint="Not editable here — change in Google Business Profile."
                    />
                    <ReadOnlyLinkRow label="View on Google Maps" href={primaryLoc.mapsUri} />
                    <ServiceAreaMultiSelect
                      primaryLoc={primaryLoc}
                      listingLat={activeEnriched?.lat}
                      listingLng={activeEnriched?.lng}
                      enableRadiusSearch={gmbSyncMode}
                      aiContext={optimizationContext}
                      onSaveServiceAreas={gmbSyncMode ? handleSaveServiceAreasToGoogle : undefined}
                      saveServiceAreasPending={syncToGmbPending}
                      selectedPlaces={fields.serviceAreaPlaces}
                      onChange={setField("serviceAreaPlaces")}
                      noBottomRule
                    />
                  </SectionBlock>
                </div>
              )}

              {tab === "hours" && (
                <div style={{ animation: "slideIn .25s ease" }}>
                  <SectionBlock
                    title="Opening hours"
                    hint="Open with main hours — each weekday has its own Edit. Save pushes regularHours to Google (Business Information API)."
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#202124", marginBottom: 4 }}>Open with main hours</div>
                    <OpeningHoursEditor
                      periods={fields.regularHoursPeriods}
                      onChange={(p) => setFields((f) => ({ ...f, regularHoursPeriods: p }))}
                      aiContext={optimizationContext}
                      onSyncToGmb={gmbSyncMode ? onSyncToGmb : undefined}
                      syncPending={syncToGmbPending}
                      disabled={!gmbSyncMode || !activeEditorLocationId}
                    />
                    <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid #eef2f6" }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>
                        Special hours
                      </div>
                      <FieldRow
                        label="Notes (holidays / exceptions)"
                        fieldId="specialHours"
                        value={fields.specialHours}
                        onChange={setField("specialHours")}
                        multiline
                        manualOnly
                        suggestAiInEdit
                        manualHint="Generate India holidays below to auto-fill notes and push closures to Google."
                        noBottomRule
                      />
                      <SpecialHoursHolidays
                        enabled={gmbSyncMode && Boolean(activeEditorLocationId)}
                        savePending={syncToGmbPending}
                        onInsertNotes={(text) => setField("specialHours")(text)}
                        onSaveToGoogle={gmbSyncMode ? handleSaveSpecialHoursToGoogle : undefined}
                      />
                    </div>
                  </SectionBlock>
                </div>
              )}

              {tab === "category" && (
                <div style={{ animation: "slideIn .25s ease" }}>
                  <SectionBlock
                    title={`Category attributes${fields.primaryCategory ? " — " + fields.primaryCategory : ""}`}
                    hint="These fields come from Google for this location's primary category — a restaurant gets a menu link and dine-in options, a service business gets its own set. Edit a value, then Save."
                  >
                    {/* Summary strip */}
                    {gmbSyncMode && !attrLoading && !attrError && categoryAttrs.length > 0 && (
                      <div style={{
                        display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
                        marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid #eef2f6",
                      }}>
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: "#475569", background: "#f1f5f9", padding: "4px 11px", borderRadius: 20 }}>
                          {attrStats.total} attribute{attrStats.total === 1 ? "" : "s"}
                        </span>
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: "#166534", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "4px 11px", borderRadius: 20 }}>
                          ✓ {attrStats.set} set
                        </span>
                        {attrStats.unsaved > 0 && (
                          <span style={{ fontSize: 11.5, fontWeight: 700, color: "#CA8A04", background: "#FEF9C3", border: "1px solid #FDE047", padding: "4px 11px", borderRadius: 20 }}>
                            {attrStats.unsaved} unsaved
                          </span>
                        )}
                        <span style={{ flex: 1 }} />
                        <button
                          type="button"
                          onClick={() => void reloadCategoryFields()}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 700,
                            color: "#64748b", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                          Refresh
                        </button>
                      </div>
                    )}

                    {!gmbSyncMode ? (
                      <div style={{ padding: "28px 16px", textAlign: "center", color: "#64748b", fontSize: 13 }}>
                        Connect a Google location to edit category attributes.
                      </div>
                    ) : attrLoading ? (
                      <div style={{ padding: "8px 0" }}>
                        {[0, 1, 2].map((i) => (
                          <div key={i} style={{
                            height: 78, borderRadius: 13, marginBottom: 10, border: "1px solid #eef2f6",
                            background: "linear-gradient(90deg,#f8fafc 25%,#eef2f6 37%,#f8fafc 63%)",
                            backgroundSize: "400% 100%", animation: "shimmer 1.4s ease infinite",
                          }} />
                        ))}
                        <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 12, marginTop: 4 }}>
                          Loading category fields from Google…
                        </div>
                      </div>
                    ) : attrError ? (
                      <div style={{
                        padding: "14px 16px", borderRadius: 12, background: "#fef2f2", border: "1px solid #fecaca",
                        color: "#b91c1c", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
                      }}>
                        <span>{attrError}</span>
                        <button type="button" onClick={() => void reloadCategoryFields()} style={{
                          padding: "6px 14px", borderRadius: 9, border: "1.5px solid #fecaca", background: "#fff",
                          color: "#b91c1c", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                        }}>
                          Retry
                        </button>
                      </div>
                    ) : categoryAttrs.length === 0 ? (
                      <div style={{ padding: "32px 16px", textAlign: "center" }}>
                        <div style={{
                          width: 46, height: 46, borderRadius: 14, margin: "0 auto 12px",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: "#f1f5f9", color: "#94a3b8",
                        }}>
                          <TabIconCategory />
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>No category attributes</div>
                        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4, maxWidth: 360, marginInline: "auto", lineHeight: 1.5 }}>
                          Google doesn&apos;t offer category-specific fields for this business category. Use the other tabs to optimize this listing.
                        </div>
                      </div>
                    ) : (
                      groupedAttrs.map(([group, items], gi) => (
                        <div key={group} style={{ marginBottom: gi === groupedAttrs.length - 1 ? 0 : 22 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>
                              {group}
                            </span>
                            <span style={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8", background: "#f1f5f9", padding: "1px 8px", borderRadius: 20 }}>
                              {items.length}
                            </span>
                            <span style={{ flex: 1, height: 1, background: "#eef2f6" }} />
                          </div>
                          {items.map((a) => (
                            <AttributeRow
                              key={a.name}
                              attr={a}
                              value={attrValues[a.name]}
                              original={a.currentValue}
                              onChange={(v) => setAttrValue(a.name, v)}
                              onSave={() => handleAttributeSave(a.name)}
                              saving={syncToGmbPending}
                            />
                          ))}
                        </div>
                      ))
                    )}
                  </SectionBlock>
                </div>
              )}

              {tab === "menu" && (
                <div style={{ animation: "slideIn .25s ease" }}>
                  <SectionBlock
                    title="Menu"
                    hint="Your Google food menu — sections (e.g. Sweets, Namkeen) with items, prices and descriptions. AI can draft the whole menu; review and edit before saving to Google."
                  >
                    {menuLoading ? (
                      <div style={{ padding: "8px 0" }}>
                        {[0, 1].map((i) => (
                          <div key={i} style={{ height: 70, borderRadius: 13, marginBottom: 10, border: "1px solid #eef2f6", background: "linear-gradient(90deg,#f8fafc 25%,#eef2f6 37%,#f8fafc 63%)", backgroundSize: "400% 100%", animation: "shimmer 1.4s ease infinite" }} />
                        ))}
                        <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 12 }}>Loading menu from Google…</div>
                      </div>
                    ) : menuError ? (
                      <div style={{ padding: "14px 16px", borderRadius: 12, background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                        <span>{menuError}</span>
                        <button type="button" onClick={() => void reloadFoodMenu()} style={{ padding: "6px 14px", borderRadius: 9, border: "1.5px solid #fecaca", background: "#fff", color: "#b91c1c", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Retry</button>
                      </div>
                    ) : (
                      <FoodMenuEditor
                        menu={foodMenu}
                        onChange={setFoodMenuDirty}
                        aiContext={optimizationContext}
                        businessName={businessName}
                        categoryHint={categoryHint}
                        onSave={handleSaveFoodMenu}
                        savePending={menuSaving}
                      />
                    )}
                  </SectionBlock>
                </div>
              )}

              {tab === "more" && (
                <div style={{ animation: "slideIn .25s ease" }}>
                  <ReadOnlyAddressRow label="Open status (Google)" value={fields.googleOpenStatus || primaryLoc.openStatus || "—"} />
                  <ReadOnlyAddressRow label="Place ID" value={primaryLoc.placeId || "—"} />
                  <ReadOnlyLinkRow label="Review link" href={primaryLoc.newReviewUri} />
                  <FieldRow label="From the business / established" fieldId="yearEstablished" value={fields.yearEstablished} onChange={setField("yearEstablished")} {...sharedFieldProps} />
                  <FieldRow label="Accessibility and amenities" fieldId="accessibility" value={fields.accessibility} onChange={setField("accessibility")} multiline {...sharedFieldProps} />
                  <FieldRow label="Additional details" fieldId="additionalInfo" value={fields.additionalInfo} onChange={setField("additionalInfo")} multiline {...sharedFieldProps} noBottomRule />
                </div>
              )}
            </div>

          </div>
        </div>
        )}
        {editorPhase === "edit" && (
          <div style={{ padding: gridPad, paddingTop: 12 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
                background: "#fef7e0",
                border: "1px solid #fdd663",
                borderRadius: 12,
                padding: "12px 16px",
                maxWidth: embedded ? "100%" : 1180,
                margin: embedded ? 0 : "0 auto",
              }}
            >
              <span style={{ color: "#f9ab00", fontSize: 20, lineHeight: 1, flexShrink: 0 }} aria-hidden>!</span>
              <p style={{ margin: 0, fontSize: 13, color: "#3c4043", lineHeight: 1.5, flex: 1 }}>
                {savePushesDescriptionAndServiceArea
                  ? "Business name, categories, and storefront address are locked here. Save changes syncs all editable fields to Google and reloads live data."
                  : gmbSyncMode
                    ? "Business name, categories, and storefront address are locked here. Description and contact fields are manual with Edit; Save changes pushes editable fields to Google and refetches."
                    : "Review and edit your business information to improve your presence. Scroll through tabs, then save your automation description when ready."}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}