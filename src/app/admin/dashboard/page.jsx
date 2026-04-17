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

  //service
  const [users, setUsers] = useState([]);
  const [showServiceModal, setShowServiceModal] = useState(false);

  const serviceUsersCount = users?.filter((u) => u.paidService).length || 0;

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

  const fetchUsers = async () => {
    try {
      const email = localStorage.getItem("email");

      const res = await fetch(`/api/users?email=${email}`);
      const data = await res.json();

      console.log("🔥 USERS DATA:", data);

      // 🔥 SAFE HANDLING
      if (data.success && Array.isArray(data.users)) {
        setUsers(data.users);
      } else {
        setUsers([]); // fallback
      }
    } catch (err) {
      console.error(err);
      setUsers([]);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchStageData = async (stage) => {
    console.log("FUNCTION CALLED:", stage);

    setLoadingStage(true);
    setStageModal(stage);

    try {
      const email = localStorage.getItem("email");

      if (!email) {
        console.warn("No email found in localStorage");
        setStageData([]);
        return;
      }

      const res = await fetch(`/api/users?email=${email}&getAgentStats=true`);

      console.log("RESPONSE STATUS:", res.status);

      if (!res.ok) {
        console.error("API response not OK");
        setStageData([]);
        return;
      }

      const data = await res.json();

      console.log("FULL API DATA:", data);

      if (data.detailedStats && Array.isArray(data.detailedStats)) {
        const stageItems = data.detailedStats.filter(
          (item) => item.stage === stage,
        );

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

        const breakdown = Object.values(grouped).sort(
          (a, b) => b.count - a.count,
        );

        console.log("FINAL BREAKDOWN:", breakdown);

        setStageData(breakdown);
      } else {
        console.warn("No detailedStats found");
        setStageData([]);
      }
    } catch (err) {
      console.error("FETCH ERROR:", err);
      setStageData([]);
    } finally {
      setLoadingStage(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const res = await fetch(
        `/api/users?email=${localStorage.getItem("email")}&getAgentStats=true`,
      );
      const data = await res.json();

      console.log("AGENT LIST:", data);

      console.log("AGENTS:", data);

      const map = {};

      // ✅ YAHI FIX HAI
      const list = data.users || data.data || [];

      list.forEach((a) => {
        map[a._id?.toString()] = a.fullName || a.name || "Unknown";
      });

      console.log("FINAL AGENT MAP:", map);

      setAgentMap(map);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

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
        fetch(
          `/api/admin/account-manager-leads?email=${encodeURIComponent(adminEmail)}`,
        ),
      ]);

      const [txJson, serviceJson, packageJson, managerJson] = await Promise.all(
        [txRes.json(), serviceRes.json(), packageRes.json(), managerRes.json()],
      );

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
        const name =
          u?.accountManager?.fullName || u?.accountManagerName || "Unassigned";
        if (!perfMap[name])
          perfMap[name] = { name, assigned: 0, renewalDue: 0 };
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
        renewalDueCount: managerPerformance.reduce(
          (sum, m) => sum + m.renewalDue,
          0,
        ),
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
      <div className="flex justify-center items-center h-[80vh]">
        <div className="w-30 h-30 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
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
        stageModal={stageModal}
        stageData={stageData}
        loadingStage={loadingStage}
      />

      {/* Stage Breakdown Modal */}
      {stageModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl transform transition-all">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h2 className="text-xl font-bold text-gray-800">
                {stageModal} Leads Breakdown
              </h2>
              <button
                onClick={() => setStageModal(null)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto pr-2">
              <table className="w-full">
                {role === "agent" ? (
                  // Agent View: Show List of Users
                  <>
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                          User Name
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase">
                          Phone
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {users
                        .filter((u) => (u.leadStage || "Active") === stageModal)
                        .map((user, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                              {user.fullName || "Unknown"}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 text-right">
                              {user.phone || user.mobileNumber || "N/A"}
                            </td>
                          </tr>
                        ))}
                      {users.filter(
                        (u) => (u.leadStage || "Active") === stageModal,
                      ).length === 0 && (
                        <tr>
                          <td
                            colSpan="2"
                            className="text-center py-4 text-gray-500 text-sm"
                          >
                            No users found on this page
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </>
                ) : (
                  // Admin View: Show Agent Breakdown
                  <>
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                          Agent
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase">
                          Count
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {Object.values(
                        stageData
                          .filter((item) => item.stage === stageModal)
                          .reduce((acc, item) => {
                            const agentName =
                              item.agentId === "Unassigned"
                                ? "Unassigned"
                                : agentMap[item.agentId?.toString()] ||
                                  item.agentId;

                            if (!acc[agentName]) {
                              acc[agentName] = { agentName, count: 0 };
                            }

                            acc[agentName].count += item.count;

                            return acc;
                          }, {}),
                      )
                        .sort((a, b) => b.count - a.count)
                        .map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                              {item.agentName}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-800 text-right font-bold">
                              {item.count}
                            </td>
                          </tr>
                        ))}

                      {stageData.filter((item) => item.stage === stageModal)
                        .length === 0 && (
                        <tr>
                          <td
                            colSpan="2"
                            className="text-center py-4 text-gray-500 text-sm"
                          >
                            No leads in this stage
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

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

      <div className="mb-8 grid gap-6 xl:grid-cols-3">
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.35)] p-6 min-h-[500px] flex flex-col">
          <div className="flex align-center mb-2 gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-3xl bg-indigo-600 text-white shadow-lg">
              <UserCog size={16} />
            </div>
            <div>
              <h3 className="mt-1 text-1xl font-semibold text-slate-900">
                {" "}
                Account Managers
              </h3>
            </div>
          </div>

          <div className="flex-1 overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50">
            <div className="border-b border-slate-200 bg-slate-100 px-5 py-4">
              <div className="grid grid-cols-[1.5fr_0.7fr_0.7fr_0.7fr] gap-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                <span>Manager</span>
                <span className="text-right">Assigned</span>
                <span className="text-right">Renewals Due</span>
              </div>
            </div>

            <div className="max-h-[calc(100%-56px)] overflow-y-auto">
              <table className="min-w-full border-collapse text-sm text-slate-700">
                <tbody className="bg-slate-50">
                  {dashboardKpis.managerPerformance.slice(0, 8).map((m) => {
                    const leadCount = agentLeads.find(
                      (a) => a.agentName === m.name,
                    )?.count;
                    const formatPositive = (value) =>
                      Number(value) > 0 ? value : "";
                    return (
                      <tr
                        key={m.name}
                        className="border-b border-slate-200 bg-white hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <div className="font-medium text-slate-900 truncate">
                            {m.name}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right font-semibold text-slate-800">
                          {formatPositive(m.assigned)}
                        </td>
                        <td className="px-5 py-4 text-right font-semibold text-rose-600">
                          {m.renewalDue != null ? m.renewalDue : ""}
                        </td>
                        <td className="px-5 py-4 text-right font-semibold text-indigo-600">
                          {leadCount != null ? leadCount : ""}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {dashboardKpis.managerPerformance.length === 0 && (
                <div className="flex h-full items-center justify-center p-6 text-center text-slate-500">
                  No manager performance data available.
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Follow-up Tracking
                </p>
                <h4 className="mt-2 text-sm font-semibold text-slate-900">
                  By Agent
                </h4>
              </div>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                Total: {followUpStats.totalFollowUps}
              </span>
            </div>

            <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50">
              <div className="max-h-[260px] overflow-y-auto">
                <table className="min-w-full border-collapse text-sm text-slate-700">
                  <thead className="bg-slate-100 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-left">Agent</th>
                      <th className="px-4 py-3 text-right">Today</th>
                      <th className="px-4 py-3 text-right">Tomorrow</th>
                      <th className="px-4 py-3 text-right">Next 7 Days</th>
                      <th className="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-slate-50">
                    {(followUpStats.byAgent || []).map((agent, idx) => (
                      <tr
                        key={agent._id || agent.agentName || idx}
                        className="border-b border-slate-200 bg-white hover:bg-slate-50"
                      >
                        <td className="px-4 py-4">
                          <div className="font-medium text-slate-900 truncate">
                            {agent.agentName || "Unknown"}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right font-semibold text-sky-700">
                          {agent.today || 0}
                        </td>
                        <td className="px-4 py-4 text-right font-semibold text-rose-700">
                          {agent.tomorrow || 0}
                        </td>
                        <td className="px-4 py-4 text-right font-semibold text-violet-700">
                          {agent.next7days || 0}
                        </td>
                        <td className="px-4 py-4 text-right font-semibold text-emerald-700">
                          {agent.total || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {(followUpStats.byAgent || []).length === 0 && (
                  <div className="flex h-40 items-center justify-center p-6 text-center text-sm text-slate-500">
                    No follow-up tracking data available.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[32px] border border-slate-200 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.35)] p-6 min-h-[500px] flex flex-col">
          <div className="flex gap-2 mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-3xl bg-sky-600 text-white shadow-lg">
              <Phone size={16} />
            </div>
            <div>
              <h3 className="mt-1 text-1xl font-semibold text-slate-900">
                Calls & Follow-ups
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="rounded-[28px] bg-gradient-to-br from-sky-50 to-sky-100 p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-sky-700">
                Calls Today
              </p>
              <p className="mt-4 text-3xl font-semibold text-slate-900">
                {callStats?.totalCallsToday || 0}
              </p>
            </div>
            <div className="rounded-[28px] bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">
                Total Follow-ups
              </p>
              <p className="mt-4 text-3xl font-semibold text-slate-900">
                {followUpStats.totalFollowUps || 0}
              </p>
            </div>
            <div className="rounded-[28px] bg-gradient-to-br from-sky-50 via-slate-50 to-sky-100 p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-sky-700">
                Today
              </p>
              <p className="mt-4 text-3xl font-semibold text-slate-900">
                {followUpStats.todayFollowUps || 0}
              </p>
            </div>
            <div className="rounded-[28px] bg-gradient-to-br from-violet-50 via-slate-50 to-violet-100 p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-violet-700">
                Tomorrow
              </p>
              <p className="mt-4 text-3xl font-semibold text-slate-900">
                {followUpStats.tomorrowFollowUps || 0}
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-800">
                Follow-up schedule
              </h4>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                Live
              </span>
            </div>
            <div className="space-y-3">
              <div className="rounded-3xl border border-amber-100 bg-amber-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-amber-700">
                  Total
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {followUpStats.totalFollowUps || 0}
                </p>
              </div>
              <div className="rounded-3xl border border-violet-100 bg-violet-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-violet-700">
                  Next 7 Days
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {followUpStats.next7DaysFollowUps || 0}
                </p>
              </div>
              <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-emerald-700">
                  This Month
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {followUpStats.thisMonthFollowUps || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[32px] border border-slate-200 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.35)] p-6 min-h-[500px] flex flex-col">
          <div className="flex  gap-2 mb-4">
            

            <div
              onClick={() => setShowServiceModal(true)}
              className="cursor-pointer relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-3xl p-6 mt-6 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
            >
              {/* 🔥 Background Glow */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>

              <div className="flex items-center justify-between relative z-10">
                {/* LEFT */}
                <div>
                  <h2 className="text-xl font-semibold tracking-wide">
                    Total Service
                  </h2>

                  <p className="text-sm text-white/80 mt-1">
                    Click to view details
                  </p>
                </div>

                {/* RIGHT COUNT */}
                <div className="text-right">
                  <p className="text-4xl font-bold leading-none">
                    {serviceUsersCount}
                  </p>
                  <p className="text-xs text-white/70 mt-1">Users</p>
                </div>
              </div>
            </div>
          </div>

          {showServiceModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white w-[90%] max-w-4xl rounded-2xl shadow-lg p-6 relative">
                {/* CLOSE BUTTON */}
                <button
                  onClick={() => setShowServiceModal(false)}
                  className="absolute top-3 right-3 text-gray-500 hover:text-black"
                >
                  ✕
                </button>

                <h2 className="text-xl font-semibold mb-4">Service Details</h2>

                {/* 🔥 TABLE YAHI AA JAYEGA */}
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-gray-700">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left">User</th>
                        <th className="px-4 py-2 text-left">Service</th>
                        <th className="px-4 py-2 text-left">Plan</th>
                        <th className="px-4 py-2 text-left">Start</th>
                        <th className="px-4 py-2 text-left">Expiry</th>
                      </tr>
                    </thead>

                    <tbody>
                      {users
                        ?.filter((user) => user.paidService)
                        .map((user, index) => (
                          <tr key={index} className="border-t">
                            <td className="px-4 py-2">{user.email}</td>
                            <td className="px-4 py-2">{user.paidService}</td>
                            <td className="px-4 py-2">{user.planDuration}</td>
                            <td className="px-4 py-2">
                              {new Date(
                                user.packageStartDate,
                              ).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-2">
                              {new Date(
                                user.packageExpiryDate,
                              ).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 p-5">
            <h4 className="mb-4 text-sm font-semibold text-slate-800">
              Call Performance
            </h4>
            <div className="overflow-hidden">
              <table className="min-w-full border-collapse text-sm text-slate-700">
                <thead className="bg-slate-100 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Agent</th>
                    <th className="px-3 py-2 text-right">Today</th>
                    <th className="px-3 py-2 text-right">Total</th>
                    <th className="px-3 py-2 text-right">Leads</th>
                  </tr>
                </thead>
                <tbody className="bg-slate-50">
                  {(callStats?.todayCallsByAgent || [])
                    .slice(0, 6)
                    .sort((a, b) => (b.count || 0) - (a.count || 0))
                    .map((agent, idx) => {
                      const totalEntry = callStats?.totalCallsByAgent?.find(
                        (a) => a.agentName === agent.agentName,
                      );
                      const leadCount = agentLeads.find(
                        (a) => a.agentName === agent.agentName,
                      )?.count;
                      return (
                        <tr
                          key={agent.agentId || agent.agentName || idx}
                          className="border-b border-slate-200 bg-white hover:bg-slate-50"
                        >
                          <td className="px-3 py-2">
                            <div className="font-medium text-slate-900 truncate">
                              {agent.agentName || "Unknown"}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-emerald-700">
                            {agent.count > 0 ? agent.count : ""}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-violet-700">
                            {(totalEntry?.count || agent.count) > 0
                              ? totalEntry?.count || agent.count
                              : ""}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-indigo-700">
                            {Number(leadCount) > 0 ? leadCount : ""}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
              {(callStats?.todayCallsByAgent || []).length === 0 && (
                <div className="flex h-20 items-center justify-center p-6 text-center text-sm text-slate-500">
                  No call data available.
                </div>
              )}
            </div>
          </div>
        </div>
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
