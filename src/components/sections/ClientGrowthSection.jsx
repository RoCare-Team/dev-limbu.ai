"use client";

import dynamic from "next/dynamic";
import {
  TrendingUp, MapPin, Phone, Star, Eye
} from "lucide-react";

// Recharts homepage ke initial bundle ka sabse bhaari import tha. Charts fold se
// neeche hain, isliye alag chunk me — jagah reserve rehti hai to CLS bhi nahi aata.
const GrowthCharts = dynamic(() => import("./GrowthCharts"), {
  ssr: false,
  loading: () => <div className="h-[560px] md:h-[480px]" aria-hidden="true" />,
});

const statsCards = [
  { label: "Profile Views",      before: "120", after: "650",  growth: "+442%", icon: <Eye   className="w-4 h-4" />, color: "#EAB308" },
  { label: "Search Impressions", before: "80",  after: "760",  growth: "+850%", icon: <MapPin className="w-4 h-4" />, color: "#3b82f6" },
  { label: "Customer Calls",     before: "12",  after: "134",  growth: "+1016%",icon: <Phone  className="w-4 h-4" />, color: "#10b981" },
  { label: "New Reviews",        before: "2",   after: "18",   growth: "+800%", icon: <Star   className="w-4 h-4" />, color: "#f97316" },
];

// ── Main Component ──
function ClientGrowthSection() {
  return (
    <section
      className="relative w-full py-16 px-6 md:px-10 flex flex-col items-center justify-center border-t border-black/5"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div className="w-full max-w-[1280px] mx-auto">

        {/* ── Headline ── */}
    

        {/* ══════════════════════════════════════════
            GMB GROWTH DASHBOARD
        ══════════════════════════════════════════ */}
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 sm:p-10 shadow-sm">

          {/* Section Label */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-10">
            <div>
              <div
                className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full"
                style={{ background: "rgba(250,204,21,0.1)", border: "1px solid rgba(250,204,21,0.2)" }}
              >
                <TrendingUp className="w-3 h-3" style={{ color: "#EAB308" }} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: "#EAB308" }}>
                  Live GBP Growth Data
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900" style={{ fontFamily: "var(--font-heading)" }}>
                Real User GMB Profile <br />
                <span style={{ color: "#EAB308" }}>Growth — Last 3 Months</span>
              </h3>
              <p className="text-xs font-semibold text-slate-400 mt-1">After joining Limbu.ai · Feb 2026 – Apr 2026</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[11px] font-semibold text-slate-400">Updated weekly</span>
            </div>
          </div>

          {/* ── 4 Stat Cards ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
            {statsCards.map((card, i) => (
              <div
                key={i}
                className="rounded-2xl p-4 border"
                style={{ background: `${card.color}10`, borderColor: `${card.color}25` }}
              >
                <div className="flex items-center gap-1.5 mb-3" style={{ color: card.color }}>
                  {card.icon}
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{card.label}</span>
                </div>
                <div className="flex items-end justify-between mb-2">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400">Before</p>
                    <p className="text-xl font-black text-slate-300">{card.before}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold text-slate-500">Now</p>
                    <p className="text-xl font-black text-slate-900">{card.after}</p>
                  </div>
                </div>
                <div
                  className="text-center py-1 rounded-lg text-[11px] font-black"
                  style={{ background: `${card.color}18`, color: card.color }}
                >
                  {card.growth}
                </div>
              </div>
            ))}
          </div>

          {/* ── Charts (recharts, alag chunk me) ── */}
          <GrowthCharts />

          {/* ── Radar Chart ── */}
        

        </div>
        {/* ── end GMB Dashboard ── */}

      </div>
    </section>
  );
}

export default ClientGrowthSection;