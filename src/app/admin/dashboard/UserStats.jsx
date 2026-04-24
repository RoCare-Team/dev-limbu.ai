"use client";

import { useRouter } from "next/navigation"; 

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
  
  fetchRevenueUsers,
  
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

    const router = useRouter();

  
  const [approvalBusyId, setApprovalBusyId] = useState(null);

  

  

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
    router.push("/admin/dashboard/revenue-users")

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

     

     
    </>
  );
}