"use client";
import React, { useState, useEffect, useRef } from "react";

export const getLocalStorage = (key) => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return null;
  }
};

const CATEGORY_OPTIONS = [
  "cafe", "restaurant", "hotel", "hospital", "gym",
  "pharmacy", "school", "bank", "salon", "real estate", "interior designer",
];

export default function ScraperModal({ isOpen, onClose, onScrapeComplete }) {
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [limit, setLimit] = useState(50);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");

  const logsEndRef = useRef(null);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const addLog = (msg, type = "info") => {
    setLogs((prev) => [
      ...prev,
      {
        msg,
        type,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      },
    ]);
  };

  const handleScrape = async () => {
    const finalCategory = customCategory.trim() || category;
    const fCode = getLocalStorage("franchise_code");
    setError("");

    if (!fCode) return setError("Franchise session expired. Please login again.");
    if (!city.trim()) return setError("Please enter a target city.");
    if (!finalCategory) return setError("Please select or enter a category.");

    setLoading(true);
    setLogs([]);
    addLog(`🚀 Initializing extraction engine for ${city.toUpperCase()}...`);
    addLog(`🔑 Franchise Authenticated: ${fCode}`);

    try {
      const res = await fetch("/api/franchise-panel/frenchiese-scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city,
          category: finalCategory,
          limit,
          franchiseeCode: fCode,
          // ✅ googleApiKey removed — handled server-side only
        }),
      });

      const data = await res.json();

      if (data.success) {
        addLog(`✅ Extraction Success! Saved ${data.saved} records.`, "success");
        addLog(`📊 Monthly Quota: ${data.totalMonthlyLeads}/2000 used.`, "info");
        addLog(`🔄 Remaining Leads this month: ${data.remainingMonthlyLeads}`, "info");
        if (onScrapeComplete) onScrapeComplete();
      } else {
        const errMsg = data.error || "System Error Occurred";
        addLog(`❌ Process Terminated: ${errMsg}`, "error");
        setError(errMsg);
      }
    } catch (err) {
      addLog(`❌ Connection Interrupted: Check your internet or server.`, "error");
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={loading ? undefined : onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-start justify-between px-8 pt-8 pb-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
              GMB Data Miner
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Extract high-intent local business leads from Google Maps across India.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-40"
          >
            <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        <div className="px-8 pb-8 space-y-3">

          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-xl">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* ── Row 1: Target City | Leads Limit ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Target City Like Noida, Ghaziabad"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full pl-9 pr-3 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-black focus:ring-1 focus:ring-black placeholder:text-slate-400 transition-all"
              />
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
              </span>
              <input
                type="number"
                placeholder="Leads Limit"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className="w-full pl-9 pr-3 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-black focus:ring-1 focus:ring-black placeholder:text-slate-400 transition-all"
              />
            </div>
          </div>

          {/* ── Row 2: Select Category | Custom Category ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                </svg>
              </span>
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setCustomCategory(""); }}
                className="w-full pl-9 pr-3 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-black focus:ring-1 focus:ring-black text-slate-700 appearance-none cursor-pointer transition-all"
              >
                <option value="">Select Category</option>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c} className="capitalize">{c}</option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Custom Category"
                value={customCategory}
                onChange={(e) => { setCustomCategory(e.target.value); setCategory(""); }}
                className="w-full pl-9 pr-3 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-black focus:ring-1 focus:ring-black placeholder:text-slate-400 transition-all"
              />
            </div>
          </div>

          {/* ── Row 3: Terminal Logger (full width) ── */}
          <div className="w-full rounded-2xl overflow-hidden border border-slate-800 bg-[#0a0f16] shadow-lg">
            <div className="flex items-center justify-between px-4 py-2 bg-[#161b22]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3" />
                </svg>
                <span className="text-[10px] font-bold tracking-widest text-slate-500 font-mono">
                  PROCESS_LOGS_V2
                </span>
              </div>
              <div className="w-8" />
            </div>

            <div className="h-40 overflow-y-auto p-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
              {logs.length === 0 && (
                <p className="text-slate-600 text-xs italic text-center mt-10 font-mono">
                  Waiting for parameters... Launch to begin extraction.
                </p>
              )}
              {logs.map((log, i) => (
                <div key={i} className="flex gap-4 font-mono text-xs">
                  <span className="text-slate-600 shrink-0">[{log.time}]</span>
                  <span
                    className={
                      log.type === "success"
                        ? "text-green-400"
                        : log.type === "error"
                        ? "text-red-400"
                        : "text-slate-200"
                    }
                  >
                    {log.msg}
                  </span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>

          {/* ── Row 4: Launch Button (full width) ── */}
          <button
            onClick={handleScrape}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 h-14 rounded-2xl bg-black text-white text-sm font-bold uppercase tracking-wide shadow-lg hover:-translate-y-0.5 hover:bg-neutral-900 active:translate-y-0 transition-all disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed disabled:translate-y-0"
          >
            {loading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Initializing Engine...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Launch Extraction Engine
              </>
            )}
          </button>

        </div>
      </div>
    </div>
  );
}