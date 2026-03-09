"use client";

import React, { useMemo } from "react";
import {
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis,
  CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
  LabelList,
} from "recharts";

/* ══════════════════════════════════════════
   DESIGN TOKENS — crisp light palette
══════════════════════════════════════════ */
const C = {
  bg:         "#F0F4F9",
  surface:    "#FFFFFF",
  border:     "#E2E8F0",
  textPri:    "#0F172A",
  textSec:    "#475569",
  textMute:   "#94A3B8",
  blue:       "#2563EB",
  blueSoft:   "#EFF6FF",
  teal:       "#0D9488",
  tealSoft:   "#F0FDFA",
  amber:      "#D97706",
  amberSoft:  "#FFFBEB",
  violet:     "#7C3AED",
  violetSoft: "#F5F3FF",
  rose:       "#DB2777",
  roseSoft:   "#FDF2F8",
  green:      "#16A34A",
  greenSoft:  "#F0FDF4",
  prevBar:    "#CBD5E1",
};

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fmt = (n = 0) => Number(n).toLocaleString();
const avg = (n, d = 30) => (n / d).toFixed(1);

/* ══════════════════════════════════════════
   KEYWORD COLORS
══════════════════════════════════════════ */
const KW_COLORS = [C.blue, C.teal, C.violet, C.amber, C.rose];

/* ══════════════════════════════════════════
   FONT
══════════════════════════════════════════ */
const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .pir { font-family: 'Plus Jakarta Sans', sans-serif; -webkit-font-smoothing: antialiased; }
  .pir-mono { font-family: 'JetBrains Mono', monospace; }
  .pir-card:hover { transform: translateY(-1px); transition: transform 0.2s; }
`;

/* ══════════════════════════════════════════
   HELPERS
══════════════════════════════════════════ */
const DeltaBadge = ({ curr, prev }) => {
  if (!prev || prev === 0) return null;
  const diff = ((curr - prev) / prev) * 100;
  const up = diff >= 0;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:2,
      fontSize:11, fontWeight:700,
      color: up ? C.green : C.rose,
      background: up ? C.greenSoft : C.roseSoft,
      padding:"2px 7px", borderRadius:99,
      border: `1px solid ${up ? C.green : C.rose}22`,
    }}>
      {up ? "▲" : "▼"} {Math.abs(diff).toFixed(1)}%
    </span>
  );
};

const MetricCard = ({ label, value, prevValue, icon, accent, soft }) => (
  <div className="pir-card" style={{
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    padding: "20px 18px",
    borderTop: `4px solid ${accent}`,
    boxShadow: "0 1px 8px rgba(15,23,42,0.06)",
    display: "flex", flexDirection: "column", gap: 10,
    transition: "box-shadow 0.2s",
  }}>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
      <div style={{
        width: 40, height: 40, borderRadius: 11,
        background: soft,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize: 20,
      }}>{icon}</div>
      <DeltaBadge curr={value} prev={prevValue} />
    </div>
    <p style={{ fontSize: 11, fontWeight: 700, color: C.textMute, textTransform:"uppercase", letterSpacing:"0.07em" }}>
      {label}
    </p>
    <p style={{ fontSize: 32, fontWeight: 800, color: accent, lineHeight: 1, letterSpacing:"-0.02em" }}>
      {fmt(value)}
    </p>
    {prevValue != null && (
      <p style={{ fontSize: 11, color: C.textMute }}>
        Last month: <b style={{ color: C.textSec }}>{fmt(prevValue)}</b>
      </p>
    )}
  </div>
);

const SectionHead = ({ title, sub, accent = C.blue }) => (
  <div style={{ marginBottom: 18 }}>
    <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom: 3 }}>
      <div style={{ width: 4, height: 22, borderRadius: 99, background: accent, flexShrink: 0 }} />
      <h3 style={{ fontSize: 16, fontWeight: 800, color: C.textPri, letterSpacing:"-0.01em" }}>{title}</h3>
    </div>
    {sub && <p style={{ fontSize: 12, color: C.textSec, paddingLeft: 13 }}>{sub}</p>}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 10, padding: "10px 14px",
      boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
    }}>
      <p style={{ fontSize: 11, color: C.textMute, marginBottom: 6, fontWeight: 600 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: 13, fontWeight: 700, color: p.color, marginBottom: 2 }}>
          {p.name}: <span style={{ fontFamily:"'JetBrains Mono',monospace" }}>{Number(p.value).toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
};

/* ══════════════════════════════════════════
   DATA BUILDERS
══════════════════════════════════════════ */
const buildMonthly = (pairs) => {
  const map = new Map();
  pairs.forEach(([series, key]) => {
    (series || []).forEach((d) => {
      const mk = `${d.date.year}-${String(d.date.month).padStart(2,"0")}`;
      const label = `${MONTH_NAMES[d.date.month - 1]} '${String(d.date.year).slice(-2)}`;
      if (!map.has(mk)) map.set(mk, { mk, label });
      const v = typeof d.value === "string" ? parseInt(d.value, 10) : (d.value || 0);
      map.get(mk)[key] = (map.get(mk)[key] || 0) + (isNaN(v) ? 0 : v);
    });
  });
  return Array.from(map.values()).sort((a, b) => a.mk.localeCompare(b.mk));
};

