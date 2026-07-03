"use client";

import { X } from "lucide-react";

// Extracted verbatim from user-management/page.jsx (full-view image overlay).
// Behaviour is unchanged — only moved into its own component.
export default function FullViewImageModal({
  fullViewImage,
  setFullViewImage,
}) {
  if (!fullViewImage) return null;

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
      onClick={() => setFullViewImage(null)}
    >
      <div className="relative max-w-7xl max-h-[95vh] w-full h-full flex items-center justify-center">
        <button
          onClick={() => setFullViewImage(null)}
          className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-sm z-10"
        >
          <X size={24} />
        </button>
        <img
          src={fullViewImage}
          alt="Full view"
          className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
}
