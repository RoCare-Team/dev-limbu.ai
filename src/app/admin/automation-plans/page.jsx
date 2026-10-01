"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  CalendarClock,
  Loader2,
  Mail,
  Pause,
  Phone,
  Play,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  User as UserIcon,
  Zap,
  ZapOff,
} from "lucide-react";

const TABS = [
  { key: "all", label: "All plans" },
  { key: "running", label: "Running" },
  { key: "paused", label: "Paused" },
  { key: "inactive", label: "Inactive" },
];

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const formatWhen = (iso) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "—";

const postingTime = (row) =>
  row.postingHour === null
    ? "Any time"
    : `${String(row.postingHour).padStart(2, "0")}:${String(row.postingMinute).padStart(2, "0")}`;

export default function AdminAutomationPlansPage() {
  const [role, setRole] = useState(null);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [busyId, setBusyId] = useState(null);
  // Which plan is being deleted — deleting wipes the user's saved automation,
  // so it asks first instead of acting on the click.
  const [confirmDelete, setConfirmDelete] = useState(null);
  // A reply for an older filter/search must not overwrite the current list.
  const requestRef = useRef(0);

  useEffect(() => {
    setRole(localStorage.getItem("role") || "");
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

  const fetchPage = useCallback(
    async (pageNum) => {
      const requestId = pageNum === 1 ? ++requestRef.current : requestRef.current;
      pageNum === 1 ? setLoading(true) : setLoadingMore(true);
      try {
        const qs = new URLSearchParams({ status, page: String(pageNum) });
        if (debouncedSearch) qs.set("search", debouncedSearch);
        const res = await fetch(`/api/admin/automation-plans?${qs}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (requestId !== requestRef.current) return;
        if (!res.ok || !data.success) throw new Error(data.error || "Failed to load automation plans");

        setRows((prev) => (pageNum === 1 ? data.data : [...prev, ...data.data]));
        setCounts(data.counts || {});
        setTotal(data.total || 0);
        setHasMore(!!data.hasMore);
        setPage(pageNum);
      } catch (err) {
        if (requestId === requestRef.current) toast.error(err.message);
      } finally {
        if (requestId === requestRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [status, debouncedSearch]
  );

  useEffect(() => {
    if (role === "superAdmin") fetchPage(1);
  }, [role, fetchPage]);

  const togglePlan = async (row) => {
    const action = row.running ? "pause" : "resume";
    setBusyId(row.id);
    try {
      const res = await fetch("/api/admin/automation-plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ id: row.id, action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || "Could not update this plan");

      setRows((prev) => prev.map((r) => (r.id === row.id ? data.data : r)));
      setCounts((c) => ({
        ...c,
        running: Math.max(0, (c.running ?? 0) + (action === "resume" ? 1 : -1)),
        paused: Math.max(0, (c.paused ?? 0) + (action === "resume" ? -1 : 1)),
      }));
      toast.success(action === "pause" ? "Automation stopped" : "Automation started");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const deletePlan = async (row) => {
    setBusyId(row.id);
    try {
      const res = await fetch(`/api/admin/automation-plans?id=${encodeURIComponent(row.id)}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || "Could not delete this plan");

      setRows((prev) => prev.filter((r) => r.id !== row.id));
      setTotal((t) => Math.max(0, t - 1));
      setCounts((c) => ({ ...c, all: Math.max(0, (c.all ?? 1) - 1) }));
      setConfirmDelete(null);
      toast.success("Automation plan deleted");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  if (role === null) return null;

  if (role !== "superAdmin") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <ShieldAlert className="mb-3 h-10 w-10 text-red-400" />
        <h1 className="text-lg font-bold text-slate-900">superAdmin only</h1>
        <p className="mt-1 text-sm text-slate-500">
          This page starts, stops and deletes automation for every user.
        </p>
      </div>
    );
  }

  return (
    <div>
      <Toaster position="top-right" />

      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 shadow-sm">
            <CalendarClock size={20} className="text-yellow-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Automation Plans</h1>
            <p className="text-xs text-slate-500">
              Kis user ki posting automation chal rahi hai — yahin se band, chalu ya delete karo
            </p>
          </div>
        </div>
        <button
          onClick={() => fetchPage(1)}
          disabled={loading}
          className="flex w-fit items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {TABS.map((tab) => {
          const active = status === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setStatus(tab.key)}
              className={`rounded-xl border px-3 py-3 text-left transition ${
                active
                  ? "border-slate-900 bg-slate-900 text-white shadow"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              <p
                className={`text-[11px] font-semibold uppercase tracking-wide ${
                  active ? "text-slate-300" : "text-slate-500"
                }`}
              >
                {tab.label}
              </p>
              <p className="text-xl font-black">{counts[tab.key] ?? "—"}</p>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by user name, email, phone or user ID…"
          className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
        />
      </div>

      {/* Rows */}
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
          <ZapOff className="mb-2 h-8 w-8 text-slate-300" />
          <p className="text-sm font-semibold text-slate-600">No automation plans found</p>
          <p className="text-xs text-slate-400">Try another tab or search</p>
        </div>
      ) : (
        <>
          <p className="mb-2 text-xs text-slate-500">
            Showing {rows.length} of {total}
          </p>
          <div className="space-y-3">
            {rows.map((row) => (
              <PlanRow
                key={row.id}
                row={row}
                busy={busyId === row.id}
                onToggle={() => togglePlan(row)}
                onAskDelete={() => setConfirmDelete(row)}
              />
            ))}
          </div>

          <div className="mt-6 text-center">
            {hasMore ? (
              <button
                onClick={() => fetchPage(page + 1)}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {loadingMore && <Loader2 size={14} className="animate-spin" />} Load more
              </button>
            ) : (
              <p className="text-xs text-slate-400">That&apos;s everything</p>
            )}
          </div>
        </>
      )}

      {confirmDelete && (
        <DeleteDialog
          row={confirmDelete}
          busy={busyId === confirmDelete.id}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => deletePlan(confirmDelete)}
        />
      )}
    </div>
  );
}

/* ----------------------------------------------------
   ONE PLAN
---------------------------------------------------- */
function PlanRow({ row, busy, onToggle, onAskDelete }) {
  const name = row.user?.fullName || "Unknown user";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        {/* Who */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <UserIcon size={15} className="shrink-0 text-slate-400" />
            <p className="truncate text-sm font-bold text-slate-900">{name}</p>
            <StatePill row={row} />
            {row.packageName && (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                {row.packageName}
              </span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
            {row.user?.email && (
              <span className="inline-flex items-center gap-1">
                <Mail size={11} /> {row.user.email}
              </span>
            )}
            {row.user?.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone size={11} /> {row.user.phone}
              </span>
            )}
            <span className="font-mono text-slate-400">{row.userId}</span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] sm:grid-cols-4">
            <Fact label="Frequency" value={row.frequency || "—"} />
            <Fact
              label="Posting time"
              value={`${postingTime(row)} ${row.postingTimezone.replace("Asia/", "")}`}
            />
            <Fact label="Window" value={`${formatDate(row.startDate)} → ${formatDate(row.endDate)}`} />
            <Fact
              label="Posts used"
              value={
                row.postsUsed === null
                  ? "—"
                  : `${row.postsUsed}${row.postsLimit ? ` / ${row.postsLimit}` : ""}`
              }
            />
            <Fact
              label="Platforms"
              value={row.platforms.length ? row.platforms.join(", ").toUpperCase() : "—"}
            />
            <Fact label="Keywords" value={String(row.keywordCount)} />
            <Fact label="Last post" value={formatWhen(row.lastPostDate)} />
            <Fact label="Updated" value={formatWhen(row.updatedAt)} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={onToggle}
            disabled={busy}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition disabled:opacity-50 ${
              row.running
                ? "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            {busy ? (
              <Loader2 size={13} className="animate-spin" />
            ) : row.running ? (
              <Pause size={13} />
            ) : (
              <Play size={13} />
            )}
            {row.running ? "Stop" : "Start"}
          </button>

          <button
            onClick={onAskDelete}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function Fact({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="truncate font-semibold text-slate-700">{value}</p>
    </div>
  );
}

/**
 * Two separate flags decide whether the crons post (`active` and
 * `automationEnabled`), so the pill says which one is off rather than
 * flattening both into "stopped".
 */
function StatePill({ row }) {
  const config = row.running
    ? { label: "Running", cls: "border-emerald-200 bg-emerald-50 text-emerald-700", Icon: Zap }
    : !row.active
    ? { label: "Inactive plan", cls: "border-slate-200 bg-slate-100 text-slate-500", Icon: ZapOff }
    : { label: "Paused", cls: "border-amber-200 bg-amber-50 text-amber-700", Icon: Pause };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${config.cls}`}
    >
      <config.Icon size={10} /> {config.label}
    </span>
  );
}

/* ----------------------------------------------------
   DELETE CONFIRMATION
---------------------------------------------------- */
function DeleteDialog({ row, busy, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50">
            <Trash2 size={16} className="text-red-600" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900">Delete this automation plan?</h2>
            <p className="mt-1 text-xs text-slate-600">
              {row.user?.fullName || row.userId}&apos;s saved automation — schedule, keywords, image
              setup and posting window — is removed permanently. Already published posts and their
              wallet are not touched, and they can set it up again from User Settings.
            </p>
            <p className="mt-2 text-xs font-semibold text-slate-700">
              To only stop posting, use <span className="text-amber-700">Stop</span> instead — that
              keeps everything and can be resumed.
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {busy ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            Delete plan
          </button>
        </div>
      </div>
    </div>
  );
}
