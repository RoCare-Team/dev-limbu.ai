"use client";

import { AlertTriangle } from "lucide-react";

// Extracted verbatim from user-management/page.jsx (Bulk Delete Confirmation Modal).
// Behaviour is unchanged — only moved into its own component.
export default function BulkDeleteModal({
  bulkDeleteModalOpen,
  bulkWaSelectedUserIds,
  setBulkDeleteModalOpen,
  confirmBulkDeleteUsers,
  isDeleting,
}) {
  if (!(bulkDeleteModalOpen && bulkWaSelectedUserIds.length > 0)) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl transform transition-all animate-in zoom-in-95">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="text-red-600" size={24} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Delete {bulkWaSelectedUserIds.length} lead
            {bulkWaSelectedUserIds.length > 1 ? "s" : ""}?
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            Selected leads will be permanently removed from user management.
            This action cannot be undone.
          </p>
          <div className="flex gap-3 w-full">
            <button
              onClick={() => setBulkDeleteModalOpen(false)}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium"
            >
              Cancel
            </button>
            <button
              onClick={confirmBulkDeleteUsers}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-medium disabled:opacity-70"
            >
              {isDeleting ? "Deleting..." : "Delete All"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
