"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Clock, Video, Users, Gift, ShieldCheck, ChevronLeft, ChevronRight, CalendarDays, X, Loader2, User, Smartphone, Building2 } from "lucide-react";
import Navbar from "@/components/sections/HeaderSection";
import FooterSection from "@/components/sections/FooterSection";

const names = [
  "Rajiv Kumar", "Sanjay Gupta", "Amit Sharma", "Pooja Verma",
  "Rohit Singh", "Neha Patel", "Ankit Jain", "Priya Singh",
  "Rahul Mehta", "Karan Malhotra", "Ayaan Khan", "Faizan Ali",
  "Zaid Ahmed", "Imran Sheikh", "Sahil Ansari", "Arman Khan",
  "Rehan Malik", "Asif Khan", "Nusrat Ali", "Saba Khan",
];
const cities = [
  "Delhi", "Mumbai", "Jaipur", "Noida", "Lucknow", "Ahmedabad",
  "Pune", "Indore", "Bhopal", "Surat", "Chandigarh", "Patna",
  "Nagpur", "Gurgaon", "Hyderabad",
];

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ─── CALENDAR DROPDOWN ─── */
function CalendarDropdown({ value, onChange, onClose }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewDate, setViewDate] = useState(() => {
    const d = value ? new Date(value) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isPast = (d) => new Date(year, month, d) < today;

  const isSelected = (d) => {
    if (!value || !d) return false;
    const sel = new Date(value);
    return sel.getFullYear() === year && sel.getMonth() === month && sel.getDate() === d;
  };

  const isToday = (d) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;

  const handleSelect = (d) => {
    if (!d || isPast(d)) return;
    onChange(new Date(year, month, d));
    onClose();
  };

  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-[260px] mb-2 z-50 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
        <button type="button" onClick={prevMonth}
          className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all">
          <ChevronLeft size={14} />
        </button>
        <span className="text-xs font-bold text-slate-800 tracking-wide">{MONTHS[month]} {year}</span>
        <button type="button" onClick={nextMonth}
          className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all">
          <ChevronRight size={14} />
        </button>
      </div>
      <div className="p-2">
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-[10px] font-semibold text-slate-400 py-0.5">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            const past = d ? isPast(d) : false;
            const selected = isSelected(d);
            const todayCell = isToday(d);
            return (
              <button key={i} type="button" disabled={!d || past} onClick={() => handleSelect(d)}
                className={`relative w-full aspect-square flex items-center justify-center rounded-md text-xs font-medium transition-all
                  ${!d ? "invisible" : ""}
                  ${past ? "text-slate-300 cursor-not-allowed" : "cursor-pointer"}
                  ${selected
                    ? "bg-gradient-to-br from-yellow-400 to-amber-400 text-black font-black shadow-md shadow-yellow-400/20"
                    : !past && d ? "hover:bg-slate-100 text-slate-700 hover:text-slate-900" : ""}`}>
                {d}
                {todayCell && !selected && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-yellow-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── DATE PICKER FIELD — manual typing + calendar ─── */
function DatePickerField({ value, onChange }) {
  const [calOpen, setCalOpen] = useState(false);
  const [textVal, setTextVal] = useState(() => {
    if (!value) return "";
    const d = new Date(value);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  });
  const [inputError, setInputError] = useState("");
  const wrapRef = useRef(null);

  /* sync text when calendar picks a date */
  useEffect(() => {
    if (!value) {
      setTextVal("");
      return;
    }
    const d = new Date(value);
    setTextVal(`${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`);
  }, [value]);

  /* outside click closes calendar */
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setCalOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* auto-insert slashes: DD/MM/YYYY */
  const handleTextChange = (e) => {
    let raw = e.target.value.replace(/\D/g, "");
    if (raw.length > 8) raw = raw.slice(0, 8);

    let formatted = raw;
    if (raw.length >= 3) formatted = raw.slice(0, 2) + "/" + raw.slice(2);
    if (raw.length >= 5) formatted = raw.slice(0, 2) + "/" + raw.slice(2, 4) + "/" + raw.slice(4);

    setTextVal(formatted);
    setInputError("");

    if (raw.length === 8) {
      const dd = parseInt(raw.slice(0, 2), 10);
      const mm = parseInt(raw.slice(2, 4), 10) - 1;
      const yyyy = parseInt(raw.slice(4, 8), 10);
      const parsed = new Date(yyyy, mm, dd);
      const todayCheck = new Date(); todayCheck.setHours(0, 0, 0, 0);

      if (parsed.getFullYear() !== yyyy || parsed.getMonth() !== mm || parsed.getDate() !== dd) {
        setInputError("Invalid date — use DD/MM/YYYY");
        onChange(null);
        return;
      }
      if (parsed < todayCheck) {
        setInputError("Date cannot be in the past");
        onChange(null);
        return;
      }
      onChange(parsed);
    } else {
      if (value) onChange(null);
    }
  };

  const handleClear = () => {
    setTextVal("");
    setInputError("");
    onChange(null);
  };

  const formatDisplay = (d) =>
    d ? d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" }) : null;

  const hasError = !!inputError;

  return (
    <div className="relative" ref={wrapRef}>

      {/* Input row */}
      <div className={`flex items-center rounded-xl border overflow-hidden transition-all
        ${hasError ? "border-red-300 bg-red-50" : value ? "border-yellow-300 bg-yellow-50" : "border-slate-200 bg-slate-50"}
        focus-within:border-yellow-400 focus-within:bg-white`}>

        {/* Calendar icon — opens/closes dropdown */}
        <button type="button" onClick={() => setCalOpen((v) => !v)}
          className="flex items-center justify-center w-10 h-11 flex-shrink-0 transition-colors"
          title="Pick from calendar">
          <CalendarDays size={15} className={value ? "text-yellow-600" : "text-slate-400"} />
        </button>

        {/* Manual text input */}
        <input
          type="text"
          inputMode="numeric"
          value={textVal}
          onChange={handleTextChange}
          onFocus={() => setCalOpen(true)}
          placeholder="DD/MM/YYYY"
          maxLength={10}
          className="flex-1 bg-transparent py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />

        {/* Clear X */}
        {(value || textVal) && (
          <button type="button" onClick={handleClear}
            className="w-9 h-11 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0">
            <X size={13} />
          </button>
        )}

        {/* Chevron hint when empty */}
        {!value && !textVal && (
          <button type="button" onClick={() => setCalOpen((v) => !v)}
            className="w-9 h-11 flex items-center justify-center text-slate-400 flex-shrink-0">
            <ChevronRight size={13} className={`transition-transform duration-200 ${calOpen ? "rotate-90" : ""}`} />
          </button>
        )}
      </div>

      {/* Friendly parsed date label */}
      {value && !hasError && (
        <p className="text-[11px] text-yellow-600 mt-1.5 px-1 flex items-center gap-1">
          <span>📅</span> {formatDisplay(value)}
        </p>
      )}

      {/* Inline validation error */}
      {hasError && (
        <p className="text-[11px] text-red-500 mt-1.5 px-1 font-semibold">{inputError}</p>
      )}

      {/* Calendar dropdown */}
      {calOpen && (
        <CalendarDropdown
          value={value}
          onChange={(d) => { onChange(d); setCalOpen(false); }}
          onClose={() => setCalOpen(false)}
        />
      )}
    </div>
  );
}

/* ─── FORM CARD ─── */
function FormCard() {
  const router = useRouter();

  const [formData, setFormData] = useState({ name: "", contact: "", business: "", selectedDate: null });
  const [selectedTime, setSelectedTime] = useState("");
  const [timeSlots, setTimeSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatDateISO = (d) => {
    if (!d) return "";
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const formatDate = (d) => {
    if (!d) return null;
    return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long" });
  };

  const isSunday = formData.selectedDate ? new Date(formData.selectedDate).getDay() === 0 : false;

  useEffect(() => {
    if (!formData.selectedDate || isSunday) {
      setTimeSlots([]);
      setSelectedTime("");
      return;
    }

    const dateIso = formatDateISO(formData.selectedDate);
    setSlotsLoading(true);
    fetch(`/api/bookDemo?slots=1&date=${encodeURIComponent(dateIso)}`, {
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) return;
        const slots = Array.isArray(data.slots) ? data.slots : [];
        setTimeSlots(slots);
        const firstOpen = slots.find((slot) => !slot.booked);
        setSelectedTime(firstOpen?.label || "");
      })
      .catch(() => setTimeSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [formData.selectedDate, isSunday]);

  const webinarTime = selectedTime;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return setError("Please enter your full name.");
    if (!formData.contact.trim()) return setError("Please enter your WhatsApp number.");
    if (!/^\d{10}$/.test(formData.contact.trim())) return setError("Enter a valid 10-digit WhatsApp number.");
    if (!formData.selectedDate) return setError("Please select a date for the webinar.");
    if (isSunday) return setError("We don't host webinars on Sundays. Please pick another day.");
    if (!webinarTime) {
      return setError("Please choose an available time slot.");
    }
    const chosenSlot = timeSlots.find((slot) => slot.label === webinarTime);
    if (chosenSlot?.booked) {
      return setError("This time slot is already booked. Please pick another time.");
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/bookDemo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.contact.trim(),
          business: formData.business.trim(),
          seminarTime: webinarTime,
          selectedDate: formatDateISO(formData.selectedDate),
          status: "Not Attended",
        }),
      });
      const result = await response.json();
      if (result.success) {
        const query = new URLSearchParams({
          name: formData.name.trim(),
          phone: formData.contact.trim(),
          date: formatDateISO(formData.selectedDate),
          time: webinarTime,
        }).toString();
        router.push(`/thank-you?${query}`);
      } else if (result.slotBooked && Array.isArray(result.availableSlots)) {
        setError(
          result.availableSlots.length
            ? `${result.message} Available: ${result.availableSlots.join(", ")}`
            : result.message || "This slot is booked. Please pick another date.",
        );
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
    <div className="relative bg-white border border-slate-200 rounded-2xl overflow-visible shadow-2xl ">
      <div className="h-1 w-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-t-2xl " />

      <div className="bg-red-50 border-b border-red-100 px-5 py-3 flex items-center gap-3">
        <span className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        <p className="text-xs text-red-600 font-semibold">
          ⚡ Hurry! Only <span className="text-red-800 font-black">1 Hour Left</span> —{" "}
          <span className="text-slate-900 font-black">Limited Seats Available</span>
        </p>
      </div>

      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-black text-lg text-slate-900">Book Your Free Seat</h2>
            <p className="text-slate-500 text-xs mt-0.5">
              {formData.selectedDate ? `${formatDate(formData.selectedDate)} · ${webinarTime}` : "4:00 PM IST · Online · Today"}
            </p>
          </div>
          <div className="bg-green-100 border border-green-200 rounded-xl px-3 py-1.5 text-center flex-shrink-0">
            <p className="text-green-700 text-base font-black leading-none">FREE</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-3">

            {/* Name */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 select-none">
                <User size={15} />
              </span>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange}
                placeholder="Your full name" autoComplete="name"
                className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-yellow-400 focus:bg-white transition-all" />
            </div>

            {/* WhatsApp */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 select-none">
                <Smartphone size={15} />
              </span>
              <input type="tel" name="contact" value={formData.contact} onChange={handleInputChange}
                placeholder="WhatsApp number (10 digits)" maxLength={10} autoComplete="tel"
                className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-yellow-400 focus:bg-white transition-all" />
            </div>

            {/* Business */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 select-none">
                <Building2 size={15} />
              </span>
              <input type="text" name="business" value={formData.business} onChange={handleInputChange}
                placeholder="Business name (optional)"
                className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-yellow-400 focus:bg-white transition-all" />
            </div>

            {/* ── NEW Date Picker ── */}
            <DatePickerField
              value={formData.selectedDate}
              onChange={(d) => {
                setFormData((p) => ({ ...p, selectedDate: d }));
                if (error) setError("");
              }}
            />

            {/* Sunday warning */}
            {isSunday && (
              <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5 animate-fadeIn">
                <span className="text-orange-500 text-sm">⚠️</span>
                <span className="text-orange-800 text-xs font-semibold">No webinars on Sundays — please pick another day.</span>
              </div>
            )}

            {/* Time slots */}
            {formData.selectedDate && !isSunday && (
              <div className="space-y-2 animate-fadeIn">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Choose time slot
                </p>
                {slotsLoading ? (
                  <div className="text-xs text-slate-500 py-2">Loading slots…</div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot.key}
                        type="button"
                        disabled={slot.booked}
                        onClick={() => {
                          if (!slot.booked) {
                            setSelectedTime(slot.label);
                            if (error) setError("");
                          }
                        }}
                        className={`rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition ${
                          slot.booked
                            ? "border-red-200 bg-red-50 text-red-500 cursor-not-allowed line-through"
                            : selectedTime === slot.label
                              ? "border-yellow-400 bg-yellow-50 text-yellow-900 ring-2 ring-yellow-300"
                              : "border-slate-200 bg-slate-50 text-slate-700 hover:border-yellow-300"
                        }`}
                      >
                        {slot.label}
                        {slot.booked ? (
                          <span className="block text-[10px] font-bold text-red-600 mt-0.5">
                            Booked
                          </span>
                        ) : (
                          <span className="block text-[10px] font-medium text-emerald-600 mt-0.5">
                            Available
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Confirmed slot */}
            {formData.selectedDate && !isSunday && webinarTime && (
              <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2.5 animate-fadeIn">
                <Clock size={13} className="text-yellow-600 flex-shrink-0" />
                <span className="text-yellow-800 text-xs font-semibold">
                  {formatDate(formData.selectedDate)} · {webinarTime} · 60 min · Zoom
                </span>
              </div>
            )}

            {/* Default time strip */}
            {!formData.selectedDate && (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
                <Clock size={13} className="text-slate-400 flex-shrink-0" />
                <span className="text-slate-500 text-xs font-medium">Pick a date to confirm your slot · 4:00 PM IST</span>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 animate-fadeIn">
                <span className="text-red-500 text-sm mt-0.5 flex-shrink-0">⚠</span>
                <p className="text-red-700 text-xs font-semibold leading-relaxed">{error}</p>
              </div>
            )}

            {/* CTA */}
            <button type="submit" disabled={isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-amber-300 disabled:opacity-60 disabled:cursor-not-allowed text-black font-black rounded-xl text-sm sm:text-base transition-all active:scale-[0.98] shadow-lg shadow-yellow-400/20 mt-1 flex items-center justify-center gap-2">
              {isSubmitting ? (
                <><Loader2 size={16} className="animate-spin" /><span>Booking your seat…</span></>
              ) : "🚀 Reserve My FREE Seat Now"}
            </button>

            <div className="flex items-center justify-center gap-1.5 pt-1">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              <p className="text-[11px] text-red-600 font-semibold text-center">Limited seats — register before it fills up</p>
            </div>

          </div>
        </form>

        <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
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
      <div className="inline-flex items-center gap-2 bg-yellow-100 border border-yellow-200 rounded-full px-3 py-1.5 text-yellow-700 text-xs font-semibold shadow-sm">
        🎯 Free Business Growth Demo
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight text-slate-900">
        Grow Your Business With{" "}
        <span className="text-yellow-500">Limbu AI</span>
      </h1>
      <p className="text-slate-600 text-sm leading-relaxed font-medium">
        Learn how to automate your Google Business profile and social media — save 10+ hours a week and get more customers on autopilot.
      </p>
      <div className="flex gap-3 flex-wrap">
        {[
          { num: "1,200+", lbl: "Businesses Joined" },
          { num: "4.9★", lbl: "Average Rating" },
          { num: "60 Min", lbl: "Session Length" },
        ].map((s) => (
          <div key={s.lbl} className="bg-white border border-slate-200 shadow-sm rounded-xl px-4 py-3 flex flex-col gap-0.5">
            <span className="text-yellow-600 font-bold text-lg leading-none">{s.num}</span>
            <span className="text-slate-500 text-[11px] font-medium">{s.lbl}</span>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <FeatureRow icon={<Video size={15} />} title="Live Demo" desc="Watch us create a week of posts in under 5 minutes" />
        <FeatureRow icon={<Users size={15} />} title="Live Q&A" desc="Ask anything — get answers specific to your business" />
        <FeatureRow icon={<Gift size={15} />} title="Free Bonus" desc="All attendees get our AI prompt pack (worth ₹1,499)" />
      </div>
    </div>
  );
}

/* ─── FEATURE ROW ─── */
function FeatureRow({ icon, title, desc }) {
  return (
    <div className="flex items-start gap-3 bg-white border border-slate-200 shadow-sm rounded-xl px-3 py-2.5">
      <div className="text-yellow-500 mt-0.5 flex-shrink-0">{icon}</div>
      <div>
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

/* ─── LIVE TOAST ─── */
function LiveToast({ user }) {
  return (
    <div className="fixed bottom-4 left-4 z-50 bg-white border border-slate-200 rounded-xl px-3 py-2.5 flex items-center gap-2.5 max-w-[260px] shadow-xl">
      <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
      <p className="text-[12px] text-slate-700 font-medium leading-tight">{user}</p>
    </div>
  );
}

/* ─── AUTO MODAL ─── */
function AutoModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      style={{ background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)" }}
    >
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
        {/* Close button - inside the relative container of the card */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-full transition-all shadow-sm"
          title="Close"
        >
          <X size={18} strokeWidth={3} />
        </button>
        <FormCard />
      </div>
    </div>
  );
}

/* ─── PAGE ─── */
export default function WebinarPage() {
  const [liveUser, setLiveUser] = useState(rand(names) + " from " + rand(cities) + " just joined");
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setModalOpen(true), 800);
    return () => clearTimeout(timer);
  }, []);

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
      <div className="min-h-screen bg-slate-50 text-slate-900 pt-14 relative overflow-hidden font-inter">
        {/* Subtle background grid */}
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.3) 1px, transparent 1px)",
            backgroundSize: "40px 40px"
          }}
        />
        {/* Ambient glow */}
        <div
          className="pointer-events-none absolute top-0 left-0 w-[600px] h-[500px] z-0 opacity-10"
          style={{
            background: "radial-gradient(circle at top left, rgba(250, 204, 21, 0.5) 0%, transparent 60%)",
          }}
        />

        <div className="relative z-10 max-w-5xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <LeftSection />
          <FormCard />
        </div>
      </div>
      <FooterSection />
      <LiveToast user={liveUser} />
      {modalOpen && <AutoModal onClose={() => setModalOpen(false)} />}
    </>
  );
}