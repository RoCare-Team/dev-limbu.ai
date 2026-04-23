import React from "react";
import { Sparkles, Award, Activity, Coins } from "lucide-react";

const ProfileHeader = React.memo(({ fullName, wallet, onActivityClick, onWalletClick }) => {
  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-black/5 p-6 sm:p-8 overflow-hidden relative group transition-all hover:shadow-md">
      <div className="absolute top-0 right-0 w-64 h-64 bg-lemon-glow/5 rounded-full blur-3xl -mr-20 -mt-20 transition-all group-hover:bg-lemon-glow/10"></div>

      <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 sm:gap-10">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-2xl bg-black flex items-center justify-center text-lemon-glow text-3xl font-black shadow-xl border border-black/5">
            {fullName?.charAt(0).toUpperCase()}
          </div>
          <div className="absolute -bottom-2 -right-2 bg-white w-7 h-7 rounded-xl border border-black/5 flex items-center justify-center shadow-md">
            <Sparkles className="w-4 h-4 text-lemon-hover" />
          </div>
        </div>

        {/* User Info */}
        <div className="text-center md:text-left flex-1">
          <h1
            className="text-xl sm:text-2xl font-black text-black uppercase tracking-tight mb-1"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {fullName}
          </h1>
          <div className="flex items-center justify-center md:justify-start gap-2 mb-6">
            <Award className="w-3 h-3 text-lemon-hover" />
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Verified User Profile
            </span>
          </div>
          <button
            onClick={onActivityClick}
            className="btn-lemon px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest gap-2 mx-auto md:mx-0 shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Activity className="w-3.5 h-3.5" />
            View Activity ↗
          </button>
        </div>

        {/* Wallet Quick Access */}
        <div className="bg-slate-50 border border-black/5 rounded-2xl p-5 shrink-0 min-w-[180px] text-center md:text-right">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
            Available Credits
          </p>
          <div className="flex items-center justify-center md:justify-end gap-2 mb-4">
            <Coins className="text-lemon-hover w-5 h-5" />
            <span
              className="text-2xl font-black text-black tracking-tighter"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {wallet}
            </span>
          </div>
          <button
            onClick={onWalletClick}
            className="w-full btn-ghost py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border-black/10 text-black hover:bg-black hover:text-lemon-glow hover:border-black transition-all"
          >
            Manage Wallet
          </button>
        </div>
      </div>
    </div>
  );
});

ProfileHeader.displayName = "ProfileHeader";
export default ProfileHeader;
