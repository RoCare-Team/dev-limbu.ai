"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  canAccessBookings,
  getFranchiseAuthHeaders,
  getFranchiseUserFromStorage,
} from "@/lib/franchiseAuth";

export default function RevenueShare() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
  const fetchRevenue = async () => {
    try {
      const franchiseUser = getFranchiseUserFromStorage();
      const token = localStorage.getItem("franchise_token");

      if (!canAccessBookings(franchiseUser?.role)) {
        router.replace("/franchise-panel/dashboard");
        return;
      }

      const franchiseCode = franchiseUser?.franchiseCode || "";

      if (!franchiseCode || !token) {
        setError("Franchise session not found");
        return;
      }

      const res = await fetch(
        `/api/franchise-revenue?franchiseCode=${encodeURIComponent(
          franchiseCode,
        )}`,
        { headers: getFranchiseAuthHeaders() },
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.message || "Failed to fetch revenue");
      }

      setRows(json.data || []);
    } catch (err) {
      console.error("Revenue fetch error:", err);
      setError(err.message || "Failed to fetch revenue");
    } finally {
      setLoading(false);
    }
  };

  fetchRevenue();
}, [router]);

  const summary = useMemo(() => {
    const total = rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
    return {
      total,
      franchise: total * 0.5,
      provider: total * 0.5,
    };
  }, [rows]);

  const formatAmount = (amount) =>
    `₹${(Number(amount) || 0).toLocaleString("en-IN")}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return <div className="py-10 text-center font-semibold text-red-600">{error}</div>;
  }

  return (
    <div className="p-2 sm:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-950">Revenue Share</h1>
        <span className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700">
          {rows.length} records
        </span>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <SummaryCard label="Total Revenue" value={formatAmount(summary.total)} />
        <SummaryCard label="Franchise Share (50%)" value={formatAmount(summary.franchise)} />
        <SummaryCard label="Limbu Ai Share (50%)" value={formatAmount(summary.provider)} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-[#1e293b] text-xs uppercase tracking-wider text-white">
                <th className="px-6 py-4 text-left font-semibold">Customer</th>
                <th className="px-6 py-4 text-left font-semibold">Type</th>
                <th className="px-6 py-4 text-left font-semibold">Plan</th>
                <th className="px-6 py-4 text-right font-semibold">Amount</th>
                <th className="px-6 py-4 text-right font-semibold">Franchise 50%</th>
                <th className="px-6 py-4 text-right font-semibold">Provider 50%</th>
                <th className="px-6 py-4 text-right font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {rows.length ? (
                rows.map((row) => {
                  const amount = Number(row.amount) || 0;
                  return (
                    <tr key={row._id} className="hover:bg-gray-50">
                      <td className="px-6 py-5">
                        <div className="font-semibold text-gray-950">
                          {row.leadName || "Customer"}
                        </div>
                        <div className="mt-0.5 text-xs text-gray-500">
                          {row.email || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-5 capitalize text-gray-700">
                        {row.type === "user_onboard" ? "package" : row.type}
                      </td>
                      <td className="px-6 py-5 text-gray-700">{row.plan || "-"}</td>
                      <td className="px-6 py-5 text-right font-bold">
                        {formatAmount(amount)}
                      </td>
                      <td className="px-6 py-5 text-right font-semibold text-emerald-700">
                        {formatAmount(amount * 0.5)}
                      </td>
                      <td className="px-6 py-5 text-right font-semibold text-blue-700">
                        {formatAmount(amount * 0.5)}
                      </td>
                      <td className="px-6 py-5 text-right text-gray-500">
                        {new Date(row.createdAt).toLocaleDateString("en-IN")}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-gray-500">
                    No revenue found for this franchise.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-950">{value}</p>
    </div>
  );
}
