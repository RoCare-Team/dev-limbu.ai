"use client";

import { useEffect, useState, useRef } from "react";

// Helper function for smooth deceleration (easing out)
const easeOutQuad = (t) => t * (2 - t);

// Reusable animated counter component
const AnimatedNumber = ({ end, decimals = 0, suffix = "" }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Start animation only when the component comes into the screen
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let startTime = null;
          const duration = 2000; // 2 seconds duration

          const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            
            // Apply easing to make it slow down nicely at the end
            const currentVal = end * easeOutQuad(progress);
            
            setCount(currentVal);

            if (progress < 1) {
              window.requestAnimationFrame(animate);
            } else {
              setCount(end); // Ensure it stops exactly at the target number
            }
          };
          window.requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 } // Triggers when 30% of the number is visible
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [end, hasAnimated]);

  return (
    <span ref={ref} className="
    text-5xl tracking-tighter font-light" style={{ color: "var(--foreground)" }}    
    >
      {count.toFixed(decimals)}{" "}
      {suffix}
    </span>
  );
};

function StatsSection() {
  return (
    <section
      className="relative w-full py-12 px-6 md:px-10 flex flex-col items-center justify-center border-t border-black/5"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div className="w-full max-w-[1100px] mx-auto">
        
        {/* ── Headline ── */}
        <h2 
          className="text-center text-2xl sm:text-3xl md:text-[2.25rem] font-bold leading-[1.2] tracking-tight mb-12 md:mb-16"
          style={{ 
            color: "var(--foreground)", 
            fontFamily: "var(--font-heading)" 
          }}
        >
          Scale your local presence with the GMB Automation tool <br className="hidden md:block" />
          built to dominate search and drive growth.
        </h2>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
          
          {/* Stat 1 */}
          <div className="flex flex-col">
            <h3 
              className="text-5xl md:text-6xl font-light mb-3 tracking-tighter"
              style={{ color: "var(--foreground)" }}
            >
              <AnimatedNumber end={2.3} decimals={1} suffix="x" />
            </h3>
            <p 
              className="text-[15px] md:text-base mb-1.5 font-bold"
              style={{ color: "var(--foreground)" }}
            >
              Follower growth
            </p>
            <p 
              className="text-xs md:text-[14px] leading-relaxed"
              style={{ color: "var(--tech-gray)" }}
            >
              Top customers more than double their{" "}
              <strong style={{ color: "var(--foreground)", fontWeight: 700 }}>
                following
              </strong>{" "}
              in 30 days.
            </p>
          </div>

          {/* Stat 2 */}
          <div className="flex flex-col">
            <h3 
              className="text-5xl md:text-6xl font-light mb-3 tracking-tighter"
              style={{ color: "var(--foreground)" }}
            >
              <AnimatedNumber end={87} decimals={0} suffix="%" />
            </h3>
            <p 
              className="text-[15px] md:text-base mb-1.5 font-bold"
              style={{ color: "var(--foreground)" }}
            >
              Audience growth
            </p>
            <p 
              className="text-xs md:text-[14px] leading-relaxed"
              style={{ color: "var(--tech-gray)" }}
            >
              87% of customers see audience growth in their first 30 days.
            </p>
          </div>

          {/* Stat 3 */}
          <div className="flex flex-col">
            <h3 
              className="text-5xl md:text-6xl font-light mb-3 tracking-tighter"
              style={{ color: "var(--foreground)" }}
            >
              <AnimatedNumber end={99} decimals={0} suffix="%" />
            </h3>
            <p 
              className="text-[15px] md:text-base mb-1.5 font-bold"
              style={{ color: "var(--foreground)" }}
            >
              Lower cost vs agencies
            </p>
            <p 
              className="text-xs md:text-[14px] leading-relaxed"
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

export default StatsSection;