"use client";

export default function RemarksNotesModal({
  showModal,
  setShowModal,
  remarks,
  notes,
  customerName,
}) {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              Remarks & Notes
            </h2>
            <p className="text-indigo-100 text-sm">
              {customerName}
            </p>
          </div>

          <button
            onClick={() => setShowModal(false)}
            className="text-white text-2xl hover:scale-110 transition"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Remarks Section */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-3">
              Plan Remarks
            </label>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 min-h-[120px]">
              {remarks ? (
                <p className="text-gray-700 text-sm whitespace-pre-wrap break-words">
                  {remarks}
                </p>
              ) : (
                <p className="text-gray-400 text-sm italic">No remarks added</p>
              )}
            </div>
          </div>

          {/* Notes Section */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-3">
              Notes
            </label>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 min-h-[120px]">
              {notes ? (
                <p className="text-gray-700 text-sm whitespace-pre-wrap break-words">
                  {notes}
                </p>
              ) : (
                <p className="text-gray-400 text-sm italic">No notes added</p>
              )}
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setShowModal(false)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:scale-[1.02] transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
