import React from "react";
import { Wallet, Zap, Shield, TrendingUp, Info } from "lucide-react";

const WalletBenefits = React.memo(() => {
  return (
    <div className="lg:col-span-1 space-y-6">
      <div className="bg-black rounded-3xl p-8 relative overflow-hidden shadow-2xl">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-full blur-3xl -mr-16 -mt-16" />

        <div className="relative z-10">
          <div className="w-14 h-14 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-400/20 mb-6">
            <Wallet className="w-7 h-7 text-black" />
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight mb-2" style={{ fontFamily: "var(--font-heading)" }}>Wallet Benefits</h2>
          <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-8">Maximize Your Growth Potential</p>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider mb-1">Instant Activation</h3>
                <p className="text-[10px] text-slate-500 font-bold leading-relaxed">Credits are added to your secure vault immediately after verification.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider mb-1">Secure Protocol</h3>
                <p className="text-[10px] text-slate-500 font-bold leading-relaxed">Enterprise-grade encryption powered by Razorpay's security stack.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider mb-1">Scale Rewards</h3>
                <p className="text-[10px] text-slate-500 font-bold leading-relaxed">Unlock up to 20% bonus credits on strategic high-volume recharges.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Support Tooltip */}
      <div className="bg-yellow-400/5 border border-yellow-400/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <Info className="w-4 h-4 text-yellow-600" />
          <h4 className="text-[10px] font-black text-yellow-800 uppercase tracking-widest">Need Assistance?</h4>
        </div>
        <p className="text-[11px] text-slate-600 font-bold leading-relaxed">
          Facing issues with your payment? Our technical team is available 24/7 to resolve any wallet concerns.
        </p>
      </div>
    </div>
  );
});

WalletBenefits.displayName = "WalletBenefits";
export default WalletBenefits;
