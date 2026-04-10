"use client";

import React, { useMemo } from "react";
import {
  calculateMetricsInRange,
  getPerformanceInsightsWindows,
  metricHasObservationsInRange,
  toYmd,
  ymdFromApi,
  isYmdInClosedRange,
} from "@/lib/performanceInsightsUtils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from "recharts";

/* ══════════════════════════════════════════
   SUB-COMPONENTS (Tailwind Optimized)
══════════════════════════════════════════ */

const DeltaBadge = ({ curr, prev, prevKnown }) => {
  if (prevKnown === false || prev === undefined || prev === null) return null;
  if (prev === 0 && curr === 0) return null;

  const diff = prev === 0 ? 100 : ((curr - prev) / prev) * 100;
  const up = diff > 0;
  const flat = Math.abs(diff) < 0.05;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-colors ${
        flat
          ? "bg-slate-100 text-slate-500 border-slate-200"
          : up
            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
            : "bg-rose-50 text-rose-600 border-rose-100"
      }`}
    >
      {flat ? "→" : up ? "▲" : "▼"}{" "}
      {flat ? "0%" : `${Math.abs(diff).toFixed(1)}%`}
    </span>
  );
};

const MetricCard = ({
  label,
  value,
  prevValue,
  prevKnown,
  showComparison,
  icon,
  accentClass,
  softBgClass,
}) => (
  <div
    className={`group bg-pure-white border border-slate-200 rounded-2xl p-5 border-t-4 ${accentClass} shadow-sm hover:shadow-md transition-all duration-300`}
  >
    <div className="flex justify-between items-center mb-3">
      <div
        className={`w-10 h-10 rounded-xl ${softBgClass} flex items-center justify-center text-xl`}
      >
        {icon}
      </div>
      <DeltaBadge
        curr={value}
        prev={prevValue}
        prevKnown={showComparison ? prevKnown : false}
      />
    </div>
    <div>
      <p className="text-[10px] font-bold text-tech-gray uppercase tracking-wider mb-1 font-sans">
        {label}
      </p>
      <p className="text-2xl font-black text-cyber-black leading-none font-heading tracking-tight">
        {Number(value).toLocaleString()}
      </p>
    </div>
    {showComparison && (
      <div className="mt-4 pt-3 border-t border-dashed border-slate-200">
        <p className="text-[9px] text-tech-gray uppercase font-bold mb-1">
          Previous Period
        </p>
        <p className="font-mono text-[11px] font-semibold text-tech-silver">
          {prevKnown ? Number(prevValue).toLocaleString() : "No data"}
        </p>
      </div>
    )}
  </div>
);

const SectionHead = ({ title, sub, accentColor = "bg-blue-600" }) => (
  <div className="mb-6">
    <div className="flex items-center gap-3 mb-1">
      <div className={`w-1 h-6 rounded-full ${accentColor}`} />
      <h3 className="text-lg font-black text-cyber-black font-heading uppercase tracking-tight">
        {title}
      </h3>
    </div>
    {sub && (
      <p className="text-sm text-tech-silver pl-4 font-sans font-medium">
        {sub}
      </p>
    )}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-pure-white border border-slate-200 rounded-xl p-3 shadow-xl ring-1 ring-black/5">
      <p className="text-[10px] text-tech-gray mb-2 font-bold uppercase tracking-widest">
        {label}
      </p>
      {payload.map((p, i) => (
        <p
          key={i}
          className="text-xs font-bold flex justify-between gap-4 py-0.5"
          style={{ color: p.color }}
        >
          <span className="font-sans uppercase">{p.name}:</span>
          <span className="font-mono">{Number(p.value).toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
};

/* ══════════════════════════════════════════
   MAIN REPORT COMPONENT
══════════════════════════════════════════ */
const PerformanceInsightsReport = React.forwardRef((props, ref) => {
  const {
    insightsData,
    businessName,
    locationName,
    city,
    dateRange,
    searchKeywords,
    loading,
  } = props;

  // --- DATA PROCESSING (Stable logic from previous version) ---
  const dvFiltered = (type) => {
    if (!insightsData?.multiDailyMetricTimeSeries) return [];
    const root = insightsData.multiDailyMetricTimeSeries;
    const metric = root[0]?.dailyMetricTimeSeries
      ? root[0].dailyMetricTimeSeries.find((m) => m.dailyMetric === type)
      : root.find((m) => m.dailyMetric === type);
    const all = metric?.timeSeries?.datedValues || [];

    const start = dateRange?.startDate ? toYmd(dateRange.startDate) : null;
    const end = dateRange?.endDate ? toYmd(dateRange.endDate) : null;

    if (!start || !end) return all;
    return all.filter((d) => {
      const ymd = ymdFromApi(d.date);
      return ymd && isYmdInClosedRange(ymd, start, end);
    });
  };

  const windows = useMemo(() => {
    if (!dateRange?.startDate || !dateRange?.endDate) return null;
    return getPerformanceInsightsWindows(
      dateRange.startDate,
      dateRange.endDate,
    );
  }, [dateRange]);

  const periodBreakdown = useMemo(() => {
    if (!insightsData || !windows) return null;
    return {
      cur: calculateMetricsInRange(
        insightsData,
        windows.reportStart,
        windows.reportEnd,
      ),
      prv: calculateMetricsInRange(
        insightsData,
        windows.prevStart,
        windows.prevEnd,
      ),
    };
  }, [insightsData, windows]);

  const prevHasData = useMemo(() => {
    if (!windows || !insightsData) return false;
    return [
      "CALL_CLICKS",
      "WEBSITE_CLICKS",
      "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
    ].some((t) =>
      metricHasObservationsInRange(
        insightsData,
        t,
        toYmd(windows.prevStart),
        toYmd(windows.prevEnd),
      ),
    );
  }, [insightsData, windows]);

  const buildChartData = (pairs) => {
    const map = new Map();
    const MONTH_NAMES = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    pairs.forEach(([series, key]) => {
      series.forEach((d) => {
        const dk = `${d.date.year}-${String(d.date.month).padStart(2, "0")}`;
        const label = `${MONTH_NAMES[d.date.month - 1]} '${String(d.date.year).slice(-2)}`;
        if (!map.has(dk)) map.set(dk, { label });
        const v = parseInt(d.value || 0, 10);
        map.get(dk)[key] = (map.get(dk)[key] || 0) + (isNaN(v) ? 0 : v);
      });
    });
    return Array.from(map.values());
  };

  const monthlyVis = useMemo(
    () =>
      buildChartData([
        [dvFiltered("BUSINESS_IMPRESSIONS_MOBILE_MAPS"), "Maps Views"],
        [dvFiltered("BUSINESS_IMPRESSIONS_MOBILE_SEARCH"), "Search Views"],
      ]),
    [insightsData, dateRange],
  );

  const monthlyEng = useMemo(
    () =>
      buildChartData([
        [dvFiltered("CALL_CLICKS"), "Calls"],
        [dvFiltered("BUSINESS_DIRECTION_REQUESTS"), "Directions"],
        [dvFiltered("WEBSITE_CLICKS"), "Website Clicks"],
      ]),
    [insightsData, dateRange],
  );

  const keywords = useMemo(() => {
    const raw = Array.isArray(searchKeywords)
      ? searchKeywords
      : searchKeywords?.searchKeywordsCounts || [];
    return raw.slice(0, 10);
  }, [searchKeywords]);

  const metrics = periodBreakdown?.cur || {
    totalImpressions: 0,
    totalMapsImpressions: 0,
    totalSearchImpressions: 0,
    totalCalls: 0,
    totalWebsiteClicks: 0,
  };
  const prev = periodBreakdown?.prv || {
    totalImpressions: 0,
    totalMapsImpressions: 0,
    totalSearchImpressions: 0,
    totalCalls: 0,
    totalWebsiteClicks: 0,
  };

  const drLabel = dateRange
    ? `${new Date(dateRange.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} - ${new Date(dateRange.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
    : "Select Dates";

  return (
    <div
      ref={ref}
      className="font-sans bg-deep-charcoal min-h-screen p-6 relative custom-scroll overflow-y-auto"
    >
      {/* LOADING OVERLAY - Prevents style flickering during data swap */}
      {loading && (
        <div className="absolute inset-0 z-50 bg-pure-white/60 backdrop-blur-md flex flex-col items-center justify-center transition-all duration-300">
          <div className="bg-cyber-black text-lemon-glow px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-pulse">
            <div className="w-5 h-5 border-2 border-lemon-glow border-t-transparent rounded-full animate-spin"></div>
            <span className="font-heading font-black uppercase tracking-widest text-sm">
              Syncing Data...
            </span>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <header className="bg-pure-white border border-slate-200 rounded-2xl p-6 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm ring-1 ring-black/5">
        <div>
          <div className="inline-flex items-center gap-2 bg-lemon-glow text-cyber-black px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter mb-3 shadow-lemon">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-black opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyber-black"></span>
            </span>
            Limbu AI Analytics
          </div>
          <h1 className="text-3xl font-black text-cyber-black font-heading tracking-tight leading-none mb-2">
            {businessName || "Business Profile"}
          </h1>
          <p className="text-tech-silver font-medium flex items-center gap-2">
            <span className="text-lg">📍</span> {locationName}{" "}
            {city && <span className="text-slate-300">/</span>} {city}
          </p>
        </div>

        <div className="bg-cyber-black p-4 rounded-xl border border-lemon-glow/30 min-w-[200px] text-right">
          <p className="text-[10px] text-tech-gray font-bold uppercase tracking-widest mb-1">
            Report window
          </p>
          <p className="font-mono text-lemon-glow font-bold text-sm">
            {drLabel}
          </p>
        </div>
      </header>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <MetricCard
          label="Impressions"
          value={metrics.totalImpressions}
          prevValue={prev.totalImpressions}
          prevKnown={prevHasData}
          showComparison={!!windows}
          icon="📊"
          accentClass="border-t-blue-600"
          softBgClass="bg-blue-50 text-blue-600"
        />
        <MetricCard
          label="Maps Views"
          value={metrics.totalMapsImpressions}
          prevValue={prev.totalMapsImpressions}
          prevKnown={prevHasData}
          showComparison={!!windows}
          icon="🗺️"
          accentClass="border-t-emerald-600"
          softBgClass="bg-emerald-50 text-emerald-600"
        />
        <MetricCard
          label="Search Views"
          value={metrics.totalSearchImpressions}
          prevValue={prev.totalSearchImpressions}
          prevKnown={prevHasData}
          showComparison={!!windows}
          icon="🔍"
          accentClass="border-t-amber-500"
          softBgClass="bg-amber-50 text-amber-600"
        />
        <MetricCard
          label="Phone Calls"
          value={metrics.totalCalls}
          prevValue={prev.totalCalls}
          prevKnown={prevHasData}
          showComparison={!!windows}
          icon="☎️"
          accentClass="border-t-violet-600"
          softBgClass="bg-violet-50 text-violet-600"
        />
        <MetricCard
          label="Web Clicks"
          value={metrics.totalWebsiteClicks}
          prevValue={prev.totalWebsiteClicks}
          prevKnown={prevHasData}
          showComparison={!!windows}
          icon="🌐"
          accentClass="border-t-rose-500"
          softBgClass="bg-rose-50 text-rose-600"
        />
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        {/* Chart 1: Visibility */}
        <div className="bg-pure-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <SectionHead
            title="Visibility Trends"
            sub="Organic impressions on Search & Maps"
            accentColor="bg-blue-600"
          />
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyVis} barGap={8}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E2E8F0"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  fontSize={11}
                  fontWeight={700}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748b" }}
                />
                <YAxis
                  fontSize={11}
                  fontWeight={700}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748b" }}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "#f8fafc" }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{
                    paddingTop: "20px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                  }}
                />
                <Bar
                  name="Maps Views"
                  dataKey="Maps Views"
                  fill="#2563EB"
                  radius={[6, 6, 0, 0]}
                  barSize={30}
                />
                <Bar
                  name="Search Views"
                  dataKey="Search Views"
                  fill="#0D9488"
                  radius={[6, 6, 0, 0]}
                  barSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Engagement */}
        <div className="bg-pure-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <SectionHead
            title="User Engagement"
            sub="Direct actions taken by potential customers"
            accentColor="bg-violet-600"
          />
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyEng} barGap={6}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E2E8F0"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  fontSize={11}
                  fontWeight={700}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748b" }}
                />
                <YAxis
                  fontSize={11}
                  fontWeight={700}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748b" }}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "#f8fafc" }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{
                    paddingTop: "20px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                  }}
                />
                <Bar
                  name="Calls"
                  dataKey="Calls"
                  fill="#7C3AED"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  name="Directions"
                  dataKey="Directions"
                  fill="#D97706"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  name="Website"
                  dataKey="Website Clicks"
                  fill="#DB2777"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* KEYWORDS INSIGHTS */}
      <div className="bg-pure-white border border-slate-200 rounded-3xl p-8 shadow-sm mb-8">
        <SectionHead
          title="Search Queries"
          sub="Top keywords leading customers to your business"
          accentColor="bg-lemon-glow"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {keywords.map((kw, i) => (
            <div
              key={i}
              className="flex justify-between items-center p-4 bg-deep-charcoal border border-slate-200 rounded-xl hover:border-lemon-glow/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-md bg-cyber-black text-lemon-glow text-[10px] font-black flex items-center justify-center font-mono">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-sm font-bold text-cyber-black group-hover:text-blue-600 transition-colors">
                  {kw.searchKeyword}
                </span>
              </div>
              <div className="text-right">
                <span className="font-mono text-sm font-black text-cyber-black leading-none block">
                  {Number(
                    kw.insightsValue?.value || kw.insightsValue?.threshold || 0,
                  ).toLocaleString()}
                </span>
                <span className="text-[9px] text-tech-gray font-bold uppercase">
                  Searches
                </span>
              </div>
            </div>
          ))}
          {keywords.length === 0 && (
            <div className="col-span-full py-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <p className="text-tech-gray font-bold uppercase tracking-widest text-sm">
                No Keyword data available for this range
              </p>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <footer className="mt-12 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-cyber-black rounded-lg flex items-center justify-center font-black text-lemon-glow text-xs">
            L
          </div>
          <div>
            <p className="text-xs font-black text-cyber-black font-heading uppercase tracking-tighter">
              Limbu AI
            </p>
            <p className="text-[10px] text-tech-silver font-bold uppercase tracking-widest">
              Performance Engine v4.0
            </p>
          </div>
        </div>
        <p className="font-mono text-[10px] text-tech-gray bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
          DOCUMENT GENERATED ON:{" "}
          <span className="text-cyber-black font-bold">
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </p>
      </footer>
    </div>
  );
});

PerformanceInsightsReport.displayName = "PerformanceInsightsReport";
export default PerformanceInsightsReport;
