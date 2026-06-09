"use client";

import { cloneElement, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle,
  Calendar,
  Clock,
  User,
  Phone,
  Sparkles,
  ArrowLeft,
  CalendarCheck,
  Loader2,
  Video,
} from "lucide-react";
import Link from "next/link";
import FooterSection from "@/components/sections/FooterSection";
import Navbar from "@/components/sections/HeaderSection";

function formatBookedAt(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDisplayDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = String(iso).split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(y, m - 1, d, 12, 0, 0)));
}

function ThankYouContent() {
  const searchParams = useSearchParams();

  const name = searchParams.get("name") || "Guest";
  const date = searchParams.get("date") || "";
  const time = searchParams.get("time") || "";
  const phone = searchParams.get("phone") || "";

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(Boolean(phone));

  useEffect(() => {
    if (!phone || phone.length < 10) {
      setHistoryLoading(false);
      return;
    }

    let cancelled = false;
    setHistoryLoading(true);

    fetch(`/api/bookDemo?phone=${encodeURIComponent(phone)}`, {
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setHistory(Array.isArray(data.data) ? data.data : []);
      })
      .catch(() => {
        if (!cancelled) setHistory([]);
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [phone]);

  return (
    <div
      className="relative w-full overflow-hidden m-0 p-0"
      style={{ backgroundColor: "var(--background)" }}
    >
      <Navbar />

      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15, 23, 42, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.2) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div
        className="pointer-events-none absolute top-0 right-0 w-[500px] h-[500px] z-0 opacity-10"
        style={{
          background:
            "radial-gradient(ellipse at top right, var(--lemon-glow) 0%, transparent 65%)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16 sm:py-24 flex flex-col items-center">
        <div className="mb-6 relative group">
          <div className="absolute inset-0 bg-lemon-glow/20 blur-2xl rounded-full animate-pulse group-hover:bg-lemon-glow/40 transition-all" />
          <div className="relative bg-black p-5 rounded-[1.5rem] shadow-xl border border-black/10">
            <CheckCircle className="w-10 h-10 text-lemon-glow" />
          </div>
          <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-lemon-hover animate-bounce" />
        </div>

        <div className="text-center mb-12">
          <h1
            className="font-black text-3xl uppercase tracking-tight text-black mb-3"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Demo <span className="text-lemon-hover">Booked!</span>
          </h1>
          <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-[0.3em]">
            Confirmation saved · Our team will connect on WhatsApp
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-stretch">
          <div className="lg:col-span-7 flex flex-col">
            <div className="bg-black rounded-[3rem] p-10 sm:p-14 shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex-1 border border-lemon-glow/30 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-80 h-80 bg-lemon-glow/10 rounded-full blur-[100px] -mr-32 -mt-32 transition-all group-hover:bg-lemon-glow/20" />

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-lemon-glow/10 border border-lemon-glow/20">
                  <span className="w-2 h-2 rounded-full bg-lemon-hover animate-ping" />
                  <span className="text-[10px] font-black uppercase text-lemon-glow tracking-widest">
                    Confirmed
                  </span>
                </div>

                <h2
                  className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight mb-6 leading-none"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Your Free <br />
                  <span className="text-lemon-glow">Demo Is Set</span>
                </h2>

                <p className="text-sm sm:text-base text-slate-400 font-medium leading-relaxed mb-8 max-w-md">
                  We&apos;ll share the{" "}
                  <span className="text-white">demo link</span> and reminders on
                  your WhatsApp. Join on time — our expert will walk you through
                  Limbu AI live.
                </p>

                {(date || time) && (
                  <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-lemon-glow/80 mb-3">
                      Latest booking
                    </p>
                    <div className="flex flex-wrap gap-4 text-white">
                      {date && (
                        <span className="flex items-center gap-2 text-sm font-bold">
                          <Calendar size={16} className="text-lemon-glow" />
                          {formatDisplayDate(date)}
                        </span>
                      )}
                      {time && (
                        <span className="flex items-center gap-2 text-sm font-bold">
                          <Clock size={16} className="text-lemon-glow" />
                          {time}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <Link
                    href="/webinar-demo"
                    className="group w-full py-5 bg-lemon-glow text-black rounded-[1.5rem] font-black text-xs sm:text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-white hover:scale-[1.02] transition-all shadow-2xl"
                  >
                    <Video className="w-6 h-6" />
                    Book Another Demo
                  </Link>
                  <p className="text-center text-[10px] text-slate-500 font-black uppercase tracking-widest">
                    Slots available 9 AM – 9 PM IST · Mon – Sat
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-black/5 rounded-[2.5rem] p-8 sm:p-10 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-lemon-glow to-amber-300" />

              <h2 className="text-[11px] font-black text-black uppercase tracking-widest mb-6 flex items-center gap-3">
                <div className="p-1.5 bg-slate-50 rounded-lg border border-black/5 text-slate-400">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                Booking Details
              </h2>

              <div className="space-y-5 mb-8">
                <DetailRow icon={<User />} label="Name" value={name} />
                <DetailRow icon={<Phone />} label="WhatsApp" value={phone || "—"} />
                <DetailRow
                  icon={<Calendar />}
                  label="Demo Date"
                  value={date ? formatDisplayDate(date) : "—"}
                  themed
                />
                <DetailRow
                  icon={<Clock />}
                  label="Demo Time"
                  value={time || "—"}
                  themed
                />
              </div>

              <div className="border-t border-slate-100 pt-6">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">
                  Your booking history
                </h3>

                {historyLoading ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm font-semibold">Loading history…</span>
                  </div>
                ) : history.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">
                    No previous bookings found for this number.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                    {history.map((row) => (
                      <div
                        key={row.id}
                        className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-bold text-slate-800">
                              {row.selectedDateLabel ||
                                formatDisplayDate(row.selectedDate)}
                            </p>
                            <p className="text-[11px] font-semibold text-lemon-hover mt-0.5">
                              {row.seminarTime}
                            </p>
                          </div>
                          <span className="text-[9px] font-bold uppercase px-2 py-1 rounded-full bg-white border border-slate-200 text-slate-500 shrink-0">
                            {row.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium">
                          Booked on {formatBookedAt(row.bookedAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Link
              href="/"
              className="py-5 bg-white border border-black/5 rounded-[1.5rem] text-center font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <FooterSection />
    </div>
  );
}

function DetailRow({ icon, label, value, themed }) {
  return (
    <div className="flex items-start gap-4">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${
          themed
            ? "bg-lemon-glow/10 border-lemon-glow/20 text-lemon-hover"
            : "bg-slate-50 border-black/5 text-black"
        }`}
      >
        {cloneElement(icon, { size: 18 })}
      </div>
      <div>
        <p
          className={`text-[9px] font-black uppercase tracking-widest mb-1 ${
            themed ? "text-lemon-hover/60" : "text-slate-400"
          }`}
        >
          {label}
        </p>
        <p className="text-sm font-black text-black tracking-tight">{value}</p>
      </div>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <ThankYouContent />
    </Suspense>
  );
}
