"use client";

import { X, Sparkles } from "lucide-react";

export default function ImageModal({ selectedImage, setSelectedImage }) {
  if (!selectedImage) return null;

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[150] flex items-center justify-center p-4 md:p-8 animate-fadeIn"
      onClick={() => setSelectedImage(null)}
    >
      <div
        className="relative max-w-5xl w-full group"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Cyber Glow Border */}
        <div className="absolute -inset-1 bg-gradient-to-r from-[#FDE047]/10 via-[#FDE047]/30 to-[#FDE047]/10 rounded-2xl blur-md opacity-70 group-hover:opacity-100 transition duration-500"></div>

        {/* Close Button - Theme Matched (Lemon Glow) */}
        <button
          onClick={() => setSelectedImage(null)}
          className="absolute -top-12 right-0 sm:-top-10 sm:-right-10 w-12 h-12 bg-[#FDE047] text-black rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(253,224,71,0.4)] hover:scale-110 active:scale-95 transition-all z-[160]"
        >
          <X className="w-6 h-6 sm:w-7 sm:h-7 stroke-[3px] group-hover:rotate-90 transition-transform duration-300" />
        </button>

        {/* Image Container - Switched from white to Cyber Black */}
        <div className="relative bg-[#0A0A0A] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
          <img
            src={selectedImage}
            alt="Enlarged post"
            className="w-full h-auto object-contain max-h-[80vh] mx-auto"
          />

          {/* Bottom Overlay - Themed with Lemon Glow accents */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent p-6 pt-12">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-[#FDE047]" />
              <p className="text-[#FDE047] font-bold text-sm uppercase tracking-widest">
                AI Generated Content
              </p>
            </div>
            <p className="text-white/60 text-sm italic">
              Optimized for Google My Business & Social Platforms
            </p>
          </div>
        </div>

        {/* Close Hint */}
        <p className="text-white/20 text-center mt-4 text-xs tracking-widest uppercase pointer-events-none">
          Click backdrop or press ESC to close
        </p>
      </div>
    </div>
  );
}