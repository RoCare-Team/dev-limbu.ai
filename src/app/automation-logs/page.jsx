"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Bot,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  FileText,
  Hand,
  Image as ImageIcon,
  Info,
  KeyRound,
  Layers,
  ListFilter,
  Loader2,
  MinusCircle,
  RefreshCw,
  RotateCw,
  Search,
  Send,
  SkipForward,
  Sparkles,
  User as UserIcon,
  UserCog,
  Wrench,
  X,
  XCircle,
} from "lucide-react";

// ─── helpers ────────────────────────────────────────────────────────────────
const OUTCOME = {
  success: { label: "Success", Icon: CheckCircle2, text: "text-emerald-700", bg: "bg-emerald-50", ring: "ring-emerald-200", dot: "bg-emerald-500" },
  failed: { label: "Failed", Icon: XCircle, text: "text-rose-700", bg: "bg-rose-50", ring: "ring-rose-200", dot: "bg-rose-500" },
  skipped: { label: "Skipped", Icon: SkipForward, text: "text-amber-700", bg: "bg-amber-50", ring: "ring-amber-200", dot: "bg-amber-500" },
  unknown: { label: "Unknown", Icon: MinusCircle, text: "text-slate-600", bg: "bg-slate-50", ring: "ring-slate-200", dot: "bg-slate-400" },
};
const STEP_STYLE = {
  pass: { Icon: CheckCircle2, className: "text-emerald-500" },
  success: { Icon: CheckCircle2, className: "text-emerald-600" },
  fail: { Icon: XCircle, className: "text-rose-500" },
  skip: { Icon: SkipForward, className: "text-amber-500" },
  info: { Icon: Info, className: "text-slate-400" },
};
const STEP_ICON_TEXT = { pass: "✅", success: "🎯", fail: "❌", skip: "⏭️", info: "•" };
const PHASE_LABEL = {
  publish: "Publish → GMB/FB/IG",
  "fill-queue": "Generate content",
  "publish-scheduled": "Scheduled publish",
};

// Fail do tarah ka hota hai — content ban hi nahi paaya (fill-queue), ya
// content ban gaya par publish nahi hua (publish / publish-scheduled).
// Phase se pata nahi chalta — `publish` phase ke andar content generation bhi
// hota hai aur publishing bhi. Isliye failed step ke naam se decide karte hain.
const GENERATE_STEP_RE = /^(content:|queue:generate|image:|caption:)/i;
const PUBLISH_STEP_RE = /^(publish:|done:(partial|failed))/i;
function failKind(log) {
  if (log?.outcome !== "failed") return null;
  const failed = (log.steps || []).filter((s) => s.status === "fail").map((s) => s.name || "");
  if (failed.some((n) => GENERATE_STEP_RE.test(n))) return "generate";
  if (failed.some((n) => PUBLISH_STEP_RE.test(n))) return "publish";
  if (failed.length) return "other";           // config: / token: / db: / notify:
  return log.phase === "fill-queue" ? "generate" : "publish"; // step detail hi nahi
}
// Post kaise queue hua — user ne Post Management se khud banaya (manual) ya
// automation plan ne khud generate kiya (automation).
const SOURCE_TAG = {
  manual: {
    label: "Manual",
    hint: "User ne Post Management se khud banaya",
    Icon: Hand,
    className: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  },
  automation: {
    label: "Automation",
    hint: "Automation plan ne khud generate kiya",
    Icon: Bot,
    className: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  },
};
const sourceTag = (log) => SOURCE_TAG[log?.source === "manual" ? "manual" : "automation"];

const OUTCOME_LABEL = {
  success: "success",
  failed: "failed (all)",
  skipped: "skipped",
  "failed-publish": "publish fail",
  "failed-generate": "generate fail",
  "failed-other": "setup fail",
};
const FAIL_KIND = {
  generate: { label: "Generation failed", short: "Content generate hi nahi hua", className: "bg-orange-50 text-orange-700 ring-orange-200", Icon: Sparkles },
  publish: { label: "Publish failed", short: "Content bana, publish nahi hua", className: "bg-rose-50 text-rose-700 ring-rose-200", Icon: Send },
  other: { label: "Setup failed", short: "Config/token/DB issue — generate se pehle ruk gaya", className: "bg-slate-100 text-slate-600 ring-slate-200", Icon: Wrench },
};

// ─── date filter ────────────────────────────────────────────────────────────
const DATE_PRESETS = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "all", label: "All time" },
  { id: "custom", label: "Custom" },
];
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };
const endOfDay = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x.getTime(); };
const daysAgo = (n) => { const x = new Date(); x.setDate(x.getDate() - n); return x; };
const toInputDate = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

