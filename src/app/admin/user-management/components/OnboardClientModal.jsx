"use client";

import { X, Upload, RefreshCw, CheckCircle } from "lucide-react";

// Extracted verbatim from user-management/page.jsx (Onboard Client Modal).
// Behaviour is unchanged — only moved into its own component.
export default function OnboardClientModal({
  showOnboardModal,
  onboardModalUser,
  setShowOnboardModal,
  setOnboardModalUser,
  onboardData,
  setOnboardData,
  uploadingOnboard,
  handleOnboardSubmit,
}) {
  if (!(showOnboardModal && onboardModalUser)) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Onboard Client
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {onboardModalUser.fullName}
            </p>
          </div>
          <button
            onClick={() => {
              setShowOnboardModal(false);
              setOnboardModalUser(null);
              setOnboardData({
                plan: "",
                amount: "",
                screenshot: null,
                notes: "",
              });
            }}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plan <span className="text-red-500">*</span>
            </label>
            <select
              value={onboardData.plan}
              onChange={(e) =>
                setOnboardData({ ...onboardData, plan: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="">Select Plan</option>
              <option value="Basic Plan">Basic Plan</option>
              <option value="Professional Plan">Professional Plan</option>
              <option value="Premium Plan">Premium Plan</option>
              <option value="Enterprise Plan">Enterprise Plan</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              placeholder="Enter amount"
              value={onboardData.amount}
              onChange={(e) =>
                setOnboardData({ ...onboardData, amount: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Screenshot <span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-emerald-500 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setOnboardData({ ...onboardData, screenshot: file });
                  }
                }}
                className="hidden"
                id="onboard-screenshot-upload"
              />
              <label
                htmlFor="onboard-screenshot-upload"
                className="flex flex-col items-center cursor-pointer"
              >
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  {onboardData.screenshot
                    ? onboardData.screenshot.name
                    : "Click to upload screenshot"}
                </span>
                <span className="text-xs text-gray-400 mt-1">
                  PNG, JPG up to 10MB
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              placeholder="Add any additional notes..."
              value={onboardData.notes}
              onChange={(e) =>
                setOnboardData({ ...onboardData, notes: e.target.value })
              }
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
            />
          </div>

          <button
            onClick={handleOnboardSubmit}
            disabled={
              uploadingOnboard ||
              !onboardData.plan ||
              !onboardData.amount ||
              !onboardData.screenshot
            }
            className="w-full py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploadingOnboard ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Onboard Client
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
