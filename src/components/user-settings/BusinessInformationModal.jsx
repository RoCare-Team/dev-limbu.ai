"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";

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
  const resourceName = typeof loc.name === "string" ? loc.name : "";
  let locationId = String(loc.locationId || loc.googleId || "");
  if (!locationId && resourceName.includes("/")) {
    locationId = resourceName.split("/").pop() || "";
  }
  const sa = loc.storefrontAddress;
  const addressLines = sa?.addressLines?.length
    ? sa.addressLines.map(String).join(", ")
    : String(loc.address || "");
  const locality = sa?.locality || loc.locality || "";
  const administrativeArea = sa?.administrativeArea || "";
  const postalCode = sa?.postalCode || "";
  const regionCode = sa?.regionCode || "";
  const address = addressLines;
  const fullAddress = [addressLines, locality, administrativeArea, postalCode, regionCode].filter(Boolean).join(", ");
  const phone = loc.phoneNumbers?.primaryPhone || loc.phone || "";
  const websiteUrl = loc.websiteUri || loc.websiteUrl || "";
  const primaryCategory = loc.categories?.primaryCategory?.displayName || "";
  const openStatus = loc.openInfo?.status || "";
  const mapsUri = loc.metadata?.mapsUri || "";
  const placeId = loc.metadata?.placeId || "";
  const newReviewUri = loc.metadata?.newReviewUri || loc.reviewUri || "";
  const isVerified = Boolean(loc.metadata?.hasVoiceOfMerchant ?? loc.isVerified);
  const accountId = loc.accountId || "";
  const title = loc.title || loc.name || "";
  if (!locationId) locationId = resourceName || title;
  if (!locationId) return null;
  return {
    locationId,
    resourceName,
    title,
    address,
    locality,
    administrativeArea,
    postalCode,
    regionCode,
    fullAddress: fullAddress || [address, locality].filter(Boolean).join(", "),
    websiteUrl,
    phone,
    primaryCategory,
    openStatus,
    mapsUri,
    placeId,
    newReviewUri,
    isVerified,
    accountId,
  };
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
            <div style={{ fontSize: 11, color: "#818cf8" }}>Write with Claude AI</div>
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
function FieldRow({ label, fieldId, value, onChange, multiline = false, businessName, categoryHint, userData, primaryLoc, noBottomRule = false }) {
  const [showChooser, setShowChooser] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [aiPending, setAiPending] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiSource, setAiSource] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowChooser(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const generateAI = async () => {
    setShowChooser(false);
    setLoading(true);
    try {
      const prompts = {
        businessName: `Return a clean professional business name for a company in: ${categoryHint.join(", ")}. Return ONLY the name.`,
        tagline: `Write a punchy 8-12 word tagline for "${businessName}", a ${categoryHint[0] || "technology"} company. Return ONLY the tagline.`,
        description: `Write a 150-200 word Google Business Profile description for "${businessName}", a ${categoryHint.join(", ")} company in ${primaryLoc?.locality || "India"}. SEO-optimized with a call to action. Return ONLY the description.`,
        services: `List 5 specific services for "${businessName}" (${categoryHint.join(", ")}). Return ONLY a JSON array like ["Service 1","Service 2","Service 3","Service 4","Service 5"].`,
        phone: `Return a sample Indian business phone number in format +91 XXXXX XXXXX. Return ONLY the number.`,
        website: `Return ${userData?.website || "https://example.com"} — just the URL.`,
        bookingUrl: `Suggest one short booking or appointment URL (https://...) for "${businessName}". Return ONLY the URL.`,
        serviceArea: `List 4–6 cities or areas this business serves near ${primaryLoc?.locality || "India"} for "${businessName}". Return as comma-separated text only.`,
        hoursSummary: `Write concise Google Business style opening hours text (e.g. Mon–Fri 9–6, Sat 10–4, Sun closed) for "${businessName}". Return ONLY that text.`,
        specialHours: `List special hours or holiday notes (plain text, one line per item) for "${businessName}". Return plain text only.`,
        yearEstablished: `Return a plausible year established (four digits) or short phrase like "Est. 2015" for "${businessName}". Return ONLY that.`,
        accessibility: `List 3–5 accessibility or amenity labels (e.g. Wheelchair accessible entrance, Free Wi‑Fi) for "${businessName}". Return comma-separated only.`,
        additionalInfo: `Write 2 short sentences of extra business highlights (parking, payment methods, specialties) for "${businessName}". Return plain text only.`,
        primaryCategory: `Return a short Google Business style primary category name for "${businessName}" (${categoryHint.join(", ") || "local services"}). Return ONLY the category name.`,
        chatUrl: `Return a single messaging URL (WhatsApp web, or https URL) for "${businessName}", or the word NONE if unknown. Return ONLY the URL or NONE.`,
      };
      const prompt = prompts[fieldId] || `Generate a value for the "${label}" field of a business called "${businessName}". Return ONLY the value.`;
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 700,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      let text = data.content?.find(b => b.type === "text")?.text?.trim() || "";
      if (fieldId === "services") {
        try {
          const arr = JSON.parse(text.replace(/```json|```/g, "").trim());
          setAiPending(arr);
        } catch { setAiPending(text); }
      } else {
        setAiPending(text);
      }
    } catch {
      setAiPending("Generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const confirmInsert = (content) => {
    onChange(Array.isArray(content) ? content.join(", ") : content);
    setAiSource(true);
    setAiPending(null);
  };

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
              onManualClick={() => { setManualMode(true); setShowChooser(false); setAiSource(false); }}
            />
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{
          display: "flex", alignItems: "center", gap: 9, padding: "12px 16px",
          background: "linear-gradient(135deg, #fafbff, #eef2ff)",
          borderRadius: 10, border: "1.5px solid #c7d2fe",
          fontSize: 13, color: "#6366f1", fontWeight: 600,
        }}>
          <span style={{ animation: "spin 1s linear infinite", display: "inline-block", fontSize: 16 }}>⟳</span>
          Claude is writing…
        </div>
      )}

      {/* Value display */}
      {!loading && (manualMode ? (
        multiline ? (
          <textarea autoFocus value={value} onChange={e => onChange(e.target.value)} onBlur={() => setManualMode(false)} rows={5} style={{
            width: "100%", boxSizing: "border-box", fontSize: 14, lineHeight: 1.7,
            color: "#334155", border: "1.5px solid #6366f1", borderRadius: 10,
            padding: "12px 14px", resize: "vertical", fontFamily: "inherit",
            outline: "none", background: "#fafbff",
          }} />
        ) : (
          <input autoFocus type="text" value={value} onChange={e => onChange(e.target.value)} onBlur={() => setManualMode(false)} style={{
            width: "100%", boxSizing: "border-box", fontSize: 14, color: "#334155",
            border: "1.5px solid #6366f1", borderRadius: 10, padding: "11px 14px",
            fontFamily: "inherit", outline: "none", background: "#fafbff",
          }} />
        )
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

      {aiPending !== null && (
        <ConfirmModal field={label} aiContent={aiPending} onConfirm={confirmInsert} onCancel={() => setAiPending(null)} />
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

function ReadOnlyAddressRow({ label, value, hint }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 8 }}>
        {label}
      </div>
      <div style={{
        fontSize: 14, color: value ? "#334155" : "#94a3b8",
        padding: "12px 14px",
        background: "#fff",
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

// ─── Shimmer ─────────────────────────────────────────────────────────────────
function Shimmer({ h = 11, w = "100%", delay = 0 }) {
  return (
    <div style={{
      height: h, width: w, borderRadius: 6,
      background: "linear-gradient(90deg, #f1f5f9 25%, #e0e7ff 50%, #f1f5f9 75%)",
      backgroundSize: "200% 100%",
      animation: `shimmer 1.4s ${delay}s infinite`,
    }} />
  );
}

// ─── AI Studio Panel ──────────────────────────────────────────────────────────
function AIStudioPanel({ businessName, categoryHint, userData, primaryLoc, selectedBusiness, onApplyField }) {
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(null);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("description");
  const [confirmed, setConfirmed] = useState({});

  const sections = [
    { id: "description", label: "Description", icon: "📝" },
    { id: "tagline", label: "Tagline", icon: "✨" },
    { id: "services", label: "Services", icon: "🔧" },
  ];

  const generate = async () => {
    setLoading(true);
    setError("");
    setGenerated(null);
    setConfirmed({});
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `You are a Google Business Profile expert. Generate content for this business.
Business: ${businessName}
Location: ${primaryLoc?.locality || selectedBusiness?.locality || "India"}
Categories: ${categoryHint.join(", ") || "Technology"}
Website: ${userData?.website || ""}
Return ONLY a JSON object (no markdown, no backticks):
{"description":"150-200 word SEO-optimized Google Business description with CTA","tagline":"8-12 word punchy tagline","services":["Service 1","Service 2","Service 3","Service 4","Service 5"]}`,
          }],
        }),
      });
      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text || "";
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      setGenerated(parsed);
    } catch {
      setError("Generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const applySection = (sec) => {
    const val = generated?.[sec];
    if (!val) return;
    onApplyField?.(sec, val);
    setConfirmed(p => ({ ...p, [sec]: true }));
    setTimeout(() => setConfirmed(p => ({ ...p, [sec]: false })), 3000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#fff", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{
        padding: "18px 22px 14px", borderBottom: "1px solid #e8edf5",
        background: "linear-gradient(135deg, #fafbff 0%, #f0f3ff 100%)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: "linear-gradient(135deg, #6366f1, #818cf8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 14px rgba(99,102,241,.3)",
          }}>
            <SparkIcon size={16} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#1e1b4b" }}>AI Content Studio</div>
            <div style={{ fontSize: 11, color: "#818cf8", fontWeight: 600 }}>Powered by Claude Sonnet</div>
          </div>
        </div>
        <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 10, lineHeight: 1.6 }}>
          Generate all content at once, or use the Edit button on each field for field-specific AI generation.
        </p>
      </div>

      <div style={{ display: "flex", gap: 0, padding: "12px 16px 0", borderBottom: "1px solid #e8edf5" }}>
        {sections.map(sec => {
          const active = activeSection === sec.id;
          return (
            <button key={sec.id} type="button" onClick={() => setActiveSection(sec.id)} style={{
              flex: 1, padding: "9px 6px", fontSize: 12, fontWeight: 800,
              borderRadius: "9px 9px 0 0",
              border: "1px solid", borderColor: active ? "#c7d2fe" : "#e2e8f0",
              borderBottom: active ? "1px solid #fff" : "1px solid #e2e8f0",
              background: active ? "#fff" : "#f8fafc",
              color: active ? "#6366f1" : "#94a3b8",
              cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              marginBottom: -1, transition: "all .15s",
            }}>
              <span style={{ fontSize: 13 }}>{sec.icon}</span> {sec.label}
              {confirmed[sec.id] && <span style={{ fontSize: 8, background: "#dcfce7", color: "#166534", borderRadius: 20, padding: "1px 5px", fontWeight: 800 }}>✓</span>}
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px" }}>
        {!generated && !loading && !error && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", gap: 16, paddingBottom: 32 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 20,
              background: "linear-gradient(135deg, #eef2ff, #ede9fe)",
              border: "1.5px solid #c7d2fe",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28,
            }}>✨</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#1e1b4b", marginBottom: 6 }}>Generate All Content</div>
              <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.65, maxWidth: 210 }}>
                Click Generate below to create an SEO-optimized description, tagline, and services list.
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 12, color: "#6366f1", fontWeight: 800, marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span> Claude is crafting…
            </div>
            {[100, 88, 100, 72, 94, 65, 82, 78].map((w, i) => (
              <Shimmer key={i} h={11} w={`${w}%`} delay={i * 0.07} />
            ))}
          </div>
        )}

        {error && (
          <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 10, padding: 14, fontSize: 13, color: "#e11d48" }}>
            {error}
          </div>
        )}

        {generated && !loading && (
          <div style={{ animation: "slideIn .25s ease" }}>
            <div style={{
              background: "#f8fafc", border: "1.5px solid #e0e7ff",
              borderRadius: 12, padding: 16, marginBottom: 14,
            }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#6366f1", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 12 }}>
                {sections.find(s => s.id === activeSection)?.icon} {sections.find(s => s.id === activeSection)?.label}
              </div>
              {activeSection === "services" && Array.isArray(generated.services) ? (
                <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                  {generated.services.map((s, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: "#334155" }}>
                      <span style={{
                        width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                        background: "#eef2ff", border: "1px solid #c7d2fe",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, fontWeight: 800, color: "#6366f1",
                      }}>{i + 1}</span>
                      {s}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: 0, fontSize: 13, color: "#334155", lineHeight: 1.75 }}>
                  {generated[activeSection]}
                </p>
              )}
            </div>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              {["SEO-optimized", "Local keywords", "CTA included"].map(b => (
                <span key={b} style={{
                  fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                  background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534",
                }}>✓ {b}</span>
              ))}
            </div>

            <button type="button" onClick={() => applySection(activeSection)} style={{
              width: "100%", padding: "12px 16px", borderRadius: 10, border: "none",
              background: confirmed[activeSection]
                ? "linear-gradient(135deg, #10b981, #059669)"
                : "linear-gradient(135deg, #6366f1, #818cf8)",
              color: "#fff", fontSize: 13, fontWeight: 800,
              cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: "0 4px 16px rgba(99,102,241,.3)", transition: "all .3s",
            }}>
              {confirmed[activeSection]
                ? <><CheckIcon size={14} color="#fff" /> Applied to Field!</>
                : <><CheckIcon size={14} color="#fff" /> Apply to Business Info</>}
            </button>
          </div>
        )}
      </div>

      <div style={{ padding: "12px 20px 18px", borderTop: "1px solid #e8edf5" }}>
        <button type="button" onClick={generate} disabled={loading} style={{
          width: "100%", padding: "13px 16px", borderRadius: 10, border: "none",
          background: loading ? "#e0e7ff" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
          color: loading ? "#a5b4fc" : "#fff",
          fontSize: 13, fontWeight: 800,
          cursor: loading ? "not-allowed" : "pointer",
          fontFamily: "inherit",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          boxShadow: loading ? "none" : "0 4px 20px rgba(99,102,241,.35)",
          transition: "all .2s",
        }}>
          {loading
            ? <><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span> Generating…</>
            : <><SparkIcon /> {generated ? "✦ Regenerate All" : "✦ Generate All Content"}</>}
        </button>
      </div>
    </div>
  );
}

