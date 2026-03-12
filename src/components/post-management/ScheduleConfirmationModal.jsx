
"use client";

import { CheckCircle, MapPin, Facebook, Instagram } from "lucide-react";

 const ScheduleConfirmationModal = ({ 
  isOpen, 
  onClose,
  scheduledPlatforms
}) => {
  if (!isOpen) return null;

  const hasGMB = scheduledPlatforms.gmb && scheduledPlatforms.gmb.length > 0;
  const hasFB = scheduledPlatforms.fb && scheduledPlatforms.fb.length > 0;
  const hasIG = scheduledPlatforms.ig && scheduledPlatforms.ig.length > 0;

  return (
<div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
  <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl border">

    {/* Header */}
    <div className="flex flex-col items-center text-center px-5 pt-5 pb-4 border-b">
      <div className="w-11 h-11 rounded-full bg-lightPrimary flex items-center justify-center mb-2">
        <CheckCircle className="w-6 h-6 text-dark" />
      </div>

      <h2 className="text-lg font-semibold text-dark">
        Post Scheduled
      </h2>
      <p className="text-xs text-gray-500 mt-1">
        Your content will be published at the selected time
      </p>
    </div>

    {/* Platforms */}
    <div className="px-5 py-4 space-y-2">
      {hasGMB && (
        <div className="flex items-center justify-between text-sm border rounded-lg px-3 py-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-dark" />
            <span className="font-medium text-gray-700">Google Business</span>
          </div>
          <span className="text-xs text-gray-500">
            {scheduledPlatforms.gmb.length} selected
          </span>
        </div>
      )}

      {hasFB && (
        <div className="flex items-center justify-between text-sm border rounded-lg px-3 py-2">
          <div className="flex items-center gap-2">
            <Facebook className="w-4 h-4 text-dark" />
            <span className="font-medium text-gray-700">Facebook</span>
          </div>
          <span className="text-xs text-gray-500">
            {scheduledPlatforms.fb.length} selected
          </span>
        </div>
      )}

      {hasIG && (
        <div className="flex items-center justify-between text-sm border rounded-lg px-3 py-2">
          <div className="flex items-center gap-2">
            <Instagram className="w-4 h-4 text-pink-600" />
            <span className="font-medium text-gray-700">Instagram</span>
          </div>
          <span className="text-xs text-gray-500">
            {scheduledPlatforms.ig.length} selected
          </span>
        </div>
      )}
    </div>

    {/* Footer */}
    <div className="px-5 pb-5">
      <button
        onClick={onClose}
        className="w-full py-2.5 rounded-lg text-sm font-medium
                   bg-lightPrimary text-dark hover:bg-yellow-400"
      >
        Done
      </button>
    </div>
  </div>
</div>



  );
};

export default ScheduleConfirmationModal;