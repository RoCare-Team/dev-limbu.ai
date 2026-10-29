import { Clapperboard, Coins, Timer, Sparkles } from "lucide-react";
import VideoPricingCalculator from "../VideoPricingCalculator";
import {
  VIDEO_MAX_SECONDS,
  VIDEO_MIN_SECONDS,
  VIDEO_PRICING,
  videoCoins,
} from "@/lib/videoPricing";

const lowestPrice = Math.min(
  ...VIDEO_PRICING.map((item) => videoCoins(item.coinsPerSecond, VIDEO_MIN_SECONDS))
);

const HIGHLIGHTS = [
  { icon: Clapperboard, value: VIDEO_PRICING.length, label: "Video styles" },
  { icon: Timer, value: `${VIDEO_MIN_SECONDS}–${VIDEO_MAX_SECONDS}s`, label: "Any length" },
  { icon: Coins, value: lowestPrice, label: "Coins to start" },
];

export default function VideoPricingSection() {
  return (
    <section
      id="video-pricing"
      className="relative w-full overflow-hidden bg-[#07080c] py-16 sm:py-20"
    >
      {/* GLOWS */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-[#facc15]/15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -left-20 h-[360px] w-[360px] rounded-full bg-[#eab308]/10 blur-[100px]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="mb-10 text-center sm:mb-14">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#facc15]/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.25em] text-[#facc15] ring-1 ring-[#facc15]/30">
            <Sparkles size={13} /> AI Video Studio
          </span>

          <h2
            className="mt-5 font-bold uppercase leading-[0.95] tracking-tight text-white"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(1.9rem, 5vw, 3.4rem)",
            }}
          >
            Videos Made With{" "}
            <span className="bg-gradient-to-r from-[#fde047] via-[#facc15] to-[#eab308] bg-clip-text text-transparent">
              Limbu AI
            </span>
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm font-medium text-white/60 sm:text-base">
            Real videos our customers created. Tap any video to watch it, pick your
            length and see the total coins instantly.
          </p>

          <div className="mx-auto mt-8 grid max-w-2xl grid-cols-3 gap-3">
            {HIGHLIGHTS.map(({ icon: Icon, value, label }) => (
              <div
                key={label}
                className="rounded-2xl bg-white/[0.04] px-3 py-3 ring-1 ring-white/10 sm:py-4"
              >
                <Icon size={18} className="mx-auto text-[#facc15]" />
                <div className="mt-1.5 text-lg font-black text-white sm:text-2xl">{value}</div>
                <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/45">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CLIENT PART */}
        <VideoPricingCalculator />
      </div>
    </section>
  );
}
