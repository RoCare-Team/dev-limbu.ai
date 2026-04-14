import React from "react";
import { Star } from "lucide-react";

export default function LogicDemoModal({ setShowDemo }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-black/5 animate-scaleUp">
        <h2 className="text-lg font-black text-black text-center mb-6 uppercase tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
          How the <span className="text-lemon-hover">Review Filter</span> Works
        </h2>

        <div className="space-y-4 mb-8">
          <div className="flex gap-4 items-start p-4 bg-slate-50 rounded-xl border border-black/5">
            <div className="flex gap-0.5 mt-1 shrink-0">
              {[1, 2, 3].map(n => <Star key={n} size={10} className="text-slate-300" fill="currentColor" />)}
            </div>
            <div className="flex-1">
              <p className="font-black text-black text-[10px] uppercase tracking-tight mb-1">Unhappy Customers (1-3 Stars)</p>
              <p className="text-[9px] font-medium text-slate-400 leading-relaxed">Their feedback is sent only to you privately, giving you a chance to fix the issue instead of getting a bad public review.</p>
            </div>
          </div>

          <div className="flex gap-4 items-start p-4 bg-lemon-glow/5 rounded-xl border border-lemon-glow/10">
            <div className="flex gap-0.5 mt-1 shrink-0">
              {[1, 2, 3, 4, 5].map(n => <Star key={n} size={10} className="text-lemon-hover" fill="currentColor" />)}
            </div>
            <div className="flex-1">
              <p className="font-black text-lemon-hover text-[10px] uppercase tracking-tight mb-1">Happy Customers (4-5 Stars)</p>
              <p className="text-[9px] font-medium text-slate-400 leading-relaxed">They are sent directly to your Google page to leave a public 5-star review for everyone to see.</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowDemo(false)}
          className="btn-ghost w-full py-3 rounded-xl text-[9px] font-black uppercase tracking-widest"
        >
          Close
        </button>
      </div>
    </div>
  );
}