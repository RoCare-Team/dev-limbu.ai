"use client";

import { useState, useEffect } from "react";

export default function EditServiceModal({
  editServiceModal,
  setEditServiceModal,
  editAmount,
  setEditAmount,
  editNotes,
  setEditNotes,

  editServiceStartDate,
  setEditServiceStartDate,

  editServiceExpiryDate,
  setEditServiceExpiryDate,

  editServiceProofImage,
  setEditServiceProofImage,

  // Additional service details props
  editGstNumber = "",
  setEditGstNumber = () => {},
  editUtrNumber = "",
  setEditUtrNumber = () => {},
  editPlanDuration = "monthly",
  setEditPlanDuration = () => {},
  editServicePlan = "",
  setEditServicePlan = () => {},

  updateService,
  updatingService,
}) {
  const [imagePreview, setImagePreview] = useState("");

  const servicePlansList = [
    "GMB Assistance & Update Plan",
    "GMB Creation & Management Plan",
  ];

  // Handle previewing local files vs. existing network image URLs
  useEffect(() => {
    if (editServiceProofImage instanceof File) {
      const url = URL.createObjectURL(editServiceProofImage);
      setImagePreview(url);
      return () => URL.revokeObjectURL(url);
    } else if (typeof editServiceProofImage === "string") {
      setImagePreview(editServiceProofImage);
    } else {
      setImagePreview("");
    }
  }, [editServiceProofImage]);

  if (!editServiceModal) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300">
      <div className="bg-white w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl shadow-2xl border border-slate-100 flex flex-col transition-all duration-300 transform scale-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 sticky top-0 bg-white/95 backdrop-blur-md z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Edit Service Details
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Modify subscription records, financial details, and verify
              transaction proof
            </p>
          </div>
          <button
            onClick={() => setEditServiceModal(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Service Plan Selector / Inputs */}
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
              Service Plan Name
            </label>
            <div className="flex flex-col gap-2">
              <select
                value={
                  servicePlansList.includes(editServicePlan)
                    ? editServicePlan
                    : "custom"
                }
                onChange={(e) => {
                  if (e.target.value !== "custom") {
                    setEditServicePlan(e.target.value);
                  } else {
                    setEditServicePlan("");
                  }
                }}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition text-sm text-slate-700 font-medium"
              >
                {servicePlansList.map((planOption, idx) => (
                  <option key={idx} value={planOption}>
                    {planOption}
                  </option>
                ))}
                <option value="custom">Other / Custom Plan</option>
              </select>

              {/* Custom Input (If custom plan selected or typed manually) */}
              {(!servicePlansList.includes(editServicePlan) ||
                editServicePlan === "") && (
                <input
                  type="text"
                  value={editServicePlan}
                  onChange={(e) => setEditServicePlan(e.target.value)}
                  placeholder="Type Custom Plan Name"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition text-sm text-slate-800"
                />
              )}
            </div>
          </div>

          {/* Finance Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Amount */}
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">
                  ₹
                </span>
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition text-sm text-slate-800 font-semibold"
                />
              </div>
            </div>

            {/* GST Number */}
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                GST Number
              </label>
              <input
                type="text"
                value={editGstNumber}
                onChange={(e) => setEditGstNumber(e.target.value.toUpperCase())}
                placeholder="Enter GSTIN (Even if left blank initially)"
                maxLength={15}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition text-sm text-slate-800 uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal"
              />
            </div>
          </div>

          {/* Transfer Details & Billing Cycle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* UTR / Transaction ID */}
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                UTR / Transaction ID
              </label>
              <input
                type="text"
                value={editUtrNumber}
                onChange={(e) => setEditUtrNumber(e.target.value)}
                placeholder="Enter bank transfer reference"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition text-sm text-slate-800 font-mono"
              />
            </div>

            {/* Plan Duration / Billing Cycle */}
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                Billing Cycle
              </label>
              <select
                value={editPlanDuration}
                onChange={(e) => setEditPlanDuration(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition text-sm text-slate-700 font-medium"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="half-yearly">Half-Yearly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                Service Start Date
              </label>
              <input
                type="date"
                value={editServiceStartDate}
                onChange={(e) => setEditServiceStartDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition text-sm text-slate-700 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                Service Expiry Date
              </label>
              <input
                type="date"
                value={editServiceExpiryDate}
                onChange={(e) => setEditServiceExpiryDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition text-sm text-slate-700 font-medium"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
              Internal Notes
            </label>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Enter context, internal remarks, or discount explanations..."
              rows={3}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition text-sm text-slate-800 resize-none leading-relaxed"
            />
          </div>

          {/* File Upload Dropzone & Live Preview */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-700 block">
              Payment Screenshot / Proof File
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-start">
              {/* Custom Dropzone */}
              <div className="relative border-2 border-dashed border-slate-200 hover:border-violet-400 bg-slate-50/50 hover:bg-slate-50/80 rounded-2xl p-5 transition group cursor-pointer flex flex-col items-center justify-center text-center sm:col-span-3 min-h-[140px]">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setEditServiceProofImage(e.target.files[0]);
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />

                <svg
                  className="w-7 h-7 text-slate-400 group-hover:text-violet-500 transition-colors mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>

                <span className="text-xs font-semibold text-slate-700 group-hover:text-violet-600 transition-colors">
                  Upload transaction receipt
                </span>
                <span className="text-[10px] text-slate-400 mt-1">
                  Drag image file here or click to browse
                </span>
              </div>

              {/* Live Preview Card */}
              <div className="sm:col-span-2 flex flex-col items-center justify-center">
                {imagePreview ? (
                  <div className="relative group rounded-2xl overflow-hidden border border-slate-200 shadow-sm w-full max-w-[150px] aspect-square bg-slate-50">
                    <img
                      src={imagePreview}
                      alt="Receipt Proof"
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => setEditServiceProofImage(null)}
                        className="p-1.5 bg-rose-600 text-white rounded-lg text-xs font-medium hover:bg-rose-700 transition"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full max-w-[150px] aspect-square border border-slate-200 border-dashed rounded-2xl bg-slate-50 flex flex-col items-center justify-center text-slate-400">
                    <span className="text-[10px] font-medium font-mono uppercase">
                      No Image Proof
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 sticky bottom-0 bg-white">
          <button
            onClick={() => setEditServiceModal(false)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs transition"
          >
            Cancel
          </button>

          <button
            onClick={updateService}
            disabled={updatingService}
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs transition flex items-center gap-2 shadow-md shadow-violet-600/10 disabled:shadow-none"
          >
            {updatingService ? (
              <>
                <svg
                  className="w-3.5 h-3.5 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    opacity="0.25"
                  />
                  <path
                    d="M22 12a10 10 0 00-10-10"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
