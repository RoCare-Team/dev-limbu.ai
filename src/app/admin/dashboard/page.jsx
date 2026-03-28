"use client";
import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Users, TrendingUp, UserCheck, AlertCircle, Phone, CalendarClock } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats]             = useState({ totalUsers: 0, totalRevenue: 0, planCounts: { basic: 0, standard: 0, premium: 0 } });
  const [userGrowth, setUserGrowth]   = useState([]);
  const [agentLeads, setAgentLeads]   = useState([]); // today's leads per agent
  const [todayTotal, setTodayTotal]   = useState(0);
  const [loading, setLoading]         = useState(true);
  const [role, setRole]               = useState("");
  const [callStats, setCallStats]     = useState(null);
  const [followUpStats, setFollowUpStats] = useState({ totalFollowUps: 0, todayFollowUps: 0, tomorrowFollowUps: 0, next7DaysFollowUps: 0, thisMonthFollowUps: 0, byAgent: [] });

  useEffect(() => {
    const storedRole = localStorage.getItem("role") || "";
    setRole(storedRole);
    fetchStats(storedRole);
  }, []);

  const fetchStats = async (currentRole) => {
    setLoading(true);
    const adminEmail = localStorage.getItem("email");
    if (!adminEmail) { setLoading(false); return; }

    try {
      // ── 1. Paginated list (totalUsers, growth) ───────────────────────────
      const listRes  = await fetch(`/api/users?email=${encodeURIComponent(adminEmail)}`);
      const listData = await listRes.json();

      if (listData.success) {
        setStats({ totalUsers: listData.totalUsers || 0, totalRevenue: 0, planCounts: { basic: 0, standard: 0, premium: 0 } });
        setUserGrowth(
          (listData.users || []).map((u) => ({
            date: new Date(u.createdAt).toLocaleDateString(),
            count: 1,
          }))
        );

        // superAdmin gets todayAgentAssignments in list response too
        if (listData.todayAgentAssignments) {
          setAgentLeads(listData.todayAgentAssignments);
          const total = listData.todayAgentAssignments.reduce((s, a) => s + (a.count || 0), 0);
          setTodayTotal(total);
        }
      }

      // ── 2. Agent stats (today per agent) ─────────────────────────────────
      const statsRes  = await fetch(`/api/users?email=${encodeURIComponent(adminEmail)}&getAgentStats=true`);
      const statsData = await statsRes.json();

      if (statsData.success && statsData.todayAgentAssignments) {
        setAgentLeads(statsData.todayAgentAssignments);
        const total = statsData.todayAgentAssignments.reduce((s, a) => s + (a.count || 0), 0);
        setTodayTotal(total);
      }

      // ── 3. Call & Follow-up stats ─────────────────────────────────────────
      if (currentRole === "superAdmin" || currentRole === "admin") {
        const [callRes, followRes] = await Promise.all([
          fetch(`/api/admin/call-stats?email=${encodeURIComponent(adminEmail)}`),
          fetch(`/api/admin/follow-up-stats?email=${encodeURIComponent(adminEmail)}&filter=all`),
        ]);
        const callData   = await callRes.json();
        const followData = await followRes.json();
        if (callData.success)   setCallStats(callData.stats);
        if (followData.success) setFollowUpStats(followData.stats);
      }
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
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard Overview</h1>

      {/* ── Top stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-500 text-white rounded-xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <h2 className="text-sm opacity-80">Total Leads</h2>
            <p className="text-3xl font-bold mt-1">{stats.totalUsers}</p>
          </div>
          <Users size={32} className="opacity-60" />
        </div>

        <div className="bg-teal-500 text-white rounded-xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <h2 className="text-sm opacity-80">Today's Leads</h2>
            <p className="text-3xl font-bold mt-1">{todayTotal}</p>
          </div>
          <TrendingUp size={32} className="opacity-60" />
        </div>

        <div className="bg-green-800 text-white rounded-xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <h2 className="text-sm opacity-80">Total Revenue</h2>
            <p className="text-3xl font-bold mt-1">₹{stats.totalRevenue?.toLocaleString() || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-md text-gray-800">
          <h2 className="text-lg font-semibold mb-3 text-gray-900">Plan Distribution</h2>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Basic</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 font-semibold">{stats.planCounts?.basic || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Standard</span>
              <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-600 font-semibold">{stats.planCounts?.standard || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Premium</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 font-semibold">{stats.planCounts?.premium || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Call Performance & Follow-up Stats (superAdmin/admin only) ── */}
      {(role === "superAdmin" || role === "admin") && callStats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-violet-500 text-white rounded-xl p-5 shadow-lg flex items-center justify-between col-span-2 sm:col-span-1">
            <div>
              <h2 className="text-sm opacity-80">Calls Today</h2>
              <p className="text-3xl font-bold mt-1">{callStats.totalCallsToday}</p>
            </div>
            <Phone size={28} className="opacity-60" />
          </div>
          <div className="bg-amber-500 text-white rounded-xl p-5 shadow-lg flex items-center justify-between">
            <div>
              <h2 className="text-sm opacity-80">Total Follow-ups</h2>
              <p className="text-3xl font-bold mt-1">{followUpStats.totalFollowUps}</p>
            </div>
            <CalendarClock size={28} className="opacity-60" />
          </div>
          <div className="bg-sky-500 text-white rounded-xl p-5 shadow-lg flex items-center justify-between">
            <div>
              <h2 className="text-sm opacity-80">Today&apos;s Follow-ups</h2>
              <p className="text-3xl font-bold mt-1">{followUpStats.todayFollowUps}</p>
            </div>
            <CalendarClock size={28} className="opacity-60" />
          </div>
          <div className="bg-rose-500 text-white rounded-xl p-5 shadow-lg flex items-center justify-between">
            <div>
              <h2 className="text-sm opacity-80">Tomorrow&apos;s</h2>
              <p className="text-3xl font-bold mt-1">{followUpStats.tomorrowFollowUps}</p>
            </div>
            <CalendarClock size={28} className="opacity-60" />
          </div>
          <div className="bg-emerald-500 text-white rounded-xl p-5 shadow-lg flex items-center justify-between">
            <div>
              <h2 className="text-sm opacity-80">Next 7 Days</h2>
              <p className="text-3xl font-bold mt-1">{followUpStats.next7DaysFollowUps}</p>
            </div>
            <CalendarClock size={28} className="opacity-60" />
          </div>
          <div className="bg-indigo-500 text-white rounded-xl p-5 shadow-lg flex items-center justify-between">
            <div>
              <h2 className="text-sm opacity-80">This Month</h2>
              <p className="text-3xl font-bold mt-1">{followUpStats.thisMonthFollowUps}</p>
            </div>
            <CalendarClock size={28} className="opacity-60" />
          </div>
        </div>
      )}

      {/* ── Agent Call breakdown (superAdmin/admin only) ── */}
      {(role === "superAdmin" || role === "admin") && callStats && callStats.todayCallsByAgent.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 bg-violet-100 rounded-lg flex items-center justify-center">
              <Phone size={18} className="text-violet-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Call Performance</h2>
              <p className="text-xs text-gray-500">Today&apos;s calls per agent</p>
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
                  <th className="px-4 py-3 text-center rounded-r-lg">Total Calls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {callStats.todayCallsByAgent
                  .slice()
                  .sort((a, b) => (b.count || 0) - (a.count || 0))
                  .map((agent, idx) => {
                    const totalEntry = callStats.totalCallsByAgent.find(
                      a => a.agentName === agent.agentName
                    );
                    const colors = ["bg-violet-500", "bg-indigo-500", "bg-blue-500", "bg-teal-500", "bg-emerald-500"];
                    const color = colors[idx % colors.length];
                    return (
                      <tr key={agent.agentName} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-400 font-medium">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold`}>
                              {(agent.agentName || "?").charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-800 capitalize">{agent.agentName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${color} text-white font-bold text-sm`}>
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
      {(role === "superAdmin" || role === "admin") && (followUpStats.byAgent || []).length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
              <CalendarClock size={18} className="text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Follow-up Tracking — By Agent</h2>
              <p className="text-xs text-gray-500">Live follow-up schedule for each agent</p>
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
                  <th className="px-4 py-3 text-center text-sky-600">Today</th>
                  <th className="px-4 py-3 text-center text-rose-600">Tomorrow</th>
                  <th className="px-4 py-3 text-center text-violet-600">Next 7 Days</th>
                  <th className="px-4 py-3 text-center text-green-600">This Month</th>
                  <th className="px-4 py-3 text-center rounded-r-lg text-amber-600">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(followUpStats.byAgent || []).map((agent, idx) => {
                  const colors = ["bg-violet-500","bg-indigo-500","bg-blue-500","bg-teal-500","bg-emerald-500","bg-rose-500"];
                  const color  = colors[idx % colors.length];
                  const name   = agent.agentName || "Unknown";
                  return (
                    <tr key={agent._id || idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-400 font-medium">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold`}>
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-800 capitalize">{name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full text-xs font-bold ${agent.today > 0 ? "bg-sky-100 text-sky-700" : "text-gray-300"}`}>
                          {agent.today || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full text-xs font-bold ${agent.tomorrow > 0 ? "bg-rose-100 text-rose-700" : "text-gray-300"}`}>
                          {agent.tomorrow || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full text-xs font-bold ${agent.next7days > 0 ? "bg-violet-100 text-violet-700" : "text-gray-300"}`}>
                          {agent.next7days || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full text-xs font-bold ${agent.thisMonth > 0 ? "bg-green-100 text-green-700" : "text-gray-300"}`}>
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
                  <td colSpan={2} className="px-4 py-3 text-gray-600">All Agents</td>
                  <td className="px-4 py-3 text-center text-sky-700">{followUpStats.todayFollowUps}</td>
                  <td className="px-4 py-3 text-center text-rose-700">{followUpStats.tomorrowFollowUps}</td>
                  <td className="px-4 py-3 text-center text-violet-700">{followUpStats.next7DaysFollowUps}</td>
                  <td className="px-4 py-3 text-center text-green-700">{followUpStats.thisMonthFollowUps}</td>
                  <td className="px-4 py-3 text-center text-amber-700">{followUpStats.totalFollowUps}</td>
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
              <h2 className="text-lg font-bold text-gray-800">Today&apos;s Lead Assignments</h2>
              <p className="text-xs text-gray-500">{new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
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
                    const pct = todayTotal > 0 ? Math.round(((agent.count || 0) / todayTotal) * 100) : 0;
                    const colors = ["bg-indigo-500", "bg-blue-500", "bg-teal-500", "bg-emerald-500", "bg-violet-500"];
                    const color  = colors[idx % colors.length];
                    return (
                      <tr key={agent._id || idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-400 font-medium">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold`}>
                              {(agent.agentName || "?").charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-800">{agent.agentName || "Unknown"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full ${color} text-white font-bold text-base`}>
                            {agent.count || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 min-w-[140px]">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                              <div className={`h-2 ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-gray-400 w-9 text-right">{pct}%</span>
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
        <h2 className="text-lg font-semibold mb-3 text-gray-800">Monthly User Growth</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={userGrowth}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#374151" />
            <YAxis stroke="#374151" />
            <Tooltip contentStyle={{ backgroundColor: "#fff", borderRadius: "10px" }} />
            <Line type="monotone" dataKey="users" stroke="#2563eb" strokeWidth={3} activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
