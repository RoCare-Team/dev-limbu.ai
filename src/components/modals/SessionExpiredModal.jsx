import { LogOut } from "lucide-react";

export default function SessionExpiredModal({ isOpen, onLogin }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#0e0e0e]/95 backdrop-blur-xl border border-[#FDE047]/30 rounded-2xl shadow-[0_0_50px_rgba(253,224,71,0.15)] w-full max-w-md p-8 text-center relative animate-scaleUp">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-[#FDE047]/10 border border-[#FDE047]/20 mb-6 shadow-[0_0_20px_rgba(253,224,71,0.2)]">
          <LogOut className="h-8 w-8 text-[#FDE047]" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-wide">
          Session Expired
        </h2>
        <p className="text-slate-400 mb-8 font-medium">
          Please sign in again to continue managing your business.
        </p>
        <button
          onClick={onLogin}
          className="w-full bg-[#FDE047] text-black font-bold py-3.5 rounded-xl hover:scale-[1.02] transition-all duration-300 shadow-[0_0_20px_rgba(253,224,71,0.3)] uppercase tracking-widest text-sm"
        >
          Sign In Again
        </button>
      </div>
    </div>
  );
}
