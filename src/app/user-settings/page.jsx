"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo, useCallback } from "react";
import Lottie from "lottie-react";
import animationData from "@/assets/animation/Loading.json";
import { getValidFrequencies, getRecommendedFrequency } from "@/utils/userSettingsHelpers";

const ASSET_IMAGE_FIELDS = ["characterImage", "uniformImage", "productImage", "backgroundImage", "logoImage"];
const USER_SETTINGS_PASSKEY = "Limbu007";

function pickFirstNonEmpty(...vals) {
  for (const v of vals) {
    if (v != null && String(v).trim().length > 12) return v;
  }
  return null;
}

/** URL, data URL, or raw base64 → something <img src> can use */
function toDisplayableImageSrc(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (s.length < 20) return null;
  if (s.startsWith("data:image")) return s;
  if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("//")) {
    return s.startsWith("//") ? `https:${s}` : s;
  }
  const clean = s.replace(/\s/g, "");
  if (/^[A-Za-z0-9+/]+=*$/.test(clean) && clean.length > 80) {
    if (clean.startsWith("/9j")) return `data:image/jpeg;base64,${clean}`;
    if (clean.startsWith("iVBOR")) return `data:image/png;base64,${clean}`;
    if (clean.startsWith("R0lGOD")) return `data:image/gif;base64,${clean}`;
    if (clean.startsWith("UklGR")) return `data:image/webp;base64,${clean}`;
    return `data:image/png;base64,${clean}`;
  }
  return null;
}

function AssetThumb({ src, alt }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return (
      <div style={{
        width: "100%", aspectRatio: "3/4", borderRadius: 8, background: "#f3f4f6",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 10, color: "#9ca3af", padding: 8, textAlign: "center", lineHeight: 1.35,
      }}>
        {broken ? "Could not load preview" : "No image"}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt || ""}
      onError={() => setBroken(true)}
      style={{
        width: "100%",
        height: "120px", // 👈 aur chhoti
        objectFit: "cover",
        borderRadius: 8,
        background: "#e5e7eb",
        display: "block"
      }}
    />
  );
}

const ASSET_LABELS = {
  characterImage: "Character / person",
  uniformImage: "Uniform / team",
  productImage: "Product",
  backgroundImage: "Background",
  logoImage: "Logo",
};

function defaultAssetInclude() {
  return {
    characterImage: true,
    uniformImage: true,
    productImage: true,
    backgroundImage: true,
    logoImage: true,
  };
}

function hasUsableAssetImages({ userData, savedImageConfig, latestAssetRow, include }) {
  const inc = include || defaultAssetInclude();
  return ASSET_IMAGE_FIELDS.some((k) => {
    if (inc[k] === false) return false;
    return pickFirstNonEmpty(userData?.[k], savedImageConfig?.[k], latestAssetRow?.[k]);
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toInputDate(d) {
  if (!d) return "";
  try { return new Date(d).toISOString().slice(0, 10); } catch { return ""; }
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function daysLeftFn(expiry) {
  if (!expiry) return 0;
  return Math.max(0, Math.ceil((new Date(expiry) - new Date()) / 86400000));
}

function isPlanActive(expiry) {
  if (!expiry) return false;
  return new Date(expiry) > new Date();
}

function matchPlanDetail(subPlans, paidPackage, planDuration) {
  if (!subPlans?.billingCycles || !paidPackage || !planDuration) return null;
  const cycle = subPlans.billingCycles.find(c => c.cycle === planDuration);
  if (!cycle) return null;
  return cycle.plans.find(p => p.title === paidPackage) ?? null;
}

function calculatePostingSchedule({ startDate, frequency, postsLimit, expiryDate, skippedDates = [] }) {
  if (!startDate || !postsLimit) return [];
  const dates = [];
  let current = new Date(startDate);
  const expiry = expiryDate ? new Date(expiryDate) : null;
  const step = { daily: 1, alternate: 2, weekly: 7 }[frequency] ?? 1;
  const skipped = new Set(skippedDates);
  while (dates.length < postsLimit) {
    if (expiry && current > expiry) break;
    const key = toInputDate(current);
    if (!skipped.has(key)) dates.push(new Date(current));
    current = new Date(current);
    current.setDate(current.getDate() + step);
  }
  return dates;
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      style={{
        position: "relative", display: "inline-flex", height: 28, width: 56,
        alignItems: "center", borderRadius: 14, border: "none", outline: "none",
        background: checked ? "#f59e0b" : "#d1d5db",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background .25s", flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
        boxShadow: checked ? "0 0 0 3px rgba(245,158,11,.2)" : "none",
      }}
    >
      <span style={{
        position: "absolute", top: 4,
        left: checked ? 30 : 4,
        width: 20, height: 20, borderRadius: "50%",
        background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,.2)",
        transition: "left .2s cubic-bezier(.4,0,.2,1)", display: "block",
      }} />
    </button>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 4,
      background: "#fff", border: "1px solid #f3f4f6",
      borderRadius: 16, padding: "12px 16px",
      boxShadow: "0 1px 3px rgba(0,0,0,.04)",
    }}>
      <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#9ca3af" }}>
        {label}
      </span>
      <span style={{ fontSize: 13, fontWeight: 700, color: accent || "#1f2937" }}>
        {value || "—"}
      </span>
    </div>
  );
}

function BackButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        color: "#6b7280", background: "none", border: "none",
        cursor: "pointer", fontSize: 14, fontWeight: 600, padding: 0,
      }}
      onMouseEnter={e => e.currentTarget.style.color = "#111"}
      onMouseLeave={e => e.currentTarget.style.color = "#6b7280"}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      Back
    </button>
  );
}

// ─── Step Badge ───────────────────────────────────────────────────────────────

function StepBadge({ n, label, done, active }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 800, fontSize: 12, flexShrink: 0,
        background: done ? "#f59e0b" : active ? "#111" : "#f3f4f6",
        color: done ? "#fff" : active ? "#fff" : "#9ca3af",
      }}>
        {done ? "✓" : n}
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: done ? "#d97706" : active ? "#111" : "#9ca3af" }}>{label}</span>
    </div>
  );
}

// ─── Skip Date Calendar ───────────────────────────────────────────────────────

