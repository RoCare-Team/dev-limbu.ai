"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Coins, Sparkles, X } from "lucide-react";
import { VIDEO_MIN_SECONDS, VIDEO_MAX_SECONDS, videoCoins } from "@/lib/videoPricing";

/**
 * Full-screen player for one tool's sample videos, with sound and controls.
 * Esc closes, ← / → switch samples, clicking the backdrop closes.
 */
export default function VideoSampleModal({ item, videos, startIndex, onClose }) {
  const [index, setIndex] = useState(startIndex);
  const many = videos.length > 1;
  const step = (delta) => setIndex((i) => (i + delta + videos.length) % videos.length);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (many && e.key === "ArrowRight") step(1);
      if (many && e.key === "ArrowLeft") step(-1);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [many, onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${item.title} samples`}
      onClick={onClose}
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
      >
        <X size={20} />
      </button>

      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-full w-full max-w-4xl flex-col items-center gap-6 md:flex-row md:items-stretch md:justify-center"
      >
        {/* Player */}
        <div className="relative flex items-center">
          {many && (
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous sample"
              className="absolute -left-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition-colors hover:bg-[#facc15] hover:text-black md:-left-14"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          <video
            key={videos[index]}
            src={videos[index]}
            controls
            autoPlay
            playsInline
            className="aspect-[9/16] h-[62vh] max-h-[640px] rounded-2xl bg-black object-contain shadow-[0_0_60px_rgba(250,204,21,0.25)] ring-1 ring-white/10 md:h-[80vh]"
          />

          {many && (
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next sample"
              className="absolute -right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition-colors hover:bg-[#facc15] hover:text-black md:-right-14"
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>

        {/* Details */}
        <div className="flex w-full max-w-sm flex-col justify-center text-center md:ml-10 md:text-left">
          <span className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-[#facc15]/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-[#facc15] md:mx-0 md:self-start">
            <Sparkles size={12} /> Made with Limbu AI
          </span>
          <h3
            className="mt-3 text-2xl font-black uppercase tracking-tight text-white md:text-3xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {item.title}
          </h3>
          <p className="mt-2 text-sm font-medium text-white/60">{item.description}</p>

          <div className="mt-4 hidden grid-cols-2 gap-3 md:grid">
            <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
              <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
                From
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-lg font-black text-white">
                <Coins size={16} className="text-[#facc15]" />
                {videoCoins(item.coinsPerSecond, VIDEO_MIN_SECONDS)}
              </div>
              <div className="text-[11px] text-white/40">for {VIDEO_MIN_SECONDS}s video</div>
            </div>
            <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
              <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
                Length
              </div>
              <div className="mt-1 text-lg font-black text-white">
                {VIDEO_MIN_SECONDS}–{VIDEO_MAX_SECONDS}s
              </div>
              <div className="text-[11px] text-white/40">{item.coinsPerSecond} coins / sec</div>
            </div>
          </div>

          {many && (
            <div className="mt-4 flex justify-center gap-1.5 md:justify-start">
              {videos.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Show sample ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-6 bg-[#facc15]" : "w-1.5 bg-white/40 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>
          )}

          <Link
            href={item.href}
            className="mt-5 rounded-xl bg-[#facc15] py-3 text-center text-sm font-black uppercase tracking-wide text-black shadow-[0_8px_30px_rgba(250,204,21,0.35)] transition-transform hover:scale-[1.02]"
          >
            Create your {item.title}
          </Link>
        </div>
      </div>
    </div>,
    document.body
  );
}
