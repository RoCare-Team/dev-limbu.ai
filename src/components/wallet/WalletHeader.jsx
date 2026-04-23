import React from "react";
import { ArrowLeft, History } from "lucide-react";

const WalletHeader = React.memo(({ goBack, onHistoryClick }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
      <div className="flex items-center gap-4">
        <button
          onClick={goBack}
          className="p-2.5 rounded-xl border border-black/5 bg-white hover:bg-slate-50 transition-all shadow-sm group"
        >
          <ArrowLeft className="w-5 h-5 text-black group-hover:-translate-x-1 transition-transform" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-tighter leading-none mb-1" style={{ fontFamily: "var(--font-heading)" }}>
            Your <span className="text-yellow-500">Wallet</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Manage Your Digital Credits</p>
        </div>
      </div>

      <button
        onClick={onHistoryClick}
        className="btn-ghost px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2"
      >
        <History className="w-4 h-4" />
        Transaction History
      </button>
    </div>
  );
});

WalletHeader.displayName = "WalletHeader";
export default WalletHeader;