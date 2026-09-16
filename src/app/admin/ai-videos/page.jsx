"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  Clapperboard,
  Search,
  Loader2,
  RefreshCw,
  ExternalLink,
  Coins,
  Clock,
  Globe2,
  Mail,
  Phone,
  User as UserIcon,
  ShieldAlert,
  VideoOff,
} from "lucide-react";

const TABS = [
  { key: "all", label: "All" },
  { key: "image", label: "Image To Video" },
  { key: "text", label: "Text To Video" },
  { key: "avatar", label: "AI Avatar" },
  { key: "cgi", label: "CGI Product" },
];

const TYPE_STYLES = {
  image: "bg-violet-50 text-violet-700 border-violet-200",
  text: "bg-blue-50 text-blue-700 border-blue-200",
  avatar: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cgi: "bg-amber-50 text-amber-800 border-amber-200",
};

const formatWhen = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export default function AdminAiVideosPage() {
  const [role, setRole] = useState(null);
  const [type, setType] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  // Replies for an older filter/search must not overwrite the current list.
  const requestRef = useRef(0);

  useEffect(() => {
    setRole(localStorage.getItem("role") || "");
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchPage = useCallback(
    async (pageNum) => {
      const requestId = pageNum === 1 ? ++requestRef.current : requestRef.current;
      pageNum === 1 ? setLoading(true) : setLoadingMore(true);
      try {
        const qs = new URLSearchParams({ type, page: String(pageNum) });
        if (debouncedSearch) qs.set("search", debouncedSearch);
        const res = await fetch(`/api/admin/ai-videos?${qs}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (requestId !== requestRef.current) return;
        if (!res.ok || !data.success) throw new Error(data.error || "Failed to load AI videos");

        setRows((prev) => (pageNum === 1 ? data.data : [...prev, ...data.data]));
        setCounts(data.counts || {});
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
    [type, debouncedSearch]
  );

  useEffect(() => {
    if (role === "superAdmin") fetchPage(1);
  }, [role, fetchPage]);

  if (role === null) return null;

  if (role !== "superAdmin") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <ShieldAlert className="mb-3 h-10 w-10 text-red-400" />
        <h1 className="text-lg font-bold text-slate-900">superAdmin only</h1>
        <p className="mt-1 text-sm text-slate-500">This page lists every user&apos;s AI video generations.</p>
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
            <Clapperboard size={20} className="text-yellow-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">AI Videos</h1>
            <p className="text-xs text-slate-500">
              Kisne kaunsi AI video banayi — Image To Video, Text To Video, AI Avatar aur CGI, sab ek jagah
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
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {TABS.map((tab) => {
          const active = type === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setType(tab.key)}
              className={`rounded-xl border px-3 py-3 text-left transition ${
                active ? "border-slate-900 bg-slate-900 text-white shadow" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              <p className={`text-[11px] font-semibold uppercase tracking-wide ${active ? "text-slate-300" : "text-slate-500"}`}>
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
          placeholder="Search by user name, email, phone, user ID or business…"
          className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-80 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
          <VideoOff className="mb-2 h-8 w-8 text-slate-300" />
          <p className="text-sm font-semibold text-slate-600">No AI videos found</p>
          <p className="text-xs text-slate-400">Try another tab or search</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((row) => (
              <VideoRow key={row.id} row={row} />
            ))}
          </div>

          <div className="mt-6 text-center">
            {hasMore ? (
              <button
                onClick={() => fetchPage(page + 1)}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                {loadingMore && <Loader2 size={14} className="animate-spin" />}
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            ) : (
              <p className="text-xs text-slate-400">Showing all {rows.length} videos</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function VideoRow({ row }) {
  const u = row.user;
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Fixed-ratio box; the video is absolutely positioned so tall 9:16 renders
          can't stretch the card past its neighbours. */}
      <div className="relative aspect-video overflow-hidden bg-black">
        {row.videoUrl ? (
          <video
            src={row.videoUrl}
            controls
            preload="metadata"
            playsInline
            className="absolute inset-0 h-full w-full object-contain"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">No video URL</div>
        )}
        <span
          className={`absolute left-2 top-2 rounded-full border px-2 py-0.5 text-[10px] font-bold ${TYPE_STYLES[row.type] || "bg-white text-slate-700 border-slate-200"}`}
        >
          {row.typeLabel}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        {/* Who made it */}
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
          <p className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
            <UserIcon size={13} className="text-slate-400" />
            {u?.fullName || "Unknown user"}
          </p>
          <div className="mt-1 space-y-0.5 text-[11px] text-slate-500">
            {u?.email && (
              <p className="flex items-center gap-1.5 truncate">
                <Mail size={11} className="shrink-0" /> {u.email}
              </p>
            )}
            {u?.phone && (
              <p className="flex items-center gap-1.5">
                <Phone size={11} className="shrink-0" /> {u.phone}
              </p>
            )}
            <p className="font-mono text-[10px] text-slate-400">{row.userId}</p>
          </div>
        </div>

        <div className="min-w-0">
          <p className="line-clamp-1 text-sm font-semibold text-slate-800">{row.title}</p>
          {row.prompt && <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{row.prompt}</p>}
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-slate-500">{formatWhen(row.createdAt)}</span>
          {typeof row.cost === "number" && (
            <span className="inline-flex items-center gap-1 rounded-full border border-yellow-200 bg-yellow-50 px-2 py-0.5 text-[10px] font-bold text-yellow-800">
              <Coins size={10} /> {row.cost}
            </span>
          )}
          {typeof row.durationSeconds === "number" && (
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-600">
              <Clock size={10} /> {Math.round(row.durationSeconds)}s
            </span>
          )}
          {row.language && (
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-600">
              <Globe2 size={10} /> {row.language}
            </span>
          )}
          {row.postStatus && (
            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold capitalize text-slate-600">
              {row.postStatus}
            </span>
          )}
          {row.videoUrl && (
            <a
              href={row.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline"
            >
              Open <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
