"use client";

import { useEffect, useState, useRef } from "react";
import {
  TrendingUp, MapPin, Phone, Star, Eye
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Defs, linearGradient, stop
} from "recharts";

// ── Easing helper ──
const easeOutQuad = (t) => t * (2 - t);

// ── Animated Counter ──
const AnimatedNumber = ({ end, decimals = 0, suffix = "" }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let startTime = null;
          const duration = 2000;
          const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            setCount(end * easeOutQuad(progress));
            if (progress < 1) window.requestAnimationFrame(animate);
            else setCount(end);
          };
          window.requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, hasAnimated]);

  return (
    <span ref={ref} className="text-5xl tracking-tighter font-light" style={{ color: "var(--foreground)" }}>
      {count.toFixed(decimals)}{suffix}
    </span>
  );
};

// ── Chart Data ──
const weeklyData = [
  { week: "W1",  views: 120, impressions: 80  },
  { week: "W2",  views: 145, impressions: 100 },
  { week: "W3",  views: 160, impressions: 130 },
  { week: "W4",  views: 190, impressions: 170 },
  { week: "W5",  views: 230, impressions: 220 },
  { week: "W6",  views: 280, impressions: 270 },
  { week: "W7",  views: 320, impressions: 330 },
  { week: "W8",  views: 390, impressions: 410 },
  { week: "W9",  views: 450, impressions: 490 },
  { week: "W10", views: 510, impressions: 570 },
  { week: "W11", views: 580, impressions: 660 },
  { week: "W12", views: 650, impressions: 760 },
];

const monthlyCallsData = [
  { month: "Feb", calls: 71,  reviews: 14 },
  { month: "Mar", calls: 198, reviews: 30 },
  { month: "Apr", calls: 429, reviews: 66 },
];

const pieData = [
  { name: "Profile Views",      value: 650,  color: "#EAB308" },
  { name: "Search Impressions", value: 760,  color: "#3b82f6" },
  { name: "Calls",              value: 134,  color: "#10b981" },
  { name: "Reviews",            value: 18,   color: "#f97316" },
];

const radarData = [
  { metric: "Views",       before: 18,  after: 100 },
  { metric: "Impressions", before: 11,  after: 100 },
  { metric: "Calls",       before: 9,   after: 100 },
  { metric: "Reviews",     before: 11,  after: 100 },
  { metric: "Engagement",  before: 12,  after: 100 },
];

const statsCards = [
  { label: "Profile Views",      before: "120", after: "650",  growth: "+442%", icon: <Eye   className="w-4 h-4" />, color: "#EAB308" },
  { label: "Search Impressions", before: "80",  after: "760",  growth: "+850%", icon: <MapPin className="w-4 h-4" />, color: "#3b82f6" },
  { label: "Customer Calls",     before: "12",  after: "134",  growth: "+1016%",icon: <Phone  className="w-4 h-4" />, color: "#10b981" },
  { label: "New Reviews",        before: "2",   after: "18",   growth: "+800%", icon: <Star   className="w-4 h-4" />, color: "#f97316" },
];

// ── Custom Tooltip ──
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="font-black text-slate-500 mb-1 uppercase tracking-widest">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-bold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

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
                  Live GMB Growth Data
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

          {/* ── Line Chart: Weekly Views & Impressions ── */}
          <div className="mb-10">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">
              Weekly Profile Views & Search Impressions
            </p>
            <div className="flex flex-wrap gap-4 mb-3">
              {[{ color: "#EAB308", label: "Profile Views" }, { color: "#3b82f6", label: "Search Impressions" }].map(l => (
                <span key={l.label} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <span className="w-3 h-3 rounded-sm" style={{ background: l.color }} />
                  {l.label}
                </span>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weeklyData}>
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="views"       name="Profile Views"      stroke="#EAB308" strokeWidth={2.5} dot={{ r: 3, fill: "#EAB308" }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="impressions" name="Search Impressions" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3, fill: "#3b82f6" }} strokeDasharray="5 3" activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* ── Pie + Bar side by side ── */}
          <div className="grid md:grid-cols-2 gap-8 mb-10">

            {/* Pie Chart */}
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">
                GMB Activity Distribution
              </p>
              <div className="flex flex-wrap gap-3 mb-3">
                {pieData.map(d => (
                  <span key={d.name} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    {d.name} ({d.value})
                  </span>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart */}
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">
                Monthly Calls & Reviews Growth
              </p>
              <div className="flex flex-wrap gap-3 mb-3">
                {[{ color: "#10b981", label: "Calls" }, { color: "#f97316", label: "Reviews x5" }].map(l => (
                  <span key={l.label} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    <span className="w-3 h-3 rounded-sm" style={{ background: l.color }} />
                    {l.label}
                  </span>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyCallsData} barCategoryGap="35%">
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="calls"   name="Calls"       fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="reviews" name="Reviews x5"  fill="#f97316" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Radar Chart ── */}
        

        </div>
        {/* ── end GMB Dashboard ── */}

      </div>
    </section>
  );
}

export default ClientGrowthSection;