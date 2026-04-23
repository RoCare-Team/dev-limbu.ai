import React from "react";
import { User, Mail, Phone, CalendarDays } from "lucide-react";

const InfoRow = React.memo(({ icon, label, value }) => (
  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-black/5 hover:border-black/10 transition-all shadow-sm">
    <div className="p-1.5 bg-slate-50 rounded-lg border border-black/5 text-black">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
        {label}
      </p>
      <p className="text-[10px] font-bold text-black truncate">
        {value || "N/A"}
      </p>
    </div>
  </div>
));
InfoRow.displayName = "InfoRow";

const AccountDetails = React.memo(({ email, phone, paidPackage, planDuration, expiry }) => {
  return (
    <div className="lg:col-span-4 space-y-8">
      {/* Contact Info */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-black/5 p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-8">
          <div className="p-1.5 bg-slate-50 rounded-lg border border-black/5">
            <User className="w-3.5 h-3.5 text-black" />
          </div>
          <h3
            className="text-[11px] font-bold text-black uppercase tracking-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Contact Information
          </h3>
        </div>
        
        <div className="space-y-6">
          <div className="flex items-start gap-4 group cursor-default">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-black/5 text-slate-400 group-hover:text-black group-hover:bg-lemon-glow/20 transition-all shadow-sm">
              <Mail className="w-4 h-4" />
            </div>
            <div className="flex-1 border-b border-black/5 pb-4 group-last:border-0">
              <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                Verified Email
              </p>
              <p className="text-[11px] font-black text-black break-all uppercase tracking-tight">
                {email || "Not Provided"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 group cursor-default">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-black/5 text-slate-400 group-hover:text-black group-hover:bg-lemon-glow/20 transition-all shadow-sm">
              <Phone className="w-4 h-4" />
            </div>
            <div className="flex-1 border-b border-black/5 pb-4 last:border-0 last:pb-0">
              <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                Mobile Identifier
              </p>
              <p className="text-[11px] font-black text-black uppercase tracking-tight">
                {phone || "Not Provided"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Plan Details */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-black/5 p-6 sm:p-8 relative overflow-hidden group transition-all hover:shadow-md">
        {/* Subtle Decorative Pattern */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-lemon-glow/5 rounded-full blur-2xl -mr-16 -mt-16 transition-all group-hover:bg-lemon-glow/10" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-black rounded-lg shadow-sm">
                <CalendarDays className="w-3.5 h-3.5 text-lemon-glow" />
              </div>
              <h3
                className="text-[11px] font-bold text-black uppercase tracking-tight"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Membership Status
              </h3>
            </div>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors ${
              paidPackage !== "No active plan" 
                ? "bg-green-50 border-green-100 text-green-600" 
                : "bg-amber-50 border-amber-100 text-amber-600"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                paidPackage !== "No active plan" ? "bg-green-500" : "bg-amber-500"
              }`} />
              <span className="text-[8px] font-black uppercase tracking-widest">
                {paidPackage !== "No active plan" ? "Live & Active" : "Waiting for Plan"}
              </span>
            </div>
          </div>

          <div className="bg-slate-50/50 border border-black/5 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-lemon-hover" />
            
            <h4 className="text-lg font-black text-black uppercase tracking-tight mb-4 leading-tight">
              {paidPackage === "No active plan" ? "Basic Free Access" : paidPackage}
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Billing Cycle
                </p>
                <p className="text-[10px] font-black text-black uppercase">
                  {planDuration || "N/A"}
                </p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Access Until
                </p>
                <p className="text-[10px] font-black text-black uppercase">
                  {expiry || "Never"}
                </p>
              </div>
            </div>
          </div>
          
          {paidPackage === "No active plan" && (
            <p className="mt-4 text-[9px] font-bold text-slate-400 leading-relaxed italic">
              Upgrade to a premium plan to unlock full AI automation features.
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

AccountDetails.displayName = "AccountDetails";
export default AccountDetails;
