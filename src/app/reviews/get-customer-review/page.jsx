"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Star,
  MessageSquare,
  User,
  Calendar,
  Store,
  Quote,
  ArrowRight,
  ArrowLeft,
  Sparkles
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast, Toaster } from "react-hot-toast";
import SupportModal from "@/components/SupportModal";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // ---------------- READ BUSINESS NAME ----------------
  const getBusinessName = () => {
    try {
      const raw = localStorage.getItem("locationDetails");
      if (!raw) return "";
      const parsed = JSON.parse(raw);
      return parsed[0]?.title || "";
    } catch (e) {
      console.error("localStorage error", e);
      return "";
    }
  };

  // ---------------- AUTO FETCH ON PAGE LOAD ----------------
  useEffect(() => {
    fetchReviews();
  }, []);

  const showToast = (message, type) => {
    if (type === "error") {
      toast.error(message);
    } else if (type === "success") {
      toast.success(message);
    } else {
      toast(message);
    }
  };

  // ---------------- FETCH REVIEWS ----------------
  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError("");

      const business = getBusinessName();
      if (!business) return;

      const res = await fetch(
        `/api/customer-review?business=${encodeURIComponent(business)}`,
      );
      const data = await res.json();

      if (!data.success) {
        setError("Something went wrong!");
        return;
      }

      setReviews(data.reviews);
    } catch (err) {
      console.error(err);
      setError("Server error");
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = reviews.length;
    const avg =
      total > 0
        ? (
            reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / total
          ).toFixed(1)
        : 0;
    return { total, avg };
  }, [reviews]);

  const businessName = getBusinessName();

  return (
    <div className="relative w-full min-h-screen overflow-hidden m-0 p-0" style={{ backgroundColor: "var(--background)" }}>
      <Toaster position="top-center" />

      {/* ── Subtle background grid ── */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15, 23, 42, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.2) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* ── Ambient glows ── */}
      <div
        className="pointer-events-none absolute top-0 right-0 w-[500px] h-[400px] z-0 opacity-10"
        style={{
          background:
            "radial-gradient(ellipse at top right, rgba(250, 204, 21, 0.3) 0%, transparent 65%)",
        }}
      />
      
      {/* Page Header - Non-sticky */}
      <div className="relative z-30 bg-white/80 backdrop-blur-md border-b border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="p-2 rounded-xl border border-black/5 hover:bg-slate-50 transition-all">
                <ArrowLeft className="w-4 h-4 text-black" />
              </Link>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-black uppercase tracking-tighter leading-none mb-1" style={{ fontFamily: "var(--font-heading)" }}>
                  Social <span className="text-lemon-hover">Proof</span>
                </h1>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">Customer Sentiment Hub</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-lemon-glow/20 bg-lemon-glow/10">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-lemon-hover" />
                <span className="text-[8px] font-bold uppercase text-lemon-hover tracking-widest">Live Monitoring</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {/* ---------------- IF BUSINESS NOT SELECTED ---------------- */}
        {!businessName && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-full max-w-md bg-white shadow-2xl rounded-[2rem] p-10 border border-black/5 text-center transition-all duration-500 hover:shadow-lemon">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-black/5">
                <Store className="w-8 h-8 text-slate-200" />
              </div>
              <h2
                className="text-xl font-bold text-black mb-3 uppercase tracking-tight"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Node Required
              </h2>
              <p className="text-slate-500 mb-8 font-medium text-[11px] leading-relaxed">
                Please select a business node from the dashboard to access the customer reputation hub.
              </p>
              <button
                onClick={() => router.push("/get-magic-qr")}
                className="w-full btn-lemon px-8 py-4 rounded-xl font-black uppercase tracking-widest text-[9px] shadow-lg"
              >
                Go to Selection <ArrowRight className="inline-block w-3 h-3 ml-2" />
              </button>
            </div>
          </div>
        )}

        {/* ---------------- IF BUSINESS SELECTED → SHOW REVIEWS ---------------- */}
        {businessName && (
          <div className="space-y-10">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              <div className="space-y-4">
                <p className="text-slate-500 font-bold flex items-center gap-2 text-[10px] uppercase tracking-widest">
                  <Store className="w-3.5 h-3.5 text-lemon-hover" />
                  Monitoring: {businessName}
                </p>
                <div className="bg-black text-white p-4 rounded-2xl border border-lemon-glow/20 shadow-xl flex items-start gap-3 max-w-lg">
                  <div className="p-1.5 bg-lemon-glow rounded-lg shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-black fill-black" />
                  </div>
                  <p className="text-[10px] font-medium text-slate-300 leading-relaxed">
                    Analyzing real-time customer feedback. These reviews are captured directly via your Magic QR reputation shield.
                  </p>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-[1.5rem] border border-black/5 shadow-sm hover:shadow-md transition-all min-w-[140px]">
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                    Total Feed
                  </p>
                  <p
                    className="text-2xl font-black text-black"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {stats.total}
                  </p>
                </div>

                <div className="bg-white p-5 rounded-[1.5rem] border border-lemon-glow/20 shadow-sm hover:shadow-lemon/10 transition-all min-w-[140px]">
                  <div className="flex items-center gap-1 mb-1">
                    <Star className="w-2.5 h-2.5 text-lemon-hover fill-current" />
                    <p className="text-[8px] text-lemon-hover font-bold uppercase tracking-widest">
                      Sentiment
                    </p>
                  </div>
                  <p
                    className="text-2xl font-black text-black"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {stats.avg}
                  </p>
                </div>
              </div>
            </div>

            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="bg-white h-[280px] rounded-[2rem] border border-black/5 animate-pulse shadow-sm"
                  ></div>
                ))}
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 p-6 rounded-2xl text-center font-bold border border-red-100 uppercase tracking-widest text-[10px]">
                {error}
              </div>
            )}

            {/* ---------------- REVIEW LIST ---------------- */}
            {!loading && !error && (
              <>
                {reviews.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-black/5">
                      <Quote className="w-8 h-8 text-slate-100" />
                    </div>
                    <h3
                      className="text-sm font-bold text-black uppercase tracking-tight mb-2"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      Stream Inactive
                    </h3>
                    <p className="text-slate-400 font-medium text-[10px]">
                      No entries detected. Deploy your Magic QR at point-of-sale.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                    {reviews.map((r) => (
                      <div
                        key={r._id}
                        className="group relative bg-white p-6 rounded-[2rem] border border-black/5 hover:border-lemon-glow/50 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 flex flex-col h-full"
                      >
                        {/* Card Header */}
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-lemon-glow font-black text-base shadow-lg group-hover:scale-110 transition-transform">
                              {r.name ? (
                                r.name.charAt(0).toUpperCase()
                              ) : (
                                <User className="w-5 h-5" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-bold text-black text-[12px] uppercase tracking-tight leading-tight">
                                {r.name || "Anonymous"}
                              </h3>
                              <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                <Calendar className="w-2.5 h-2.5" />
                                {new Date(r.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                size={10}
                                className={`${i < r.rating ? "text-lemon-hover fill-lemon-hover" : "text-slate-100"}`}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Feedback Content */}
                        <div className="flex-grow relative">
                          <Quote className="absolute -top-4 -left-3 w-8 h-8 text-slate-50/80 -z-0" />
                          <p className="text-slate-600 text-xs leading-relaxed relative z-10 font-medium italic">
                            "
                            {r.feedback ||
                              "The customer provided a rating without written feedback."}
                            "
                          </p>
                        </div>

                        {/* Footer / Origin Tag */}
                        <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                          <span className="text-[8px] font-black uppercase tracking-widest text-slate-300">
                            Verified Source
                          </span>
                          <span className="text-[8px] font-bold uppercase tracking-widest text-lemon-hover bg-lemon-glow/10 px-2.5 py-1 rounded-full border border-lemon-glow/20">
                            {r.business || "Direct"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <SupportModal showToast={showToast} />
    </div>
  );
}
