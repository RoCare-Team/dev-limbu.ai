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
  ExternalLink,
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

  const copyToClipboard = async (text) => {
    try {
      // Modern clipboard API
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.width = "2em";
      textArea.style.height = "2em";
      textArea.style.padding = "0";
      textArea.style.border = "none";
      textArea.style.outline = "none";
      textArea.style.boxShadow = "none";
      textArea.style.background = "transparent";
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);
        return successful;
      } catch (err) {
        document.body.removeChild(textArea);
        return false;
      }
    } catch (err) {
      console.error("Failed to copy:", err);
      return false;
    }
  };

  const handleCopyCoupon = async () => {
    if (user?.referCode) {
      console.log("Copying coupon code:", user.referCode); // Debug log
      
      const success = await copyToClipboard(user.referCode);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        alert("Failed to copy code. Please try again.");
      }
    }
  };

  const handleCopyLink = async () => {
    if (user?.referCode) {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://limbu.ai";
      const referralLink = `${baseUrl}/login?refer=${user.referCode}`;
      
      console.log("Copying referral link:", referralLink); // Debug log
      
      const success = await copyToClipboard(referralLink);
      if (success) {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      } else {
        alert("Failed to copy link. Please try again.");
      }
    }
  };

  const handleShare = async (type) => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://limbu.ai";
    const referralLink = `${baseUrl}/login?refer=${user?.referCode}`;
    const text = type === 'code' 
      ? `Join Limbu.ai using my referral code: ${user?.referCode}`
      : `Join Limbu.ai using my referral link: ${referralLink}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Limbu.ai',
          text: text,
        });
      } catch (err) {
        console.error("Share failed:", err);
      }
    }
  };

  const getReferralLink = () => {
    if (user?.referCode) {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://limbu.ai";
      return `${baseUrl}/login?refer=${user.referCode}`;
    }
    return "https://limbu.ai/login?refer=LIMBU01";
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

        {/* 🔑 Refer Code - Compact Display */}
        <div className="mt-6 md:mt-0 bg-white/10 backdrop-blur px-6 py-4 rounded-xl">
          <p className="text-xs text-gray-300 mb-1">
            Your Referral Code
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

      {/* 🎯 Referral Section - Enhanced Design */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Share2 className="text-indigo-600" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Share Your Referral
            </h2>
            <p className="text-sm text-gray-500">
              Grow your network by sharing your unique code or link
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coupon Code Card */}
          <div className="border-2 border-indigo-200 rounded-xl p-6 hover:border-indigo-400 transition-colors">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Copy className="text-indigo-600" size={20} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Referral Code
              </h3>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Share this code with your network. They can enter it during signup.
            </p>

            {/* Code Display */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 mb-4 border border-indigo-200">
              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">
                Your Coupon Code
              </p>
              <p className="text-3xl font-bold text-indigo-600 tracking-widest text-center py-2">
                {user?.referCode || "LIMBU01"}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleCopyCoupon}
                className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                {copied ? (
                  <>
                    <Check size={20} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={20} />
                    Copy Code
                  </>
                )}
              </button>
              {navigator.share && (
                <button
                  onClick={() => handleShare('code')}
                  className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                  title="Share"
                >
                  <Share2 size={20} />
                </button>
              )}
            </div>
          </div>

          {/* Referral Link Card */}
          <div className="border-2 border-emerald-200 rounded-xl p-6 hover:border-emerald-400 transition-colors">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Link2 className="text-emerald-600" size={20} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Referral Link
              </h3>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Share this link - it automatically applies your referral code.
            </p>

            {/* Link Display */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-4 mb-4 border border-emerald-200">
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
                Your Referral Link
              </p>
              <div className="bg-white rounded px-3 py-2 border border-emerald-200 flex items-center justify-between gap-2">
                <p className="text-sm text-gray-700 break-all font-mono flex-1">
                  {getReferralLink()}
                </p>
                <a
                  href={getReferralLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 text-emerald-600 hover:text-emerald-700"
                  title="Test link in new tab"
                >
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleCopyLink}
                className="flex-1 bg-emerald-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                {linkCopied ? (
                  <>
                    <Check size={20} />
                    Link Copied!
                  </>
                ) : (
                  <>
                    <Link2 size={20} />
                    Copy Link
                  </>
                )}
              </button>
              {navigator.share && (
                <button
                  onClick={() => handleShare('link')}
                  className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                  title="Share"
                >
                  <Share2 size={20} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Usage Tips */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">💡</span>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">
                Pro Tips for Sharing
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Use the <strong>code</strong> for in-person conversations or email</li>
                <li>• Use the <strong>link</strong> for social media, WhatsApp, or SMS</li>
                <li>• The link automatically fills in the code on signup page</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 👥 Team Overview */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">
          Franchise Network Overview
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <InfoBox label="Direct Referrals" value={leadsCount} />
          <InfoBox label="Pending Approvals" value="0" />
          <InfoBox label="Active Franchises" value="0" />
        </div>
      </div>
    </div>
  );
}

/* ----------------- Components ----------------- */

function StatCard({ icon, title, value, color }) {
  return (
    <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4 hover:shadow-lg transition-shadow">
      <div className={`p-3 rounded-xl text-white ${color}`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="border-2 border-gray-200 rounded-xl p-4 text-center hover:border-indigo-300 transition-colors">
      <p className="text-gray-500 text-xs uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-2 text-gray-900">{value}</p>
    </div>
  );
}