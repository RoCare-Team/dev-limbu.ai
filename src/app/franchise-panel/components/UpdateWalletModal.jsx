"use client";

import { useEffect, useState } from "react";
import { Plus, Wallet, X } from "lucide-react";
import { getFranchiseAuthHeaders } from "@/lib/franchiseAuth";

export default function UpdateWalletModal({
  user,
  onClose,
  onSuccess,
  showToast,
}) {
  const [walletUser, setWalletUser] = useState(user);
  const [loadingUser, setLoadingUser] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [walletUpdate, setWalletUpdate] = useState({
    amount: "",
    type: "credit",
    reason: "",
  });

  useEffect(() => {
    const fetchLatestUser = async () => {
      if (!user?._id && !user?.userId) {
        setLoadingUser(false);
        return;
      }

      try {
        const franchiseCode = localStorage.getItem("franchise_code") || "";
        const queryId = user._id || user.userId;
        const params = new URLSearchParams({ userId: queryId });
        if (franchiseCode) params.set("referCode", franchiseCode);

        const res = await fetch(
          `/api/franchise-panel/franchise-user?${params.toString()}`,
          { headers: getFranchiseAuthHeaders() },
        );
        const data = await res.json();

        if (data.success && data.user) {
          setWalletUser(data.user);
        } else {
          setWalletUser(user);
        }
      } catch {
        setWalletUser(user);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchLatestUser();
  }, [user]);

  const handleUpdateWallet = async () => {
    if (!walletUpdate.amount || !walletUpdate.reason.trim()) {
      showToast?.("Please fill in all fields");
      return;
    }

    const amount = parseFloat(walletUpdate.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      showToast?.("Please enter a valid amount");
      return;
    }

    setUpdating(true);

    try {
      const res = await fetch("/api/franchise-panel/franchise-user", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getFranchiseAuthHeaders(),
        },
        body: JSON.stringify({
          userId: walletUser._id,
          amount,
          type: walletUpdate.type === "credit" ? "add" : "deduct",
          reason: walletUpdate.reason.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        showToast?.(
          `Wallet updated! New balance: ${data.wallet ?? walletUser.wallet} coins`,
        );
        onSuccess?.(data.user);
        onClose?.();
      } else {
        showToast?.(data.message || "Failed to update wallet");
      }
    } catch (error) {
      console.error("Wallet update error:", error);
      showToast?.("An error occurred while updating the wallet");
    } finally {
      setUpdating(false);
    }
  };

  const currentBalance = Number(walletUser?.wallet || 0);
  const previewBalance =
    walletUpdate.type === "credit"
      ? currentBalance + parseFloat(walletUpdate.amount || 0)
      : currentBalance - parseFloat(walletUpdate.amount || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 p-2">
              <Wallet className="text-white" size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Update Wallet</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 transition-colors hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mb-4 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 p-3">
          <p className="mb-0.5 text-xs text-gray-600">User</p>
          <p className="text-sm font-semibold text-gray-800">
            {walletUser?.email || walletUser?.fullName || "-"}
          </p>
          <div className="mt-2 border-t border-gray-200 pt-2">
            <p className="text-xs text-gray-600">Current Balance</p>
            <p className="text-xl font-bold text-emerald-600">
              {loadingUser ? "Loading..." : `${currentBalance} coins`}
            </p>
          </div>
        </div>

        <div className="mb-4 space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">
              Transaction Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label
                className={`flex cursor-pointer items-center justify-center rounded-lg border-2 p-3 transition-all ${
                  walletUpdate.type === "credit"
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="walletType"
                  value="credit"
                  checked={walletUpdate.type === "credit"}
                  onChange={() =>
                    setWalletUpdate((prev) => ({ ...prev, type: "credit" }))
                  }
                  className="sr-only"
                />
                <div className="text-center">
                  <Plus
                    className={`mx-auto mb-0.5 ${
                      walletUpdate.type === "credit"
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                    size={18}
                  />
                  <span
                    className={`text-sm font-semibold ${
                      walletUpdate.type === "credit"
                        ? "text-green-700"
                        : "text-gray-600"
                    }`}
                  >
                    Add
                  </span>
                </div>
              </label>

              <label
                className={`flex cursor-pointer items-center justify-center rounded-lg border-2 p-3 transition-all ${
                  walletUpdate.type === "debit"
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="walletType"
                  value="debit"
                  checked={walletUpdate.type === "debit"}
                  onChange={() =>
                    setWalletUpdate((prev) => ({ ...prev, type: "debit" }))
                  }
                  className="sr-only"
                />
                <div className="text-center">
                  <X
                    className={`mx-auto mb-0.5 ${
                      walletUpdate.type === "debit"
                        ? "text-red-600"
                        : "text-gray-400"
                    }`}
                    size={18}
                  />
                  <span
                    className={`text-sm font-semibold ${
                      walletUpdate.type === "debit"
                        ? "text-red-700"
                        : "text-gray-600"
                    }`}
                  >
                    Deduct
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">
              Amount (Coins)
            </label>
            <input
              type="number"
              placeholder="Enter amount"
              value={walletUpdate.amount}
              onChange={(e) =>
                setWalletUpdate((prev) => ({ ...prev, amount: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-emerald-500"
              min="0"
              step="1"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">
              Reason
            </label>
            <input
              type="text"
              placeholder="e.g., admin add by bonus"
              value={walletUpdate.reason}
              onChange={(e) =>
                setWalletUpdate((prev) => ({ ...prev, reason: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {walletUpdate.amount && (
            <div className="rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-3">
              <p className="mb-0.5 text-xs text-gray-600">New Balance Preview</p>
              <p className="text-lg font-bold text-indigo-600">
                {Number.isFinite(previewBalance)
                  ? Math.max(0, previewBalance).toFixed(0)
                  : currentBalance}{" "}
                coins
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpdateWallet}
            disabled={updating || loadingUser}
            className="flex-1 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-2 text-sm font-medium text-white transition-all hover:from-emerald-700 hover:to-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {updating ? "Updating..." : "Update Wallet"}
          </button>
        </div>
      </div>
    </div>
  );
}
