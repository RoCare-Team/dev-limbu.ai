import React from "react";
import { Sparkles, IndianRupee, Info, FileText, Coins, Loader2 } from "lucide-react";

const RechargeEngine = React.memo(({
  presetAmounts,
  amount,
  setAmount,
  gstNumber,
  setGstNumber,
  gstAmount,
  totalAmount,
  coins,
  loading,
  handleRecharge,
}) => {
  return (
    <div className="lg:col-span-2 space-y-6">
      <div className="bg-white border border-black/5 rounded-3xl p-6 sm:p-10 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-slate-50 rounded-lg border border-black/5">
            <Sparkles className="w-5 h-5 text-yellow-500" />
          </div>
          <h2 className="text-lg font-black text-black uppercase tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>Select Recharge Amount</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 mb-10">
          {presetAmounts.map((pkg, i) => (
            <button
              key={i}
              onClick={() => setAmount(pkg.price)}
              className={`relative border-2 rounded-2xl p-5 flex flex-col items-center gap-3 transition-all duration-300 ${amount === pkg.price
                ? "border-black bg-black text-yellow-400 shadow-xl shadow-black/10 scale-105"
                : "border-slate-100 bg-white text-slate-400 hover:border-yellow-400 hover:text-black"
                }`}
            >
              {pkg.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] shadow-lg whitespace-nowrap">
                  Most Popular
                </span>
              )}
              {pkg.bonus && (
                <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider whitespace-nowrap border-2 border-white">
                  {pkg.bonus}
                </span>
              )}
              <IndianRupee className="w-5 h-5" />
              <span className="font-black text-xl leading-none">₹{pkg.price}</span>
              <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">{pkg.coins} Credits</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Custom Amount (₹)</label>
            <div className="relative">
              <input
                type="number"
                min="200"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="input w-full pl-12 py-4 text-lg font-black"
                placeholder="0.00"
              />
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Info className="w-3 h-3" />
              Min: ₹200 • {amount >= 5000 ? "20% Bonus Active" : "1:1 Ratio"}
            </p>
          </div>

          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">GST Number (For Business)</label>
            <div className="relative">
              <input
                type="text"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                className="input w-full pl-12 py-4 text-base font-bold uppercase tracking-widest"
                placeholder="ENTER GST NUMBER"
                maxLength="15"
              />
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-slate-50 border border-black/5 rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-4 h-4 text-black" />
            <h3 className="text-sm font-black text-black uppercase tracking-widest">Order Summary</h3>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-slate-500">
              <span>Recharge Value</span>
              <span className="text-black">₹{amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-slate-400">
              <span>GST (18%)</span>
              <span className="text-black">₹{gstAmount}</span>
            </div>
            <div className="pt-4 border-t border-black/5 flex justify-between items-center">
              <span className="text-sm font-black text-black uppercase tracking-widest">Total Payable</span>
              <span className="text-3xl font-black text-black">₹{totalAmount}</span>
            </div>
          </div>

          <div className="bg-white border border-black/5 rounded-2xl p-4 flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-400/10 rounded-xl flex items-center justify-center">
                <Coins className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vault Deposit</p>
                <p className="text-lg font-black text-black">{coins} <span className="text-[10px] opacity-40">CREDITS</span></p>
              </div>
            </div>
            {amount >= 5000 && (
              <div className="bg-green-50 px-3 py-1 rounded-full border border-green-100">
                <p className="text-[8px] font-black text-green-600 uppercase tracking-widest">Bonus Applied</p>
              </div>
            )}
          </div>

          <button
            onClick={handleRecharge}
            disabled={loading}
            className="btn-lemon w-full py-5 rounded-2xl text-base uppercase font-black tracking-widest shadow-xl hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Initializing Payment...
              </>
            ) : (
              <>
                Recharge Wallet Now ↗
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

RechargeEngine.displayName = "RechargeEngine";
export default RechargeEngine;
