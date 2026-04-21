"use client";

import Image from "next/image";

export default function ExamplesSection({ postImages = [], setSelectedImage }) {
  return (
    <section
      id="examples"
      className="relative w-full overflow-hidden py-12  border-t border-black/5"
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
        <div className="text-center mb-12 sm:mb-16">
          {/* Label chip */}
          <div
            className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full"
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
              Limbu AI-Powered Output
            </span>
          </div>

          {/* Headline */}
          <h2
            className="font-bold uppercase leading-[0.95] tracking-tight mb-4"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--foreground)",
              fontSize: "clamp(1.75rem, 4.5vw, 3.5rem)",
            }}
          >
            Limbu AI-Generated{" "}
            <span
              style={{
                color: "var(--lemon-hover)",
              }}
            >
              Post Examples
            </span>
          </h2>

          {/* Divider line */}
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
            className="text-sm sm:text-base md:text-lg leading-relaxed max-w-xl mx-auto font-semibold"
            style={{ color: "rgba(15, 23, 42, 0.6)" }}
          >
            Explore advanced AI solutions tailored to accelerate growth for
            businesses like yours.
          </p>
        </div>

        {/* ── Image Slider ── */}
        <div className="relative">
          {/* Scrolling track */}
          <div className="overflow-hidden rounded-2xl">
            <div className="flex gap-4 animate-scroll">
              {[...postImages, ...postImages].map((image, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedImage(image)}
                  className="shrink-0 w-56 h-64 sm:w-64 sm:h-72 cursor-pointer group relative overflow-hidden rounded-xl bg-slate-50 shadow-sm"
                  style={{
                    border: "1px solid rgba(15, 23, 42, 0.05)",
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
                    className="absolute inset-0 flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(15,23,42,0.8) 0%, rgba(15,23,42,0.1) 60%, transparent 100%)",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-bold tracking-[0.15em] uppercase"
                        style={{ color: "#ffffff" }}
                      >
                        View Post
                      </span>
                      <span style={{ color: "#ffffff", fontSize: "12px" }}>
                        ↗
                      </span>
                    </div>
                  </div>

                  {/* Corner accent */}
                  <div
                    className="absolute top-0 right-0 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      borderTop: "2px solid var(--lemon-hover)",
                      borderRight: "2px solid var(--lemon-hover)",
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
