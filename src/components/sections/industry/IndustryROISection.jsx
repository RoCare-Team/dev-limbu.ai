import React from "react";
import { TrendingUp } from "lucide-react";

export default function IndustryROISection({ industryName, heroimage2 }) {
  return (
    <section className="py-12 lg:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-50 overflow-hidden">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

        <div className="order-2 lg:order-1 relative group">
          <div className="absolute -inset-4 bg-lemon-glow/10 blur-2xl rounded-[3rem] group-hover:bg-lemon-glow/20 transition-all duration-700 -z-10" />
          <img
            src={heroimage2}
            alt={`${industryName} GMB Growth`}
            className="rounded-3xl shadow-2xl border border-slate-100 group-hover:scale-[1.01] transition-transform duration-500 w-full object-cover"
          />

          {/* Floating Metric Card */}
          <div className="absolute -bottom-6 -right-6 bg-black text-white p-6 rounded-2xl shadow-2xl hidden sm:block animate-bounce-slow">
            <div className="text-[10px] font-bold text-lemon-hover uppercase tracking-widest mb-1">Market Reach</div>
            <div className="text-2xl font-black">85% of Locals</div>
            <div className="text-xs font-medium text-slate-400">Search on Google Maps</div>
          </div>
        </div>

        <div className="order-1 lg:order-2 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-100">
            <TrendingUp className="w-4 h-4 text-lemon-hover" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Revenue Opportunity</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-black tracking-tight font-heading leading-tight">
            How Many New <span className="text-lemon-hover">Clients Are You Missing?</span>
          </h2>

          <div className="space-y-4 text-slate-600 font-medium text-base sm:text-lg leading-relaxed">
            <p>
              Did you know that for <span className="text-black font-bold">{industryName}</span>, over 85% of discovery happens directly on Google Maps? If you aren't in the Top 3, you're invisible.
            </p>
            <p>
              Limbu AI doesn't just manage your profile—it aggressively pushes you to the top. Our users typically see a <span className="text-black font-bold">3x increase in phone calls</span> and direction requests within the first 90 days.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 transition-all hover:border-lemon-glow/40 hover:bg-lemon-glow/5">
              <div className="text-2xl sm:text-3xl font-black text-black">300%</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Avg. Reach Boost</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 transition-all hover:border-lemon-glow/40 hover:bg-lemon-glow/5">
              <div className="text-2xl sm:text-3xl font-black text-black">20+ hrs</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Saved Per Month</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
