"use client";

import { X, Gift, Sparkles } from "lucide-react";

export default function SignupPopup({
  showSignupPopup,
  setShowSignupPopup,
  isLoggedIn,
}) {
  if (!showSignupPopup || isLoggedIn) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-fadeIn font-sans">
      <div
        className="relative rounded-3xl p-8 max-w-md w-full border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] text-center overflow-hidden"
        style={{ backgroundColor: "var(--cyber-black)" }}
      >
        {/* Subtle Background Glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#FDE047]/10 blur-[80px] rounded-full" />

        {/* Close Button */}
        <button
          onClick={() => setShowSignupPopup(false)}
          className="absolute top-6 right-6 text-white/40 hover:text-[#FDE047] transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Icon Header */}
        <div className="relative mb-6 flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 bg-[#FDE047]/10 rounded-2xl flex items-center justify-center rotate-12 border border-[#FDE047]/20">
              <Gift className="w-10 h-10 text-[#FDE047] -rotate-12 animate-pulse" />
            </div>
            {/* Sparkle Decorations */}
            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-[#FDE047] animate-bounce" />
          </div>
        </div>

        {/* Text Content */}
        <h2 className="text-3xl font-extrabold text-white mb-3 tracking-tight">
          Hurry Up! 🚀
        </h2>

        <p className="text-white/70 text-lg mb-8 leading-relaxed">
          Sign up now to get{" "}
          <span className="text-[#FDE047] font-bold">
            500 bonus coins
          </span>{" "}
          and create amazing posts instantly!
        </p>

        {/* Action Button */}
        <button
          onClick={() => (window.location.href = "/login")}
          className="w-full group px-8 py-4 bg-[#FDE047] text-black rounded-xl font-bold text-lg hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(253,224,71,0.2)]"
        >
          Claim My Coins Now
        </button>

        {/* Secondary Close Option */}
        <button
          onClick={() => setShowSignupPopup(false)}
          className="mt-5 text-white/30 hover:text-white/60 text-sm font-medium transition italic"
        >
          No thanks, I&apos;ll pay full price later
        </button>
      </div>
    </div>
  );
}