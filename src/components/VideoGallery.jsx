"use client";

import { useAuthStore } from "@/stores/useAuthStore";

export default function VideoGallery({ videos }) {
  const { setSelectedVideo } = useAuthStore();

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-2xl h-72">
        <div className="flex gap-4 animate-scroll h-full">
          {[...videos, ...videos].map((videoSrc, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedVideo(videoSrc)}
              className="flex-shrink-0 w-52 h-full cursor-pointer group relative rounded-xl overflow-hidden transition-transform duration-500 hover:-translate-y-1 bg-slate-50 shadow-sm"
              style={{
                border: "1px solid rgba(15, 23, 42, 0.05)",
              }}
            >
              {/* VIDEO */}
              <video
                src={videoSrc}
                loop
                muted
                autoPlay
                playsInline
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

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
