"use client";

import { CheckCircle2, Lock, PlayCircle } from "lucide-react";
import { formatInr } from "@/lib/seoPlans";
import { cycleInfo, offerCycles } from "@/lib/planOffers";

/**
 * Strip above a locked section's tools: entry plan price, Watch Demo and
 * Subscribe Now, or a green "unlocked" note once the user has a matching plan.
 */
export default function UnlockBanner({ offer, unlocked, toolCount, onWatchDemo, onSubscribe }) {
  if (unlocked) {
    return (
      <div className="mt-7 flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 ring-1 ring-emerald-200 sm:mt-8 lg:mt-10">
        <CheckCircle2 size={18} /> {offer.toolsLabel} unlocked, open any tool below.
      </div>
    );
  }

  const cycle = cycleInfo(offer);
  // "Billed quarterly or yearly" when the buyer can pick the cycle in the modal
  const billed = offerCycles(offer).length > 1 ? `Billed ${offerCycles(offer).join(" or ")}` : cycle.billed;
  const [first, ...rest] = offer.tiers;
  // Lowest monthly price of the entry plan across the cycles on offer
  const fromPrice = Math.min(first.perMonth, ...Object.values(first.byCycle || {}).map((c) => c.perMonth || Infinity));
  const others = rest.map((t) => t.title).join(" & ");

  return (
    <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.65)] sm:flex-row sm:items-center sm:justify-between sm:p-5 lg:mt-10">
      <div className="flex items-center gap-3.5">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#facc15] text-slate-950 sm:h-11 sm:w-11">
          <Lock size={18} strokeWidth={2.5} />
        </span>
        <div>
          <p className="text-sm font-black leading-snug text-white sm:text-[15px]">
            {first.title}: {toolCount ? `all ${toolCount} tools` : "everything you need"} from{" "}
            <span className="text-[#facc15]">{formatInr(fromPrice)}{cycle.months === 1 && offer.cycle === "one-time" ? " one-time" : "/month"}</span>
          </p>
          <p className="mt-1 text-[11px] font-semibold text-slate-300 sm:text-xs">
            {billed} + GST{others ? ` · Also available: ${others}` : ""}
          </p>
        </div>
      </div>
      {/* Phones: the two buttons side by side */}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-shrink-0">
        <button
          type="button"
          onClick={onWatchDemo}
          className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-600 bg-slate-900 px-3 sm:px-4 py-2.5 text-sm font-bold text-white transition-colors hover:border-slate-400 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#facc15] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:w-auto"
        >
          <PlayCircle size={15} /> Watch Demo
        </button>
        <button
          type="button"
          onClick={onSubscribe}
          className="min-h-11 w-full whitespace-nowrap rounded-xl bg-[#facc15] px-3 sm:px-5 py-2.5 text-sm font-black text-slate-950 transition-colors hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:w-auto"
        >
          Subscribe Now
        </button>
      </div>
    </div>
  );
}
