

"use client";
import { useState, useEffect, useMemo } from "react";

export default function useUserManagement(props = {}) {
  const { dateFilter: propDateFilter, startDate: propStartDate, endDate: propEndDate } = props;

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
    let dateParams = "";
    if (propDateFilter && propDateFilter !== "all") {
      if (propDateFilter === "custom" && propStartDate && propEndDate) {
         dateParams = `&dateFilter=custom&startDate=${propStartDate}&endDate=${propEndDate}`;
      } else if (propDateFilter !== "custom") {
         const end = new Date();
         const start = new Date();
         if (propDateFilter === "today") {
            start.setHours(0,0,0,0);
         } else if (propDateFilter === "1week") {
            start.setDate(start.getDate() - 7);
         } else if (propDateFilter === "1month") {
            start.setMonth(start.getMonth() - 1);
         } else if (propDateFilter === "6months") {
            start.setMonth(start.getMonth() - 6);
         }
         dateParams = `&dateFilter=${propDateFilter}&startDate=${start.toISOString()}&endDate=${end.toISOString()}`;
      }
    }

    const res = await fetch(`/api/users?email=${email}&getAgentStats=true${dateParams}`);
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
        let dateParams = "";
        if (propDateFilter && propDateFilter !== "all") {
          if (propDateFilter === "custom" && propStartDate && propEndDate) {
             dateParams = `?dateFilter=custom&startDate=${propStartDate}&endDate=${propEndDate}`;
          } else if (propDateFilter !== "custom") {
             const end = new Date();
             const start = new Date();
             if (propDateFilter === "today") {
                start.setHours(0,0,0,0);
             } else if (propDateFilter === "1week") {
                start.setDate(start.getDate() - 7);
             } else if (propDateFilter === "1month") {
                start.setMonth(start.getMonth() - 1);
             } else if (propDateFilter === "6months") {
                start.setMonth(start.getMonth() - 6);
             }
             dateParams = `?dateFilter=${propDateFilter}&startDate=${start.toISOString()}&endDate=${end.toISOString()}`;
          }
        }

        const res = await fetch(`/api/post-status${dateParams}`);
        const data = await res.json();
        if (data.success) {
          setTotalPostsCount(data.count || 0);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchPosts();
  }, [propDateFilter, propStartDate, propEndDate]);

  // ✅ REVENUE
  useEffect(() => {
    const fetchRevenue = async () => {
      const email = localStorage.getItem("email");
      const role = localStorage.getItem("role");

      if (!email || !role) return;

      try {
        let dateParams = "";
        if (propDateFilter && propDateFilter !== "all") {
          if (propDateFilter === "custom" && propStartDate && propEndDate) {
             dateParams = `&dateFilter=custom&startDate=${propStartDate}&endDate=${propEndDate}`;
          } else if (propDateFilter !== "custom") {
             const end = new Date();
             const start = new Date();
             if (propDateFilter === "today") {
                start.setHours(0,0,0,0);
             } else if (propDateFilter === "1week") {
                start.setDate(start.getDate() - 7);
             } else if (propDateFilter === "1month") {
                start.setMonth(start.getMonth() - 1);
             } else if (propDateFilter === "6months") {
                start.setMonth(start.getMonth() - 6);
             }
             dateParams = `&dateFilter=${propDateFilter}&startDate=${start.toISOString()}&endDate=${end.toISOString()}`;
          }
        }

        const res = await fetch(`/api/franchise-revenue?email=${email}&role=${role}${dateParams}`);
        const data = await res.json();

        if (data.success) {
          setTotalRevenue(data.totalRevenue || 0);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchRevenue();
  }, [propDateFilter, propStartDate, propEndDate]);

  // ✅ INITIAL FETCH
  useEffect(() => {
    fetchUsers();
  }, [propDateFilter, propStartDate, propEndDate]);

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