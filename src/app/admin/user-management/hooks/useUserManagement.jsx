

"use client";
import { useState, useEffect, useMemo } from "react";

export default function useUserManagement() {

  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [stageStats, setStageStats] = useState({});
  const [totalPostsCount, setTotalPostsCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [todayUsersCount, setTodayUsersCount] = useState(0);
  const [todayUsersMetaLeads, setTodayUsersMetaLeads] = useState(0);
  const [todayUsersSignups, setTodayUsersSignups] = useState(0);

  const [role, setRole] = useState("");
  const [filterDate, setFilterDate] = useState("All");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

 

  const isAgent = role === "agent";
  const isManager = role === "manager";

  // ✅ FILTER LABEL
  const filterLabel = useMemo(() => {
    if (filterDate === "All") return null;
    if (filterDate === "Custom Range") {
      if (customStartDate && customEndDate) {
        return `${customStartDate} - ${customEndDate}`;
      }
      return "Custom Range";
    }
    return filterDate;
  }, [filterDate, customStartDate, customEndDate]);

  // ✅ INIT ROLE
  useEffect(() => {
    setRole(localStorage.getItem("role") || "");
  }, []);

  // ✅ FETCH USERS + STATS
  const fetchUsers = async () => {
  const email = localStorage.getItem("email");
  if (!email) return;

  try {
    const res = await fetch(`/api/users?email=${email}&getAgentStats=true`);
    const data = await res.json();

    if (data.success) {
      setStageStats(data.stageStats || {});
      setStats({
  totalUsers:
    (data.stageStats?.Active || 0) +
    (data.stageStats?.["Follow Up"] || 0) +
    (data.stageStats?.Inactive || 0) +
    (data.stageStats?.Onboard || 0)
});
    }

  } catch (err) {
    console.error(err);
  }
};

  // ✅ POSTS COUNT
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch("/api/post-status");
        const data = await res.json();
        if (data.success) {
          setTotalPostsCount(data.count || 0);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchPosts();
  }, []);

  // ✅ REVENUE
  useEffect(() => {
    const fetchRevenue = async () => {
      const email = localStorage.getItem("email");
      const role = localStorage.getItem("role");

      if (!email || !role) return;

      try {
        const res = await fetch(`/api/franchise-revenue?email=${email}&role=${role}`);
        const data = await res.json();

        if (data.success) {
          setTotalRevenue(data.totalRevenue || 0);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchRevenue();
  }, []);

  // ✅ INITIAL FETCH
  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
     stats,   // ✅ ADD
  stageStats,
    stageStats,
    totalPostsCount,
    totalRevenue,
    todayUsersCount,
    todayUsersMetaLeads,
    todayUsersSignups,
    filterLabel,
    isAgent,
    isManager,
  };
}