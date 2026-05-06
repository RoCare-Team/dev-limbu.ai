
"use client";

import { RefreshCw, Wallet } from "lucide-react";
import RevenueBulkActionBar from "./RevenueBulkActionBar";

export default function RevenueTableWrapper({
  loadingRevenueUsers,
  revenueUsersList,
  selectedRows,
  children,
}) {
  if (loadingRevenueUsers) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center text-center">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
          <p className="text-gray-600 font-medium">
            Loading onboarded users...
          </p>
        </div>
      </div>
    );
  }

  if (revenueUsersList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-gray-500">
        <Wallet className="w-16 h-16 mx-auto mb-4 opacity-40" />

        <h3 className="text-xl font-semibold mb-2 text-gray-600">
          No Onboarded Users Yet
        </h3>

        <p className="text-gray-500">
          No users with `user_onboard` revenue entries found for your account.
        </p>

        <p className="text-sm mt-1 text-gray-400">
          Onboard users using the ✅ button in the user table
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm ">
        <RevenueBulkActionBar selectedRows={selectedRows} />

        {children}
      </div>
    </>
  );
}