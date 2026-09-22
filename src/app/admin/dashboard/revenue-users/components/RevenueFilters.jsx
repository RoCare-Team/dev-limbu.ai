

"use client";

import { Search } from "lucide-react";

export default function RevenueFilters({
  activeView,
  searchTerm,
  setSearchTerm,
  expiryFilter,
  setExpiryFilter,
  planFilter,
  setPlanFilter,
  statusFilter,
  setStatusFilter,
  showFranchiseOnly,
  setShowFranchiseOnly,
  onExport,
  onExportFyInvoices,
  exportingInvoices = false,
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-t-2xl px-5 py-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        {/* SEARCH */}
        <div className="relative flex-1 min-w-[260px]">
          <input
            type="text"
            placeholder="Search by name, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-11 py-2.5 rounded-xl border border-gray-300 
            text-sm bg-white shadow-sm 
            focus:outline-none focus:ring-2 focus:ring-indigo-500 
            focus:border-indigo-500 transition"
          />

          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
            <Search size={18} />
          </div>
        </div>

        {/* EXPIRY FILTER */}
        <select
          value={expiryFilter}
          onChange={(e) => setExpiryFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-gray-50"
        >
          <option value="">All Expiry</option>

          <option value="expired">Expired Plans</option>

          <option value="today">Expiring Today</option>

          <option value="7days">Expiring In 7 Days</option>

          <option value="15days">Expiring In 15 Days</option>

          <option value="this_month">This Month Expiring</option>
        </select>

        {/* PLAN FILTER */}
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="h-[42px] min-w-[150px] px-3 rounded-xl border border-gray-300 
          text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none"
        >
         {activeView === "package" ? (
  <>
    <option value="">All Plans</option>
    <option value="basic">Basic</option>
    <option value="professional">Professional</option>
    <option value="premium">Premium</option>
  </>
) : (
  <>
    <option value="">All Plans</option>
    <option value="assistance">Assistance</option>
    <option value="creation">Creation</option>
  </>
)}
        </select>

        {/* STATUS FILTER */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-[42px] min-w-[150px] px-3 rounded-xl border border-gray-300 
          text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>

        {/* FRANCHISE USERS CHECKBOX */}
        <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 cursor-pointer hover:bg-gray-100 transition">
          <input
            type="checkbox"
            checked={showFranchiseOnly}
            onChange={(e) => setShowFranchiseOnly(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
          />
          <span className="text-sm font-medium text-gray-700">Franchise Users</span>
        </label>

        {/* CLEAR */}
        <button
          onClick={() => {
            setSearchTerm("");
            setPlanFilter("");
            setStatusFilter("");
            setExpiryFilter("");
            setShowFranchiseOnly(false);
          }}
          className="h-[42px] px-5 rounded-xl text-sm font-medium 
          bg-gray-100 hover:bg-gray-200 border border-gray-300 transition"
        >
          Clear
        </button>

        {/* EXPORT GST (EXCEL) */}
        {onExport && (
          <button
            onClick={onExport}
            className="h-[42px] inline-flex items-center gap-2 px-5 rounded-xl text-sm font-medium
            bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export GST (Excel)
          </button>
        )}

        {/* ALL INVOICES (GST + NON-GST) FROM 1 APRIL TILL TODAY */}
        {onExportFyInvoices && (
          <button
            onClick={onExportFyInvoices}
            disabled={exportingInvoices}
            title="All GST + Non-GST invoices from 1 April (current FY) till today"
            className="h-[42px] inline-flex items-center gap-2 px-5 rounded-xl text-sm font-medium
            bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <svg
              className={`w-4 h-4 ${exportingInvoices ? "animate-bounce" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            {exportingInvoices ? "Preparing..." : "All Invoices Apr–Today (Excel)"}
          </button>
        )}
      </div>
    </div>
  );
}