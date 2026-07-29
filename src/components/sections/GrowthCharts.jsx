"use client";

import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

/**
 * Recharts ~alone hi homepage ke initial JS ka sabse bada hissa tha, jabki ye
 * charts fold se kaafi neeche hain. Isliye ye file `ClientGrowthSection` se
 * `next/dynamic` ke through load hoti hai — apne alag chunk me.
 */

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

export default function GrowthCharts() {
  return (
    <>
      {/* ── Line Chart: Weekly Views & Impressions ── */}
      <div className="mb-10">
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">
          Weekly Profile Views &amp; Search Impressions
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
            Monthly Calls &amp; Reviews Growth
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
    </>
  );
}
