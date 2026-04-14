import React from "react";
import { User, Calendar, Star, Quote } from "lucide-react";

export default function ReviewCard({ review }) {
  return (
    <div className="group relative bg-white p-6 rounded-[2rem] border border-black/5 hover:border-lemon-glow/50 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 flex flex-col h-full">
      {/* Card Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-lemon-glow font-black text-base shadow-lg group-hover:scale-110 transition-transform">
            {review.name ? (
              review.name.charAt(0).toUpperCase()
            ) : (
              <User className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-black text-[12px] uppercase tracking-tight leading-tight">
              {review.name || "Anonymous Guest"}
            </h3>
            <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              <Calendar className="w-2.5 h-2.5" />
              {new Date(review.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={10}
              className={`${i < review.rating ? "text-lemon-hover fill-lemon-hover" : "text-slate-100"}`}
            />
          ))}
        </div>
      </div>

      {/* Feedback Content */}
      <div className="flex-grow relative">
        <Quote className="absolute -top-4 -left-3 w-8 h-8 text-slate-50/80 -z-0" />
        <p className="text-slate-600 text-xs leading-relaxed relative z-10 font-medium italic">
          "{review.feedback || "The customer gave a rating but didn't leave a comment."}"
        </p>
      </div>

      {/* Footer / Origin Tag */}
      <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
        <span className="text-[8px] font-black uppercase tracking-widest text-slate-300">
          Verified Feedback
        </span>
        <span className="text-[8px] font-bold uppercase tracking-widest text-lemon-hover bg-lemon-glow/10 px-2.5 py-1 rounded-full border border-lemon-glow/20">
          {review.business || "Direct QR Scan"}
        </span>
      </div>
    </div>
  );
}