// ─── Main panel (GMB-style fields + AI) ─────────────────────────────────────
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
  onBack,
  requireLocationPick,
  preselectedLocationId,
} = {}) {
  const embedded = layout === "embedded";
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
    serviceArea: "",
    hoursSummary: "",
    specialHours: "",
    yearEstablished: "",
    accessibility: "",
    additionalInfo: "",
    primaryCategory: "",
    chatUrl: "",
    googleOpenStatus: "",
  });

  const setField = useCallback((key) => (val) => setFields((p) => ({ ...p, [key]: val })), []);

  useEffect(() => {
    if (profileDescriptionProp === undefined || profileDescriptionProp === null) return;
    setFields((f) => ({ ...f, description: String(profileDescriptionProp) }));
  }, [profileDescriptionProp]);

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
    setFields((f) => ({
      ...f,
      businessName: loc.title || f.businessName,
      phone: loc.phone || f.phone,
      website: loc.websiteUrl || f.website,
      primaryCategory: loc.primaryCategory || f.primaryCategory,
      googleOpenStatus: loc.openStatus || f.googleOpenStatus,
    }));
  }, [activeEditorLocationId, gmbLocations]);

  const businessName = fields.businessName || selectedBusiness.title || "";

  const handleStudioApply = useCallback((section, content) => {
    if (section === "description") setFields((p) => ({ ...p, description: typeof content === "string" ? content : "" }));
    if (section === "tagline") setFields((p) => ({ ...p, tagline: typeof content === "string" ? content : "" }));
    if (section === "services") setFields((p) => ({ ...p, services: Array.isArray(content) ? content.join(", ") : String(content || "") }));
  }, []);

  const handleSave = useCallback(() => {
    if (onConfirmProfileDescription) onConfirmProfileDescription(fields.description || "");
  }, [onConfirmProfileDescription, fields.description]);

  const sharedFieldProps = { businessName, categoryHint, userData, primaryLoc };

  const categoryBlock = (
    <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid #eef2f6" }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10 }}>
        Business categories
      </div>
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
  const gridColumns = embedded ? "1fr" : "minmax(0,1fr) 420px";
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
                Google Business Profile style editor — use <strong style={{ color: "#6366f1" }}>Edit</strong> on any field for AI or manual input, or bulk-generate in AI Content Studio.
              </p>
            </div>
          </div>
        )}

        {embedded && editorPhase !== "pick" && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", letterSpacing: "-.02em" }}>Profile fields</div>
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 6, lineHeight: 1.5 }}>
              Choose a location first (if you have several), then use <strong style={{ color: "#6366f1" }}>Edit</strong> on each field for AI or manual updates.
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
                  <SectionBlock title="About your business" hint="Name, positioning, services, and long description — like the GMB About section.">
                    <FieldRow label="Business name" fieldId="businessName" value={fields.businessName} onChange={setField("businessName")} {...sharedFieldProps} />
                    <FieldRow label="Primary category" fieldId="primaryCategory" value={fields.primaryCategory} onChange={setField("primaryCategory")} {...sharedFieldProps} />
                    <FieldRow label="Tagline" fieldId="tagline" value={fields.tagline} onChange={setField("tagline")} {...sharedFieldProps} />
                    {categoryBlock}
                    <FieldRow label="Services" fieldId="services" value={fields.services} onChange={setField("services")} {...sharedFieldProps} />
                    <FieldRow label="Description" fieldId="description" value={fields.description} onChange={setField("description")} multiline {...sharedFieldProps} noBottomRule />
                  </SectionBlock>

                  <SectionBlock title="Contact" hint="Shown on Google; keep consistent with your live profile.">
                    <FieldRow label="Phone number" fieldId="phone" value={fields.phone} onChange={setField("phone")} {...sharedFieldProps} />
                    <FieldRow label="Chat" fieldId="chatUrl" value={fields.chatUrl} onChange={setField("chatUrl")} {...sharedFieldProps} />
                    <FieldRow label="Website" fieldId="website" value={fields.website} onChange={setField("website")} {...sharedFieldProps} />
                    <FieldRow label="Booking / appointment link" fieldId="bookingUrl" value={fields.bookingUrl} onChange={setField("bookingUrl")} {...sharedFieldProps} noBottomRule />
                  </SectionBlock>

                  <SectionBlock title="Location and areas" hint="Business location from Google; service area is for drafts and AI.">
                    <ReadOnlyAddressRow
                      label="Business location"
                      value={primaryLoc.fullAddress || [primaryLoc.address, primaryLoc.locality].filter(Boolean).join(", ")}
                      hint="To change the pin or address, update the listing in Google Business Profile."
                    />
                    <ReadOnlyLinkRow label="Google Maps" href={primaryLoc.mapsUri} hint="Opens your business on Google Maps." />
                    <FieldRow label="Service area" fieldId="serviceArea" value={fields.serviceArea} onChange={setField("serviceArea")} {...sharedFieldProps} noBottomRule />
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
                  <FieldRow label="Business name" fieldId="businessName" value={fields.businessName} onChange={setField("businessName")} {...sharedFieldProps} />
                  <FieldRow label="Primary category" fieldId="primaryCategory" value={fields.primaryCategory} onChange={setField("primaryCategory")} {...sharedFieldProps} />
                  <FieldRow label="Tagline" fieldId="tagline" value={fields.tagline} onChange={setField("tagline")} {...sharedFieldProps} />
                  {categoryBlock}
                  <FieldRow label="Services" fieldId="services" value={fields.services} onChange={setField("services")} {...sharedFieldProps} />
                  <FieldRow label="Description" fieldId="description" value={fields.description} onChange={setField("description")} multiline {...sharedFieldProps} noBottomRule />
                </div>
              )}

              {tab === "contact" && (
                <div style={{ animation: "slideIn .25s ease" }}>
                  <FieldRow label="Phone number" fieldId="phone" value={fields.phone} onChange={setField("phone")} {...sharedFieldProps} />
                  <FieldRow label="Chat" fieldId="chatUrl" value={fields.chatUrl} onChange={setField("chatUrl")} {...sharedFieldProps} />
                  <FieldRow label="Website" fieldId="website" value={fields.website} onChange={setField("website")} {...sharedFieldProps} />
                  <FieldRow label="Booking / appointment link" fieldId="bookingUrl" value={fields.bookingUrl} onChange={setField("bookingUrl")} {...sharedFieldProps} noBottomRule />
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
                    label="Business location"
                    value={primaryLoc.fullAddress || [primaryLoc.address, primaryLoc.locality].filter(Boolean).join(", ")}
                    hint="Update in Google Business Profile to change the map pin."
                  />
                  <ReadOnlyLinkRow label="View on Google Maps" href={primaryLoc.mapsUri} />
                  <FieldRow label="Service area" fieldId="serviceArea" value={fields.serviceArea} onChange={setField("serviceArea")} {...sharedFieldProps} noBottomRule />
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
                <strong style={{ color: "#6366f1" }}>Save</strong> writes your description to automation settings.
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={Boolean(savePending)}
                style={{
                  flexShrink: 0,
                  background: savePending ? "#e0e7ff" : "linear-gradient(135deg, #6366f1, #7c3aed)",
                  color: savePending ? "#a5b4fc" : "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "11px 28px",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: savePending ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  boxShadow: savePending ? "none" : "0 4px 18px rgba(99,102,241,.35)",
                }}
              >
                {savePending ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>

          <div
            style={{
              background: "#fff",
              borderRadius: 18,
              boxShadow: "0 4px 32px rgba(15,23,42,.08)",
              border: "1px solid #e4e9f2",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              minHeight: embedded ? 420 : 0,
              height: embedded ? "auto" : "100%",
            }}
          >
            <AIStudioPanel
              businessName={businessName}
              categoryHint={categoryHint}
              userData={userData}
              primaryLoc={primaryLoc}
              selectedBusiness={selectedBusiness}
              onApplyField={handleStudioApply}
            />
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
                Review and edit your business information to improve your presence. Scroll through tabs, then save your automation description when ready.
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}