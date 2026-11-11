"use client";

import { Gauge, Globe, History, Loader2, Search } from "lucide-react";

const HIGHLIGHTS = ["50+ checks", "SEO & content", "Speed", "Security & SSL", "Mobile", "Local SEO"];

/** Title, URL box and recent audits. */
export default function AuditForm({ url, setUrl, loading, onSubmit, recent, onPickRecent, error }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 print:hidden">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fef9c3] text-slate-900 ring-1 ring-[#fde68a]">
          <Globe size={20} />
        </span>
        <div>
          <h1 className="text-xl font-black text-slate-900 sm:text-2xl">Website Audit</h1>
          <p className="text-sm text-slate-500">Check any website the way Google does and get a clear fix list.</p>
        </div>
        <span className="ml-auto rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-100">
          Free
        </span>
      </div>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Website URL</span>
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            inputMode="url"
            autoComplete="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter a website, e.g. example.com"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#eab308] focus:bg-white focus:ring-4 focus:ring-[#facc15]/20"
          />
        </label>
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-black text-white transition hover:bg-slate-700 disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Gauge size={16} />}
          {loading ? "Analysing…" : "Run Audit"}
        </button>
      </form>

      {error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 ring-1 ring-rose-100">{error}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {recent.length > 0 ? (
          <>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400">
              <History size={13} /> Recent:
            </span>
            {recent.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onPickRecent(r)}
                disabled={loading}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-200 disabled:opacity-50"
              >
                {r}
              </button>
            ))}
          </>
        ) : (
          HIGHLIGHTS.map((h) => (
            <span key={h} className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
              {h}
            </span>
          ))
        )}
      </div>
    </div>
  );
}
