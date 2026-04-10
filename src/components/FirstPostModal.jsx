import React from "react";
import { Sparkles, Wand2, X } from "lucide-react";

const FirstPostModal = ({ onClose, onCreate }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="relative bg-white border border-black/5 rounded-[2.5rem] shadow-2xl max-w-sm w-full p-8 sm:p-10 overflow-hidden animate-scaleUp">

        {/* Background Decorations */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-lemon-glow/10 rounded-full blur-3xl -mr-10 -mt-10" />
        
        {/* Subtle grid background inside modal */}
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.2) 1px, transparent 1px)",
            backgroundSize: "20px 20px"
          }}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 bg-slate-50 border border-black/5 rounded-xl text-slate-400 hover:text-black hover:bg-slate-100 transition-all z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center">

          {/* Icon */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-lemon-glow/30 rounded-full blur-xl animate-pulse" />
            <div className="relative bg-black p-4 rounded-[1.5rem] border border-black/10 shadow-xl">
              <Wand2 className="w-8 h-8 text-lemon-glow" />
            </div>
            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-lemon-hover animate-bounce" />
          </div>

          {/* Title */}
          <div className="space-y-2 mb-8">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Initialize Protocol</p>
            <h2 className="text-2xl font-black text-black uppercase tracking-tight leading-none" style={{ fontFamily: "var(--font-heading)" }}>
              Create Magic <span className="text-lemon-hover block mt-1">Post ✨</span>
            </h2>
          </div>

          {/* Steps */}
          <div className="w-full bg-slate-50 border border-black/5 rounded-[1.5rem] p-5 text-left space-y-3 mb-8 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center shrink-0">
                <span className="text-lemon-glow font-black text-[10px]">01</span>
              </div>
              <p className="text-[10px] text-black font-bold uppercase tracking-tight">Select Target Keyword</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center shrink-0">
                <span className="text-lemon-glow font-black text-[10px]">02</span>
              </div>
              <p className="text-[10px] text-black font-bold uppercase tracking-tight">Apply Brand Assets</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-lemon-glow rounded-lg flex items-center justify-center shrink-0 border border-black/10 shadow-sm">
                <span className="text-black font-black text-[10px]">03</span>
              </div>
              <p className="text-[10px] text-black font-bold uppercase tracking-tight">
                Synthesize <span className="text-lemon-hover">Instantly</span>
              </p>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={() => {
              if (onCreate) onCreate();
              onClose();
            }}
            className="btn-lemon w-full py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all"
          >
            Deploy AI Engine ↗
          </button>

        </div>
      </div>
    </div>
  );
};

export default FirstPostModal;
