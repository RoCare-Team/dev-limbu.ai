import React from "react";
import { Star } from "lucide-react";

export default function ReviewStats({ total, avg }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white p-5 rounded-[1.5rem] border border-black/5 shadow-sm hover:shadow-md transition-all min-w-[140px]">
        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mb-1">
          Total Reviews
        </p>
        <p className="text-2xl font-black text-black" style={{ fontFamily: "var(--font-heading)" }}>
          {total}
        </p>
      </div>

      <div className="bg-white p-5 rounded-[1.5rem] border border-lemon-glow/20 shadow-sm hover:shadow-lemon/10 transition-all min-w-[140px]">
        <div className="flex items-center gap-1 mb-1">
          <Star className="w-2.5 h-2.5 text-lemon-hover fill-current" />
          <p className="text-[8px] text-lemon-hover font-bold uppercase tracking-widest">
            Average Rating
          </p>
        </div>
        <p className="text-2xl font-black text-black" style={{ fontFamily: "var(--font-heading)" }}>
          {avg}
        </p>
      </div>
    </div>
  );
}