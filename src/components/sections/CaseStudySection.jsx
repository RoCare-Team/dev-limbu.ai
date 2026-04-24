"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { TrendingUp, Star, Quote } from "lucide-react";

const caseStudies = [
  {
    id: 1,
    clientName: "Manoj Gupta",
    clientRole: "Founder, Ro-Care India",
    clientImage:
      "https://img.freepik.coim/free-photo/portrait-successful-young-businessman-suit-glasses-leaning-railing-modern-office-building_1262-15424.jpg",
    quote:
      "Limbu AI transformed how we handle our digital presence. We've seen a massive surge in local walk-ins since automating our GMB and social media.",
    avgGrowth: "+179%",
    growthData: [
      { name: "GMB", growth: 185, color: "#facc15" },
      { name: "Facebook", growth: 142, color: "#3b82f6" },
      { name: "Instagram", growth: 210, color: "#ec4899" },
    ],
  },
  {
    id: 2,
    clientName: "Priya Sharma",
    clientRole: "Owner, Banjara Salon",
    clientImage:
      "https://img.freepik.com/free-photo/beautiful-woman-gets-haircut-hairdresser_23-2148835154.jpg",
    quote:
      "Managing reviews and posting updates used to take hours. Now it's on autopilot. Our online bookings have doubled in just 3 months.",
    avgGrowth: "+215%",
    growthData: [
      { name: "GMB", growth: 240, color: "#facc15" },
      { name: "Facebook", growth: 180, color: "#3b82f6" },
      { name: "Instagram", growth: 225, color: "#ec4899" },
    ],
  },
  {
    id: 3,
    clientName: "Rahul Verma",
    clientRole: "Director, Dynamic Drapry",
    clientImage:
      "https://img.freepik.com/free-photo/young-indian-businessman-office_23-2149408985.jpg",
    quote:
      "The multi-location dashboard is a game changer. We manage all 5 of our store locations from one place with perfectly synchronized content.",
    avgGrowth: "+145%",
    growthData: [
      { name: "GMB", growth: 160, color: "#facc15" },
      { name: "Facebook", growth: 120, color: "#3b82f6" },
      { name: "Instagram", growth: 155, color: "#ec4899" },
    ],
  },
];

// Clone track: [clone-of-last, real-0, real-1, real-2, clone-of-first]
const CLONE_ITEMS = [
  { ...caseStudies[caseStudies.length - 1], _key: "clone-last" },
  ...caseStudies.map((s) => ({ ...s, _key: `real-${s.id}` })),
  { ...caseStudies[0], _key: "clone-first" },
];

const REAL_OFFSET = 1; // real cards start at index 1
const LAST_CLONE_IDX = CLONE_ITEMS.length - 1;
const GAP = 24;

