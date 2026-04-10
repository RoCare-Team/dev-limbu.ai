import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/stores/useAuthStore";

const clientLogos = [
  { name: "Anup Gupta", src: "/images/clients/anup_gupta_ai.png" },
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

  const [platformIndex, setPlatformIndex] = useState(0);
  const platforms = ["GMB", "Facebook", "Instagram"];

  useEffect(() => {
    const interval = setInterval(() => {
      setPlatformIndex((prev) => (prev + 1) % platforms.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      className="relative w-full h-dvh overflow-hidden flex flex-col"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* ── LAYER 0: Video Background ── */}
      <video
        className="absolute inset-0 w-full h-full object-cover z-0"
        src="https://limbuai.s3.ap-south-1.amazonaws.com/WhatsApp+Video+2026-04-10+at+12.13.30+PM.mp4"
        autoPlay
        loop
        muted
        playsInline
      />

      {/* ── LAYER 1: Subtle Overlay ── */}
      <div className="absolute inset-0 bg-black/30 z-[1]" />

      {/* ── Webinar CTA Badge (top-right) ── */}
      <Link
        href="/webinar-demo"
        className="absolute top-[80px] md:top-[90px] right-5 md:right-8 z-20 flex items-center gap-2 px-3 py-2 rounded-xl group"
        style={{
          background: "rgba(0, 0, 0, 0.3)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <span className="w-2 h-2 rounded-full bg-[#eab308] animate-pulse" />
        <div className="flex flex-col leading-tight">
          <span className="text-[10px] font-bold whitespace-nowrap text-white">
            Free AI Webinar
          </span>
          <span className="text-[9px] font-medium text-white/60">
            🔥 128 joined in last 1 hr
          </span>
        </div>
        <span className="text-xs transition-transform duration-200 group-hover:-translate-y-1 group-hover:translate-x-1 text-[#eab308]">
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
              background: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <span style={{ color: "var(--lemon-hover)", fontSize: "14px" }}>
              ★
            </span>
            <span className="text-[11px] sm:text-xs font-bold text-white">
              4.8 on Capterra
            </span>
            <span className="text-[11px] sm:text-xs font-medium text-white/60">
              · 706 reviews
            </span>
          </div>
        </div>

        {/* Headline */}
        <div className="max-w-4xl">
          <h1
            className="font-bold uppercase leading-[0.92] tracking-tight"
            style={{
              fontFamily: "var(--font-heading)",
              color: "#ffffff",
              fontSize: "clamp(1.8rem, 5vw, 3.8rem)",
            }}
          >
            One Platform. <br />
            All Your <span className="text-lemon-hover">AI Marketing.</span>
          </h1>

          {/* Dynamic Small Text Switcher */}
          <div className="flex items-center gap-3 mt-4 overflow-hidden h-10">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.25em] text-white/60">
              Optimized for
            </span>
            <span
              key={platformIndex}
              className="text-lg sm:text-xl font-black uppercase tracking-widest text-lemon-hover animate-in slide-in-from-bottom-full duration-500"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {platforms[platformIndex]}
            </span>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-4 mt-10">
            {isLoggedIn ? (
              <Link href="/dashboard" className="btn-lemon btn-md">
                Go to Dashboard
              </Link>
            ) : (
              <Link href="/login" className="btn-lemon btn-md">
                Start Today Get 500 Coin
              </Link>
            )}
            <button
              className="btn-ghost py-3.5 btn-sm sm:btn-md group text-white border-white/20 hover:bg-white/10"
              onClick={() => setSelectedVideo("https://youtu.be/eQUd6u36w3g?si=_AJ3OymZQD6HnXRl")}
            >
              Watch Demo
              <span className="ml-2 inline-block transition-transform duration-200 group-hover:translate-x-1">
                →
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ── LAYER 4: Logo Slider ── */}
      <div className="relative z-10 w-full py-3 sm:py-4 overflow-hidden shrink-0 border-t border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="overflow-hidden">
          <div className="animate-scroll flex items-center w-max">
            {[...clientLogos, ...clientLogos].map((client, i) => (
              <div
                key={i}
                className="shrink-0 flex items-center px-8 sm:px-12 opacity-90 hover:opacity-100 transition-all duration-500"
              >
                <div className="relative h-10 sm:h-12 w-32 sm:w-44">
                  <Image
                    src={client.src}
                    alt={client.name}
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="ml-8 sm:ml-12 text-2xl text-white/10">·</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
