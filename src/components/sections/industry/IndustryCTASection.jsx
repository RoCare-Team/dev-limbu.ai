import React from "react";
import { ArrowRight, MousePointer2, ShieldCheck, Zap, MessageSquare } from "lucide-react";

export default function IndustryCTASection({ industryName, whatsappLink }) {
  return (
    <section className="py-10 lg:py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-slate-50 border-t border-slate-100">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-lemon-glow/10 blur-[100px] rounded-full translate-x-1/4 -translate-y-1/4 pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10 text-center">
        <h2 className="text-xl sm:text-3xl lg:text-4xl font-black text-black tracking-tight mb-6 font-heading leading-tight">
          Ready to automate your <span className="text-lemon-hover">{industryName}</span> growth?
        </h2>
        <p className="text-base sm:text-lg text-slate-600 mb-8 max-w-2xl mx-auto font-bold opacity-90">
          Join hundreds of successful businesses who use Limbu AI.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
          <a
            href={whatsappLink}
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto btn-lemon px-7 py-3.5 rounded-xl text-sm font-black shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2.5 group"
          >
            Get Started For Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
          <div className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2">
            <MousePointer2 className="w-4 h-4" />
            No Credit Card Required
          </div>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-6 opacity-80 grayscale hover:grayscale-0 transition-all">
          <div className="flex items-center gap-1.5 text-slate-800 font-black text-[10px] uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4 text-lemon-hover" />
            Secure
          </div>
          <div className="flex items-center gap-1.5 text-slate-800 font-black text-[10px] uppercase tracking-widest">
            <Zap className="w-4 h-4 text-lemon-hover" />
            Instant
          </div>
          <div className="flex items-center gap-1.5 text-slate-800 font-black text-[10px] uppercase tracking-widest">
            <MessageSquare className="w-4 h-4 text-lemon-hover" />
            Support
          </div>
        </div>
      </div>
    </section>
  );
}
