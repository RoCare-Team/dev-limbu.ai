

"use client";

export default function EditServiceModal({
  editServiceModal,
  setEditServiceModal,
  editAmount,
  setEditAmount,
  editNotes,
  setEditNotes,
  updateService,
}) {
  if (!editServiceModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white w-[380px] rounded-2xl shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-800">
            Edit Service
          </h2>

          <button
            onClick={() => setEditServiceModal(false)}
            className="w-7 h-7 flex items-center justify-center rounded-full 
            bg-gray-100 hover:bg-gray-200 text-gray-500 transition"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Amount */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              Amount
            </label>

            <input
              type="number"
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg 
              bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              Notes
            </label>

            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Write notes..."
              rows={3}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg 
              bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => setEditServiceModal(false)}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-100 transition"
          >
            Cancel
          </button>

          <button
            onClick={updateService}
            className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white 
            hover:bg-indigo-700 shadow-sm hover:shadow-md transition"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
}