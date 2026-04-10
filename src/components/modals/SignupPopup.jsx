"use client";

import { X, Gift, Sparkles } from "lucide-react";

export default function SignupPopup({
  showSignupPopup,
  setShowSignupPopup,
  isLoggedIn,
}) {
  if (!showSignupPopup || isLoggedIn) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-fadeIn">
      <div
        className="relative rounded-[2rem] p-8 max-w-md w-full border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] text-center overflow-hidden"
        style={{ backgroundColor: "var(--cyber-black)" }}
      >
        {/* ── Subtle background grid ── */}
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-[0.05]"
          style={{
            backgroundImage: "linear-gradient(rgba(250, 204, 21, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(250, 204, 21, 0.2) 1px, transparent 1px)",
            backgroundSize: "30px 30px"
          }}
        />

        {/* Ambient Glow */}
        <div 
          className="absolute -top-20 -right-20 w-60 h-60 blur-[100px] rounded-full opacity-20" 
          style={{ background: "var(--lemon-glow)" }}
        />

        {/* Close Button */}
        <button
          onClick={() => setShowSignupPopup(false)}
          className="absolute top-6 right-6 text-white/40 hover:text-[var(--lemon-glow)] transition-colors z-20 cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="relative z-10">
          {/* Icon Header */}
          <div className="relative mb-8 flex justify-center">
            <div className="relative">
              <div 
                className="w-20 h-20 rounded-2xl flex items-center justify-center rotate-12 border"
                style={{ 
                  background: "rgba(250, 204, 21, 0.1)",
                  borderColor: "rgba(250, 204, 21, 0.2)"
                }}
              >
                <Gift 
                  className="w-10 h-10 -rotate-12 animate-pulse" 
                  style={{ color: "var(--lemon-glow)" }}
                />
              </div>
              <Sparkles 
                className="absolute -top-3 -right-3 w-8 h-8 animate-bounce" 
                style={{ color: "var(--lemon-glow)" }}
              />
            </div>
          </div>

          {/* Text Content */}
          <h2 
            className="font-bold uppercase leading-[0.95] tracking-tight mb-4"
            style={{ 
              fontFamily: "var(--font-heading)",
              color: "var(--pure-white)",
              fontSize: "clamp(2rem, 5vw, 2.5rem)"
            }}
          >
            Hurry <span style={{ color: "var(--lemon-glow)" }}>Up!</span> 🚀
          </h2>

          <p 
            className="text-white/70 text-base mb-8 leading-relaxed font-medium mx-auto max-w-[280px]"
          >
            Sign up now to get{" "}
            <span style={{ color: "var(--lemon-glow)" }} className="font-bold underline decoration-2 underline-offset-4">
              500 bonus coins
            </span>{" "}
            and create amazing posts instantly!
          </p>

          {/* Action Button */}
          <button
            onClick={() => (window.location.href = "/login")}
            className="w-full py-5 rounded-2xl text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-[0_10px_25px_-5px_rgba(234,179,8,0.3)]"
            style={{
              background: "var(--lemon-glow)",
              color: "#000",
            }}
          >
            Claim My Coins Now ↗
          </button>

          {/* Secondary Close Option */}
          <button
            onClick={() => setShowSignupPopup(false)}
            className="mt-6 text-white/30 hover:text-white/60 text-[10px] font-bold tracking-widest uppercase transition-all cursor-pointer"
          >
            No thanks, I&apos;ll pay full price later
          </button>
        </div>
      </div>
    </div>
  );
}