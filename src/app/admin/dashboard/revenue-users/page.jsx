"use client";

import { useState, useEffect } from "react";
import {
  X,
  RefreshCw,
  Wallet,
  Eye,
  Users,
  IndianRupee,
  TrendingUp,
  Layers,
  Briefcase,
  Crown,
  Headphones,
  Settings,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function RevenueUsersPage() {
  // "package" | "service"

  const router = useRouter();
  const [loadingRevenueUsers, setLoadingRevenueUsers] = useState(false);
  const [fullViewImage, setFullViewImage] = useState(null);
  const [approvalBusyId, setApprovalBusyId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  //service

  const [showServiceModal, setShowServiceModal] = useState(false);

  const [activeView, setActiveView] = useState("package");
  const [revenueUsersList, setRevenueUsersList] = useState([]);
  const [users, setUsers] = useState([]);

  // packge delete edit modal
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [editModal, setEditModal] = useState(false);
  const [editData, setEditData] = useState(null);

  const [editPlan, setEditPlan] = useState("");
  const [editRemarks, setEditRemarks] = useState("");

  // service delete edit modal
  const [editServiceModal, setEditServiceModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [deleteType, setDeleteType] = useState("");

  const [editAmount, setEditAmount] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const displayData = activeView === "package" ? revenueUsersList : users;

  const todayUsers = revenueUsersList.filter((r) => {
    const today = new Date().toDateString();
    const userDate = new Date(r.createdAt).toDateString();
    return today === userDate;
  });

  // service
  const serviceUsersCount = users?.filter((u) => u.paidService).length || 0;
  const serviceUsers = users.filter((u) => u.paidService || u.isServiceBooked);

  // refresh
  const [isRefreshing, setIsRefreshing] = useState(false);

  // tota users
  const totalUsers =
    activeView === "package"
      ? revenueUsersList.length
      : users.filter((u) => u.paidService).length;

  // total revenue ========
  // 🔥 TOTAL REVENUE
  const totalRevenue =
    activeView === "package"
      ? (revenueUsersList || []).reduce(
          (sum, r) => sum + (Number(r.amount) || 0),
          0,
        )
      : (users || [])
          .filter((u) => u.paidService)
          .reduce((sum, u) => sum + (Number(u.amount) || 0), 0);

  // 🔥 TODAY REVENUE

  const today = new Date().toISOString().split("T")[0];

  const todayRevenue =
    activeView === "package"
      ? (revenueUsersList || [])
          .filter((r) => {
            if (!r.createdAt) return false;
            return r.createdAt.split("T")[0] === today;
          })
          .reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
      : (users || [])
          .filter((u) => {
            if (!u.packageStartDate) return false;
            return u.packageStartDate.split("T")[0] === today && u.paidService;
          })
          .reduce((sum, u) => sum + (Number(u.amount) || 0), 0);

  // service package

  const assistanceUsers = users.filter(
    (u) => u.paidService && u.paidService.toLowerCase().includes("assistance"),
  ).length;

  const creationUsers = users.filter(
    (u) => u.paidService && u.paidService.toLowerCase().includes("creation"),
  ).length;

  // service plane
  const planCounts =
    activeView === "package"
      ? {
          basic: revenueUsersList.filter((r) =>
            r.plan?.toLowerCase().includes("basic"),
          ).length,
          professional: revenueUsersList.filter((r) =>
            r.plan?.toLowerCase().includes("professional"),
          ).length,
        }
      : {
          assistance: users.filter((u) =>
            u.paidService?.toLowerCase().includes("assistance"),
          ).length,
          creation: users.filter((u) =>
            u.paidService?.toLowerCase().includes("creation"),
          ).length,
        };

  useEffect(() => {
    const email = localStorage.getItem("email"); // 🔥 IMPORTANT

    fetch(`/api/users?email=${email}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("USERS DATA 👉", data);
        setUsers(data.users || []);
      });
  }, []);

  const premiumUsers = revenueUsersList.filter((r) =>
    r.plan?.toLowerCase().includes("premium"),
  );

  const role =
    typeof window !== "undefined" ? localStorage.getItem("role") : "";

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

  const fetchRevenueUsers = async () => {
    setLoadingRevenueUsers(true);

    try {
      const email = localStorage.getItem("email");
      const role = localStorage.getItem("role");

      const params = new URLSearchParams({
        type: "user_onboard",
        email,
        role,
      });

      const res = await fetch(`/api/franchise-revenue?${params}`);
      const data = await res.json();

      if (data.success) {
        setRevenueUsersList(data.revenue || []);
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

  useEffect(() => {
    fetchRevenueUsers();
  }, []);

  // pacakge approve and not approve
  const handleOnboardApproval = async (revenue, decision) => {
    const id = revenue?._id;
    if (!id) return;
    setApprovalBusyId(String(id));
    try {
      const res = await fetch("/api/franchise-revenue/onboard-approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email:
            typeof window !== "undefined" ? localStorage.getItem("email") : "",
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

  // ====service  approve and not approve ====
  const handleServiceApproval = async (user, decision) => {
    const id = user?._id;
    if (!id) return;

    setApprovalBusyId(String(id)); // 🔥 ADD THIS

    try {
      const res = await fetch("/api/franchise-revenue/onboard-approval", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: localStorage.getItem("email"),
          userId: user._id,
          decision,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u._id === user._id ? { ...u, planApprovalStatus: decision } : u,
          ),
        );
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setApprovalBusyId(null); // 🔥 ADD THIS
    }
  };

  // filter and search ===============
  const filteredData = (
    activeView === "package" ? revenueUsersList : users
  ).filter((item) => {
    const name =
      item.name || item.fullName || item.userName || item.leadName || "";

    const email = item.email || "";

    // 🔍 SEARCH
    const matchSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase());

    // 📦 PLAN / SERVICE
    const plan = item.plan || item.paidService || "";
    const matchPlan = planFilter
      ? plan.toLowerCase().includes(planFilter)
      : true;

    // ✅ STATUS
    const status = item.planApprovalStatus || "pending";
    const matchStatus = statusFilter ? status === statusFilter : true;

    return matchSearch && matchPlan && matchStatus;
  });

  // reshresh
  const handleRefresh = async () => {
    setIsRefreshing(true);

    try {
      await fetchRevenueUsers();
    } catch (err) {
      console.log(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // package handle edit

  const handleEdit = (item) => {
    setEditData(item);

    setEditPlan(item.plan || "");
    setEditAmount(item.amount || "");
    setEditRemarks(item.planRemarks || "");

    setEditModal(true);
  };

  // package handle delte
  const handleUpdatePackage = async () => {
    try {
      const res = await fetch("/api/franchise-revenue", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editData._id,
          plan: editPlan,
          amount: editAmount,
          planRemarks: editRemarks,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setEditModal(false);
        fetchRevenueUsers();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const confirmDelete = async () => {
    try {
      let url = "";

      if (deleteType === "service") {
        url = `/api/franchise-revenue?id=${selectedId}&type=service`;
      } else {
        url = `/api/franchise-revenue?id=${selectedId}`;
      }

      const res = await fetch(url, { method: "DELETE" });

      // ✅ SAFE JSON PARSE (IMPORTANT)
      let data = {};
      try {
        data = await res.json();
      } catch (e) {
        console.error("JSON parse error", e);
      }

      // ✅ अगर API fail भी करे तो proper message मिले
      if (!res.ok) {
        alert(data.message || "Delete failed (server error)");
        return;
      }

      if (data.success) {
        setDeleteModal(false);
        setSelectedId(null);

        // 🔥 दोनों refresh करो
        fetchRevenueUsers();

        const email = localStorage.getItem("email");
        const usersRes = await fetch(`/api/users?email=${email}`);

        let usersData = {};
        try {
          usersData = await usersRes.json();
        } catch (e) {
          console.error("Users JSON parse error", e);
        }

        setUsers(usersData.users || []);
      } else {
        alert(data.message || "Delete failed");
      }
    } catch (err) {
      console.error("DELETE ERROR:", err);
      alert("Something went wrong");
    }
  };

  // service handle edit
  const updateService = async () => {
    try {
      const res = await fetch("/api/franchise-revenue", {
        // 🔥 वापस यही करो
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedService._id,
          amount: editAmount,
          notes: editNotes,

          type: "service", // 🔥 MUST (ये सबसे important)
        }),
      });

      let data = {};
      try {
        data = await res.json();
      } catch (e) {
        console.error("JSON parse error", e);
      }

      if (data.success) {
        setEditServiceModal(false);
        setSelectedService(null);

        fetchRevenueUsers();

        const email = localStorage.getItem("email");
        const usersRes = await fetch(`/api/users?email=${email}`);
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      } else {
        alert(data.message || "Update failed");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  return (
    <>
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          {/* LEFT SIDE */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight">
              User Onboard Revenue
            </h2>
          </div>

          {/* RIGHT SIDE ACTION */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
            bg-gradient-to-r from-indigo-600 to-purple-600 text-white
            shadow-md hover:shadow-lg hover:scale-[1.03] transition-all duration-200
             disabled:opacity-70"
          >
            <RefreshCw
              size={18}
              className={isRefreshing ? "animate-spin" : ""}
            />
            {isRefreshing ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>

        {/* ===== TOGGLE ===== */}
        <div className="flex mb-2">
          <div className="relative flex bg-gray-100 rounded-xl p-1">
            {/* Sliding background */}
            <div
              className={`absolute top-1 bottom-1 w-1/2 rounded-lg transition-all duration-300 ${
                activeView === "package"
                  ? "left-1 bg-indigo-600"
                  : "left-1/2 bg-purple-600"
              }`}
            />

            {/* PACKAGE */}
            <button
              onClick={() => setActiveView("package")}
              className={`relative z-10 px-5 py-2 text-sm font-medium rounded-lg transition ${
                activeView === "package" ? "text-white" : "text-gray-600"
              }`}
            >
              📦 Package
            </button>

            {/* SERVICE */}
            <button
              onClick={() => setActiveView("service")}
              className={`relative z-10 px-5 py-2 text-sm font-medium rounded-lg transition ${
                activeView === "service" ? "text-white" : "text-gray-600"
              }`}
            >
              🛠 Service
            </button>
          </div>
        </div>

        {/* ===== STATS ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
          {/* TOTAL Revenue USERS */}
          <div className="bg-white rounded-2xl p-5  shadow-md border border-gray-100 hover:shadow-lg transition flex items-center justify-between">
            {/* LEFT TEXT */}
            <div>
              <p className="text-sm text-gray-500">Total Revenue Users</p>
              <h2 className="text-2xl font-bold text-dark  mt-2">
                {totalUsers}
              </h2>
            </div>

            {/* RIGHT ICON */}
            <div className="bg-indigo-100 text-dark p-3 rounded-xl">
              <Users size={20} />
            </div>
          </div>

          {/* TODAY Revenue USERS */}
          <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Today Revenue Users</p>
              <h2 className="text-2xl font-bold text-gray-700 mt-2">
                {todayUsers.length}
              </h2>
            </div>

            <div className="bg-blue-100 text-da p-3 rounded-xl">
              <Users size={20} />
            </div>
          </div>

          {/* 🔥 MAIN REVENUE CARD (highlight) */}
          <div className="bg-white rounded-2xl p-3 shadow-md border border-gray-100 hover:shadow-lg transition flex items-center justify-between ">
            <div>
              <p className="text-sm text-dark opacity-90">Total Revenue</p>
              <h2 className="text-2xl text-gray-700 font-bold mt-2">
                ₹{totalRevenue.toLocaleString("en-IN")}
              </h2>
            </div>

            <div className="bg-blue-100 p-3  text-gray-700 rounded-xl backdrop-blur ml-2">
              <IndianRupee size={20} />
            </div>
          </div>

          {/* TODAY REVENUE */}
          <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 whitespace-nowrap">
                Today Revenue
              </p>

              <h2 className="text-2xl font-bold text-gray-700 mt-2">
                ₹{todayRevenue.toLocaleString("en-IN")}
              </h2>
            </div>

            <div className="bg-purple-100 text-gray-700 p-3 rounded-xl ml-2">
              <TrendingUp size={20} />
            </div>
          </div>

          {/* CONDITIONAL */}
          {activeView === "package" && (
            <>
              {/* // basic plane */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Basic Plan</p>
                  <h2 className="text-2xl font-bold text-gray-700 mt-2">
                    {
                      revenueUsersList.filter((r) =>
                        r.plan?.toLowerCase().includes("basic"),
                      ).length
                    }
                  </h2>
                </div>

                <div className="bg-indigo-100 text-gray-700 p-3 rounded-xl">
                  <Layers size={24} />
                </div>
              </div>

              {/* professonal plane */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Professional</p>
                  <h2 className="text-2xl font-bold text-gray-700 mt-2">
                    {
                      revenueUsersList.filter((r) =>
                        r.plan?.toLowerCase().includes("professional"),
                      ).length
                    }
                  </h2>
                </div>

                <div className="bg-blue-100 text-gray-700 p-3 rounded-xl">
                  <Briefcase size={24} />
                </div>
              </div>

              {/* premium plane */}
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Premium</p>
                  <h2 className="text-2xl font-bold text-gray-700 mt-2">
                    {
                      revenueUsersList.filter((r) =>
                        r.plan?.toLowerCase().includes("premium"),
                      ).length
                    }
                  </h2>
                </div>

                <div className="bg-purple-100 text-gray-700 p-3 rounded-xl">
                  <Crown size={24} />
                </div>
              </div>
            </>
          )}

          {activeView === "service" && (
            <>
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Assistance</p>
                  <h2 className="text-2xl font-bold text-gray mt-2">
                    {
                      users.filter((u) =>
                        u.paidService?.toLowerCase().includes("assistance"),
                      ).length
                    }
                  </h2>
                </div>

                <div className="bg-blue-100 text-gray-700 p-3 rounded-xl">
                  <Headphones size={24} />
                </div>
              </div>

              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Creation</p>
                  <h2 className="text-2xl font-bold text-gray-700 mt-2">
                    {
                      users.filter((u) =>
                        u.paidService?.toLowerCase().includes("creation"),
                      ).length
                    }
                  </h2>
                </div>

                <div className="bg-blue-100 text-gray-700 p-3 rounded-xl">
                  <Settings size={24} />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* SERACH TOOL BAAR  */}

          <div className="bg-white border border-gray-200 rounded-t-2xl px-5 py-3 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              {/* 🔍 SEARCH */}
              <div className="relative w-full max-w-md">
                <input
                  type="text"
                  placeholder="Search by name, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-4 pr-11 py-2.5 rounded-xl border border-gray-300 
    text-sm bg-white shadow-sm 
    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
    transition"
                />

                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <Search size={18} />
                </div>
              </div>

              {/* RIGHT SIDE */}
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-gray-50"
                >
                  <option value="">All Plans</option>
                  <option value="basic">Basic</option>
                  <option value="professional">Professional</option>
                  <option value="premium">Premium</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-gray-50"
                >
                  <option value="">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>

                <button
                  onClick={() => {
                    setSearchTerm("");
                    setPlanFilter("");
                    setStatusFilter("");
                  }}
                  className="px-3 py-2 rounded-lg text-xs bg-gray-100 hover:bg-gray-200"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
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
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm ">
                <div className="mb-6 flex items-center justify-between p-4 bg-indigo-600 ">
                  {/* LEFT SIDE */}
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                      Revenue Users List
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                        Live
                      </span>
                    </h3>
                  </div>
                </div>
                <div className="max-h-[70vh] overflow-y-auto overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold">
                          User
                        </th>

                        {activeView === "package" && (
                          <>
                            <th className="px-6 py-3 text-left text-xs font-semibold">
                              Plan
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold">
                              Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold">
                              Expiry DAte
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold">
                              Screenshot
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold">
                              Notes
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold">
                              Remarks
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold">
                              Plan Approval
                            </th>
                          </>
                        )}

                        {activeView === "service" && (
                          <>
                            <th className="px-6 py-3 text-left text-xs font-semibold">
                              service
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold">
                              plane
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold">
                              Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold">
                              start Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold">
                              expiry Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold">
                              screenshot
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold">
                              notes
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold">
                              Plan Approval
                            </th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {/* 📦 PACKAGE VIEW (OLD DESIGN BACK) */}
                      {activeView === "package" &&
                        filteredData.map((r, i) => {
                          return (
                            <tr
                              key={i}
                              className="border-t hover:bg-gray-50 transition"
                            >
                              <td className="px-6 py-4">
                                <div className="font-semibold text-gray-900">
                                  {r.leadName}
                                </div>
                                <div className="text-xs text-gray-500">
                                  ID: {r.leadId}
                                </div>
                                <div className="text-xs text-gray-500">
                                  UTR: {r.utrNumber || "N/A"}
                                </div>
                              </td>

                              <td className="px-6 py-4">
                                <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs">
                                  {r.plan}
                                </span>
                              </td>

                              <td className="px-6 py-4 font-semibold text-green-600">
                                ₹{r.amount}
                              </td>

                              <td className="px-6 py-4 text-sm text-gray-600">
                                {new Date(r.createdAt).toLocaleDateString()}
                              </td>

                              {/* 🔥 EXPIRY */}
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {r.packageExpiryDate ? (
                                  new Date(
                                    r.packageExpiryDate,
                                  ).toLocaleDateString("en-IN")
                                ) : (
                                  <span className="text-red-500"></span>
                                )}
                              </td>

                              <td className="px-6 py-4">
                                <button
                                  onClick={() =>
                                    setFullViewImage(r.paymentScreenshot)
                                  }
                                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold
                                 bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition whitespace-nowrap"
                                >
                                  View Proof
                                </button>
                              </td>

                              <td className="px-6 py-4 text-sm">
                                {r.notes || "-"}
                              </td>

                              <td className="px-6 py-4 text-sm">
                                {r.planRemarks || "-"}
                              </td>

                              {role === "superAdmin" && (
                                <td className="px-6 py-4 align-top text-sm">
                                  {r?.type === "user_onboard" ? (
                                    (() => {
                                      const st = r.planApprovalStatus;

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
                                        approvalBusyId === String(r._id);

                                      return (
                                        <div className="flex flex-col gap-2">
                                          <button
                                            disabled={busy}
                                            onClick={() =>
                                              handleOnboardApproval(
                                                r,
                                                "approved",
                                              )
                                            }
                                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs text-white"
                                          >
                                            {busy ? "…" : "Approved"}
                                          </button>

                                          <button
                                            disabled={busy}
                                            onClick={() =>
                                              handleOnboardApproval(
                                                r,
                                                "rejected",
                                              )
                                            }
                                            className="rounded-lg border px-3 py-1 text-xs h-[28px] whitespace-nowrap flex items-center justify-center"
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

                              <td className="px-6 py-4 align-middle">
                                <div className="flex justify-center items-center gap-2">
                                  <button
                                    onClick={() => handleEdit(r)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                                  >
                                    Edit
                                  </button>

                                  <button
                                    onClick={() => {
                                      setSelectedId(r._id);
                                      setDeleteType("package");
                                      setDeleteModal(true);
                                    }}
                                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}

                      {/* =================🛠 SERVICE VIEW ================================*/}

                      {activeView === "service" &&
                        users
                          .filter((u) => u.paidService || u.isServiceBooked)
                          .map((u, i) => (
                            <tr
                              key={i}
                              className="border-t hover:bg-gray-50 transition"
                            >
                              <td className="px-6 py-4">
                                <div className="font-semibold text-gray-900">
                                  {u.name ||
                                    u.fullName ||
                                    u.leadName ||
                                    "No Name"}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {u.email}
                                </div>
                              </td>

                              <td className="px-6 py-4">
                                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">
                                  {u.paidService}
                                </span>
                              </td>

                              <td className="px-6 py-4">{u.planDuration}</td>
                              <td className="px-6 py-4 font-semibold text-green-600">
                                ₹{u.amount || 0}
                              </td>
                              <td className="px-6 py-4">
                                {new Date(
                                  u.packageStartDate,
                                ).toLocaleDateString()}
                              </td>

                              <td className="px-6 py-4">
                                {new Date(
                                  u.packageExpiryDate,
                                ).toLocaleDateString()}
                              </td>

                              {/* layout maintain */}

                              <td className="px-6 py-4">
                                <button
                                  onClick={() =>
                                    setFullViewImage(u.paymentScreenshot)
                                  }
                                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold
                                 bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition whitespace-nowrap"
                                >
                                  View Proof
                                </button>
                              </td>

                              <td className="px-6 py-4">
                                {u.notes || u.remarks || u.Remarks || "-"}
                              </td>

                              <td className="px-6 py-4 align-top text-sm">
                                {(() => {
                                  const st = u.planApprovalStatus || "pending";

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

                                  const busy = approvalBusyId === String(u._id);

                                  return (
                                    <div className="flex flex-wrap gap-2">
                                      <button
                                        disabled={busy}
                                        onClick={() =>
                                          handleServiceApproval(u, "approved")
                                        }
                                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
                                      >
                                        {busy ? "…" : "Approved"}
                                      </button>

                                      <button
                                        disabled={busy}
                                        onClick={() =>
                                          handleServiceApproval(u, "rejected")
                                        }
                                        className="rounded-lg border px-3 py-1.5 text-xs"
                                      >
                                        Not approved
                                      </button>
                                    </div>
                                  );
                                })()}
                              </td>

                              <td className="px-6 py-4 align-middle">
                                <div className="flex justify-center items-center gap-2">
                                  <button
                                    onClick={() => {
                                      console.log("SERVICE USER:", u); // 🔥 ADD THIS

                                      setSelectedService(u);
                                      setEditAmount(u.amount || "");
                                      setEditNotes(
                                        u.notes ?? u.remarks ?? u.Remarks ?? "",
                                      );
                                      setEditServiceModal(true);
                                    }}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                                  >
                                    Edit
                                  </button>

                                  <button
                                    onClick={() => {
                                      console.log("SERVICE ITEM:", u); // 🔥 check first

                                      setSelectedId(u._id); // 👈 temporarily
                                      setDeleteModal(true);
                                      setDeleteType("service");
                                    }}
                                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer Totals */}
              <div className="mt-6 pt-6 border-t border-gray-200 bg-emerald-50/50 rounded-2xl p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  {/* TOTAL USERS */}
                  <div>
                    <p className="text-sm text-gray-600">
                      Total Onboarded Users:
                    </p>

                    <p className="text-2xl font-bold text-emerald-800">
                      {activeView === "package"
                        ? revenueUsersList.length
                        : users.filter((u) => u.paidService).length}
                    </p>
                  </div>

                  {/* TOTAL REVENUE */}
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total Revenue:</p>

                    <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                      ₹
                      {(activeView === "package"
                        ? revenueUsersList.reduce(
                            (sum, r) => sum + (r.amount || 0),
                            0,
                          )
                        : users
                            .filter((u) => u.paidService)
                            .reduce((sum, u) => sum + (u.amount || 0), 0)
                      ).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* // package edit moada */}
        {editModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white w-[380px] rounded-2xl shadow-2xl p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-gray-800">
                  Edit Package
                </h2>

                <button
                  onClick={() => setEditModal(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-full 
          bg-gray-100 hover:bg-gray-200 text-gray-500 transition"
                >
                  ✕
                </button>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {/* Plan */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Plan
                  </label>
                  <input
                    value={editPlan}
                    onChange={(e) => setEditPlan(e.target.value)}
                    placeholder="Enter plan name"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg 
            bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg 
            bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  />
                </div>

                {/* Remarks */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Remarks
                  </label>
                  <textarea
                    value={editRemarks}
                    onChange={(e) => setEditRemarks(e.target.value)}
                    placeholder="Write remarks..."
                    rows={3}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg 
            bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition resize-none"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setEditModal(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>

                <button
                  onClick={handleUpdatePackage}
                  className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white 
          hover:bg-indigo-700 shadow-sm hover:shadow-md transition"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}
        {/* // service modal */}
        {editServiceModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white w-[380px] rounded-2xl shadow-2xl p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-gray-800">
                  Edit Service
                </h2>

                <button
                  onClick={() => setEditServiceModal(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-full 
          bg-gray-100 hover:bg-gray-200 text-gray-500 transition"
                >
                  ✕
                </button>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {/* Amount */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg 
            bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Notes
                  </label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Write notes..."
                    rows={3}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg 
            bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition resize-none"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setEditServiceModal(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>

                <button
                  onClick={updateService}
                  className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white 
          hover:bg-indigo-700 shadow-sm hover:shadow-md transition"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}

        {deleteModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            {/* Modal Box */}
            <div className="bg-white rounded-2xl shadow-2xl w-[340px] p-6 text-center animate-scaleIn">
              {/* Icon */}
              <div className="flex justify-center mb-3">
                <div className="bg-red-100 text-red-600 w-12 h-12 flex items-center justify-center rounded-full text-xl">
                  ⚠️
                </div>
              </div>

              {/* Title */}
              <h2 className="text-lg font-semibold text-gray-800">
                Delete Record?
              </h2>

              {/* Description */}
              <p className="text-sm text-gray-500 mt-2 mb-5">
                This action cannot be undone.
              </p>

              {/* Buttons */}
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setDeleteModal(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>

                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 shadow-md transition"
                >
                  Delete
                </button>
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
      </div>
    </>
  );
}
