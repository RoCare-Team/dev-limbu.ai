"use client";

import { startGmbConnect } from "@/hooks/useGmbConnection";

export default function GMBModal({
  showGmbExpiredModal,
  setShowGmbExpiredModal,
}) {
  if (!showGmbExpiredModal) return null;

  return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[300] flex items-center justify-center px-4 animate-overlayFade">

    <div className="relative w-full max-w-md bg-white rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.25)] p-8 text-center overflow-hidden animate-modalPop">

      {/* 🔥 TOP GLOW */}
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-[#EAB308]/20 blur-[120px] rounded-full animate-glowPulse"></div>

      {/* ICON */}
      <div className="relative mb-6 animate-bounceIn">
        <div className="w-20 h-20 mx-auto flex items-center justify-center rounded-full bg-gray-800 border-red-200 shadow-inner">
          <span className="text-4xl">⚠️</span>
        </div>
      </div>

      {/* TITLE */}
      <h3 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight animate-fadeUp">
        Connect Your Business First
      </h3>

      {/* SUBTEXT */}
      <p className="text-sm text-slate-600 mb-3 leading-relaxed px-2 animate-fadeUp delay-100">
        Your Google Business account is not connected. Please reconnect your account to continue posting, scheduling, or managing your content.
      </p>

      {/* ERROR LINE */}
      <p className="text-xs text-red-500 font-medium mb-6 animate-fadeUp delay-200">
        ⚠ Google session expired
      </p>

      {/* BUTTONS */}
      <div className="flex gap-3 justify-center animate-fadeUp delay-300">

        <button
          onClick={() => setShowGmbExpiredModal(false)}
          className="px-5 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 transition"
        >
          Cancel
        </button>

        <button
          onClick={() => startGmbConnect("/dashboard").catch((err) => console.error(err))}
          className="px-6 py-2 rounded-xl bg-[#EAB308] text-white font-semibold hover:scale-105 transition"
        >
          Connect Business
        </button>

      </div>

      {/* 🔥 BOTTOM LINE */}
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#EAB308] to-transparent opacity-40"></div>

      {/* ✨ ANIMATIONS */}
      <style>
        {`
        @keyframes overlayFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes modalPop {
          0% {
            opacity: 0;
            transform: scale(0.85) translateY(30px);
          }
          60% {
            transform: scale(1.03);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounceIn {
          0% { transform: scale(0.6); opacity: 0; }
          60% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }

        @keyframes glowPulse {
          0% { opacity: 0.5; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1.05); }
        }

        .animate-overlayFade {
          animation: overlayFade 0.25s ease;
        }

        .animate-modalPop {
          animation: modalPop 0.4s ease;
        }

        .animate-fadeUp {
          animation: fadeUp 0.4s ease forwards;
        }

        .animate-fadeUp.delay-100 {
          animation-delay: 0.1s;
        }

        .animate-fadeUp.delay-200 {
          animation-delay: 0.2s;
        }

        .animate-fadeUp.delay-300 {
          animation-delay: 0.3s;
        }

        .animate-bounceIn {
          animation: bounceIn 0.4s ease;
        }

        .animate-glowPulse {
          animation: glowPulse 2s ease-in-out infinite alternate;
        }
        `}
      </style>

    </div>
  </div>
  );
}   