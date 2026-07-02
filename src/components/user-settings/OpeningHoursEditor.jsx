"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import toast from "react-hot-toast";
import {
  GMB_WEEKDAYS,
  dayEnumToLabel,
  formatDayLine,
  parsePeriodsToDayMap,
  dayMapToPeriods,
  clonePeriods,
} from "@/lib/gmbRegularHours";

const btnBase = {
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 700,
  borderRadius: 8,
  padding: "8px 14px",
  cursor: "pointer",
};

function EditIconSmall() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

/**
 * Google-style opening hours: one row per weekday, Edit → Save / Cancel / AI suggested.
 */
export default function OpeningHoursEditor({
  periods,
  onChange,
  aiContext = {},
  onSyncToGmb,
  syncPending = false,
  disabled = false,
}) {
  const [dayMap, setDayMap] = useState(() => parsePeriodsToDayMap(periods));
  const [editingDay, setEditingDay] = useState(null);
  const [draft, setDraft] = useState(null);
  const [aiDayPending, setAiDayPending] = useState(false);

  // Bulk "apply to all days at once" controls.
  const [bulkMode, setBulkMode] = useState("hours"); // 'closed' | 'open24' | 'hours'
  const [bulkOpen, setBulkOpen] = useState("09:00");
  const [bulkClose, setBulkClose] = useState("18:00");
  const [includeSunday, setIncludeSunday] = useState(true);
  const [bulkPending, setBulkPending] = useState(false);

  useEffect(() => {
    setDayMap(parsePeriodsToDayMap(periods));
    setEditingDay(null);
    setDraft(null);
  }, [periods]);

  const pushPeriods = useCallback(
    (nextMap) => {
      const nextPeriods = dayMapToPeriods(nextMap);
      onChange(clonePeriods(nextPeriods));
    },
    [onChange]
  );

  const computeBulkSetting = () => {
    if (bulkMode === "open24") return { mode: "open24" };
    if (bulkMode === "closed") return { mode: "closed" };
    const [oh, om] = bulkOpen.split(":").map((x) => parseInt(x, 10) || 0);
    const [ch, cm] = bulkClose.split(":").map((x) => parseInt(x, 10) || 0);
    return {
      mode: "hours",
      openH: Math.min(23, oh),
      openM: Math.min(59, om),
      closeH: Math.min(24, ch),
      closeM: Math.min(59, cm),
    };
  };

  // Apply one setting to every weekday at once. Sunday is set to Closed when the
  // "Include Sunday" toggle is off (common for shops closed on Sundays).
  const applyToAll = async (setting) => {
    const next = {};
    for (const d of GMB_WEEKDAYS) {
      next[d] = d === "SUNDAY" && !includeSunday ? { mode: "closed" } : { ...setting };
    }
    const nextPeriods = dayMapToPeriods(next);
    setBulkPending(true);
    try {
      if (typeof onSyncToGmb === "function") {
        await onSyncToGmb({ regularHours: { periods: nextPeriods } });
      } else {
        toast.success("Applied to all days in the editor — connect Google sync to push.");
      }
      setDayMap(next);
      onChange(clonePeriods(nextPeriods));
      setEditingDay(null);
      setDraft(null);
      if (typeof onSyncToGmb === "function") {
        toast.success(`Hours applied to ${includeSunday ? "all 7 days" : "Mon–Sat (Sun closed)"} on Google.`);
      }
    } catch (e) {
      toast.error(e.message || "Could not apply to all days");
    } finally {
      setBulkPending(false);
    }
  };

  const startEdit = (day) => {
    if (editingDay === day) {
      cancelEdit();
      return;
    }
    const s = { ...dayMap[day] };
    setEditingDay(day);
    setDraft({
      mode: s.mode === 'open24' ? 'open24' : s.mode === 'hours' ? 'hours' : 'closed',
      openH: s.openH ?? 9,
      openM: s.openM ?? 0,
      closeH: s.closeH ?? 17,
      closeM: s.closeM ?? 0,
    });
  };

  const cancelEdit = () => {
    setEditingDay(null);
    setDraft(null);
  };

  const saveEdit = async () => {
    if (!editingDay || !draft) return;
    const next = { ...dayMap, [editingDay]: { ...draft } };
    if (draft.mode === 'hours') {
      next[editingDay] = {
        mode: 'hours',
        openH: Number(draft.openH) || 0,
        openM: Number(draft.openM) || 0,
        closeH: Number(draft.closeH) || 0,
        closeM: Number(draft.closeM) || 0,
      };
    } else if (draft.mode === 'open24') {
      next[editingDay] = { mode: 'open24' };
    } else {
      next[editingDay] = { mode: 'closed' };
    }
    const nextPeriods = dayMapToPeriods(next);
    if (typeof onSyncToGmb === "function") {
      try {
        await onSyncToGmb({ regularHours: { periods: nextPeriods } });
      } catch (e) {
        toast.error(e.message || "Could not sync hours");
        return;
      }
    } else {
      toast.success("Hours updated in the editor — connect Google sync to push to your profile.");
    }
    setDayMap(next);
    onChange(clonePeriods(nextPeriods));
    setEditingDay(null);
    setDraft(null);
  };

  const suggestDayWithAi = async () => {
    if (!editingDay) return;
    setAiDayPending(true);
    try {
      const res = await fetch("/api/user-settings/business-optimization-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "field",
          fieldId: "singleDayHours",
          fieldLabel: `Hours for ${dayEnumToLabel(editingDay)}`,
          context: {
            ...aiContext,
            targetDay: editingDay,
            targetDayLabel: dayEnumToLabel(editingDay),
          },
          currentValue: formatDayLine(editingDay, dayMap[editingDay]),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "AI suggestion failed");
      const raw = String(data.value ?? "").trim();
      let parsed;
      try {
        parsed = JSON.parse(raw.replace(/^```(?:json)?|```$/gm, "").trim());
      } catch {
        throw new Error("AI returned invalid JSON for hours");
      }
      if (parsed.closed === true || parsed.mode === "closed") {
        setDraft({ mode: "closed", openH: 9, openM: 0, closeH: 17, closeM: 0 });
      } else if (parsed.open24 === true || parsed.mode === "open24") {
        setDraft({ mode: "open24", openH: 0, openM: 0, closeH: 24, closeM: 0 });
      } else {
        const [oh, om = "0"] = String(parsed.open || "09:00").split(":");
        const [ch, cm = "0"] = String(parsed.close || "18:00").split(":");
        setDraft({
          mode: "hours",
          openH: Math.min(23, parseInt(oh, 10) || 9),
          openM: Math.min(59, parseInt(om, 10) || 0),
          closeH: Math.min(24, parseInt(ch, 10) || 18),
          closeM: Math.min(59, parseInt(cm, 10) || 0),
        });
      }
      toast.success("AI suggestion applied to the editor — review and Save.");
    } catch (e) {
      toast.error(e.message || "AI suggestion failed");
    } finally {
      setAiDayPending(false);
    }
  };

  const rows = useMemo(
    () =>
      GMB_WEEKDAYS.map((d) => {
        const full = formatDayLine(d, dayMap[d]);
        const hoursText = full.includes(": ") ? full.split(": ").slice(1).join(": ") : full;
        return { day: d, hoursText };
      }),
    [dayMap]
  );

  return (
    <div style={{ marginBottom: 4 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          color: "#64748b",
          textTransform: "uppercase",
          letterSpacing: ".06em",
          marginBottom: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <span>Hours</span>
      </div>

      {/* ── Bulk: set all days at once ─────────────────────────────────────── */}
      <div
        style={{
          marginBottom: 16,
          padding: 16,
          borderRadius: 14,
          border: "1px solid #F1E4B8",
          background: "linear-gradient(135deg,#FFFDF5,#FEFCE8)",
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 800, color: "#713F12", marginBottom: 3 }}>
          Set all days at once
        </div>
        <div style={{ fontSize: 12.5, color: "#6b7280", marginBottom: 12 }}>
          Choose once and apply to every day — quick way to set the whole week.
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 12, alignItems: "center" }}>
          {["hours", "open24", "closed"].map((m) => (
            <label key={m} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13.5, color: "#374151", cursor: "pointer" }}>
              <input type="radio" name="bulkMode" checked={bulkMode === m} onChange={() => setBulkMode(m)} disabled={disabled} />
              {m === "hours" ? "Same time every day" : m === "open24" ? "Open 24 hours" : "Closed"}
            </label>
          ))}
        </div>

        {bulkMode === "hours" ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 12, alignItems: "center" }}>
            <label style={{ fontSize: 12.5, color: "#6b7280", display: "inline-flex", alignItems: "center", gap: 8 }}>
              Opens
              <input
                type="time"
                value={bulkOpen}
                disabled={disabled}
                onChange={(e) => setBulkOpen(e.target.value)}
                style={{ padding: 8, borderRadius: 8, border: "1.5px solid #FDE047", fontFamily: "inherit", background: "#fff" }}
              />
            </label>
            <label style={{ fontSize: 12.5, color: "#6b7280", display: "inline-flex", alignItems: "center", gap: 8 }}>
              Closes
              <input
                type="time"
                value={bulkClose}
                disabled={disabled}
                onChange={(e) => setBulkClose(e.target.value)}
                style={{ padding: 8, borderRadius: 8, border: "1.5px solid #FDE047", fontFamily: "inherit", background: "#fff" }}
              />
            </label>
          </div>
        ) : null}

        {/* Include / exclude Sunday */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Sunday</span>
          <div style={{ display: "inline-flex", background: "#fff", border: "1.5px solid #FDE047", borderRadius: 10, padding: 3, gap: 3 }}>
            {[{ v: true, l: "Include" }, { v: false, l: "Exclude (closed)" }].map((o) => {
              const active = includeSunday === o.v;
              return (
                <button
                  key={o.l}
                  type="button"
                  disabled={disabled}
                  onClick={() => setIncludeSunday(o.v)}
                  style={{
                    ...btnBase,
                    padding: "6px 14px",
                    border: "none",
                    background: active ? "#CA8A04" : "transparent",
                    color: active ? "#fff" : "#854D0E",
                  }}
                >
                  {o.l}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <button
            type="button"
            disabled={disabled || bulkPending}
            onClick={() => void applyToAll(computeBulkSetting())}
            style={{
              ...btnBase,
              padding: "10px 20px",
              fontSize: 13,
              fontWeight: 800,
              border: "none",
              background: disabled || bulkPending ? "#FEF08A" : "#CA8A04",
              color: disabled || bulkPending ? "#9ca3af" : "#fff",
              boxShadow: disabled || bulkPending ? "none" : "0 3px 12px rgba(202,138,4,.3)",
            }}
          >
            {bulkPending ? "Applying…" : "Apply to all days"}
          </button>
          <button
            type="button"
            disabled={disabled || bulkPending}
            onClick={() => void applyToAll({ mode: "open24" })}
            style={{ ...btnBase, border: "1.5px solid #FDE047", background: "#fff", color: "#854D0E" }}
          >
            All days · 24 hours
          </button>
          <span style={{ fontSize: 11.5, color: "#9ca3af" }}>Max 24 hours per day.</span>
        </div>
      </div>

      <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>
        Or edit a single day
      </div>

      <div
        style={{
          border: "1px solid #dadce0",
          borderRadius: 12,
          overflow: "hidden",
          background: "#fff",
        }}
      >
        {rows.map(({ day, hoursText }, idx) => {
          const isEditing = editingDay === day;
          return (
            <div
              key={day}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(88px, 28%) 1fr auto",
                alignItems: "center",
                gap: 10,
                padding: "14px 16px",
                borderBottom: idx < rows.length - 1 ? "1px solid #f1f3f4" : "none",
                fontSize: 14,
                color: "#202124",
                background: isEditing ? "#f8fbff" : "#fff",
              }}
            >
              <span style={{ fontWeight: 600, color: "#3c4043" }}>{dayEnumToLabel(day)}</span>
              <span style={{ color: "#5f6368", lineHeight: 1.45 }}>{hoursText}</span>
              <button
                type="button"
                disabled={disabled || syncPending}
                onClick={() => startEdit(day)}
                style={{
                  ...btnBase,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  border: isEditing ? "1px solid #CA8A04" : "1px solid #dadce0",
                  background: "#fff",
                  color: "#CA8A04",
                  flexShrink: 0,
                }}
              >
                <EditIconSmall /> Edit
              </button>
            </div>
          );
        })}
      </div>

      {editingDay && draft ? (
        <div
          style={{
            marginTop: 16,
            padding: 16,
            borderRadius: 12,
            border: "1px solid #FEFCE8",
            background: "#fafbff",
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: "#202124", marginBottom: 12 }}>
            Edit · {dayEnumToLabel(editingDay)}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 14, alignItems: "center" }}>
            {["closed", "open24", "hours"].map((m) => (
              <label
                key={m}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 13,
                  color: "#3c4043",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="dayMode"
                  checked={draft.mode === m}
                  onChange={() => setDraft((d) => ({ ...d, mode: m }))}
                />
                {m === "closed" ? "Closed" : m === "open24" ? "Open 24 hours" : "Open with hours"}
              </label>
            ))}
          </div>
          {draft.mode === "hours" ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 14, alignItems: "center" }}>
              <label style={{ fontSize: 12, color: "#5f6368" }}>
                Opens
                <input
                  type="time"
                  value={`${String(draft.openH).padStart(2, "0")}:${String(draft.openM).padStart(2, "0")}`}
                  onChange={(e) => {
                    const [h, m] = e.target.value.split(":");
                    setDraft((d) => ({ ...d, openH: parseInt(h, 10) || 0, openM: parseInt(m, 10) || 0 }));
                  }}
                  style={{ marginLeft: 8, padding: 8, borderRadius: 8, border: "1px solid #dadce0", fontFamily: "inherit" }}
                />
              </label>
              <label style={{ fontSize: 12, color: "#5f6368" }}>
                Closes
                <input
                  type="time"
                  value={`${String(Math.min(23, draft.closeH)).padStart(2, "0")}:${String(draft.closeM).padStart(2, "0")}`}
                  onChange={(e) => {
                    const [h, m] = e.target.value.split(":");
                    let ch = parseInt(h, 10) || 0;
                    const cm = parseInt(m, 10) || 0;
                    if (ch === 23 && cm > 0) ch = 23;
                    setDraft((d) => ({ ...d, closeH: ch, closeM: cm }));
                  }}
                  style={{ marginLeft: 8, padding: 8, borderRadius: 8, border: "1px solid #dadce0", fontFamily: "inherit" }}
                />
              </label>
              <span style={{ fontSize: 11, color: "#80868b" }}>Use 23:59 for end-of-day if needed.</span>
            </div>
          ) : null}

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button
              type="button"
              disabled={syncPending}
              onClick={() => void saveEdit()}
              style={{ ...btnBase, border: "none", background: "#CA8A04", color: "#fff" }}
            >
              Save
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              style={{ ...btnBase, border: "1px solid #dadce0", background: "#fff", color: "#3c4043" }}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={aiDayPending}
              onClick={() => void suggestDayWithAi()}
              style={{
                ...btnBase,
                border: "1px solid #FDE047",
                background: aiDayPending ? "#FEF9C3" : "#fff",
                color: "#854D0E",
              }}
            >
              {aiDayPending ? "AI…" : "AI suggested"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
