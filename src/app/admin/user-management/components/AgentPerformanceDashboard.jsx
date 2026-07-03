"use client";

import { Phone } from "lucide-react";

// Extracted verbatim from user-management/page.jsx (agent "My Performance"
// dashboard, originally the {isAgent && (...)} block). Behaviour unchanged.
export default function AgentPerformanceDashboard({
  agentTodayLeads,
  stats,
  callStats,
  followUpStats,
  agentTodayDemos,
  leadStatusStats,
  followUpFilter,
  setFollowUpFilter,
  handleChatbotMetricCardClick,
  chatbotMetricFilter,
  stageStats,
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 mb-2 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Phone className="text-indigo-600" size={16} />
          </div>
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
            My Performance
          </h3>
        </div>
        <span className="text-xs text-gray-400">
          {new Date().toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>

      {/* ── Row 1: Leads & Calls ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          {
            label: "Today's Leads",
            value: agentTodayLeads,
            sub: "assigned today",
            from: "from-teal-50",
            to: "to-cyan-50",
            border: "border-teal-100",
            text: "text-teal-600",
            bold: "text-teal-800",
          },
          {
            label: "Total Leads",
            value: stats.total ?? 0,
            sub: "all-time assigned",
            from: "from-indigo-50",
            to: "to-blue-50",
            border: "border-indigo-100",
            text: "text-indigo-600",
            bold: "text-indigo-800",
          },
          {
            label: "Calls Today",
            value: callStats?.myCallsToday ?? 0,
            sub: "handled today",
            from: "from-violet-50",
            to: "to-purple-50",
            border: "border-violet-100",
            text: "text-violet-600",
            bold: "text-violet-800",
          },
          {
            label: "Total Calls",
            value: callStats?.myCallsTotal ?? 0,
            sub: "all-time calls",
            from: "from-blue-50",
            to: "to-sky-50",
            border: "border-blue-100",
            text: "text-blue-600",
            bold: "text-blue-800",
          },
        ].map(({ label, value, sub, from, to, border, text, bold }) => (
          <div
            key={label}
            className={`bg-gradient-to-br ${from} ${to} rounded-lg p-2 border ${border}`}
          >
            <p
              className={`text-[10px] font-semibold uppercase tracking-wide ${text}`}
            >
              {label}
            </p>
            <p className={`text-lg font-bold mt-0.5 ${bold}`}>{value}</p>
            <p className={`text-[10px] mt-0.5 ${text} opacity-70`}>{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Today's demo bookings (from /api/bookDemo) ── */}
      <div>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
          Today Demo Booked
        </p>
        <button
          type="button"
          onClick={() =>
            handleChatbotMetricCardClick({
              metricId: "demoBooked",
              period: "today",
              title: "Today Demo Booked",
              cardKey: "demoBooked:today-agent",
            })
          }
          className={`w-full rounded-lg p-3 border-2 text-left transition-all ${
            chatbotMetricFilter?.cardKey === "demoBooked:today-agent"
              ? "bg-rose-500 text-white border-transparent ring-2 ring-rose-400 shadow-md"
              : "bg-rose-50 text-rose-900 border-rose-200 hover:border-rose-300 hover:bg-rose-100"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p
                className={`text-[9px] font-bold uppercase tracking-wide ${
                  chatbotMetricFilter?.cardKey === "demoBooked:today-agent"
                    ? "text-white/80"
                    : "text-rose-600"
                }`}
              >
                Scheduled for today
              </p>
              <p className="text-2xl font-black mt-0.5">
                {agentTodayDemos.loading ? "…" : agentTodayDemos.count}
              </p>
              <p
                className={`text-[10px] mt-0.5 ${
                  chatbotMetricFilter?.cardKey === "demoBooked:today-agent"
                    ? "text-white/70"
                    : "text-rose-500"
                }`}
              >
                {agentTodayDemos.calendarDate
                  ? `Scheduled ${agentTodayDemos.calendarDate}`
                  : "Click to view demo leads below"}
              </p>
            </div>
            <div
              className={`rounded-full px-3 py-1 text-[10px] font-bold ${
                chatbotMetricFilter?.cardKey === "demoBooked:today-agent"
                  ? "bg-white/20 text-white"
                  : "bg-white text-rose-700 border border-rose-200"
              }`}
            >
              Demo tab
            </div>
          </div>
        </button>
      </div>

      {/* ── Row 2: Follow-up quick stats (clickable → filter leads below) ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {[
          {
            key: "today",
            label: "Today",
            count: followUpStats.todayFollowUps,
            bg: "bg-amber-500",
            ring: "ring-amber-400",
          },
          {
            key: "tomorrow",
            label: "Tomorrow",
            count: followUpStats.tomorrowFollowUps,
            bg: "bg-rose-500",
            ring: "ring-rose-400",
          },
          {
            key: "next7days",
            label: "Next 7 days",
            count: followUpStats.next7DaysFollowUps,
            bg: "bg-violet-500",
            ring: "ring-violet-400",
          },
          {
            key: "thisMonth",
            label: "This Month",
            count: followUpStats.thisMonthFollowUps,
            bg: "bg-emerald-500",
            ring: "ring-emerald-400",
          },
          {
            key: "all",
            label: "All Time",
            count: followUpStats.totalFollowUps,
            bg: "bg-gray-600",
            ring: "ring-gray-400",
          },
        ].map(({ key, label, count, bg, ring }) => {
          const active = followUpFilter === key;
          return (
            <button
              key={key}
              onClick={() => setFollowUpFilter(key)}
              className={`rounded-lg p-2 border-2 text-left transition-all ${
                active
                  ? `${bg} text-white border-transparent ring-2 ${ring} shadow-md`
                  : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-100"
              }`}
            >
              <p
                className={`text-[9px] font-bold uppercase tracking-wide ${active ? "text-white/80" : "text-gray-500"}`}
              >
                Follow-ups
              </p>
              <p
                className={`text-lg font-black mt-0.5 ${active ? "text-white" : "text-gray-800"}`}
              >
                {count}
              </p>
              <p
                className={`text-[10px] mt-0.5 ${active ? "text-white/70" : "text-gray-400"}`}
              >
                {label}
              </p>
            </button>
          );
        })}
      </div>

      {/* Pending follow-ups — same bucket as the table filter */}

      <div>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
          Stages &amp; temperature
        </p>
        <div className="flex flex-wrap gap-1.5">
          {[
            {
              label: "Active",
              v: stageStats["Active"] ?? 0,
              cls: "bg-green-50 text-green-800 border-green-200",
            },
            {
              label: "Follow Up",
              v: stageStats["Follow Up"] ?? 0,
              cls: "bg-amber-50 text-amber-900 border-amber-200",
            },
            {
              label: "Inactive",
              v: stageStats["Inactive"] ?? 0,
              cls: "bg-gray-50 text-gray-800 border-gray-200",
            },
            {
              label: "Onboard",
              v: stageStats["Onboard"] ?? 0,
              cls: "bg-blue-50 text-blue-800 border-blue-200",
            },
            {
              label: "Hot",
              v: leadStatusStats.Hot ?? 0,
              cls: "bg-red-50 text-red-800 border-red-200",
            },
            {
              label: "Warm",
              v: leadStatusStats.Warm ?? 0,
              cls: "bg-orange-50 text-orange-800 border-orange-200",
            },
            {
              label: "Cold",
              v: leadStatusStats.Cold ?? 0,
              cls: "bg-sky-50 text-sky-800 border-sky-200",
            },
          ].map(({ label, v, cls }) => (
            <div
              key={label}
              className={`rounded-md border px-2 py-1 text-center min-w-[3.1rem] ${cls}`}
            >
              <p className="text-[8px] font-bold uppercase opacity-80 leading-tight">
                {label}
              </p>
              <p className="text-sm font-black leading-tight tabular-nums">
                {v}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
