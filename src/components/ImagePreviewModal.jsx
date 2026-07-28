"use client";

import { Download, ExternalLink, X } from "lucide-react";

/**
 * Full-screen proof viewer. Handles PDFs too, since payment proofs are
 * sometimes uploaded as receipts rather than screenshots.
 */
export default function ImagePreviewModal({ url, onClose, title = "Payment proof" }) {
  if (!url) return null;

  const isPdf = String(url).split("?")[0].toLowerCase().endsWith(".pdf");

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="rounded-full bg-white p-2 text-gray-800 shadow-lg transition hover:bg-gray-100"
          title="Open in new tab"
        >
          <ExternalLink size={18} />
        </a>
        <a
          href={url}
          download
          onClick={(e) => e.stopPropagation()}
          className="rounded-full bg-white p-2 text-gray-800 shadow-lg transition hover:bg-gray-100"
          title="Download"
        >
          <Download size={18} />
        </a>
        <button
          type="button"
          className="rounded-full bg-white p-2 text-gray-800 shadow-lg transition hover:bg-gray-100"
          onClick={onClose}
          aria-label="Close preview"
        >
          <X size={18} />
        </button>
      </div>

      {isPdf ? (
        <iframe
          src={url}
          title={title}
          className="h-[85vh] w-[min(100%,960px)] rounded-lg bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <img
          src={url}
          alt={title}
          className="max-h-[90vh] max-w-[min(100%,896px)] rounded-lg object-contain shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </div>
  );
}
