"use client";

import { RefreshCw, Package, Wrench } from "lucide-react";

export default function RevenueHeader({
  handleRefresh,
  isRefreshing,
  activeView,
  setActiveView,
}) {
  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        {/* LEFT SIDE: Title & Subtitle */}
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            User Onboard Revenue
          </h2>
          <p className="text-sm text-slate-500">
            Monitor and analyze your onboarding subscription and service performance.
          </p>
        </div>

        {/* RIGHT SIDE ACTION */}
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
          bg-indigo-600 hover:bg-indigo-700 text-white
          shadow-sm hover:shadow-indigo-100 active:scale-[0.98] transition-all duration-200
          disabled:opacity-60 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <RefreshCw
            size={16}
            className={`transition-transform duration-500 ${isRefreshing ? "animate-spin" : ""}`}
          />
          <span>{isRefreshing ? "Refreshing..." : "Refresh Data"}</span>
        </button>
      </div>

      {/* ===== TOGGLE ===== */}
      <div className="flex border-b border-slate-100 pb-4">
        <div className="relative flex bg-slate-100 p-1 rounded-xl w-72 border border-slate-200/30">
          {/* Sliding background */}
          <div
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg transition-all duration-300 ease-out shadow-sm ${
              activeView === "package"
                ? "left-1 bg-indigo-600"
                : "left-[calc(50%+2px)] bg-indigo-600"
            }`}
          />

          {/* PACKAGE */}
          <button
            onClick={() => setActiveView("package")}
            className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors duration-200 focus:outline-none ${
              activeView === "package" ? "text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Package size={16} />
            Package
          </button>

          {/* SERVICE */}
          <button
            onClick={() => setActiveView("service")}
            className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors duration-200 focus:outline-none ${
              activeView === "service" ? "text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Wrench size={16} />
            Service
          </button>
        </div>
      </div>
    </div>
  );
}