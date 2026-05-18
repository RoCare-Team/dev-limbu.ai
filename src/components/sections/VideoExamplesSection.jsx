"use client";

import { useState } from "react";
import { X } from "lucide-react";

export default function VideoExamplesSection({ videoExamples = [] }) {
  const [selectedVideo, setSelectedVideo] = useState(null);

  return (
    <section
      id="video-examples"
      className="relative w-full overflow-hidden py-12 border-t border-black/5"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* ── Background grid texture ── */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(15, 23, 42, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(15, 23, 42, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* ── Ambient glow — top center ── */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] z-0 opacity-10"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(250, 204, 21, 0.4) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        {/* ── Section Header ── */}
        <div className="text-center mb-10 sm:mb-12">
          {/* Label chip */}
          <div
            className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full"
            style={{
              background: "rgba(250, 204, 21, 0.1)",
              border: "1px solid rgba(250, 204, 21, 0.2)",
              backdropFilter: "blur(8px)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: "var(--lemon-hover)" }}
            />
            <span
              className="text-[11px] font-bold tracking-[0.2em] uppercase"
              style={{ color: "var(--lemon-hover)" }}
            >
              Limbu AI Video Engine
            </span>
          </div>

          {/* Headline */}
          <h2
            className="font-bold uppercase leading-[0.95] tracking-tight mb-4"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--foreground)",
              fontSize: "clamp(1.8rem, 4.5vw, 3rem)",
            }}
          >
            Limbu AI{" "}
            <span
              style={{
                color: "var(--lemon-hover)",
              }}
            >
              Video Creations
            </span>
          </h2>

          {/* Divider */}
          <div className="flex items-center justify-center gap-3 mb-5">
            <div
              className="h-px w-16 sm:w-24"
              style={{ background: "rgba(15, 23, 42, 0.1)" }}
            />
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: "var(--lemon-hover)" }}
            />
            <div
              className="h-px w-16 sm:w-24"
              style={{ background: "rgba(15, 23, 42, 0.1)" }}
            />
          </div>

          <p
            className="text-sm sm:text-base leading-relaxed max-w-xl mx-auto font-semibold"
            style={{ color: "rgba(15, 23, 42, 0.6)" }}
          >
            Experience next-generation AI solutions crafted to elevate
            businesses like yours.
          </p>
        </div>

        {/* ── Video Slider ── */}
        <div className="relative">
          {/* Scrolling track */}
          <div className="overflow-hidden rounded-2xl h-72">
            <div className="flex gap-4 animate-scroll h-full">
              {[...videoExamples, ...videoExamples].map((videoSrc, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedVideo(videoSrc)}
                  className="flex-shrink-0 w-52 h-full cursor-pointer group relative rounded-xl overflow-hidden transition-transform duration-500 hover:-translate-y-1 bg-slate-50 shadow-sm"
                  style={{
                    border: "1px solid rgba(15, 23, 42, 0.05)",
                  }}
                >
                  {/* Video */}
                  <video
                    src={videoSrc}
                    loop
                    muted
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Hover overlay */}
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: "rgba(15,23,42,0.6)",
                      backdropFilter: "blur(2px)",
                    }}
                  >
                    {/* Play icon */}
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center mb-2"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.2)",
                        border: "1px solid rgba(255,255,255,0.4)",
                      }}
                    >
                      <svg
                        className="w-4 h-4 ml-0.5"
                        fill="#ffffff"
                        viewBox="0 0 24 24"
                      >
                        <path d="M5.536 21.886a1.004 1.004 0 0 0 1.033-.064l13-9a1 1 0 0 0 0-1.644l-13-9A1 1 0 0 0 5 3v18a1 1 0 0 0 .536.886z" />
                      </svg>
                    </div>
                    <span
                      className="text-[9px] font-bold tracking-[0.15em] uppercase text-white"
                    >
                      Watch Now
                    </span>
                  </div>

                  {/* Corner accent */}
                  <div
                    className="absolute top-0 right-0 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      borderTop: "2px solid var(--lemon-hover)",
                      borderRight: "2px solid var(--lemon-hover)",
                    }}
                  />

                  {/* AI badge bottom */}
                  <div
                    className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md z-10"
                    style={{
                      background: "rgba(255,255,255,0.9)",
                      border: "1px solid rgba(15,23,42,0.1)",
                      backdropFilter: "blur(6px)",
                    }}
                  >
                    <span
                      className="text-[8px] font-bold tracking-[0.12em] uppercase text-slate-700"
                    >
                      Limbu AI
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal ── */}
      {selectedVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{
            backgroundColor: "rgba(15,23,42,0.9)",
            backdropFilter: "blur(8px)",
          }}
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="relative w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute -top-12 right-0 flex items-center gap-2 group"
            >
              <span
                className="text-[11px] font-bold tracking-[0.15em] uppercase text-white/60 transition-colors duration-200 group-hover:text-white"
              >
                Close
              </span>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 border border-white/20 transition-all duration-200 group-hover:scale-110 group-hover:bg-white/20"
              >
                <X className="w-4 h-4 text-white" />
              </div>
            </button>

            {/* Video container */}
            <div
              className="rounded-2xl overflow-hidden shadow-2xl"
              style={{
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {/* Top bar */}
              <div
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border-b border-white/5"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse bg-yellow-400"
                />
                <span
                  className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/70"
                >
                  AI Generated Video
                </span>
              </div>

              <video
                src={selectedVideo}
                controls
                autoPlay
                className="w-full h-auto"
                style={{ backgroundColor: "#000", maxHeight: "80vh" }}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
