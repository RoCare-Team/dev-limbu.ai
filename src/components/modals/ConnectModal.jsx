import { Rocket, X } from "lucide-react";
import { useEffect } from "react";
import { signIn } from "next-auth/react";

export default function ConnectModal({ isOpen, onClose }) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 30000); // Auto-close after 30 seconds

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div 
        className="rounded-2xl shadow-2xl w-full max-w-md m-4 p-8 sm:p-10 relative transform transition-all animate-scaleUp border border-white/10"
        style={{
          backgroundColor: "rgba(12, 12, 12, 0.95)",
          boxShadow: "0 0 50px rgba(253, 224, 71, 0.1)",
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-[#FDE047] transition-colors cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Icon */}
        <div 
          className="mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-6"
          style={{ background: "rgba(253, 224, 71, 0.1)", border: "1px solid rgba(253, 224, 71, 0.2)" }}
        >
          <Rocket className="h-8 w-8 text-[#FDE047]" />
        </div>

        {/* Content */}
        <div className="text-center">
          <h2 
            className="text-2xl sm:text-3xl font-normal uppercase tracking-tight mb-3 text-white"
            style={{ fontFamily: "Anton, Impact, sans-serif" }}
          >
            Connect Your <span style={{ WebkitTextStroke: "1px #FDE047", color: "transparent" }}>Business</span>
            <span 
              className="block text-sm sm:text-base font-medium mt-2 tracking-widest uppercase text-[#FDE047]"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              — Hassle-Free & Instantly
            </span>
          </h2>
          <p className="text-white/60 mb-8 text-sm sm:text-base max-w-xs mx-auto leading-relaxed">
            Securely link your Google Business Profile with a single click to
            unlock powerful management tools.
          </p>

          {/* CTA Button */}
          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="w-full bg-[#FDE047] text-black font-bold px-8 py-4 rounded-xl hover:scale-[1.02] transition-all duration-300 text-base tracking-widest uppercase flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(253,224,71,0.3)] cursor-pointer"
          >
            <svg
              className="w-5 h-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 488 512"
              fill="currentColor"
            >
              <path d="M488 261.8C488 403.3 391.1 504 248 504C110.8 504 0 393.2 0 256S110.8 8 248 8c66.9 0 122.4 24.5 165.2 64.9l-66.8 64.9C318.6 109.9 285.1 96 248 96C150.6 96 72 174.6 72 272s78.6 176 176 176c90.1 0 148.4-51.8 160.3-124.6H248v-99.6h240C487.3 232.8 488 247.5 488 261.8z" />
            </svg>
            Connect Now ↗
          </button>
        </div>
      </div>
    </div>
  );
}
