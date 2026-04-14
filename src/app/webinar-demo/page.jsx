"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Clock, Video, Users, Gift, ShieldCheck, ChevronLeft, ChevronRight, CalendarDays, X, Loader2 } from "lucide-react";
import Navbar from "@/components/sections/HeaderSection";
import FooterSection from "@/components/sections/FooterSection";

const names = [
  "Rajiv Kumar","Sanjay Gupta","Amit Sharma","Pooja Verma",
  "Rohit Singh","Neha Patel","Ankit Jain","Priya Singh",
  "Rahul Mehta","Karan Malhotra","Ayaan Khan","Faizan Ali",
  "Zaid Ahmed","Imran Sheikh","Sahil Ansari","Arman Khan",
  "Rehan Malik","Asif Khan","Nusrat Ali","Saba Khan",
];
const cities = [
  "Delhi","Mumbai","Jaipur","Noida","Lucknow","Ahmedabad",
  "Pune","Indore","Bhopal","Surat","Chandigarh","Patna",
  "Nagpur","Gurgaon","Hyderabad",
];

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ─── CALENDAR COMPONENT ─── */
function CalendarPicker({ value, onChange, onClose }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewDate, setViewDate] = useState(() => {
    const d = value ? new Date(value) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isPast = (d) => {
    const cell = new Date(year, month, d);
    return cell < today;
  };

  const isSelected = (d) => {
    if (!value || !d) return false;
    const sel = new Date(value);
    return sel.getFullYear() === year && sel.getMonth() === month && sel.getDate() === d;
  };

  const isToday = (d) => {
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
  };

  const handleSelect = (d) => {
    if (!d || isPast(d)) return;
    const selected = new Date(year, month, d);
    onChange(selected);
    onClose();
  };

  return (
    <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-[#111] border border-white/15 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
        <button
          type="button"
          onClick={prevMonth}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/8 text-white/50 hover:text-white transition-all"
        >
          <ChevronLeft size={15} />
        </button>
        <span className="text-sm font-bold text-white tracking-wide">
          {MONTHS[month]} {year}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/8 text-white/50 hover:text-white transition-all"
        >
          <ChevronRight size={15} />
        </button>
      </div>

      <div className="p-3">
        {/* Day Labels */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-[11px] font-semibold text-white/25 py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Date Grid */}
        <div className="grid grid-cols-7 gap-y-0.5">
          {cells.map((d, i) => {
            const past = d ? isPast(d) : false;
            const selected = isSelected(d);
            const todayCell = isToday(d);

            return (
              <button
                key={i}
                type="button"
                disabled={!d || past}
                onClick={() => handleSelect(d)}
                className={`
                  relative w-full aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all
                  ${!d ? "invisible" : ""}
                  ${past ? "text-white/15 cursor-not-allowed" : "cursor-pointer"}
                  ${selected
                    ? "bg-gradient-to-br from-yellow-400 to-amber-400 text-black font-black shadow-lg shadow-yellow-400/20"
                    : !past && d
                    ? "hover:bg-white/8 text-white/80 hover:text-white"
                    : ""}
                `}
              >
                {d}
                {todayCell && !selected && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-yellow-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Slot Row */}
      <div className="border-t border-white/8 px-4 py-3">
        <p className="text-[11px] text-white/30 font-semibold uppercase tracking-widest mb-2">Available Times</p>
        <div className="flex gap-2 flex-wrap">
          {["10:00 AM", "12:00 PM", "4:00 PM", "7:00 PM"].map((t) => (
            <button
              key={t}
              type="button"
              className="px-3 py-1.5 rounded-lg text-[12px] font-semibold border border-white/10 text-white/50 hover:border-yellow-400/50 hover:text-yellow-300 hover:bg-yellow-400/5 transition-all"
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── FORM CARD ─── */
function FormCard() {
  const router = useRouter();

  const [formData, setFormData] = useState({ name: "", contact: "", business: "", selectedDate: null });
  const [calOpen, setCalOpen]     = useState(false);
  const [error, setError]         = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const calRef = useRef(null);

  /* helpers */
  const formatDate = (d) => {
    if (!d) return null;
    return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long" });
  };

  const formatDateISO = (d) => {
    if (!d) return "";
    const dd   = String(d.getDate()).padStart(2, "0");
    const mm   = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
  };

  const isSunday  = formData.selectedDate ? new Date(formData.selectedDate).getDay() === 0 : false;
  const day       = formData.selectedDate ? new Date(formData.selectedDate).getDay() : null;
  const webinarTime = day === 5 ? "5:30 PM IST" : "4:00 PM IST";

  /* close calendar on outside click */
  useEffect(() => {
    const handleClick = (e) => {
      if (calRef.current && !calRef.current.contains(e.target)) setCalOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* input change */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  /* submit */
  const handleSubmit = async (e) => {
    e.preventDefault();

    /* basic validation */
    if (!formData.name.trim())    return setError("Please enter your full name.");
    if (!formData.contact.trim()) return setError("Please enter your WhatsApp number.");
    if (!/^\d{10}$/.test(formData.contact.trim())) return setError("Enter a valid 10-digit WhatsApp number.");
    if (!formData.selectedDate)   return setError("Please select a date for the webinar.");
    if (isSunday)                 return setError("We don't host webinars on Sundays. Please pick another day.");

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/bookDemo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:         formData.name.trim(),
          phone:        formData.contact.trim(),
          business:     formData.business.trim(),
          seminarTime:  webinarTime,
          selectedDate: formatDateISO(formData.selectedDate),
          status:       "Not Attended",
        }),
      });

      const result = await response.json();

      if (result.success) {
        const query = new URLSearchParams({
          name:  formData.name.trim(),
          phone: formData.contact.trim(),
          date:  formatDateISO(formData.selectedDate),
          time:  webinarTime,
        }).toString();
        router.push(`/thank-you?${query}`);
      } else {
        setError(result.message || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Server error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative bg-[#111] rounded-2xl overflow-visible shadow-2xl">

      {/* Gold top bar */}
      <div className="h-1 w-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-t-2xl" />

      {/* Urgency strip */}
      <div className="bg-red-950/60 border-b border-red-500/20 px-5 py-3 flex items-center gap-3">
        <span className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        <p className="text-xs text-red-300 font-semibold">
          ⚡ Hurry! Only <span className="text-red-400 font-black">1 Hour Left</span> —{" "}
          <span className="text-white font-black">Limited Seats Available</span>
        </p>
      </div>

      <div className="p-5 sm:p-6">

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-black text-lg text-white">Book Your Free Seat</h2>
            <p className="text-white/40 text-xs mt-0.5">
              {formData.selectedDate ? `${formatDate(formData.selectedDate)} · ${webinarTime}` : "4:00 PM IST · Online · Today"}
            </p>
          </div>
          <div className="bg-green-500/15 border border-green-500/30 rounded-xl px-3 py-1.5 text-center flex-shrink-0">
            <p className="text-green-300 text-base font-black leading-none">FREE</p>
          </div>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-3">

            {/* Name */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 text-sm select-none">👤</span>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Your full name"
                autoComplete="name"
                className="w-full pl-9 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-yellow-400/60 focus:bg-yellow-400/5 transition-all"
              />
            </div>

            {/* WhatsApp */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 text-sm select-none">📱</span>
              <input
                type="tel"
                name="contact"
                value={formData.contact}
                onChange={handleInputChange}
                placeholder="WhatsApp number (10 digits)"
                maxLength={10}
                autoComplete="tel"
                className="w-full pl-9 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-yellow-400/60 focus:bg-yellow-400/5 transition-all"
              />
            </div>

            {/* Business */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 text-sm select-none">🏢</span>
              <input
                type="text"
                name="business"
                value={formData.business}
                onChange={handleInputChange}
                placeholder="Business name (optional)"
                className="w-full pl-9 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-yellow-400/60 focus:bg-yellow-400/5 transition-all"
              />
            </div>

            {/* ── Calendar Date Picker ── */}
            <div className="relative" ref={calRef}>
              <button
                type="button"
                onClick={() => setCalOpen((v) => !v)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm border transition-all text-left
                  ${formData.selectedDate
                    ? "bg-yellow-400/8 border-yellow-400/40 text-white"
                    : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"}
                `}
              >
                <CalendarDays
                  size={15}
                  className={formData.selectedDate ? "text-yellow-400 flex-shrink-0" : "text-white/25 flex-shrink-0"}
                />
                <span className={`flex-1 ${formData.selectedDate ? "font-semibold text-white" : ""}`}>
                  {formData.selectedDate ? formatDate(formData.selectedDate) : "Select preferred date"}
                </span>
                {formData.selectedDate ? (
                  <span
                    className="text-white/30 hover:text-white/60 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFormData((p) => ({ ...p, selectedDate: null }));
                      if (error) setError("");
                    }}
                  >
                    <X size={13} />
                  </span>
                ) : (
                  <ChevronRight
                    size={13}
                    className={`transition-transform duration-200 text-white/25 ${calOpen ? "rotate-90" : ""}`}
                  />
                )}
              </button>

              {calOpen && (
                <CalendarPicker
                  value={formData.selectedDate}
                  onChange={(d) => {
                    setFormData((p) => ({ ...p, selectedDate: d }));
                    if (error) setError("");
                  }}
                  onClose={() => setCalOpen(false)}
                />
              )}
            </div>

            {/* Sunday warning */}
            {isSunday && (
              <div className="flex items-center gap-2 bg-orange-950/50 border border-orange-500/25 rounded-xl px-4 py-2.5 animate-fadeIn">
                <span className="text-orange-400 text-sm">⚠️</span>
                <span className="text-orange-300 text-xs font-semibold">No webinars on Sundays — please pick another day.</span>
              </div>
            )}

            {/* Confirmed slot */}
            {formData.selectedDate && !isSunday && (
              <div className="flex items-center gap-2 bg-yellow-400/8 border border-yellow-400/20 rounded-xl px-4 py-2.5 animate-fadeIn">
                <Clock size={13} className="text-yellow-400 flex-shrink-0" />
                <span className="text-yellow-300 text-xs font-semibold">
                  {formatDate(formData.selectedDate)} · {webinarTime} · 60 min · Zoom
                </span>
              </div>
            )}

            {/* Default time strip */}
            {!formData.selectedDate && (
              <div className="flex items-center gap-2 bg-white/3 border border-white/8 rounded-xl px-4 py-2.5">
                <Clock size={13} className="text-white/25 flex-shrink-0" />
                <span className="text-white/30 text-xs">Pick a date to confirm your slot · 4:00 PM IST</span>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-2 bg-red-950/60 border border-red-500/30 rounded-xl px-4 py-2.5 animate-fadeIn">
                <span className="text-red-400 text-sm mt-0.5 flex-shrink-0">⚠</span>
                <p className="text-red-300 text-xs font-semibold leading-relaxed">{error}</p>
              </div>
            )}

            {/* CTA */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-amber-300 disabled:opacity-60 disabled:cursor-not-allowed text-black font-black rounded-xl text-sm sm:text-base transition-all active:scale-[0.98] shadow-lg shadow-yellow-400/20 mt-1 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Booking your seat…</span>
                </>
              ) : (
                "🚀 Reserve My FREE Seat Now"
              )}
            </button>

            {/* Seats warning */}
            <div className="flex items-center justify-center gap-1.5 pt-1">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              <p className="text-[11px] text-red-400 font-semibold text-center">
                Limited seats — register before it fills up
              </p>
            </div>

          </div>
        </form>

        {/* Trust row */}
        <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-white/5 text-[11px] text-white/25">
          <span className="flex items-center gap-1"><ShieldCheck size={10} /> No spam</span>
          <span>·</span>
          <span>Cancel anytime</span>
          <span>·</span>
          <span>100% free</span>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.2s ease forwards; }
      `}</style>
    </div>
  );
}

/* ─── URGENCY BANNER ─── */
function UrgencyBanner() {
  return (
    <div className="fixed top-0 left-0 w-full z-50 bg-gradient-to-r from-yellow-400 to-amber-500 shadow-lg">
      <div className="flex items-stretch justify-center flex-wrap divide-x divide-black/10">
        <div className="flex flex-col items-start justify-center px-4 sm:px-6 py-2">
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-black/50">Hurry Up! Time Left</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-base sm:text-xl font-black text-black font-mono tracking-wider">1 Hour</span>
            <span className="text-[10px] font-bold text-red-700 animate-pulse bg-red-100 px-1.5 py-0.5 rounded-full">LIVE</span>
          </div>
        </div>
        <div className="flex flex-col items-start justify-center px-4 sm:px-6 py-2">
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-black/50">Seats Available</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs sm:text-sm font-black text-red-800">⚡ Limited Seats</span>
          </div>
        </div>
        <div className="flex items-center px-4 sm:px-6 py-2">
          <span className="text-xs sm:text-sm font-black text-black">🚀 Join FREE — Before It&apos;s Full!</span>
        </div>
        <div className="hidden sm:flex flex-col justify-center px-4 sm:px-6 py-2">
          <span className="text-[9px] font-bold uppercase tracking-widest text-black/50">Price</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-sm line-through text-black/30 font-bold">₹999</span>
            <span className="text-sm font-black text-green-800">FREE</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── LEFT SECTION ─── */
function LeftSection() {
  return (
    <div className="space-y-6">
      <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/25 rounded-full px-3 py-1.5 text-yellow-400 text-xs font-semibold">
        🎯 Free Business Growth Demo
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight">
        Grow Your Business With{" "}
        <span className="text-yellow-400">Limbu AI</span>
      </h1>
      <p className="text-white/50 text-sm leading-relaxed">
        Learn how to automate your Google Business profile and social media — save 10+ hours a week and get more customers on autopilot.
      </p>
      <div className="flex gap-3 flex-wrap">
        {[
          { num: "1,200+", lbl: "Businesses Joined" },
          { num: "4.9★",   lbl: "Average Rating" },
          { num: "60 Min", lbl: "Session Length" },
        ].map((s) => (
          <div key={s.lbl} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex flex-col gap-0.5">
            <span className="text-yellow-400 font-bold text-lg leading-none">{s.num}</span>
            <span className="text-white/40 text-[11px]">{s.lbl}</span>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <FeatureRow icon={<Video size={15} />} title="Live Demo" desc="Watch us create a week of posts in under 5 minutes" />
        <FeatureRow icon={<Users size={15} />} title="Live Q&A" desc="Ask anything — get answers specific to your business" />
        <FeatureRow icon={<Gift size={15} />}  title="Free Bonus" desc="All attendees get our AI prompt pack (worth ₹1,499)" />
      </div>
    </div>
  );
}

/* ─── FEATURE ROW ─── */
function FeatureRow({ icon, title, desc }) {
  return (
    <div className="flex items-start gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5">
      <div className="text-yellow-400 mt-0.5 flex-shrink-0">{icon}</div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-white/40 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

/* ─── LIVE TOAST ─── */
function LiveToast({ user }) {
  return (
    <div className="fixed bottom-4 left-4 z-50 bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2.5 flex items-center gap-2.5 max-w-[260px] shadow-2xl">
      <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse flex-shrink-0" />
      <p className="text-[12px] text-white/75 leading-tight">{user}</p>
    </div>
  );
}

/* ─── PAGE ─── */
export default function WebinarPage() {
  const [liveUser, setLiveUser] = useState(rand(names) + " from " + rand(cities) + " just joined");

  useEffect(() => {
    const id = setInterval(() => {
      setLiveUser(rand(names) + " from " + rand(cities) + " just joined");
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <UrgencyBanner />
      <Navbar />
      <div className="min-h-screen bg-[#0B0B0B] text-white pt-14">
        <div className="max-w-5xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <LeftSection />
          <FormCard />
        </div>
      </div>
      <FooterSection />
      <LiveToast user={liveUser} />
    </>
  );
}