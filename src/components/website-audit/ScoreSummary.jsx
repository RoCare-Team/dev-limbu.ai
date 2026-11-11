"use client";

import { Download, ExternalLink, RotateCcw } from "lucide-react";
import { STATUS, scoreColor, scoreLabel } from "./auditUi";

function ScoreRing({ score, size = 132 }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} role="img" aria-label={`Score ${score} out of 100`}>
      <circle cx="60" cy="60" r={r} fill="none" stroke="#f1f5f9" strokeWidth="10" />
      <circle
        cx="60" cy="60" r={r} fill="none" stroke={scoreColor(score)} strokeWidth="10" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} transform="rotate(-90 60 60)"
        className="transition-[stroke-dashoffset] duration-1000"
      />
      <text x="60" y="56" textAnchor="middle" dominantBaseline="central" className="fill-slate-900 text-[30px] font-black">
        {score}
      </text>
      <text x="60" y="80" textAnchor="middle" className="fill-slate-400 text-[10px] font-bold">
        / 100
      </text>
    </svg>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-100">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

/** Overall score, page info, pass/warn/fail counts and key metrics. */
export default function ScoreSummary({ report, onRerun, loading }) {
  const { score, summary, stats, speed } = report;
  return (
    <div className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 lg:grid-cols-[auto_1fr]">
      <div className="flex flex-col items-center justify-center">
        <ScoreRing score={score} />
        <span className="mt-2 rounded-full px-3 py-1 text-xs font-black" style={{ color: scoreColor(score), background: `${scoreColor(score)}14` }}>
          {scoreLabel(score)}
        </span>
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Audit report</p>
            <a href={report.finalUrl} target="_blank" rel="noopener noreferrer" className="mt-1 flex items-center gap-1.5 break-all text-lg font-black text-slate-900 hover:underline">
              {report.finalUrl} <ExternalLink size={14} className="flex-shrink-0 text-slate-400" />
            </a>
            {stats.title && <p className="mt-0.5 truncate text-sm text-slate-500">{stats.title}</p>}
            <p className="text-xs text-slate-400">{new Date(report.auditedAt).toLocaleString("en-IN")} · {summary.total} checks</p>
          </div>
          <div className="flex gap-2 print:hidden">
            <button type="button" onClick={onRerun} disabled={loading} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
              <RotateCcw size={14} /> Re-run
            </button>
            <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
              <Download size={14} /> PDF
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {["fail", "warn", "pass"].map((s) => {
            const { Icon, color, bg, ring, label } = STATUS[s];
            return (
              <span key={s} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1 ${bg} ${color} ${ring}`}>
                <Icon size={13} /> {summary[s]} {label}
              </span>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
          <Metric label="Mobile speed" value={speed ? `${speed.score}/100` : "N/A"} />
          <Metric label="LCP" value={speed?.lcp || "N/A"} />
          <Metric label="Response" value={`${stats.responseMs} ms`} />
          <Metric label="Page size" value={`${stats.htmlKb} KB`} />
          <Metric label="Words" value={stats.words} />
          <Metric label="Links" value={`${stats.internalLinks} in / ${stats.externalLinks} out`} />
        </div>
        {!speed && <p className="mt-2 text-xs text-slate-400">Google speed test was unavailable for this run; other checks are complete.</p>}
      </div>
    </div>
  );
}
