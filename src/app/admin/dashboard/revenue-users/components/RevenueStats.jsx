

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
  todayUsers,
  totalRevenue,
  todayRevenue,
  revenueUsersList,
  users,

}) {


  

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
      {/* TOTAL Revenue USERS */}
      <div className="bg-white rounded-2xl p-5  shadow-md border border-gray-100 hover:shadow-lg transition flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Total Revenue Users</p>
          <h2 className="text-2xl font-bold text-dark  mt-2">
            {totalUsers}
          </h2>
        </div>

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

      {/* TOTAL REVENUE */}
      <div className="bg-white rounded-2xl p-3 shadow-md border border-gray-100 hover:shadow-lg transition flex items-center justify-between ">
        <div>
          <p className="text-sm text-dark opacity-90">Total Revenue</p>
       <h2 className="text-2xl text-gray-700 font-bold mt-2">
  ₹{
    activeView === "package"
      ? revenueUsersList
          .filter((r) => r.type === "user_onboard")
          .reduce((sum, r) => sum + Number(r.amount || 0), 0)
          .toLocaleString("en-IN")
      : revenueUsersList
          .filter((r) => r.type === "service")
          .reduce((sum, r) => sum + Number(r.amount || 0), 0)
          .toLocaleString("en-IN")
  }
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

      {activeView === "package" && (
        <>
          {/* BASIC */}
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

          {/* PROFESSIONAL */}
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

          {/* PREMIUM */}
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

          {/* TODAY EXPIRE */}
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today Expire Users</p>

              <h2 className="text-2xl font-bold text-orange-600 mt-2">
                {
                  revenueUsersList.filter((r) => {
                    const expiry =
                      r.userPackageExpiryDate || r.packageExpiryDate;

                    if (!expiry) return false;

                    const expiryDate = new Date(expiry);
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

          {/* NEXT 7 DAYS */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Next 7 Days Expire</p>

              <h2 className="text-2xl font-bold text-yellow-600 mt-2">
                {
                  revenueUsersList.filter((r) => {
                    const expiry =
                      r.userPackageExpiryDate || r.packageExpiryDate;

                    if (!expiry) return false;

                    const expiryDate = new Date(expiry);

                    const today = new Date();
                    const next7Days = new Date();

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

          {/* THIS MONTH */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Month Expire</p>

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

          {/* EXPIRED */}
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex items-center justify-between">
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
          {
            revenueUsersList.filter(
              (r) =>
                r.type === "service" &&
                r.status === "active" &&
                (r.paidService || r.plan || "")
                  .toLowerCase()
                  .includes("assistance")
            ).length
          }
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
          {
            revenueUsersList.filter(
              (r) =>
                r.type === "service" &&
                r.status === "active" &&
                (r.paidService || r.plan || "")
                  .toLowerCase()
                  .includes("creation")
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
  );
}