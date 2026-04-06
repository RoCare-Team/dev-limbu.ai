"use client";

import Image from "next/image";

export default function ExamplesSection({ postImages = [], setSelectedImage }) {
  return (
    <section
      id="examples"
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
          <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full"
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
              AI-Powered Output
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
            AI-Generated{" "}
            <span
              style={{
                WebkitTextStroke: "2px #FDE047",
                color: "transparent",
              }}
            >
              Post Examples
            </span>
          </h2>

          {/* Divider line */}
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="h-px w-16 sm:w-24" style={{ background: "rgba(253,224,71,0.25)" }} />
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#FDE047" }} />
            <div className="h-px w-16 sm:w-24" style={{ background: "rgba(253,224,71,0.25)" }} />
          </div>

          <p
            className="text-sm sm:text-base md:text-lg leading-relaxed max-w-xl mx-auto font-medium"
            style={{ color: "rgba(226,232,240,0.7)" }}
          >
            Explore advanced AI solutions tailored to accelerate growth for
            businesses like yours.
          </p>
        </div>

        {/* ── Image Slider ── */}
        <div className="relative">

          {/* Left fade */}
          <div
            className="pointer-events-none absolute left-0 top-0 h-full w-20 md:w-32 z-20"
            style={{
              background: "linear-gradient(to right, var(--cyber-black), transparent)",
            }}
          />

          {/* Right fade */}
          <div
            className="pointer-events-none absolute right-0 top-0 h-full w-20 md:w-32 z-20"
            style={{
              background: "linear-gradient(to left, var(--cyber-black), transparent)",
            }}
          />

          {/* Scrolling track */}
          <div className="overflow-hidden rounded-2xl">
            <div className="flex gap-4 animate-scroll">
              {[...postImages, ...postImages].map((image, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedImage(image)}
                  className="shrink-0 w-56 h-64 sm:w-64 sm:h-72 cursor-pointer group relative overflow-hidden rounded-xl"
                  style={{
                    border: "1px solid rgba(253,224,71,0.12)",
                  }}
                >
                  {/* Image */}
                  <Image
                    src={image}
                    width={256}
                    height={288}
                    alt={`Post example ${idx + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Hover overlay */}
                  <div
                    className="absolute inset-0 flex items-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(5,5,5,0.85) 0%, rgba(5,5,5,0.2) 60%, transparent 100%)",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-semibold tracking-[0.15em] uppercase"
                        style={{ color: "#FDE047" }}
                      >
                        View Post
                      </span>
                      <span style={{ color: "#FDE047", fontSize: "12px" }}>↗</span>
                    </div>
                  </div>

                  {/* Corner accent */}
                  <div
                    className="absolute top-0 right-0 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      borderTop: "2px solid #FDE047",
                      borderRight: "2px solid #FDE047",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}