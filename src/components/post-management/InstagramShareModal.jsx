

"use client";

import { useState, useEffect } from "react";
import { Instagram, X, Loader2, Send, Video } from "lucide-react";
import Link from "next/link";
import { metaPublishMedia } from "@/lib/postMediaUrls";

const InstagramShareModal = ({ isOpen, onClose, onConfirm, post, accounts, loading }) => {
  const [caption, setCaption] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("");

  useEffect(() => {
    if (post) {
      setCaption(post.igDescription || post.description || "");
    }
  }, [post]);

  useEffect(() => {
    if (accounts && accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].igId);
    }
  }, [accounts, selectedAccountId]);

  if (!isOpen) return null;

  const publishAsVideo = metaPublishMedia(post).type === "video";

  const handleSubmit = () => {
    const account = accounts.find(p => p.igId === selectedAccountId);
    if (account) {
      onConfirm(post, account, caption);
    } else if (accounts.length > 0) {
      onConfirm(post, accounts[0], caption);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Instagram className="w-6 h-6 text-[#E1306C]" />
            Share to Instagram
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
            <p className="text-sm text-gray-500">Loading Instagram Accounts...</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-600 mb-4">No Instagram Accounts connected.</p>
            <Link href="/dashboard" className="bg-lightPrimary text-dark px-4 py-2 rounded-lg font-semibold hover:bg-pink-700 transition">
              Connect Instagram
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Account</label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none bg-white"
              >
                {accounts.map(acc => (
                  <option key={acc.igId} value={acc.igId}>
                    {acc.igUsername}
                  </option>
                ))}
              </select>
            </div>

            {publishAsVideo && (
              <div className="flex items-center gap-2 rounded-lg bg-pink-50 border border-pink-100 px-3 py-2 text-xs text-pink-950">
                <Video className="w-4 h-4 shrink-0" />
                <span>Posting as an Instagram <strong>Reel</strong> (Graph: media → media_publish); processing may take a moment.</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Caption</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none resize-none"
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
                className="flex-1 bg-lightPrimary text-dark py-2.5 rounded-lg font-semibold hover:opacity-90 transition flex items-center justify-center gap-2"
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
};

export default InstagramShareModal;