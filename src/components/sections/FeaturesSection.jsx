"use client";

import Link from "next/link";

export default function FeaturesSection({ features }) {
  if (!features || features.length === 0) return null;

  return (
    <section
      id="features"
      className="relative w-full overflow-hidden py-12 border-t border-black/5"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* ── Left vertical glow line ── */}
      <div
        className="pointer-events-none absolute left-0 top-0 h-full w-px opacity-20"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, var(--lemon-hover) 30%, var(--lemon-hover) 70%, transparent 100%)",
        }}
      />

      {/* ── Right vertical glow line ── */}
      <div
        className="pointer-events-none absolute right-0 top-0 h-full w-px opacity-20"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, var(--lemon-hover) 30%, var(--lemon-hover) 70%, transparent 100%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">

        {/* ── Header — Left-aligned split layout ── */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-12 sm:mb-16">

          {/* Left: label line + big headline */}
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px w-10" style={{ background: "var(--lemon-hover)" }} />
              <span
                className="text-[11px] font-bold tracking-[0.25em] uppercase"
                style={{ color: "var(--lemon-hover)" }}
              >
                Platform Features
              </span>
            </div>

            <h2
              className="font-bold uppercase leading-[0.9] tracking-tight"
              style={{
                fontFamily: "var(--font-heading)",
                color: "var(--foreground)",
                fontSize: "clamp(2rem, 5vw, 4rem)",
              }}
            >
              Built to
              <br />
              <span style={{ color: "var(--lemon-hover)" }}>
                dominate.
              </span>
            </h2>
          </div>

          {/* Right: subtext + feature count */}
          <div className="md:max-w-xs md:pb-2">
            <p
              className="text-sm sm:text-base leading-relaxed mb-5 font-semibold"
              style={{ color: "rgba(15, 23, 42, 0.6)" }}
            >
              Everything you need to automate and grow your Google Business
              profile — engineered for speed, scale, and results.
            </p>
            <div className="flex items-center gap-3">
              <span
                className="text-4xl font-black"
                style={{ fontFamily: "var(--font-heading)", color: "var(--lemon-hover)" }}
              >
                {features.length}
              </span>
              <span
                className="text-[11px] font-bold tracking-[0.15em] uppercase leading-tight"
                style={{ color: "rgba(15, 23, 42, 0.4)" }}
              >
                Core<br />Features
              </span>
            </div>
          </div>
        </div>

        {/* ── Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const num = String(index + 1).padStart(2, "0");

            return (
              <Link href={feature.link} key={index} className="group">
                <div
                  className="relative flex flex-row sm:flex-col gap-4 sm:gap-0 rounded-2xl p-5 sm:p-6 overflow-hidden h-full transition-all duration-500 hover:-translate-y-1 bg-white border border-slate-100 shadow-sm"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(250, 204, 21, 0.3)";
                    e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.03)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(15, 23, 42, 0.05)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {/* Ghost number watermark */}
                  <div
                    className="absolute bottom-2 right-4 text-[56px] font-black leading-none select-none pointer-events-none"
                    style={{
                      fontFamily: "var(--font-heading)",
                      color: "rgba(15, 23, 42, 0.02)",
                    }}
                  >
                    {num}
                  </div>

                  {/* Icon + small number */}
                  <div className="flex sm:flex-col items-start gap-3 flex-shrink-0">
                    <div
                      className="w-11 h-11 flex items-center justify-center rounded-xl flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                      style={{
                        background: "rgba(250, 204, 21, 0.1)",
                        border: "1px solid rgba(250, 204, 21, 0.2)",
                      }}
                    >
                      {Icon && <Icon size={20} style={{ color: "var(--lemon-hover)" }} />}
                    </div>
                    <span
                      className="text-[10px] font-bold tracking-[0.15em] mt-0.5 sm:mt-3"
                      style={{ color: "rgba(15, 23, 42, 0.2)" }}
                    >
                      {num}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex flex-col flex-1 sm:mt-5">
                    <h3
                      className="font-bold uppercase tracking-tight leading-tight mb-2 transition-colors duration-300 group-hover:text-black"
                      style={{
                        fontFamily: "var(--font-heading)",
                        color: "var(--foreground)",
                        fontSize: "clamp(0.95rem, 1.4vw, 1.1rem)",
                      }}
                    >
                      {feature.title}
                    </h3>

                    {/* Animated underline */}
                    <div
                      className="h-px mb-3 w-6 transition-all duration-500 group-hover:w-12"
                      style={{ background: "rgba(250, 204, 21, 0.4)" }}
                    />

                    <p
                      className="text-xs sm:text-sm leading-relaxed grow font-semibold"
                      style={{ color: "rgba(15, 23, 42, 0.5)" }}
                    >
                      {feature.description}
                    </p>

                    <div className="flex items-center gap-1 mt-4">
                      <span
                        className="text-[10px] font-bold tracking-[0.15em] uppercase transition-colors duration-300 group-hover:text-black"
                        style={{ color: "rgba(15, 23, 42, 0.3)" }}
                      >
                        Explore
                      </span>
                      <span
                        className="text-[10px] transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        style={{ color: "rgba(15, 23, 42, 0.3)" }}
                      >
                        ↗
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}