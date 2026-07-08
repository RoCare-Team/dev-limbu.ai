import { useState } from "react";

export default function RenewPlanModal({
  showRenewModal,
  setShowRenewModal,
  renewPlan,
  setRenewPlan,
  renewAmount,
  setRenewAmount,
  renewStartDate,
  setRenewStartDate,
  renewExpiryDate,
  setRenewExpiryDate,
  renewScreenshot,
  setRenewScreenshot,
  renewRemarks,
  setRenewRemarks,
  handleRenewPlan,
  savingPlan,
  revenuePlans,
  renewDuration,
  setRenewDuration,
  // New props for GST Number
  renewGstNumber,
  setRenewGstNumber,
}) {
  // Fallback to local state if the parent component does not pass GST state
  const [localGstNumber, setLocalGstNumber] = useState("");
  const gstNumber = renewGstNumber !== undefined ? renewGstNumber : localGstNumber;
  const setGstNumber = setRenewGstNumber !== undefined ? setRenewGstNumber : setLocalGstNumber;

  if (!showRenewModal) return null;

  // Helper function to calculate total amount including standard 18% GST
  const calculateTotalAmount = (planName, duration) => {
    const selectedPlan = revenuePlans.find((p) => p.name === planName);
    if (!selectedPlan) return 0;

    let baseAmount = selectedPlan.monthly;

    if (duration === "quarterly") {
      baseAmount = baseAmount * 3;
      baseAmount = baseAmount - baseAmount * 0.1; // 10% discount
    } else if (duration === "yearly") {
      baseAmount = baseAmount * 12;
      baseAmount = baseAmount - baseAmount * 0.2; // 20% discount
    }

    const gstAmount = baseAmount * 0.18; // Standard 18% GST
    return Math.round(baseAmount + gstAmount);
  };

  // Helper function to calculate expiry date based on start date and duration
  const calculateExpiryDate = (startDate, duration) => {
    if (!startDate) return "";
    const expiry = new Date(startDate);

    if (duration === "monthly") {
      expiry.setMonth(expiry.getMonth() + 1);
    } else if (duration === "quarterly") {
      expiry.setMonth(expiry.getMonth() + 3);
    } else if (duration === "yearly") {
      expiry.setMonth(expiry.getMonth() + 12);
    }

    return expiry.toISOString().split("T")[0];
  };

  // Helper function to format date for input field (handles timezone correctly)
  const formatDateForInput = (dateStr) => {
    if (!dateStr) return "";
    // Ensure date string is in YYYY-MM-DD format
    if (dateStr.includes("-") && dateStr.length === 10) {
      return dateStr;
    }
    // If it's a Date object or needs conversion
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Renew Revenue Plan</h2>
            <p className="text-indigo-100 text-sm">
              Update customer subscription details
            </p>
          </div>

          <button
            onClick={() => setShowRenewModal(false)}
            className="text-white text-2xl hover:scale-110 transition"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Duration Toggles */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => {
                setRenewDuration("monthly");
                const amount = calculateTotalAmount(renewPlan, "monthly");
                setRenewAmount(amount);
                // ✅ Recalculate expiry date when duration changes
                if (renewStartDate) {
                  const newExpiry = calculateExpiryDate(renewStartDate, "monthly");
                  setRenewExpiryDate(newExpiry);
                }
              }}
              className={`flex-1 rounded-xl py-2 ${
                renewDuration === "monthly"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100"
              }`}
            >
              Monthly
            </button>

            <button
              type="button"
              onClick={() => {
                setRenewDuration("quarterly");
                const amount = calculateTotalAmount(renewPlan, "quarterly");
                setRenewAmount(amount);
                // ✅ Recalculate expiry date when duration changes
                if (renewStartDate) {
                  const newExpiry = calculateExpiryDate(renewStartDate, "quarterly");
                  setRenewExpiryDate(newExpiry);
                }
              }}
              className={`flex-1 rounded-xl py-2 ${
                renewDuration === "quarterly"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100"
              }`}
            >
              Quarterly -10%
            </button>

            <button
              type="button"
              onClick={() => {
                setRenewDuration("yearly");
                const amount = calculateTotalAmount(renewPlan, "yearly");
                setRenewAmount(amount);
                // ✅ Recalculate expiry date when duration changes
                if (renewStartDate) {
                  const newExpiry = calculateExpiryDate(renewStartDate, "yearly");
                  setRenewExpiryDate(newExpiry);
                }
              }}
              className={`flex-1 rounded-xl py-2 ${
                renewDuration === "yearly"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100"
              }`}
            >
              Yearly -20%
            </button>
          </div>

          {/* Plan Selection */}
          <div>
            <label className="text-sm font-medium text-gray-600">
              Plan Name
            </label>

            <select
              value={renewPlan}
              onChange={(e) => {
                const selectedPlanName = e.target.value;
                setRenewPlan(selectedPlanName);

                const amount = calculateTotalAmount(
                  selectedPlanName,
                  renewDuration
                );
                setRenewAmount(amount);
              }}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
            >
              <option value="">Select Plan</option>

              {revenuePlans.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Amount Field */}
          <div>
            <label className="text-sm font-medium text-gray-600">Amount</label>
            <input
              type="number"
              value={renewAmount}
              onChange={(e) => setRenewAmount(e.target.value)}
              placeholder="Enter Amount"
              className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-indigo-500 focus:bg-white"
            />
          </div>

          {/* GST Number Field */}
          <div>
            <label className="text-sm font-medium text-gray-600">
              GST Number (Optional)
            </label>
            <input
              type="text"
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
              placeholder="e.g. 22AAAAA1111A1Z5"
              maxLength={15}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-indigo-500 focus:bg-white uppercase text-sm font-mono tracking-wider"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">
                Start Date
              </label>

              <input
                type="date"
                value={formatDateForInput(renewStartDate)}
                onChange={(e) => {
                  const startDate = e.target.value;
                  setRenewStartDate(startDate);

                  if (!startDate) return;

                  // ✅ Use helper function to calculate expiry date
                  const newExpiry = calculateExpiryDate(startDate, renewDuration);
                  setRenewExpiryDate(newExpiry);
                }}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">
                Expiry Date
              </label>

              <input
                type="date"
                value={formatDateForInput(renewExpiryDate)}
                onChange={(e) => setRenewExpiryDate(e.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
              />
            </div>
          </div>

          {/* Screenshot */}
          <div>
            <label className="text-sm font-medium text-gray-600">
              Payment Screenshot
            </label>

            <input
              type="file"
              onChange={(e) => setRenewScreenshot(e.target.files[0])}
              className="mt-2 w-full rounded-xl border border-dashed border-indigo-300 p-3 text-sm"
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="text-sm font-medium text-gray-600">Remarks</label>

            <textarea
              rows={3}
              value={renewRemarks}
              onChange={(e) => setRenewRemarks(e.target.value)}
              placeholder="Write remarks..."
              className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-indigo-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowRenewModal(false)}
              className="flex-1 rounded-xl border border-gray-300 py-3 font-semibold hover:bg-gray-100"
            >
              Cancel
            </button>

            <button
              onClick={handleRenewPlan}
              disabled={savingPlan}
              className={`flex-1 rounded-xl py-3 font-semibold text-white transition-all ${
                savingPlan
                  ? "bg-indigo-300 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-[1.02]"
              }`}
            >
              {savingPlan ? "Saving..." : "Save Plan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}