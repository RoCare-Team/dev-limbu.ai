import { LogOut, ShieldAlert, X } from "lucide-react";

function SessionExpiredModal({ isOpen, onLogin, onClose }) {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-[2.5rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.15)] w-full max-w-md p-8 md:p-12 border border-black/[0.03] overflow-hidden text-center animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close — user dashboard par rehkar baaki kaam kar sake */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-5 right-5 z-20 w-9 h-9 rounded-full flex items-center justify-center text-black/40 hover:text-black hover:bg-black/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* ── Subtle background grid ── */}
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(15, 23, 42, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.2) 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />

        {/* Ambient Red Glow */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-red-500/5 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8 bg-red-50 border border-red-100">
            <ShieldAlert size={12} className="text-red-500" />
            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-red-600">
              Security Protocol
            </span>
          </div>

          <div className="w-20 h-20 rounded-[1.5rem] bg-red-50 flex items-center justify-center mb-8 border border-red-100 shadow-sm">
            <LogOut className="h-10 w-10 text-red-500" />
          </div>

          <h2 className="text-2xl md:text-3xl font-black text-black mb-4 uppercase tracking-tight font-heading leading-tight">
            Reconnect <span className="text-red-500">Google</span>
          </h2>

          {/* Ab ye app logout nahi hai — sirf GMB ka access dobara chahiye. */}
          <p className="text-black/50 mb-10 text-sm font-medium font-inter leading-relaxed px-4">
            Your Google Business Profile access has expired. You are still
            signed in — just reconnect Google to continue.
          </p>

          <button
            onClick={onLogin}
            className="w-full py-5 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] shadow-xl hover:bg-lemon-glow hover:text-black transition-all group"
          >
            Reconnect Now{" "}
            <span className="inline-block transition-transform group-hover:translate-x-1">
              ↗
            </span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="mt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-black/40 hover:text-black transition-colors"
            >
              Maybe Later
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


export default SessionExpiredModal;