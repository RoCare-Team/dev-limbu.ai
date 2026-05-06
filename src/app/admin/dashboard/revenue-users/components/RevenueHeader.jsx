

"use client";

import { RefreshCw } from "lucide-react";

export default function RevenueHeader({
  handleRefresh,
  isRefreshing,
  activeView,
  setActiveView,
}) {
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        {/* LEFT SIDE */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight">
            User Onboard Revenue
          </h2>
        </div>

        {/* RIGHT SIDE ACTION */}
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
          bg-gradient-to-r from-indigo-600 to-purple-600 text-white
          shadow-md hover:shadow-lg hover:scale-[1.03] transition-all duration-200
           disabled:opacity-70"
        >
          <RefreshCw
            size={18}
            className={isRefreshing ? "animate-spin" : ""}
          />
          {isRefreshing ? "Refreshing..." : "Refresh Data"}
        </button>
      </div>

      {/* ===== TOGGLE ===== */}
      <div className="flex mb-2">
        <div className="relative flex bg-gray-100 rounded-xl p-1">
          {/* Sliding background */}
          <div
            className={`absolute top-1 bottom-1 w-1/2 rounded-lg transition-all duration-300 ${
              activeView === "package"
                ? "left-1 bg-indigo-600"
                : "left-1/2 bg-purple-600"
            }`}
          />

          {/* PACKAGE */}
          <button
            onClick={() => setActiveView("package")}
            className={`relative z-10 px-5 py-2 text-sm font-medium rounded-lg transition ${
              activeView === "package" ? "text-white" : "text-gray-600"
            }`}
          >
            📦 Package
          </button>

          {/* SERVICE */}
          <button
            onClick={() => setActiveView("service")}
            className={`relative z-10 px-5 py-2 text-sm font-medium rounded-lg transition ${
              activeView === "service" ? "text-white" : "text-gray-600"
            }`}
          >
            🛠 Service
          </button>
        </div>
      </div>
    </>
  );
}