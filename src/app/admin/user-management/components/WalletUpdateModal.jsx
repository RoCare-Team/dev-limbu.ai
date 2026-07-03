"use client";

import { Wallet, X, Plus } from "lucide-react";

// Extracted verbatim from user-management/page.jsx (Wallet Update Modal).
// Behaviour is unchanged — only moved into its own component.
export default function WalletUpdateModal({
  walletModalUser,
  walletUpdate,
  setWalletUpdate,
  setWalletModalUser,
  updatingWallet,
  handleUpdateWallet,
}) {
  if (!walletModalUser) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl transform transition-all">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg">
              <Wallet className="text-white" size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Update Wallet</h2>
          </div>
          <button
            onClick={() => setWalletModalUser(null)}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mb-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-0.5">User</p>
          <p className="font-semibold text-sm text-gray-800">
            {walletModalUser.email}
          </p>
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-600">Current Balance</p>
            <p className="text-xl font-bold text-emerald-600">
              {walletModalUser.wallet || 0} coins
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Transaction Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label
                className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  walletUpdate.type === "credit"
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  value="credit"
                  checked={walletUpdate.type === "credit"}
                  onChange={(e) =>
                    setWalletUpdate({
                      ...walletUpdate,
                      type: e.target.value,
                    })
                  }
                  className="sr-only"
                />
                <div className="text-center">
                  <Plus
                    className={`mx-auto mb-0.5 ${walletUpdate.type === "credit" ? "text-green-600" : "text-gray-400"}`}
                    size={18}
                  />
                  <span
                    className={`text-sm font-semibold ${walletUpdate.type === "credit" ? "text-green-700" : "text-gray-600"}`}
                  >
                    Add
                  </span>
                </div>
              </label>
              <label
                className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  walletUpdate.type === "debit"
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  value="debit"
                  checked={walletUpdate.type === "debit"}
                  onChange={(e) =>
                    setWalletUpdate({
                      ...walletUpdate,
                      type: e.target.value,
                    })
                  }
                  className="sr-only"
                />
                <div className="text-center">
                  <X
                    className={`mx-auto mb-0.5 ${walletUpdate.type === "debit" ? "text-red-600" : "text-gray-400"}`}
                    size={18}
                  />
                  <span
                    className={`text-sm font-semibold ${walletUpdate.type === "debit" ? "text-red-700" : "text-gray-600"}`}
                  >
                    Deduct
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Amount (Coins)
            </label>
            <input
              type="number"
              placeholder="Enter amount"
              value={walletUpdate.amount}
              onChange={(e) =>
                setWalletUpdate({
                  ...walletUpdate,
                  amount: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Reason
            </label>
            <input
              type="text"
              placeholder="e.g., admin add by bonus"
              value={walletUpdate.reason}
              onChange={(e) =>
                setWalletUpdate({
                  ...walletUpdate,
                  reason: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
            />
          </div>

          {walletUpdate.amount && (
            <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-0.5">
                New Balance Preview
              </p>
              <p className="text-lg font-bold text-indigo-600">
                {walletUpdate.type === "credit"
                  ? (
                      parseFloat(walletModalUser.wallet || 0) +
                      parseFloat(walletUpdate.amount || 0)
                    ).toFixed(2)
                  : (
                      parseFloat(walletModalUser.wallet || 0) -
                      parseFloat(walletUpdate.amount || 0)
                    ).toFixed(2)}{" "}
                coins
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setWalletModalUser(null)}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdateWallet}
            disabled={updatingWallet}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {updatingWallet ? "Updating..." : "Update Wallet"}
          </button>
        </div>
      </div>
    </div>
  );
}
