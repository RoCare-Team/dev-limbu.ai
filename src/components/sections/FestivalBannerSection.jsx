"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock, Sparkles, X } from "lucide-react";

/**
 * FESTIVAL BANNER
 *
 * Landing page ke top par festival creative — moti rassi se latka hua banner,
 * "Special Offer" tag, offer khatam hone ka live countdown, aur open hote hi
 * poore banner par sparkle burst.
 *
 * - Sirf apni date window ke andar dikhta hai, baad me khud gayab ho jata hai.
 * - User dismiss kare to localStorage me yaad rakhta hai (per festival key).
 * - Navbar fixed hai, isliye spacer hamesha render hota hai — banner dikhe
 *   ya na dikhe, hero ka spacing same rehta hai.
 *
 * Agla tyohaar add karne ke liye bas is object ko badal dein.
 */
const FESTIVAL = {
  key: "raksha-bandhan-2026",
  name: "Raksha Bandhan",
  image: "/images/rakshabandan-banner.jpeg",
  alt: "Happy Raksha Bandhan from Limbu.ai — celebrating the bond of love, trust and endless support",
  width: 1600,
  height: 678,
  // dono dates inclusive (YYYY-MM-DD)
  showFrom: "2026-08-24",
  showUntil: "2026-08-30",
  offer: {
    tag: "Special Offer",
    sub: "Rakhi special",
    href: "/pricing",
  },
};

/** Offer showUntil wale din raat 11:59:59 par khatam. */
const OFFER_ENDS_AT = `${FESTIVAL.showUntil}T23:59:59`;

/** Sparkle burst ke particles — deterministic, taaki render stable rahe. */
const SPARK_COLORS = ["#fbbf24", "#fde68a", "#f59e0b", "#ffffff", "#fcd34d"];

const makeSparks = (count, seed) =>
  Array.from({ length: count }, (_, i) => ({
    id: `${seed}-${i}`,
    angle: (i / count) * 360 + ((i * seed) % 13),
    distance: 55 + ((i * 37 + seed * 13) % 130),
    delay: ((i * 53 + seed * 29) % 70) / 100,
    size: 3 + ((i * 17 + seed) % 7),
    color: SPARK_COLORS[(i + seed) % SPARK_COLORS.length],
  }));

/**
 * Burst origins — poore banner par phaile hue, taaki ek saath har taraf se
 * sparks nikle. Ye sirf ek baar chalte hain (loop nahi).
 */
const BURSTS = [
  { left: "10%", top: "24%", sparks: makeSparks(12, 1) },
  { left: "27%", top: "68%", sparks: makeSparks(12, 2) },
  { left: "38%", top: "18%", sparks: makeSparks(12, 3) },
  { left: "50%", top: "50%", sparks: makeSparks(16, 4) },
  { left: "62%", top: "78%", sparks: makeSparks(12, 5) },
  { left: "73%", top: "26%", sparks: makeSparks(12, 6) },
  { left: "88%", top: "62%", sparks: makeSparks(12, 7) },
  { left: "18%", top: "88%", sparks: makeSparks(10, 8) },
  { left: "94%", top: "16%", sparks: makeSparks(10, 9) },
];

