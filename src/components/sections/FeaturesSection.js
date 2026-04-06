"use client";

import Link from "next/link";

export default function FeaturesSection({ features }) {
  if (!features || features.length === 0) return null;

  const [hero, ...rest] = features;

  return (
    <section
      id="features"
      className="relative w-full overflow-hidden py-20 sm:py-24 md:py-32"
      style={{ backgroundColor: "#080808" }}
    >
      {/* ── Left vertical glow line ── */}
      <div
        className="pointer-events-none absolute left-0 top-0 h-full w-px opacity-30"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, #FDE047 30%, #FDE047 70%, transparent 100%)",
        }}
      />

      {/* ── Right vertical glow line ── */}
      <div
        className="pointer-events-none absolute right-0 top-0 h-full w-px opacity-30"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, #FDE047 30%, #FDE047 70%, transparent 100%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">

        {/* ── Header — Left-aligned split layout ── */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-14 sm:mb-20">

          {/* Left: label line + big headline */}
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px w-10" style={{ background: "#FDE047" }} />
              <span
                className="text-[11px] font-semibold tracking-[0.25em] uppercase"
                style={{ color: "#FDE047" }}
              >
                Platform Features
              </span>
            </div>

            <h2
              className="font-normal uppercase leading-[0.88] tracking-tight"
              style={{
                fontFamily: "Anton, Impact, sans-serif",
                color: "var(--pure-white)",
                fontSize: "clamp(2.4rem, 5.5vw, 5rem)",
              }}
            >
              Built to
              <br />
              <span style={{ WebkitTextStroke: "2px #FDE047", color: "transparent" }}>
                dominate.
              </span>
            </h2>
          </div>

          {/* Right: subtext + feature count */}
          <div className="md:max-w-xs md:pb-2">
            <p
              className="text-sm sm:text-base leading-relaxed mb-5"
              style={{ color: "rgba(226,232,240,0.65)" }}
            >
              Everything you need to automate and grow your Google Business
              profile — engineered for speed, scale, and results.
            </p>
            <div className="flex items-center gap-3">
              <span
                className="text-4xl font-black"
                style={{ fontFamily: "Anton, Impact, sans-serif", color: "#FDE047" }}
              >
                {features.length}
              </span>
              <span
                className="text-[11px] font-semibold tracking-[0.15em] uppercase leading-tight"
                style={{ color: "rgba(253,224,71,0.5)" }}
              >
                Core<br />Features
              </span>
            </div>
          </div>
        </div>

        {/* ── HERO FEATURE — Full-width banner ── */}
        {hero && (() => {
          const HeroIcon = hero.icon;
          return (
            <Link href={hero.link} className="block group mb-5 sm:mb-6">
              <div
                className="relative w-full rounded-2xl overflow-hidden flex flex-col sm:flex-row items-start sm:items-center gap-6 p-8 sm:p-10 transition-all duration-500"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(253,224,71,0.08) 0%, rgba(18,18,18,0.9) 60%)",
                  border: "1px solid rgba(253,224,71,0.2)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.border = "1px solid rgba(253,224,71,0.5)";
                  e.currentTarget.style.boxShadow = "0 0 50px rgba(253,224,71,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.border = "1px solid rgba(253,224,71,0.2)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* Ghost "01" watermark */}
                <div
                  className="absolute top-4 right-8 text-[90px] font-black leading-none select-none pointer-events-none"
                  style={{
                    fontFamily: "Anton, Impact, sans-serif",
                    color: "rgba(253,224,71,0.04)",
                  }}
                >
                  01
                </div>

                {/* Large icon */}
                <div
                  className="w-20 h-20 flex-shrink-0 flex items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110"
                  style={{
                    background: "rgba(253,224,71,0.1)",
                    border: "1px solid rgba(253,224,71,0.3)",
                  }}
                >
                  {HeroIcon && <HeroIcon size={36} style={{ color: "#FDE047" }} />}
                </div>

                {/* Title + description */}
                <div className="flex-1 relative z-10">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3
                      className="font-normal uppercase tracking-tight leading-none transition-colors duration-300 group-hover:text-[#FDE047]"
                      style={{
                        fontFamily: "Inter, Impact, sans-serif",
                        color: "var(--pure-white)",
                        fontSize: "clamp(1.4rem, 3vw, 2.2rem)",
                      }}
                    >
                      {hero.title}
                    </h3>
                    <div
                      className="px-2 py-0.5 rounded-md"
                      style={{
                        background: "rgba(253,224,71,0.1)",
                        border: "1px solid rgba(253,224,71,0.2)",
                      }}
                    >
                      <span
                        className="text-[9px] font-bold tracking-[0.2em] uppercase"
                        style={{ color: "#FDE047" }}
                      >
                        Featured
                      </span>
                    </div>
                  </div>
                  <p
                    className="text-sm sm:text-base leading-relaxed max-w-2xl"
                    style={{ color: "rgba(226,232,240,0.65)" }}
                  >
                    {hero.description}
                  </p>
                </div>

                {/* Circle arrow */}
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-[#FDE047]"
                  style={{ border: "1px solid rgba(253,224,71,0.3)" }}
                >
                  <span
                    className="text-sm transition-colors duration-300 group-hover:text-black"
                    style={{ color: "#FDE047" }}
                  >
                    ↗
                  </span>
                </div>
              </div>
            </Link>
          );
        })()}

        {/* ── REST — 3-col grid, row+col hybrid on mobile ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {rest.map((feature, index) => {
            const Icon = feature.icon;
            const num = String(index + 2).padStart(2, "0");

            return (
              <Link href={feature.link} key={index} className="group">
                <div
                  className="relative flex flex-row sm:flex-col gap-4 sm:gap-0 rounded-2xl p-5 sm:p-6 overflow-hidden h-full transition-all duration-500 hover:-translate-y-1"
                  style={{
                    backgroundColor: "rgba(14,14,14,0.8)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.border = "1px solid rgba(253,224,71,0.25)";
                    e.currentTarget.style.backgroundColor = "rgba(18,18,18,0.95)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.border = "1px solid rgba(255,255,255,0.06)";
                    e.currentTarget.style.backgroundColor = "rgba(14,14,14,0.8)";
                  }}
                >
                  {/* Ghost number watermark */}
                  <div
                    className="absolute bottom-2 right-4 text-[56px] font-black leading-none select-none pointer-events-none"
                    style={{
                      fontFamily: "Anton, Impact, sans-serif",
                      color: "rgba(253,224,71,0.03)",
                    }}
                  >
                    {num}
                  </div>

                  {/* Icon + small number (left col on mobile) */}
                  <div className="flex sm:flex-col items-start gap-3 flex-shrink-0">
                    <div
                      className="w-11 h-11 flex items-center justify-center rounded-xl flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                      style={{
                        background: "rgba(253,224,71,0.07)",
                        border: "1px solid rgba(253,224,71,0.15)",
                      }}
                    >
                      {Icon && <Icon size={20} style={{ color: "#FDE047" }} />}
                    </div>
                    <span
                      className="text-[10px] font-bold tracking-[0.15em] mt-0.5 sm:mt-3"
                      style={{ color: "rgba(253,224,71,0.3)" }}
                    >
                      {num}
                    </span>
                  </div>

                  {/* Content (right col on mobile, below on desktop) */}
                  <div className="flex flex-col flex-1 sm:mt-5">
                    <h3
                      className="font-normal uppercase tracking-tight leading-tight mb-2 transition-colors duration-300 group-hover:text-[#FDE047]"
                      style={{
                        fontFamily: "Inter, Impact, sans-serif",
                        color: "var(--pure-white)",
                        fontSize: "clamp(0.95rem, 1.4vw, 1.1rem)",
                      }}
                    >
                      {feature.title}
                    </h3>

                    {/* Animated underline */}
                    <div
                      className="h-px mb-3 w-6 transition-all duration-500 group-hover:w-12"
                      style={{ background: "rgba(253,224,71,0.4)" }}
                    />

                    <p
                      className="text-xs sm:text-sm leading-relaxed grow"
                      style={{ color: "rgba(226,232,240,0.55)" }}
                    >
                      {feature.description}
                    </p>

                    <div className="flex items-center gap-1 mt-4">
                      <span
                        className="text-[10px] font-semibold tracking-[0.15em] uppercase transition-colors duration-300 group-hover:text-[#FDE047]"
                        style={{ color: "rgba(253,224,71,0.35)" }}
                      >
                        Explore
                      </span>
                      <span
                        className="text-[10px] transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#FDE047]"
                        style={{ color: "rgba(253,224,71,0.35)" }}
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