"use client";

import { useEffect, useState, useRef } from "react";

const easeOutQuad = (t) => t * (2 - t);

export default function AnimatedNumber({ end, decimals = 0, suffix = "" }) {
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
      { threshold: 0.3 },
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
}
