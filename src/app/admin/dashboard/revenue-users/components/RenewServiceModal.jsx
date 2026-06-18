

export default function RenewServiceModal({
  showRenewServiceModal,
  setShowRenewServiceModal,
  renewServicePlan,
  setRenewServicePlan,
  renewServiceAmount,
  setRenewServiceAmount,
  renewServiceStartDate,
  setRenewServiceStartDate,
  renewServiceExpiryDate,
  setRenewServiceExpiryDate,
  setRenewServiceScreenshot,
  renewServiceRemarks,
  setRenewServiceRemarks,
  handleRenewService,
  savingService,
}) {
  if (!showRenewServiceModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
  <div className="bg-white w-[520px] rounded-3xl shadow-2xl overflow-hidden">

    {/* Header */}
    <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-5 flex items-center justify-between">
      <div>
        <h2 className="text-white text-2xl font-bold">
          Renew Service
        </h2>

        <p className="text-violet-100 text-sm mt-1">
          Update service details and upload payment proof
        </p>
      </div>

      <button
        onClick={() => setShowRenewServiceModal(false)}
        className="w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/30"
      >
        ✕
      </button>
    </div>

    {/* Body */}
    <div className="p-6 space-y-5">

      {/* Service Name */}
      <div>
        <label className="text-sm font-semibold text-gray-600 mb-2 block">
          Service Name
        </label>

        <input
          type="text"
          value={renewServicePlan}
          onChange={(e) => setRenewServicePlan(e.target.value)}
          placeholder="Service Name"
          className="w-full border border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-violet-500 outline-none"
        />
      </div>

      {/* Amount */}
      <div>
        <label className="text-sm font-semibold text-gray-600 mb-2 block">
          Amount
        </label>

        <input
          type="number"
          value={renewServiceAmount}
          onChange={(e) => setRenewServiceAmount(e.target.value)}
          placeholder="₹ Amount"
          className="w-full border border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-violet-500 outline-none"
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">

        <div>
          <label className="text-sm font-semibold text-gray-600 mb-2 block">
            Start Date
          </label>

          <input
            type="date"
            value={renewServiceStartDate}
            onChange={(e) => setRenewServiceStartDate(e.target.value)}
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-violet-500 outline-none"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-600 mb-2 block">
            Expiry Date
          </label>

          <input
            type="date"
            value={renewServiceExpiryDate}
            onChange={(e) => setRenewServiceExpiryDate(e.target.value)}
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-violet-500 outline-none"
          />
        </div>

      </div>

      {/* Upload */}
      <div className="border-2 border-dashed border-gray-300 rounded-2xl p-5 bg-gray-50">

        <label className="text-sm font-semibold text-gray-600 block mb-3">
          Payment Screenshot
        </label>

        <input
          type="file"
          onChange={(e) => setRenewServiceScreenshot(e.target.files[0])}
          className="w-full"
        />
      </div>

      {/* Remarks */}
      <div>
        <label className="text-sm font-semibold text-gray-600 mb-2 block">
          Remarks
        </label>

        <textarea
          rows="2"
          value={renewServiceRemarks}
          onChange={(e) => setRenewServiceRemarks(e.target.value)}
          placeholder="Write remarks..."
          className="w-full border border-gray-200 rounded-2xl px-4 py-3 resize-none focus:ring-2 focus:ring-violet-500 outline-none"
        />
      </div>

    </div>

    {/* Footer */}
    <div className="border-t px-6 py-5 flex gap-3">

      <button
        onClick={() => setShowRenewServiceModal(false)}
        className="flex-1 py-3 rounded-2xl border border-gray-300 font-semibold hover:bg-gray-100"
      >
        Cancel
      </button>

      <button
        onClick={handleRenewService}
        disabled={savingService}
        className={`flex-1 py-3 rounded-2xl font-semibold text-white transition ${
          savingService
            ? "bg-violet-400 cursor-not-allowed"
            : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:shadow-xl"
        }`}
      >
        {savingService ? "Saving..." : "Save Service"}
      </button>

    </div>

  </div>
</div>  
  );
}