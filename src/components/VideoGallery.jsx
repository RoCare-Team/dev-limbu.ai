"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/stores/useAuthStore";

/**
 * Marquee 7 videos ko do baar render karta hai — 14 <video> tags. Pehle sab par
 * `autoPlay` tha aur koi `preload` control nahi, isliye page khulte hi browser
 * ~21 MB MP4 kheench leta tha, jabki ye section fold se kaafi neeche hai.
 * Ab videos tabhi attach hoti hain jab section viewport ke paas aata hai.
 */
export default function VideoGallery({ videos }) {
  const { setSelectedVideo } = useAuthStore();
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <div className="overflow-hidden rounded-2xl h-72">
        <div className="flex gap-4 animate-scroll h-full">
          {[...videos, ...videos].map((videoSrc, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedVideo(videoSrc)}
              className="flex-shrink-0 w-52 h-full cursor-pointer group relative rounded-xl overflow-hidden transition-transform duration-500 hover:-translate-y-1 bg-slate-100 shadow-sm"
              style={{
                border: "1px solid rgba(15, 23, 42, 0.05)",
              }}
            >
              {/* VIDEO — src sirf tab lagta hai jab section viewport ke paas aaye */}
              {isVisible ? (
                <video
                  src={videoSrc}
                  loop
                  muted
                  autoPlay
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div
                  className="w-full h-full"
                  style={{
                    background:
                      "linear-gradient(160deg, #f8fafc 0%, #e2e8f0 100%)",
                  }}
                />
              )}

              {/* OVERLAY */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: "rgba(15,23,42,0.6)",
                  backdropFilter: "blur(2px)",
                }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-2 text-yellow-400"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.2)",
                    border: "1px solid rgba(255,255,255,0.4)",
                  }}
                >
                  ▶
                </div>

                <span className="text-[9px] font-bold tracking-[0.15em] uppercase text-white">
                  Watch Now
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
