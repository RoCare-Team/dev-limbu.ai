"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Instagram, X, Loader2, Send } from "lucide-react";
import Link from "next/link";
import { metaPublishMedia } from "@/lib/postMediaUrls";

const InstagramShareModal = ({
  isOpen,
  onClose,
  onConfirm,
  post,
  selectedMedia = null,
  accounts = [],
  loading = false,
}) => {
  const [caption, setCaption] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  /** Instagram Graph: VIDEO = feed video, REELS = Reel */
  const [igVideoKind, setIgVideoKind] = useState("VIDEO");

  /* =========================
     Set Caption
  ========================= */
  useEffect(() => {
    if (post) {
      setCaption(post?.igDescription || post?.description || "");
      setIgVideoKind("VIDEO");
    }
  }, [post]);

  /* =========================
     Default Account Select
  ========================= */
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].igId);
    }
  }, [accounts, selectedAccountId]);

  /* =========================
     Check Video/Reel
  ========================= */
  const publishMedia = useMemo(() => {
    return selectedMedia || metaPublishMedia(post);
  }, [post, selectedMedia]);

  /* =========================
     Submit
  ========================= */
  const handleSubmit = useCallback(() => {
    if (!accounts.length) return;

    const account =
      accounts.find((acc) => acc.igId === selectedAccountId) ||
      accounts[0];

    if (account && post) {
      onConfirm(
        post,
        account,
        caption,
        publishMedia?.type === "video" ? igVideoKind : undefined,
      );
    }
  }, [accounts, selectedAccountId, post, caption, onConfirm, igVideoKind, publishMedia]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fadeIn">
      
      {/* Modal Box */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 md:p-6 animate-in fade-in zoom-in-95 duration-200 animate-scaleIn">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="flex items-center gap-2 text-lg md:text-xl font-bold text-gray-800">
            <Instagram className="w-5 h-5 md:w-6 md:h-6 text-[#E1306C]" />
            Share to Instagram
          </h2>

          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <Loader2 className="w-7 h-7 animate-spin text-pink-600" />
            <p className="text-sm text-gray-500">
              Loading Instagram Accounts...
            </p>
          </div>
        ) : accounts.length === 0 ? (
          /* No Accounts */
          <div className="text-center py-6">
            <p className="text-gray-600 mb-4">
              No Instagram accounts connected.
            </p>

            <Link
              href="/dashboard"
              className="inline-block bg-pink-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-pink-700 transition"
            >
              Connect Instagram
            </Link>
          </div>
        ) : (
          <div className="space-y-4">

            {/* Select Account */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Select Account
              </label>

              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
              >
                {accounts.map((acc) => (
                  <option key={acc.igId} value={acc.igId}>
                    {acc.igUsername}
                  </option>
                ))}
              </select>
            </div>

            {/* Caption */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Caption
              </label>

              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={4}
                placeholder="Write your caption..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none resize-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition"
              >
                Cancel
              </button>

              <button
                onClick={handleSubmit}
                disabled={!post || !publishMedia?.url}
                className="flex-1 py-2.5 rounded-lg bg-pink-600 text-white font-semibold hover:bg-pink-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

export default React.memo(InstagramShareModal);
