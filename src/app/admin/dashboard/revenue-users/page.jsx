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
  AlertCircle,
  Calendar,
  MessageCircle,
  Send,
  Mail,
  Smartphone,
} from "lucide-react";
import { useRouter } from "next/navigation";


import RevenueHeader from "./components/RevenueHeader";
import RevenueStats from "./components/RevenueStats";
import RevenueFilters from "./components/RevenueFilters";
import RevenueBulkActionBar from "./components/RevenueBulkActionBar";
import RevenueTableWrapper from "./components/RevenueTableWrapper";
import RevenueFooter from "./components/RevenueFooter";
import DeleteModal from "./components/DeleteModal";
import ImagePreviewModal from "./components/ImagePreviewModal";
import EditPackageModal from "./components/EditPackageModal";
import EditServiceModal from "./components/EditServiceModal";


export default function RevenueUsersPage() {
  // "package" | "service"

  const router = useRouter();
  const [loadingRevenueUsers, setLoadingRevenueUsers] = useState(false);
  const [fullViewImage, setFullViewImage] = useState(null);
  const [approvalBusyId, setApprovalBusyId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [expiryFilter, setExpiryFilter] = useState("");

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

  // check box select
  const [selectedRows, setSelectedRows] = useState([]);

  const handleSelectAll = (checked) => {
    if (checked) {
      const allIds =
        activeView === "package"
          ? filteredData.map((r) => r._id)
          : users.map((u) => u._id);

      setSelectedRows(allIds);
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

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
        // console.log("USERS DATA 👉", data);
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

  const formatDateIST = (dateStr) => {
    if (!dateStr) return "No Date";

    return new Date(dateStr).toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
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

    // 🔥 EXPIRY FILTER
    const expiryRaw = item.userPackageExpiryDate || item.packageExpiryDate;

    let matchExpiry = true;

    if (expiryRaw) {
      const expiryDate = new Date(expiryRaw);

      const now = new Date();

      // 🔥 EXPIRED USERS
      if (expiryFilter === "expired") {
        matchExpiry = expiryDate < now;
      }

      // 🔥 TODAY
      else if (expiryFilter === "today") {
        matchExpiry = expiryDate.toDateString() === now.toDateString();
      }

      // 🔥 NEXT 7 DAYS
      else if (expiryFilter === "7days") {
        const next7Days = new Date();

        next7Days.setDate(now.getDate() + 7);

        matchExpiry = expiryDate >= now && expiryDate <= next7Days;
      }

      // 🔥 NEXT 15 DAYS
      else if (expiryFilter === "15days") {
        const next15Days = new Date();

        next15Days.setDate(now.getDate() + 15);

        matchExpiry = expiryDate >= now && expiryDate <= next15Days;
      }

      // 🔥 CURRENT MONTH EXPIRING
      else if (expiryFilter === "this_month") {
        matchExpiry =
          expiryDate.getMonth() === now.getMonth() &&
          expiryDate.getFullYear() === now.getFullYear();
      }
    }

    return matchSearch && matchPlan && matchStatus && matchExpiry;
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
          <RevenueHeader
  handleRefresh={handleRefresh}
  isRefreshing={isRefreshing}
  activeView={activeView}
  setActiveView={setActiveView}
/>

        {/* ===== STATS ===== */}
        
        <RevenueStats
  activeView={activeView}
  totalUsers={totalUsers}
  todayUsers={todayUsers}
  totalRevenue={totalRevenue}
  todayRevenue={todayRevenue}
  revenueUsersList={revenueUsersList}
  users={users}
/>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* SERACH TOOL BAAR  */}

          <RevenueFilters
  searchTerm={searchTerm}
  setSearchTerm={setSearchTerm}
  expiryFilter={expiryFilter}
  setExpiryFilter={setExpiryFilter}
  planFilter={planFilter}
  setPlanFilter={setPlanFilter}
  statusFilter={statusFilter}
  setStatusFilter={setStatusFilter}
/>

          <RevenueTableWrapper
  loadingRevenueUsers={loadingRevenueUsers}
  revenueUsersList={revenueUsersList}
  selectedRows={selectedRows}
>
            <>
              {/* Table */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm ">
               
                <div className="max-h-[70vh] overflow-y-auto overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        {activeView === "package" && (
                          <>
                            <th className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={
                                  activeView === "package"
                                    ? filteredData.length > 0 &&
                                      selectedRows.length ===
                                        filteredData.length
                                    : users.length > 0 &&
                                      selectedRows.length === users.length
                                }
                                onChange={(e) =>
                                  handleSelectAll(e.target.checked)
                                }
                                className="w-4 h-4 accent-indigo-600"
                              />
                            </th>

                            <th className="px-6 py-3 text-left text-xs font-semibold">
                              User
                            </th>

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
                              User
                            </th>

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
                              <td className="px-4 py-4">
                                <input
                                  type="checkbox"
                                  checked={selectedRows.includes(r._id)}
                                  onChange={() => handleSelectRow(r._id)}
                                  className="w-4 h-4 accent-indigo-600"
                                />
                              </td>

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
                                {r.userPackageStartDate ? (
                                  new Date(
                                    r.userPackageStartDate,
                                  ).toLocaleDateString("en-IN")
                                ) : (
                                  <span className="text-red-500">No Date</span>
                                )}
                              </td>

                              <td className="px-6 py-4 text-sm text-gray-600">
                                {formatDateIST(r.userPackageExpiryDate)}
                              </td>

                              {/* 🔥 EXPIRY */}

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
              <RevenueFooter
  activeView={activeView}
  revenueUsersList={revenueUsersList}
  users={users}
/>
            </>
          
          </RevenueTableWrapper>

        </div>

        {/* // package edit moada */}
        <EditPackageModal
  editModal={editModal}
  setEditModal={setEditModal}
  editPlan={editPlan}
  setEditPlan={setEditPlan}
  editAmount={editAmount}
  setEditAmount={setEditAmount}
  editRemarks={editRemarks}
  setEditRemarks={setEditRemarks}
  handleUpdatePackage={handleUpdatePackage}
/>
        {/* // service modal */}
        
        <EditServiceModal
  editServiceModal={editServiceModal}
  setEditServiceModal={setEditServiceModal}
  editAmount={editAmount}
  setEditAmount={setEditAmount}
  editNotes={editNotes}
  setEditNotes={setEditNotes}
  updateService={updateService}
/>

          {/* // Delete modal */}

          <DeleteModal
  deleteModal={deleteModal}
  setDeleteModal={setDeleteModal}
  confirmDelete={confirmDelete}
/>

        {/* // image Previe modal */}

        <ImagePreviewModal
  fullViewImage={fullViewImage}
  setFullViewImage={setFullViewImage}
/>
      </div>
    </>
  );
}
