"use client";

import { Gauge, Globe, Search, Share2, ShieldCheck, Smartphone, Wrench } from "lucide-react";
import { scoreColor } from "./auditUi";

const ICONS = {
  SEO: Search,
  Technical: Wrench,
  Performance: Gauge,
  Security: ShieldCheck,
  "Mobile & Accessibility": Smartphone,
  "Social & Local": Share2,
};

/** One card per category; clicking filters the check list to it (click again to clear). */
export default function CategoryCards({ categories, active, onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6 print:grid-cols-3">
      {categories.map((cat) => {
        const Icon = ICONS[cat.name] || Globe;
        const selected = active === cat.name;
        return (
          <button
            key={cat.name}
            type="button"
            onClick={() => onSelect(selected ? null : cat.name)}
            aria-pressed={selected}
            className={`rounded-2xl border bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
              selected ? "border-slate-900 ring-2 ring-slate-900/10" : "border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-700 ring-1 ring-slate-200">
                <Icon size={15} />
              </span>
              <span className="text-xl font-black" style={{ color: scoreColor(cat.score) }}>
                {cat.score}
              </span>
            </div>
            <p className="mt-3 text-sm font-bold leading-tight text-slate-900">{cat.name}</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full" style={{ width: `${cat.score}%`, background: scoreColor(cat.score) }} />
            </div>
            <p className="mt-2 text-[11px] font-semibold text-slate-500">
              {cat.fail > 0 && <span className="text-rose-600">{cat.fail} failed · </span>}
              {cat.warn > 0 && <span className="text-amber-600">{cat.warn} warning{cat.warn > 1 ? "s" : ""} · </span>}
              {cat.pass} passed
            </p>
          </button>
        );
      })}
    </div>
  );
}
