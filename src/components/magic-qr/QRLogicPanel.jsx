import React from "react";
import { MessageSquare, Star, Share2, Check, Copy, Zap } from "lucide-react";

export default function QRLogicPanel({ 
  reviewUrl, 
  copied, 
  copyToClipboard, 
  shareLink, 
  setShowDemo 
}) {
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-black/5 p-6 sm:p-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-lemon-glow rounded-xl">
              <MessageSquare className="text-black w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-black uppercase tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>Review Filter</h3>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Active Protection</p>
            </div>
          </div>
          <button onClick={() => setShowDemo(true)} className="text-[9px] font-black text-lemon-hover uppercase tracking-widest hover:underline">How this works?</button>
        </div>

        <div className="space-y-3 mb-8">
          <div className="group bg-slate-50 border border-black/5 p-4 rounded-xl transition-all hover:bg-black">
            <div className="flex items-center justify-between mb-2">
               <div className="flex gap-0.5">
                 {[1,2,3].map(i => <Star key={i} size={12} className="text-lemon-hover group-hover:text-lemon-glow" fill="currentColor" />)}
               </div>
               <span className="text-[8px] font-black bg-white/10 text-slate-400 group-hover:text-lemon-glow px-2 py-0.5 rounded-full uppercase tracking-widest">Private</span>
            </div>
            <p className="text-[10px] font-medium text-slate-500 group-hover:text-slate-300 leading-relaxed">
              Unhappy customers can message you privately, so your public Google rating stays safe.
            </p>
          </div>

          <div className="group bg-lemon-glow/5 border border-lemon-glow/10 p-4 rounded-xl transition-all hover:bg-lemon-glow">
            <div className="flex items-center justify-between mb-2">
               <div className="flex gap-0.5">
                 {[1,2,3,4,5].map(i => <Star key={i} size={12} className="text-lemon-hover group-hover:text-black" fill="currentColor" />)}
               </div>
               <span className="text-[8px] font-black bg-black/5 text-lemon-hover group-hover:text-black px-2 py-0.5 rounded-full uppercase tracking-widest">Public</span>
            </div>
            <p className="text-[10px] font-medium text-lemon-hover group-hover:text-black leading-relaxed">
              Happy customers are automatically sent to your Google page to leave a 5-star review.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-black/5 space-y-4">
          <div className="flex items-center gap-3">
            <Share2 size={14} className="text-black" />
            <span className="text-[9px] font-black text-black uppercase tracking-widest">Your Review Link</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-black/5">
            <code className="flex-1 text-[9px] font-bold text-slate-400 truncate px-2">{reviewUrl}</code>
            <button
              onClick={copyToClipboard}
              title="Copy Link"
              className={`p-2 rounded-lg transition-all ${copied ? "bg-green-500 text-white" : "bg-white hover:bg-lemon-glow hover:text-black border border-black/5"}`}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>

          <button onClick={shareLink} className="w-full btn-lemon py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">
            Send Link to Customers ↗
          </button>
        </div>
      </div>

      {/* Hint Box */}
      <div className="bg-black rounded-3xl p-6 relative overflow-hidden shadow-xl">
         <div className="absolute top-0 right-0 w-32 h-32 bg-lemon-glow/5 rounded-full blur-3xl" />
         <div className="relative z-10 flex items-start gap-4">
            <div className="p-2 bg-lemon-glow rounded-lg shrink-0">
              <Zap size={14} className="text-black fill-black" />
            </div>
            <div>
              <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Quick Tip</h4>
              <p className="text-[9px] font-bold text-slate-500 leading-relaxed">
                Show this QR code to your customers after their purchase to get more 5-star reviews!
              </p>
            </div>
         </div>
      </div>
    </div>
  );
}