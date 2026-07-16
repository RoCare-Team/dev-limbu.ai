"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

// ─── helpers ────────────────────────────────────────────────────────────────
const OUTCOME = {
  success: { label: "Success", color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0", dot: "#22c55e" },
  failed: { label: "Failed", color: "#b91c1c", bg: "#fef2f2", border: "#fecaca", dot: "#ef4444" },
  skipped: { label: "Skipped", color: "#b45309", bg: "#fffbeb", border: "#fde68a", dot: "#f59e0b" },
  unknown: { label: "Unknown", color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb", dot: "#9ca3af" },
};
const STEP_ICON = { pass: "✅", success: "🎯", fail: "❌", skip: "⏭️", info: "•" };
const PHASE_LABEL = {
  publish: "Publish → GMB/FB/IG",
  "fill-queue": "Generate content",
  "publish-scheduled": "Scheduled publish",
};

function timeAgo(d) {
  if (!d) return "";
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}
function fmtTime(d) {
  try {
    return new Date(d).toLocaleString("en-IN", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return "";
  }
}

// Pull every http(s) link out of a blob of text (image URLs live inside step
// messages like `Image URL: https://…`).
const URL_RE = /https?:\/\/[^\s"'<>)]+/gi;
function extractUrls(text) {
  if (!text) return [];
  const found = String(text).match(URL_RE);
  return found ? Array.from(new Set(found)) : [];
}
const isImageUrl = (u) => /\.(png|jpe?g|webp|gif|svg|avif)(\?|$)/i.test(u) || /image|img|media|photo/i.test(u);

async function copyText(text) {
  const value = String(text ?? "");
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    // fallback for non-secure contexts / older browsers
    try {
      const ta = document.createElement("textarea");
      ta.value = value;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

// Build a clean plain-text trail for one log — paste-ready into WhatsApp / a ticket.
function buildTrail(log) {
  const L = [];
  L.push(`[${(log.outcome || "unknown").toUpperCase()}] ${PHASE_LABEL[log.phase] || log.phase || "-"}`);
  L.push(`userId: ${log.userId || "-"}`);
  if (log.postId) L.push(`postId: ${log.postId}`);
  if (log.runId) L.push(`runId: ${log.runId}`);
  L.push(`time: ${fmtTime(log.createdAt)}`);
  L.push("");
  (log.steps || []).forEach((s) => {
    let line = `${STEP_ICON[s.status] || "•"} ${s.name || ""}`;
    if (s.message) line += ` — ${s.message}`;
    L.push(line);
    if (s.error) L.push(`   ERROR: ${s.error}`);
  });
  if (log.error) { L.push(""); L.push(`Reason: ${log.error}`); }
  return L.join("\n");
}

// ─── copy button (shows ✓ Copied! for 1.2s) ──────────────────────────────────
function CopyBtn({ value, label, title, tone = "#6b7280", stopPropagation = true }) {
  const [done, setDone] = useState(false);
  if (!value) return null;
  return (
    <button
      type="button"
      title={title || `Copy: ${value}`}
      onClick={async (e) => {
        if (stopPropagation) { e.stopPropagation(); e.preventDefault(); }
        const ok = await copyText(value);
        if (ok) { setDone(true); setTimeout(() => setDone(false), 1200); }
      }}
      style={{
        display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer",
        fontSize: 10.5, fontWeight: 700, lineHeight: 1,
        color: done ? "#15803d" : tone,
        background: done ? "#f0fdf4" : "#fff",
        border: `1px solid ${done ? "#bbf7d0" : "#e5e7eb"}`,
        borderRadius: 7, padding: "3px 7px", whiteSpace: "nowrap",
      }}
    >
      {done ? "✓ Copied!" : `⧉ ${label || "Copy"}`}
    </button>
  );
}

// Row of copy buttons for every URL found in a piece of text.
function UrlCopyRow({ text }) {
  const urls = extractUrls(text);
  if (!urls.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
      {urls.map((u, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <CopyBtn
            value={u}
            label={isImageUrl(u) ? "Copy image URL" : "Copy link"}
            tone={isImageUrl(u) ? "#7c3aed" : "#2563eb"}
            title={u}
          />
          <a
            href={u}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{ fontSize: 10.5, fontWeight: 700, color: "#9ca3af", textDecoration: "none" }}
          >
            open ↗
          </a>
        </div>
      ))}
    </div>
  );
}

// ─── small components ───────────────────────────────────────────────────────
function StatCard({ label, value, color, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, minWidth: 92, textAlign: "left", cursor: onClick ? "pointer" : "default",
        background: "#fff", border: `1.5px solid ${active ? color : "#f3f4f6"}`,
        borderRadius: 14, padding: "12px 14px", transition: "all .15s",
        boxShadow: active ? `0 0 0 3px ${color}22` : "0 1px 3px rgba(0,0,0,.04)",
      }}
    >
      <div style={{ fontSize: 22, fontWeight: 800, color: color || "#111", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 5 }}>{label}</div>
    </button>
  );
}

function Chip({ children, color = "#6b7280", bg = "#f3f4f6", border = "transparent" }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color, background: bg, border: `1px solid ${border}`, borderRadius: 20, padding: "2px 9px", whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

function StepRow({ s }) {
  const isFail = s.status === "fail";
  return (
    <div style={{ display: "flex", gap: 9, padding: "7px 0", borderTop: "1px dashed #f3f4f6" }}>
      <span style={{ fontSize: 13, width: 18, flexShrink: 0, textAlign: "center" }}>{STEP_ICON[s.status] || "•"}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <code style={{ fontSize: 12, fontWeight: 700, color: isFail ? "#b91c1c" : "#374151", fontFamily: "ui-monospace,Menlo,monospace" }}>{s.name}</code>
          {s.durationMs > 1500 && <span style={{ fontSize: 10, color: "#9ca3af" }}>{(s.durationMs / 1000).toFixed(1)}s</span>}
        </div>
        {s.message && (
          <>
            <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 2, lineHeight: 1.4, wordBreak: "break-word" }}>{s.message}</div>
            <UrlCopyRow text={s.message} />
          </>
        )}
        {s.error && (
          <div style={{ marginTop: 5 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: "#b91c1c", textTransform: "uppercase", letterSpacing: 0.5 }}>Error</span>
              <CopyBtn value={s.error} label="Copy error" tone="#b91c1c" />
            </div>
            <div style={{ fontSize: 12, color: "#991b1b", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "6px 9px", fontFamily: "ui-monospace,Menlo,monospace", overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {s.error}
            </div>
            <UrlCopyRow text={s.error} />
          </div>
        )}
      </div>
    </div>
  );
}

function LogCard({ log, expanded, onToggle }) {
  const oc = OUTCOME[log.outcome] || OUTCOME.unknown;
  const failStep = (log.steps || []).find((s) => s.status === "fail");
  return (
    <div style={{ background: "#fff", border: `1px solid ${expanded ? oc.border : "#f3f4f6"}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,.04)" }}>
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); } }}
        style={{ width: "100%", textAlign: "left", background: expanded ? oc.bg : "#fff", border: "none", cursor: "pointer", padding: "13px 16px", display: "flex", flexDirection: "column", gap: 8 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: oc.dot, flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 800, color: oc.color }}>{oc.label}</span>
          <Chip color="#4b5563" bg="#f3f4f6">{PHASE_LABEL[log.phase] || log.phase}</Chip>
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>{timeAgo(log.createdAt)}</span>
          <span style={{ fontSize: 14, color: "#9ca3af", transform: expanded ? "rotate(90deg)" : "none", transition: "transform .15s" }}>›</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 12, color: "#6b7280" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            👤 <b style={{ color: "#374151", fontWeight: 700 }}>{log.userId || "—"}</b>
            {log.userId && <CopyBtn value={log.userId} label="Copy ID" title={`Copy userId: ${log.userId}`} />}
          </span>
          {log.postId && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              📄 <span style={{ color: "#374151" }}>{String(log.postId).slice(-6)}</span>
              <CopyBtn value={log.postId} label="Copy post" title={`Copy postId: ${log.postId}`} />
            </span>
          )}
          {log.trigger && <span style={{ color: "#9ca3af" }}>· {log.trigger}</span>}
        </div>
        {!expanded && failStep && (
          <div style={{ fontSize: 12, color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "5px 9px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            ❌ {failStep.name}: {failStep.error || failStep.message}
          </div>
        )}
      </div>
      {expanded && (
        <div style={{ padding: "4px 16px 14px" }}>
          {(log.steps || []).map((s, i) => <StepRow key={i} s={s} />)}
          {log.error && (
            <div style={{ marginTop: 10, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 10px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 10.5, fontWeight: 800, color: "#b91c1c", textTransform: "uppercase", letterSpacing: 0.5 }}>▶ Reason</span>
                <CopyBtn value={log.error} label="Copy reason" tone="#b91c1c" />
              </div>
              <div style={{ fontSize: 12.5, color: "#991b1b", fontWeight: 600, wordBreak: "break-word" }}>{log.error}</div>
              <UrlCopyRow text={log.error} />
            </div>
          )}
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {log.userId && <CopyBtn value={log.userId} label="Copy userId" title={`Copy userId: ${log.userId}`} />}
            {log.runId && <CopyBtn value={log.runId} label="Copy runId" title={`Copy runId: ${log.runId}`} />}
            {log.postId && <CopyBtn value={log.postId} label="Copy postId" title={`Copy postId: ${log.postId}`} />}
            <CopyBtn value={buildTrail(log)} label="Copy full trail" tone="#111" title="Copy the whole step-by-step trail as text" />
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: "#9ca3af" }}>
            {fmtTime(log.createdAt)} · runId {String(log.runId || "").slice(-10)}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── page ───────────────────────────────────────────────────────────────────
export default function AutomationLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState("automation"); // automation | manual
  const [outcome, setOutcome] = useState("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [auto, setAuto] = useState(false);
  const [lastLoaded, setLastLoaded] = useState(null);

  const load = useCallback(async () => {
    try {
      setErr("");
      const res = await fetch(`/api/automation-logs?limit=200`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setLogs(Array.isArray(data.logs) ? data.logs : []);
        setLastLoaded(new Date());
      } else {
        setErr(data.error || "Failed to load logs");
      }
    } catch (e) {
      setErr(e.message || "Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!auto) return undefined;
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [auto, load]);

  const bySource = useMemo(() => ({
    automation: logs.filter((l) => l.source !== "manual"),
    manual: logs.filter((l) => l.source === "manual"),
  }), [logs]);

  const tabLogs = bySource[tab] || [];

  const stats = useMemo(() => {
    const s = { total: tabLogs.length, success: 0, failed: 0, skipped: 0, unknown: 0 };
    tabLogs.forEach((l) => { s[l.outcome] = (s[l.outcome] || 0) + 1; });
    return s;
  }, [tabLogs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tabLogs.filter((l) => {
      if (outcome !== "all" && l.outcome !== outcome) return false;
      if (q && !String(l.userId || "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [tabLogs, outcome, search]);

  const TabBtn = ({ id, label, count }) => (
    <button
      onClick={() => { setTab(id); setExpanded(null); }}
      style={{
        flex: 1, padding: "11px 14px", borderRadius: 12, border: "none", cursor: "pointer",
        fontSize: 13.5, fontWeight: 800, transition: "all .15s",
        background: tab === id ? "#111" : "#fff",
        color: tab === id ? "#fff" : "#6b7280",
        boxShadow: tab === id ? "0 4px 12px rgba(0,0,0,.15)" : "0 1px 2px rgba(0,0,0,.04)",
      }}
    >
      {label}
      <span style={{ marginLeft: 7, fontSize: 12, fontWeight: 700, padding: "1px 8px", borderRadius: 20, background: tab === id ? "rgba(255,255,255,.2)" : "#f3f4f6", color: tab === id ? "#fff" : "#9ca3af" }}>{count}</span>
    </button>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", padding: "20px 16px 60px", fontFamily: "system-ui,-apple-system,Segoe UI,Roboto,sans-serif" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        {/* header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: "#111", margin: 0, letterSpacing: -0.5 }}>Automation Logs</h1>
            <p style={{ fontSize: 13, color: "#6b7280", margin: "4px 0 0" }}>
              Har post ka step-by-step trail — kahan pass/fail hua, real error ke saath.
              userId, error aur image URL ek tap me copy karo (⧉ button).
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "#6b7280", cursor: "pointer" }}>
              <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} style={{ accentColor: "#f59e0b" }} />
              Auto 15s
            </label>
            <button onClick={load} style={{ background: "#f59e0b", color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>↻ Refresh</button>
          </div>
        </div>

        {/* tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <TabBtn id="automation" label="🤖 Automation" count={bySource.automation.length} />
          <TabBtn id="manual" label="✋ Manual" count={bySource.manual.length} />
        </div>

        {/* stat cards (click to filter by outcome) */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          <StatCard label="Total" value={stats.total} color="#111" active={outcome === "all"} onClick={() => setOutcome("all")} />
          <StatCard label="Success" value={stats.success} color="#16a34a" active={outcome === "success"} onClick={() => setOutcome("success")} />
          <StatCard label="Failed" value={stats.failed} color="#ef4444" active={outcome === "failed"} onClick={() => setOutcome("failed")} />
          <StatCard label="Skipped" value={stats.skipped} color="#f59e0b" active={outcome === "skipped"} onClick={() => setOutcome("skipped")} />
        </div>

        {/* search */}
        <div style={{ marginBottom: 14 }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by userId (e.g. USR123)…"
            style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 13.5, outline: "none", boxSizing: "border-box", background: "#fff" }}
          />
        </div>

        {/* status line */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, fontSize: 12, color: "#9ca3af" }}>
          <span>{filtered.length} log{filtered.length !== 1 ? "s" : ""}{outcome !== "all" ? ` · ${outcome}` : ""}</span>
          {lastLoaded && <span>updated {timeAgo(lastLoaded)}</span>}
        </div>

        {/* list */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "50px 0", color: "#9ca3af", fontSize: 14 }}>Loading logs…</div>
        ) : err ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#b91c1c", fontSize: 14 }}>⚠ {err}</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 20px", color: "#9ca3af" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🗒️</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Koi log nahi mila</div>
            <div style={{ fontSize: 12.5, marginTop: 4 }}>
              {tab === "manual" ? "Manually scheduled posts ka log yahan aayega." : "Automation cron chalega to yahan step-by-step log dikhega."}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((log) => (
              <LogCard
                key={log._id || log.runId + log.postId}
                log={log}
                expanded={expanded === (log._id || log.runId + log.postId)}
                onToggle={() => {
                  const key = log._id || log.runId + log.postId;
                  setExpanded(expanded === key ? null : key);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
