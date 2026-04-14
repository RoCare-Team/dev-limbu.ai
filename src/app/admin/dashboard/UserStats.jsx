"use client";

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
} from "lucide-react";

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
  setChatModalFilter, // ✅ ADD
  setShowChatStatsModal,
  displayTodayUsersCount

  // ✅ YE ADD KAR
}) {
  return (
    <>
      {!isAgent && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-2">
          {/* Total Users */}
          <div className="bg-white w-50 h-15 rounded-lg p-3  shadow-sm border border-gray-200 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-dark font-semibold uppercase tracking-wide">
                  Total Users
                </p>
                <p className="text-lg font-bold text-dark mt-1">
                  {stats?.totalUsers || 0}
                </p>
              </div>
              <div className="w-9 h-9 bg-neutral-300 rounded-lg flex items-center justify-center">
                <User className="text-dark" size={18} />
              </div>
            </div>
            {filterLabel && (
              <div className="mt-1 pt-1 border-t border-gray-100 text-xs text-gray-500 flex items-center gap-1">
                <Calendar size={11} />
                {filterLabel}
              </div>
            )}
          </div>

          {/* Active Users */}
          {!isAgent && !isManager && (
            <div className="bg-white w-50 h-15 rounded-lg p-2.5 shadow-sm border border-gray-200 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-600 font-semibold uppercase tracking-wide">
                    Active Users
                  </p>
                  <p className="text-lg font-bold text-green-800 mt-1">
                    {stageStats["Active"] || 0}
                  </p>
                </div>
                <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="text-green-600" size={18} />
                </div>
              </div>
            </div>
          )}

          {/* Follow Up */}
          {!isAgent && (
            <div
              className="bg-white w-50 h-15 rounded-lg p-2.5 shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer"
              onClick={() => fetchStageData("Follow Up")}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-dark font-semibold uppercase tracking-wide">
                    Follow Up
                  </p>
                  <p className="text-lg font-bold text-dark mt-1">
                    {stageStats["Follow Up"] || 0}
                  </p>
                </div>
                <div className="w-9 h-9 bg-neutral-300 rounded-lg flex items-center justify-center">
                  <Clock className="text-dark" size={18} />
                </div>
              </div>
            </div>
          )}

          {/* Inactive */}
          {!isAgent && (
            <div
              className="bg-white w-50 h-15 rounded-lg p-2.5 shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer"
              onClick={() => {
                console.log("CLICKED INACTIVE"); // 👈 add kar
                fetchStageData("Inactive");
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">
                    Inactive
                  </p>
                  <p className="text-lg font-bold text-gray-800 mt-1">
                    {stageStats["Inactive"] || 0}
                  </p>
                </div>
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                  <UserX className="text-gray-600" size={18} />
                </div>
              </div>
            </div>
          )}

          {/* Onboarded */}
          {!isAgent && (
            <div
              className="bg-white w-50 h-15 rounded-lg p-2.5 shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer"
              onClick={() => fetchStageData("Onboard")}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">
                    Onboarded
                  </p>
                  <p className="text-lg font-bold text-blue-800 mt-1">
                    {stageStats["Onboard"] || 0}
                  </p>
                </div>
                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Rocket className="text-blue-600" size={18} />
                </div>
              </div>
            </div>
          )}

          {/* Total Posts */}
          {!isAgent && (
            <div className="bg-white w-50 h-15  rounded-lg p-2.5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 font-medium">
                    Total Posts
                  </p>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {totalPostsCount}
                  </p>
                </div>
                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ImageIcon className="text-blue-600" size={18} />
                </div>
              </div>
              {filterLabel && (
                <div className="mt-1 pt-1 border-t border-gray-100 text-xs text-gray-500 flex items-center gap-1">
                  <Calendar size={11} />
                  {filterLabel}
                </div>
              )}
            </div>
          )}

          {/* Users Today — Meta (bulk-upload) vs Signup vs total (IST / APP_TIMEZONE via API) */}
          <div
            className={`bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg p-2.5 shadow-sm border border-teal-200 hover:shadow-md transition-all ${
              (role === "superAdmin" ||
                role === "admin" ||
                role === "superfranchiseAdmin") &&
              !isManager
                ? "md:col-span-2"
                : ""
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-teal-700 font-medium">
                  {isAgent ? "Calls Today" : "Users Today"}
                </p>
                {(role === "superAdmin" ||
                  role === "admin" ||
                  role === "superfranchiseAdmin") &&
                !isAgent &&
                !isManager ? (
                  <>
                    <p
                      className="text-[10px] text-teal-600/90 leading-tight mt-0.5 line-clamp-2"
                      title={todayLeadWindowLabel}
                    ></p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-teal-900">
                      <span title="Meta instant form + imports tagged bulk-upload">
                        Meta Leads:{" "}
                        <b className="text-base text-teal-950 tabular-nums">
                          {todayUsersMetaLeads}
                        </b>
                      </span>
                      <span>
                        Signup:{" "}
                        <b className="text-base text-teal-950 tabular-nums">
                          {todayUsersSignups}
                        </b>
                      </span>
                      <span>
                        Total:{" "}
                        <b className="text-base text-teal-950 tabular-nums">
                          {todayUsersCount}
                        </b>
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-lg font-bold text-teal-800 ">
                        {displayTodayUsersCount}
                  </p>
                )}
              </div>
              <div className="w-9 h-9 bg-teal-200 rounded-lg flex items-center justify-center shrink-0">
                <User className="text-teal-700" size={18} />
              </div>
            </div>
          </div>

          {/* Total Calls Assigned — Agent only */}
          {isAgent && (
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 w-50 h-15 rounded-lg p-2.5 shadow-sm border border-indigo-200 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-indigo-700 font-semibold uppercase tracking-wide">
                    Total Assigned
                  </p>
                  <p className="text-lg font-bold text-indigo-800 mt-1">
                    {stats.total ?? 0}
                  </p>
                </div>
                <div className="w-9 h-9 bg-indigo-200 rounded-lg flex items-center justify-center">
                  <UserCheck className="text-indigo-700" size={18} />
                </div>
              </div>
            </div>
          )}

          {/* Total Revenue - Role-based visibility */}
          {(role === "superAdmin" ||
            role === "franchiseAdmin" ||
            role === "agent") && (
            <div
              className=" w-50 h-15 bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-2.5 shadow-sm border border-emerald-200 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => {
                fetchRevenueUsers();
                setShowRevenueUsersModal(true);
              }}
              title="Click to view onboarded users details"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-emerald-700 font-medium group-hover:underline">
                    {role === "superAdmin" || role === "superFranchiseAdmin"
                      ? "User Onboard Revenue"
                      : "My Revenue"}
                  </p>
                  <p className="text-lg font-bold text-emerald-800 mt-1">
                    ₹{totalRevenue.toLocaleString()}
                  </p>
                </div>
                <div className="w-9 h-9 bg-emerald-200 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Wallet className="text-emerald-700" size={18} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

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
                            Remark
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">

                      {revenueUsersList.map((revenue, index) => {
                      console.log("TYPE:", revenue.type);
                       console.log("PLAN:", revenue.plan);

                      return (
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
                                    setFullViewImage(revenue.paymentScreenshot)
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
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full
                               ${
                                  revenue.type === "seo_plan"
                                ? "bg-purple-100 text-purple-800"
                                 : "bg-gray-100 text-gray-700"
                               }`}
                              >
                                {revenue.type === "seo_plan"
                                  ? "SEO Plan"
                                  : "General"}
                              </span>
                            </td>
                          </tr>
                      );
                    })}

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

    

      {/* Chat stats + revenue (My Revenue / User Onboard Revenue in this row for agent & superAdmin) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {/* Total Chats */}
        <div
          className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer min-h-[72px]"
          onClick={() => {
            setChatModalFilter("all");
            setShowChatStatsModal(true);
            fetchChatStats();
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                Total Chats
              </p>
              <p className="text-lg font-bold text-gray-900 mt-0.5">
                {chatStats?.total || 0}
              </p>
            </div>
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
              <MessageSquare className="text-orange-600" size={20} />
            </div>
          </div>
        </div>

        {isAgent && (
          <div
            className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-3 shadow-sm border border-emerald-200 hover:shadow-md transition-all cursor-pointer min-h-[72px] group"
            onClick={() => {
              fetchRevenueUsers();
              setShowRevenueUsersModal(true);
            }}
            title="Click to view onboarded users"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wide group-hover:underline">
                  My Revenue
                </p>
                <p className="text-lg font-bold text-emerald-800 mt-0.5">
                  ₹{totalRevenue.toLocaleString()}
                </p>
              </div>
              <div className="w-8 h-8 bg-emerald-200 rounded-lg flex items-center justify-center shrink-0">
                <Wallet className="text-emerald-700" size={18} />
              </div>
            </div>
          </div>
        )}

        {/* Chats Today */}
        {!isAgent && (
          <div
            className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer min-h-[72px]"
            onClick={() => {
              setChatModalFilter("today");
              setShowChatStatsModal(true);
              fetchChatStats();
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Chats Today</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {chatStats?.today || 0}
                </p>
              </div>
              <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="text-teal-600" size={20} />
              </div>
            </div>
          </div>
        )}

        {/* Resolved */}
        {!isAgent && (
          <div
            className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer min-h-[72px]"
            onClick={() => {
              setChatModalFilter("resolved");
              setShowChatStatsModal(true);
              fetchChatStats();
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Resolved</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {chatStats?.resolved || 0}
                </p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield className="text-green-600" size={20} />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
