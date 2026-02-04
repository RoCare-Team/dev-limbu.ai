"use client";

import { useEffect, useState } from "react";
import {
  Crown,
  Users,
  TrendingUp,
  ClipboardList,
  Copy,
  Check,
  Share2,
  Link2,
} from "lucide-react";

export default function FranchiseDashboard() {
  const [user, setUser] = useState(null);
  const [copied, setCopied] = useState(false);
  const [leadsCount, setLeadsCount] = useState(0);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("franchise_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await fetch(`/api/franchise-panel/franchise-user`);
      const data = await res.json();

      if (data.success) {
        setLeadsCount(data.users.length);
      }
    } catch (error) {
      console.error("Error fetching leads:", error);
    }
  };

  const handleCopyCoupon = async () => {
    if (!user?.referCode) return;
    await navigator.clipboard.writeText(user.referCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = async () => {
    if (!user?.referCode) return;
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://limbu.ai";
    const referralLink = `${baseUrl}/login?refer=${user.referCode}`;
    await navigator.clipboard.writeText(referralLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
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
          </div>
        </div>
      </div>

      {/* 📊 Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Users />}
          title="Total Team"
          value="0"
          color="bg-blue-500"
        />
        <StatCard
          icon={<ClipboardList />}
          title="Total Leads"
          value={leadsCount}
          color="bg-indigo-500"
        />
        <StatCard
          icon={<TrendingUp />}
          title="Conversions"
          value="0"
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
          <InfoBox label="Direct Referrals" value={leadsCount} />
          <InfoBox label="Pending Approvals" value="0" />
        </div>
      </div>

      {/* 🚀 Call to Action */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Coupon Code Share */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-6 flex flex-col items-center justify-between gap-4">
          <div className="text-center">
            <h3 className="text-xl font-bold">
              Copy Coupon Code
            </h3>
            <p className="text-sm text-indigo-100 mt-1">
              Share with your network
            </p>
          </div>

          <div className="bg-white/20 px-6 py-3 rounded-lg text-center w-full">
            <p className="text-2xl font-bold tracking-widest mb-4">
              {user?.referCode || "LIMBU01"}
            </p>
            <button
              onClick={handleCopyCoupon}
              className="w-full bg-white text-indigo-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <Check size={18} />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={18} />
                  Copy Code
                </>
              )}
            </button>
          </div>
        </div>

        {/* Referral Link Share */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl p-6 flex flex-col items-center justify-between gap-4">
          <div className="text-center">
            <h3 className="text-xl font-bold">
              Copy Referral Link
            </h3>
            <p className="text-sm text-emerald-100 mt-1">
              Auto-fills coupon on signup
            </p>
          </div>

          <div className="bg-white/20 px-4 py-3 rounded-lg text-center w-full break-all text-xs mb-2">
            {typeof window !== "undefined" && user?.referCode ? (
              <p className="text-white/90">
                {window.location.origin}/login?refer={user.referCode}
              </p>
            ) : null}
          </div>

          <button
            onClick={handleCopyLink}
            className="w-full bg-white text-emerald-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition flex items-center justify-center gap-2"
          >
            {linkCopied ? (
              <>
                <Check size={18} />
                Link Copied!
              </>
            ) : (
              <>
                <Link2 size={18} />
                Copy Link
              </>
            )}
          </button>
        </div>
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
