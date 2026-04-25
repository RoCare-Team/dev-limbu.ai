"use client";

import {
  Store,
  ArrowLeft,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { Toaster } from "react-hot-toast";
import SupportModal from "@/components/SupportModal";
import { useCustomerReviews } from "@/hooks/useCustomerReviews";

// Sub-components
import ReviewStats from "@/components/reviews/ReviewStats";
import ReviewCard from "@/components/reviews/ReviewCard";
import EmptyReviews from "@/components/reviews/EmptyReviews";
import WhatsAppButton from "@/components/WhatsAppButton";

export default function ReviewsPage() {
  const {
    isMounted,
    businessName,
    reviews,
    loading,
    error,
    stats
  } = useCustomerReviews();

  if (!isMounted) return null;

  return (
    <div className="relative w-full min-h-screen overflow-hidden m-0 p-0" style={{ backgroundColor: "var(--background)" }}>
      <Toaster position="top-center" />

      {/* ── Background Design ── */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15, 23, 42, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.2) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div
        className="pointer-events-none absolute top-0 right-0 w-[500px] h-[400px] z-0 opacity-10"
        style={{
          background:
            "radial-gradient(ellipse at top right, rgba(250, 204, 21, 0.3) 0%, transparent 65%)",
        }}
      />

      {/* Header */}
      <div className="relative z-30 bg-white/80 backdrop-blur-md border-b border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="p-2 rounded-xl border border-black/5 hover:bg-slate-50 transition-all">
                <ArrowLeft className="w-4 h-4 text-black" />
              </Link>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-black uppercase tracking-tighter leading-none mb-1" style={{ fontFamily: "var(--font-heading)" }}>
                  Customer <span className="text-lemon-hover">Feedback</span>
                </h1>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">Your Reputation Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-lemon-glow/20 bg-lemon-glow/10">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-lemon-hover" />
                <span className="text-[8px] font-bold uppercase text-lemon-hover tracking-widest">Live Updates</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {!businessName ? (
          <EmptyReviews businessName={null} />
        ) : (
          <div className="space-y-10">
            {/* Business Info & Stats */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              <div className="space-y-4">
                <p className="text-slate-500 font-bold flex items-center gap-2 text-[10px] uppercase tracking-widest">
                  <Store className="w-3.5 h-3.5 text-lemon-hover" />
                  Showing feedback for: {businessName}
                </p>
                <div className="bg-black text-white p-4 rounded-2xl border border-lemon-glow/20 shadow-xl flex items-start gap-3 max-w-lg">
                  <div className="p-1.5 bg-lemon-glow rounded-lg shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-black fill-black" />
                  </div>
                  <p className="text-[10px] font-medium text-slate-300 leading-relaxed">
                    We are tracking your customer reviews in real-time. Reviews collected through your QR code are protected by our smart filter.
                  </p>
                </div>
              </div>

              <ReviewStats total={stats.total} avg={stats.avg} />
            </div>

            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white h-[280px] rounded-2xl border border-black/5 animate-pulse shadow-sm" />
                ))}
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 p-6 rounded-2xl text-center font-bold border border-red-100 uppercase tracking-widest text-[10px]">
                {error}
              </div>
            )}

            {!loading && !error && (
              <>
                {reviews.length === 0 ? (
                  <EmptyReviews businessName={businessName} />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                    {reviews.map((r) => (
                      <ReviewCard key={r._id} review={r} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* <SupportModal /> */}
      <WhatsAppButton/>
    </div>
  );
}