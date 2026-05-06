

"use client";

import { X } from "lucide-react";

export default function ImagePreviewModal({
  fullViewImage,
  setFullViewImage,
}) {
  if (!fullViewImage) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
      onClick={() => setFullViewImage(null)}
      role="presentation"
    >
      <button
        type="button"
        className="absolute right-4 top-4 z-10 rounded-full bg-white p-2 text-gray-800 shadow-lg transition hover:bg-gray-100"
        onClick={() => setFullViewImage(null)}
        aria-label="Close preview"
      >
        <X size={20} />
      </button>

      <img
        src={fullViewImage}
        alt="Payment proof"
        className="max-h-[90vh] max-w-[min(100%,896px)] rounded-lg object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}