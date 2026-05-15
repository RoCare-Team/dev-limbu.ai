"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Youtube, X, Loader2, Send } from "lucide-react";
import Image from "next/image";

const YouTubeShareModal = ({
  isOpen,
  onClose,
  onConfirm,
  post,
  channels = [],
  loading = false,
}) => {
  const [selectedChannelId, setSelectedChannelId] = useState("");
  const [caption, setCaption] = useState("");

  useEffect(() => {
    if (post) {
      setCaption(post.ytDescription || "");
    }
  }, [post]);

  useEffect(() => {
    if (channels.length > 0 && !selectedChannelId) {
      setSelectedChannelId(channels[0].channelId || channels[0].id || "");
    }
  }, [channels, selectedChannelId]);

  const handleSubmit = useCallback(() => {
    if (!post || !channels.length || !selectedChannelId) return;
    const selectedChannel =
      channels.find(
        (channel) =>
          channel.channelId === selectedChannelId || channel.id === selectedChannelId,
      ) || channels[0];

    if (selectedChannel) {
      onConfirm(post, selectedChannel, caption);
    }
  }, [channels, caption, onConfirm, post, selectedChannelId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-red-500/10 flex items-center justify-center">
              <Youtube className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Upload to YouTube</h2>
              <p className="text-xs text-slate-500">Select channel and publish your video as a Short.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-50 transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-red-600" />
              <p className="text-sm text-slate-500">Fetching YouTube channels...</p>
            </div>
          ) : channels.length === 0 ? (
            <div className="text-center py-10 space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                <Youtube className="w-7 h-7 text-red-600" />
              </div>
              <p className="text-sm text-slate-600">No YouTube channels connected yet.</p>
              <button
                onClick={() => {
                  const userId = localStorage.getItem("userId");
                  window.location.href = `/api/youtube/login?userId=${userId}`;
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-red-600 text-white text-sm font-bold uppercase tracking-[0.18em] hover:bg-red-700 transition"
              >
                Connect YouTube
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 mb-2">
                  Select Channel
                </label>
                <select
                  value={selectedChannelId}
                  onChange={(e) => setSelectedChannelId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                >
                  {channels.map((channel) => (
                    <option
                      key={channel.channelId || channel.id}
                      value={channel.channelId || channel.id}
                    >
                      {channel.channelTitle || channel.title || channel.name || "YouTube Channel"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 mb-2">
                  Caption
                </label>
                <textarea
                  rows={4}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 resize-none"
                />
              </div>

              <button
                onClick={handleSubmit}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white hover:bg-red-700 transition"
              >
                <Send size={16} />
                Upload as Short
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(YouTubeShareModal);
