"use client";

import { useState } from "react";
import { X } from "lucide-react";

export default function VideoExamplesSection({ videoExamples = [] }) {
  const [selectedVideo, setSelectedVideo] = useState(null);

  return (
    <section
      id="video-examples"
      className="relative w-full overflow-hidden py-20 sm:py-24 md:py-32"
      style={{ backgroundColor: "var(--cyber-black)" }}
    >
      {/* ── Background grid texture ── */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(253,224,71,0.6) 1px, transparent 1px),
            linear-gradient(90deg, rgba(253,224,71,0.6) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* ── Ambient glow — top center ── */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] z-0 opacity-20"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(253,224,71,0.35) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        {/* ── Section Header ── */}
        <div className="text-center mb-12 sm:mb-16">
          {/* Label chip */}
          <div
            className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full"
            style={{
              background: "rgba(253,224,71,0.06)",
              border: "1px solid rgba(253,224,71,0.2)",
              backdropFilter: "blur(8px)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: "#FDE047" }}
            />
            <span
              className="text-[11px] font-semibold tracking-[0.2em] uppercase"
              style={{ color: "#FDE047" }}
            >
              AI Video Engine
            </span>
          </div>

          {/* Headline */}
          <h2
            className="font-normal uppercase leading-[0.9] tracking-tight mb-4"
            style={{
              fontFamily: "Anton, Impact, sans-serif",
              color: "var(--pure-white)",
              fontSize: "clamp(2rem, 5vw, 4.5rem)",
            }}
          >
            Stunning{" "}
            <span
              style={{
                WebkitTextStroke: "2px #FDE047",
                color: "transparent",
              }}
            >
              Video Creations
            </span>
          </h2>

          {/* Divider */}
          <div className="flex items-center justify-center gap-3 mb-5">
            <div
              className="h-px w-16 sm:w-24"
              style={{ background: "rgba(253,224,71,0.25)" }}
            />
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: "#FDE047" }}
            />
            <div
              className="h-px w-16 sm:w-24"
              style={{ background: "rgba(253,224,71,0.25)" }}
            />
          </div>

          <p
            className="text-sm sm:text-base md:text-lg leading-relaxed max-w-xl mx-auto font-medium"
            style={{ color: "rgba(226,232,240,0.7)" }}
          >
            Experience next-generation AI solutions crafted to elevate
            businesses like yours.
          </p>
        </div>

        {/* ── Video Slider ── */}
        <div className="relative">
          {/* Left fade */}
          <div
            className="pointer-events-none absolute left-0 top-0 h-full w-20 md:w-32 z-20"
            style={{
              background:
                "linear-gradient(to right, var(--cyber-black), transparent)",
            }}
          />

          {/* Right fade */}
          <div
            className="pointer-events-none absolute right-0 top-0 h-full w-20 md:w-32 z-20"
            style={{
              background:
                "linear-gradient(to left, var(--cyber-black), transparent)",
            }}
          />

          {/* Scrolling track */}
          <div className="overflow-hidden rounded-2xl h-80">
            <div className="flex gap-4 animate-scroll h-full">
              {[...videoExamples, ...videoExamples].map((videoSrc, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedVideo(videoSrc)}
                  className="flex-shrink-0 w-56 h-full cursor-pointer group relative rounded-xl overflow-hidden transition-transform duration-500 hover:-translate-y-1"
                  style={{
                    border: "1px solid rgba(253,224,71,0.12)",
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
                    style={{ backgroundColor: "#111" }}
                  />

                  {/* Hover overlay */}
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: "rgba(5,5,5,0.55)",
                      backdropFilter: "blur(2px)",
                    }}
                  >
                    {/* Play icon */}
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center mb-2"
                      style={{
                        backgroundColor: "rgba(253,224,71,0.15)",
                        border: "1px solid rgba(253,224,71,0.5)",
                      }}
                    >
                      <svg
                        className="w-5 h-5 ml-0.5"
                        fill="#FDE047"
                        viewBox="0 0 24 24"
                      >
                        <path d="M5.536 21.886a1.004 1.004 0 0 0 1.033-.064l13-9a1 1 0 0 0 0-1.644l-13-9A1 1 0 0 0 5 3v18a1 1 0 0 0 .536.886z" />
                      </svg>
                    </div>
                    <span
                      className="text-[10px] font-semibold tracking-[0.15em] uppercase"
                      style={{ color: "#FDE047" }}
                    >
                      Watch Now
                    </span>
                  </div>

                  {/* Corner accent */}
                  <div
                    className="absolute top-0 right-0 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      borderTop: "2px solid #FDE047",
                      borderRight: "2px solid #FDE047",
                    }}
                  />
                  <div
                    className="absolute bottom-0 left-0 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      borderBottom: "2px solid #FDE047",
                      borderLeft: "2px solid #FDE047",
                    }}
                  />

                  {/* AI badge bottom */}
                  <div
                    className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md z-10"
                    style={{
                      background: "rgba(5,5,5,0.7)",
                      border: "1px solid rgba(253,224,71,0.2)",
                      backdropFilter: "blur(6px)",
                    }}
                  >
                    <span
                      className="text-[9px] font-bold tracking-[0.15em] uppercase"
                      style={{ color: "#FDE047" }}
                    >
                      AI Generated
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
            backgroundColor: "rgba(5,5,5,0.85)",
            backdropFilter: "blur(8px)",
          }}
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="relative w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute -top-12 right-0 flex items-center gap-2 group"
            >
              <span
                className="text-[11px] font-semibold tracking-[0.15em] uppercase transition-colors duration-200"
                style={{ color: "rgba(253,224,71,0.6)" }}
              >
                Close
              </span>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 group-hover:scale-110"
                style={{
                  backgroundColor: "rgba(253,224,71,0.1)",
                  border: "1px solid rgba(253,224,71,0.3)",
                }}
              >
                <X className="w-4 h-4" style={{ color: "#FDE047" }} />
              </div>
            </button>

            {/* Video container */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                border: "1px solid rgba(253,224,71,0.25)",
                boxShadow: "0 0 60px rgba(253,224,71,0.1)",
              }}
            >
              {/* Top bar */}
              <div
                className="flex items-center gap-2 px-4 py-2.5"
                style={{
                  backgroundColor: "rgba(18,18,18,0.95)",
                  borderBottom: "1px solid rgba(253,224,71,0.1)",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ backgroundColor: "#FDE047" }}
                />
                <span
                  className="text-[10px] font-semibold tracking-[0.2em] uppercase"
                  style={{ color: "rgba(253,224,71,0.7)" }}
                >
                  AI Generated Video
                </span>
              </div>

              <video
                src={selectedVideo}
                controls
                autoPlay
                className="w-full h-auto"
                style={{ backgroundColor: "#0a0a0a", maxHeight: "70vh" }}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
