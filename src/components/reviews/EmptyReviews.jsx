import React from "react";
import { Store, ArrowRight, Quote } from "lucide-react";
import { useRouter } from "next/navigation";

export default function EmptyReviews({ businessName }) {
  const router = useRouter();

  if (!businessName) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-md bg-white shadow-2xl rounded-[2rem] p-10 border border-black/5 text-center transition-all duration-500 hover:shadow-lemon">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-black/5">
            <Store className="w-8 h-8 text-slate-200" />
          </div>
          <h2 className="text-xl font-bold text-black mb-3 uppercase tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
            Business Needed
          </h2>
          <p className="text-slate-500 mb-8 font-medium text-[11px] leading-relaxed">
            Please connect your Google Business Profile first to see your customer reviews.
          </p>
          <button
            onClick={() => router.push("/get-magic-qr")}
            className="w-full btn-lemon px-8 py-4 rounded-xl font-black uppercase tracking-widest text-[9px] shadow-lg"
          >
            Connect Business <ArrowRight className="inline-block w-3 h-3 ml-2" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-200">
      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-black/5">
        <Quote className="w-8 h-8 text-slate-100" />
      </div>
      <h3 className="text-sm font-bold text-black uppercase tracking-tight mb-2" style={{ fontFamily: "var(--font-heading)" }}>
        No Reviews Yet
      </h3>
      <p className="text-slate-400 font-medium text-[10px]">
        Share your Magic QR code with customers to start seeing feedback here!
      </p>
    </div>
  );
}