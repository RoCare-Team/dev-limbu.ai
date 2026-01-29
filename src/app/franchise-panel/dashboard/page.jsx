"use client";

import { useEffect, useState } from "react";
import {
  Crown,
  Users,
  TrendingUp,
  ClipboardList,
  Copy,
  Check,
} from "lucide-react";

export default function FranchiseDashboard() {
  const [user, setUser] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("franchise_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleCopy = async () => {
    if (!user?.referCode) return;
    await navigator.clipboard.writeText(user.referCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">

      {/* 🔥 Hero Section */}
      <div className="bg-gradient-to-r from-black to-gray-800 text-white rounded-2xl p-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Crown className="text-yellow-400" />
            <span className="text-sm uppercase tracking-wide text-gray-300">
              Master Franchise
            </span>
          </div>

          <h1 className="text-3xl font-bold">
            Welcome, {user?.fullName}
          </h1>

          <p className="text-gray-300 mt-1">
            Manage your network & performance from one place
          </p>
        </div>

        {/* 🔑 Refer Code */}
        <div className="mt-6 md:mt-0 bg-white/10 backdrop-blur px-6 py-4 rounded-xl">
          <p className="text-xs text-gray-300 mb-1">
            Your Referral / Coupon Code
          </p>

          <div className="flex items-center gap-3">
            <p className="text-2xl font-bold tracking-widest">
              {user?.referCode || "LIMBU01"}
            </p>

            <button
              onClick={handleCopy}
              className="p-2 rounded-lg hover:bg-white/20 transition"
              title="Copy Code"
            >
              {copied ? (
                <Check size={18} className="text-green-400" />
              ) : (
                <Copy size={18} />
              )}
            </button>
          </div>

          {copied && (
            <p className="text-xs text-green-300 mt-1">
              Code copied!
            </p>
          )}
        </div>
      </div>

      {/* 📊 Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Users />}
          title="Total Team"
          value="42"
          color="bg-blue-500"
        />
        <StatCard
          icon={<ClipboardList />}
          title="Total Leads"
          value="128"
          color="bg-indigo-500"
        />
        <StatCard
          icon={<TrendingUp />}
          title="Conversions"
          value="19"
          color="bg-green-500"
        />
        <StatCard
          icon={<Crown />}
          title="Your Rank"
          value="Master"
          color="bg-yellow-500"
        />
      </div>

      {/* 👥 Team Overview */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">
          Franchise Network Overview
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <InfoBox label="Direct Referrals" value="12" />
          <InfoBox label="Pending Approvals" value="3" />
        </div>
      </div>

      {/* 🚀 Call to Action */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold">
            Grow Your Franchise Network
          </h3>
          <p className="text-sm text-indigo-100 mt-1">
            Share your referral code and expand your team
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="bg-white text-indigo-600 px-6 py-2 rounded-xl font-semibold hover:bg-gray-100 transition flex items-center gap-2"
        >
          {copied ? "Copied!" : "Copy Coupon Code"}
        </button>
      </div>
    </div>
  );
}

/* ----------------- Components ----------------- */

function StatCard({ icon, title, value, color }) {
  return (
    <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
      <div className={`p-3 rounded-xl text-white ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="border rounded-xl p-4 text-center">
      <p className="text-gray-500 text-xs">{label}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
    </div>
  );
}
