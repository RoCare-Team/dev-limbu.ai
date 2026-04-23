import React from "react";
import { CheckCircle, Coins } from "lucide-react";

const SuccessModal = React.memo(({
  showSuccess,
  totalAmount,
  coins,
  onDashboardRedirect
}) => {
  if (!showSuccess) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-fadeIn">
      <div className="bg-white rounded-[2.5rem] p-10 text-center w-full max-w-md shadow-2xl border border-black/5 animate-scaleUp">
        <div className="w-24 h-24 bg-yellow-400 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-yellow-400/20">
          <CheckCircle className="w-12 h-12 text-black" />
        </div>

        <h2 className="text-2xl font-black text-black uppercase tracking-tighter mb-2" style={{ fontFamily: "var(--font-heading)" }}>Payment Successful</h2>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-10">Vault Balance Synchronized</p>

        <div className="bg-slate-50 border border-black/5 rounded-3xl p-8 mb-10">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Credits Added</p>
          <p className="text-4xl font-black text-black mb-4">
            ₹{totalAmount}
          </p>
          <div className="flex items-center justify-center gap-3 text-yellow-600">
            <Coins className="w-5 h-5" />
            <span className="text-lg font-black">{coins} COINS</span>
          </div>
        </div>

        <button
          onClick={onDashboardRedirect}
          className="btn-lemon w-full py-4 rounded-xl text-xs uppercase font-black tracking-widest"
        >
          Enter Dashboard ↗
        </button>
      </div>
    </div>
  );
});

SuccessModal.displayName = "SuccessModal";
export default SuccessModal;