// Preset/custom ko [from, to] epoch me badalta hai. null = us side koi limit nahi.
function dateBounds(preset, from, to) {
  const now = new Date();
  switch (preset) {
    case "today": return { from: startOfDay(now), to: endOfDay(now) };
    case "yesterday": return { from: startOfDay(daysAgo(1)), to: endOfDay(daysAgo(1)) };
    case "7d": return { from: startOfDay(daysAgo(6)), to: endOfDay(now) };
    case "30d": return { from: startOfDay(daysAgo(29)), to: endOfDay(now) };
    case "custom": return {
      from: from ? startOfDay(from) : null,
      to: to ? endOfDay(to) : null,
    };
    default: return { from: null, to: null };
  }
}

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
  L.push(`source: ${log.source === "manual" ? "manual (user ne banaya)" : "automation"}`);
  L.push(`userId: ${log.userId || "-"}`);
  if (log.accountManagerName) L.push(`manager: ${log.accountManagerName}`);
  if (log.businessName) L.push(`business: ${log.businessName}${log.locality ? ` (${log.locality})` : ""}`);
  if (log.keyword) L.push(`keyword: ${log.keyword}`);
  if ((log.platforms || []).length) L.push(`platforms: ${log.platforms.join(", ")}`);
  if (log.imageUrl) L.push(`imageUrl: ${log.imageUrl}`);
  if (log.postId) L.push(`postId: ${log.postId}`);
  if (log.runId) L.push(`runId: ${log.runId}`);
  L.push(`time: ${fmtTime(log.createdAt)}`);
  L.push("");
  (log.steps || []).forEach((s) => {
    let line = `${STEP_ICON_TEXT[s.status] || "•"} ${s.name || ""}`;
    if (s.message) line += ` — ${s.message}`;
    L.push(line);
    if (s.error) L.push(`   ERROR: ${s.error}`);
  });
  if (log.error) { L.push(""); L.push(`Reason: ${log.error}`); }
  return L.join("\n");
}

// Deterministic soft colour per manager, so the same person always reads the same.
const MANAGER_TONES = [
  "bg-violet-50 text-violet-700 ring-violet-200",
  "bg-sky-50 text-sky-700 ring-sky-200",
  "bg-teal-50 text-teal-700 ring-teal-200",
  "bg-orange-50 text-orange-700 ring-orange-200",
  "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200",
  "bg-lime-50 text-lime-700 ring-lime-200",
];
function managerTone(name) {
  if (!name || name === "Unassigned") return "bg-slate-100 text-slate-500 ring-slate-200";
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return MANAGER_TONES[h % MANAGER_TONES.length];
}
function initials(name) {
  return String(name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

// ─── copy button (shows ✓ Copied! for 1.2s) ──────────────────────────────────
function CopyBtn({ value, label, title, tone = "text-slate-500", stopPropagation = true }) {
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
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-lg border px-2 py-1 text-[10.5px] font-bold leading-none transition
        ${done
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : `border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 active:scale-[0.97] ${tone}`}`}
    >
      {done ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {done ? "Copied!" : label || "Copy"}
    </button>
  );
}

// Row of copy buttons for every URL found in a piece of text.
function UrlCopyRow({ text }) {
  const urls = extractUrls(text);
  if (!urls.length) return null;
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
      {urls.map((u, i) => (
        <div key={i} className="flex items-center gap-1">
          <CopyBtn
            value={u}
            label={isImageUrl(u) ? "Image URL" : "Link"}
            tone={isImageUrl(u) ? "text-violet-600" : "text-blue-600"}
            title={u}
          />
          <a
            href={u}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-0.5 text-[10.5px] font-bold text-slate-400 transition hover:text-slate-600"
          >
            open <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>
      ))}
    </div>
  );
}

// ─── republish (retry) button — failed publishes ko ek click me dobara post karo ──
function RepublishButton({ postId, onDone }) {
  const [state, setState] = useState("idle"); // idle | busy | ok | err
  const [msg, setMsg] = useState("");
  if (!postId) return null;

  const run = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (state === "busy") return;
    setState("busy");
    setMsg("");
    try {
      const res = await fetch(`/api/publish-scheduled?postId=${encodeURIComponent(postId)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      const posted = data?.stats?.posted ?? 0;
      const failed = data?.stats?.failed ?? 0;
      if (res.ok && posted > 0 && failed === 0) {
        setState("ok");
        setMsg("Published ✓");
      } else if (res.ok && posted > 0) {
        setState("ok");
        setMsg("Partially published");
      } else {
        setState("err");
        setMsg(data?.error || "Still failing — check error");
      }
      setTimeout(() => onDone && onDone(), 900);
    } catch (err) {
      setState("err");
      setMsg(err.message || "Network error");
    }
  };

  const skin =
    state === "ok"
      ? { btn: "border-emerald-200 bg-emerald-50 text-emerald-700", msg: "text-emerald-700", Icon: Check, text: "Retried" }
      : state === "err"
      ? { btn: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100", msg: "text-rose-700", Icon: RotateCw, text: "Try again" }
      : state === "busy"
      ? { btn: "border-emerald-600 bg-emerald-600 text-white", msg: "text-slate-500", Icon: Loader2, text: "Publishing…" }
      : { btn: "border-emerald-600 bg-emerald-600 text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.98]", msg: "text-slate-500", Icon: RotateCw, text: "Publish now" };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={run}
        disabled={state === "busy"}
        title="Is post ko dobara publish karo — already posted locations skip ho jayenge"
        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-1.5 text-[11.5px] font-extrabold leading-none transition disabled:cursor-wait ${skin.btn}`}
      >
        <skin.Icon className={`h-3.5 w-3.5 ${state === "busy" ? "animate-spin" : ""}`} />
        {skin.text}
      </button>
      {msg && <span className={`text-[11px] font-bold ${skin.msg}`}>{msg}</span>}
      {state === "idle" && (
        <span className="text-[11px] text-slate-400">Already posted locations skip honge</span>
      )}
    </div>
  );
}

// ─── small components ───────────────────────────────────────────────────────
function StatCard({ label, value, Icon, tone, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex-1 basis-[130px] overflow-hidden rounded-2xl border bg-white p-3.5 text-left transition
        ${active ? `${tone.border} shadow-sm ${tone.glow}` : "border-slate-100 hover:border-slate-200 hover:shadow-sm"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className={`text-[22px] font-extrabold leading-none ${tone.value}`}>{value}</div>
          <div className="mt-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</div>
        </div>
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${tone.chip} transition group-hover:scale-105`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </button>
  );
}

function Chip({ children, className = "bg-slate-100 text-slate-600 ring-slate-200" }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ring-inset ${className}`}>
      {children}
    </span>
  );
}

function StepRow({ s }) {
  const isFail = s.status === "fail";
  const { Icon, className } = STEP_STYLE[s.status] || STEP_STYLE.info;
  return (
    <div className="flex gap-2.5 border-t border-dashed border-slate-100 py-2">
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${className}`} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <code className={`font-mono text-xs font-bold ${isFail ? "text-rose-700" : "text-slate-700"}`}>{s.name}</code>
          {s.durationMs > 1500 && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-400">
              <Clock className="h-3 w-3" />{(s.durationMs / 1000).toFixed(1)}s
            </span>
          )}
        </div>
        {s.message && (
          <>
            <div className="mt-0.5 break-words text-[12.5px] leading-relaxed text-slate-500">{s.message}</div>
            <UrlCopyRow text={s.message} />
          </>
        )}
        {s.error && (
          <div className="mt-1.5">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 text-[10.5px] font-extrabold uppercase tracking-wide text-rose-700">
                <AlertTriangle className="h-3 w-3" /> Error
              </span>
              <CopyBtn value={s.error} label="Copy error" tone="text-rose-600" />
            </div>
            <div className="overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 font-mono text-xs text-rose-800">
              {s.error}
            </div>
            <UrlCopyRow text={s.error} />
          </div>
        )}
      </div>
    </div>
  );
}

