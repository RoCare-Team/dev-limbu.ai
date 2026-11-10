"use client";

import { Play } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";

/**
 * "Watch: <title>" pill that opens the site-wide video modal (VideoModal in
 * GlobalClientLayer). `video` is { url, title, duration? } from sectionCopy.
 */
export function VideoButton({ video, className = "" }) {
  const setSelectedVideo = useAuthStore((s) => s.setSelectedVideo);
  return (
    <button
      type="button"
      onClick={() => setSelectedVideo(video.url)}
      className={`group inline-flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-3 text-left transition hover:bg-slate-50 ${className}`}
    >
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#facc15] text-black transition-transform group-hover:scale-110">
        <Play size={14} className="ml-0.5 fill-black" />
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-bold text-slate-800">{video.title}</span>
        {video.duration && (
          <span className="block text-[11px] font-semibold text-slate-500">Watch video · {video.duration}</span>
        )}
      </span>
    </button>
  );
}

/** Wraps a section screen with a big play button that opens the same video. */
export function PlayableArt({ video, children }) {
  const setSelectedVideo = useAuthStore((s) => s.setSelectedVideo);
  return (
    <button
      type="button"
      onClick={() => setSelectedVideo(video.url)}
      aria-label={`Play video: ${video.title}`}
      className="group relative block w-full cursor-pointer text-left"
    >
      {children}
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#facc15] text-black shadow-[0_12px_30px_rgba(234,179,8,0.45)] transition-transform duration-300 group-hover:scale-110">
          <span className="absolute inset-0 animate-ping rounded-full bg-[#facc15]/50" />
          <Play size={24} className="relative ml-1 fill-black" />
        </span>
      </span>
    </button>
  );
}
