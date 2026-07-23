import { Rocket, X } from "lucide-react";
import { useEffect } from "react";
import { startGmbConnect } from "@/hooks/useGmbConnection";

function ConnectModal({ isOpen, onClose }) {
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md m-4 p-8 sm:p-12 relative transform transition-all animate-scaleUp border border-black/5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-black transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Icon */}
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-3xl bg-yellow-400/10 mb-8">
          <Rocket className="h-10 w-10 text-yellow-600" />
        </div>

        {/* Content */}
        <div className="text-center">
          <h2
            className="text-3xl font-bold text-black mb-4 uppercase tracking-tighter leading-none"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Connect Your <span className="text-yellow-500">Business</span>
          </h2>
          <p className="text-slate-500 mb-10 text-sm font-semibold leading-relaxed max-w-sm mx-auto">
            Securely link your Google Business Profile with a single click to
            unlock powerful management tools.
          </p>

          {/* CTA Button */}
          <button
            onClick={() => startGmbConnect("/dashboard").catch((err) => console.error(err))}
            className="btn-lemon w-full py-5 rounded-2xl text-base uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02]"
          >
            <svg
              className="w-6 h-6"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 488 512"
              fill="currentColor"
            >
              <path d="M488 261.8C488 403.3 391.1 504 248 504C110.8 504 0 393.2 0 256S110.8 8 248 8c66.9 0 122.4 24.5 165.2 64.9l-66.8 64.9C318.6 109.9 285.1 96 248 96C150.6 96 72 174.6 72 272s78.6 176 176 176c90.1 0 148.4-51.8 160.3-124.6H248v-99.6h240C487.3 232.8 488 247.5 488 261.8z" />
            </svg>
            Connect Business
          </button>
        </div>
      </div>
    </div>
  );
}


export default ConnectModal;