function isWithinFestivalWindow() {
  const today = new Date();
  const ymd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(today.getDate()).padStart(2, "0")}`;

  return ymd >= FESTIVAL.showFrom && ymd <= FESTIVAL.showUntil;
}

/** Offer khatam hone tak ka bacha hua time. Khatam ho gaya to null. */
function getRemaining() {
  const diff = new Date(OFFER_ENDS_AT).getTime() - Date.now();
  if (!Number.isFinite(diff) || diff <= 0) return null;

  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor(diff / 3600000) % 24,
    m: Math.floor(diff / 60000) % 60,
    s: Math.floor(diff / 1000) % 60,
  };
}

const pad = (n) => String(n).padStart(2, "0");

export default function FestivalBannerSection() {
  // Server par hamesha hidden — date/localStorage client par hi check hota hai,
  // warna hydration mismatch aata hai.
  const [show, setShow] = useState(false);
  const [burst, setBurst] = useState(false);
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    if (!isWithinFestivalWindow()) return;

    try {
      if (localStorage.getItem(`festival-dismissed:${FESTIVAL.key}`)) return;
    } catch {
      /* storage blocked — banner dikha dete hain */
    }

    setShow(true);
    setBurst(true);
    setRemaining(getRemaining());

    // Sparks ek baar chalte hain — animation ke baad DOM se hata dete hain.
    const burstTimer = setTimeout(() => setBurst(false), 2600);

    // Countdown har second update hota hai.
    const tick = setInterval(() => setRemaining(getRemaining()), 1000);

    return () => {
      clearTimeout(burstTimer);
      clearInterval(tick);
    };
  }, []);

  const dismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(`festival-dismissed:${FESTIVAL.key}`, "1");
    } catch {
      /* storage blocked — is session ke liye hide ho gaya, kaafi hai */
    }
  };

  if (!show) {
    // Fixed navbar ke liye jagah — banner na dikhe tab bhi spacing stable rahe.
    return <div className="h-20 lg:h-28" aria-hidden="true" />;
  }

  return (
    <>
      <div className="h-20 lg:h-28" aria-hidden="true" />

      <section
        className="w-full px-4 sm:px-6 lg:px-8 pb-10 sm:pb-12"
        aria-label={`${FESTIVAL.name} greetings`}
      >
        <div className="fb-hang max-w-5xl mx-auto">
          {/* ---------- MOTI RASSI (dono taraf latakti hui) ---------- */}
          <div
            className="relative z-30 flex items-stretch justify-between px-[11%] sm:px-[13%] h-12 sm:h-16 -mb-2"
            aria-hidden="true"
          >
            {["left", "right"].map((side) => (
              <div key={side} className="relative w-3 sm:w-[15px]">
                <span className="fb-rope" />
                <span className="fb-knot" />
              </div>
            ))}
          </div>

          {/* ---------- BANNER ---------- */}
          <div className="relative">
            <div className="relative rounded-2xl sm:rounded-3xl p-[2px] bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 shadow-[0_18px_50px_-12px_rgba(234,179,8,0.6)]">
              <div className="relative rounded-[14px] sm:rounded-[22px] overflow-hidden bg-slate-950">
                <Image
                  src={FESTIVAL.image}
                  alt={FESTIVAL.alt}
                  width={FESTIVAL.width}
                  height={FESTIVAL.height}
                  priority
                  sizes="(max-width: 1024px) 100vw, 1024px"
                  className="w-full h-auto block"
                />

                {/* chamak — ek baar left se right sweep */}
                <span className="fb-shine" aria-hidden="true" />

                <button
                  type="button"
                  onClick={dismiss}
                  aria-label={`Close ${FESTIVAL.name} banner`}
                  className="absolute top-2 right-2 sm:top-3 sm:right-3 z-30 p-1.5 sm:p-2 rounded-full bg-black/45 text-white/90 backdrop-blur-sm hover:bg-black/70 hover:text-white transition focus:outline-none focus:ring-2 focus:ring-amber-300"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* ---------- SPECIAL OFFER TAG ---------- */}
            <Link
              href={FESTIVAL.offer.href}
              className="fb-tag absolute -bottom-4 -left-2 sm:-bottom-5 sm:-left-4 z-40 group"
            >
              <span className="flex items-center gap-2 rounded-xl sm:rounded-2xl px-3.5 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-br from-rose-600 via-red-600 to-orange-500 text-white shadow-[0_10px_28px_-8px_rgba(220,38,38,0.85)] ring-2 ring-white/80">
                <Sparkles size={16} className="shrink-0 text-amber-200" />
                <span className="leading-tight text-left">
                  <span className="block text-sm sm:text-base font-black uppercase tracking-wide">
                    {FESTIVAL.offer.tag}
                  </span>
                  <span className="hidden sm:block text-[10px] font-semibold text-white/80">
                    {FESTIVAL.offer.sub}
                  </span>
                </span>
                <span className="ml-0.5 text-sm font-black transition-transform duration-200 group-hover:translate-x-0.5">
                  →
                </span>
              </span>
            </Link>

            {/* ---------- SPARKLE BURST (sirf ek baar) ---------- */}
            {burst && (
              <div
                className="pointer-events-none absolute inset-0 z-20 overflow-visible"
                aria-hidden="true"
              >
                {BURSTS.map((b) => (
                  <div
                    key={`${b.left}-${b.top}`}
                    className="absolute"
                    style={{ left: b.left, top: b.top }}
                  >
                    {b.sparks.map((s) => (
                      <span
                        key={s.id}
                        className="fb-spark"
                        style={{
                          "--a": `${s.angle}deg`,
                          "--d": `${s.distance}px`,
                          width: s.size,
                          height: s.size,
                          background: s.color,
                          boxShadow: `0 0 ${s.size * 2.5}px ${s.color}`,
                          animationDelay: `${s.delay}s`,
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ---------- COUNTDOWN — 30 Aug tak ---------- */}
          {/* Mobile par tag ke neeche, desktop par banner ke bottom edge par */}
          {remaining && (
            <div className="relative z-30 flex justify-center mt-7 sm:-mt-6">
              <div className="flex items-center gap-2.5 rounded-full bg-slate-950 ring-2 ring-amber-400/90 px-4 py-2 sm:px-5 sm:py-2.5 shadow-[0_12px_30px_-10px_rgba(0,0,0,0.9)]">
                <Clock size={15} className="text-amber-300 shrink-0" />
                <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-[0.16em] text-amber-200/90">
                  Offer ends in
                </span>
                <span className="flex items-center gap-1 font-mono text-xs sm:text-sm font-black text-white tabular-nums">
                  <span>{pad(remaining.d)}d</span>
                  <span className="text-amber-400/70">:</span>
                  <span>{pad(remaining.h)}h</span>
                  <span className="text-amber-400/70">:</span>
                  <span>{pad(remaining.m)}m</span>
                  <span className="text-amber-400/70">:</span>
                  <span className="text-amber-300">{pad(remaining.s)}s</span>
                </span>
              </div>
            </div>
          )}
        </div>

        <style jsx>{`
          /* poora banner rassi se latka hua — halka sa jhoolta hai */
          .fb-hang {
            transform-origin: top center;
            animation:
              fb-drop 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) both,
              fb-swing 6s ease-in-out 0.9s infinite;
          }

          @keyframes fb-drop {
            0% {
              transform: translateY(-42px) rotate(-2.5deg);
              opacity: 0;
            }
            60% {
              opacity: 1;
            }
            100% {
              transform: translateY(0) rotate(0deg);
              opacity: 1;
            }
          }

          @keyframes fb-swing {
            0%,
            100% {
              transform: rotate(-0.55deg);
            }
            50% {
              transform: rotate(0.55deg);
            }
          }

          /* ---------- BATI HUI (braided) RASSI ---------- */
          .fb-rope {
            position: absolute;
            inset: 0;
            border-radius: 4px;
            background-image:
              /* cylinder shading — rassi gol dikhe */
              linear-gradient(
                90deg,
                rgba(0, 0, 0, 0.55) 0%,
                rgba(0, 0, 0, 0.12) 22%,
                rgba(255, 255, 255, 0.45) 44%,
                rgba(255, 255, 255, 0.1) 62%,
                rgba(0, 0, 0, 0.2) 80%,
                rgba(0, 0, 0, 0.6) 100%
              ),
              /* balo ki tarah bati hui strands */
                repeating-linear-gradient(
                  118deg,
                  #8a5518 0px,
                  #c98b3a 4px,
                  #e8bd76 7px,
                  #c98b3a 10px,
                  #8a5518 13px
                );
            box-shadow:
              0 0 0 1px rgba(69, 39, 12, 0.5),
              0 6px 14px -6px rgba(0, 0, 0, 0.7);
          }

          /* rassi ke neeche ki gaanth */
          .fb-knot {
            position: absolute;
            left: 50%;
            bottom: -9px;
            transform: translateX(-50%);
            width: 30px;
            height: 21px;
            border-radius: 999px;
            background-image:
              linear-gradient(
                180deg,
                rgba(255, 255, 255, 0.4) 0%,
                rgba(0, 0, 0, 0.05) 45%,
                rgba(0, 0, 0, 0.5) 100%
              ),
              repeating-linear-gradient(
                62deg,
                #8a5518 0px,
                #c98b3a 5px,
                #e8bd76 8px,
                #c98b3a 11px,
                #8a5518 15px
              );
            box-shadow:
              0 0 0 1px rgba(69, 39, 12, 0.55),
              0 8px 16px -6px rgba(0, 0, 0, 0.8);
          }

          @media (min-width: 640px) {
            .fb-knot {
              width: 38px;
              height: 26px;
              bottom: -11px;
            }
          }

          /* sparkle burst — banner khulte hi bahar ki taraf, sirf ek baar */
          .fb-spark {
            position: absolute;
            left: 0;
            top: 0;
            border-radius: 9999px;
            opacity: 0;
            animation: fb-burst 1.5s ease-out both;
          }

          @keyframes fb-burst {
            0% {
              transform: rotate(var(--a)) translateY(0) scale(0.2);
              opacity: 0;
            }
            12% {
              opacity: 1;
            }
            100% {
              transform: rotate(var(--a)) translateY(calc(var(--d) * -1))
                scale(0.25);
              opacity: 0;
            }
          }

          /* ek baar chalne wali chamak */
          .fb-shine {
            position: absolute;
            inset: 0;
            z-index: 10;
            pointer-events: none;
            background: linear-gradient(
              105deg,
              transparent 38%,
              rgba(255, 255, 255, 0.32) 48%,
              transparent 58%
            );
            transform: translateX(-120%);
            animation: fb-shine 1.5s ease-out 0.7s 1 both;
          }

          @keyframes fb-shine {
            to {
              transform: translateX(120%);
            }
          }

          /* offer tag ka entry pop */
          .fb-tag {
            animation: fb-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.55s both;
          }

          @keyframes fb-pop {
            0% {
              transform: scale(0.4) rotate(-14deg);
              opacity: 0;
            }
            100% {
              transform: scale(1) rotate(-6deg);
              opacity: 1;
            }
          }

          /* motion kam pasand karne walon ke liye sab shaant */
          @media (prefers-reduced-motion: reduce) {
            .fb-hang,
            .fb-spark,
            .fb-shine,
            .fb-tag {
              animation: none !important;
            }
            .fb-spark {
              display: none;
            }
            .fb-tag {
              transform: rotate(-6deg);
            }
          }
        `}</style>
      </section>
    </>
  );
}
