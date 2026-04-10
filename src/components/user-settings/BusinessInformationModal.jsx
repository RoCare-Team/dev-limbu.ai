"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { normalizeGmbLocationRecord } from "@/lib/gmbLocationDataset";
import { GMB_PROFILE_DESCRIPTION_MAX, clampGmbDescription } from "@/lib/gmbConstants";
import { getNearbyServiceAreaSuggestions, parseServiceAreaPlacesFromText } from "@/lib/gmbServiceAreaSuggestions";

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

const TabIconAll = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>
);
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

const TABS = [
  { id: "all", label: "All fields", Icon: TabIconAll },
  { id: "about", label: "About", Icon: TabIconBuilding },
  { id: "contact", label: "Contact", Icon: TabIconPhone },
  { id: "location", label: "Location", Icon: TabIconPin },
  { id: "hours", label: "Hours", Icon: TabIconClock },
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

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} style={{
      position: "relative", display: "inline-flex", height: 24, width: 46,
      alignItems: "center", borderRadius: 12, border: "none", outline: "none",
      background: checked ? "#6366f1" : "#cbd5e1",
      cursor: "pointer", transition: "background .25s", flexShrink: 0,
    }}>
      <span style={{
        position: "absolute", top: 3, left: checked ? 25 : 3,
        width: 18, height: 18, borderRadius: "50%", background: "#fff",
        boxShadow: "0 1px 4px rgba(0,0,0,.2)",
        transition: "left .2s cubic-bezier(.4,0,.2,1)",
      }} />
    </button>
  );
}

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
          background: "linear-gradient(135deg, #fafbff, #eef2ff)",
          borderBottom: "1px solid #e0e7ff",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: 13,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 14px rgba(99,102,241,.35)",
          }}>
            <SparkIcon size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#1e1b4b" }}>AI Generated Content</div>
            <div style={{ fontSize: 12, color: "#818cf8" }}>
              Review before inserting into <strong style={{ color: "#6366f1" }}>{field}</strong>
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
            border: "1.5px solid #e0e7ff", minHeight: 90,
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
                    background: "#6366f1", marginLeft: 1, verticalAlign: "middle",
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
            background: done ? "linear-gradient(135deg, #6366f1, #818cf8)" : "#e0e7ff",
            color: done ? "#fff" : "#a5b4fc",
            fontSize: 13, fontWeight: 800,
            cursor: done ? "pointer" : "not-allowed",
            fontFamily: "inherit",
            boxShadow: done ? "0 4px 14px rgba(99,102,241,.35)" : "none",
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
      boxShadow: "0 8px 32px rgba(0,0,0,.13)", border: "1px solid #e0e7ff",
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
          padding: "11px 12px", borderRadius: 10, border: "1.5px solid #e0e7ff",
          background: "linear-gradient(135deg, #fafbff, #eef2ff)",
          cursor: "pointer", textAlign: "left", fontFamily: "inherit",
          marginBottom: 7, transition: "all .15s",
        }}
          onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg, #eef2ff, #ede9fe)"; e.currentTarget.style.borderColor = "#c7d2fe"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg, #fafbff, #eef2ff)"; e.currentTarget.style.borderColor = "#e0e7ff"; }}
        >
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            boxShadow: "0 3px 8px rgba(99,102,241,.3)",
          }}>
            <SparkIcon />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#4338ca" }}>AI Generated</div>
            <div style={{ fontSize: 11, color: "#818cf8" }}>OpenAI (server) + live GMB facts</div>
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
          currentValue: value,
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
              color: "#4f46e5",
              background: "#fff",
              border: "1.5px solid #c7d2fe",
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
                color: "#334155", border: "1.5px solid #6366f1", borderRadius: 10,
                padding: "12px 14px", resize: "vertical", fontFamily: "inherit",
                outline: "none", background: "#fafbff",
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
                border: "1.5px solid #6366f1", borderRadius: 10, padding: "11px 14px",
                fontFamily: "inherit", outline: "none", background: "#fafbff",
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
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button
              type="button"
              onClick={() => void saveEdit()}
              style={{
                border: "none",
                borderRadius: 8,
                padding: "8px 14px",
                background: "#1a73e8",
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
              background: "linear-gradient(135deg, #eef2ff, #ede9fe)",
              border: "1px solid #c7d2fe", color: "#6366f1",
              textTransform: "uppercase", letterSpacing: ".05em",
            }}>✦ AI</span>
          )}
        </div>

        <div ref={wrapRef} style={{ position: "relative" }}>
          <button type="button" onClick={() => { setShowChooser(v => !v); setManualMode(false); }} style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 11, fontWeight: 800,
            color: showChooser ? "#fff" : "#4f46e5",
            background: showChooser ? "linear-gradient(135deg, #6366f1, #7c3aed)" : "#fff",
            border: `1.5px solid ${showChooser ? "transparent" : "#c7d2fe"}`,
            borderRadius: 9, padding: "6px 12px",
            cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
            boxShadow: showChooser ? "0 4px 12px rgba(99,102,241,.35)" : "0 1px 2px rgba(15,23,42,.06)",
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
              color: "#334155", border: "1.5px solid #6366f1", borderRadius: 10,
              padding: "12px 14px", resize: "vertical", fontFamily: "inherit",
              outline: "none", background: "#fafbff",
            }}
          />
      ) : (
        <div style={{
          fontSize: 14, color: value ? "#334155" : "#94a3b8",
          padding: "11px 14px",
          background: aiSource ? "#fafbff" : "#f8fafc",
          borderRadius: 10,
          border: aiSource ? "1.5px solid #c7d2fe" : "1px solid #e8edf5",
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
              background: "#1a73e8",
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

/** GMB optimization: fields we do not PATCH from this app (pending-review risk). */
function LockedGmbFieldRow({ label, value, reason }) {
  return (
    <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid #eef2f6" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: ".07em" }}>
          {label}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em",
          color: "#b45309", background: "#fffbeb", border: "1px solid #fde68a",
          padding: "4px 10px", borderRadius: 20,
        }}>
          View only
        </span>
      </div>
      <div style={{
        fontSize: 12, color: "#92400e", background: "#fffbeb", border: "1px solid #fde68a",
        borderRadius: 10, padding: "10px 12px", marginBottom: 10, lineHeight: 1.5,
      }}>
        {reason}
      </div>
      <div style={{
        fontSize: 14, color: value ? "#334155" : "#94a3b8",
        padding: "11px 14px",
        background: "#f1f5f9",
        borderRadius: 10,
        border: "1px solid #e2e8f0",
        lineHeight: 1.65,
      }}>
        {value || "—"}
      </div>
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
          color: "#1a73e8",
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
          background: "linear-gradient(180deg, #6366f1, #7c3aed)", flexShrink: 0,
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

  const [radiusKm, setRadiusKm] = useState(4);
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
          },
          currentValue: selectedPlaces.join(", "),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "AI area suggestions failed");
      const raw = String(data.value ?? "").trim();
      const parts = raw.split(/[,;|\n]/).map((s) => s.trim()).filter(Boolean);
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: ".07em" }}>
          Service area
        </span>
      </div>
      <p style={{ margin: "0 0 14px", fontSize: 12, color: "#64748b", lineHeight: 1.55 }}>
        Uses your <strong>storefront address on Google</strong> ({cityLabel}). Pick areas, then <strong style={{ color: "#6366f1" }}>Save service areas</strong> or{" "}
        <strong style={{ color: "#6366f1" }}>Save changes</strong> to PATCH{" "}
        <code style={{ fontSize: 11, background: "#f1f5f9", padding: "1px 5px", borderRadius: 4 }}>serviceArea</code> on Google.
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
                {[2, 3, 4, 5, 6, 8, 10, 12].map((k) => (
                  <option key={k} value={k}>{k} km</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => void fetchNearby()}
              disabled={fetchingNearby || !findButtonEnabled}
              style={{
                padding: "9px 16px",
                borderRadius: 8,
                border: "none",
                background: fetchingNearby || !findButtonEnabled ? "#e2e8f0" : "#1a73e8",
                color: fetchingNearby || !findButtonEnabled ? "#94a3b8" : "#fff",
                fontSize: 13,
                fontWeight: 700,
                cursor: fetchingNearby || !findButtonEnabled ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {fetchingNearby ? "Loading…" : "Find nearby areas"}
            </button>
            <button
              type="button"
              onClick={() => void suggestAreasWithAi()}
              disabled={aiAreaPending || !enableRadiusSearch}
              style={{
                padding: "9px 16px",
                borderRadius: 8,
                border: "1px solid #c7d2fe",
                background: aiAreaPending ? "#eef2ff" : "#f5f3ff",
                color: aiAreaPending ? "#a5b4fc" : "#5b21b6",
                fontSize: 13,
                fontWeight: 700,
                cursor: aiAreaPending || !enableRadiusSearch ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {aiAreaPending ? "AI…" : "✨ AI suggest area names"}
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
                  background: saveServiceAreasPending ? "#e0e7ff" : "linear-gradient(135deg, #6366f1, #7c3aed)",
                  color: saveServiceAreasPending ? "#a5b4fc" : "#fff",
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
          <div style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>
            Selected ({selectedPlaces.length})
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {selectedPlaces.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => toggle(p)}
                title="Remove"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#1e40af",
                  background: "#eef2ff",
                  border: "1px solid #c7d2fe",
                  borderRadius: 20,
                  padding: "7px 12px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "left",
                  maxWidth: "100%",
                  lineHeight: 1.4,
                }}
              >
                {p}
                <span style={{ marginLeft: 8, opacity: 0.7 }}>×</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 14, padding: "10px 12px", background: "#f8fafc", borderRadius: 10, border: "1px dashed #e2e8f0" }}>
          No areas selected yet. Use <strong>Find nearby areas</strong> or <strong>AI suggest</strong>, pick from the list, or add custom lines.
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
                  background: sel ? "#eef2ff" : "#fff",
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
                    color: sel ? "#4338ca" : "#64748b",
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
            background: "linear-gradient(135deg, #6366f1, #7c3aed)",
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
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 42%, #5b21b6 100%)",
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
  platformGmb: platformGmbProp = true,
  setPlatformGmb: setPlatformGmbProp,
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
  const [tab, setTab] = useState("all");
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

  const [internalPlatformGmb, setInternalPlatformGmb] = useState(true);
  const platformGmb = typeof setPlatformGmbProp === "function" ? platformGmbProp : internalPlatformGmb;
  const setPlatformGmb = typeof setPlatformGmbProp === "function" ? setPlatformGmbProp : setInternalPlatformGmb;

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
  });
  const [aiDescriptionPending, setAiDescriptionPending] = useState(false);
  const [websiteBuilderPending, setWebsiteBuilderPending] = useState(false);

  const setField = useCallback((key) => (val) => setFields((p) => ({ ...p, [key]: val })), []);

  const optimizationContext = useMemo(() => {
    const base = activeEnriched?.aiContext || {};
    const kw = Array.isArray(automationKeywordsProp) ? automationKeywordsProp.filter(Boolean) : [];
    const draft =
      Array.isArray(fields.serviceAreaPlaces) && fields.serviceAreaPlaces.length
        ? { serviceAreaPlacesDraft: fields.serviceAreaPlaces }
        : {};
    if (!kw.length) return { ...base, ...draft };
    return { ...base, automationKeywords: kw, ...draft };
  }, [activeEnriched, automationKeywordsProp, fields.serviceAreaPlaces]);

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
    setFields((f) => ({
      ...f,
      businessName: loc.title || f.businessName,
      phone: loc.phone || f.phone,
      website: loc.websiteUrl || f.website,
      primaryCategory: loc.primaryCategory || f.primaryCategory,
      googleOpenStatus: loc.openStatus || f.googleOpenStatus,
      ...(nextDescription != null ? { description: nextDescription } : {}),
      ...(wa !== null ? { chatUrl: wa } : {}),
      serviceAreaPlaces: saList,
      hoursSummary: loc.hoursSummaryText || f.hoursSummary,
    }));
  }, [activeEditorLocationId, gmbLocations, profileDescriptionProp]);

  const businessName = fields.businessName || selectedBusiness.title || "";

  const handleSave = useCallback(async () => {
    const desc = clampGmbDescription((fields.description || "").trim());
    const places = Array.isArray(fields.serviceAreaPlaces) ? fields.serviceAreaPlaces : [];
    if (gmbSyncMode && activeEditorLocationId && typeof onSyncToGmb === "function") {
      await onSyncToGmb({
        description: desc,
        primaryPhone: (fields.phone || "").trim(),
        websiteUri: (fields.website || "").trim(),
        chatUrl: (fields.chatUrl || "").trim(),
        serviceAreaPlaces: places,
      });
      return;
    }
    if (savePushesDescriptionAndServiceArea && typeof onSaveOptimization === "function") {
      await onSaveOptimization({
        locationId: activeEditorLocationId,
        description: desc,
        serviceAreaPlaces: places,
      });
      return;
    }
    if (onConfirmProfileDescription) await Promise.resolve(onConfirmProfileDescription(desc));
  }, [
    savePushesDescriptionAndServiceArea,
    gmbSyncMode,
    onSyncToGmb,
    onSaveOptimization,
    activeEditorLocationId,
    onConfirmProfileDescription,
    fields.description,
    fields.serviceAreaPlaces,
    fields.phone,
    fields.website,
    fields.chatUrl,
  ]);

  const canSyncGmb =
    Boolean(activeEditorLocationId) &&
    Boolean(
      (fields.description || "").trim() ||
        (fields.phone || "").trim() ||
        (fields.website || "").trim() ||
        (fields.chatUrl || "").trim() ||
        (Array.isArray(fields.serviceAreaPlaces) && fields.serviceAreaPlaces.length > 0)
    );

  const handleSaveServiceAreasToGoogle = useCallback(async () => {
    if (!gmbSyncMode || !activeEditorLocationId || typeof onSyncToGmb !== "function") return;
    await onSyncToGmb({
      serviceAreaPlaces: Array.isArray(fields.serviceAreaPlaces) ? fields.serviceAreaPlaces : [],
    });
  }, [gmbSyncMode, activeEditorLocationId, onSyncToGmb, fields.serviceAreaPlaces]);

  const handleAiGenerateDescription = useCallback(async () => {
    setAiDescriptionPending(true);
    try {
      const res = await fetch("/api/user-settings/business-optimization-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "field",
          fieldId: "description",
          fieldLabel: "Business description",
          context: optimizationContext,
          currentValue: fields.description,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Could not generate description");
        return;
      }
      if (typeof data.value === "string" && data.value.trim()) {
        setFields((f) => ({ ...f, description: clampGmbDescription(data.value) }));
        toast.success("AI description added — review and Save changes.");
      }
    } catch (e) {
      toast.error(e.message || "AI request failed");
    } finally {
      setAiDescriptionPending(false);
    }
  }, [optimizationContext, fields.description]);

  const handleGenerateWebsiteFromBuilder = useCallback(async () => {
    const title = (fields.businessName || primaryLoc.title || selectedBusiness.title || "").trim();
    const locality = (primaryLoc.locality || "").trim();
    const primaryCategory = (fields.primaryCategory || categoryHint[0] || activeEnriched?.primaryCategory || "").trim();
    if (!title || !primaryCategory) {
      toast.error("Business name and primary category are required to generate website.");
      return;
    }
    const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
    if (!userId) {
      toast.error("User ID not found. Log in again to save the generated site to your account.");
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
          userId,
          locationId: activeEditorLocationId || undefined,
          business: {
            title,
            locality,
            primaryCategory,
            additionalCategories: categoryHint.slice(1),
            address: primaryLoc.address || "",
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
        await onSyncToGmb({ websiteUri });
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
  ]);

  const descriptionAiToolbar =
    savePushesDescriptionAndServiceArea && activeEditorLocationId ? (
      <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => void handleAiGenerateDescription()}
          disabled={aiDescriptionPending}
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            border: "none",
            background: aiDescriptionPending ? "#e0e7ff" : "linear-gradient(135deg, #6366f1, #7c3aed)",
            color: aiDescriptionPending ? "#a5b4fc" : "#fff",
            fontSize: 12,
            fontWeight: 800,
            cursor: aiDescriptionPending ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            boxShadow: aiDescriptionPending ? "none" : "0 2px 12px rgba(99,102,241,.3)",
          }}
        >
          {aiDescriptionPending ? "Generating…" : "✨ Generate description with AI"}
        </button>
        <span style={{ fontSize: 11, color: "#64748b", lineHeight: 1.45, maxWidth: 420 }}>
          Uses listing + categories (max {GMB_PROFILE_DESCRIPTION_MAX} chars). Edit if needed, then use Save on the field or Save changes.
        </span>
      </div>
    ) : null;

  const handleFieldSave = useCallback(
    async ({ fieldId, value: nextValue }) => {
      if (!gmbSyncMode || !activeEditorLocationId || typeof onSyncToGmb !== "function") return;
      const text = String(nextValue ?? "").trim();
      if (!text && fieldId !== "description") return;
      const payload = {};
      if (fieldId === "description") payload.description = clampGmbDescription(text);
      if (fieldId === "phone") payload.primaryPhone = text;
      if (fieldId === "website") payload.websiteUri = text;
      if (fieldId === "chatUrl") payload.chatUrl = text;
      if (Object.keys(payload).length === 0) return;
      await onSyncToGmb(payload);
    },
    [gmbSyncMode, activeEditorLocationId, onSyncToGmb]
  );

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
        <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10 }}>
          Business categories
        </div>
        {gmbSyncMode ? (
          <div style={{
            fontSize: 12, color: "#92400e", background: "#fffbeb", border: "1px solid #fde68a",
            borderRadius: 10, padding: "10px 12px", marginBottom: 12, lineHeight: 1.5,
          }}>
            Categories cannot be updated from this screen. Editing categories in Google can send your profile into{" "}
            <strong>pending verification</strong>. Change them in Google Business Profile if needed.
          </div>
        ) : null}
        {categoryHint.length ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {categoryHint.map((c, i) => (
              <span
                key={`${c}-${i}`}
                style={{
                  fontSize: 12,
                  padding: "6px 14px",
                  borderRadius: 20,
                  background: i === 0 ? "linear-gradient(135deg, #e8f0fe, #d2e3fc)" : "#f1f5f9",
                  color: i === 0 ? "#1967d2" : "#475569",
                  fontWeight: i === 0 ? 800 : 500,
                  border: i === 0 ? "1px solid #aecbfa" : "1px solid #e2e8f0",
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
    [categoryHint, gmbSyncMode]
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

  const locationPicker = (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 16px",
          border: platformGmb ? "1.5px solid #c7d2fe" : "1.5px solid #e2e8f0",
          borderRadius: 12,
          background: platformGmb ? "#fafbff" : "#fafafa",
          marginBottom: 18,
          transition: "all .25s",
        }}
      >
        <TabIconPin />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#4338ca" }}>Post to Google Business</div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>Automation publishes to selected locations.</div>
        </div>
        <Toggle checked={platformGmb} onChange={setPlatformGmb} />
      </div>
      {manageLocations ? (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginBottom: 10 }}>
            {["All", "None"].map((lbl) => (
              <button
                key={lbl}
                type="button"
                onClick={() =>
                  lbl === "All"
                    ? setSelectedLocations(
                        gmbLocations.map((l) => ({
                          locationId: l.locationId,
                          name: l.title,
                          address: l.address,
                          locality: l.locality,
                          websiteUrl: l.websiteUrl,
                        }))
                      )
                    : setSelectedLocations([])
                }
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: lbl === "All" ? "#6366f1" : "#64748b",
                  background: lbl === "All" ? "#eef2ff" : "#fff",
                  border: `1px solid ${lbl === "All" ? "#c7d2fe" : "#e2e8f0"}`,
                  borderRadius: 7,
                  padding: "4px 12px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {lbl}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {gmbLocations.map((loc) => {
              const isChecked = selectedLocations.some((l) => l.locationId === loc.locationId);
              const toggle = () => {
                if (isChecked) setSelectedLocations((p) => p.filter((l) => l.locationId !== loc.locationId));
                else
                  setSelectedLocations((p) => [
                    ...p,
                    {
                      locationId: loc.locationId,
                      name: loc.title,
                      address: loc.address,
                      locality: loc.locality,
                      websiteUrl: loc.websiteUrl,
                    },
                  ]);
              };
              return (
                <div
                  key={loc.locationId}
                  role="button"
                  tabIndex={0}
                  onClick={toggle}
                  onKeyDown={(e) => e.key === "Enter" && toggle()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "13px 16px",
                    border: isChecked ? "1.5px solid #6366f1" : "1.5px solid #e2e8f0",
                    borderRadius: 12,
                    cursor: "pointer",
                    background: isChecked ? "#fafbff" : "#fafafa",
                    transition: "all .2s",
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      flexShrink: 0,
                      border: isChecked ? "2px solid #6366f1" : "2px solid #cbd5e1",
                      background: isChecked ? "#6366f1" : "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all .2s",
                    }}
                  >
                    {isChecked && <CheckIcon size={12} color="#fff" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{loc.title}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{[loc.address, loc.locality].filter(Boolean).join(", ")}</div>
                  </div>
                  {loc.isVerified && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#059669",
                        background: "#dcfce7",
                        border: "1px solid #bbf7d0",
                        borderRadius: 20,
                        padding: "2px 8px",
                      }}
                    >
                      Verified
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {(selectedLocations.length ? selectedLocations : gmbLocations).slice(0, 6).map((loc) => (
            <div
              key={loc.locationId || loc.name}
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid #e8edf5",
                background: "#fff",
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{loc.name || loc.title}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{[loc.address, loc.locality].filter(Boolean).join(", ")}</div>
            </div>
          ))}
          {!selectedLocations.length && !gmbLocations.length ? (
            <div style={{ fontSize: 13, color: "#94a3b8" }}>No locations loaded. Connect Google Business from the dashboard.</div>
          ) : null}
        </div>
      )}
    </>
  );

  const shellPad = embedded ? "0" : "28px 40px 0";
  const gridPad = embedded ? "0 0 24px" : "0 40px 40px";
  const gridColumns = "minmax(0, 1fr)";
  const gridMinHeight = embedded ? "auto" : "calc(100vh - 148px)";


  console.log("fieldsfields");
  

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
        .biz-opt-scope ::-webkit-scrollbar-thumb{background:rgba(99,102,241,.25);border-radius:6px}
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
                Google Business Profile style editor — use <strong style={{ color: "#6366f1" }}>Edit</strong> on supported fields for drafts, then save or sync.
              </p>
            </div>
          </div>
        )}

        {embedded && editorPhase !== "pick" && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", letterSpacing: "-.02em" }}>Profile fields</div>
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 6, lineHeight: 1.5 }}>
              Choose a location if you have several. Edits use the Business Information API; after <strong style={{ color: "#6366f1" }}>Save changes</strong>,
              the app refetches live data from Google.
            </p>
          </div>
        )}

        {editorPhase === "pick" && gmbLocations.length > 0 ? (
          <div style={{ padding: gridPad }}>
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                border: "1px solid #dadce0",
                boxShadow: "0 1px 3px rgba(60,64,67,.12)",
                maxWidth: 640,
                margin: "0 auto",
                overflow: "hidden",
              }}
            >
              <div style={{ padding: "20px 24px", borderBottom: "1px solid #e8eaed" }}>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 500, color: "#202124", fontFamily: "'Google Sans', 'DM Sans', system-ui, sans-serif" }}>
                  Business information
                </h2>
                <p style={{ margin: "10px 0 0", fontSize: 14, color: "#5f6368", lineHeight: 1.5 }}>
                  Select a location to load its Google Business Profile details. You can switch later.
                </p>
              </div>
              <div style={{ padding: 16, maxHeight: "min(420px, 55vh)", overflowY: "auto" }}>
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
                        padding: "14px 16px",
                        marginBottom: 8,
                        borderRadius: 12,
                        border: selected ? "2px solid #1a73e8" : "1px solid #dadce0",
                        background: selected ? "#e8f0fe" : "#fff",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        transition: "border-color .15s, background .15s",
                      }}
                    >
                      <div style={{ fontSize: 15, fontWeight: 600, color: "#202124" }}>{loc.title}</div>
                      <div style={{ fontSize: 13, color: "#5f6368", marginTop: 6, lineHeight: 1.45 }}>{line || "—"}</div>
                      {loc.isVerified && (
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#137333", marginTop: 6 }}>Verified on Google</div>
                      )}
                    </button>
                  );
                })}
              </div>
              <div
                style={{
                  padding: "14px 20px",
                  borderTop: "1px solid #e8eaed",
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  gap: 12,
                  background: "#fafafa",
                }}
              >
                <button
                  type="button"
                  onClick={handleContinuePick}
                  disabled={!pickSelectionId}
                  style={{
                    background: pickSelectionId ? "#1a73e8" : "#dadce0",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "10px 28px",
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: pickSelectionId ? "pointer" : "not-allowed",
                    fontFamily: "inherit",
                    boxShadow: pickSelectionId ? "0 1px 2px rgba(60,64,67,.3)" : "none",
                  }}
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
                borderBottom: "1px solid #f0f4f8",
                background: "linear-gradient(135deg, #fafbff, #f5f7ff)",
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
                  background: "linear-gradient(135deg, #6366f1, #7c3aed)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  boxShadow: "0 6px 20px rgba(99,102,241,.35)",
                }}
              >
                <TabIconBuilding />
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#0f172a" }}>Business information</div>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 500, marginTop: 2 }}>
                  <strong style={{ color: "#4f46e5" }}>Edit</strong> per field — AI draft or type yourself
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
                  background: "#fafbff",
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
                      color: "#1a73e8",
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
              {TABS.map((tb) => {
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
                      color: active ? "#4f46e5" : "#64748b",
                      background: active ? "rgba(99,102,241,.06)" : "none",
                      border: "none",
                      borderBottom: active ? "2.5px solid #6366f1" : "2.5px solid transparent",
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
                    <span style={{ color: active ? "#6366f1" : "#94a3b8", display: "flex" }}>
                      <Icon />
                    </span>
                    {tb.label}
                  </button>
                );
              })}
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "22px 26px" }}>
              {tab === "all" && (
                <div style={{ animation: "slideIn .25s ease" }}>
                  <SectionBlock title="About your business" hint={`Business description is limited to ${GMB_PROFILE_DESCRIPTION_MAX} characters on Google (enforced here).`}>
                    {gmbSyncMode ? (
                      <LockedGmbFieldRow
                        label="Business name"
                        value={fields.businessName}
                        reason="Business title is not edited here: Google can put your profile into pending review. Change the name in Google Business Profile."
                      />
                    ) : (
                      <FieldRow label="Business name" fieldId="businessName" value={fields.businessName} onChange={setField("businessName")} {...sharedFieldProps} />
                    )}
                    {categoryBlock}
                    {/* <FieldRow label="Services" fieldId="services" value={fields.services} onChange={setField("services")} {...sharedFieldProps} /> */}
                    {descriptionAiToolbar}
                    <FieldRow
                      label="Description"
                      fieldId="description"
                      value={fields.description}
                      onChange={setField("description")}
                      multiline
                      maxLength={GMB_PROFILE_DESCRIPTION_MAX}
                      manualOnly
                      onSaveField={handleFieldSave}
                      manualHint={
                        savePushesDescriptionAndServiceArea
                          ? `Google profile / description (max ${GMB_PROFILE_DESCRIPTION_MAX} chars). Use Save on the field or Save changes to PATCH Google and refetch.`
                          : "From the business: Google field profile.description (Business Information API v1, updateMask profile.description). Hard limit 750 characters — type here, then Save / Sync."
                      }
                      noBottomRule
                    />
                  </SectionBlock>

                  <SectionBlock title="Contact" hint="Shown on Google; keep consistent with your live profile.">
                    <FieldRow
                      label="Phone number"
                      fieldId="phone"
                      value={fields.phone}
                      onChange={setField("phone")}
                      manualOnly
                      onSaveField={handleFieldSave}
                      manualHint="Edit and use Save on the field, or Save changes, to sync phone to Google."
                    />
                    <FieldRow
                      label="Chat / WhatsApp"
                      fieldId="chatUrl"
                      value={fields.chatUrl}
                      onChange={setField("chatUrl")}
                      manualOnly
                      onSaveField={handleFieldSave}
                      manualHint="Google attribute attributes/url_whatsapp — PATCH .../locations/{locationId}/attributes?attributeMask=attributes/url_whatsapp. Example: https://wa.me/919876543210"
                    />
                    <div style={{ marginBottom: 12 }}>
                      <button
                        type="button"
                        onClick={() => void handleGenerateWebsiteFromBuilder()}
                        disabled={websiteBuilderPending}
                        style={{
                          padding: "8px 14px",
                          borderRadius: 8,
                          border: "1px solid #bae6fd",
                          background: websiteBuilderPending ? "#e0f2fe" : "#f0f9ff",
                          color: websiteBuilderPending ? "#7dd3fc" : "#0369a1",
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: websiteBuilderPending ? "not-allowed" : "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        {websiteBuilderPending ? "Generating website…" : "Website Builder: Generate & fill URL"}
                      </button>
                    </div>
                    <FieldRow
                      label="Website"
                      fieldId="website"
                      value={fields.website}
                      onChange={setField("website")}
                      manualOnly
                      onSaveField={handleFieldSave}
                      manualHint="Use Website Builder (saves site to DB + can sync URL) or edit manually; Save on the field or Save changes updates Google."
                    />
                    <FieldRow
                      label="Booking / appointment link"
                      fieldId="bookingUrl"
                      value={fields.bookingUrl}
                      onChange={setField("bookingUrl")}
                      manualOnly
                      manualHint="Manual only. AI suggestions are disabled in Contact."
                      noBottomRule
                    />
                  </SectionBlock>

                  <SectionBlock title="Location and areas" hint="Storefront address is from Google. Use radius search from that address, AI area names, or custom lines for service areas.">
                    <ReadOnlyAddressRow
                      label="Business address (storefront)"
                      value={primaryLoc.fullAddress || [primaryLoc.address, primaryLoc.locality].filter(Boolean).join(", ")}
                      hint="To change the address in Google, use Google Business Profile."
                      pendingReviewWarning={
                        gmbSyncMode
                          ? "Address and storefront location are not updated from this app — Google may flag changes and move your profile to pending verification."
                          : undefined
                      }
                    />
                    <ReadOnlyLinkRow label="Google Maps" href={primaryLoc.mapsUri} hint="Opens your business on Google Maps." />
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

                  <SectionBlock title="Opening hours" hint="Summary and special hours for drafts; official hours are edited in Google.">
                    <FieldRow label="Hours (summary)" fieldId="hoursSummary" value={fields.hoursSummary} onChange={setField("hoursSummary")} multiline {...sharedFieldProps} />
                    <FieldRow label="Special hours" fieldId="specialHours" value={fields.specialHours} onChange={setField("specialHours")} multiline {...sharedFieldProps} />
                    <FieldRow label="From the business / established" fieldId="yearEstablished" value={fields.yearEstablished} onChange={setField("yearEstablished")} {...sharedFieldProps} noBottomRule />
                  </SectionBlock>

                  <SectionBlock title="More" hint="Google metadata and extras.">
                    <ReadOnlyAddressRow label="Open status (Google)" value={fields.googleOpenStatus || primaryLoc.openStatus || "—"} hint="Reflects your listing in Google." />
                    <ReadOnlyAddressRow label="Place ID" value={primaryLoc.placeId || "—"} />
                    <ReadOnlyLinkRow label="Write a review (link)" href={primaryLoc.newReviewUri} hint="Share with customers." />
                    <FieldRow label="Accessibility and amenities" fieldId="accessibility" value={fields.accessibility} onChange={setField("accessibility")} multiline {...sharedFieldProps} />
                    <FieldRow label="Additional details" fieldId="additionalInfo" value={fields.additionalInfo} onChange={setField("additionalInfo")} multiline {...sharedFieldProps} noBottomRule />
                  </SectionBlock>

                  <SectionBlock title="Locations and posting" hint="Choose where automation posts when enabled.">
                    {locationPicker}
                  </SectionBlock>
                </div>
              )}

              {tab === "about" && (
                <div style={{ animation: "slideIn .25s ease" }}>
                  {gmbSyncMode ? (
                    <LockedGmbFieldRow
                      label="Business name"
                      value={fields.businessName}
                      reason="Business title is not edited here: Google can put your profile into pending review. Change the name in Google Business Profile."
                    />
                  ) : (
                    <FieldRow label="Business name" fieldId="businessName" value={fields.businessName} onChange={setField("businessName")} {...sharedFieldProps} />
                  )}
                  {gmbSyncMode ? (
                    <LockedGmbFieldRow
                      label="Primary category"
                      value={fields.primaryCategory || categoryHint[0] || ""}
                      reason="Categories are not updated from this screen; changes in Google can send your profile to pending verification."
                    />
                  ) : (
                    <FieldRow label="Primary category" fieldId="primaryCategory" value={fields.primaryCategory} onChange={setField("primaryCategory")} {...sharedFieldProps} />
                  )}
                  <FieldRow label="Tagline" fieldId="tagline" value={fields.tagline} onChange={setField("tagline")} {...sharedFieldProps} />
                  {categoryBlock}
                  <FieldRow label="Services" fieldId="services" value={fields.services} onChange={setField("services")} {...sharedFieldProps} />
                  {descriptionAiToolbar}
                  <FieldRow
                    label="Description"
                    fieldId="description"
                    value={fields.description}
                    onChange={setField("description")}
                    multiline
                    maxLength={GMB_PROFILE_DESCRIPTION_MAX}
                    manualOnly
                    onSaveField={handleFieldSave}
                    manualHint={
                      savePushesDescriptionAndServiceArea
                        ? `Google profile / description (max ${GMB_PROFILE_DESCRIPTION_MAX} chars). Save on the field or Save changes PATCHes Google and refetches.`
                        : "Google profile.description (max 750 characters). Manual entry only — no AI."
                    }
                    noBottomRule
                  />
                </div>
              )}

              {tab === "contact" && (
                <div style={{ animation: "slideIn .25s ease" }}>
                  <FieldRow
                    label="Phone number"
                    fieldId="phone"
                    value={fields.phone}
                    onChange={setField("phone")}
                    manualOnly
                    onSaveField={handleFieldSave}
                    manualHint="Edit and use Save on the field, or Save changes, to sync phone to Google."
                  />
                  <FieldRow
                    label="Chat / WhatsApp"
                    fieldId="chatUrl"
                    value={fields.chatUrl}
                    onChange={setField("chatUrl")}
                    manualOnly
                    onSaveField={handleFieldSave}
                    manualHint="Google attributes/url_whatsapp — full https URL only. Manual entry only."
                  />
                  <div style={{ marginBottom: 12 }}>
                    <button
                      type="button"
                      onClick={() => void handleGenerateWebsiteFromBuilder()}
                      disabled={websiteBuilderPending}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 8,
                        border: "1px solid #bae6fd",
                        background: websiteBuilderPending ? "#e0f2fe" : "#f0f9ff",
                        color: websiteBuilderPending ? "#7dd3fc" : "#0369a1",
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: websiteBuilderPending ? "not-allowed" : "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {websiteBuilderPending ? "Generating website…" : "Website Builder: Generate & fill URL"}
                    </button>
                  </div>
                  <FieldRow
                    label="Website"
                    fieldId="website"
                    value={fields.website}
                    onChange={setField("website")}
                    manualOnly
                    onSaveField={handleFieldSave}
                    manualHint="Use Website Builder (saves site to DB + can sync URL) or edit manually; Save on the field or Save changes updates Google."
                  />
                  <FieldRow
                    label="Booking / appointment link"
                    fieldId="bookingUrl"
                    value={fields.bookingUrl}
                    onChange={setField("bookingUrl")}
                    manualOnly
                    manualHint="Manual only. AI suggestions are disabled in Contact."
                    noBottomRule
                  />
                  <div
                    style={{
                      fontSize: 12,
                      color: "#64748b",
                      lineHeight: 1.65,
                      marginTop: 4,
                      padding: "12px 14px",
                      background: "#f8fafc",
                      borderRadius: 10,
                      border: "1px solid #e8edf5",
                    }}
                  >
                    Live phone and website on Google are controlled in Google Business Profile. This editor stores your automation description and drafts.
                  </div>
                </div>
              )}

              {tab === "location" && (
                <div style={{ animation: "slideIn .25s ease" }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#202124", marginBottom: 16 }}>Location and areas</div>
                  <ReadOnlyAddressRow
                    label="Business address (storefront)"
                    value={primaryLoc.fullAddress || [primaryLoc.address, primaryLoc.locality].filter(Boolean).join(", ")}
                    hint="Update in Google Business Profile to change the address."
                    pendingReviewWarning={
                      gmbSyncMode
                        ? "Address is not updated from this app — risky edits can move your profile to pending verification."
                        : undefined
                    }
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
                  <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid #eef2f6" }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b", marginBottom: 12 }}>Automation</div>
                    {locationPicker}
                  </div>
                </div>
              )}

              {tab === "hours" && (
                <div style={{ animation: "slideIn .25s ease" }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#202124", marginBottom: 14 }}>Opening hours</div>
                  <p style={{ fontSize: 12, color: "#64748b", marginBottom: 16, lineHeight: 1.55 }}>
                    Set official hours in Google Business Profile. Use these fields for notes, AI drafts, and internal summaries.
                  </p>
                  <FieldRow label="Hours" fieldId="hoursSummary" value={fields.hoursSummary} onChange={setField("hoursSummary")} multiline {...sharedFieldProps} />
                  <FieldRow label="Special hours" fieldId="specialHours" value={fields.specialHours} onChange={setField("specialHours")} multiline {...sharedFieldProps} noBottomRule />
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

            <div
              style={{
                flexShrink: 0,
                borderTop: "1px solid #f0f4f8",
                padding: "14px 26px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "linear-gradient(180deg, #fff, #fafbff)",
              }}
            >
              <div style={{ flex: 1, fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>
                {gmbSyncMode && activeEditorLocationId ? (
                  <span>
                    <strong style={{ color: "#6366f1" }}>Save changes</strong> syncs description, phone, website, WhatsApp, and service areas to Google, then reloads live data.
                    You can also use <strong>Save</strong> on each field or <strong>Save service areas</strong> in the service-area panel.
                  </span>
                ) : (
                  <span>
                    <strong style={{ color: "#6366f1" }}>Save</strong> stores the description in automation settings.
                    {gmbSyncMode && activeEditorLocationId ? (
                      <span>
                        {" "}
                        <strong style={{ color: "#0f766e" }}>Sync to Google</strong> pushes description, phone, website, WhatsApp link (if set), service areas, and coordinates to the Business Profile API.
                      </span>
                    ) : null}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={gmbSyncMode ? Boolean(syncToGmbPending) || !canSyncGmb : Boolean(savePending)}
                  style={{
                    flexShrink: 0,
                    background: (gmbSyncMode ? syncToGmbPending : savePending) ? "#e0e7ff" : "linear-gradient(135deg, #6366f1, #7c3aed)",
                    color: (gmbSyncMode ? syncToGmbPending : savePending) ? "#a5b4fc" : "#fff",
                    border: "none",
                    borderRadius: 10,
                    padding: "11px 28px",
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: (gmbSyncMode ? syncToGmbPending : savePending) ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    boxShadow: (gmbSyncMode ? syncToGmbPending : savePending) ? "none" : "0 4px 18px rgba(99,102,241,.35)",
                  }}
                >
                  {(gmbSyncMode ? syncToGmbPending : savePending) ? "Saving…" : "Save changes"}
                </button>
              </div>
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