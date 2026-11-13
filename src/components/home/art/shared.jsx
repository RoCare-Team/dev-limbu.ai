/** Frames and chips shared by the home section screens. */
import { Star } from "lucide-react";

export function Stage({ children }) {
  return (
    <div className="relative mx-auto w-full max-w-[520px] px-2 pb-6 pt-2" aria-hidden="true">
      {children}
    </div>
  );
}

export function Window({ url, children }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_-12px_rgba(15,23,42,0.25)]">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <span className="ml-2 flex-1 truncate rounded-md bg-white px-2 py-0.5 text-[10px] font-medium text-slate-400 ring-1 ring-slate-200">
          {url}
        </span>
      </div>
      {children}
    </div>
  );
}

export function Chip({ className = "", icon: Icon, title, sub }) {
  return (
    <div
      className={`absolute z-10 flex items-center gap-2 rounded-2xl border border-white bg-white px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-[0_14px_34px_rgba(15,23,42,0.16)] ${className}`}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-50 sm:h-8 sm:w-8">
        <Icon size={16} className="text-amber-600" />
      </span>
      <div>
        <div className="text-[11px] font-black leading-tight text-slate-900 sm:text-xs">{title}</div>
        {sub && <div className="text-[10px] font-semibold text-slate-500">{sub}</div>}
      </div>
    </div>
  );
}

export const Stars = ({ size = 11 }) =>
  Array.from({ length: 5 }).map((_, i) => (
    <Star key={i} size={size} className="fill-amber-400 text-amber-400" />
  ));
