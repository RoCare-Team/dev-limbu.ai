"use client";

import { useState, useEffect } from "react";
import { X, RefreshCw, Wallet, Eye } from "lucide-react";
import { useRouter } from "next/navigation";

export default function RevenueUsersPage() {
  // "package" | "service"

  const router = useRouter();
  const [loadingRevenueUsers, setLoadingRevenueUsers] = useState(false);
  const [fullViewImage, setFullViewImage] = useState(null);
  const [approvalBusyId, setApprovalBusyId] = useState(null);

  //service

  const [showServiceModal, setShowServiceModal] = useState(false);

  const [activeView, setActiveView] = useState("package");
  const [revenueUsersList, setRevenueUsersList] = useState([]);
  const [users, setUsers] = useState([]);

  const displayData = activeView === "package" ? revenueUsersList : users;

  const todayUsers = revenueUsersList.filter((r) => {
    const today = new Date().toDateString();
    const userDate = new Date(r.createdAt).toDateString();
    return today === userDate;
  });

  // service
  const serviceUsersCount = users?.filter((u) => u.paidService).length || 0;
  const serviceUsers = users.filter((u) => u.paidService || u.isServiceBooked);

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
        0
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
          return (
            u.packageStartDate.split("T")[0] === today &&
            u.paidService
          );
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

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-6">
          {/* Header */}

          <div className="mb-6 ">
            <h1 className="text-2xl font-bold text-gray-800">
              User Onboard Revenue Details
            </h1>
            <p className="text-gray-500 text-sm">
              All users with `user_onboard` revenue entries
            </p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-100 transition"
            >
              ← Back
            </button>
          </div>

          <div className="flex gap-4 mb-6">
            {/* PACKAGE CARD */}
            <div
              onClick={() => setActiveView("package")}
              className={`cursor-pointer px-6 py-4 rounded-xl border transition ${
                activeView === "package"
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "bg-white text-gray-700"
              }`}
            >
              📦 Package Users
            </div>

            {/* SERVICE CARD */}
            <div
              onClick={() => setActiveView("service")}
              className={`cursor-pointer px-6 py-4 rounded-xl border transition ${
                activeView === "service"
                  ? "bg-purple-600 text-white shadow-lg"
                  : "bg-white text-gray-700"
              }`}
            >
              🛠 Service Users
            </div>
          </div>

          {/* RIGHT SIDE ACTION */}
          <button
            onClick={fetchRevenueUsers}
            className="flex items-center gap-2 px-4 py-2 p-4 rounded-lg text-lg font-normal
             bg-gradient-to-r from-indigo-500 to-indigo-600 text-white 
               shadow-md hover:shadow-lg hover:scale-[1.02] "
          >
            <RefreshCw size={20} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 items-start ">
          {/* Total Users */}
          <div className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition self-start">
            <p className="text-sm text-gray-500">Total Users</p>
            <h2 className="text-2xl font-bold">{totalUsers}</h2>
          </div>

          <div className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition">
            <p className="text-sm text-gray-500">Today Users</p>
            <h2 className="text-2xl font-bold text-indigo-600">
              {todayUsers.length}
            </h2>
          </div>

          {/* Total Revenue */}
          <div className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition">
            <p className="text-sm text-gray-500">Total Revenue</p>
            <h2 className="text-2xl font-bold text-emerald-600">
              ₹{totalRevenue.toLocaleString("en-IN")}
            </h2>
          </div>

          {/* Today Revenue */}
          <div className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition">
            <p className="text-sm text-gray-500">Today Revenue</p>
            <h2 className="text-2xl font-bold text-indigo-600">
              ₹{todayRevenue.toLocaleString("en-IN")}
            </h2>
          </div>

          {activeView === "package" && (
            <>
              {/* Basic Plan */}
              <div className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition">
                <p className="text-sm text-gray-500">Basic Plan Users</p>
                <h2 className="text-2xl font-bold text-emerald-600">
                  {
                    revenueUsersList.filter((r) =>
                      r.plan?.toLowerCase().includes("basic"),
                    ).length
                  }
                </h2>
              </div>

              {/* Professional Plan */}
              <div className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition">
                <p className="text-sm text-gray-500 whitespace-nowrap">
                  Professional Plan Users
                </p>
                <h2 className="text-2xl font-bold text-indigo-600">
                  {
                    revenueUsersList.filter((r) =>
                      r.plan?.toLowerCase().includes("professional"),
                    ).length
                  }
                </h2>
              </div>

              {/* Premium Plan */}
              <div className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition">
                <p className="text-sm text-gray-500 whitespace-nowrap">
                  Premium Plan Users
                </p>
                <h2 className="text-2xl font-bold text-purple-600">
                  {
                    revenueUsersList.filter((r) =>
                      r.plan?.toLowerCase().includes("premium"),
                    ).length
                  }
                </h2>
              </div>
            </>
          )}

          {activeView === "service" && (
            <>
              {/* Assistance */}
              <div className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition">
                <p className="text-sm text-gray-500">Assistance Plan Users</p>
                <h2 className="text-2xl font-bold text-purple-600">
                  {
                    users.filter((u) =>
                      u.paidService?.toLowerCase().includes("assistance"),
                    ).length
                  }
                </h2>
              </div>

              {/* Creation */}
              <div className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition">
                <p className="text-sm text-gray-500">Creation Plan Users</p>
                <h2 className="text-2xl font-bold text-indigo-600">
                  {
                    users.filter((u) =>
                      u.paidService?.toLowerCase().includes("creation"),
                    ).length
                  }
                </h2>
              </div>
            </>
          )}

          
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
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm ">
                <div className="mb-6 flex items-center justify-between p-4 bg-indigo-600 rounded-t-2xl">
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
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {/* 📦 PACKAGE VIEW (OLD DESIGN BACK) */}
                      {activeView === "package" &&
                        revenueUsersList.map((r, i) => (
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

                            <td className="px-6 py-4">
                              <button
                                onClick={() =>
                                  setFullViewImage(r.paymentScreenshot)
                                }
                                className="text-indigo-600 text-sm underline"
                              >
                                View Proof
                              </button>
                            </td>

                            <td className="px-6 py-4 text-sm">
                              {r.notes || "-"}
                            </td>

                            {/* REMARKS */}
                            <td className="px-6 py-4 text-sm">
                              {r.planRemarks || "-"}
                            </td>

                            <td className="px-6 py-4">
                              {r.planApprovalStatus === "approved" && (
                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                                  Approved
                                </span>
                              )}

                              {r.planApprovalStatus === "pending" && (
                                <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs">
                                  Pending
                                </span>
                              )}

                              {r.planApprovalStatus === "rejected" && (
                                <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">
                                  Not Approved
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}

                      {/* 🛠 SERVICE VIEW */}
                      {activeView === "service" &&
                        users
                          .filter((u) => u.paidService)
                          .map((u, i) => (
                            <tr
                              key={i}
                              className="border-t hover:bg-gray-50 transition"
                            >
                              <td className="px-6 py-4">{u.email}</td>

                              <td className="px-6 py-4">
                                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">
                                  {u.paidService}
                                </span>
                              </td>

                              <td className="px-6 py-4">{u.planDuration}</td>

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
                           <td>
  {u.screenshot ? (
    <button onClick={() => setFullViewImage(u.screenshot)}>
      View Proof
    </button>
  ) : "-"}
</td>

<td>
  {u.notes || "-"}
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
