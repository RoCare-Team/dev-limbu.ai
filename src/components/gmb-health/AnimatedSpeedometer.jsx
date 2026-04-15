"use client";

import React, { useState, useEffect } from "react";
import { Trophy, Zap, ShieldAlert } from "lucide-react";
import Speedometer from "./Speedometer";

const AnimatedSpeedometer = React.memo(({ targetScore }) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 2000; // 2 seconds
    const increment = targetScore / (duration / 16); // 60fps

    const timer = setInterval(() => {
      start += increment;
      if (start >= targetScore) {
        setAnimatedScore(targetScore);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [targetScore]);

  const getStatusColor = (score) => {
    if (score >= 90)
      return {
        bg: "rgba(34, 197, 94, 0.1)",
        text: "#16a34a",
        label: "Great Shape",
        icon: <Trophy className="w-4 h-4" />,
      };
    if (score >= 60)
      return {
        bg: "rgba(250, 204, 21, 0.1)",
        text: "var(--lemon-hover)",
        label: "Needs Work",
        icon: <Zap className="w-4 h-4" />,
      };
    return {
      bg: "rgba(239, 68, 68, 0.1)",
      text: "#dc2626",
      label: "Needs Urgent Fixes",
      icon: <ShieldAlert className="w-4 h-4" />,
    };
  };

  const statusInfo = getStatusColor(targetScore);

  return (
    <div
      className="flex flex-col items-center py-10 relative overflow-hidden"
      style={{ background: "linear-gradient(to bottom, #ffffff, #f8fafc)" }}
    >
      <div className="relative z-10 w-full max-w-xl mx-auto px-6">
        <div className="relative w-80 h-48 mx-auto">
          <Speedometer score={animatedScore} />
        </div>

        <div className="text-center mt-4">
          <div
            className="font-black leading-none mb-2"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(3rem, 6vw, 4rem)",
              color: "var(--cyber-black)",
            }}
          >
            {animatedScore}
            <span className="text-2xl opacity-30">/100</span>
          </div>

          <div
            className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full text-[11px] font-black tracking-widest uppercase shadow-sm transition-all duration-500"
            style={{
              backgroundColor: statusInfo.bg,
              color: statusInfo.text,
              border: `1.5px solid ${statusInfo.text}30`,
            }}
          >
            {statusInfo.icon}
            {statusInfo.label}
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: statusInfo.text }}
            />
          </div>
        </div>

        <p
          className="mt-6 text-[12px] max-w-md mx-auto text-center font-semibold leading-relaxed"
          style={{ color: "var(--tech-gray)" }}
        >
          Based on{" "}
          <span className="text-black font-black underline decoration-[var(--lemon-glow)] decoration-2 underline-offset-4">
            24 key success factors
          </span>
          , your profile currently captures{" "}
          <span className="text-black font-black text-sm">
            {animatedScore}%
          </span>{" "}
          of its potential customers.
        </p>
      </div>
    </div>
  );
});

AnimatedSpeedometer.displayName = "AnimatedSpeedometer";
export default AnimatedSpeedometer;