const buildDaily = (pairs) => {
  const map = new Map();
  pairs.forEach(([series, key]) => {
    (series || []).forEach((d) => {
      const dk = `${d.date.year}-${String(d.date.month).padStart(2,"0")}-${String(d.date.day).padStart(2,"0")}`;
      const label = `${d.date.day}/${d.date.month}`;
      if (!map.has(dk)) map.set(dk, { dk, label });
      const v = typeof d.value === "string" ? parseInt(d.value, 10) : (d.value || 0);
      map.get(dk)[key] = (map.get(dk)[key] || 0) + (isNaN(v) ? 0 : v);
    });
  });
  return Array.from(map.values()).sort((a, b) => a.dk.localeCompare(b.dk));
};

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
const PerformanceInsightsReport = React.forwardRef((
  { insightsData, businessName, locationName, city, locality, dateRange, storedMetrics, searchKeywords },
  ref
) => {

  const getMetric = (type) => {
    if (!insightsData?.multiDailyMetricTimeSeries) return null;
    const root = insightsData.multiDailyMetricTimeSeries;
    if (root[0]?.dailyMetricTimeSeries)
      return root[0].dailyMetricTimeSeries.find(m => m.dailyMetric === type);
    return root.find(m => m.dailyMetric === type);
  };
  const dv = (type) => getMetric(type)?.timeSeries?.datedValues || [];
  const calcTotal = (type) => dv(type).reduce((s, d) => {
    const v = typeof d.value === "string" ? parseInt(d.value,10) : (d.value||0);
    return s + (isNaN(v) ? 0 : v);
  }, 0);

  /* prev month key */
  const now = new Date();
  const prevDate = new Date(now.getFullYear(), now.getMonth()-1, 1);
  const prevM = `${prevDate.getFullYear()}-${String(prevDate.getMonth()+1).padStart(2,"0")}`;

  const monthTotal = (type, mk) => dv(type).reduce((s, d) => {
    if (`${d.date.year}-${String(d.date.month).padStart(2,"0")}` !== mk) return s;
    const v = typeof d.value === "string" ? parseInt(d.value,10) : (d.value||0);
    return s + (isNaN(v) ? 0 : v);
  }, 0);

  /* metrics */
  const metrics = useMemo(() => {
    if (storedMetrics && Object.keys(storedMetrics).length > 0) {
      const maps = storedMetrics.totalMapsImpressions || 0;
      const search = storedMetrics.totalSearchImpressions || 0;
      return { maps, search, calls: storedMetrics.totalCalls||0, website: storedMetrics.totalWebsiteClicks||0, dirs: storedMetrics.totalDirections||0, total: maps+search };
    }
    const maps = calcTotal("BUSINESS_IMPRESSIONS_MOBILE_MAPS");
    const search = calcTotal("BUSINESS_IMPRESSIONS_MOBILE_SEARCH");
    return { maps, search, calls: calcTotal("CALL_CLICKS"), website: calcTotal("WEBSITE_CLICKS"), dirs: calcTotal("BUSINESS_DIRECTION_REQUESTS"), total: maps+search };
  }, [insightsData, storedMetrics]);

  const prev = useMemo(() => ({
    maps:    monthTotal("BUSINESS_IMPRESSIONS_MOBILE_MAPS",   prevM),
    search:  monthTotal("BUSINESS_IMPRESSIONS_MOBILE_SEARCH", prevM),
    calls:   monthTotal("CALL_CLICKS",                        prevM),
    website: monthTotal("WEBSITE_CLICKS",                     prevM),
    dirs:    monthTotal("BUSINESS_DIRECTION_REQUESTS",        prevM),
  }), [insightsData]);

  /* chart data */
  const monthlyVis = useMemo(() => buildMonthly([
    [dv("BUSINESS_IMPRESSIONS_MOBILE_MAPS"),   "Maps Views"],
    [dv("BUSINESS_IMPRESSIONS_MOBILE_SEARCH"), "Search Views"],
  ]), [insightsData]);

  const monthlyEng = useMemo(() => buildMonthly([
    [dv("CALL_CLICKS"),                        "Calls"],
    [dv("BUSINESS_DIRECTION_REQUESTS"),        "Directions"],
    [dv("WEBSITE_CLICKS"),                     "Website Clicks"],
  ]), [insightsData]);

  const dailyVis = useMemo(() => buildDaily([
    [dv("BUSINESS_IMPRESSIONS_MOBILE_MAPS"),   "Maps Views"],
    [dv("BUSINESS_IMPRESSIONS_MOBILE_SEARCH"), "Search Views"],
  ]).slice(-30), [insightsData]);

  // Handle different formats of searchKeywords - could be array, object with searchKeywordsCounts, or null
  const keywords = Array.isArray(searchKeywords) 
    ? searchKeywords 
    : (searchKeywords?.searchKeywordsCounts || []);

  const drLabel = dateRange
    ? `${new Date(dateRange.startDate).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})} – ${new Date(dateRange.endDate).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}`
    : "";

  /* ═════════════ RENDER ═════════════ */
  return (
    <>
      <style>{FONTS}</style>
      <div ref={ref} className="pir" style={{ background: C.bg, minHeight:"100vh", padding:"28px 24px", color: C.textPri }}>

        {/* HEADER */}
        <div style={{
          background: C.surface, border:`1px solid ${C.border}`,
          borderRadius: 18, padding:"22px 26px", marginBottom: 20,
          display:"flex", justifyContent:"space-between", alignItems:"flex-start",
          boxShadow:"0 2px 16px rgba(15,23,42,0.07)",
        }}>
          <div>
            <div style={{ marginBottom:10, display:"flex", alignItems:"center", gap:8 }}>
              <div style={{
                background: C.blueSoft, border:`1px solid ${C.blue}22`,
                borderRadius:8, padding:"4px 12px",
                fontSize:11, fontWeight:700, color:C.blue, letterSpacing:"0.05em",
              }}>
              LIMBU AI · ANALYTICS
              </div>
            </div>
            <h1 style={{ fontSize:28, fontWeight:800, color:C.textPri, letterSpacing:"-0.02em", marginBottom:6 }}>
              {businessName || "Performance Report"}
            </h1>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <p style={{ fontSize:13, color:C.textSec, fontWeight: 500 }}>📍 {locationName}{city || locality ? `, ${[city, locality].filter(Boolean).join(", ")}` : ""}</p>
            </div>
          </div>
          <div style={{
            background: C.blueSoft, border:`1px solid ${C.blue}22`,
            borderRadius:12, padding:"12px 18px", textAlign:"right",
          }}>
            <p style={{ fontSize:10, color:C.textMute, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>Report Period</p>
            <p className="pir-mono" style={{ fontSize:12, fontWeight:600, color:C.blue }}>{drLabel}</p>
          </div>
        </div>

        {/* METRIC CARDS */}
        <div style={{
          display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(170px,1fr))",
          gap:14, marginBottom:20,
        }}>
          <MetricCard label="Total Impressions" value={metrics.total}   prevValue={prev.maps+prev.search} icon="📊" accent={C.blue}   soft={C.blueSoft}   />
          <MetricCard label="Maps Views"        value={metrics.maps}   prevValue={prev.maps}             icon="🗺️" accent={C.teal}   soft={C.tealSoft}   />
          <MetricCard label="Search Views"      value={metrics.search} prevValue={prev.search}           icon="🔍" accent={C.amber}  soft={C.amberSoft}  />
          <MetricCard label="Calls"             value={metrics.calls}  prevValue={prev.calls}            icon="☎️" accent={C.violet} soft={C.violetSoft} />
          <MetricCard label="Website Clicks"    value={metrics.website}prevValue={prev.website}          icon="🌐" accent={C.rose}   soft={C.roseSoft}   />
        </div>

        {/* ROW: Monthly Visibility Chart */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:16, marginBottom:16, alignItems:"start" }}>

          {/* Monthly Visibility */}
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:18, padding:"22px 20px", boxShadow:"0 1px 8px rgba(15,23,42,0.05)" }}>
            <SectionHead title="Monthly Visibility" sub="Maps & Search impressions grouped by month" accent={C.blue} />
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyVis} barGap={4} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                <XAxis dataKey="label" tick={{ fill:C.textMute, fontSize:11 }} stroke="transparent" />
                <YAxis tick={{ fill:C.textMute, fontSize:11 }} stroke="transparent" width={34} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize:11, color:C.textSec, paddingTop:8 }} />
                <Bar dataKey="Maps Views" fill={C.blue} radius={[5,5,0,0]} maxBarSize={40}>
                  <LabelList dataKey="Maps Views" position="top" formatter={(val) => val > 0 ? fmt(val) : ''} style={{ fontSize: 10, fontWeight: 600, fill: C.textSec }} />
                </Bar>
                <Bar dataKey="Search Views" fill={C.teal} radius={[5,5,0,0]} maxBarSize={40}>
                  <LabelList dataKey="Search Views" position="top" formatter={(val) => val > 0 ? fmt(val) : ''} style={{ fontSize: 10, fontWeight: 600, fill: C.textSec }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Engagement */}
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:18, padding:"22px 20px", marginBottom:16, boxShadow:"0 1px 8px rgba(15,23,42,0.05)" }}>
          <SectionHead title="Monthly Engagement" sub="Calls, Directions & Website Clicks per month" accent={C.violet} />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyEng} barGap={4} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="label" tick={{ fill:C.textMute, fontSize:11 }} stroke="transparent" />
              <YAxis tick={{ fill:C.textMute, fontSize:11 }} stroke="transparent" width={34} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize:11, color:C.textSec, paddingTop:8 }} />
              <Bar dataKey="Calls" fill={C.violet} radius={[5,5,0,0]} maxBarSize={36}>
                <LabelList dataKey="Calls" position="top" formatter={(val) => val > 0 ? fmt(val) : ''} style={{ fontSize: 10, fontWeight: 600, fill: C.textSec }} />
              </Bar>
              <Bar dataKey="Directions" fill={C.amber} radius={[5,5,0,0]} maxBarSize={36}>
                <LabelList dataKey="Directions" position="top" formatter={(val) => val > 0 ? fmt(val) : ''} style={{ fontSize: 10, fontWeight: 600, fill: C.textSec }} />
              </Bar>
              <Bar dataKey="Website Clicks" fill={C.rose} radius={[5,5,0,0]} maxBarSize={36}>
                <LabelList dataKey="Website Clicks" position="top" formatter={(val) => val > 0 ? fmt(val) : ''} style={{ fontSize: 10, fontWeight: 600, fill: C.textSec }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Keyword Insights */}
        <div style={{
          background:C.surface, border:`1px solid ${C.border}`,
          borderRadius:18, padding:"18px 22px", marginBottom:24,
          boxShadow:"0 1px 8px rgba(15,23,42,0.05)",
          pageBreakInside: "avoid",
        }}>
          <SectionHead title="Keyword Insights" sub="Search keywords and their total counts for selected period" accent={C.teal} />

          {keywords.length === 0 ? (
            <div style={{ padding:"20px 0", textAlign:"center", color:C.textMute, fontSize:13 }}>
              <div style={{ fontSize:24, marginBottom:8 }}>🔑</div>
              No keyword data available for this period.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
              {keywords.map((kw, idx) => {
                // Handle both value and threshold properties
                const value = kw.insightsValue?.value;
                const threshold = kw.insightsValue?.threshold;
                const displayValue = value || threshold || "0";
                const isThreshold = !!threshold && !value;

                return (
                  <div key={idx} style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    background: C.bg,
                    borderRadius: 10,
                    border: `1px solid ${C.border}`,
                    boxShadow: "0 1px 3px rgba(15,23,42,0.08)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 6,
                        background: KW_COLORS[idx % KW_COLORS.length],
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 800, color: "#fff",
                        flexShrink: 0,
                      }}>
                        {idx + 1}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: C.textPri,
                          textTransform: "capitalize",
                          marginBottom: 1,
                          wordBreak: "break-word",
                          lineHeight: 1.2,
                        }}>
                          {kw.searchKeyword}
                        </p>
                        {isThreshold && (
                          <p style={{
                            fontSize: 9,
                            color: C.textMute,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}>
                            Minimum threshold
                          </p>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: isThreshold ? C.amber : KW_COLORS[idx % KW_COLORS.length],
                        lineHeight: 1,
                      }}>
                        {fmt(displayValue)}
                      </p>
                      <p style={{
                        fontSize: 8,
                        color: C.textMute,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}>
                        {isThreshold ? "threshold" : "searches"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Total Keywords Found */}
          <div style={{
            marginTop: 20, padding:"16px 20px",
            background:C.tealSoft, border:`1px solid ${C.teal}33`,
            borderRadius:14, display:"flex", justifyContent:"space-between", alignItems:"center",
          }}>
            <div>
              <p style={{ fontSize:11, color:C.textMute, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>Total Keywords Found</p>
              <p style={{ fontSize:32, fontWeight:800, color:C.teal, lineHeight:1 }}>{keywords.length}</p>
            </div>
            <span style={{ fontSize:32 }}>🔍</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:18, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{
              width:30, height:30, borderRadius:8,
              background:C.blueSoft, border:`1px solid ${C.blue}33`,
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:15,
            }}>⚡</div>
            <span style={{ fontSize:13, fontWeight:800, color:C.blue }}>Limbu AI</span>
            <span style={{ fontSize:12, color:C.textMute }}>Performance Analytics</span>
          </div>
          <p className="pir-mono" style={{ fontSize:11, color:C.textMute }}>
            Generated {new Date().toLocaleDateString("en-US",{ year:"numeric", month:"long", day:"numeric" })}
          </p>
        </div>

      </div>
    </>
  );
});

PerformanceInsightsReport.displayName = "PerformanceInsightsReport";
export default PerformanceInsightsReport;