
"use client";

import { Send } from "lucide-react";

export default function PostPublishModal({
  isPosting,
  isSuccess,
  setIsSuccess,
  postingPlatform,
  messages,
  msgIndex,
  timeLeft,
  dots,
}) {
  if (!isPosting && !isSuccess) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[200] flex items-center justify-center px-4 animate-overlayFade">

    <div className="w-full max-w-lg bg-white rounded-[28px] shadow-[0_25px_80px_rgba(0,0,0,0.25)] p-10 flex flex-col items-center text-center relative overflow-hidden animate-modalPop">

      {/* 🔥 TOP GLOW */}
      <div className="absolute -top-24 w-[350px] h-[350px] bg-[#EAB308]/20 blur-[120px] rounded-full"></div>

      {isSuccess ? (
        <>
          {/* ❌ CLOSE BUTTON */}
          <button
            onClick={() => setIsSuccess(false)}
            className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-500 transition"
          >
            ✕
          </button>

          {/* ✅ SUCCESS ICON (ANIMATED TICK) */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-green-400/20 rounded-full blur-xl animate-pulse"></div>

            <div className="relative w-24 h-24 flex items-center justify-center rounded-full bg-green-100 shadow-inner">

              <svg
                className="w-14 h-14 text-green-600 animate-tick"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                viewBox="0 0 24 24"
              >
                <path
                  d="M5 13l4 4L19 7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="tick-path"
                />
              </svg>

            </div>
          </div>

          {/* TITLE */}
         <h3 className="text-2xl font-extrabold text-yellow-400 mb-2">
   Post Published Successfully!
</h3>

<p className="text-sm text-slate-600 mb-6">
  Your content is now live on {postingPlatform}. Sit back and watch the engagement grow 📈
</p>

          {/* DONE BUTTON */}
          <button
            onClick={() => setIsSuccess(false)}
            className="px-6 py-2.5 bg-[#EAB308] text-white rounded-xl font-semibold hover:scale-105 transition shadow-md animate-fadeUp delay-200"
          >
            Done
          </button>
        </>
      ) : (
        <>
          {/* 🔄 LOADING ICON */}
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full bg-[#EAB308]/30 blur-xl animate-pulse"></div>

            <div className="relative w-24 h-24 flex items-center justify-center rounded-full bg-[#EAB308]/10 border border-[#EAB308]/30">
              <Send className="w-12 h-12 text-[#EAB308] animate-bounce" />
            </div>
          </div>

          {/* TITLE */}
          <h3 className="text-2xl font-extrabold text-slate-900 mb-1">
            Publishing to {postingPlatform}
          </h3>

          {/* SUBTEXT */}
          <p className="text-sm text-slate-500 mb-6 max-w-sm leading-relaxed">
            {messages[msgIndex]}{" "}
            <span className="text-[#EAB308] font-semibold">
              ({String(timeLeft).padStart(2, "0")}s)
            </span>
          </p>

          {/* PROGRESS */}
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-5 relative">
            <div
              className="h-full bg-[#EAB308] transition-all duration-1000"
              style={{
                width: `${((10 - timeLeft) / 10) * 100}%`,
              }}
            ></div>

            <div className="absolute top-0 left-0 h-full w-1/3 bg-white/30 animate-slide"></div>
          </div>

          {/* STEPS */}
          <div className="flex flex-col gap-3 text-sm w-full max-w-sm text-left">

            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <p className="text-slate-700 font-medium">
                Connecting to {postingPlatform}...
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
              <p className="text-slate-700 font-medium">
                Uploading your content...
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-slate-300 rounded-full animate-pulse"></div>
              <p className="text-slate-500 font-medium">
                Finalizing post<span className="ml-1">{dots}</span>
              </p>
            </div>

          </div>
        </>
      )}

      {/* ✨ ANIMATIONS */}
      <style>
        {`
        @keyframes slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }

        @keyframes overlayFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes modalPop {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes tickDraw {
          from { stroke-dashoffset: 50; }
          to { stroke-dashoffset: 0; }
        }

        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        .tick-path {
          stroke-dasharray: 50;
          stroke-dashoffset: 50;
          animation: tickDraw 0.6s ease forwards;
        }

        .animate-tick {
          animation: popIn 0.3s ease;
        }

        .animate-overlayFade {
          animation: overlayFade 1s ease;
        }

        .animate-modalPop {
          animation: modalPop 0.35s ease;
        }

        .animate-fadeUp {
          animation: fadeUp 1s ease forwards;
        }

        .animate-fadeUp.delay-100 {
          animation-delay: 0.1s;
        }

        .animate-fadeUp.delay-200 {
          animation-delay: 1s;
        }
        `}
      </style>

    </div>
  </div>
  );
}