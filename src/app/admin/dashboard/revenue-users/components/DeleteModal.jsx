"use client";

  export default function DeleteModal({
    deleteModal,
    setDeleteModal,
    confirmDelete,
  }) {
    if (!deleteModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        {/* Modal Box */}
        <div className="bg-white rounded-2xl shadow-2xl w-[340px] p-6 text-center animate-scaleIn">
          {/* Icon */}
          <div className="flex justify-center mb-3">
            <div className="bg-red-100 text-red-600 w-12 h-12 flex items-center justify-center rounded-full text-xl">
              ⚠️
            </div>
          </div>

          {/* Title */}
          <h2 className="text-lg font-semibold text-gray-800">
            Delete Record?
          </h2>

          {/* Description */}
          <p className="text-sm text-gray-500 mt-2 mb-5">
            This action cannot be undone.
          </p>

          {/* Buttons */}
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setDeleteModal(false)}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-100 transition"
            >
              Cancel
            </button>

            <button
              onClick={confirmDelete}
              className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 shadow-md transition"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  }