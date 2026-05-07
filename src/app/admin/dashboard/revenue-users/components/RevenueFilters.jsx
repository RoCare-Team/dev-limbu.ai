

"use client";

import { Search } from "lucide-react";

export default function RevenueFilters({
  searchTerm,
  setSearchTerm,
  expiryFilter,
  setExpiryFilter,
  planFilter,
  setPlanFilter,
  statusFilter,
  setStatusFilter,
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
          <option value="">All Plans</option>
          <option value="basic">Basic</option>
          <option value="professional">Professional</option>
          <option value="premium">Premium</option>
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

        {/* CLEAR */}
        <button
          onClick={() => {
            setSearchTerm("");
            setPlanFilter("");
            setStatusFilter("");
            setExpiryFilter("");
          }}
          className="h-[42px] px-5 rounded-xl text-sm font-medium 
          bg-gray-100 hover:bg-gray-200 border border-gray-300 transition"
        >
          Clear
        </button>
      </div>
    </div>
  );
}