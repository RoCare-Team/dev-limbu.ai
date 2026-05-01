

"use client";

export default function ImageGeneratedModal({
  isOpen,
  onClose,
}) {
  if (!isOpen) return null;

  return (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-lg z-[300] flex items-center justify-center animate-overlayFade">

  <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl relative animate-modalPop">

    {/* ❌ CLOSE ICON */}
        <button
  onClick={onClose}
  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-100 hover:bg-red-100 transition"
>
  ✕
</button>

    {/* 🔥 ICON WITH ANIMATION */}
    <div className="relative w-25 h-25 mx-auto mb-6 flex items-center justify-center">

  {/* Circle (background) */}
  <div className="absolute w-full h-full rounded-full border-4 border-gray-800 animate-circle"></div>

  {/* Tick SVG */}
  <svg
    className="w-20 h-20 text-[#EAB308]"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    viewBox="0 0 24 24"
  >
    <path
      d="M5 13l4 4L19 7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="tick-draw"
    />
  </svg>
</div>

    {/* TITLE */}
    <h3 className="text-xl font-bold text-[#EAB308] mb-2">
      Image Generated Successfully 
    </h3>

    {/* TEXT */}
    <p className="text-sm text-slate-600 mb-6">
      Your image is ready to use 
    </p>

    {/* BUTTON */}
    <button
  onClick={onClose}
  className="px-6 py-2.5 bg-[#EAB308] text-black rounded-xl font-semibold hover:scale-105 transition shadow-md"
>
  Continue
</button>

    {/* ✨ ANIMATIONS */}
    <style>
      {`

        /* Circle pop */
@keyframes circlePop {
  0% {
    transform: scale(0.6);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Tick draw */
@keyframes tickDraw {
  0% {
    stroke-dashoffset: 60;
  }
  100% {
    stroke-dashoffset: 0;
  }
}

/* Circle animation */
.animate-circle {
  animation: circlePop 0.3s ease forwards;
}

/* Tick animation (delayed) */
.tick-draw {
  stroke-dasharray: 60;
  stroke-dashoffset: 60;
  animation: tickDraw 0.6s ease forwards;
  animation-delay: 0.3s; /* 🔥 IMPORTANT */
}

      @keyframes modalPop {
        0% {
          opacity: 0;
          transform: scale(0.85) translateY(20px);
        }
        60% {
          transform: scale(1.05);
        }
        100% {
          opacity: 1;
          transform: scale(1);
        }
      }

      @keyframes overlayFade {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes tickDraw {
        0% {
          stroke-dashoffset: 50;
        }
        100% {
          stroke-dashoffset: 0;
        }
      }

      .tick-path {
        stroke-dasharray: 50;
        stroke-dashoffset: 50;
        animation: tickDraw 0.6s ease forwards;
      }

      .animate-modalPop {
        animation: modalPop 0.35s ease;
      }

      .animate-overlayFade {
        animation: overlayFade 0.25s ease;
      }
      `}
    </style>

  </div>
</div>
  );
}