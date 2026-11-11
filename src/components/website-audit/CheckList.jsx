"use client";

import { useState } from "react";
import { ChevronDown, Lightbulb, X } from "lucide-react";
import { SEVERITY, STATUS, byPriority } from "./auditUi";

const FILTERS = [
  { id: "issues", label: "All issues", test: (c) => c.status !== "pass" },
  { id: "fail", label: "Failed", test: (c) => c.status === "fail" },
  { id: "warn", label: "Warnings", test: (c) => c.status === "warn" },
  { id: "pass", label: "Passed", test: (c) => c.status === "pass" },
  { id: "all", label: "All checks", test: () => true },
];

function CheckRow({ check, open, onToggle }) {
  const { Icon, color } = STATUS[check.status];
  const sev = SEVERITY[check.severity];
  return (
    <li className="break-inside-avoid">
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50">
        <Icon size={18} className={`mt-0.5 flex-shrink-0 ${color}`} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-slate-900">{check.label}</p>
            {check.status !== "pass" && <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${sev.cls}`}>{sev.label}</span>}
            <span className="text-[11px] font-semibold text-slate-400">{check.category}</span>
          </div>
          <p className="mt-0.5 break-words text-xs text-slate-500">{check.value}</p>
        </div>
        <ChevronDown size={16} className={`mt-1 flex-shrink-0 text-slate-400 transition-transform print:hidden ${open ? "rotate-180" : ""}`} />
      </button>
      {/* Always shown in print so the PDF has the full fix list */}
      <div className={`${open ? "block" : "hidden"} px-4 pb-4 pl-11 print:block`}>
        <p className="text-xs leading-relaxed text-slate-500">{check.why}</p>
        {check.fix && (
          <p className="mt-2 flex items-start gap-2 rounded-lg bg-[#fefce8] px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-[#fde68a]">
            <Lightbulb size={14} className="mt-0.5 flex-shrink-0 text-[#ca8a04]" /> {check.fix}
          </p>
        )}
      </div>
    </li>
  );
}

/** Filterable list of checks, highest priority first. */
export default function CheckList({ checks, category, onClearCategory }) {
  const [filter, setFilter] = useState("issues");
  const [openId, setOpenId] = useState(null);

  const inCategory = category ? checks.filter((c) => c.category === category) : checks;
  const active = FILTERS.find((f) => f.id === filter);
  const rows = inCategory.filter(active.test).sort(byPriority);

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-4 print:hidden">
        {FILTERS.map((f) => {
          const n = inCategory.filter(f.test).length;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                filter === f.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f.label} <span className="opacity-60">{n}</span>
            </button>
          );
        })}
        {category && (
          <button type="button" onClick={onClearCategory} className="ml-auto inline-flex items-center gap-1 rounded-full bg-[#fef9c3] px-3 py-1.5 text-xs font-bold text-slate-800 ring-1 ring-[#fde68a]">
            {category} <X size={12} />
          </button>
        )}
      </div>

      {rows.length ? (
        <ul className="divide-y divide-slate-100">
          {rows.map((c) => (
            <CheckRow key={c.id} check={c} open={openId === c.id} onToggle={() => setOpenId(openId === c.id ? null : c.id)} />
          ))}
        </ul>
      ) : (
        <p className="p-8 text-center text-sm font-semibold text-slate-400">Nothing here. Nice work!</p>
      )}
    </div>
  );
}
