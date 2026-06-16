

"use client";

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

  updateService,
    updatingService,
  
}) {
  if (!editServiceModal) return null;

  return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 animate-fadeIn">
  <div className="bg-white w-[550px] max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl p-7 animate-scaleIn">

    {/* Header */}
    <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">
          Edit Service
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          Update service details, dates and proof image
        </p>
      </div>

      <button
        onClick={() => setEditServiceModal(false)}
        className="w-10 h-10 flex items-center justify-center rounded-full
        bg-gray-100 hover:bg-red-100 hover:text-red-500 transition"
      >
        ✕
      </button>
    </div>

    {/* Form */}
    <div className="space-y-5">

      {/* Amount */}
      <div>
        <label className="text-sm font-medium text-gray-600 mb-2 block">
          Amount
        </label>

        <input
          type="number"
          value={editAmount}
          onChange={(e) => setEditAmount(e.target.value)}
          placeholder="Enter amount"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl
          bg-gray-50 focus:bg-white focus:ring-2
          focus:ring-violet-500 focus:border-violet-500
          outline-none transition"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="text-sm font-medium text-gray-600 mb-2 block">
          Notes
        </label>

        <textarea
          value={editNotes}
          onChange={(e) => setEditNotes(e.target.value)}
          placeholder="Write notes..."
          rows={4}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl
          bg-gray-50 focus:bg-white focus:ring-2
          focus:ring-violet-500 focus:border-violet-500
          outline-none transition resize-none"
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">

        <div>
          <label className="text-sm font-medium text-gray-600 mb-2 block">
            Start Date
          </label>

          <input
            type="date"
            value={editServiceStartDate}
            onChange={(e) => setEditServiceStartDate(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl
            bg-gray-50 focus:bg-white focus:ring-2
            focus:ring-violet-500 outline-none"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600 mb-2 block">
            Expiry Date
          </label>

          <input
            type="date"
            value={editServiceExpiryDate}
            onChange={(e) => setEditServiceExpiryDate(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl
            bg-gray-50 focus:bg-white focus:ring-2
            focus:ring-violet-500 outline-none"
          />
        </div>

      </div>

      {/* Proof Image */}
      <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50">

        <label className="text-sm font-medium text-gray-700 block mb-3">
          Proof Image
        </label>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setEditServiceProofImage(e.target.files[0])}
          className="w-full text-sm"
        />

        {typeof editServiceProofImage === "string" &&
          editServiceProofImage && (
            <div className="mt-4 flex justify-center">
              <img
                src={editServiceProofImage}
                alt="Proof"
                className="h-32 w-32 object-cover rounded-2xl border border-gray-200 shadow-md"
              />
            </div>
          )}

      </div>

    </div>

    {/* Footer */}
    <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-gray-100">

      <button
        onClick={() => setEditServiceModal(false)}
        className="px-5 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-100 transition"
      >
        Cancel
      </button>

      <button
        onClick={updateService}
        disabled={updatingService}
        className="
        px-6 py-2.5 rounded-xl
        bg-gradient-to-r from-violet-600 to-indigo-600
        text-white font-medium shadow-lg
        hover:shadow-xl transition
        disabled:opacity-70 disabled:cursor-not-allowed
        flex items-center gap-2
        "
      >
        {updatingService ? (
          <>
            <svg
              className="w-4 h-4 animate-spin"
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
            Updating...
          </>
        ) : (
          "Update Service"
        )}
      </button>

    </div>

  </div>
</div>
  );
}