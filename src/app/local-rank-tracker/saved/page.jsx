"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Toaster, toast } from "react-hot-toast";
import {
  ArrowLeft,
  Loader2,
  Database,
  Trophy,
  LayoutGrid,
  MapPin,
  Clock,
  Search,
  ChevronDown,
  ChevronUp,
  Building2,
} from "lucide-react";

const API_URL = "/api/local-rank/save";

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SavedAuditsPage() {
  const [userId, setUserId] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const loadSaved = useCallback(async (uid) => {
    if (!uid) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}?userId=${encodeURIComponent(uid)}`);
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to load saved audits");
      }
      setResults(result.data || []);
    } catch (err) {
      console.error("Load saved audits failed:", err);
      toast.error(err.message || "Could not load saved audits.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const uid =
      typeof window !== "undefined" ? localStorage.getItem("userId") : "";
    setUserId(uid || "");
    loadSaved(uid);
  }, [loadSaved]);

  const filtered = results.filter((r) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      r.keyword?.toLowerCase().includes(q) ||
      r.businessName?.toLowerCase().includes(q) ||
      r.city?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <Link
            href="/local-rank-tracker"
            className="inline-flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-700 transition-colors mb-3"
          >
            <ArrowLeft size={14} /> Back to Tracker
          </Link>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <div className="bg-yellow-400 p-2 rounded-2xl shadow-lg shadow-yellow-100">
              <Database className="text-white" size={28} strokeWidth={3} />
            </div>
            <span>
              Saved <span className="text-yellow-500">Audits</span>
            </span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            All your saved Local Rank Tracker snapshots.
          </p>
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl p-4 px-6 shadow-xl shadow-slate-100 flex items-center gap-4">
          <div className="bg-slate-900 p-3 rounded-2xl text-yellow-400">
            <LayoutGrid size={20} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-black text-slate-400">
              Total Saved
            </p>
            <p className="text-xl font-black text-slate-800">
              {results.length}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by keyword, business or city..."
          className="w-full pl-12 pr-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-50 transition-all shadow-sm"
        />
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="animate-spin text-yellow-500" size={40} />
          <p className="text-slate-400 font-bold">Loading saved audits...</p>
        </div>
      ) : !userId ? (
        <div className="text-center py-24 bg-white rounded-[28px] border border-slate-200">
          <p className="text-slate-500 font-bold">Not logged in.</p>
          <p className="text-slate-400 text-sm mt-1">
            We couldn&apos;t find your user id in this browser.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-[28px] border border-slate-200">
          <p className="text-slate-500 font-bold">
            {results.length === 0
              ? "No saved audits yet."
              : `No audits match "${query}".`}
          </p>
          {results.length === 0 && (
            <Link
              href="/local-rank-tracker"
              className="inline-block mt-4 px-6 py-3 rounded-2xl bg-slate-900 text-white text-sm font-black hover:bg-black transition-all"
            >
              Run your first audit
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filtered.map((snap) => {
            const isOpen = expandedId === snap._id;
            return (
              <div
                key={snap._id}
                className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-lg font-black text-slate-900 truncate">
                        {snap.keyword || "—"}
                      </p>
                      <p className="text-sm font-bold text-slate-500 flex items-center gap-1.5 mt-1 truncate">
                        <Building2 size={14} className="text-slate-300" />
                        {snap.businessName || "—"}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-400 font-medium">
                        <span className="flex items-center gap-1">
                          <MapPin size={12} /> {snap.city || "—"}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-black uppercase tracking-tighter">
                          {snap.gridSize || "—"}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-3 shrink-0">
                      <div className="text-center bg-amber-50 rounded-2xl px-3 py-2">
                        <Trophy
                          size={14}
                          className="text-amber-500 mx-auto mb-1"
                        />
                        <p className="text-base font-black text-slate-800 leading-none">
                          #{snap.summary?.bestRank || "—"}
                        </p>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">
                          Best
                        </p>
                      </div>
                      <div className="text-center bg-emerald-50 rounded-2xl px-3 py-2">
                        <LayoutGrid
                          size={14}
                          className="text-emerald-500 mx-auto mb-1"
                        />
                        <p className="text-base font-black text-slate-800 leading-none">
                          {snap.summary?.rankedPoints ?? 0}/
                          {snap.summary?.totalPoints ?? 0}
                        </p>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">
                          Coverage
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                      <Clock size={13} /> {formatDate(snap.createdAt)}
                    </span>
                    <button
                      onClick={() => setExpandedId(isOpen ? null : snap._id)}
                      className="flex items-center gap-1.5 text-xs font-black text-slate-600 uppercase tracking-widest hover:text-yellow-600 transition-colors"
                    >
                      {isOpen ? "Hide" : "View"} grid
                      {isOpen ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded grid points */}
                {isOpen && (
                  <div className="bg-slate-50/70 border-t border-slate-100 p-5 space-y-2 max-h-80 overflow-y-auto">
                    {(snap.points || []).map((pt, i) => (
                      <div
                        key={i}
                        className="bg-white rounded-2xl border border-slate-100 p-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {pt.isCenter ? "Center" : `Point ${i + 1}`}
                          </span>
                          <span
                            className={`text-xs font-black px-2.5 py-1 rounded-full ${
                              pt.businessFound
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-rose-50 text-rose-600"
                            }`}
                          >
                            {pt.businessFound
                              ? `Rank #${pt.businessRank}`
                              : "Unranked"}
                          </span>
                        </div>
                        {(pt.competitors || []).length > 0 && (
                          <div className="mt-2 space-y-1">
                            {pt.competitors.slice(0, 3).map((c) => (
                              <div
                                key={c.rank}
                                className="flex items-center justify-between text-[11px] text-slate-500"
                              >
                                <span className="truncate font-medium">
                                  <span className="text-slate-400 mr-1">
                                    #{c.rank}
                                  </span>
                                  {c.name}
                                </span>
                                <span className="text-amber-500 font-bold shrink-0 ml-2">
                                  ★ {c.rating}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