function SkipDatePicker({ startDate, expiryDate, skippedDates, onChange }) {
  const [month, setMonth] = useState(() => {
    const d = startDate ? new Date(startDate) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const start = startDate ? new Date(startDate) : null;
  const expiry = expiryDate ? new Date(expiryDate) : null;
  const today = new Date(new Date().setHours(0, 0, 0, 0));
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const firstWeekday = new Date(month.getFullYear(), month.getMonth(), 1).getDay();

  const toggleDate = date => {
    const key = toInputDate(date);
    onChange(skippedDates.includes(key) ? skippedDates.filter(d => d !== key) : [...skippedDates, key]);
  };

  return (
    <div style={{ background: "#fff", border: "1px solid #f3f4f6", borderRadius: 16, padding: "16px 18px", boxShadow: "0 1px 3px rgba(0,0,0,.04)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 8, padding: "3px 10px", cursor: "pointer", color: "#6b7280", fontSize: 16 }}>‹</button>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>
          {month.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
        </span>
        <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 8, padding: "3px 10px", cursor: "pointer", color: "#6b7280", fontSize: 16 }}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: "#9ca3af" }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
        {Array.from({ length: firstWeekday }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const date = new Date(month.getFullYear(), month.getMonth(), i + 1);
          const key = toInputDate(date);
          const skipped = skippedDates.includes(key);
          const isToday = key === toInputDate(new Date());
          const inRange = (!start || date >= start) && (!expiry || date <= expiry);
          const isPast = date < today;
          return (
            <button key={i} onClick={() => inRange && !isPast && toggleDate(date)} disabled={!inRange || isPast}
              style={{
                width: "100%", aspectRatio: "1", borderRadius: 8, border: "none",
                outline: isToday ? "2px solid #f59e0b" : "none", outlineOffset: -2,
                background: skipped ? "#fef2f2" : inRange && !isPast ? "#f9fafb" : "transparent",
                color: skipped ? "#ef4444" : !inRange || isPast ? "#d1d5db" : "#374151",
                fontSize: 11, fontWeight: isToday ? 700 : 400,
                cursor: inRange && !isPast ? "pointer" : "default",
                textDecoration: skipped ? "line-through" : "none",
                transition: "background .12s",
              }}>
              {i + 1}
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: 10, fontSize: 11, color: "#9ca3af", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
        <span>Tap dates to skip · <span style={{ color: "#ef4444" }}>strikethrough = skipped</span></span>
        {skippedDates.length > 0 && (
          <button onClick={() => onChange([])} style={{ fontSize: 11, color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
            Clear skipped ({skippedDates.length})
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Drag-and-Drop Keyword Sequencer ─────────────────────────────────────────

function DragKeywordList({ selectedKeywords, onChange }) {
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);

  const handleDrop = (targetIdx) => {
    if (dragIdx === null || dragIdx === targetIdx) return;
    const reordered = [...selectedKeywords];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(targetIdx, 0, moved);
    onChange(reordered);
    setDragIdx(null); setOverIdx(null);
  };

  if (!selectedKeywords.length) return null;

  return (
    <div style={{ borderTop: "1px solid #f3f4f6", background: "rgba(254,243,199,.25)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px 6px" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: .5 }}>
          ✅ Selected order ({selectedKeywords.length}) — drag to resequence
        </span>
        <button onClick={() => onChange([])} style={{ fontSize: 11, color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Clear all</button>
      </div>
      <div style={{ padding: "6px 20px 14px", display: "flex", flexDirection: "column", gap: 5 }}>
        {selectedKeywords.map((kw, i) => (
          <div
            key={kw + i}
            draggable
            onDragStart={() => setDragIdx(i)}
            onDragOver={e => { e.preventDefault(); setOverIdx(i); }}
            onDrop={() => handleDrop(i)}
            onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 12px",
              borderRadius: 10,
              background: overIdx === i ? "#fef3c7" : "#fff",
              border: overIdx === i ? "1.5px dashed #f59e0b" : "1px solid #e5e7eb",
              cursor: "grab",
              transition: "all .12s",
              opacity: dragIdx === i ? 0.45 : 1,
              userSelect: "none",
            }}
          >
            {/* drag handle */}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" style={{ flexShrink: 0 }}>
              <circle cx="9" cy="6" r="1.5" fill="#9ca3af" stroke="none" />
              <circle cx="9" cy="12" r="1.5" fill="#9ca3af" stroke="none" />
              <circle cx="9" cy="18" r="1.5" fill="#9ca3af" stroke="none" />
              <circle cx="15" cy="6" r="1.5" fill="#9ca3af" stroke="none" />
              <circle cx="15" cy="12" r="1.5" fill="#9ca3af" stroke="none" />
              <circle cx="15" cy="18" r="1.5" fill="#9ca3af" stroke="none" />
            </svg>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#d97706", minWidth: 22 }}>#{i + 1}</span>
            <span style={{ fontSize: 13, color: "#111", fontWeight: 500, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{kw}</span>
            <button
              onClick={() => onChange(selectedKeywords.filter((_, j) => j !== i))}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#d1d5db", fontSize: 14, padding: 0, lineHeight: 1, flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
              onMouseLeave={e => e.currentTarget.style.color = "#d1d5db"}
            >✕</button>
          </div>
        ))}
      </div>
      <div style={{ padding: "0 20px 10px", fontSize: 11, color: "#9ca3af" }}>
        Post 1 uses keyword #1, Post 2 uses keyword #2, and so on sequentially.
      </div>
    </div>
  );
}

// ─── Keyword Picker Panel ─────────────────────────────────────────────────────

function KeywordPickerPanel({ keywords, selectedKeywords, onChange, loading, planLimit }) {
  const [search, setSearch] = useState("");
  const [customKw, setCustomKw] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const allKeywords = useMemo(() => keywords.map(k => k.keyword || k), [keywords]);
  const filtered = useMemo(() => allKeywords.filter(kw => kw.toLowerCase().includes(search.toLowerCase())), [allKeywords, search]);

  const toggle = kw => onChange(
    selectedKeywords.includes(kw) ? selectedKeywords.filter(k => k !== kw) : [...selectedKeywords, kw]
  );

  const addCustom = () => {
    const kw = customKw.trim();
    if (kw && !selectedKeywords.includes(kw)) onChange([...selectedKeywords, kw]);
    setCustomKw(""); setShowCustom(false);
  };

  const hasEnough = planLimit > 0 ? selectedKeywords.length >= planLimit : true;

  return (
    <div style={{ background: "#fff", border: `1px solid ${hasEnough ? "#f3f4f6" : "#fde68a"}`, borderRadius: 20, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
      {/* Header */}
      <div style={{ padding: "18px 20px 12px", borderBottom: "1px solid #f3f4f6" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>Keywords</span>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: "#fef3c7", color: "#d97706" }}>
              {loading ? "…" : `${allKeywords.length} saved`}
            </span>
          </div>
          <span style={{
            fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 10,
            background: hasEnough ? "#f0fdf4" : "#fef2f2",
            color: hasEnough ? "#15803d" : "#b91c1c",
          }}>
            {selectedKeywords.length}{planLimit > 0 ? ` / ${planLimit} required` : " selected"}
          </span>
        </div>
        {planLimit > 0 && !hasEnough && (
          <p style={{ fontSize: 12, color: "#b91c1c", fontWeight: 600, marginTop: 4 }}>
            ⚠ Select {planLimit - selectedKeywords.length} more keyword{planLimit - selectedKeywords.length !== 1 ? "s" : ""} ({planLimit} posts = {planLimit} unique keywords)
          </p>
        )}
        {planLimit > 0 && hasEnough && (
          <p style={{ fontSize: 12, color: "#15803d", fontWeight: 600, marginTop: 4 }}>
            ✓ Ready — {planLimit} keywords for {planLimit} posts
          </p>
        )}
      </div>

      {/* Quick actions */}
      {allKeywords.length > 0 && (
        <div style={{ padding: "10px 20px", background: "#f9fafb", borderBottom: "1px solid #f3f4f6", display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#6b7280" }}>Quick select:</span>
          {[planLimit, planLimit + 5, allKeywords.length].filter((n, i, a) => n > 0 && n <= allKeywords.length && a.indexOf(n) === i).map(n => (
            <button key={n} onClick={() => onChange(allKeywords.slice(0, n))}
              style={{ fontSize: 12, padding: "4px 12px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontWeight: 600, cursor: "pointer" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#f59e0b"; e.currentTarget.style.color = "#d97706"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#374151"; }}>
              {n === allKeywords.length ? "Select all" : `Top ${n}`}
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <div style={{ padding: "10px 20px", borderBottom: "1px solid #f3f4f6", position: "relative" }}>
        <svg style={{ position: "absolute", left: 32, top: "50%", transform: "translateY(-50%)" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <input type="text" placeholder="Search keywords…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: "100%", paddingLeft: 32, paddingRight: search ? 32 : 12, paddingTop: 8, paddingBottom: 8, borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 13, color: "#374151", outline: "none", background: "#f9fafb", boxSizing: "border-box", fontFamily: "inherit" }}
          onFocus={e => e.currentTarget.style.borderColor = "#f59e0b"} onBlur={e => e.currentTarget.style.borderColor = "#e5e7eb"} />
        {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 32, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 14 }}>✕</button>}
      </div>

      {/* Keywords grid */}
      <div style={{ padding: 20, minHeight: 80, maxHeight: 220, overflowY: "auto" }}>
        {loading ? (
          <div style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, padding: "20px 0" }}>Loading keywords…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, padding: "20px 0" }}>
            {allKeywords.length === 0 ? "No keywords saved yet. Add from Keyword Planner." : "No keywords match your search."}
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {filtered.map((kw, i) => {
              const sel = selectedKeywords.includes(kw);
              return (
                <button key={i} onClick={() => toggle(kw)} style={{
                  fontSize: 12, padding: "5px 13px", borderRadius: 20,
                  border: sel ? "1.5px solid #f59e0b" : "1.5px solid #e5e7eb",
                  background: sel ? "#f59e0b" : "#fff", color: sel ? "#fff" : "#374151",
                  fontWeight: sel ? 700 : 500, cursor: "pointer", transition: "all .12s", fontFamily: "inherit",
                }}>
                  {sel && "✓ "}{kw}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Drag-and-drop ordered list */}
      <DragKeywordList selectedKeywords={selectedKeywords} onChange={onChange} />

      {/* Add custom */}
      <div style={{ borderTop: "1px solid #f3f4f6", padding: "12px 20px" }}>
        {showCustom ? (
          <div style={{ display: "flex", gap: 8 }}>
            <input autoFocus placeholder="Type a custom keyword…" value={customKw} onChange={e => setCustomKw(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addCustom()}
              style={{ flex: 1, border: "1.5px solid #f59e0b", borderRadius: 8, padding: "7px 12px", fontSize: 13, outline: "none", fontFamily: "inherit" }} />
            <button onClick={addCustom} style={{ fontSize: 12, padding: "7px 14px", borderRadius: 8, background: "#f59e0b", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}>Add</button>
            <button onClick={() => { setShowCustom(false); setCustomKw(""); }} style={{ fontSize: 12, padding: "7px 12px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280", cursor: "pointer" }}>✕</button>
          </div>
        ) : (
          <button onClick={() => setShowCustom(true)} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#d97706", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
            Add custom keyword
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Success Modal ────────────────────────────────────────────────────────────

function SuccessModal({ summary, onClose }) {
  if (!summary) return null;
  const { locations = [], keywords = [], schedule = [], frequency, startDate, endDate, businessName } = summary;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 999,
      background: "rgba(0,0,0,.55)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 24, width: "100%", maxWidth: 520,
        maxHeight: "88vh", overflowY: "auto",
        boxShadow: "0 20px 60px rgba(0,0,0,.25)",
        animation: "modalIn .25s cubic-bezier(.34,1.56,.64,1)",
      }}>
        <style>{`@keyframes modalIn{from{opacity:0;transform:scale(.92) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>

        {/* Top success banner */}
        <div style={{ background: "linear-gradient(135deg,#065f46,#047857)", borderRadius: "24px 24px 0 0", padding: "28px 24px 24px", textAlign: "center", position: "relative" }}>
          <button onClick={onClose} style={{ position: "absolute", top: 14, right: 16, background: "rgba(255,255,255,.15)", border: "none", color: "#fff", width: 30, height: 30, borderRadius: "50%", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          <div style={{ fontSize: 44, marginBottom: 10 }}>✅</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 4 }}>Automation Saved!</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,.8)" }}>
            Your daily GMB posting is set up and ready to run automatically.
          </div>
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Schedule summary row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[
              { label: "Frequency", value: frequency || "daily", icon: "🔄" },
              { label: "Start Date", value: startDate ? new Date(startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—", icon: "📅" },
              { label: "Total Posts", value: schedule.length, icon: "📬" },
            ].map(({ label, value, icon }) => (
              <div key={label} style={{ background: "#f9fafb", border: "1px solid #f3f4f6", borderRadius: 14, padding: "12px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#111" }}>{value}</div>
                <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* End date if set */}
          {endDate && (
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "10px 14px", fontSize: 13, color: "#92400e", fontWeight: 600 }}>
              📅 Posts will stop on {new Date(endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </div>
          )}

          {/* Locations */}
          {locations.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                Posting to {locations.length} location{locations.length !== 1 ? "s" : ""}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {locations.map((loc, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10 }}>
                    <span style={{ fontSize: 16 }}>📍</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{loc.name || loc.locality || "Location"}</div>
                      <div style={{ fontSize: 11, color: "#6b7280" }}>{loc.address || loc.locationId}</div>
                    </div>
                    <span style={{ marginLeft: "auto", fontSize: 10, background: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0", borderRadius: 20, padding: "2px 8px", fontWeight: 700 }}>Active</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Keywords */}
          {keywords.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                {keywords.length} keywords (sequential order)
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {keywords.map((kw, i) => (
                  <span key={i} style={{ fontSize: 12, background: "#fef3c7", border: "1px solid #fde68a", color: "#92400e", padding: "4px 10px", borderRadius: 20, fontWeight: 600 }}>
                    <span style={{ opacity: .6, fontSize: 10 }}>#{i + 1}</span> {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Next post dates */}
          {schedule.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                First {Math.min(6, schedule.length)} posting days
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
                {schedule.slice(0, 6).map((d, i) => (
                  <div key={i} style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#d97706" }}>{new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
                    <div style={{ fontSize: 10, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{keywords[i] || ""}</div>
                  </div>
                ))}
              </div>
              {schedule.length > 6 && (
                <div style={{ fontSize: 12, color: "#d97706", fontWeight: 600, textAlign: "center", marginTop: 6 }}>+ {schedule.length - 6} more days scheduled</div>
              )}
            </div>
          )}

          <button onClick={onClose} style={{ width: "100%", background: "#111", color: "#fff", border: "none", padding: "13px", borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 4 }}>
            Done — I'm all set 🚀
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AutomationSettings({ onNavigateBack }) {
  const router = useRouter();
  const [pageLoading, setPageLoading] = useState(true);
  const [kwLoading, setKwLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [error, setError] = useState("");
  const { data: session } = useSession();




  // API data
  const [userData, setUserData] = useState(null);
  const [subPlans, setSubPlans] = useState(null);
  const [savedKws, setSavedKws] = useState([]);
  const [planLimit, setPlanLimit] = useState(0);

  // GMB locations (selected under Google toggle in Step 1)
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [gmbLocations, setGmbLocations] = useState([]); // all locations from localStorage
  const [selectedLocations, setSelectedLocations] = useState([]); // checked locations to post to

  // Posts used as tracked by the AutomationPlan (more accurate than User model)
  const [planPostsUsed, setPlanPostsUsed] = useState(null);
  const [autoStatus, setAutoStatus] = useState(null); // automationStatus from API
  const [showForm, setShowForm] = useState(true);      // collapse settings form after save; Edit re-opens
  const [savedKeywords, setSavedKeywords] = useState([]); // saved plan keywords (used/pending display)

  // Form state (Steps 2–6)
  const [automationEnabled, setAutomationEnabled] = useState(false);
  const [frequency, setFrequency] = useState("daily");
  const [startDate, setStartDate] = useState(() => toInputDate(new Date()));
  const [endDate, setEndDate] = useState("");
  const [skippedDates, setSkippedDates] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [customDates, setCustomDates] = useState([]); // for "custom" frequency
  const [customDateInput, setCustomDateInput] = useState(""); // date being typed
  const [selectedKeywords, setSelectedKeywords] = useState([]);

  // Multi-platform state
  const [facebookPages, setFacebookPages] = useState([]);
  const [instagramPages, setInstagramPages] = useState([]);
  const [selectedFbPages, setSelectedFbPages] = useState([]); // pageIds
  const [selectedIgPages, setSelectedIgPages] = useState([]); // igIds

  const [platformGmb, setPlatformGmb] = useState(true);
  const [platformFb, setPlatformFb] = useState(false);
  const [platformIg, setPlatformIg] = useState(false);

  useEffect(() => {
    if (platformGmb) setGmbLocationsExpanded(true);
  }, [platformGmb]);
  const [postingHour, setPostingHour] = useState(11);
  const [postingMinute, setPostingMinute] = useState(0);

  const [latestAssets, setLatestAssets] = useState([]);
  const [savedImageConfig, setSavedImageConfig] = useState(null);
  const [assetInclude, setAssetInclude] = useState(defaultAssetInclude);
  const [assetPreview, setAssetPreview] = useState(null); // { label, src } | null

  // Success modal
  const [showModal, setShowModal] = useState(false);
  const [savedSummary, setSavedSummary] = useState(null);
  const [passkeyVerified, setPasskeyVerified] = useState(false);
  const [passkeyInput, setPasskeyInput] = useState("");
  const [passkeyError, setPasskeyError] = useState("");

  const [gmbLocationsExpanded, setGmbLocationsExpanded] = useState(true);
  const [metaSyncing, setMetaSyncing] = useState(false);
  const displayName = useMemo(() => {
    const rawName = String(userData?.fullName || "").trim();
    if (!rawName || /^USR\d+$/i.test(rawName)) return "Automation Settings";
    return rawName;
  }, [userData?.fullName]);

  const refreshSocialPages = useCallback(() => {
    const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
    if (!userId) return Promise.resolve();
    setMetaSyncing(true);
    return Promise.allSettled([
      fetch(`/api/facebook/pages?userId=${encodeURIComponent(userId)}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/instagram/pages?userId=${encodeURIComponent(userId)}`).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([fbR, igR]) => {
        if (fbR.status === "fulfilled" && Array.isArray(fbR.value?.pages)) setFacebookPages(fbR.value.pages);
        if (igR.status === "fulfilled" && Array.isArray(igR.value?.pages)) setInstagramPages(igR.value.pages);
      })
      .finally(() => setMetaSyncing(false));
  }, []);

  useEffect(() => {
    refreshSocialPages();
    const onVis = () => {
      if (document.visibilityState === "visible") refreshSocialPages();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [refreshSocialPages]);

  useEffect(() => {
    if (!assetPreview) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setAssetPreview(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [assetPreview]);

  // ── Load saved keywords ────────────────────────────────────────────────────
  const fetchSavedKeywords = async () => {
    const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
    if (!userId) return;
    setKwLoading(true);
    try {
      const res = await fetch(`/api/keyword-research?userId=${userId}`);
      const data = await res.json();
      if (Array.isArray(data.data)) setSavedKws(data.data);
    } catch (e) {
      console.warn("Keyword fetch failed:", e.message);
    } finally {
      setKwLoading(false);
    }
  };

  // ── Main load ──────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        setPageLoading(true);
        const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
        if (!userId) { setError("User ID not found. Please log in again."); setPageLoading(false); return; }

        // Parse locationDetails from localStorage for business picker
        try {
          const raw = localStorage.getItem("locationDetails");
          if (raw) {
            const locs = JSON.parse(raw);
            if (Array.isArray(locs)) {
              setGmbLocations(locs);
            }
          }
        } catch { /* ignore */ }

        const [userR, plansR, settingsR, kwR, assetsR] = await Promise.allSettled([
          fetch(`/api/auth/signup?userId=${encodeURIComponent(userId)}`),
          fetch("/api/home-data?type=subscriptionPlans"),
          fetch(`/api/user-settings?userId=${encodeURIComponent(userId)}`),
          fetch(`/api/keyword-research?userId=${encodeURIComponent(userId)}`),
          fetch(`/api/assets-manage?userId=${encodeURIComponent(userId)}`),
        ]);

        if (userR.status === "fulfilled" && userR.value.ok) {
          setUserData(await userR.value.json());
        }

        if (plansR.status === "fulfilled" && plansR.value.ok) {
          setSubPlans(await plansR.value.json());
        }

        if (settingsR.status === "fulfilled" && settingsR.value.ok) {
          const s = await settingsR.value.json();
          const as = s.automationSettings;

          // Restore plan limit
          if (typeof s.keywordsRequired === "number") setPlanLimit(s.keywordsRequired);

          // Use postsUsed from AutomationPlan (kept in sync by cron — more reliable)
          if (typeof as?.planDetails?.postsUsed === "number") {
            setPlanPostsUsed(as.planDetails.postsUsed);
          }

          // Store automation live status (next post, last post, counters)
          if (s.automationStatus) setAutoStatus(s.automationStatus);
          // Active automation → show read-only status (form collapsed). Edit re-opens it.
          setShowForm(!s.automationStatus?.enabled);

          // Restore saved automation settings
          if (as) {
            setAutomationEnabled(as.automationEnabled ?? false);
            setFrequency(as.frequency || "daily");
            if (as.startDate) setStartDate(toInputDate(as.startDate));
            if (as.endDate) setEndDate(toInputDate(as.endDate));
            setSelectedKeywords(as.keywords || []);
            setSavedKeywords(as.keywords || []);
            setSkippedDates(as.skippedDates || []);
            if (as.frequency === "custom" && Array.isArray(as.schedule)) {
              setCustomDates(as.schedule.map(d => toInputDate(new Date(d))));
            }
            if (as.imageConfig) {
              setSavedImageConfig(as.imageConfig);
              if (as.imageConfig.includeInGeneration) {
                setAssetInclude({ ...defaultAssetInclude(), ...as.imageConfig.includeInGeneration });
              }
            }
          }

          // Restore selected business
          const savedBiz = s.selectedBusiness;
          if (savedBiz?.projectId || savedBiz?.googleId) {
            setSelectedBusiness(savedBiz);
          } else {
            try {
              const bd = localStorage.getItem("businessDetails");
              if (bd) { const parsed = JSON.parse(bd); if (parsed) { setSelectedBusiness(parsed); } }
            } catch { /* ignore */ }
          }

          // Restore previously saved locations
          if (Array.isArray(s.savedLocations) && s.savedLocations.length > 0) {
            setSelectedLocations(s.savedLocations);
          }

          // Restore selected FB / IG pages for automation
          if (Array.isArray(as?.fbPages) && as.fbPages.length > 0) {
            setSelectedFbPages(as.fbPages.map(p => p.pageId));
          }
          if (Array.isArray(as?.igPages) && as.igPages.length > 0) {
            setSelectedIgPages(as.igPages.map(p => p.igId));
          }
          const plats = Array.isArray(as?.platforms) ? as.platforms : ["gmb"];
          setPlatformGmb(plats.includes("gmb"));
          setPlatformFb(plats.includes("fb"));
          setPlatformIg(plats.includes("ig"));
          if (typeof as.postingHour === "number" && !Number.isNaN(as.postingHour)) {
            setPostingHour(as.postingHour);
          }
          if (typeof as.postingMinute === "number" && !Number.isNaN(as.postingMinute)) {
            setPostingMinute(as.postingMinute);
          }
        }

        if (kwR.status === "fulfilled" && kwR.value.ok) {
          const kwData = await kwR.value.json();
          if (Array.isArray(kwData.data)) setSavedKws(kwData.data);
        }

        if (assetsR.status === "fulfilled" && assetsR.value.ok) {
          try {
            const assetPayload = await assetsR.value.json();
            if (Array.isArray(assetPayload.data)) setLatestAssets(assetPayload.data);
          } catch { /* ignore */ }
        }

      } catch (e) {
        setError(e.message || "Failed to load");
      } finally {
        setPageLoading(false);
      }
    })();
  }, []);

  // When locations load, auto-select the account and all locations (if nothing saved yet)
  useEffect(() => {
    if (gmbLocations.length === 0) return;

    // Set selectedBusiness from first location (all share the same account)
    if (!selectedBusiness) {
      const loc = gmbLocations[0];
      setSelectedBusiness({
        name: loc.title || loc.name || "Your Business",
        title: loc.title || loc.name || "Your Business",
        address: loc.address || "",
        locality: loc.locality || "",
        locationId: loc.locationId || "",
        accountId: loc.accountId || "",
        projectId: loc.accountId || loc.locationId || "",
        googleId: loc.accountId || loc.locationId || "",
        websiteUrl: loc.websiteUrl || "",
      });
    }

    // Auto-select all locations if none saved yet
    if (selectedLocations.length === 0) {
      setSelectedLocations(gmbLocations.map(loc => ({
        locationId: loc.locationId || "",
        accountId: loc.accountId || "",
        name: loc.title || loc.name || "",
        address: loc.address || "",
        locality: loc.locality || "",
        websiteUrl: loc.websiteUrl || "",
        isVerified: loc.isVerified || false,
      })));
    }
  }, [gmbLocations]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Plan matching ──────────────────────────────────────────────────────────
  const planDetail = useMemo(() =>
    matchPlanDetail(subPlans, userData?.paidPackage, userData?.planDuration),
    [subPlans, userData]
  );

  const totalPosts = planDetail?.posts ?? 0;
  const citations = planDetail?.citations ?? 0;
  // Prefer AutomationPlan.planDetails.postsUsed (updated by cron after each post)
  // Fall back to User.postsUsed from auth/signup API
  const postsUsed = planPostsUsed !== null ? planPostsUsed : (Number(userData?.postsUsed) || 0);
  const postsLeft = Math.max(0, totalPosts - postsUsed);
  const usagePct = totalPosts > 0 ? Math.min(100, (postsUsed / totalPosts) * 100) : 0;
  const usageByPlatform = autoStatus?.usageByPlatform || { gmb: 0, fb: 0, ig: 0 };

  const latestAssetRow = Array.isArray(latestAssets) && latestAssets.length > 0 ? latestAssets[0] : null;
  const hasAssetImages = hasUsableAssetImages({ userData, savedImageConfig, latestAssetRow, include: assetInclude });
  const pkgStart = userData?.packageStartDate ?? null;
  const pkgExpiry = userData?.packageExpiryDate ?? null;
  const planLive = isPlanActive(pkgExpiry);
  const days = daysLeftFn(pkgExpiry);
  const hasPlan = !!(userData?.paidPackage && pkgExpiry);

  // When plan limit is not yet loaded from API, derive from planDetail
  const effectivePlanLimit = planLimit > 0 ? planLimit : totalPosts;

  const canEnableAutomation =
    planLive &&
    (
      (platformGmb && selectedLocations.length > 0) ||
      (platformFb && selectedFbPages.length > 0) ||
      (platformIg && selectedIgPages.length > 0)
    );

  // ── Auto-calculate end date ────────────────────────────────────────────────
  // When start date or frequency changes (and no manual end date is set),
  // automatically compute end date so ALL remaining posts fit in the window.
  useEffect(() => {
    if (!startDate || !postsLeft || frequency === "custom") return;
    const stepMap = { daily: 1, alternate: 2, weekly: 7, monthly: 30 };
    const step = stepMap[frequency] ?? 1;
    const end = new Date(startDate);
    // postsLeft posts * step days each
    end.setDate(end.getDate() + postsLeft * step);
    // Never exceed package expiry
    if (pkgExpiry && new Date(end) > new Date(pkgExpiry)) {
      setEndDate(toInputDate(pkgExpiry));
    } else {
      setEndDate(toInputDate(end));
    }
  }, [startDate, frequency, postsLeft, pkgExpiry]); // eslint-disable-line react-hooks/exhaustive-deps

  // Live schedule preview (respects skipped dates, custom dates)
  const schedule = useMemo(() => {
    if (!automationEnabled) return [];
    if (frequency === "custom") {
      return customDates
        .map(d => { try { return new Date(d); } catch { return null; } })
        .filter(d => d && !isNaN(d.getTime()))
        .sort((a, b) => a - b);
    }
    if (!postsLeft || !startDate) return [];
    return calculatePostingSchedule({
      startDate, frequency,
      postsLimit: postsLeft,
      expiryDate: endDate || pkgExpiry,
      skippedDates,
    });
  }, [automationEnabled, frequency, startDate, endDate, postsLeft, pkgExpiry, skippedDates, customDates]);

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true); setSaveStatus(null); setError("");

    const row = Array.isArray(latestAssets) && latestAssets[0] ? latestAssets[0] : null;
    const pickImg = (k) => pickFirstNonEmpty(userData?.[k], savedImageConfig?.[k], row?.[k]);

    // if (automationEnabled && !hasUsableAssetImages({ userData, savedImageConfig, latestAssetRow: row, include: assetInclude })) {
    //   setError("Add at least one brand image in Asset Management. Automation uses your assets for 3:4 posts.");
    //   setSaving(false);
    //   return;
    // }

    const platformsPayload = [
      ...(platformGmb ? ["gmb"] : []),
      ...(platformFb ? ["fb"] : []),
      ...(platformIg ? ["ig"] : []),
    ];
    if (automationEnabled) {
      if (platformsPayload.length === 0) {
        setError("Select at least one platform to post to.");
        setSaving(false);
        return;
      }
      if (platformGmb && selectedLocations.length === 0) {
        setError("Select at least one Google Business location when Google is enabled.");
        setSaving(false);
        return;
      }
      if (platformFb && selectedFbPages.length === 0) {
        setError("Select at least one Facebook page when Facebook is enabled.");
        setSaving(false);
        return;
      }
      if (platformIg && selectedIgPages.length === 0) {
        setError("Select at least one Instagram account when Instagram is enabled.");
        setSaving(false);
        return;
      }
    }

    // Client-side validation
    // if (automationEnabled) {
    //   if (selectedLocations.length === 0) {
    //     setError("Step 1: Please select at least one business location to post to.");
    //     setSaving(false); return;
    //   }
    //   if (effectivePlanLimit > 0 && selectedKeywords.length < effectivePlanLimit) {
    //     setError(`Step 6: You need at least ${effectivePlanLimit} keywords (your plan has ${effectivePlanLimit} posts). Currently selected: ${selectedKeywords.length}.`);
    //     setSaving(false); return;
    //   }
    // }

    try {
      const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;

      const res = await fetch("/api/user-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          automationEnabled,
          frequency,
          accessToken: session?.accessToken || null,
          refreshToken: session?.refreshToken || null,
          startDate,
          endDate: endDate || null,
          skippedDates,
          customDates: frequency === "custom" ? customDates : [],
          keywords: selectedKeywords,
          platforms: platformsPayload.length ? platformsPayload : ["gmb"],
          postingHour,
          postingMinute,
          postingTimezone: "Asia/Kolkata",
          // FB pages selected for automation (full objects for token lookup)
          fbPages: facebookPages
            .filter(p => selectedFbPages.includes(p.pageId))
            .map(p => ({ pageId: p.pageId, pageName: p.pageName, pageAccessToken: p.pageAccessToken })),
          // IG accounts selected for automation
          igPages: instagramPages
            .filter(a => selectedIgPages.includes(a.igId))
            .map(a => ({ igId: a.igId, igUsername: a.igUsername, pageAccessToken: a.pageAccessToken })),
          selectedBusiness,
          selectedLocations,
          userId,
          topic: userData?.topic || "",
          colourPalette: pickFirstNonEmpty(userData?.colourPalette, savedImageConfig?.colourPalette, row?.colourPalette) || "none",
          size: "3:4",
          characterImage: pickImg("characterImage"),
          uniformImage: pickImg("uniformImage"),
          productImage: pickImg("productImage"),
          backgroundImage: pickImg("backgroundImage"),
          logoImage: pickImg("logoImage"),
          includeInGeneration: assetInclude,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Save failed");
      }

      if (data.plan) {
        setUserData(prev => ({ ...prev, ...data.plan }));
      }
      if (typeof data.keywordsRequired === "number") {
        setPlanLimit(data.keywordsRequired);
      }

      // Show success modal with summary
      setSavedSummary({
        locations: selectedLocations,
        keywords: selectedKeywords,
        schedule,
        frequency,
        startDate,
        endDate,
        businessName: data.businessName || selectedBusiness?.name || "",
      });
      setSaveStatus("success");
      setShowModal(true);
      setSavedKeywords(selectedKeywords);
      setShowForm(false); // collapse to read-only status view after a successful save
    } catch (e) {
      setSaveStatus("error");
      setError(e.message || "Save failed");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus(null), 3500);
    }
  };

  const handlePasskeySubmit = (e) => {
    e.preventDefault();
    if (passkeyInput.trim() === USER_SETTINGS_PASSKEY) {
      setPasskeyVerified(true);
      setPasskeyError("");
      return;
    }
    setPasskeyError("Invalid passkey. If you don't have a passkey, contact our Expert Team.");
  };

  // ── Styles ─────────────────────────────────────────────────────────────────

  const S = {
    page: { minHeight: "100vh", background: "linear-gradient(180deg, #f4f6fb 0%, #f8f7f4 32%, #f8f7f4 100%)", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: 14, color: "#111" },
    card: { background: "#fff", border: "1px solid #e8ecf4", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 24px rgba(15,23,42,.06)" },
    wrap: { maxWidth: 960, margin: "0 auto", padding: "20px 20px 80px", display: "flex", flexDirection: "column", gap: 18 },
    label: { fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 6 },
    input: { width: "100%", padding: "9px 12px", border: "2px solid #e5e7eb", borderRadius: 12, fontSize: 14, outline: "none", fontFamily: "inherit", color: "#374151", background: "#fff", transition: "border-color .15s", boxSizing: "border-box" },
  };

  if (pageLoading) {
    return (
      <div style={{ ...S.page, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, minHeight: "100vh" }}>
        <div style={{ width: 128, height: 128 }}>
          <Lottie animationData={animationData} loop style={{ width: "100%", height: "100%" }} />
        </div>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#64748b", letterSpacing: "-0.02em" }}>Loading settings…</p>
      </div>
    );
  }

  if (!passkeyVerified) {
    return (
      <div style={{ ...S.page, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <form
          onSubmit={handlePasskeySubmit}
          style={{
            width: "100%",
            maxWidth: 420,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: 24,
            boxShadow: "0 16px 32px rgba(15,23,42,.08)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#111827" }}>Enter User Passkey</h2>
          <p style={{ margin: 0, fontSize: 13, color: "#6b7280", lineHeight: 1.45 }}>
            User settings are protected. Enter your passkey to continue.
          </p>
          <input
            type="password"
            value={passkeyInput}
            onChange={(e) => {
              setPasskeyInput(e.target.value);
              if (passkeyError) setPasskeyError("");
            }}
            placeholder="Enter passkey"
            style={S.input}
            autoFocus
          />
          {passkeyError && (
            <div style={{ fontSize: 12, color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "8px 10px" }}>
              {passkeyError}
            </div>
          )}
          <div style={{ fontSize: 12, color: "#64748b" }}>
            If you do not have a user passkey, contact our Expert Team.
          </div>
          <button
            type="submit"
            style={{
              border: "none",
              borderRadius: 10,
              background: "#111827",
              color: "#fff",
              padding: "10px 14px",
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Open User Settings
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-thumb{background:#e5e7eb;border-radius:4px}
        input[type=date]::-webkit-calendar-picker-indicator{cursor:pointer;opacity:.6}
        .us-meta-fb-chip{transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease,background .2s ease;}
        .us-meta-fb-chip:hover{transform:translateY(-2px);box-shadow:0 8px 22px rgba(37,99,235,.14);}
        .us-meta-ig-chip{transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease,background .2s ease;}
        .us-meta-ig-chip:hover{transform:translateY(-2px);box-shadow:0 8px 22px rgba(219,39,119,.14);}
        .us-meta-select{transition:border-color .2s ease, box-shadow .2s ease;}
        .us-meta-select:focus{outline:none;border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.2);}
        .us-meta-select-ig:focus{outline:none;border-color:#ec4899;box-shadow:0 0 0 3px rgba(236,72,153,.2);}
      `}</style>

      {saving && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            background: "rgba(255,255,255,.78)",
            backdropFilter: "blur(6px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          }}
        >
          <div style={{ width: 100, height: 100 }}>
            <Lottie animationData={animationData} loop style={{ width: "100%", height: "100%" }} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 600, color: "#475569" }}>Saving settings…</span>
        </div>
      )}

      {/* ── Success Modal ── */}
      {showModal && <SuccessModal summary={savedSummary} onClose={() => setShowModal(false)} />}

      {assetPreview && (
        <div
          role="presentation"
          style={{
            position: "fixed", inset: 0, zIndex: 80, background: "rgba(15,23,42,.72)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
            backdropFilter: "blur(6px)",
          }}
          onClick={() => setAssetPreview(null)}
        >
          <div
            role="dialog"
            aria-label="Image preview"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "min(520px, 92vw)", maxHeight: "90vh", background: "#fff",
              borderRadius: 16, overflow: "hidden", boxShadow: "0 25px 50px rgba(0,0,0,.35)",
              display: "flex", flexDirection: "column",
            }}
          >
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>{assetPreview.label}</span>
              <button
                type="button"
                onClick={() => setAssetPreview(null)}
                style={{ border: "none", background: "#f3f4f6", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}
              >
                Close
              </button>
            </div>
            <div style={{ padding: 12, overflow: "auto", maxHeight: "calc(90vh - 56px)" }}>
              <img
                src={assetPreview.src}
                alt=""
                style={{ width: "100%", height: "auto", maxHeight: "70vh", objectFit: "contain", borderRadius: 10, display: "block", background: "#f9fafb" }}
              />
              <p style={{ fontSize: 12, color: "#6b7280", margin: "10px 0 0", textAlign: "center" }}>3:4 preview area — image may be cropped in final post</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Sticky header ── */}
      <div style={{ position: "sticky", top: 0, zIndex: 30, background: "rgba(255,255,255,.88)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e5e7eb", boxShadow: "0 4px 20px rgba(15,23,42,.06)" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <BackButton onClick={onNavigateBack || (() => window.history.back?.())} />
            <span style={{ color: "#e5e7eb" }}>|</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>{displayName}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{userData?.email || "Google Business Profile"}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, fontWeight: 500 }}>Set up once — saved settings load automatically when you return.</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              onClick={() => router.push("/user-settings/optimization")}
              style={{
                fontSize: 13,
                fontWeight: 700,
                padding: "8px 16px",
                borderRadius: 12,
                border: "1px solid #c7d2fe",
                background: "#eef2ff",
                color: "#4338ca",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Optimization
            </button>
            {saveStatus === "success" && <span style={{ fontSize: 12, background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0", padding: "4px 12px", borderRadius: 20, fontWeight: 600 }}>✓ Saved</span>}
            {saveStatus === "error" && <span style={{ fontSize: 12, background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", padding: "4px 12px", borderRadius: 20, fontWeight: 600 }}>✗ Failed</span>}
            <button onClick={handleSave} disabled={saving || !planLive}
              style={{ display: "flex", alignItems: "center", gap: 8, background: saving || !planLive ? "#d1d5db" : "#111", color: "#fff", border: "none", padding: "8px 20px", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: saving || !planLive ? "not-allowed" : "pointer" }}>
              {saving ? <><span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,.4)", borderTopColor: "#fff", animation: "spin .7s linear infinite", display: "block" }} />Saving…</> : "Save settings"}
            </button>
          </div>
        </div>
      </div>

      <div style={S.wrap}>

        {/* Error banner */}
        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "12px 16px", fontSize: 13, color: "#991b1b", fontWeight: 500 }}>
            {error}
          </div>  
        )}

        {/* ── Plan Card ── */}
        <div style={S.card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #f3f4f6" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📦</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>Current Plan</div>
                <div style={{ fontSize: 12, color: "#9ca3af", textTransform: "capitalize" }}>{userData?.planDuration || "—"} billing</div>
              </div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: hasPlan ? (planLive ? "#f0fdf4" : "#fef2f2") : "#f3f4f6", color: hasPlan ? (planLive ? "#15803d" : "#b91c1c") : "#6b7280", border: `1px solid ${hasPlan ? (planLive ? "#bbf7d0" : "#fecaca") : "#e5e7eb"}` }}>
              {hasPlan ? (planLive ? `Active · ${days}d left` : "Expired") : "No Plan"}
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, padding: 20 }}>
            <StatCard label="Package" value={userData?.paidPackage || "—"} accent="#d97706" />
            <StatCard label="Service" value={userData?.paidService || "—"} />
            <StatCard label="Start Date" value={fmtDate(pkgStart)} />
            <StatCard label="Expiry" value={fmtDate(pkgExpiry)} accent={planLive ? "#1f2937" : "#dc2626"} />
          </div>

          <div style={{ margin: "0 20px 20px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 14, padding: "14px 18px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 18 }}>📬</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#d97706" }}>{totalPosts} posts</span>
                  <span style={{ fontSize: 13, color: "#92400e" }}>in {userData?.paidPackage || "your plan"}</span>
                </div>
                {planDetail && (
                  <div style={{ fontSize: 12, color: "#b45309", paddingLeft: 26 }}>
                    {userData?.planDuration} · ₹{planDetail.totalAmount}/{planDetail.duration}
                    {planDetail.save > 0 && <span style={{ marginLeft: 8, background: "#dcfce7", color: "#15803d", padding: "1px 7px", borderRadius: 8, fontSize: 11, fontWeight: 700 }}>Save ₹{planDetail.save}</span>}
                    {citations > 0 && <span style={{ marginLeft: 8, color: "#7c3aed", fontWeight: 600 }}>· {citations} citations</span>}
                  </div>
                )}
              </div>
              <div style={{ textAlign: "right", fontSize: 12 }}>
                <div style={{ color: "#92400e", fontWeight: 600 }}>{postsUsed} used</div>
                <div style={{ color: "#15803d", fontWeight: 700 }}>{postsLeft} remaining</div>
              </div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#b45309", marginBottom: 4, fontWeight: 600 }}>
                <span>Usage</span><span>{postsUsed} / {totalPosts}</span>
              </div>
              <div style={{ height: 6, background: "#fde68a", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${usagePct}%`, height: "100%", background: "linear-gradient(90deg,#f59e0b,#d97706)", borderRadius: 3, transition: "width .4s" }} />
              </div>
              <div style={{ fontSize: 11, color: "#92400e", marginTop: 8, fontWeight: 600, display: "flex", flexWrap: "wrap", gap: 10 }}>
                <span>Published (by platform):</span>
                <span style={{ color: "#1d4ed8" }}>GMB {usageByPlatform.gmb}</span>
                <span style={{ color: "#1877f2" }}>· FB {usageByPlatform.fb}</span>
                <span style={{ color: "#e1306c" }}>· IG {usageByPlatform.ig}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── AUTOMATION STATUS CARD ── */}
        {autoStatus?.enabled && (
          <div style={{ ...S.card, border: "1px solid #bbf7d0", background: "#f0fdf4" }}>
            <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 12, background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🤖</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#15803d" }}>Automation Active</div>
                  <div style={{ fontSize: 12, color: "#166534" }}>Posts are being published automatically every day</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, background: "#bbf7d0", color: "#15803d", padding: "4px 12px", borderRadius: 20 }}>
                  ✅ RUNNING
                </span>
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  style={{ fontSize: 12, fontWeight: 700, padding: "5px 14px", borderRadius: 20, border: "1px solid #86efac", background: "#fff", color: "#15803d", cursor: "pointer", fontFamily: "inherit" }}
                >
                  ✏️ Edit settings
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px,1fr))", gap: 12, padding: "0 20px 16px" }}>
              {/* Next post */}
              <div style={{ background: "#fff", border: "1px solid #bbf7d0", borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, marginBottom: 4 }}>📅 NEXT POST</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>
                  {autoStatus.nextScheduledDate
                    ? new Date(autoStatus.nextScheduledDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                    : "Today (9 AM)"}
                </div>
              </div>

              {/* Today */}
              <div style={{ background: "#fff", border: "1px solid #bbf7d0", borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, marginBottom: 4 }}>📆 TODAY</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: (autoStatus.postedToday || 0) > 0 ? "#15803d" : "#b45309" }}>
                  {(autoStatus.postedToday || 0) > 0
                    ? `${autoStatus.postedToday} posted ✅`
                    : "Not yet today ⏳"}
                </div>
              </div>

              {/* Last post */}
              <div style={{ background: "#fff", border: "1px solid #bbf7d0", borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, marginBottom: 4 }}>✅ LAST POST</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>
                  {autoStatus.lastPostDate
                    ? new Date(autoStatus.lastPostDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                    : "Not yet"}
                </div>
              </div>

              {/* Posts done */}
              <div style={{ background: "#fff", border: "1px solid #bbf7d0", borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, marginBottom: 4 }}>📊 PUBLISHED</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>
                  {autoStatus.postsUsed} <span style={{ color: "#9ca3af", fontWeight: 400 }}>/ {totalPosts}</span>
                </div>
                <div style={{ fontSize: 10, color: "#6b7280", marginTop: 4, fontWeight: 600 }}>
                  GMB {usageByPlatform.gmb} · FB {usageByPlatform.fb} · IG {usageByPlatform.ig}
                </div>
                <div style={{ marginTop: 6, height: 4, background: "#dcfce7", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: `${totalPosts > 0 ? Math.min(100, (autoStatus.postsUsed / totalPosts) * 100) : 0}%`, height: "100%", background: "#22c55e", borderRadius: 2, transition: "width .4s" }} />
                </div>
              </div>

              {/* Remaining */}
              <div style={{ background: "#fff", border: "1px solid #bbf7d0", borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, marginBottom: 4 }}>🔢 REMAINING</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>
                  {autoStatus.remaining} posts
                </div>
              </div>

              {/* Frequency */}
              <div style={{ background: "#fff", border: "1px solid #bbf7d0", borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, marginBottom: 4 }}>🔄 FREQUENCY</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", textTransform: "capitalize" }}>
                  {autoStatus.frequency === "alternate" ? "Every 2 days" : autoStatus.frequency || "Daily"}
                </div>
              </div>

              {/* Keywords progress — used / pending per keyword */}
              <div style={{ background: "#fff", border: "1px solid #bbf7d0", borderRadius: 12, padding: "12px 14px", gridColumn: "1 / -1" }}>
                <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, marginBottom: 6 }}>
                  🔑 KEYWORDS <span style={{ color: "#9ca3af", fontWeight: 400 }}>— {autoStatus.postIndex} / {autoStatus.totalKeywords} used</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {(savedKeywords.length ? savedKeywords : selectedKeywords).map((kw, i) => {
                    const used = i < (autoStatus.postIndex || 0);
                    return (
                      <span key={`${kw}-${i}`} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 16, border: `1px solid ${used ? "#bbf7d0" : "#e5e7eb"}`, background: used ? "#f0fdf4" : "#f9fafb", color: used ? "#15803d" : "#6b7280" }}>
                        {kw}
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10, background: used ? "#22c55e" : "#e5e7eb", color: used ? "#fff" : "#6b7280" }}>
                          {used ? "used" : "pending"}
                        </span>
                      </span>
                    );
                  })}
                  {!(savedKeywords.length || selectedKeywords.length) && (
                    <span style={{ fontSize: 12, color: "#9ca3af" }}>No keywords</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings form — collapsed after save; the ✏️ Edit button re-opens it. */}
        <div style={{ display: showForm ? "flex" : "none", flexDirection: "column", gap: 18 }}>
        {/* ── Step 1: Platforms & publish time (before enabling automation) ── */}
        <div style={{ border: "1px solid #e8ecf4", borderRadius: 16, padding: "18px 18px 20px", background: "linear-gradient(145deg,#ffffff 0%,#f8fafc 100%)", boxShadow: "0 4px 20px rgba(15,23,42,.04)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>Step 1</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>Post to platforms</div>
              <p style={{ fontSize: 12, color: "#64748b", margin: "8px 0 0", maxWidth: 560, lineHeight: 1.55 }}>
                Choose where automation should publish. Turn on each channel, then pick pages or accounts. One save stores your plan: remaining posts follow your frequency and start/end dates. The system prepares the image about 24 hours before your publish time, then publishes at the hour and minute you set (IST).
              </p>
            </div>
            <button
              type="button"
              disabled={metaSyncing}
              onClick={() => refreshSocialPages()}
              style={{
                fontSize: 12,
                padding: "8px 14px",
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                background: metaSyncing ? "#f1f5f9" : "#fff",
                color: "#475569",
                cursor: metaSyncing ? "wait" : "pointer",
                fontWeight: 700,
                fontFamily: "inherit",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                gap: 8,
                opacity: metaSyncing ? 0.9 : 1,
              }}
            >
              {metaSyncing ? (
                <>
                  <span style={{ width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Lottie animationData={animationData} loop style={{ width: 22, height: 22 }} />
                  </span>
                  Syncing…
                </>
              ) : (
                "↻ Sync Meta pages"
              )}
            </button>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", padding: "14px 16px", background: "#fff", borderRadius: 14, marginBottom: 16, border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>Publish time (IST)</span>
            <select
              value={postingHour}
              onChange={(e) => setPostingHour(Number(e.target.value))}
              style={{ ...S.input, width: "auto", minWidth: 140, borderRadius: 10 }}
              aria-label="Publish hour"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>{String(i).padStart(2, "0")}</option>
              ))}
            </select>
            <span style={{ fontSize: 13, color: "#64748b" }}>:</span>
            <select
              value={postingMinute}
              onChange={(e) => setPostingMinute(Number(e.target.value))}
              style={{ ...S.input, width: "auto", minWidth: 72, borderRadius: 10 }}
              aria-label="Publish minute"
            >
              {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
              ))}
            </select>
            <span style={{ fontSize: 11, color: "#64748b", maxWidth: 320, lineHeight: 1.4 }}>
              Automation runs about every 10 minutes around this time. Image generation for the next post happens ~24 hours earlier.
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: platformGmb ? 12 : 16 }}>
            <div style={{ border: platformGmb ? "2px solid #4285f4" : "2px solid #e2e8f0", borderRadius: 14, padding: "14px 16px", background: platformGmb ? "#f0f4ff" : "#fff", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 22 }}>
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg"
                  alt="Google"
                  style={{ width: 22, height: 22 }}
                />
              </span>              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#1d4ed8" }}>Google Business</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>Maps &amp; Search posts</div>
              </div>
              <Toggle checked={platformGmb} onChange={setPlatformGmb} />
            </div>
            <div style={{ border: platformFb ? "2px solid #1877f2" : "2px solid #e2e8f0", borderRadius: 14, padding: "14px 16px", background: platformFb ? "#eff6ff" : "#fff", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 22 }}>
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg"
                  alt="Facebook"
                  style={{ width: 22, height: 22 }}
                />
              </span>              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#1877f2" }}>Facebook</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>Pages you manage</div>
              </div>
              <Toggle checked={platformFb} onChange={setPlatformFb} />
            </div>
            <div style={{ border: platformIg ? "2px solid #e1306c" : "2px solid #e2e8f0", borderRadius: 14, padding: "14px 16px", background: platformIg ? "#fdf2f8" : "#fff", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 22 }}>
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png"
                  alt="Instagram"
                  style={{ width: 22, height: 22 }}
                />
              </span>              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#db2777" }}>Instagram</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>Business / creator accounts</div>
              </div>
              <Toggle checked={platformIg} onChange={setPlatformIg} />
            </div>
          </div>

          {platformGmb && (
            <div
              style={{
                marginBottom: 16,
                background: "#fff",
                borderRadius: 14,
                border: "1px solid #bfdbfe",
                overflow: "hidden",
                boxShadow: "0 2px 14px rgba(37,99,235,.07)",
              }}
            >
              <button
                type="button"
                onClick={() => setGmbLocationsExpanded((v) => !v)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "14px 16px",
                  border: "none",
                  background: "linear-gradient(135deg, #eff6ff 0%, #ffffff 55%)",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "left",
                  transition: "background .2s ease",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#1d4ed8" }}>Google Business — select locations</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 4, lineHeight: 1.4 }}>
                    {gmbLocations.length > 0
                      ? `${selectedLocations.length} of ${gmbLocations.length} selected · ${gmbLocationsExpanded ? "Tap to hide" : "Tap to expand"}`
                      : "No locations loaded · tap to expand"}
                  </div>
                </div>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  style={{
                    flexShrink: 0,
                    transform: gmbLocationsExpanded ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                >
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div
                style={{
                  maxHeight: gmbLocationsExpanded ? 6000 : 0,
                  opacity: gmbLocationsExpanded ? 1 : 0,
                  overflow: "hidden",
                  transition: "max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease",
                }}
              >
                <div style={{ padding: "0 16px 16px" }}>
                  {gmbLocations.length > 0 ? (
                    <>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                        <p style={{ fontSize: 13, color: "#374151", fontWeight: 600, margin: 0 }}>
                          Choose which locations receive automated posts:
                        </p>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedLocations(
                                gmbLocations.map((loc) => ({
                                  locationId: loc.locationId || "",
                                  accountId: loc.accountId || "",
                                  name: loc.title || loc.name || "",
                                  address: loc.address || "",
                                  locality: loc.locality || "",
                                  websiteUrl: loc.websiteUrl || "",
                                  isVerified: loc.isVerified || false,
                                }))
                              )
                            }
                            style={{
                              fontSize: 11,
                              color: "#059669",
                              background: "#f0fdf4",
                              border: "1px solid #bbf7d0",
                              borderRadius: 6,
                              padding: "4px 10px",
                              cursor: "pointer",
                              fontWeight: 600,
                              fontFamily: "inherit",
                            }}
                          >
                            All
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedLocations([])}
                            style={{
                              fontSize: 11,
                              color: "#6b7280",
                              background: "#f9fafb",
                              border: "1px solid #e5e7eb",
                              borderRadius: 6,
                              padding: "4px 10px",
                              cursor: "pointer",
                              fontWeight: 600,
                              fontFamily: "inherit",
                            }}
                          >
                            None
                          </button>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {gmbLocations.map((loc, i) => {
                          const locId = loc.locationId || "";
                          const isChecked = selectedLocations.some((l) => l.locationId === locId);
                          const toggle = () => {
                            if (isChecked) {
                              setSelectedLocations((prev) => prev.filter((l) => l.locationId !== locId));
                            } else {
                              setSelectedLocations((prev) => [
                                ...prev,
                                {
                                  locationId: locId,
                                  accountId: loc.accountId || "",
                                  name: loc.title || loc.name || "",
                                  address: loc.address || "",
                                  locality: loc.locality || "",
                                  websiteUrl: loc.websiteUrl || "",
                                  isVerified: loc.isVerified || false,
                                },
                              ]);
                            }
                          };
                          return (
                            <div
                              key={i}
                              onClick={toggle}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                padding: "12px 14px",
                                border: isChecked ? "2px solid #f59e0b" : "1.5px solid #e5e7eb",
                                borderRadius: 12,
                                cursor: "pointer",
                                background: isChecked ? "#fffbeb" : "#fff",
                                transition: "all .15s",
                              }}
                            >
                              <div
                                style={{
                                  width: 20,
                                  height: 20,
                                  borderRadius: 6,
                                  flexShrink: 0,
                                  border: isChecked ? "2px solid #f59e0b" : "2px solid #d1d5db",
                                  background: isChecked ? "#f59e0b" : "#fff",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                {isChecked && (
                                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                    <polyline
                                      points="2,6 5,9 10,3"
                                      stroke="#fff"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                )}
                              </div>
                              <span style={{ fontSize: 18 }}>📍</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: "#111",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {loc.title || loc.name || "Unnamed Location"}
                                </div>
                                <div style={{ fontSize: 12, color: "#6b7280" }}>
                                  {[loc.address, loc.locality].filter(Boolean).join(", ") || loc.locationId}
                                </div>
                              </div>
                              {isChecked && (
                                <span
                                  style={{
                                    fontSize: 11,
                                    background: "#fef3c7",
                                    color: "#92400e",
                                    borderRadius: 6,
                                    padding: "2px 8px",
                                    fontWeight: 700,
                                    flexShrink: 0,
                                  }}
                                >
                                  Will post
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div
                      style={{
                        background: "#fffbeb",
                        border: "1px solid #fde68a",
                        borderRadius: 12,
                        padding: "14px 16px",
                        fontSize: 13,
                        color: "#92400e",
                      }}
                    >
                      No GMB locations found. Connect Google Business from the dashboard, then reload this page.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {platformFb && (
            <div
              style={{
                marginBottom: platformIg ? 18 : 0,
                borderRadius: 16,
                padding: 16,
                background: "linear-gradient(160deg, rgba(239,246,255,.92) 0%, #ffffff 50%, #fafbff 100%)",
                border: "1px solid rgba(59,130,246,.22)",
                boxShadow: "0 4px 24px rgba(37,99,235,.06)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "linear-gradient(135deg,#1877f2,#3b82f6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    boxShadow: "0 4px 12px rgba(24,119,242,.35)",
                  }}
                >
                  📘
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#1e40af", letterSpacing: "-0.02em" }}>Facebook pages</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Pick where automated posts should publish</div>
                </div>
              </div>
              {facebookPages.length > 0 ? (
                facebookPages.length > 1 ? (
                  <div
                    style={{
                      borderRadius: 14,
                      padding: 14,
                      background: "rgba(255,255,255,.85)",
                      border: "1px solid rgba(147,197,253,.65)",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    <select
                      className="us-meta-select"
                      multiple
                      size={Math.min(facebookPages.length, 6)}
                      value={selectedFbPages}
                      onChange={(e) => setSelectedFbPages([...e.target.selectedOptions].map((o) => o.value))}
                      style={{
                        width: "100%",
                        borderRadius: 12,
                        padding: 10,
                        border: "1px solid #bfdbfe",
                        fontSize: 13,
                        fontFamily: "inherit",
                        background: "#f8fafc",
                        lineHeight: 1.5,
                      }}
                    >
                      {facebookPages.map((page) => (
                        <option key={page.pageId} value={page.pageId}>{page.pageName || page.pageId}</option>
                      ))}
                    </select>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 8, fontWeight: 500 }}>Hold Ctrl / ⌘ and click to select multiple pages.</div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {facebookPages.map((page) => {
                      const selected = selectedFbPages.includes(page.pageId);
                      return (
                        <button
                          key={page.pageId}
                          type="button"
                          className="us-meta-fb-chip"
                          onClick={() => {
                            if (selected) setSelectedFbPages((p) => p.filter((id) => id !== page.pageId));
                            else setSelectedFbPages((p) => [...p, page.pageId]);
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            border: selected ? "2px solid #2563eb" : "1px solid #e2e8f0",
                            borderRadius: 14,
                            padding: "12px 18px",
                            cursor: "pointer",
                            background: selected ? "linear-gradient(135deg,#dbeafe,#eff6ff)" : "#fff",
                            fontFamily: "inherit",
                            textAlign: "left",
                            boxShadow: selected ? "0 6px 20px rgba(37,99,235,.18)" : "0 1px 3px rgba(15,23,42,.06)",
                          }}
                        >
                          <span style={{ fontSize: 20 }}>📘</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: selected ? "#1d4ed8" : "#334155" }}>{page.pageName}</span>
                        </button>
                      );
                    })}
                  </div>
                )
              ) : (
                <div
                  style={{
                    fontSize: 13,
                    color: "#64748b",
                    padding: "16px 18px",
                    border: "1px dashed rgba(59,130,246,.45)",
                    borderRadius: 14,
                    background: "rgba(255,255,255,.6)",
                    lineHeight: 1.5,
                  }}
                >
                  No Facebook pages linked.{" "}
                  <button type="button" onClick={() => router.push("/dashboard")} style={{ fontWeight: 700, color: "#2563eb", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textDecoration: "underline", textUnderlineOffset: 3 }}>
                    Connect on dashboard
                  </button>
                </div>
              )}
            </div>
          )}

          {platformIg && (
            <div
              style={{
                borderRadius: 16,
                padding: 16,
                background: "linear-gradient(160deg, rgba(253,242,248,.95) 0%, #ffffff 50%, #fffafc 100%)",
                border: "1px solid rgba(244,114,182,.28)",
                boxShadow: "0 4px 24px rgba(219,39,119,.07)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "linear-gradient(135deg,#e1306c,#ec4899)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    boxShadow: "0 4px 12px rgba(225,48,108,.35)",
                  }}
                >
                  📸
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#9d174d", letterSpacing: "-0.02em" }}>Instagram accounts</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Business or creator profiles you manage</div>
                </div>
              </div>
              {instagramPages.length > 0 ? (
                instagramPages.length > 1 ? (
                  <div
                    style={{
                      borderRadius: 14,
                      padding: 14,
                      background: "rgba(255,255,255,.85)",
                      border: "1px solid rgba(249,168,212,.65)",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    <select
                      className="us-meta-select-ig"
                      multiple
                      size={Math.min(instagramPages.length, 6)}
                      value={selectedIgPages}
                      onChange={(e) => setSelectedIgPages([...e.target.selectedOptions].map((o) => o.value))}
                      style={{
                        width: "100%",
                        borderRadius: 12,
                        padding: 10,
                        border: "1px solid #fbcfe8",
                        fontSize: 13,
                        fontFamily: "inherit",
                        background: "#fdf2f8",
                        lineHeight: 1.5,
                      }}
                    >
                      {instagramPages.map((acc) => (
                        <option key={acc.igId} value={acc.igId}>@{acc.igUsername || acc.igId}</option>
                      ))}
                    </select>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 8, fontWeight: 500 }}>Hold Ctrl / ⌘ and click to select multiple accounts.</div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {instagramPages.map((acc) => {
                      const selected = selectedIgPages.includes(acc.igId);
                      return (
                        <button
                          key={acc.igId}
                          type="button"
                          className="us-meta-ig-chip"
                          onClick={() => {
                            if (selected) setSelectedIgPages((p) => p.filter((id) => id !== acc.igId));
                            else setSelectedIgPages((p) => [...p, acc.igId]);
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            border: selected ? "2px solid #db2777" : "1px solid #e2e8f0",
                            borderRadius: 14,
                            padding: "12px 18px",
                            cursor: "pointer",
                            background: selected ? "linear-gradient(135deg,#fce7f3,#fdf2f8)" : "#fff",
                            fontFamily: "inherit",
                            textAlign: "left",
                            boxShadow: selected ? "0 6px 20px rgba(219,39,119,.2)" : "0 1px 3px rgba(15,23,42,.06)",
                          }}
                        >
                          <span style={{ fontSize: 20 }}>📸</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: selected ? "#be185d" : "#334155" }}>@{acc.igUsername}</span>
                        </button>
                      );
                    })}
                  </div>
                )
              ) : (
                <div
                  style={{
                    fontSize: 13,
                    color: "#64748b",
                    padding: "16px 18px",
                    border: "1px dashed rgba(236,72,153,.45)",
                    borderRadius: 14,
                    background: "rgba(255,255,255,.6)",
                    lineHeight: 1.5,
                  }}
                >
                  No Instagram accounts linked.{" "}
                  <button type="button" onClick={() => router.push("/dashboard")} style={{ fontWeight: 700, color: "#db2777", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textDecoration: "underline", textUnderlineOffset: 3 }}>
                    Connect on dashboard
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Automation Toggle ── */}
        <div style={S.card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, background: "#111", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🤖</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>Post Automation</div>
                <div style={{ fontSize: 12, color: "#9ca3af" }}>AI images &amp; copy on your schedule — Google, Facebook, and/or Instagram</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: automationEnabled ? "#f59e0b" : "#9ca3af" }}>
                {automationEnabled ? "Enabled" : "Disabled"}
              </span>
              <Toggle checked={automationEnabled} onChange={setAutomationEnabled} disabled={!canEnableAutomation} />
            </div>
          </div>

          {!planLive && hasPlan && <div style={{ margin: "0 20px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "10px 14px", fontSize: 13, color: "#b91c1c", fontWeight: 500 }}>⚠️ Your plan has expired. Renew to enable automation.</div>}
          {!hasPlan && !pageLoading && <div style={{ margin: "0 20px 16px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "10px 14px", fontSize: 13, color: "#92400e", fontWeight: 500 }}>No paid plan found. Purchase a plan to enable automation.</div>}
          {planLive && !canEnableAutomation && (
            <div style={{ margin: "0 20px 16px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "10px 14px", fontSize: 13, color: "#92400e", fontWeight: 500 }}>
              Finish Step 1 (above): turn on at least one platform and complete Google locations or Meta selections.
            </div>
          )}
        </div>

        {automationEnabled && (
          <div style={{ ...S.card, border: hasAssetImages ? "1px solid #e5e7eb" : "2px solid #fcd34d", background: hasAssetImages ? "#fff" : "#fffbeb" }}>
            <div style={{ padding: "16px 20px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 200 }}>
                <div style={{ width: 36, height: 36, borderRadius: 12, background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🖼</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>Post images (3:4)</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>Automation uses your brand assets for AI images on GMB, Facebook, and Instagram.</div>
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                {!hasAssetImages && (
                  <span style={{ fontSize: 12, color: "#b45309", fontWeight: 600 }}>No images selected yet</span>
                )}
                {hasAssetImages && <span style={{ fontSize: 12, color: "#15803d", fontWeight: 600 }}>✓ Assets ready</span>}
                <button
                  type="button"
                  onClick={() => router.push("/assets-management")}
                  style={{ fontSize: 12, fontWeight: 700, background: "#111", color: "#fff", border: "none", borderRadius: 10, padding: "8px 16px", cursor: "pointer", fontFamily: "inherit" }}
                >
                  {hasAssetImages ? "Manage assets" : "Choose assets"}
                </button>
              </div>
            </div>
            <div style={{ padding: "12px 20px 16px", borderTop: "1px solid #f3f4f6" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 4 }}>Preview & select for AI</div>
              <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 12 }}>Tap the image to enlarge. Use the checkbox to include or exclude each asset from generation.</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
                {ASSET_IMAGE_FIELDS.map((key) => {
                  const raw = pickFirstNonEmpty(userData?.[key], savedImageConfig?.[key], latestAssetRow?.[key]);
                  const displaySrc = toDisplayableImageSrc(raw);
                  const on = assetInclude[key] !== false;
                  return (
                    <div
                      key={key}
                      style={{
                        border: on ? "2px solid #f59e0b" : "2px solid #e5e7eb",
                        borderRadius: 12,
                        padding: 10,
                        background: on ? "#fffbeb" : "#f9fafb",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#374151" }}>{ASSET_LABELS[key]}</div>
                      <button
                        type="button"
                        onClick={() => displaySrc && setAssetPreview({ label: ASSET_LABELS[key], src: displaySrc })}
                        disabled={!displaySrc}
                        title={displaySrc ? "View full size" : ""}
                        style={{
                          padding: 0, border: "none", borderRadius: 8, cursor: displaySrc ? "zoom-in" : "default",
                          background: "transparent", width: "100%", fontFamily: "inherit", lineHeight: 0,
                          opacity: displaySrc ? 1 : 0.85,
                        }}
                      >
                        <AssetThumb src={displaySrc} alt={ASSET_LABELS[key]} />
                      </button>
                      <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, color: on ? "#b45309" : "#6b7280", userSelect: "none" }}>
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => setAssetInclude((p) => ({ ...p, [key]: !on }))}
                          style={{ width: 16, height: 16, accentColor: "#f59e0b", cursor: "pointer" }}
                        />
                        {on ? "Included in AI" : "Excluded"}
                      </label>
                      {raw && !displaySrc && (
                        <div style={{ fontSize: 10, color: "#d97706" }}>Saved — preview not supported for this format</div>
                      )}
                      {!raw && (
                        <div style={{ fontSize: 10, color: "#9ca3af", lineHeight: 1.35 }}>Empty — upload in Asset Management</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            {!hasAssetImages && (
              <div style={{ padding: "0 20px 16px", fontSize: 12, color: "#92400e" }}>
                Turn on at least one slot that has an image, or upload assets in Asset Management, before saving automation.
              </div>
            )}
          </div>
        )}

        {/* ── Steps 2–6 (shown only when automation is enabled) ── */}
        {automationEnabled && (
          <>
            {/* ── Steps 2–5: Scheduling Config ── */}
            <div style={S.card}>
              <div style={{ padding: "16px 20px 20px", display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
                  <StepBadge n={2} label="Posting Frequency" done={true} />
                  <StepBadge n={3} label="Start Date" done={!!startDate} />
                  <StepBadge n={4} label="End Date (optional)" done={true} />
                  <StepBadge n={5} label="Skip Dates (optional)" done={true} />
                </div>

                {/* Step 2: Frequency */}
                <div>
                  <div style={S.label}>Step 2 — Posting Frequency</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {getValidFrequencies(userData?.paidPackage).map(o => {
                      const isSelected = frequency === o.v;
                      const isRecommended = getRecommendedFrequency(userData?.paidPackage) === o.v;
                      return (
                        <button key={o.v}
                          onClick={() => !o.disabled && setFrequency(o.v)}
                          title={o.disabled ? `Not suitable for your plan (needs ≥ ${o.approxPerMonth || 0} posts/month but your plan requires more)` : ""}
                          style={{
                            display: "flex", flexDirection: "column", gap: 2,
                            border: isSelected ? "2px solid #f59e0b" : o.disabled ? "2px dashed #e5e7eb" : "2px solid #e5e7eb",
                            borderRadius: 12, padding: "10px 18px",
                            cursor: o.disabled ? "not-allowed" : "pointer",
                            background: isSelected ? "#fffbeb" : o.disabled ? "#f9fafb" : "#fff",
                            opacity: o.disabled ? 0.5 : 1,
                            transition: "all .15s", minWidth: 120, textAlign: "left", fontFamily: "inherit",
                            position: "relative",
                          }}>
                          {isRecommended && !o.disabled && (
                            <span style={{ position: "absolute", top: -8, right: 8, fontSize: 10, fontWeight: 700, background: "#d97706", color: "#fff", padding: "1px 7px", borderRadius: 8 }}>Recommended</span>
                          )}
                          <span style={{ fontSize: 14, fontWeight: 700, color: isSelected ? "#d97706" : o.disabled ? "#9ca3af" : "#374151" }}>{o.l}</span>
                          <span style={{ fontSize: 12, color: o.disabled ? "#d1d5db" : "#9ca3af" }}>
                            {o.disabled ? "⚠ Not enough for your plan" : o.s}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom dates picker */}
                  {frequency === "custom" && (
                    <div style={{ marginTop: 14, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 16, padding: "16px 18px" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#92400e", marginBottom: 10 }}>
                        📅 Add custom posting dates ({customDates.length} added)
                      </div>
                      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                        <input type="date" value={customDateInput}
                          min={toInputDate(new Date())}
                          max={pkgExpiry ? toInputDate(pkgExpiry) : undefined}
                          onChange={e => setCustomDateInput(e.target.value)}
                          style={{ flex: 1, ...S.input, borderColor: "#fde68a" }}
                          onFocus={e => e.currentTarget.style.borderColor = "#f59e0b"}
                          onBlur={e => e.currentTarget.style.borderColor = "#fde68a"} />
                        <button
                          onClick={() => {
                            if (customDateInput && !customDates.includes(customDateInput)) {
                              setCustomDates(prev => [...prev, customDateInput].sort());
                              setCustomDateInput("");
                            }
                          }}
                          disabled={!customDateInput || customDates.includes(customDateInput)}
                          style={{ padding: "9px 18px", background: customDateInput ? "#f59e0b" : "#e5e7eb", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: customDateInput ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
                          + Add
                        </button>
                      </div>
                      {customDates.length > 0 ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {customDates.map((d, i) => (
                            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, background: "#fff", border: "1px solid #fde68a", color: "#92400e", padding: "4px 10px", borderRadius: 20, fontWeight: 600 }}>
                              {new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              <button onClick={() => setCustomDates(prev => prev.filter(x => x !== d))}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "#fbbf24", fontSize: 12, padding: 0, lineHeight: 1 }}>✕</button>
                            </span>
                          ))}
                          <button onClick={() => setCustomDates([])} style={{ fontSize: 11, color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Clear all</button>
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: "#b45309" }}>No dates added yet. Each date = one post.</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Step 3 + 4: Start date & End date (hidden for custom frequency) */}
                {frequency !== "custom" && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <div style={S.label}>Step 3 — Start Date</div>
                    <input type="date" value={startDate}
                      min={pkgStart ? toInputDate(pkgStart) : toInputDate(new Date())}
                      max={pkgExpiry ? toInputDate(pkgExpiry) : undefined}
                      onChange={e => setStartDate(e.target.value)}
                      style={S.input}
                      onFocus={e => e.currentTarget.style.borderColor = "#f59e0b"}
                      onBlur={e => e.currentTarget.style.borderColor = "#e5e7eb"} />
                    {pkgStart && pkgExpiry && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>Plan range: {fmtDate(pkgStart)} – {fmtDate(pkgExpiry)}</div>}
                  </div>

                  <div>
                    <div style={{ ...S.label, display: "flex", alignItems: "center", gap: 6 }}>
                      Step 4 — End Date
                      <span style={{ fontSize: 10, fontWeight: 700, background: "#dbeafe", color: "#1d4ed8", padding: "1px 7px", borderRadius: 8 }}>Auto-calculated</span>
                    </div>
                    <input type="date" value={endDate}
                      min={startDate || (pkgStart ? toInputDate(pkgStart) : toInputDate(new Date()))}
                      max={pkgExpiry ? toInputDate(pkgExpiry) : undefined}
                      onChange={e => setEndDate(e.target.value)}
                      style={{ ...S.input, borderColor: "#bfdbfe" }}
                      onFocus={e => e.currentTarget.style.borderColor = "#3b82f6"}
                      onBlur={e => e.currentTarget.style.borderColor = "#bfdbfe"} />
                    <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                      Auto-set for {postsLeft} posts at {frequency === "alternate" ? "every 2 days" : frequency} pace. You can override manually.
                    </div>
                  </div>
                </div>}

                {/* Step 5: Skip dates (hidden for custom frequency) */}
                {frequency !== "custom" &&
                  <div>
                    <div style={{ ...S.label, display: "flex", alignItems: "center", gap: 8 }}>
                      Step 5 — Skip Specific Dates
                      <span style={{ fontSize: 11, fontWeight: 400, color: "#9ca3af" }}>(optional)</span>
                      <button onClick={() => setShowCalendar(p => !p)}
                        style={{ fontSize: 11, padding: "3px 10px", borderRadius: 8, border: "1px solid #e5e7eb", background: showCalendar ? "#fef3c7" : "#fff", color: showCalendar ? "#d97706" : "#6b7280", cursor: "pointer", fontWeight: 600, fontFamily: "inherit", marginLeft: 4 }}>
                        {showCalendar ? "Hide" : "Pick dates"}
                      </button>
                      {skippedDates.length > 0 && <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 600 }}>{skippedDates.length} skipped</span>}
                    </div>
                    {showCalendar && (
                      <SkipDatePicker startDate={startDate} expiryDate={endDate || pkgExpiry} skippedDates={skippedDates} onChange={setSkippedDates} />
                    )}
                  </div>}
              </div>
            </div>

            {/* ── Step 6: Keywords ── */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
                <StepBadge n={6} label="Select Keywords" done={effectivePlanLimit > 0 ? selectedKeywords.length >= effectivePlanLimit : selectedKeywords.length > 0} />
                <button onClick={fetchSavedKeywords} disabled={kwLoading}
                  style={{ fontSize: 12, color: "#6b7280", background: "none", border: "1px solid #e5e7eb", borderRadius: 8, padding: "5px 12px", cursor: kwLoading ? "wait" : "pointer", fontWeight: 600, fontFamily: "inherit" }}>
                  {kwLoading ? "Refreshing…" : "↻ Refresh keywords"}
                </button>
              </div>
              <KeywordPickerPanel
                keywords={savedKws}
                selectedKeywords={selectedKeywords}
                onChange={setSelectedKeywords}
                loading={kwLoading}
                planLimit={effectivePlanLimit}
              />
            </div>

            {/* ── Schedule Preview ── */}
            <div style={S.card}>
              <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1 }}>Schedule Preview</span>
                    {effectivePlanLimit > 0 && (
                      <span style={{ fontSize: 11, color: "#9ca3af" }}>
                        Plan: <span style={{ fontWeight: 700, color: "#f59e0b" }}>{effectivePlanLimit}</span> total posts · Frequency: <span style={{ fontWeight: 700, color: "#374151" }}>{frequency}</span>
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#6b7280" }}>
                    {schedule.length} of {postsLeft} posts
                    {skippedDates.length > 0 && <span style={{ fontSize: 11, color: "#ef4444", marginLeft: 6 }}>({skippedDates.length} skipped)</span>}
                  </span>
                </div>

                <div style={{ height: 8, background: "#f3f4f6", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${postsLeft > 0 ? Math.min(100, (schedule.length / postsLeft) * 100) : 0}%`, height: "100%", background: "#f59e0b", borderRadius: 4, transition: "width .5s" }} />
                </div>

                {/* Locations summary */}
                {selectedLocations.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#374151", alignSelf: "center" }}>Posting to:</span>
                    {selectedLocations.map((loc, i) => (
                      <span key={i} style={{ fontSize: 11, background: "#f0fdf4", color: "#065f46", border: "1px solid #bbf7d0", borderRadius: 20, padding: "3px 10px", fontWeight: 600 }}>
                        📍 {loc.name || loc.locality || loc.locationId}
                      </span>
                    ))}
                  </div>
                )}

                {schedule.length > 0 ? (
                  <div style={{ background: "rgba(254,243,199,.5)", border: "1px solid #fde68a", borderRadius: 14, padding: "14px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#92400e" }}>Upcoming Schedule</span>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {endDate && <span style={{ fontSize: 11, color: "#6b7280" }}>until {new Date(endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>}
                        <span style={{ background: "#f59e0b", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>{schedule.length} posts</span>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                      {schedule.slice(0, 8).map((d, i) => (
                        <div key={i} style={{ display: "flex", flexDirection: "column", gap: 3, background: "#fff", border: "1px solid #fde68a", borderRadius: 10, padding: "7px 10px" }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>{d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                          {selectedKeywords[i] && <span style={{ fontSize: 10, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedKeywords[i]}</span>}
                        </div>
                      ))}
                    </div>
                    {schedule.length > 8 && (
                      <p style={{ fontSize: 12, color: "#d97706", fontWeight: 600, marginTop: 8 }}>+ {schedule.length - 8} more posts scheduled…</p>
                    )}
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", padding: "10px 0" }}>Set a valid start date to preview your schedule.</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Bottom save button */}
        <div style={{ display: "flex", justifyContent: "flex-end", paddingBottom: 20 }}>
          <button onClick={handleSave} disabled={saving || !planLive}
            style={{ display: "flex", alignItems: "center", gap: 8, background: saving || !planLive ? "#d1d5db" : "#111", color: "#fff", border: "none", padding: "11px 28px", borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: saving || !planLive ? "not-allowed" : "pointer", boxShadow: saving || !planLive ? "none" : "0 2px 10px rgba(0,0,0,.15)", fontFamily: "inherit" }}>
            {saving
              ? <><span style={{ width: 15, height: 15, borderRadius: "50%", border: "2px solid rgba(255,255,255,.4)", borderTopColor: "#fff", animation: "spin .7s linear infinite", display: "block" }} />Saving…</>
              : "💾 Save automation settings"}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
