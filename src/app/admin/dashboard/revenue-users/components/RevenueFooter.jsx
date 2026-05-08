

"use client";

export default function RevenueFooter({
  activeView,
  revenueUsersList,
  users,
}) {
  return (
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
              : users.filter((u) => u.plan).length}
          </p>
        </div>

        {/* TOTAL REVENUE */}
        <div className="text-right">
          <p className="text-sm text-gray-600">
            Total Revenue:
          </p>

          <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
            ₹
            {(activeView === "package"
              ? revenueUsersList.reduce(
                  (sum, r) => sum + (r.amount || 0),
                  0,
                )
             : users
  .filter((u) => u.type === "service")
  .reduce((sum, u) => sum + (Number(u.amount) || 0), 0)
            ).toLocaleString("en-IN")}
          </p>
        </div>
      </div>
    </div>
  );
}