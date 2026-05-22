"use client";

import { Bot, ChevronRight, MessageCircle, RefreshCw } from "lucide-react";

export default function ChatbotDailyChatCards({
  stats,
  loading,
  activeDay,
  onRefresh,
  onSelectDay,
}) {
  const cards = [
    {
      key: "today",
      title: "Today",
      hint: "Talked to the chatbot today",
      count: stats?.today?.count ?? 0,
      sub: stats?.today?.label || "Today",
      activeClass:
        "bg-emerald-500 text-white border-emerald-600 ring-2 ring-emerald-300 shadow-md",
      idleClass:
        "bg-emerald-50 text-gray-800 border-emerald-200 hover:border-emerald-400 hover:shadow-md hover:bg-emerald-100/80 cursor-pointer",
      iconBgActive: "bg-white/20 text-white",
      iconBgIdle: "bg-emerald-100 text-emerald-700",
    },
    {
      key: "yesterday",
      title: "Yesterday",
      hint: "Talked to the chatbot yesterday",
      count: stats?.yesterday?.count ?? 0,
      sub: stats?.yesterday?.label || "Yesterday",
      activeClass:
        "bg-violet-600 text-white border-violet-700 ring-2 ring-violet-300 shadow-md",
      idleClass:
        "bg-violet-50 text-gray-800 border-violet-200 hover:border-violet-400 hover:shadow-md hover:bg-violet-100/80 cursor-pointer",
      iconBgActive: "bg-white/20 text-white",
      iconBgIdle: "bg-violet-100 text-violet-700",
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-3 py-2 mb-2">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-100 to-indigo-100 flex items-center justify-center shrink-0">
            <Bot className="text-indigo-600" size={16} />
          </div>

          <div className="min-w-0">
            <h3 className="text-xs font-bold text-gray-800 sm:text-sm">
              WhatsApp Chatbot Leads
            </h3>

            <p className="text-[10px] text-gray-500 sm:text-[11px] leading-tight">
              Click card — Only the leads who have started a chat will be
              displayed in the table below.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-[10px] font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50 shrink-0"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 max-w-md">
        {cards.map(
          ({
            key,
            title,
            hint,
            count,
            activeClass,
            idleClass,
            iconBgActive,
            iconBgIdle,
          }) => {
            const active = activeDay === key;

            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelectDay(key)}
                disabled={loading}
                className={`group rounded-md border px-2 py-1.5 text-left transition-all duration-200 active:scale-[0.99] disabled:opacity-60 w-full ${
                  active ? activeClass : idleClass
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                      active ? iconBgActive : iconBgIdle
                    }`}
                  >
                    <MessageCircle size={12} />
                  </div>

                  <ChevronRight
                    size={14}
                    className={`shrink-0 opacity-60 transition group-hover:translate-x-0.5 ${
                      active ? "text-white" : "text-gray-400"
                    }`}
                  />
                </div>

                <p
                  className={`mt-1 text-[8px] font-bold uppercase tracking-wide ${
                    active ? "text-white/90" : "text-gray-500"
                  }`}
                >
                  Chatbot · {title}
                </p>

                <p
                  className={`text-lg font-black tabular-nums leading-none mt-0.5 ${
                    active ? "text-white" : "text-gray-900"
                  }`}
                >
                  {loading ? "…" : count}

                  <span
                    className={`text-[10px] font-bold ml-1 ${
                      active ? "text-white/80" : "text-gray-500"
                    }`}
                  >
                    leads
                  </span>
                </p>

                <p
                  className={`text-[8px] mt-0.5 font-medium line-clamp-1 ${
                    active ? "text-white/85" : "text-gray-600"
                  }`}
                >
                  {hint}
                </p>

                <p
                  className={`text-[8px] font-semibold mt-0.5 flex items-center gap-0.5 ${
                    active ? "text-white" : "text-indigo-600"
                  }`}
                >
                  {active ? "Showing in the table" : "Click — view in table"}

                  <ChevronRight size={9} />
                </p>
              </button>
            );
          },
        )}
      </div>
    </div>
  );
}
