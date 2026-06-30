"use client";

import { X, Crown, Zap, Shield, Upload } from "lucide-react";

// Extracted verbatim from user-management/page.jsx (Upgrade Plan modal).
// Behaviour is unchanged — only moved into its own component.
export default function PlanUpgradeModal({
  selectedUser,
  setSelectedUser,
  subscriptionPlans,
  selectedCycle,
  setSelectedCycle,
  selectedPlan,
  setSelectedPlan,
  planAmount,
  setPlanAmount,
  planStartDate,
  setPlanStartDate,
  planExpiryDate,
  planScreenshot,
  setPlanScreenshot,
  utrNumber,
  setUtrNumber,
  planRemarks,
  setplanRemarks,
  gstNumber,
  setGstNumber,
  updating,
  confirmPlanChange,
}) {
  if (!selectedUser) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-10 overflow-y-auto">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl transform transition-all max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Upgrade Plan
          </h2>
          <button
            onClick={() => setSelectedUser(null)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
          <p className="text-sm text-gray-600 mb-1">User</p>
          <p className="font-semibold text-gray-800">
            {selectedUser.email}
          </p>
        </div>

        {subscriptionPlans && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar">
            {subscriptionPlans.billingCycles.map((cycle) => (
              <button
                key={cycle.cycle}
                onClick={() => setSelectedCycle(cycle.cycle)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCycle === cycle.cycle
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cycle.label}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-3 mb-6 max-h-[40vh] overflow-y-auto pr-1">
          {(subscriptionPlans
            ? subscriptionPlans.billingCycles.find(
                (c) => c.cycle === selectedCycle,
              )?.plans
            : ["Basic Plan", "Professional Plan", "Premium Plan"].map(
                (p) => ({
                  title: p,
                }),
              )
          ).map((plan) => {
            const planName = plan.title || plan;
            return (
              <label
                key={planName}
                className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  selectedPlan === planName
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3 w-full">
                  <input
                    type="radio"
                    name="plan"
                    value={planName}
                    checked={selectedPlan === planName}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    className="w-4 h-4 text-indigo-600 shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {planName.includes("Premium") && (
                        <Crown size={18} className="text-purple-600" />
                      )}
                      {planName.includes("Professional") && (
                        <Zap size={18} className="text-blue-600" />
                      )}
                      {planName.includes("Basic") && (
                        <Shield size={18} className="text-gray-600" />
                      )}
                      <span className="font-semibold text-gray-800">
                        {planName}
                      </span>
                    </div>

                    {plan.totalAmount && (
                      <div className="text-xs text-gray-500 mt-1 ml-7">
                        ₹{plan.totalAmount} / {plan.duration}
                      </div>
                    )}
                  </div>
                </div>
              </label>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Amount (₹){" "}
              <span className="text-gray-400">(for new revenue)</span>
            </label>
            <input
              type="number"
              placeholder="e.g., 5000"
              value={planAmount}
              onChange={(e) => setPlanAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Start Date
            </label>
            <input
              type="date"
              value={planStartDate}
              onChange={(e) => setPlanStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Expiry Date
            </label>
            <input
              type="date"
              value={planExpiryDate}
              readOnly
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 outline-none text-sm cursor-not-allowed"
            />
          </div>
        </div>

        {/* Payment Screenshot Upload */}
        <div className="mb-6">
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Payment Screenshot{" "}
            <span className="text-gray-400">(if amount entered)</span>
          </label>

          <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-indigo-500 transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setPlanScreenshot(file);
                }
              }}
              className="hidden"
              id="plan-screenshot-upload"
            />

            <label
              htmlFor="plan-screenshot-upload"
              className="flex flex-col items-center cursor-pointer"
            >
              <Upload className="w-8 h-8 text-gray-400 mb-2" />

              <span className="text-sm text-gray-600">
                {planScreenshot
                  ? planScreenshot.name
                  : "Click to upload payment screenshot"}
              </span>

              <span className="text-xs text-gray-400 mt-1">
                PNG, JPG up to 10MB
              </span>
            </label>
          </div>

          {/* UTR Number Field */}
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              UTR Number
            </label>

            <input
              type="text"
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value)}
              placeholder="Enter UTR / Transaction ID"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          {/* Remark Field */}
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Remark
            </label>

            <textarea
              value={planRemarks}
              onChange={(e) => setplanRemarks(e.target.value)}
              placeholder="Enter remark..."
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
            />
          </div>

          {/* GST Number Field */}
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              GST Number
            </label>

            <input
              type="text"
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value)}
              placeholder="Enter GST Number"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setSelectedUser(null)}
            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium"
          >
            Cancel
          </button>

          <button
            onClick={confirmPlanChange}
            disabled={updating === selectedUser.userId}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-medium disabled:opacity-50"
          >
            {updating === selectedUser.userId ? "Updating..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
