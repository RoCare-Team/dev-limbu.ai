"use client";

import { useEffect, useState, useRef } from "react";

// Smooth animation easing
const easeOutQuad = (t) => t * (2 - t);

// Animated counter
const AnimatedNumber = ({ end, decimals = 0, suffix = "" }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let startTime = null;
          const duration = 2000;

          const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const currentVal = end * easeOutQuad(progress);

            setCount(currentVal);

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setCount(end);
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, hasAnimated]);

  return (
    <span
      ref={ref}
      className="text-5xl md:text-6xl tracking-tighter font-light"
      style={{ color: "var(--foreground)" }}
    >
      {count.toFixed(decimals)} {suffix}
    </span>
  );
};

export default function StatsSection() {
  return (
    <section
      className="w-full py-14 px-6 md:px-10 flex flex-col items-center justify-center border-t border-black/5"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div className="w-full max-w-6xl mx-auto">

        {/* 🔥 Heading */}
        <h2
          className="text-center text-2xl sm:text-3xl md:text-[2.25rem] font-bold leading-[1.2] tracking-tight mb-14 md:mb-16 max-w-3xl mx-auto"
          style={{
            color: "var(--foreground)",
            fontFamily: "var(--font-heading)",
          }}
        >
          Scale your local presence with the GMB Automation tool{" "}
          <br className="hidden md:block" />
          built to dominate search and drive growth.
        </h2>

        {/* 🔥 Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">

          {/* Stat 1 */}
          <div className="flex flex-col items-center text-center max-w-xs mx-auto">
            <AnimatedNumber end={2.3} decimals={1} suffix="x" />

            <p
  className="text-[15px] md:text-base mt-3 mb-1.5 font-bold"
  style={{ color: "var(--foreground)" }}
>
  Profile visibility growth
</p>

<p
  className="text-xs md:text-[14px] leading-relaxed max-w-[240px]"
  style={{ color: "var(--tech-gray)" }}
>
  Businesses see higher visibility on{" "}
  <strong style={{ color: "var(--foreground)" }}>
    Google Search & Maps
  </strong>{" "}
  within 30 days.
</p>
          </div>

          {/* Stat 2 */}
          <div className="flex flex-col items-center text-center max-w-xs mx-auto">
            <AnimatedNumber end={87} suffix="%" />

            <p
              className="text-[15px] md:text-base mt-3 mb-1.5 font-bold"
              style={{ color: "var(--foreground)" }}
            >
              Audience growth
            </p>

            <p
              className="text-xs md:text-[14px] leading-relaxed max-w-[240px]"
              style={{ color: "var(--tech-gray)" }}
            >
              87% of customers see audience growth in their first 30 days.
            </p>
          </div>

          {/* Stat 3 */}
          <div className="flex flex-col items-center text-center max-w-xs mx-auto">
            <AnimatedNumber end={99} suffix="%" />

            <p
              className="text-[15px] md:text-base mt-3 mb-1.5 font-bold"
              style={{ color: "var(--foreground)" }}
            >
              Lower cost vs agencies
            </p>

            <p
              className="text-xs md:text-[14px] leading-relaxed max-w-[240px]"
              style={{ color: "var(--tech-gray)" }}
            >
              Agency-level strategy, content, and insights for 1% of the price.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}