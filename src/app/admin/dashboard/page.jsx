"use client";
import { useEffect, useState } from "react";
// import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  TrendingUp,
  UserCheck,
  AlertCircle,
  Phone,
  CalendarClock,
  X,
  ChevronDown,
  Calendar,
  IndianRupee,
  BriefcaseBusiness,
  UserCog,
} from "lucide-react";

import { getTodayUsersData } from "../user-management/page";

import UserStats from "../../../app/admin/dashboard/UserStats";
import useUserManagement from "../user-management/hooks/useUserManagement";




export default function AdminDashboard() {
  const {
    stageStats,
    totalPostsCount,
    totalRevenue,
    // todayUsersCount,
    // todayUsersMetaLeads,
    // todayUsersSignups,
    filterLabel,
    isAgent,
    isManager,
    // ✅ AD
  } = useUserManagement();

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRevenue: 0,
    planCounts: { basic: 0, standard: 0, premium: 0 },
  });

  const [todayUsersCount, setTodayUsersCount] = useState(0);
const [todayUsersMetaLeads, setTodayUsersMetaLeads] = useState(0);
const [todayUsersSignups, setTodayUsersSignups] = useState(0);
  const [userGrowth, setUserGrowth] = useState([]);
  const [agentLeads, setAgentLeads] = useState([]); // today's leads per agent
  const [todayTotal, setTodayTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("");
  const [callStats, setCallStats] = useState(null);
  const [followUpStats, setFollowUpStats] = useState({
    totalFollowUps: 0,
    todayFollowUps: 0,
    tomorrowFollowUps: 0,
    next7DaysFollowUps: 0,
    thisMonthFollowUps: 0,
    byAgent: [],
  });

  const [stageModal, setStageModal] = useState(null);
  const [stageData, setStageData] = useState([]);
  const [loadingStage, setLoadingStage] = useState(false);
  const [showRevenueUsersModal, setShowRevenueUsersModal] = useState(false);

  const [revenueUsersList, setRevenueUsersList] = useState([]);
  const [loadingRevenueUsers, setLoadingRevenueUsers] = useState(false);

  // chats
  const [chatStats, setChatStats] = useState({
    total: 0,
    today: 0,
    resolved: 0,
    data: [],
  });

  const [chatModalFilter, setChatModalFilter] = useState("all");
  const [showChatStatsModal, setShowChatStatsModal] = useState(false);

  // calls
  const [byAgentOpen, setByAgentOpen] = useState(false);
  const [adminFollowUpLeadsOpen, setAdminFollowUpLeadsOpen] = useState(false);
  const [followUpFilter, setFollowUpFilter] = useState("today");
  const [followUpLeads, setFollowUpLeads] = useState([]);
  const [loadingFollowUps, setLoadingFollowUps] = useState(false);
  const [agentMap, setAgentMap] = useState({});
  const [dashboardKpis, setDashboardKpis] = useState({
    todayRechargeAmount: 0,
    totalRechargeAmount: 0,
    totalServiceBookings: 0,
    totalPackageBookings: 0,
    assignedClients: 0,
    renewalDueCount: 0,
    managerPerformance: [],
  });

  const fetchRevenueUsers = async () => {
    setLoadingRevenueUsers(true);

    try {
      const email = localStorage.getItem("email");
      const role = localStorage.getItem("role");

      const res = await fetch(
        `/api/franchise-revenue?email=${email}&role=${role}`,
      );
      const data = await res.json();

      if (data.success) {
        setRevenueUsersList(data.revenue);
      } else {
        setRevenueUsersList([]);
      }
    } catch (err) {
      console.error(err);
      setRevenueUsersList([]);
    } finally {
      setLoadingRevenueUsers(false);
    }
  };

  const fetchTodayUsers = async () => {
  const data = await getTodayUsersData();

  console.log("DASHBOARD DATA:", data);

  if (data?.success) {
    setTodayUsersCount(data.todayUsersCount || 0);
    setTodayUsersMetaLeads(data.todayMetaLeads || 0);
    setTodayUsersSignups(data.todaySignups || 0);
  }
};

useEffect(() => {
  fetchTodayUsers();
}, []);

 const fetchStageData = async (stage) => {
  setLoadingStage(true);
  setStageModal(stage);

  try {
    const email = localStorage.getItem("email");

    const res = await fetch(`/api/users?email=${email}&getAgentStats=true`);
    const data = await res.json();

    if (data.success) {
      console.log("FULL DATA:", data);

      const stageItems = data.detailedStats.filter(
        (item) => item.stage === stage
      );

      // Merge duplicate rows (same agent split by leadStatus) into one total row.
      const grouped = stageItems.reduce((acc, item) => {
        const key = item.agentId || "Unassigned";
        if (!acc[key]) {
          acc[key] = {
            agentId: item.agentId || "Unassigned",
            agentName: item.agentName || item.agentId || "Unknown",
            count: 0,
          };
        }
        acc[key].count += Number(item.count) || 0;
        return acc;
      }, {});

      const breakdown = Object.values(grouped).sort((a, b) => b.count - a.count);

      console.log("FINAL BREAKDOWN:", breakdown);

      setStageData(breakdown);
    }
  } catch (err) {
    console.error(err);
    setStageData([]);
  } finally {
    setLoadingStage(false);
  }
};

const fetchAgents = async () => {
  try {
    const res = await fetch(`/api/users?email=${localStorage.getItem("email")}&getAgentStats=true`);
    const data = await res.json();

    console.log("AGENTS:", data);

    const map = {};

    // ✅ YAHI FIX HAI
    const list = data.users || data.data || [];

    list.forEach((a) => {
      map[a._id?.toString()] = a.name;
    });

    console.log("FINAL AGENT MAP:", map);

    setAgentMap(map);
  } catch (err) {
    console.error(err);
  }
};

  const fetchChatStats = async () => {
    try {
      const res = await fetch("/api/issue-check");
      const result = await res.json();
      if (result.success) {
        const chats = result.data || [];
        const total = chats.length;
        const todayDate = new Date();
        const today = chats.filter((c) => {
          if (!c.createdAt) return false;
          const chatDate = new Date(c.createdAt);
          return (
            chatDate.getDate() === todayDate.getDate() &&
            chatDate.getMonth() === todayDate.getMonth() &&
            chatDate.getFullYear() === todayDate.getFullYear()
          );
        }).length;
        const resolved = chats.filter((c) => c.status === "resolved").length;
        setChatStats({ total, today, resolved, data: chats });
      }
    } catch (error) {
      console.error("Error fetching chat stats:", error);
    }
  };

  useEffect(() => {
    fetchChatStats();
  }, []);

  const todayLeadWindowLabel = "";

  useEffect(() => {
    const storedRole = localStorage.getItem("role") || "";
    setRole(storedRole);
    fetchStats(storedRole);
  }, []);

  const fetchStats = async (currentRole) => {
    setLoading(true);
    const adminEmail = localStorage.getItem("email");
    if (!adminEmail) {
      setLoading(false);
      return;
    }

    try {
      // ── 1. Paginated list (totalUsers, growth) ───────────────────────────
      const listRes = await fetch(
        `/api/users?email=${encodeURIComponent(adminEmail)}`,
      );
      const listData = await listRes.json();

      if (listData.success) {
        setStats({
          totalUsers: listData.totalUsers || 0,
          totalRevenue: 0,
          planCounts: { basic: 0, standard: 0, premium: 0 },
        });
        setUserGrowth(
          (listData.users || []).map((u) => ({
            date: new Date(u.createdAt).toLocaleDateString(),
            count: 1,
          })),
        );

        // superAdmin gets todayAgentAssignments in list response too
        if (listData.todayAgentAssignments) {
          setAgentLeads(listData.todayAgentAssignments);
          const total = listData.todayAgentAssignments.reduce(
            (s, a) => s + (a.count || 0),
            0,
          );
          setTodayTotal(total);
        }
      }

      // ── 2. Agent stats (today per agent) ─────────────────────────────────
      const statsRes = await fetch(
        `/api/users?email=${encodeURIComponent(adminEmail)}&getAgentStats=true`,
      );
      const statsData = await statsRes.json();

      if (statsData.success && statsData.todayAgentAssignments) {
        setAgentLeads(statsData.todayAgentAssignments);
        const total = statsData.todayAgentAssignments.reduce(
          (s, a) => s + (a.count || 0),
          0,
        );
        setTodayTotal(total);
      }

      // ── 3. Call & Follow-up stats ─────────────────────────────────────────
      if (currentRole === "superAdmin" || currentRole === "admin") {
        const [callRes, followRes] = await Promise.all([
          fetch(
            `/api/admin/call-stats?email=${encodeURIComponent(adminEmail)}`,
          ),
          fetch(
            `/api/admin/follow-up-stats?email=${encodeURIComponent(adminEmail)}&filter=all`,
          ),
        ]);
        const callData = await callRes.json();
        const followData = await followRes.json();
        if (callData.success) setCallStats(callData.stats);
        if (followData.success) setFollowUpStats(followData.stats);
      }

      const [txRes, serviceRes, packageRes, managerRes] = await Promise.all([
        fetch("/api/razorpay/razorpay-transaction"),
        fetch("/api/service-booking?planType=our-service"),
        fetch("/api/service-booking?planType=our-package"),
        fetch(`/api/admin/account-manager-leads?email=${encodeURIComponent(adminEmail)}`),
      ]);

      const [txJson, serviceJson, packageJson, managerJson] = await Promise.all([
        txRes.json(),
        serviceRes.json(),
        packageRes.json(),
        managerRes.json(),
      ]);

      const txList = txJson?.transactions || [];
      const now = new Date();
      const todayRechargeAmount = txList
        .filter((t) => {
          if (!t?.createdAt) return false;
          const d = new Date(t.createdAt);
          return (
            d.getDate() === now.getDate() &&
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear()
          );
        })
        .reduce((sum, t) => sum + Number(t.totalAmount || 0), 0);

      const totalRechargeAmount = txList.reduce(
        (sum, t) => sum + Number(t.totalAmount || 0),
        0,
      );

      const managerUsers = managerJson?.data || [];
      const perfMap = {};
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      managerUsers.forEach((u) => {
        const name = u?.accountManager?.fullName || u?.accountManagerName || "Unassigned";
        if (!perfMap[name]) perfMap[name] = { name, assigned: 0, renewalDue: 0 };
        perfMap[name].assigned += 1;
        if (u?.planExpiryDate) {
          const expiry = new Date(u.planExpiryDate);
          if (!Number.isNaN(expiry.getTime()) && expiry < todayStart) {
            perfMap[name].renewalDue += 1;
          }
        }
      });

      const managerPerformance = Object.values(perfMap).sort(
        (a, b) => b.assigned - a.assigned,
      );

      setDashboardKpis({
        todayRechargeAmount,
        totalRechargeAmount,
        totalServiceBookings: (serviceJson?.data || []).length,
        totalPackageBookings: (packageJson?.data || []).length,
        assignedClients: managerPerformance
          .filter((m) => m.name !== "Unassigned")
          .reduce((sum, m) => sum + m.assigned, 0),
        renewalDueCount: managerPerformance.reduce((sum, m) => sum + m.renewalDue, 0),
        managerPerformance,
      });
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-[80vh] text-gray-600">
        Loading dashboard...
      </div>
    );

  return (
    <div className="p-2">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Dashboard Overview
      </h1>

      <UserStats
        stats={stats}
        role={role} // ✅ YE ADD KAR
        stageStats={stageStats}
        totalPostsCount={totalPostsCount}
        totalRevenue={totalRevenue}
        isAgent={isAgent}
        isManager={isManager}
        filterLabel={filterLabel}
        todayLeadWindowLabel={todayLeadWindowLabel}
        todayUsersMetaLeads={todayUsersMetaLeads}
        todayUsersSignups={todayUsersSignups}
        todayUsersCount={todayUsersCount}
        showRevenueUsersModal={showRevenueUsersModal}
        fetchRevenueUsers={fetchRevenueUsers}
        setShowRevenueUsersModal={setShowRevenueUsersModal}
        loadingRevenueUsers={loadingRevenueUsers}
        revenueUsersList={revenueUsersList}
        setRevenueUsersList={setRevenueUsersList}
        setStageModal={setStageModal}
        fetchStageData={fetchStageData}
        chatStats={chatStats} // ✅ ADD
        fetchChatStats={fetchChatStats}
        setChatModalFilter={setChatModalFilter} // ✅ ADD
        setShowChatStatsModal={setShowChatStatsModal}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <KpiCard
          title="Today Recharge"
          value={`₹${dashboardKpis.todayRechargeAmount.toLocaleString()}`}
          icon={<IndianRupee size={16} />}
          tone="green"
        />
        <KpiCard
          title="Total Recharge"
          value={`₹${dashboardKpis.totalRechargeAmount.toLocaleString()}`}
          icon={<IndianRupee size={16} />}
          tone="blue"
        />
        <KpiCard
          title="Total Services"
          value={dashboardKpis.totalServiceBookings}
          icon={<BriefcaseBusiness size={16} />}
          tone="indigo"
        />
        <KpiCard
          title="Total Packages"
          value={dashboardKpis.totalPackageBookings}
          icon={<BriefcaseBusiness size={16} />}
          tone="violet"
        />
        <KpiCard
          title="Assigned Clients"
          value={dashboardKpis.assignedClients}
          icon={<UserCog size={16} />}
          tone="slate"
        />
        <KpiCard
          title="Renewal Due"
          value={dashboardKpis.renewalDueCount}
          icon={<UserCog size={16} />}
          tone="amber"
        />
      </div>

      {dashboardKpis.managerPerformance.length > 0 && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-base font-bold text-slate-900">Account Manager Assigned Clients</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-3 py-2 text-left">Manager</th>
                  <th className="px-3 py-2 text-right">Assigned Clients</th>
                  <th className="px-3 py-2 text-right">Renewal Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dashboardKpis.managerPerformance.map((m) => (
                  <tr key={m.name}>
                    <td className="px-3 py-2">{m.name}</td>
                    <td className="px-3 py-2 text-right font-semibold">{m.assigned}</td>
                    <td className="px-3 py-2 text-right font-semibold text-rose-700">{m.renewalDue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

        {/* ── Call Performance & Follow-up Stats (superAdmin/admin only) ── */}
      {(role === "superAdmin" || role === "admin") && callStats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-neutral-200 text-dark rounded-xl p-5 shadow-lg flex items-center justify-between col-span-2 sm:col-span-1">
            <div>
              <h2 className="text-sm opacity-80">Calls Today</h2>
              <p className="text-xl font-bold mt-1">
                {callStats.totalCallsToday}
              </p>
            </div>
            <Phone size={24} className="opacity-60" />
          </div>
          <div className="bg-neutral-200 text-dark rounded-xl p-5 shadow-lg flex items-center justify-between">
            <div>
              <h2 className="text-sm opacity-80">Total Follow-ups</h2>
              <p className="text-xl font-bold mt-1">
                {followUpStats.totalFollowUps}
              </p>
            </div>
            <CalendarClock size={24} className="opacity-60" />
          </div>
          <div className="bg-neutral-200 text-dark rounded-xl p-5 shadow-lg flex items-center justify-between">
            <div>
              <h2 className="text-sm opacity-80">Today&apos;s Follow-ups</h2>
              <p className="text-xl font-bold mt-1">
                {followUpStats.todayFollowUps}
              </p>
            </div>
            <CalendarClock size={24} className="opacity-60" />
          </div>
          <div className="bg-neutral-200 text-dark rounded-xl p-5 shadow-lg flex items-center justify-between">
            <div>
              <h2 className="text-sm opacity-80">Tomorrow&apos;s</h2>
              <p className="text-xl font-bold mt-1">
                {followUpStats.tomorrowFollowUps}
              </p>
            </div>
            <CalendarClock size={24} className="opacity-60" />
          </div>
          <div className="bg-neutral-200 text-dark rounded-xl p-5 shadow-lg flex items-center justify-between">
            <div>
              <h2 className="text-sm opacity-80">Next 7 Days</h2>
              <p className="text-xl font-bold mt-1">
                {followUpStats.next7DaysFollowUps}
              </p>
            </div>
            <CalendarClock size={24} className="opacity-60" />
          </div>
          <div className="bg-neutral-200 text-dark rounded-xl p-5 shadow-lg flex items-center justify-between">
            <div>
              <h2 className="text-sm opacity-80">This Month</h2>
              <p className="text-xl font-bold mt-1">
                {followUpStats.thisMonthFollowUps}
              </p>
            </div>
            <CalendarClock size={24} className="opacity-60" />
          </div>
        </div>
      )}

      {callStats && (role === "superAdmin" || role === "admin") && (
        <div className="mb-4 bg-white rounded-xl border p-3 border-gray-200 shadow-sm overflow-hidden">
          <div className="px-3 py-2 md:px-4 md:py-2.5 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white flex flex-wrap items-center gap-1.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
              <Phone className="text-indigo-600" size={16} />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-bold text-gray-900 leading-tight">
                Calls &amp; follow-ups
              </h2>
              <p className="text-1xl text-gray-800 leading-snug">
                Today&apos;s call volume and scheduled follow-ups across agents
              </p>
            </div>
          </div>

          <div className="p-3 md:p-3.5 space-y-3">
            {/* Calls today: summary + per-agent scroll */}
            <div>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Calls today{" "}
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-stretch">
                <div className="shrink-0 bg-blue-50 border border-blue-200 rounded-lg p-2.5 min-w-[120px] flex flex-col justify-center">
                  <span className="text-[10px] text-blue-700 font-semibold uppercase">
                    Total
                  </span>
                  <span className="text-xl font-bold text-blue-900 tabular-nums leading-tight">
                    {callStats.totalCallsToday}
                  </span>
                  <span className="text-[9px] text-blue-600/80">
                    all agents
                  </span>
                </div>
                <div className="flex-1 min-w-0 overflow-x-auto pb-0.5 -mx-0.5 px-0.5">
                  <div className="flex gap-1.5 min-w-min">
                    {(callStats.todayCallsByAgent || []).map((agent) => (
                      <div
                        key={agent.agentId || agent.agentName}
                        className="min-w-[100px] max-w-[128px] bg-gray-50 border border-gray-200 rounded-lg p-2 flex flex-col"
                      >
                        <span
                          className="text-[9px] text-gray-500 truncate capitalize"
                          title={agent.agentName}
                        >
                          {agent.agentName || "—"}
                        </span>
                        <span className="text-lg font-bold text-gray-900 tabular-nums leading-tight">
                          {agent.count}
                        </span>
                        <span className="text-[8px] text-gray-400">calls</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Follow-up buckets */}
            <div>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Follow-up schedule
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {[
                  {
                    label: "Total",
                    value: followUpStats.totalFollowUps,
                    bg: "bg-amber-50",
                    border: "border-amber-200",
                    text: "text-amber-700",
                    bold: "text-amber-800",
                    sub: "text-amber-500",
                    note: "all follow-ups",
                  },
                  {
                    label: "Today",
                    value: followUpStats.todayFollowUps,
                    bg: "bg-sky-50",
                    border: "border-sky-200",
                    text: "text-sky-700",
                    bold: "text-sky-800",
                    sub: "text-sky-500",
                    note: "due today",
                  },
                  {
                    label: "Tomorrow",
                    value: followUpStats.tomorrowFollowUps,
                    bg: "bg-rose-50",
                    border: "border-rose-200",
                    text: "text-rose-700",
                    bold: "text-rose-800",
                    sub: "text-rose-500",
                    note: "due tomorrow",
                  },
                  {
                    label: "Next 7 Days",
                    value: followUpStats.next7DaysFollowUps,
                    bg: "bg-violet-50",
                    border: "border-violet-200",
                    text: "text-violet-700",
                    bold: "text-violet-800",
                    sub: "text-violet-500",
                    note: "upcoming",
                  },
                  {
                    label: "This Month",
                    value: followUpStats.thisMonthFollowUps,
                    bg: "bg-green-50",
                    border: "border-green-200",
                    text: "text-green-700",
                    bold: "text-green-800",
                    sub: "text-green-500",
                    note: "this month",
                  },
                ].map(({ label, value, bg, border, text, bold, sub, note }) => (
                  <div
                    key={label}
                    className={`${bg} border ${border} rounded-lg p-2 flex flex-col min-h-[72px] justify-center`}
                  >
                    <span className={`text-[10px] font-semibold ${text}`}>
                      {label}
                    </span>
                    <span
                      className={`text-lg font-bold ${bold} tabular-nums mt-0.5 leading-tight`}
                    >
                      {value}
                    </span>
                    <span className={`text-[9px] ${sub} mt-auto leading-tight`}>
                      {note}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Per-agent follow-up breakdown table (collapsible) ── */}
           

            {/* Follow-up leads (all agents) — collapsible */}
            
          </div>
        </div>
      )}

      {stageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[400px]">
            <div className="flex justify-between mb-4">
              <h2 className="font-bold">{stageModal} Leads Breakdown</h2>
              <button onClick={() => setStageModal(null)}>✖</button>
            </div>

            {loadingStage ? (
              <p>Loading...</p>
            ) : stageData.length === 0 ? (
              <p>No data found</p>
            ) : (
              <div>
                
                {stageData.map((item, index) => (
  <div key={index} className="flex justify-between py-2 border-b">
    
    <span>
      {item.agentName || item.agentId || "Unknown" || "Unknown"}
    </span>

    <span className="font-semibold">
      {item.count}
    </span>

  </div>
))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Top stat cards ── */}
      <div className="">
        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 w-full">
          {/* Heading */}
          <h2 className="text-lg font-bold text-gray-900 mb-6">
            Plan Distribution
          </h2>

          {/* Row */}
          <div className="flex justify-between items-center gap-6">
            {/* Basic */}
            <div className="flex-1 flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-5 py-4 hover:shadow transition">
              <span className="text-sm font-medium text-blue-700">Basic</span>
              <span className="text-lg font-bold text-blue-800 bg-blue-100 px-3 py-1 rounded-full">
                {stats.planCounts?.basic || 0}
              </span>
            </div>

            {/* Standard */}
            <div className="flex-1 flex items-center justify-between bg-green-50 border border-green-100 rounded-xl px-5 py-4 hover:shadow transition">
              <span className="text-sm font-medium text-green-700">
                Standard
              </span>
              <span className="text-lg font-bold text-green-800 bg-green-100 px-3 py-1 rounded-full">
                {stats.planCounts?.standard || 0}
              </span>
            </div>

            {/* Premium */}
            <div className="flex-1 flex items-center justify-between bg-purple-50 border border-purple-100 rounded-xl px-5 py-4 hover:shadow transition">
              <span className="text-sm font-medium text-purple-700">
                Premium
              </span>
              <span className="text-lg font-bold text-purple-800 bg-purple-100 px-3 py-1 rounded-full">
                {stats.planCounts?.premium || 0}
              </span>
            </div>
          </div>
        </div>
      </div> <br /><br />

    

      {/* ── Agent Call breakdown (superAdmin/admin only) ── */}
      {(role === "superAdmin" || role === "admin") &&
        callStats &&
        callStats.todayCallsByAgent.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-violet-100 rounded-lg flex items-center justify-center">
                <Phone size={18} className="text-violet-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  Call Performance
                </h2>
                <p className="text-xs text-gray-500">
                  Today&apos;s calls per agent
                </p>
              </div>
              <span className="ml-auto text-sm font-semibold bg-violet-50 text-violet-700 px-3 py-1 rounded-full">
                Total: {callStats.totalCallsToday}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                    <th className="px-4 py-3 text-left rounded-l-lg">#</th>
                    <th className="px-4 py-3 text-left">Agent</th>
                    <th className="px-4 py-3 text-center">Calls Today</th>
                    <th className="px-4 py-3 text-center rounded-r-lg">
                      Total Calls
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {callStats.todayCallsByAgent
                    .slice()
                    .sort((a, b) => (b.count || 0) - (a.count || 0))
                    .map((agent, idx) => {
                      const totalEntry = callStats.totalCallsByAgent.find(
                        (a) => a.agentName === agent.agentName,
                      );
                      const colors = [
                        "bg-violet-500",
                        "bg-indigo-500",
                        "bg-blue-500",
                        "bg-teal-500",
                        "bg-emerald-500",
                      ];
                      const color = colors[idx % colors.length];
                      return (
                        <tr
                          key={agent.agentName}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3 text-gray-400 font-medium">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-7 h-7 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold`}
                              >
                                {(agent.agentName || "?")
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                              <span className="font-medium text-gray-800 capitalize">
                                {agent.agentName}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${color} text-white font-bold text-sm`}
                            >
                              {agent.count}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-gray-700">
                            {totalEntry?.count || agent.count}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {/* ── Per-agent follow-up breakdown (superAdmin/admin only) ── */}
      {(role === "superAdmin" || role === "admin") &&
        (followUpStats.byAgent || []).length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
                <CalendarClock size={18} className="text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  Follow-up Tracking — By Agent
                </h2>
                <p className="text-xs text-gray-500">
                  Live follow-up schedule for each agent
                </p>
              </div>
              <span className="ml-auto text-sm font-semibold bg-amber-50 text-amber-700 px-3 py-1 rounded-full">
                Total: {followUpStats.totalFollowUps}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                    <th className="px-4 py-3 text-left rounded-l-lg">#</th>
                    <th className="px-4 py-3 text-left">Agent</th>
                    <th className="px-4 py-3 text-center text-sky-600">
                      Today
                    </th>
                    <th className="px-4 py-3 text-center text-rose-600">
                      Tomorrow
                    </th>
                    <th className="px-4 py-3 text-center text-violet-600">
                      Next 7 Days
                    </th>
                    <th className="px-4 py-3 text-center text-green-600">
                      This Month
                    </th>
                    <th className="px-4 py-3 text-center rounded-r-lg text-amber-600">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(followUpStats.byAgent || []).map((agent, idx) => {
                    const colors = [
                      "bg-violet-500",
                      "bg-indigo-500",
                      "bg-blue-500",
                      "bg-teal-500",
                      "bg-emerald-500",
                      "bg-rose-500",
                    ];
                    const color = colors[idx % colors.length];
                    const name = agent.agentName || "Unknown";
                    return (
                      <tr
                        key={agent._id || idx}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 text-gray-400 font-medium">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-8 h-8 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold`}
                            >
                              {name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-800 capitalize">
                              {name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full text-xs font-bold ${agent.today > 0 ? "bg-sky-100 text-sky-700" : "text-gray-300"}`}
                          >
                            {agent.today || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full text-xs font-bold ${agent.tomorrow > 0 ? "bg-rose-100 text-rose-700" : "text-gray-300"}`}
                          >
                            {agent.tomorrow || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full text-xs font-bold ${agent.next7days > 0 ? "bg-violet-100 text-violet-700" : "text-gray-300"}`}
                          >
                            {agent.next7days || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full text-xs font-bold ${agent.thisMonth > 0 ? "bg-green-100 text-green-700" : "text-gray-300"}`}
                          >
                            {agent.thisMonth || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                            {agent.total || 0}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-gray-50 font-bold border-t-2 border-gray-200 text-sm">
                    <td colSpan={2} className="px-4 py-3 text-gray-600">
                      All Agents
                    </td>
                    <td className="px-4 py-3 text-center text-sky-700">
                      {followUpStats.todayFollowUps}
                    </td>
                    <td className="px-4 py-3 text-center text-rose-700">
                      {followUpStats.tomorrowFollowUps}
                    </td>
                    <td className="px-4 py-3 text-center text-violet-700">
                      {followUpStats.next7DaysFollowUps}
                    </td>
                    <td className="px-4 py-3 text-center text-green-700">
                      {followUpStats.thisMonthFollowUps}
                    </td>
                    <td className="px-4 py-3 text-center text-amber-700">
                      {followUpStats.totalFollowUps}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

      {/* ── Today's leads per agent (superAdmin/admin only) ── */}
      {agentLeads.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
              <UserCheck size={18} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                Today&apos;s Lead Assignments
              </h2>
              <p className="text-xs text-gray-500">
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <span className="ml-auto text-sm font-semibold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
              Total: {todayTotal}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 text-left rounded-l-lg">#</th>
                  <th className="px-4 py-3 text-left">Agent Name</th>
                  <th className="px-4 py-3 text-center">Leads Today</th>
                  <th className="px-4 py-3 text-left rounded-r-lg">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {agentLeads
                  .slice()
                  .sort((a, b) => (b.count || 0) - (a.count || 0))
                  .map((agent, idx) => {
                    const pct =
                      todayTotal > 0
                        ? Math.round(((agent.count || 0) / todayTotal) * 100)
                        : 0;
                    const colors = [
                      "bg-indigo-500",
                      "bg-blue-500",
                      "bg-teal-500",
                      "bg-emerald-500",
                      "bg-violet-500",
                    ];
                    const color = colors[idx % colors.length];
                    return (
                      <tr
                        key={agent._id || idx}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 text-gray-400 font-medium">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-8 h-8 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold`}
                            >
                              {(agent.agentName || "?").charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-800">
                              {agent.agentName || "Unknown"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center justify-center w-9 h-9 rounded-full ${color} text-white font-bold text-base`}
                          >
                            {agent.count || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 min-w-[140px]">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-2 ${color} rounded-full transition-all`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-400 w-9 text-right">
                              {pct}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
                    
          {agentLeads.length === 0 && (
            <div className="flex flex-col items-center py-10 text-gray-400">
              <AlertCircle size={24} className="mb-2" />
              <p className="text-sm">No leads assigned today yet.</p>
            </div>
          )}
        </div>
      )}

      {/* ── User Growth Chart ── */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-semibold mb-3 text-gray-800">
          Monthly User Growth
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={userGrowth}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#374151" />
            <YAxis stroke="#374151" />
            <Tooltip
              contentStyle={{ backgroundColor: "#fff", borderRadius: "10px" }}
            />
            <Line
              type="monotone"
              dataKey="users"
              stroke="#2563eb"
              strokeWidth={3}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {showChatStatsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-4xl max-h-[80vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
              <h2 className="text-2xl font-bold text-gray-800">
                {chatModalFilter === "today"
                  ? "Chats Today"
                  : chatModalFilter === "resolved"
                    ? "Resolved Chats"
                    : "All Chats"}
              </h2>
              <button
                onClick={() => setShowChatStatsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Issue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {chatStats.data
                    .filter((chat) => {
                      // Filter for agents: only show chats from their assigned users
                      if (role === "agent") {
                        // Check if the chat's user is in the currently fetched users list (which is filtered for the agent)
                        if (!users.some((u) => u.userId === chat.userId))
                          return false;
                      }

                      if (chatModalFilter === "today") {
                        if (!chat.createdAt) return false;
                        const chatDate = new Date(chat.createdAt);
                        const todayDate = new Date();
                        return (
                          chatDate.getDate() === todayDate.getDate() &&
                          chatDate.getMonth() === todayDate.getMonth() &&
                          chatDate.getFullYear() === todayDate.getFullYear()
                        );
                      }
                      if (chatModalFilter === "resolved") {
                        return chat.status === "resolved";
                      }
                      return true;
                    })
                    .map((chat, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(chat.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-800 font-medium">
                          <div>{chat.user?.fullName || "Unknown"}</div>
                          <div className="text-xs text-gray-500">
                            {chat?.user?.fullName}
                          </div>
                          <div>{chat.fullName || "Unknown"}</div>
                          <div className="text-xs text-gray-500">
                            {chat.mobile}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                          {chat.issue || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              chat.status === "resolved"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {chat.status || "open"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  {chatStats.data.filter((chat) => {
                    if (role === "agent") {
                      if (!users.some((u) => u.userId === chat.userId))
                        return false;
                    }

                    if (chatModalFilter === "today") {
                      if (!chat.createdAt) return false;
                      const chatDate = new Date(chat.createdAt);
                      const todayDate = new Date();
                      return (
                        chatDate.getDate() === todayDate.getDate() &&
                        chatDate.getMonth() === todayDate.getMonth() &&
                        chatDate.getFullYear() === todayDate.getFullYear()
                      );
                    }
                    if (chatModalFilter === "resolved") {
                      return chat.status === "resolved";
                    }
                    return true;
                  }).length === 0 && (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        No chats found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ title, value, icon, tone = "slate" }) {
  const toneClass = {
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
    violet: "border-violet-200 bg-violet-50 text-violet-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
  }[tone];

  return (
    <div className={`rounded-xl border p-4 ${toneClass}`}>
      <div className="mb-1 flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
