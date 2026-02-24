import React from "react";
import { XCircle } from "lucide-react";

const RejectReasonModal = ({ onClose, onSubmit, reason, setReason }) => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-scale-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 sm:p-8 border-4 border-red-200">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-7 h-7 text-red-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Reason for Rejection</h2>
              <p className="text-gray-500 text-sm">Please provide a reason for rejecting this post.</p>
            </div>
          </div>

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Image quality is poor, description is not accurate..."
            className="w-full p-3 border-2 border-gray-300 rounded-xl text-gray-800 focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none transition-all min-h-[120px]"
          />

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={onSubmit}
              disabled={!reason.trim()}
              className="flex-1 bg-gradient-to-r from-neutral-700 to-yellow-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Rejection
            </button>
            <button onClick={onClose} className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-300 transition-all">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RejectReasonModal;
