import React from "react";
import { Sparkles, Wand2, X, Megaphone, Palette, Zap } from "lucide-react";

const FirstPostModal = ({ onClose, onCreate }) => {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="relative bg-white border border-black/[0.03] rounded-[2.5rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.15)] max-w-md w-full p-8 sm:p-12 overflow-hidden animate-in zoom-in-95 duration-300">

        {/* Background Decorations */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-lemon-glow/10 rounded-full blur-3xl -mr-12 -mt-12" />
        
        {/* Subtle grid background */}
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.2) 1px, transparent 1px)",
            backgroundSize: "24px 24px"
          }}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2.5 bg-slate-50 border border-black/5 rounded-2xl text-slate-400 hover:text-black hover:bg-slate-100 transition-all z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center">

          {/* Icon Header */}
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-lemon-glow/40 rounded-full blur-2xl animate-pulse" />
            <div className="relative bg-black p-5 rounded-[1.5rem] border border-black/10 shadow-2xl">
              <Wand2 className="w-10 h-10 text-lemon-glow" />
            </div>
            <div className="absolute -top-3 -right-3 w-10 h-10 bg-white rounded-full shadow-lg border border-black/[0.03] flex items-center justify-center animate-bounce">
              <Sparkles className="w-6 h-6 text-lemon-hover" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-3 mb-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Let's Get Started</p>
            <h2 className="text-3xl font-black text-black uppercase tracking-tight leading-[0.95] font-heading">
              Make Your First <span className="text-lemon-hover block mt-2">Magic Post ✨</span>
            </h2>
            <p className="text-sm text-black/50 font-medium font-inter px-4 leading-relaxed mt-4">
              Connect with your local customers in 3 simple steps. No design skills needed!
            </p>
          </div>

          {/* Layman Steps Layout */}
          <div className="w-full bg-slate-50 border border-black/[0.03] rounded-[2rem] p-6 text-left space-y-4 mb-10 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-white rounded-xl border border-black/5 flex items-center justify-center shrink-0 shadow-sm">
                <Megaphone className="w-4 h-4 text-lemon-hover" />
              </div>
              <div>
                <p className="text-[11px] font-black text-black uppercase tracking-tight">Step 1: Pick a Topic</p>
                <p className="text-[10px] text-black/40 font-inter leading-tight">Tell the AI what you want to tell your customers today.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-white rounded-xl border border-black/5 flex items-center justify-center shrink-0 shadow-sm">
                <Palette className="w-4 h-4 text-lemon-hover" />
              </div>
              <div>
                <p className="text-[11px] font-black text-black uppercase tracking-tight">Step 2: Add Your Style</p>
                <p className="text-[10px] text-black/40 font-inter leading-tight">Upload your logo or a photo of your shop and products.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-lemon-glow/10 rounded-xl border border-lemon-glow/20 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-lemon-hover animate-pulse" />
              </div>
              <div>
                <p className="text-[11px] font-black text-black uppercase tracking-tight">Step 3: Watch the Magic</p>
                <p className="text-[10px] text-black/40 font-inter leading-tight">Limbu AI creates a professional post for you in seconds!</p>
              </div>
            </div>
          </div>

          {/* Primary Action */}
          <button
            onClick={() => {
              if (onCreate) onCreate();
              onClose();
            }}
            className="w-full py-5 bg-lemon-glow text-black rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-lemon-glow/20 hover:bg-lemon-hover hover:scale-[1.02] active:scale-[0.98] transition-all font-inter"
          >
            Create My First Post Now ↗
          </button>

        </div>
      </div>
    </div>
  );
};

export default FirstPostModal;
