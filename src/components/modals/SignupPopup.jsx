"use client";

import { X, Gift, Sparkles } from "lucide-react";

export default function SignupPopup({
  showSignupPopup,
  setShowSignupPopup,
  isLoggedIn,
}) {
  if (!showSignupPopup || isLoggedIn) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div
        className="relative bg-white rounded-[2.5rem] p-8 md:p-12 max-w-md w-full border border-black/[0.03] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.15)] text-center overflow-hidden"
      >
        {/* ── Subtle background grid ── */}
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.2) 1px, transparent 1px)",
            backgroundSize: "30px 30px"
          }}
        />

        {/* Ambient Glow */}
        <div 
          className="absolute -top-20 -right-20 w-60 h-60 blur-[100px] rounded-full opacity-10" 
          style={{ background: "var(--lemon-glow)" }}
        />

        {/* Close Button */}
        <button
          onClick={() => setShowSignupPopup(false)}
          className="absolute top-6 right-6 text-black/20 hover:text-lemon-hover hover:rotate-90 transition-all z-20 cursor-pointer p-2 rounded-full hover:bg-slate-50"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative z-10">
          {/* Icon Header */}
          <div className="relative mb-8 flex justify-center">
            <div className="relative">
              <div 
                className="w-20 h-20 rounded-[1.5rem] flex items-center justify-center rotate-12 bg-lemon-glow/10 border border-lemon-glow/20 shadow-sm"
              >
                <Gift 
                  className="w-10 h-10 -rotate-12 animate-pulse text-lemon-hover" 
                />
              </div>
              <div className="absolute -top-4 -right-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center border border-black/[0.03] animate-bounce">
                 <Sparkles 
                    className="w-6 h-6 text-lemon-hover" 
                 />
              </div>
            </div>
          </div>

          {/* Text Content */}
          <h2 
            className="font-black uppercase leading-[0.95] tracking-tight mb-4 font-heading text-black"
            style={{ fontSize: "clamp(2rem, 5vw, 2.75rem)" }}
          >
            Hurry <span className="text-lemon-hover">Up!</span> 🚀
          </h2>

          <p 
            className="text-black/60 text-base mb-10 leading-relaxed font-medium mx-auto max-w-[300px] font-inter"
          >
            Sign up now to get{" "}
            <span className="text-black font-black underline decoration-[3px] decoration-lemon-glow underline-offset-4">
              500 bonus coins
            </span>{" "}
            and create amazing posts instantly!
          </p>

          {/* Action Button */}
          <button
            onClick={() => (window.location.href = "/login")}
            className="w-full py-5 rounded-2xl text-[11px] font-black tracking-[0.25em] uppercase transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-xl shadow-lemon-glow/20 bg-lemon-glow text-black hover:bg-lemon-hover"
          >
            Claim My Coins Now ↗
          </button>

          {/* Secondary Close Option */}
          <button
            onClick={() => setShowSignupPopup(false)}
            className="mt-8 text-black/30 hover:text-black/60 text-[10px] font-bold tracking-[0.2em] uppercase transition-all cursor-pointer"
          >
            No thanks, I&apos;ll pay full price later
          </button>
        </div>
      </div>
    </div>
  );
}