// ─── Mini Bar Chart ───────────────────────────────────────────────────────────
const BarChart = ({ data }) => {
  const maxVal = Math.max(...data.map((d) => d.growth));
  return (
    <div className="flex items-end gap-4 h-36 w-full">
      {data.map((item, i) => {
        const heightPct = Math.round((item.growth / maxVal) * 100);
        return (
          <div
            key={i}
            className="flex flex-col items-center gap-1.5 flex-1 h-full"
          >
            <div className="flex-1 flex items-end w-full">
              <div
                className="w-full rounded-t-lg rounded-b-md"
                style={{ height: `${heightPct}%`, backgroundColor: item.color }}
              />
            </div>
            <span className="text-xs font-bold text-slate-800">
              +{item.growth}%
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              {item.name}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const CaseStudySection = () => {
  const trackRef = useRef(null);
  const timerRef = useRef(null);
  const pausedRef = useRef(false);
  const isTransitioningRef = useRef(false);

  // FIX: Use STATE (not just ref) for trackIdx so cards re-render with correct active styles
  const trackIdxRef = useRef(REAL_OFFSET);
  const [activeTrackIdx, setActiveTrackIdx] = useState(REAL_OFFSET);
  const [dotIndex, setDotIndex] = useState(0);

  // FIX: track whether we've mounted + measured DOM
  const [ready, setReady] = useState(false);

  // ── Set position on the DOM track element ──────────────────────────────────
  const setTrackPosition = useCallback((idx, animate) => {
    const track = trackRef.current;
    if (!track) return;

    const cards = track.querySelectorAll("[data-card]");
    if (!cards.length) return;

    const cardWidth = cards[0].offsetWidth;
    const containerWidth =
      track.parentElement?.offsetWidth ?? window.innerWidth;
    const offset = (cardWidth + GAP) * idx - (containerWidth - cardWidth) / 2;

    track.style.transition = animate
      ? "transform 0.72s cubic-bezier(0.77, 0, 0.175, 1)"
      : "none";
    track.style.transform = `translateX(-${Math.max(0, offset)}px)`;
  }, []);

  // ── Core navigation ────────────────────────────────────────────────────────
  const goTo = useCallback(
    (idx, animate = true) => {
      trackIdxRef.current = idx;
      // FIX: sync state so JSX re-renders active card highlight
      setActiveTrackIdx(idx);

      const realIdx =
        (idx - REAL_OFFSET + caseStudies.length) % caseStudies.length;
      setDotIndex(realIdx);

      setTrackPosition(idx, animate);
    },
    [setTrackPosition],
  );

  // ── Teleport from clone → real after animated transition ──────────────────
  const onTransitionEnd = useCallback(() => {
    isTransitioningRef.current = false;
    const idx = trackIdxRef.current;
    if (idx === LAST_CLONE_IDX) {
      goTo(REAL_OFFSET, false);
    } else if (idx === 0) {
      goTo(caseStudies.length, false);
    }
  }, [goTo]);

  const next = useCallback(() => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    goTo(trackIdxRef.current + 1, true);
  }, [goTo]);

  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (!pausedRef.current) next();
    }, 3200);
  }, [next]);

  // ── Mount: wait one frame for DOM to paint, then position + start ─────────
  useEffect(() => {
    // rAF ensures cards have rendered and have measurable offsetWidth
    const raf = requestAnimationFrame(() => {
      goTo(REAL_OFFSET, false);
      setReady(true); // reveal the carousel
      startTimer();
    });

    const track = trackRef.current;
    track?.addEventListener("transitionend", onTransitionEnd);

    const onResize = () => setTrackPosition(trackIdxRef.current, false);
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(timerRef.current);
      track?.removeEventListener("transitionend", onTransitionEnd);
      window.removeEventListener("resize", onResize);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="py-12 bg-white overflow-hidden border-t border-black/5">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-emerald-700">
              Success Stories
            </span>
          </div>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight mb-2"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Real Results for{" "}
            <span className="text-yellow-400">Real Businesses</span>
          </h2>
        </div>
      </div>

      {/* Carousel */}
      <div className="relative w-full">
        {/* Edge fades */}
        <div className="absolute left-0 top-0 bottom-8 w-12 md:w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-8 w-12 md:w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        {/*
          FIX: opacity-0 until `ready` so there's no flash of un-positioned cards.
          Without this, cards briefly show in their un-translated default position
          (all stacked at x=0) before the first goTo() runs.
        */}
        <div
          className={`overflow-hidden pb-8 pt-2 transition-opacity duration-300 ${
            ready ? "opacity-100" : "opacity-0"
          }`}
          onMouseEnter={() => {
            pausedRef.current = true;
          }}
          onMouseLeave={() => {
            pausedRef.current = false;
          }}
        >
          <div ref={trackRef} className="flex" style={{ gap: `${GAP}px` }}>
            {CLONE_ITEMS.map((study, trackIdx) => {
              // FIX: compare against activeTrackIdx (state), not trackIdxRef.current (ref)
              // Refs don't cause re-renders; state does — this was the root blank-card bug.
              const isActive = trackIdx === activeTrackIdx;

              return (
                <div
                  key={study._key}
                  data-card
                  className="flex-shrink-0 transition-all duration-700"
                  style={{
                    width: "calc(100% - 60px)",
                    maxWidth: "960px",
                    opacity: isActive ? 1 : 0.4,
                    transform: isActive ? "scale(1)" : "scale(0.97)",
                    pointerEvents: isActive ? "auto" : "none",
                  }}
                >
                  <div className="relative bg-white rounded-[2rem] border border-black/5 shadow-xl shadow-black/5 overflow-hidden">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-yellow-300/5 rounded-full blur-3xl -mr-40 -mt-40 pointer-events-none" />

                    <div className="relative z-10 flex flex-col lg:flex-row items-stretch">
                      {/* Left — Quote + Client */}
                      <div className="lg:w-5/12 p-8 sm:p-10 lg:p-12 border-b lg:border-b-0 lg:border-r border-slate-100 flex flex-col">
                        <div className="hidden sm:block mb-8">
                          <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-md shadow-yellow-400/20">
                            <Quote className="text-black w-6 h-6 fill-black" />
                          </div>
                        </div>

                        <blockquote className="hidden sm:block text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 leading-snug mb-10 italic flex-grow">
                          &quot;{study.quote}&quot;
                        </blockquote>

                        <div className="mt-auto flex items-center gap-5 pt-6 border-t border-slate-100">
                          <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-yellow-300/30 shrink-0">
                            <img
                              src={study.clientImage}
                              alt={study.clientName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <h4
                              className="text-[12px] sm:text-lg font-black text-black leading-none mb-1 uppercase"
                              style={{ fontFamily: "var(--font-heading)" }}
                            >
                              {study.clientName}
                            </h4>
                            <p className="text-[10px] sm:text-xs font-bold text-slate-400">
                              {study.clientRole}
                            </p>
                            <div className="hidden sm:flex gap-0.5 mt-2">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400"
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right — Growth Chart */}
                      <div className="lg:w-7/12 p-8 sm:p-10 lg:p-12 bg-slate-50/60 flex flex-col justify-center">
                        <div className="flex items-center justify-between mb-8">
                          <div>
                            <h3
                              className="text-sm sm:text-xl font-black text-black uppercase tracking-tight"
                              style={{ fontFamily: "var(--font-heading)" }}
                            >
                              Growth Metrics
                            </h3>
                            <p className="text-[10px] sm:text-sm font-bold text-slate-400 italic">
                              6-Month Performance Report
                            </p>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 bg-emerald-500 text-white rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black shadow-md shadow-emerald-500/20 shrink-0">
                            <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            {study.avgGrowth} AVG
                          </div>
                        </div>

                        <BarChart data={study.growthData} />

                        <div className="hidden sm:grid grid-cols-3 gap-3 mt-8">
                          {study.growthData.map((item, i) => (
                            <div
                              key={i}
                              className="bg-white p-3 sm:p-4 rounded-2xl border border-black/5 shadow-sm"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <div
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: item.color }}
                                />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                                  {item.name}
                                </span>
                              </div>
                              <div className="hidden sm:block text-xl font-black text-black">
                                +{item.growth}%
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2.5 mt-2">
          {caseStudies.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                goTo(i + REAL_OFFSET, true);
                startTimer();
              }}
              className="transition-all duration-300 rounded-full focus:outline-none"
              style={{
                width: i === dotIndex ? "24px" : "8px",
                height: "8px",
                backgroundColor: i === dotIndex ? "#facc15" : "#cbd5e1",
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CaseStudySection;
