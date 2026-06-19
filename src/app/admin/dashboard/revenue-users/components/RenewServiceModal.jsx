export default function RenewServiceModal({
  showRenewServiceModal,
  setShowRenewServiceModal,
  renewServiceName,
  setRenewServiceName,
  renewServiceAmount,
  setRenewServiceAmount,
  renewServiceStartDate,
  setRenewServiceStartDate,
  renewServiceExpiryDate,
  setRenewServiceExpiryDate,
  renewServiceScreenshot,
  setRenewServiceScreenshot,
  renewServiceRemarks,
  setRenewServiceRemarks,
  handleRenewService,
  savingServicePlan,
  servicePlans,
}) {
  if (!showRenewServiceModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Renew Service</h2>
            <p className="text-indigo-100 text-sm">
              Update customer service details
            </p>
          </div>

          <button
            onClick={() => setShowRenewServiceModal(false)}
            className="text-white text-2xl hover:scale-110 transition"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Service Name */}
          <div>
            <label className="text-sm font-medium text-gray-600">
              Service Name
            </label>

            <select
              value={renewServiceName}
              onChange={(e) => {
                const selected = servicePlans.find(
                  (p) => p.name === e.target.value,
                );

                setRenewServiceName(selected.name);
                setRenewServiceAmount(selected.amount);
              }}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
            >
              <option value="">Select Service</option>

              {servicePlans.map((p) => (
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
              value={renewServiceAmount}
              onChange={(e) => setRenewServiceAmount(e.target.value)}
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
                value={renewServiceStartDate}
                onChange={(e) => {
                  const start = e.target.value;

                  setRenewServiceStartDate(start);

                  const d = new Date(start);

                  d.setMonth(d.getMonth() + 1);

                  setRenewServiceExpiryDate(d.toISOString().split("T")[0]);
                }}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">
                Expiry Date
              </label>

              <input
                type="date"
                value={renewServiceExpiryDate}
                onChange={(e) => setRenewServiceExpiryDate(e.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-indigo-500"
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
              onChange={(e) => setRenewServiceScreenshot(e.target.files[0])}
              className="mt-2 w-full rounded-xl border border-dashed border-indigo-300 p-3 text-sm"
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="text-sm font-medium text-gray-600">Remarks</label>

            <textarea
              rows={3}
              value={renewServiceRemarks}
              onChange={(e) => setRenewServiceRemarks(e.target.value)}
              placeholder="Write remarks..."
              className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-indigo-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowRenewServiceModal(false)}
              className="flex-1 rounded-xl border border-gray-300 py-3 font-semibold hover:bg-gray-100"
            >
              Cancel
            </button>

            <button
              onClick={handleRenewService}
              disabled={savingServicePlan}
              className={`flex-1 rounded-xl py-3 font-semibold text-white transition-all ${
                savingServicePlan
                  ? "bg-indigo-300 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-[1.02]"
              }`}
            >
              {savingServicePlan ? "Saving..." : "Save Service"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
