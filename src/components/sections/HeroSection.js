"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/stores/useAuthStore";



const clientLogos = [
  { name: "Anup Gupta", src: "/images/clients/anup_gupta.png" },
  { name: "Ro-Care India", src: "/images/clients/ro-care-india.webp" },
  { name: "Dynamic Drapry", src: "/images/clients/dynamic_drapry.png" },
  { name: "Mannubhai", src: "/images/clients/mannubhai.webp" },
  { name: "Banjara Salon", src: "/images/clients/banjara_salon.png" },
  { name: "Mazz", src: "/images/clients/mazz.png" },
  { name: "Gudiya Collection", src: "/images/clients/gudiya_collection.png" },
  { name: "Lucky Dry", src: "/images/clients/lucky_dry.jpg" },
];

export default function HeroSection() {
  const setSelectedVideo = useAuthStore((state) => state.setSelectedVideo);

  const { isLoggedIn } = useAuthStore();
  return (
    <section
      className="relative w-full h-dvh overflow-hidden flex flex-col"
      style={{ backgroundColor: "var(--cyber-black)" }}
    >
      {/* ── LAYER 0: Video Background ── */}
      <video
        className="absolute inset-0 w-full h-full object-cover opacity-85 z-0"
        src="/videos/hero-bg.mp4"
        autoPlay
        loop
        muted
        playsInline
      />

      {/* ── LAYER 1: Top dark fade (for Navbar readability) ── */}
      <div className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-b from-black/20 to-transparent" />

      {/* ── LAYER 1: Left dark fade (headline pop) ── */}
      <div className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-r from-black/40 via-transparent to-transparent" />

      {/* ── LAYER 1: Bottom fade — merges seamlessly into next section ── */}
      <div className="absolute bottom-0 left-0 right-0 h-[60%] z-[1] pointer-events-none bg-gradient-to-t from-[#050505] via-[#050505]/70 to-transparent" />

      {/* ── Webinar CTA Badge (top-right) ── */}
      <Link
        href="/webinar-demo"
        className="absolute top-[80px] md:top-[90px] right-5 md:right-8 z-20 flex items-center gap-2 px-3 py-2 rounded-xl group"
        style={{
          background: "rgba(18,18,18,0.45)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(253,224,71,0.18)",
        }}
      >
        {/* Live pulse dot */}
        <span className="w-2 h-2 rounded-full bg-[#FDE047] animate-pulse" />

        {/* Text block */}
        <div className="flex flex-col leading-tight">
          <span
            className="text-[10px] font-semibold whitespace-nowrap"
            style={{ color: "var(--pure-white)" }}
          >
            Free AI Webinar
          </span>
          <span className="text-[9px]" style={{ color: "var(--tech-gray)" }}>
            🔥 128 joined in last 1 hr
          </span>
        </div>

        {/* Arrow */}
        <span
          className="text-xs transition-transform duration-200 group-hover:-translate-y-1 group-hover:translate-x-1"
          style={{ color: "#FDE047" }}
        >
          ↗
        </span>
      </Link>

      {/* ── LAYER 3: Main Hero Body ── */}
      <div className="relative z-10 flex flex-col justify-center flex-1 px-6 md:px-10 pt-[90px] md:pt-[100px] pb-4">
        {/* Rating Badge */}
        <div className="mb-4 sm:mb-6">
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 sm:px-4 sm:py-2"
            style={{
              background: "rgba(253,224,71,0.06)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(253,224,71,0.18)",
            }}
          >
            <span style={{ color: "var(--lemon-glow)", fontSize: "14px" }}>
              ★
            </span>
            <span
              className="text-[11px] sm:text-xs font-semibold"
              style={{ color: "var(--tech-silver)" }}
            >
              4.8 on Capterra
            </span>
            <span
              className="text-[11px] sm:text-xs"
              style={{ color: "var(--tech-gray)" }}
            >
              · 706 reviews
            </span>
          </div>
        </div>

        {/* Headline + Description — two-column on large screens */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 lg:gap-12 max-w-[1400px]">
          {/* LEFT — Headline + Buttons */}
          <div className="flex flex-col">
            <h1
              className=" font-normal uppercase leading-[0.92] tracking-tight"
              style={{
                fontFamily: "Anton, Impact, sans-serif",
                color: "var(--pure-white)",
                marginBottom: "4px",
                fontSize: "clamp(2.4rem, 5.5vw, 5.5rem)",
              }}
            >
              Make your brand
            </h1>
            <h1
              className="font-normal uppercase leading-[0.92] tracking-tight hero-outline"
              style={{
                fontFamily: "Anton, Impact, sans-serif",
                fontSize: "clamp(2.4rem, 5.5vw, 5.5rem)",
              }}
            >
              extraordinary.
            </h1>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 mt-6 sm:mt-8 mb-3">
              {
                isLoggedIn ? (
                  <Link href="/dashboard" className="btn-lemon btn-md">
                    Go to Dashboard
                  </Link>
                ) : (
                  <Link href="/login" className="btn-lemon btn-md">
                    Start Today Get 500 Coin
                  </Link>
                )
              }
              <button
                className="btn-ghost btn-sm sm:btn-md group py-3.5"
                onClick={() => setSelectedVideo("https://youtu.be/eQUd6u36w3g?si=_AJ3OymZQD6HnXRl")}
              >
                Watch Demo
                <span className="ml-2 inline-block transition-transform duration-200 group-hover:translate-x-1">
                  →
                </span>
              </button>
            </div>
          </div>

          {/* RIGHT — Description */}
          <div className="lg:max-w-[320px] lg:pb-2 shrink-0">
            <div className="circuit-line mb-3 hidden lg:block" />
            <p
              className="text-sm sm:text-base leading-relaxed font-medium"
              style={{ color: "rgba(226,232,240,0.85)" }}
            >
              The AI marketing platform with taste, power, and speed — turning
              strategy into content and insights into growth.
            </p>
          </div>
        </div>
      </div>

      {/* ── LAYER 4: Image-Based Client Logo Slider ── */}
      <div className="relative z-10 w-full py-3 sm:py-4 overflow-hidden shrink-0">
        {/* Left fade */}
        <div className="pointer-events-none absolute left-0 top-0 h-full w-20 md:w-28 z-20 bg-gradient-to-r from-[#050505] to-transparent" />

        {/* Right fade */}
        <div className="pointer-events-none absolute right-0 top-0 h-full w-20 md:w-28 z-20 bg-gradient-to-l from-[#050505] to-transparent" />

        <div className="animate-scroll flex items-center">
          {[...clientLogos, ...clientLogos].map((client, i) => (
            <div
              key={i}
              className="flex-shrink-0 flex items-center px-6 sm:px-10 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
            >
              <Image
                src={client.src}
                alt={client.name}
                width={120}
                height={40}
                className="h-8 w-auto object-contain brightness-200"
              />
              <span
                className="ml-6 sm:ml-10 text-lg"
                style={{ color: "rgba(253,224,71,0.2)" }}
              >
                ·
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
