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
}) {
  if (!showRenewModal) return null;

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
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => {
                setRenewDuration("monthly");

                const selectedPlan = revenuePlans.find(
                  (p) => p.name === renewPlan,
                );

                if (!selectedPlan) return;

                let amount = selectedPlan.monthly;

                amount += amount * 0.18;

                setRenewAmount(Math.round(amount));
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

                const selectedPlan = revenuePlans.find(
                  (p) => p.name === renewPlan,
                );

                if (!selectedPlan) return;

                let amount = selectedPlan.monthly * 3;

                amount = amount - amount * 0.1;

                amount += amount * 0.18;

                setRenewAmount(Math.round(amount));
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

                const selectedPlan = revenuePlans.find(
                  (p) => p.name === renewPlan,
                );

                if (!selectedPlan) return;

                let amount = selectedPlan.monthly * 12;

                amount = amount - amount * 0.2;

                amount += amount * 0.18;

                setRenewAmount(Math.round(amount));
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
          {/* Plan */}
          <div>
            <label className="text-sm font-medium text-gray-600">
              Plan Name
            </label>

            <select
              value={renewPlan}
              onChange={(e) => {
                const selectedPlan = revenuePlans.find(
                  (p) => p.name === e.target.value,
                );

                if (!selectedPlan) return;

                setRenewPlan(selectedPlan.name);

                let amount = selectedPlan.monthly;

                if (renewDuration === "quarterly") {
                  amount = amount * 3; // 3 months
                  amount = amount - amount * 0.1;
                }

                if (renewDuration === "yearly") {
                  amount = amount * 12; // 12 months
                  amount = amount - amount * 0.2;
                }

                // GST
                amount += amount * 0.18;

                setRenewAmount(Math.round(amount));
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

          {/* Amount */}
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

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">
                Start Date
              </label>

              <input
                type="date"
                value={renewStartDate}
                onChange={(e) => {
                  const startDate = e.target.value;

                  setRenewStartDate(startDate);

                  if (!startDate) return;

                  const expiry = new Date(startDate);

                  if (renewDuration === "monthly") {
                    expiry.setMonth(expiry.getMonth() + 1);
                  } else if (renewDuration === "quarterly") {
                    expiry.setMonth(expiry.getMonth() + 3);
                  } else {
                    expiry.setMonth(expiry.getMonth() + 12);
                  }

                  setRenewExpiryDate(expiry.toISOString().split("T")[0]);
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
                value={renewExpiryDate}
                readOnly
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

          {/* Buttons */}
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