// Failed publish (GMB/FB/IG) jise dobara publish kiya ja sakta hai.
const PUBLISH_PHASES = ["publish", "publish-scheduled"];
function canRepublish(log) {
  return !!log.postId && log.outcome === "failed" && PUBLISH_PHASES.includes(log.phase);
}

function LogCard({ log, expanded, onToggle, onDone }) {
  const oc = OUTCOME[log.outcome] || OUTCOME.unknown;
  const failStep = (log.steps || []).find((s) => s.status === "fail");
  const mgr = log.accountManagerName;
  const kind = failKind(log);
  const fk = kind ? FAIL_KIND[kind] : null;
  const st = sourceTag(log);
  return (
    <div className={`overflow-hidden rounded-2xl border bg-white transition-all
      ${expanded ? `border-transparent ring-1 ${oc.ring} shadow-md` : "border-slate-100 shadow-sm hover:border-slate-200 hover:shadow-md"}`}>
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); } }}
        className={`flex w-full cursor-pointer flex-col gap-2 px-4 py-3.5 text-left transition ${expanded ? oc.bg : "hover:bg-slate-50/60"}`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${oc.dot}`} />
          <span className={`text-[13px] font-extrabold ${oc.text}`}>{oc.label}</span>
          <span title={st.hint}>
            <Chip className={st.className}>
              <st.Icon className="h-3 w-3" />{st.label}
            </Chip>
          </span>
          {fk && (
            <Chip className={fk.className}>
              <fk.Icon className="h-3 w-3" />{fk.label}
            </Chip>
          )}
          <Chip>{PHASE_LABEL[log.phase] || log.phase}</Chip>
          <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
            <Clock className="h-3 w-3" />{timeAgo(log.createdAt)}
          </span>
          <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${expanded ? "rotate-90" : ""}`} />
        </div>

        {/* Business + keyword — turant pata chale kaunsa post fail hua */}
        {(log.businessName || log.keyword || (log.platforms || []).length > 0) && (
          <div className="flex flex-wrap items-center gap-2">
            {log.businessName && (
              <span className="inline-flex items-center gap-1.5 text-[12.5px]">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                <b className="font-extrabold text-slate-900">{log.businessName}</b>
                {log.locality && <span className="font-semibold text-slate-400">· {log.locality}</span>}
                <CopyBtn value={log.businessName} label="Name" title={`Copy business: ${log.businessName}`} />
              </span>
            )}
            {log.keyword && (
              <Chip className="bg-violet-50 text-violet-700 ring-violet-200">
                <KeyRound className="h-3 w-3" />{log.keyword}
              </Chip>
            )}
            {(log.platforms || []).map((p) => (
              <Chip key={p} className="bg-blue-50 text-blue-700 ring-blue-200">{p.toUpperCase()}</Chip>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <UserIcon className="h-3.5 w-3.5 text-slate-400" />
            <b className="font-bold text-slate-700">{log.userId || "—"}</b>
            {log.userId && <CopyBtn value={log.userId} label="ID" title={`Copy userId: ${log.userId}`} />}
          </span>
          {mgr && (
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ring-inset ${managerTone(mgr)}`}>
              <UserCog className="h-3 w-3" />{mgr}
            </span>
          )}
          {log.postId && (
            <span className="inline-flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-slate-700">{String(log.postId).slice(-6)}</span>
              <CopyBtn value={log.postId} label="Post" title={`Copy postId: ${log.postId}`} />
            </span>
          )}
          {log.trigger && <span className="text-slate-400">· {log.trigger}</span>}
        </div>

        {!expanded && failStep && (
          <div className={`flex items-center gap-1.5 overflow-hidden truncate rounded-lg px-2.5 py-1.5 text-xs ring-1 ring-inset
            ${fk?.className || "bg-rose-50 text-rose-700 ring-rose-200"}`}>
            <XCircle className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{failStep.name}: {failStep.error || failStep.message}</span>
          </div>
        )}
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-1">
          {/* Generated image — preview + URL copy (fail hone par bhi dikhta hai) */}
          {log.imageUrl && (
            <div className="flex items-start gap-3 border-t border-dashed border-slate-100 py-2.5">
              <a href={log.imageUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={log.imageUrl}
                  alt="Generated"
                  className="h-[76px] w-[76px] rounded-xl border border-slate-200 bg-slate-50 object-cover transition hover:opacity-90"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              </a>
              <div className="min-w-0 flex-1">
                <div className="mb-1 inline-flex items-center gap-1 text-[10.5px] font-extrabold uppercase tracking-wide text-violet-600">
                  <ImageIcon className="h-3 w-3" /> Generated image
                </div>
                <div className="mb-1.5 break-all text-[11.5px] leading-relaxed text-slate-500">{log.imageUrl}</div>
                <div className="flex gap-1.5">
                  <CopyBtn value={log.imageUrl} label="Copy image URL" tone="text-violet-600" />
                  <a
                    href={log.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-0.5 text-[10.5px] font-bold text-slate-400 transition hover:text-slate-600"
                  >
                    open <ArrowUpRight className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {(log.steps || []).map((s, i) => <StepRow key={i} s={s} />)}

          {log.error && (
            <div className="mt-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 text-[10.5px] font-extrabold uppercase tracking-wide text-rose-700">
                  <AlertTriangle className="h-3 w-3" /> Reason
                </span>
                <CopyBtn value={log.error} label="Copy reason" tone="text-rose-600" />
              </div>
              <div className="break-words text-[12.5px] font-semibold text-rose-800">{log.error}</div>
              <UrlCopyRow text={log.error} />
            </div>
          )}

          {/* Failed publish → ek click me dobara publish karo. Already-posted
              locations skip hote hain, sirf failed target retry hota hai. */}
          {canRepublish(log) && (
            <div className="mt-3">
              <RepublishButton postId={log.postId} onDone={onDone} />
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {log.userId && <CopyBtn value={log.userId} label="userId" title={`Copy userId: ${log.userId}`} />}
            {log.runId && <CopyBtn value={log.runId} label="runId" title={`Copy runId: ${log.runId}`} />}
            {log.postId && <CopyBtn value={log.postId} label="postId" title={`Copy postId: ${log.postId}`} />}
            <CopyBtn value={buildTrail(log)} label="Copy full trail" tone="text-slate-900" title="Copy the whole step-by-step trail as text" />
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            {fmtTime(log.createdAt)} · {st.hint} · runId {String(log.runId || "").slice(-10)}
          </div>
        </div>
      )}
    </div>
  );
}

// Source tab (Automation / Manual)
function TabBtn({ id, label, Icon, count, active, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13.5px] font-extrabold transition
        ${active
          ? "bg-slate-900 text-white shadow-lg shadow-slate-900/15"
          : "bg-white text-slate-500 shadow-sm hover:bg-slate-50 hover:text-slate-700"}`}
    >
      <Icon className="h-4 w-4" />
      {label}
      <span className={`rounded-full px-2 py-px text-[11.5px] font-bold ${active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"}`}>
        {count}
      </span>
    </button>
  );
}

// Manager tab pill — assigned account manager ke naam ka tab
function MgrBtn({ id, label, count, avatar, active, onClick }) {
  const tone = managerTone(id === "all" ? null : id);
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className={`flex shrink-0 items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 text-[12.5px] font-bold whitespace-nowrap transition
        ${active
          ? "border-slate-900 bg-slate-900 text-white shadow-md shadow-slate-900/10"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"}`}
    >
      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-extrabold ring-1 ring-inset ${active ? "bg-white/15 text-white ring-white/20" : tone}`}>
        {avatar}
      </span>
      {label}
      <span className={`rounded-full px-1.5 py-px text-[11px] font-bold ${active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"}`}>
        {count}
      </span>
    </button>
  );
}

// Searchable business dropdown — manager ke andar ka business chunne ke liye.
function BusinessPicker({ value, options, allCount, onChange }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hi, setHi] = useState(0);
  const boxRef = useRef(null);
  const inputRef = useRef(null);

  const items = useMemo(() => {
    const list = [{ name: "all", label: "All businesses", count: allCount }]
      .concat(options.map((o) => ({ name: o.name, label: o.name, count: o.count })));
    const needle = q.trim().toLowerCase();
    return needle ? list.filter((i) => i.name === "all" || i.label.toLowerCase().includes(needle)) : list;
  }, [options, allCount, q]);

  // bahar click / Esc pe band
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  useEffect(() => {
    if (open) { setQ(""); setHi(0); setTimeout(() => inputRef.current?.focus(), 0); }
  }, [open]);

  useEffect(() => { setHi(0); }, [q]);

  const pick = (name) => { onChange(name); setOpen(false); };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setHi((i) => Math.min(i + 1, items.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHi((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (items[hi]) pick(items[hi].name); }
  };

  const selected = value === "all" ? null : options.find((o) => o.name === value);

  return (
    <div ref={boxRef} className="relative min-w-60 flex-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center gap-2 rounded-lg border bg-white py-2 pl-3 pr-2 text-left text-[13px] font-semibold transition
          ${open ? "border-slate-300 ring-2 ring-slate-900/5" : "border-slate-200 hover:border-slate-300"}`}
      >
        <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <span className={`flex-1 truncate ${selected ? "text-slate-800" : "text-slate-400"}`}>
          {selected ? selected.name : "All businesses"}
        </span>
        <span className="rounded-full bg-slate-100 px-2 py-px text-[11px] font-bold text-slate-500">
          {selected ? selected.count : allCount}
        </span>
        {value !== "all" && (
          <span
            role="button"
            tabIndex={-1}
            title="Clear"
            onClick={(e) => { e.stopPropagation(); onChange("all"); }}
            className="rounded-full p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
          <div className="relative border-b border-slate-100 p-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Business name search karo…"
              className="w-full rounded-lg bg-slate-50 py-2 pl-8 pr-3 text-[13px] outline-none placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-900/5"
            />
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {items.length === 0 ? (
              <div className="px-3 py-6 text-center text-[12.5px] text-slate-400">Koi business nahi mila</div>
            ) : items.map((it, i) => {
              const active = value === it.name;
              return (
                <button
                  key={it.name}
                  type="button"
                  onMouseEnter={() => setHi(i)}
                  onClick={() => pick(it.name)}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] transition
                    ${i === hi ? "bg-slate-50" : ""} ${active ? "font-bold text-slate-900" : "font-medium text-slate-600"}`}
                >
                  {active
                    ? <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    : <span className="h-3.5 w-3.5 shrink-0" />}
                  <span className="flex-1 truncate">{it.label}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-px text-[11px] font-bold text-slate-500">{it.count}</span>
                </button>
              );
            })}
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
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState("automation"); // automation | manual
  const [manager, setManager] = useState("all"); // "all" | manager name | "Unassigned"
  const [business, setBusiness] = useState("all"); // "all" | business name
  const [datePreset, setDatePreset] = useState("all"); // today | yesterday | 7d | 30d | all | custom
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [outcome, setOutcome] = useState("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [auto, setAuto] = useState(false);
  const [lastLoaded, setLastLoaded] = useState(null);

  const load = useCallback(async () => {
    setRefreshing(true);
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
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!auto) return undefined;
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [auto, load]);

  // URL me ?manager=Shivani ho to page usi manager pe lock — uska hi sab kuch
  // (stats, business list, logs) dikhta hai, doosre managers ke tabs nahi.
  const [lockedManager, setLockedManager] = useState(null);
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("manager");
    setLockedManager(raw && raw.trim() ? raw.trim() : null);
  }, []);

  // Locked naam ko actual data se case-insensitive match karke resolve karte hain.
  const lockedResolved = useMemo(() => {
    if (!lockedManager) return null;
    const needle = lockedManager.toLowerCase();
    const hit = logs.find((l) => (l.accountManagerName || "").toLowerCase() === needle);
    if (hit) return hit.accountManagerName;
    return /^unassigned$/i.test(lockedManager) ? "Unassigned" : lockedManager;
  }, [lockedManager, logs]);

  const managerScoped = useMemo(() => (
    lockedResolved
      ? logs.filter((l) => (l.accountManagerName || "Unassigned") === lockedResolved)
      : logs
  ), [logs, lockedResolved]);

  // Date filter — preset ya custom range. Range inclusive hai (local time).
  const scopeLogs = useMemo(() => {
    const { from, to } = dateBounds(datePreset, customFrom, customTo);
    if (!from && !to) return managerScoped;
    return managerScoped.filter((l) => {
      const t = new Date(l.createdAt).getTime();
      if (Number.isNaN(t)) return false;
      if (from && t < from) return false;
      if (to && t > to) return false;
      return true;
    });
  }, [managerScoped, datePreset, customFrom, customTo]);

  const bySource = useMemo(() => ({
    all: scopeLogs,
    automation: scopeLogs.filter((l) => l.source !== "manual"),
    manual: scopeLogs.filter((l) => l.source === "manual"),
  }), [scopeLogs]);

  const tabLogs = bySource[tab] || [];

  // Manager-wise tabs — har assigned account manager ka apna tab.
  const managerTabs = useMemo(() => {
    const counts = new Map();
    tabLogs.forEach((l) => {
      const name = l.accountManagerName || "Unassigned";
      counts.set(name, (counts.get(name) || 0) + 1);
    });
    return [...counts.entries()]
      .sort((a, b) => (a[0] === "Unassigned") - (b[0] === "Unassigned") || b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
  }, [tabLogs]);

  // Agar current manager tab is source me exist hi nahi karta to "all" pe reset.
  useEffect(() => {
    if (manager !== "all" && !managerTabs.some((m) => m.name === manager)) setManager("all");
  }, [managerTabs, manager]);

  const managerLogs = useMemo(() => (
    manager === "all"
      ? tabLogs
      : tabLogs.filter((l) => (l.accountManagerName || "Unassigned") === manager)
  ), [tabLogs, manager]);

  // Selected manager ke under aane wale businesses hi dropdown me dikhte hain.
  const businessOptions = useMemo(() => {
    const counts = new Map();
    managerLogs.forEach((l) => {
      const name = l.businessName || "(no business name)";
      counts.set(name, (counts.get(name) || 0) + 1);
    });
    return [...counts.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
  }, [managerLogs]);

  // Manager/source badla aur wo business yahan hai hi nahi → "all" pe reset.
  useEffect(() => {
    if (business !== "all" && !businessOptions.some((b) => b.name === business)) setBusiness("all");
  }, [businessOptions, business]);

  // Manager + business dono lag chuke — yahi set stats aur list dono chalata hai.
  const scopedLogs = useMemo(() => (
    business === "all"
      ? managerLogs
      : managerLogs.filter((l) => (l.businessName || "(no business name)") === business)
  ), [managerLogs, business]);

  const stats = useMemo(() => {
    const s = { total: scopedLogs.length, success: 0, failed: 0, skipped: 0, unknown: 0, failPublish: 0, failGenerate: 0, failOther: 0 };
    scopedLogs.forEach((l) => {
      s[l.outcome] = (s[l.outcome] || 0) + 1;
      const kind = failKind(l);
      if (kind === "publish") s.failPublish += 1;
      else if (kind === "generate") s.failGenerate += 1;
      else if (kind === "other") s.failOther += 1;
    });
    return s;
  }, [scopedLogs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scopedLogs.filter((l) => {
      if (outcome === "failed-publish") { if (failKind(l) !== "publish") return false; }
      else if (outcome === "failed-generate") { if (failKind(l) !== "generate") return false; }
      else if (outcome === "failed-other") { if (failKind(l) !== "other") return false; }
      else if (outcome !== "all" && l.outcome !== outcome) return false;
      if (q) {
        const hay = `${l.userId || ""} ${l.businessName || ""} ${l.keyword || ""} ${l.postId || ""} ${l.accountManagerName || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [scopedLogs, outcome, search]);

  // Manager badla to business selection bhi reset — nayi list ka apna scope hai.
  const pickManager = useCallback((name) => {
    setManager(name);
    setBusiness("all");
    setExpanded(null);
    // URL bhi update — link share karo to wahi manager khulega.
    const url = new URL(window.location.href);
    if (name === "all") url.searchParams.delete("manager");
    else url.searchParams.set("manager", name);
    window.history.replaceState({}, "", url);
  }, []);

  const dateRangeLabel = useMemo(() => {
    if (datePreset !== "custom") return DATE_PRESETS.find((p) => p.id === datePreset)?.label || "";
    if (customFrom && customTo) return `${customFrom} → ${customTo}`;
    if (customFrom) return `${customFrom} se aage`;
    if (customTo) return `${customTo} tak`;
    return "Custom";
  }, [datePreset, customFrom, customTo]);

  // Jo manager actually scope me hai — URL lock ya pill selection.
  const effManager = lockedResolved || (manager !== "all" ? manager : null);

  const successRate = stats.total ? Math.round((stats.success / stats.total) * 100) : 0;

  return (
    <div className="min-h-screen w-full bg-slate-50 px-4 pb-20 pt-6 font-sans text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1000px]">
        {/* header */}
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/15">
              <Activity className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">Automation Logs</h1>
              <p className="mt-1 max-w-md text-[13px] leading-relaxed text-slate-500">
                Har post ka step-by-step trail — kahan pass/fail hua, real error ke saath.
                userId, error aur image URL ek tap me copy karo.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex cursor-pointer select-none items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 transition hover:border-slate-300">
              <input
                type="checkbox"
                checked={auto}
                onChange={(e) => setAuto(e.target.checked)}
                className="h-3.5 w-3.5 accent-amber-500"
              />
              Auto 15s
              {auto && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />}
            </label>
            <button
              type="button"
              onClick={load}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-[13px] font-bold text-white shadow-sm transition hover:bg-amber-600 active:scale-[0.98] disabled:opacity-70"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* date filter — preset pills + custom range */}
        <div className="mb-3 rounded-2xl border border-slate-100 bg-white p-2.5 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-wide text-slate-400">
              <CalendarDays className="h-3 w-3" /> Date
            </span>
            <div className="flex flex-wrap gap-1.5">
              {DATE_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setDatePreset(p.id);
                    setExpanded(null);
                    if (p.id === "custom" && !customFrom && !customTo) {
                      setCustomFrom(toInputDate(daysAgo(6)));
                      setCustomTo(toInputDate(new Date()));
                    }
                  }}
                  className={`rounded-full border px-3 py-1.5 text-[12px] font-bold transition
                    ${datePreset === p.id
                      ? "border-slate-900 bg-slate-900 text-white shadow-sm shadow-slate-900/10"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <span className="ml-auto text-[11px] font-semibold text-slate-400">
              {scopeLogs.length} log is range me
            </span>
          </div>

          {datePreset === "custom" && (
            <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-dashed border-slate-100 pt-2.5">
              <label className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-slate-500">
                From
                <input
                  type="date"
                  value={customFrom}
                  max={customTo || undefined}
                  onChange={(e) => { setCustomFrom(e.target.value); setExpanded(null); }}
                  className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[12.5px] font-semibold text-slate-700 outline-none transition hover:border-slate-300 focus:border-slate-300 focus:ring-2 focus:ring-slate-900/5"
                />
              </label>
              <span className="text-slate-300">→</span>
              <label className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-slate-500">
                To
                <input
                  type="date"
                  value={customTo}
                  min={customFrom || undefined}
                  onChange={(e) => { setCustomTo(e.target.value); setExpanded(null); }}
                  className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[12.5px] font-semibold text-slate-700 outline-none transition hover:border-slate-300 focus:border-slate-300 focus:ring-2 focus:ring-slate-900/5"
                />
              </label>
              {(customFrom || customTo) && (
                <button
                  type="button"
                  onClick={() => { setCustomFrom(""); setCustomTo(""); }}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11.5px] font-bold text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                >
                  <X className="h-3.5 w-3.5" /> Clear
                </button>
              )}
            </div>
          )}
        </div>

        {/* tabs */}
        <div className="mb-3 flex gap-2">
          <TabBtn id="all" label="All" Icon={Layers} count={bySource.all.length} active={tab === "all"} onClick={(id) => { setTab(id); setExpanded(null); }} />
          <TabBtn id="automation" label="Automation" Icon={Bot} count={bySource.automation.length} active={tab === "automation"} onClick={(id) => { setTab(id); setExpanded(null); }} />
          <TabBtn id="manual" label="Manual" Icon={Hand} count={bySource.manual.length} active={tab === "manual"} onClick={(id) => { setTab(id); setExpanded(null); }} />
        </div>

        {/* manager scope — URL me ?manager=Naam ho to sirf usi ka sab kuch */}
        {(managerTabs.length > 0 || lockedResolved) && (
          <div className="mb-4">
            {!lockedResolved && (
              <div className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-wide text-slate-400">
                <UserCog className="h-3 w-3" /> Account manager
              </div>
            )}

            {lockedResolved ? null : (
              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <MgrBtn id="all" label="All" count={tabLogs.length} avatar={<ListFilter className="h-3 w-3" />} active={manager === "all"} onClick={pickManager} />
                {managerTabs.map((m) => (
                  <MgrBtn
                    key={m.name}
                    id={m.name}
                    label={m.name}
                    count={m.count}
                    avatar={m.name === "Unassigned" ? <UserIcon className="h-3 w-3" /> : initials(m.name)}
                    active={manager === m.name}
                    onClick={pickManager}
                  />
                ))}
              </div>
            )}

            {/* selected manager ke under ka business — "All" ya koi ek (searchable) */}
            {businessOptions.length > 0 && (
              <div className="mt-2.5 flex flex-wrap items-center gap-2 rounded-xl border border-slate-100 bg-white p-2.5 shadow-sm">
                <span className="inline-flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-wide text-slate-400">
                  <Building2 className="h-3 w-3" />
                  {effManager ? `${effManager} ka business` : "Business"}
                </span>
                <BusinessPicker
                  value={business}
                  options={businessOptions}
                  allCount={managerLogs.length}
                  onChange={(v) => { setBusiness(v); setExpanded(null); }}
                />
              </div>
            )}
          </div>
        )}

        {/* stat cards (click to filter by outcome) */}
        <div className="mb-3 flex flex-wrap gap-2">
          <StatCard label="Total" value={stats.total} Icon={Activity} active={outcome === "all"} onClick={() => setOutcome("all")}
            tone={{ value: "text-slate-900", chip: "bg-slate-100 text-slate-600", border: "border-slate-900", glow: "ring-2 ring-slate-900/10" }} />
          <StatCard label="Success" value={stats.success} Icon={CheckCircle2} active={outcome === "success"} onClick={() => setOutcome("success")}
            tone={{ value: "text-emerald-600", chip: "bg-emerald-50 text-emerald-600", border: "border-emerald-400", glow: "ring-2 ring-emerald-500/15" }} />
          <StatCard label="Failed · all" value={stats.failed} Icon={XCircle} active={outcome === "failed"} onClick={() => setOutcome("failed")}
            tone={{ value: "text-rose-600", chip: "bg-rose-50 text-rose-600", border: "border-rose-400", glow: "ring-2 ring-rose-500/15" }} />
          <StatCard label="Publish fail" value={stats.failPublish} Icon={Send} active={outcome === "failed-publish"} onClick={() => setOutcome("failed-publish")}
            tone={{ value: "text-rose-600", chip: "bg-rose-50 text-rose-600", border: "border-rose-400", glow: "ring-2 ring-rose-500/15" }} />
          <StatCard label="Generate fail" value={stats.failGenerate} Icon={Sparkles} active={outcome === "failed-generate"} onClick={() => setOutcome("failed-generate")}
            tone={{ value: "text-orange-600", chip: "bg-orange-50 text-orange-600", border: "border-orange-400", glow: "ring-2 ring-orange-500/15" }} />
          {stats.failOther > 0 && (
            <StatCard label="Setup fail" value={stats.failOther} Icon={Wrench} active={outcome === "failed-other"} onClick={() => setOutcome("failed-other")}
              tone={{ value: "text-slate-700", chip: "bg-slate-100 text-slate-500", border: "border-slate-400", glow: "ring-2 ring-slate-500/10" }} />
          )}
          <StatCard label="Skipped" value={stats.skipped} Icon={SkipForward} active={outcome === "skipped"} onClick={() => setOutcome("skipped")}
            tone={{ value: "text-amber-600", chip: "bg-amber-50 text-amber-600", border: "border-amber-400", glow: "ring-2 ring-amber-500/15" }} />
        </div>

        {/* success rate bar */}
        {stats.total > 0 && (
          <div className="mb-4 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Success rate</span>
              <span className="text-sm font-extrabold text-slate-900">
                {successRate}%
                <span className="ml-1.5 text-[11px] font-semibold text-slate-400">{stats.success}/{stats.total}</span>
              </span>
            </div>
            <div className="flex h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${(stats.success / stats.total) * 100}%` }} />
              <div className="bg-rose-500 transition-all duration-500" style={{ width: `${(stats.failed / stats.total) * 100}%` }} />
              <div className="bg-amber-400 transition-all duration-500" style={{ width: `${(stats.skipped / stats.total) * 100}%` }} />
            </div>
          </div>
        )}

        {/* search */}
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by userId, business, keyword, manager…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-11 pr-10 text-[13.5px] outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-900/5"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <XCircle className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* status line */}
        <div className="mb-2.5 flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold">
            {filtered.length} log{filtered.length !== 1 ? "s" : ""}
            {outcome !== "all" ? ` · ${OUTCOME_LABEL[outcome] || outcome}` : ""}
            {datePreset !== "all" ? ` · ${dateRangeLabel}` : ""}
            {effManager ? ` · ${effManager}` : ""}
            {business !== "all" ? ` · ${business}` : ""}
          </span>
          {lastLoaded && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />updated {timeAgo(lastLoaded)}
            </span>
          )}
        </div>

        {/* list */}
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-16 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm font-semibold">Loading logs…</span>
          </div>
        ) : err ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 py-10 text-rose-700">
            <AlertTriangle className="h-6 w-6" />
            <span className="text-sm font-bold">{err}</span>
            <button type="button" onClick={load} className="mt-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-rose-700">
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white/60 px-6 py-14 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
              <FileText className="h-5 w-5" />
            </span>
            <div className="text-sm font-bold text-slate-600">Koi log nahi mila</div>
            <div className="max-w-xs text-[12.5px] leading-relaxed text-slate-400">
              {lockedResolved
                ? `"${lockedResolved}" ke kisi user ka log is filter me nahi hai.`
                : tab === "manual"
                ? "Manually scheduled posts ka log yahan aayega."
                : "Automation cron chalega to yahan step-by-step log dikhega."}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {filtered.map((log) => {
              const key = log._id || log.runId + log.postId;
              const isOpen = expanded === key;
              return (
                <LogCard
                  key={key}
                  log={log}
                  expanded={isOpen}
                  onToggle={() => setExpanded(isOpen ? null : key)}
                  onDone={load}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
