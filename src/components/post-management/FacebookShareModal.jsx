

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Facebook, X, Loader2, Send } from "lucide-react";

const FacebookShareModal = React.memo(({ isOpen, onClose, onConfirm, post, pages, loading }) => {
  const [caption, setCaption] = useState("");
  const [selectedPageId, setSelectedPageId] = useState("");

  useEffect(() => {
    if (post) {
      setCaption(post.fbDescription || post.description || "");
    }
  }, [post]);

  useEffect(() => {
    if (pages && pages.length > 0 && !selectedPageId) {
      setSelectedPageId(pages[0].pageId);
    }
  }, [pages, selectedPageId]);

  const handleSubmit = useCallback(() => {
    if (!pages || pages.length === 0) return;

    const page = pages.find(p => p.pageId === selectedPageId) || pages[0];
    if (page) {
      onConfirm(post, page, caption);
    }
  }, [onConfirm, post, pages, selectedPageId, caption]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200 animate-scaleIn">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Facebook className="w-6 h-6 text-[#1877F2]" />
            Share to Facebook
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm text-gray-500">Loading Facebook Pages...</p>
          </div>
        ) : pages.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-600 mb-4">No Facebook Pages connected.</p>
            <button onClick={onClose} className="text-blue-600 hover:underline">Close</button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Page</label>
              <select
                value={selectedPageId}
                onChange={(e) => setSelectedPageId(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                {pages.map(page => (
                  <option key={page.pageId} value={page.pageId}>
                    {page.pageName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Caption</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-semibold hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!post || !selectedPageId}
                className="flex-1 bg-[#1877F2] text-white py-2.5 rounded-lg font-semibold hover:bg-[#166FE5] transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                Post Now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

FacebookShareModal.displayName = "FacebookShareModal";

export default FacebookShareModal;
