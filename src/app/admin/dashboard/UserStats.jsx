"use client";

import { useState } from "react";
import {
  User,
  CheckCircle,
  Clock,
  UserX,
  Rocket,
  ImageIcon,
  Wallet,
  X,
  RefreshCw,
  Eye,
  MessageSquare,
  Shield,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  colorClass = "blue",
  onClick,
  isClickable = false 
}) => {
  const colorStyles = {
    green: "from-green-50 to-emerald-50 border-green-200",
    teal: "from-teal-50 to-cyan-50 border-teal-200",
    red: "from-red-50 to-orange-50 border-red-200",
    blue: "from-blue-50 to-indigo-50 border-blue-200",
    purple: "from-purple-50 to-indigo-50 border-purple-200",
  };

  const iconColors = {
    green: "bg-green-100 text-green-700",
    teal: "bg-teal-100 text-teal-700",
    red: "bg-orange-100 text-orange-600",
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
  };

  return (
    <div
      onClick={onClick}
      className={`
        bg-gradient-to-br ${colorStyles[colorClass]} 
        border rounded-2xl p-5 
        shadow-md hover:shadow-lg
        ${isClickable ? "cursor-pointer hover:scale-105 transition-all duration-200" : "cursor-default"}
        flex flex-col
      `}
    >
      {/* Top Row - Title */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">
          {title}
        </p>
        
        <div className={`w-8 h-8 ${iconColors[colorClass]} rounded-lg flex items-center justify-center`}>
          <Icon size={18} />
        </div>
      </div>

      {/* Bottom Row - Value */}
      <p className="text-2xl md:text-2.5xl font-bold text-gray-900">
        {value}
      </p>
      
      {subtitle && (
        <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
      )}
    </div>
  );
};

export default function UserStats({
  stats,
  role,
  stageStats,
  totalPostsCount,
  totalRevenue,
  isAgent,
  isManager,
  filterLabel,
  todayLeadWindowLabel,
  todayUsersMetaLeads,
  todayUsersSignups,
  todayUsersCount,
  showRevenueUsersModal,
  fetchRevenueUsers,
  setShowRevenueUsersModal,
  loadingRevenueUsers,
  revenueUsersList,
  setRevenueUsersList,
  fetchStageData,
  chatStats,
  fetchChatStats,
  setChatModalFilter,
  setShowChatStatsModal,
  displayTodayUsersCount,
    stageModal,
  setStageModal,
  stageData,
  loadingStage
}) {
  const [fullViewImage, setFullViewImage] = useState(null);
  const [approvalBusyId, setApprovalBusyId] = useState(null);

  const normalizeProofImageUrl = (raw) => {
    if (!raw || typeof raw !== "string") return "";
    const t = raw.trim();
    if (!t) return "";
    if (/^https?:\/\//i.test(t)) return t;
    if (typeof window !== "undefined" && t.startsWith("/")) {
      return `${window.location.origin}${t}`;
    }
    return t;
  };

  const handleOnboardApproval = async (revenue, decision) => {
    const id = revenue?._id;
    if (!id) return;
    setApprovalBusyId(String(id));
    try {
      const res = await fetch("/api/franchise-revenue/onboard-approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: typeof window !== "undefined" ? localStorage.getItem("email") : "",
          revenueId: String(id),
          decision,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRevenueUsersList((list) =>
          (list || []).map((r) =>
            String(r._id) === String(id)
              ? {
                  ...r,
                  planApprovalStatus:
                    decision === "approved" ? "approved" : "rejected",
                }
              : r,
          ),
        );
      } else if (typeof window !== "undefined") {
        window.alert(data.message || "Could not update approval");
      }
    } catch (e) {
      if (typeof window !== "undefined") {
        window.alert(e?.message || "Request failed");
      }
    } finally {
      setApprovalBusyId(null);
    }
  };

  return (
    <>
      {!isAgent && (
        <>
          {/* Main Stats Grid - 6 Cards */}
          <div className="grid  grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {/* Total Leads */}
            <StatCard
              title="Total Leads"
              value={stats?.totalUsers || 0}
              icon={User}
              colorClass="green"
            />

            {/* Active Leads */}
            <StatCard
              title="Active Leads"
              value={stageStats["Active"] || 0}
              icon={CheckCircle}
              colorClass="teal"
              onClick={() => fetchStageData("Active")}
              isClickable={true}
            />

            {/* Total Revenue */}
            <StatCard
  title="Total Revenue"
  value={`₹${(totalRevenue || 0).toLocaleString()}`}
  icon={Wallet}
  colorClass="purple"
  onClick={() => {
    fetchRevenueUsers();
    setShowRevenueUsersModal(true);
  }}
  isClickable={true}
/>

            {/* Heading Due */}
            <StatCard
              title="Follow Due"
              value={stageStats["Follow Up"] || 0}
              icon={Clock}
              colorClass="red"
              onClick={() => {
  fetchStageData("Follow Up");
  setStageModal("Follow Up");
}}
              isClickable={true}
            />

            {/* Inactive Leads */}
            <StatCard
              title="Inactive"
              value={stageStats["Inactive"] || 0}
              icon={UserX}
              colorClass="blue"
              onClick={() => {
  console.log("CLICK WORKING");
  fetchStageData("Inactive");
  setStageModal("Inactive"); // ✅ ADD BACK
}}
              isClickable={true}
            />

            {/* Onboarded */}
            <StatCard
              title="Onboarded"
              value={stageStats["Onboard"] || 0}
              icon={Rocket}
              colorClass="purple"
              onClick={() => {
  fetchStageData("Onboard");
  setStageModal("Onboard");
}}
              isClickable={true}
            />
          </div>

          {/* Secondary Stats Grid - Compact */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
            {/* Total Posts */}
            <div className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">
                    Total Posts
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalPostsCount}
                  </p>
                </div>
                <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center">
                  <ImageIcon size={20} />
                </div>
              </div>
            </div>

            {/* Total Chats */}
            <div
              className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all cursor-pointer hover:scale-105"
              onClick={() => {
                setChatModalFilter("all");
                setShowChatStatsModal(true);
                fetchChatStats();
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">
                    Total Chats
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {chatStats?.total || 0}
                  </p>
                </div>
                <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center shrink-0">
                  <MessageSquare size={20} />
                </div>
              </div>
            </div>

            {/* Chats Today */}
            <div
              className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all cursor-pointer hover:scale-105"
              onClick={() => {
                setChatModalFilter("today");
                setShowChatStatsModal(true);
                fetchChatStats();
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">
                    Chats Today
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {chatStats?.today || 0}
                  </p>
                </div>
                <div className="w-10 h-10 bg-teal-100 text-teal-700 rounded-lg flex items-center justify-center shrink-0">
                  <MessageSquare size={20} />
                </div>
              </div>
            </div>

            {/* Resolved Chats */}
            <div
              className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all cursor-pointer hover:scale-105"
              onClick={() => {
                setChatModalFilter("resolved");
                setShowChatStatsModal(true);
                fetchChatStats();
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">
                    Resolved
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {chatStats?.resolved || 0}
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center shrink-0">
                  <Shield size={20} />
                </div>
              </div>
            </div>

            {/* Users Today - Compact Card */}
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-4 shadow-md border border-teal-200 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-xs font-bold text-teal-700 uppercase tracking-wide mb-2">
                    Users Today
                  </p>
                  {(role === "superAdmin" ||
                    role === "admin" ||
                    role === "superfranchiseAdmin") &&
                  !isAgent &&
                  !isManager ? (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-teal-600 font-medium">Meta:</span>
                        <span className="font-bold text-teal-900">{todayUsersMetaLeads}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-teal-600 font-medium">Sign:</span>
                        <span className="font-bold text-teal-900">{todayUsersSignups}</span>
                      </div>
                      <div className="border-t border-teal-300 pt-1 mt-1 flex justify-between text-xs">
                        <span className="text-teal-700 font-bold">Total:</span>
                        <span className="font-bold text-teal-900">{todayUsersCount}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-2xl font-bold text-teal-900">
                      {displayTodayUsersCount || todayUsersCount || 0}
                    </p>
                  )}
                </div>
                <div className="w-10 h-10 bg-teal-200 rounded-lg flex items-center justify-center shrink-0">
                  <User className="text-teal-700" size={20} />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* User Onboard Revenue Details Modal ✅ NEW */}
      {showRevenueUsersModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-6xl max-h-[90vh] w-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-green-50">
              <div>
                <h2 className="text-2xl font-bold text-emerald-800">
                  User Onboard Revenue Details
                </h2>
                <p className="text-sm text-emerald-700 mt-1">
                  All users with `type: user_onboard` revenue entries
                </p>
              </div>
              <button
                onClick={() => {
                  setShowRevenueUsersModal(false);
                  setRevenueUsersList([]);
                }}
                className="p-2 hover:bg-emerald-200 rounded-xl transition-all"
              >
                <X size={20} className="text-emerald-700" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingRevenueUsers ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center text-center">
                    <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
                    <p className="text-gray-600 font-medium">
                      Loading onboarded users...
                    </p>
                  </div>
                </div>
              ) : revenueUsersList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-gray-500">
                  <Wallet className="w-16 h-16 mx-auto mb-4 opacity-40" />
                  <h3 className="text-xl font-semibold mb-2 text-gray-600">
                    No Onboarded Users Yet
                  </h3>
                  <p className="text-gray-500">
                    No users with `user_onboard` revenue entries found for your
                    account.
                  </p>
                  <p className="text-sm mt-1 text-gray-400">
                    Onboard users using the ✅ button in the user table
                  </p>
                </div>
              ) : (
                <>
                  {/* Table */}
                  <div className="overflow-x-auto rounded-2xl border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Plan
                          </th>
                          <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Screenshot
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Notes
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Remarks
                          </th>
                          {role === "superAdmin" && (
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                              Plan approval
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {revenueUsersList.map((revenue, index) => (
                          <tr
                            key={revenue._id || index}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="font-semibold text-gray-900">
                                {revenue.leadName}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {revenue.leadId}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                UTR: {revenue.utrNumber || "N/A"}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex px-3 py-1 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full">
                                {revenue.plan || "N/A"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="text-xl font-bold text-emerald-700">
                                ₹{revenue.amount?.toLocaleString() || 0}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">
                                {new Date(revenue.createdAt).toLocaleDateString(
                                  "en-IN",
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(revenue.createdAt).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {revenue.paymentScreenshot ? (
                                <button
                                  onClick={() =>
                                    setFullViewImage(
                                      normalizeProofImageUrl(
                                        revenue.paymentScreenshot,
                                      ),
                                    )
                                  }
                                  className="flex items-center gap-2 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-all text-sm font-medium"
                                >
                                  <Eye size={14} />
                                  View Proof
                                </button>
                              ) : (
                                <span className="text-sm text-gray-400 italic">
                                  No screenshot
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 max-w-xs">
                              <div className="text-sm text-gray-900 line-clamp-2">
                                {revenue.notes || "No notes"}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">
                             {revenue.planRemarks || "—"}
                            </td>
                            {role === "superAdmin" && (
                              <td className="px-6 py-4 align-top text-sm">
                                {revenue.type === "user_onboard" ? (
                                  (() => {
                                    const st =
                                      revenue.planApprovalStatus || "pending";
                                    if (st === "approved") {
                                      return (
                                        <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                                          Approved
                                        </span>
                                      );
                                    }
                                    if (st === "rejected") {
                                      return (
                                        <span className="inline-flex rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                          Not approved
                                        </span>
                                      );
                                    }
                                    const busy =
                                      approvalBusyId ===
                                      String(revenue._id);
                                    return (
                                      <div className="flex flex-wrap gap-2">
                                        <button
                                          type="button"
                                          disabled={busy}
                                          onClick={() =>
                                            handleOnboardApproval(
                                              revenue,
                                              "approved",
                                            )
                                          }
                                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                                        >
                                          {busy ? "…" : "Approved"}
                                        </button>
                                        <button
                                          type="button"
                                          disabled={busy}
                                          onClick={() =>
                                            handleOnboardApproval(
                                              revenue,
                                              "rejected",
                                            )
                                          }
                                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                                        >
                                          Not approved
                                        </button>
                                      </div>
                                    );
                                  })()
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Footer Totals */}
                  <div className="mt-6 pt-6 border-t border-gray-200 bg-emerald-50/50 rounded-2xl p-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <p className="text-sm text-gray-600">
                          Total Onboarded Users:
                        </p>
                        <p className="text-2xl font-bold text-emerald-800">
                          {revenueUsersList.length}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Total Revenue:</p>
                        <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                          ₹
                          {revenueUsersList
                            .reduce((sum, r) => sum + (r.amount || 0), 0)
                            .toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {fullViewImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setFullViewImage(null)}
          role="presentation"
        >
          <button
            type="button"
            className="absolute right-4 top-4 z-10 rounded-full bg-white p-2 text-gray-800 shadow-lg transition hover:bg-gray-100"
            onClick={() => setFullViewImage(null)}
            aria-label="Close preview"
          >
            <X size={20} />
          </button>
          <img
            src={fullViewImage}
            alt="Payment proof"
            className="max-h-[90vh] max-w-[min(100%,896px)] rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

    </>
  );
}
