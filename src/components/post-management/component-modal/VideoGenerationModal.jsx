"use client";
import { Video } from "lucide-react";

export default function VideoGenerationModal({
  isLoading,
  isSuccess,
  timeLeft,
  formatTime,
  onClose,
}) {
  if (!isLoading && !isSuccess) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-lg z-[200] flex items-center justify-center px-4 animate-fadeIn">

      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center text-center animate-scaleIn relative">

        {/* CLOSE BUTTON */}
        {isSuccess && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-500 transition"
          >
            ✕
          </button>
        )}

        {/* TOP ICON */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-[#EAB308]/20 rounded-full blur-xl animate-pulse"></div>

          <div className="relative w-24 h-24 flex items-center justify-center rounded-full bg-black/50">
            
            {isSuccess ? (
              <svg
                className="w-12 h-12 text-[#EAB308]"
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
            ) : (
              <Video className="w-10 h-10 text-[#EAB308] animate-pulse" />
            )}

          </div>
        </div>

        {/* TEXT */}
        <h3 className="text-xl font-bold text-slate-900 mb-2">
          {isSuccess ? "Video Generated Successfully 🎉" : "Generating Video..."}
        </h3>

        <p className="text-sm text-slate-500 mb-5">
          {isSuccess
            ? "Your video is ready. You can now post or download it 🚀"
            : `⏳ ${timeLeft > 0 ? `${timeLeft}s remaining` : "Almost done..."}`}
        </p>

        {/* 🔥 LOADER LINE (ONLY WHEN LOADING) */}
        {!isSuccess && (
          <div className="relative w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-4">
            <div className="absolute top-0 left-0 h-full w-1/3 bg-[#EAB308] rounded-full animate-slide"></div>
          </div>
        )}

        {/* TIMER / BUTTON */}
        {isSuccess ? (
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#EAB308] text-black rounded-xl font-semibold hover:scale-105 transition shadow-md"
          >
            Done
          </button>
        ) : (
          <div className="text-2xl font-black text-[#EAB308] font-mono">
            {formatTime(timeLeft)}
          </div>
        )}

        {/* ANIMATIONS */}
        <style>
          {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes scaleIn {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }

          @keyframes tickDraw {
            0% { stroke-dashoffset: 50; }
            100% { stroke-dashoffset: 0; }
          }

          @keyframes slide {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(300%); }
          }

          .tick-path {
            stroke-dasharray: 50;
            stroke-dashoffset: 50;
            animation: tickDraw 0.6s ease forwards;
          }

          .animate-slide {
            animation: slide 1.2s linear infinite;
          }

          .animate-fadeIn { animation: fadeIn 0.3s ease; }
          .animate-scaleIn { animation: scaleIn 0.3s ease; }
          `}
        </style>

      </div>
    </div>
  );
}