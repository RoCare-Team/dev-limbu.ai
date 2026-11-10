"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Gauge,
  Globe,
  Loader2,
  MessageCircle,
  Search,
  XCircle,
} from "lucide-react";
import { whatsappHref } from "@/lib/seoTools";

const CATEGORIES = ["SEO", "Technical", "Performance", "Mobile & Social"];

const STATUS = {
  pass: { Icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", label: "Passed" },
  warn: { Icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", label: "Needs work" },
  fail: { Icon: XCircle, color: "text-rose-600", bg: "bg-rose-50", label: "Failed" },
};

const scoreColor = (s) => (s >= 80 ? "#16a34a" : s >= 50 ? "#eab308" : "#e11d48");

function ScoreRing({ score }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 120 120" className="h-32 w-32">
      <circle cx="60" cy="60" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
      <circle
        cx="60" cy="60" r={r} fill="none" stroke={scoreColor(score)} strokeWidth="10"
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)}
        transform="rotate(-90 60 60)"
        className="transition-[stroke-dashoffset] duration-1000"
      />
      <text x="60" y="60" textAnchor="middle" dominantBaseline="central" className="fill-slate-900 text-[28px] font-black">
        {score}
      </text>
    </svg>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

export default function WebsiteAuditPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState(null);

  const runAudit = async (e) => {
    e.preventDefault();
    if (!url.trim() || loading) return;
    setLoading(true);
    setError("");
    setReport(null);
    try {
      const res = await fetch("/api/website-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const json = await res.json().catch(() => null);
      if (!json?.success) throw new Error(json?.error || "The audit failed. Please try again.");
      setReport(json.report);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const issues = report?.checks.filter((c) => c.status !== "pass") || [];

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8 print:p-0">
      {/* Print only the report: drop the dashboard chrome and its scroll containers */}
      <style>{`@media print {
        aside, header { display: none !important; }
        .h-screen, .h-full, main { height: auto !important; overflow: visible !important; }
      }`}</style>
      {/* Header + URL box */}
      <div className="rounded-3xl bg-slate-900 p-6 text-white sm:p-8 print:hidden">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-[#facc15]">
          <Globe size={12} /> Website Audit
        </span>
        <h1 className="mt-4 text-2xl font-black sm:text-3xl">Check your website like Google does</h1>
        <p className="mt-1 text-sm text-slate-300">
          Enter a URL to get an SEO, technical, mobile and speed report with a fix list.
        </p>

        <form onSubmit={runAudit} className="mt-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              inputMode="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="example.com"
              className="w-full rounded-xl bg-white py-3.5 pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none ring-2 ring-transparent focus:ring-[#facc15]"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#facc15] px-6 py-3.5 text-sm font-black text-black transition hover:bg-[#eab308] disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Gauge size={16} />}
            {loading ? "Analysing…" : "Run Audit"}
          </button>
        </form>
        {loading && (
          <p className="mt-3 text-xs font-semibold text-slate-400">
            Checking SEO, technical setup and mobile speed. This can take up to a minute.
          </p>
        )}
        {error && (
          <p className="mt-3 rounded-lg bg-rose-500/15 px-3 py-2 text-sm font-semibold text-rose-200">{error}</p>
        )}
      </div>

      {report && (
        <div className="mt-6 space-y-6">
          {/* Summary */}
          <div className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 lg:grid-cols-[auto_1fr]">
            <div className="flex flex-col items-center">
              <ScoreRing score={report.score} />
              <p className="mt-2 text-xs font-black uppercase tracking-widest text-slate-400">Overall score</p>
            </div>
            <div>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-400">Report for</p>
                  <p className="break-all text-lg font-black text-slate-900">{report.finalUrl}</p>
                  <p className="text-xs text-slate-400">{new Date(report.auditedAt).toLocaleString("en-IN")}</p>
                </div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 print:hidden"
                >
                  <Download size={15} /> Download PDF
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {["pass", "warn", "fail"].map((s) => {
                  const { Icon, color, bg, label } = STATUS[s];
                  return (
                    <span key={s} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${bg} ${color}`}>
                      <Icon size={13} /> {report.summary[s]} {label}
                    </span>
                  );
                })}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                <Stat label="Mobile speed" value={report.speed ? `${report.speed.score}/100` : "N/A"} />
                <Stat label="LCP" value={report.speed?.lcp || "N/A"} />
                <Stat label="CLS" value={report.speed?.cls || "N/A"} />
                <Stat label="Response" value={`${report.stats.responseMs} ms`} />
                <Stat label="Words" value={report.stats.words} />
                <Stat label="Images" value={report.stats.images} />
              </div>
              {!report.speed && (
                <p className="mt-2 text-xs text-slate-400">Google speed test was not available for this run, try again later.</p>
              )}
            </div>
          </div>

          {/* Fix list */}
          {issues.length > 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
              <h2 className="text-lg font-black text-slate-900">Fix these first</h2>
              <ol className="mt-4 space-y-3">
                {[...issues]
                  .sort((a, b) => (a.status === b.status ? 0 : a.status === "fail" ? -1 : 1))
                  .map((c, i) => {
                    const { Icon, color } = STATUS[c.status];
                    return (
                      <li key={c.id} className="flex gap-3">
                        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-black text-white">{i + 1}</span>
                        <div>
                          <p className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                            <Icon size={14} className={color} /> {c.label}
                          </p>
                          <p className="text-sm text-slate-600">{c.fix}</p>
                        </div>
                      </li>
                    );
                  })}
              </ol>
              <a
                href={whatsappHref(`Hi Limbu AI, I ran a website audit for ${report.finalUrl} (score ${report.score}/100). Please help me fix the issues.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-white hover:bg-emerald-600 print:hidden"
              >
                <MessageCircle size={16} /> Get our team to fix it
              </a>
            </div>
          )}

          {/* All checks by category */}
          <div className="grid gap-6 lg:grid-cols-2">
            {CATEGORIES.map((cat) => {
              const rows = report.checks.filter((c) => c.category === cat);
              if (!rows.length) return null;
              return (
                <div key={cat} className="rounded-3xl border border-slate-200 bg-white p-6 break-inside-avoid">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">{cat}</h3>
                  <ul className="mt-3 divide-y divide-slate-100">
                    {rows.map((c) => {
                      const { Icon, color } = STATUS[c.status];
                      return (
                        <li key={c.id} className="flex items-start gap-3 py-2.5">
                          <Icon size={16} className={`mt-0.5 flex-shrink-0 ${color}`} />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-800">{c.label}</p>
                            <p className="break-words text-xs text-slate-500">{c.value}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
