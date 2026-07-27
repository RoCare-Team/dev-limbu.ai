"use client";

import {
  Users,
  IndianRupee,
  TrendingUp,
  Layers,
  Briefcase,
  Crown,
  Headphones,
  Settings,
  AlertCircle,
  Calendar,
} from "lucide-react";

export default function RevenueStats({
  activeView,
  totalUsers,
  totalTransactions,
  todayUsers,
  totalRevenue,
  todayRevenue,
  revenueUsersList,
  users,
  cardFilter,
  setCardFilter,

  assistanceUsers,
  creationUsers,
}) {
  const totalPlans = revenueUsersList.filter(
    (r) => r.type === "user_onboard" || r.type === "plan",
  ).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
      {/* TOTAL USERS */}
      <div
        onClick={() => setCardFilter("")}
        className={`bg-white rounded-2xl p-5 shadow-md border hover:shadow-lg transition flex items-center justify-between cursor-pointer
      ${
        cardFilter === ""
          ? "border-indigo-600 ring-2 ring-indigo-300"
          : "border-gray-100"
      }`}
      >
        <div>
          <p className="text-sm text-gray-500">Total Onboard Users</p>
          <h2 className="text-2xl font-bold text-dark mt-2">{totalUsers}</h2>
          {typeof totalTransactions === "number" &&
            totalTransactions !== totalUsers && (
              <p className="text-[11px] text-gray-400 mt-1">
                {totalTransactions} entries (renewals included)
              </p>
            )}
        </div>

        <div className="bg-indigo-100 text-dark p-3 rounded-xl">
          <Users size={20} />
        </div>
      </div>

      {/* TODAY'S NEW USERS */}
      <div
        onClick={() => setCardFilter("today_users")}
        className={`bg-white rounded-2xl p-5 shadow-md border hover:shadow-lg transition flex items-center justify-between cursor-pointer
      ${
        cardFilter === "today_users"
          ? "border-blue-600 ring-2 ring-blue-300"
          : "border-gray-100"
      }`}
      >
        <div>
          <p className="text-sm text-gray-500">Today's New Users</p>

          <h2 className="text-2xl font-bold text-gray-700 mt-2">
            {todayUsers.length}
          </h2>
        </div>

        <div className="bg-blue-100 p-3 rounded-xl">
          <Users size={20} />
        </div>
      </div>

      {/* TOTAL REVENUE */}
      <div
        onClick={() => setCardFilter("")}
        className={`bg-white rounded-2xl p-3 shadow-md border hover:shadow-lg transition flex items-center justify-between cursor-pointer
      ${
        cardFilter === ""
          ? "border-blue-600 ring-2 ring-blue-300"
          : "border-gray-100"
      }`}
      >
        <div>
          <p className="text-sm text-dark opacity-90">Total Revenue</p>

          <h2 className="text-2xl text-gray-700 font-bold mt-2">
            ₹
            {activeView === "package"
              ? revenueUsersList
                  .filter((r) => r.type === "user_onboard" || r.type === "plan")
                  .reduce((sum, r) => sum + Number(r.amount || 0), 0)
                  .toLocaleString("en-IN")
              : revenueUsersList
                  .filter((r) => r.type === "service")
                  .reduce((sum, r) => sum + Number(r.amount || 0), 0)
                  .toLocaleString("en-IN")}
          </h2>
        </div>

        <div className="bg-blue-100 p-3 text-gray-700 rounded-xl backdrop-blur ml-2">
          <IndianRupee size={20} />
        </div>
      </div>

      {/* TODAY'S REVENUE */}
      <div
        onClick={() => setCardFilter("today_revenue")}
        className={`bg-white rounded-2xl p-5 shadow-md border hover:shadow-lg transition flex items-center justify-between cursor-pointer
              ${
                cardFilter === "today_revenue"
                  ? "border-purple-600 ring-2 ring-purple-300"
                  : "border-gray-100"
              }`}
      >
        <div>
          <p className="text-sm text-gray-500 whitespace-nowrap">
            Today's Revenue
          </p>

          <h2 className="text-2xl font-bold text-gray-700 mt-2">
            ₹{todayRevenue.toLocaleString("en-IN")}
          </h2>
        </div>

        <div className="bg-purple-100 text-gray-700 p-3 rounded-xl ml-2">
          <TrendingUp size={20} />
        </div>
      </div>

      {activeView === "package" && (
        <>
          {/* TOTAL PLANS */}
          <div
            onClick={() => setCardFilter("")}
            className={`bg-blue-20 rounded-3xl p-5 shadow-sm hover:shadow-md transition cursor-pointer
              ${
                cardFilter === ""
                  ? "border-blue-600 ring-2 ring-blue-600"
                  : "border border-green-200"
              }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-ls">Total Plans</p>

                <h2 className="text-2xl font-bold text-gray-700 mt-3">
                  {totalPlans}
                </h2>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
                <Layers className="w-6 h-6 text-gray-700" />
              </div>
            </div>
          </div>

          {/* BASIC PLAN USERS */}
          <div
            onClick={() => setCardFilter("basic")}
            className={`bg-indigo-50 border rounded-2xl p-5 shadow-sm hover:shadow-md transition flex items-center justify-between cursor-pointer
                ${cardFilter === "basic" ? "border-indigo-500" : "border-indigo-200"}`}
          >
            <div>
              <p className="text-sm text-gray-600">Basic Plan Users</p>

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

          {/* PROFESSIONAL PLAN USERS */}
          <div
            onClick={() => setCardFilter("professional")}
            className={`bg-blue-50 border rounded-2xl p-5 shadow-sm hover:shadow-md transition flex items-center justify-between cursor-pointer
                    ${cardFilter === "professional" ? "border-blue-500" : "border-blue-200"}`}
          >
            <div>
              <p className="text-sm text-gray-600">Professional Plan Users</p>

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

          {/* PREMIUM PLAN USERS */}
          <div
            onClick={() => setCardFilter("premium")}
            className={`bg-purple-50 border rounded-2xl p-5 shadow-sm hover:shadow-md transition flex items-center justify-between cursor-pointer
                  ${
                    cardFilter === "premium"
                      ? "border-purple-500"
                      : "border-purple-200"
                  }`}
          >
            <div>
              <p className="text-sm text-gray-600">Premium Plan Users</p>

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

          {/* EXPIRING TODAY */}
          <div
            onClick={() => setCardFilter("today")}
            className={`bg-orange-50 border rounded-2xl p-5 shadow-sm hover:shadow-md transition flex items-center justify-between cursor-pointer
                  ${cardFilter === "today" ? "border-orange-500" : "border-orange-200"}`}
          >
            <div>
              <p className="text-sm text-gray-600">Expiring Today</p>

              <h2 className="text-2xl font-bold text-orange-600 mt-2">
                {
                  revenueUsersList.filter((r) => {
                    const expiry =
                      r.userPackageExpiryDate || r.packageExpiryDate;

                    if (!expiry) return false;

                    const expiryDate = new Date(expiry);
                    if (isNaN(expiryDate.getTime())) return false;
                    const today = new Date();

                    return (
                      expiryDate.getDate() === today.getDate() &&
                      expiryDate.getMonth() === today.getMonth() &&
                      expiryDate.getFullYear() === today.getFullYear()
                    );
                  }).length
                }
              </h2>
            </div>

            <div className="bg-orange-100 text-orange-600 p-3 rounded-xl">
              <Calendar size={24} />
            </div>
          </div>

          {/* EXPIRING IN NEXT 7 DAYS */}
          <div
            onClick={() => setCardFilter("7days")}
            className={`bg-yellow-50 border rounded-2xl p-5 shadow-sm hover:shadow-md transition flex items-center justify-between cursor-pointer
                ${
                  cardFilter === "7days"
                    ? "border-yellow-500 ring-2 ring-yellow-300"
                    : "border-yellow-200"
                }`}
          >
            <div>
              <p className="text-sm text-gray-600">Expiring in Next 7 Days</p>

              <h2 className="text-2xl font-bold text-yellow-600 mt-2">
                {
                  revenueUsersList.filter((r) => {
                    const expiry =
                      r.userPackageExpiryDate || r.packageExpiryDate;

                    if (!expiry) return false;

                    const expiryDate = new Date(expiry);
                    if (isNaN(expiryDate.getTime())) return false;
                    expiryDate.setHours(0, 0, 0, 0);

                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    const next7Days = new Date(today);
                    next7Days.setDate(today.getDate() + 7);

                    return expiryDate >= today && expiryDate <= next7Days;
                  }).length
                }
              </h2>
            </div>

            <div className="bg-yellow-100 text-yellow-600 p-3 rounded-xl">
              <TrendingUp size={24} />
            </div>
          </div>

          {/* EXPIRING THIS MONTH */}
          <div
            onClick={() => setCardFilter("this_month")}
            className={`bg-blue-50 border rounded-2xl p-5 shadow-sm hover:shadow-md transition flex items-center justify-between cursor-pointer
                  ${
                    cardFilter === "this_month"
                      ? "border-blue-600 ring-2 ring-blue-300"
                      : "border-blue-200"
                  }`}
          >
            <div>
              <p className="text-sm text-gray-600">Expiring This Month</p>

              <h2 className="text-2xl font-bold text-blue-600 mt-2">
                {
                  revenueUsersList.filter((r) => {
                    const expiry =
                      r.userPackageExpiryDate || r.packageExpiryDate;

                    if (!expiry) return false;

                    const expiryDate = new Date(expiry);
                    const today = new Date();

                    return (
                      expiryDate.getMonth() === today.getMonth() &&
                      expiryDate.getFullYear() === today.getFullYear()
                    );
                  }).length
                }
              </h2>
            </div>

            <div className="bg-blue-100 text-blue-600 p-3 rounded-xl">
              <Calendar size={24} />
            </div>
          </div>

          {/* EXPIRED USERS */}
          <div
            onClick={() => setCardFilter("expired")}
            className={`bg-red-50 border rounded-2xl p-5 shadow-sm hover:shadow-md transition flex items-center justify-between cursor-pointer
                ${
                  cardFilter === "expired"
                    ? "border-red-600 ring-2 ring-red-300"
                    : "border-red-200"
                }`}
          >
            <div>
              <p className="text-sm text-gray-600">Expired Users</p>

              <h2 className="text-2xl font-bold text-red-600 mt-2">
                {
                  revenueUsersList.filter((r) => {
                    const expiry =
                      r.userPackageExpiryDate || r.packageExpiryDate;

                    if (!expiry) return false;

                    return new Date(expiry) < new Date();
                  }).length
                }
              </h2>
            </div>

            <div className="bg-red-100 text-red-600 p-3 rounded-xl">
              <AlertCircle size={24} />
            </div>
          </div>
        </>
      )}

      {activeView === "service" && (
        <>
          {/* ASSISTANCE */}
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Assistance</p>
              <h2 className="text-2xl font-bold text-gray-700 mt-2">
                {assistanceUsers}
              </h2>
            </div>

            <div className="bg-blue-100 text-gray-700 p-3 rounded-xl">
              <Headphones size={24} />
            </div>
          </div>

          {/* CREATION */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Creation</p>
              <h2 className="text-2xl font-bold text-gray-700 mt-2">
                {creationUsers}
              </h2>
            </div>

            <div className="bg-blue-100 text-gray-700 p-3 rounded-xl">
              <Settings size={24} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}