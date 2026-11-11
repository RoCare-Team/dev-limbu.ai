"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Play, X } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import SocialDemo from "../art/SocialDemo";

// Built-in animated demos, by sectionCopy `video.demo` key.
const DEMOS = { social: SocialDemo };

/** Modal that plays a built-in demo larger. */
function DemoModal({ video, onClose }) {
  const Demo = DEMOS[video.demo];
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);
  if (!Demo) return null;
  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={video.title}
        className="relative max-h-[94vh] overflow-y-auto rounded-3xl bg-white px-6 pb-6 pt-12 shadow-2xl sm:px-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900">
          <X size={18} />
        </button>
        <p className="mb-5 text-center text-lg font-black text-slate-900">{video.title}</p>
        <Demo large />
      </div>
    </div>,
    document.body
  );
}

/**
 * "Watch: <title>" pill. A YouTube `video.url` opens the site-wide video modal
 * (VideoModal in GlobalClientLayer); a built-in `video.demo` opens DemoModal.
 * `video` is { url | demo, title, duration? } from sectionCopy.
 */
export function VideoButton({ video, className = "" }) {
  const setSelectedVideo = useAuthStore((s) => s.setSelectedVideo);
  const [demoOpen, setDemoOpen] = useState(false);
  return (
    <>
    <button
      type="button"
      onClick={() => (video.demo ? setDemoOpen(true) : setSelectedVideo(video.url))}
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
    {demoOpen && <DemoModal video={video} onClose={() => setDemoOpen(false)} />}
    </>
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
