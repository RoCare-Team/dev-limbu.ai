"use client";

import { useEffect, useState } from "react";
import {
  IndianRupee,
  Wallet,
  TrendingUp,
  Users,
} from "lucide-react";

export default function RechargeOverview() {
  const [stats, setStats] = useState({
    totalCount: 0,
    totalAmount: 0,
    todayCount: 0,
  });

  const [recharges, setRecharges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRechargeData();
  }, []);

  const fetchRechargeData = async () => {
    setLoading(true);

    // 🔥 Dummy data (API se replace hoga)
    const data = {
      stats: {
        totalCount: 18,
        totalAmount: 42500,
        todayCount: 3,
      },
      recharges: [
        {
          id: 1,
          name: "Limbu",
          email: "info@limbu.ai",
          amount: 2000,
          date: "2026-01-28",
          status: "Success",
        },
        {
          id: 2,
          name: "Parvesh",
          email: "parvesh@gmail.com",
          amount: 5000,
          date: "2026-01-27",
          status: "Success",
        },
        {
          id: 3,
          name: "Rohit",
          email: "rohit@gmail.com",
          amount: 1500,
          date: "2026-01-27",
          status: "Pending",
        },
      ],
    };

    setStats(data.stats);
    setRecharges(data.recharges);
    setLoading(false);
  };

  return (
    <div className="space-y-8">

      {/* 🔥 Header */}
      <div className="bg-black text-white rounded-2xl p-8">
  <h1 className="text-3xl font-bold">
    Recharge Overview
  </h1>
  <p className="text-gray-300 mt-1">
    Track all user wallet recharges
  </p>
</div>

      {/* 📊 Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          icon={<Wallet />}
          title="Total Recharges"
          value={stats.totalCount}
        />
        <StatCard
          icon={<IndianRupee />}
          title="Total Amount"
          value={`₹ ${stats.totalAmount.toLocaleString()}`}
        />
        <StatCard
          icon={<TrendingUp />}
          title="Today’s Recharges"
          value={stats.todayCount}
        />
      </div>

      {/* 📋 Table */}
      <div className="bg-white rounded-2xl shadow overflow-x-auto">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">
            Recent Recharges
          </h2>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="px-6 py-3 text-left">User</th>
              <th className="px-6 py-3 text-left">Email</th>
              <th className="px-6 py-3 text-left">Amount</th>
              <th className="px-6 py-3 text-left">Date</th>
              <th className="px-6 py-3 text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-6 text-center">
                  Loading...
                </td>
              </tr>
            ) : recharges.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-6 text-center text-gray-500">
                  No recharges found
                </td>
              </tr>
            ) : (
              recharges.map((r) => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">
                    {r.name}
                  </td>
                  <td className="px-6 py-4">
                    {r.email}
                  </td>
                  <td className="px-6 py-4 font-semibold">
                    ₹ {r.amount}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(r.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs ${
                        r.status === "Success"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Components ---------------- */

function StatCard({ icon, title, value }) {
  return (
    <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
      <div className="p-3 rounded-xl bg-indigo-100 text-indigo-600">
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}
