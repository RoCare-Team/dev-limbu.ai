"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Play } from "lucide-react";

/**
 * Muted vertical preview of sample videos on the home page. Clicking it calls
 * onOpen(index) so the parent can show the video in a modal with sound.
 * The files are large (up to ~20 MB), so nothing is downloaded until the card
 * scrolls into view, and the video pauses again once it scrolls out.
 */
export default function SampleReel({ videos, label, paused = false, onOpen }) {
  const wrapperRef = useRef(null);
  const videoRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [inView, setInView] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const many = videos.length > 1;

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.35 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (inView && !paused) {
      // Autoplay can be refused (e.g. data saver) — the play overlay stays then.
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [inView, paused, index]);

  const show = (i) => {
    if (i === index) return;
    setLoaded(false);
    setIndex(i);
  };
  const step = (delta) => show((index + delta + videos.length) % videos.length);

  // Stop the click from also opening the modal.
  const control = (fn) => (e) => {
    e.stopPropagation();
    fn();
  };

  return (
    <div
      ref={wrapperRef}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(index)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(index);
        }
      }}
      aria-label={`Watch ${label} sample ${index + 1}`}
      className="group/reel relative h-56 w-full sm:h-60 cursor-pointer overflow-hidden rounded-xl bg-slate-900 outline-none ring-[#facc15] focus-visible:ring-2"
    >
      {inView || loaded ? (
        <video
          ref={videoRef}
          key={videos[index]}
          src={videos[index]}
          muted
          playsInline
          autoPlay
          preload="metadata"
          loop={!many}
          onLoadedData={() => setLoaded(true)}
          onEnded={() => many && step(1)}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover/reel:scale-105"
        />
      ) : null}

      {/* Loading state */}
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-800 via-slate-900 to-yellow-900/40" />
      )}

      {/* Shades */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/70 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 to-transparent" />

      {/* Label + counter */}
      <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
        <span className="rounded-full bg-[#facc15] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-black shadow-lg">
          {label}
        </span>
        {many && (
          <span className="rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
            {index + 1}/{videos.length}
          </span>
        )}
      </div>

      {/* Big play prompt */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-md ring-1 ring-white/40 transition-all duration-300 group-hover/reel:scale-110 group-hover/reel:bg-[#facc15]">
          <Play
            size={26}
            className="ml-1 fill-white text-white transition-colors group-hover/reel:fill-black group-hover/reel:text-black"
          />
        </span>
      </div>

      {many && (
        <>
          <button
            type="button"
            onClick={control(() => step(-1))}
            aria-label="Previous sample"
            className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-opacity hover:bg-black/70 sm:opacity-0 sm:group-hover/reel:opacity-100"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={control(() => step(1))}
            aria-label="Next sample"
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-opacity hover:bg-black/70 sm:opacity-0 sm:group-hover/reel:opacity-100"
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}

      {/* Bottom: tap to watch + dots */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 pb-3">
        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-white">
          <Maximize2 size={12} /> Tap to watch
        </span>
        {many && (
          <div className="flex gap-1.5">
            {videos.map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={control(() => show(i))}
                aria-label={`Show sample ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-5 bg-[#facc15]" : "w-1.5 bg-white/60"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
