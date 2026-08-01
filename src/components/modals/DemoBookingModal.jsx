"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  X,
  Loader2,
  User,
  Smartphone,
  Building2,
  ShieldCheck,
} from "lucide-react";

const FIXED_SLOTS = [
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
  "7:00 PM",
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const formatDateISO = (d) =>
  d
    ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate(),
      ).padStart(2, "0")}`
    : "";

/* ─── CALENDAR DROPDOWN ─── */
function CalendarDropdown({ value, onChange, onClose }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewDate, setViewDate] = useState(() => {
    const d = value ? new Date(value) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isPast = (d) => new Date(year, month, d) < today;
  const isSelected = (d) => {
    if (!value || !d) return false;
    const sel = new Date(value);
    return (
      sel.getFullYear() === year &&
      sel.getMonth() === month &&
      sel.getDate() === d
    );
  };
  const isToday = (d) =>
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === d;

  const handleSelect = (d) => {
    if (!d || isPast(d)) return;
    onChange(new Date(year, month, d));
    onClose();
  };

  return (
    <div className="absolute bottom-full left-0 w-full max-w-[250px] mb-2 z-[100] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100 bg-slate-50/50">
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all"
          aria-label="Previous month"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-[11px] font-bold text-slate-700 tracking-wide">
          {MONTHS[month]} {year}
        </span>
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all"
          aria-label="Next month"
        >
          <ChevronRight size={14} />
        </button>
      </div>
      <div className="p-2">
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map((d) => (
            <div
              key={d}
              className="text-center text-[10px] font-bold text-slate-400 py-0.5"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((d, i) => {
            const past = d ? isPast(d) : false;
            const selected = isSelected(d);
            return (
              <button
                key={i}
                type="button"
                disabled={!d || past}
                onClick={() => handleSelect(d)}
                className={`relative w-full aspect-square flex items-center justify-center rounded-md text-[11px] font-medium transition-all
                  ${!d ? "invisible" : ""}
                  ${past ? "text-slate-200 cursor-not-allowed" : "cursor-pointer"}
                  ${
                    selected
                      ? "bg-slate-900 text-white font-bold shadow-sm"
                      : !past && d
                        ? "hover:bg-slate-100 text-slate-700 hover:text-slate-900"
                        : ""
                  }`}
              >
                {d}
                {isToday(d) && !selected && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-[3px] h-[3px] rounded-full bg-amber-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── DATE PICKER FIELD ─── */
function DatePickerField({ value, onChange }) {
  const [calOpen, setCalOpen] = useState(false);
  const [textVal, setTextVal] = useState("");
  const [inputError, setInputError] = useState("");
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!value) {
      setTextVal("");
      return;
    }
    const d = new Date(value);
    setTextVal(
      `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`,
    );
  }, [value]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target))
        setCalOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleTextChange = (e) => {
    let raw = e.target.value.replace(/\D/g, "");
    if (raw.length > 8) raw = raw.slice(0, 8);

    let formatted = raw;
    if (raw.length >= 3) formatted = raw.slice(0, 2) + "/" + raw.slice(2);
    if (raw.length >= 5)
      formatted = raw.slice(0, 2) + "/" + raw.slice(2, 4) + "/" + raw.slice(4);

    setTextVal(formatted);
    setInputError("");

    if (raw.length === 8) {
      const dd = parseInt(raw.slice(0, 2), 10);
      const mm = parseInt(raw.slice(2, 4), 10) - 1;
      const yyyy = parseInt(raw.slice(4, 8), 10);
      const parsed = new Date(yyyy, mm, dd);
      const todayCheck = new Date();
      todayCheck.setHours(0, 0, 0, 0);

      if (
        parsed.getFullYear() !== yyyy ||
        parsed.getMonth() !== mm ||
        parsed.getDate() !== dd
      ) {
        setInputError("Invalid date format (DD/MM/YYYY)");
        onChange(null);
        return;
      }
      if (parsed < todayCheck) {
        setInputError("Date cannot be in the past");
        onChange(null);
        return;
      }
      onChange(parsed);
    } else if (value) {
      onChange(null);
    }
  };

  const hasError = !!inputError;

  return (
    <div className="relative" ref={wrapRef}>
      <div
        className={`flex items-center rounded-xl border transition-all duration-200
        ${hasError ? "border-red-300 bg-red-50/30" : value ? "border-slate-300 bg-white" : "border-slate-200 bg-slate-50/50"}
        focus-within:border-slate-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-slate-950/5`}
      >
        <button
          type="button"
          onClick={() => setCalOpen((v) => !v)}
          className="flex items-center justify-center w-10 h-11 flex-shrink-0"
          title="Pick from calendar"
        >
          <CalendarDays
            size={16}
            className={value ? "text-slate-800" : "text-slate-400"}
          />
        </button>

        <input
          type="text"
          inputMode="numeric"
          value={textVal}
          onChange={handleTextChange}
          onFocus={() => setCalOpen(true)}
          placeholder="DD/MM/YYYY"
          maxLength={10}
          className="flex-1 min-w-0 bg-transparent py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
        />

        {(value || textVal) && (
          <button
            type="button"
            onClick={() => {
              setTextVal("");
              setInputError("");
              onChange(null);
            }}
            className="w-9 h-11 flex items-center justify-center text-slate-400 hover:text-slate-600 flex-shrink-0"
            aria-label="Clear date"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {value && !hasError && (
        <p className="text-[11px] text-slate-500 mt-1.5 px-1 flex items-center gap-1.5 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {new Date(value).toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      )}

      {hasError && (
        <p className="text-[11px] text-red-500 mt-1.5 px-1 font-medium">
          {inputError}
        </p>
      )}

      {calOpen && (
        <CalendarDropdown
          value={value}
          onChange={onChange}
          onClose={() => setCalOpen(false)}
        />
      )}
    </div>
  );
}

/* ─── MODAL ─── */
export default function DemoBookingModal({ autoOpenDelay = 4000 }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const dialogRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    business: "",
    selectedDate: null,
  });
  const [selectedTime, setSelectedTime] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const close = useCallback(() => {
    setOpen(false);
    try {
      sessionStorage.setItem("demoModalSeen", "1");
    } catch {}
  }, []);

  /* auto open once per session */
  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem("demoModalSeen") === "1";
    } catch {}
    if (seen) return;
    const t = setTimeout(() => setOpen(true), autoOpenDelay);
    return () => clearTimeout(t);
  }, [autoOpenDelay]);

  /* esc to close + lock body scroll */
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  const isSunday = formData.selectedDate
    ? new Date(formData.selectedDate).getDay() === 0
    : false;

  const getAvailableSlots = () => {
    const selectedISO = formatDateISO(formData.selectedDate);
    const todayISO = formatDateISO(new Date());
    if (selectedISO !== todayISO) return FIXED_SLOTS;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();

    return FIXED_SLOTS.filter((slot) => {
      const [time, period] = slot.split(" ");
      let [hours] = time.split(":").map(Number);
      if (period === "PM" && hours !== 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;
      return (
        hours > currentHour || (hours === currentHour && currentMinutes < 30)
      );
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return setError("Please enter your full name.");
    if (!formData.contact.trim())
      return setError("Please enter your WhatsApp number.");
    if (!/^\d{10}$/.test(formData.contact.trim()))
      return setError("Enter a valid 10-digit WhatsApp number.");
    if (!formData.selectedDate)
      return setError("Please select a date for your demo.");
    if (isSunday)
      return setError(
        "Demos are not available on Sundays. Please pick another day.",
      );
    if (!selectedTime) return setError("Please choose an available time slot.");

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
          seminarTime: selectedTime,
          selectedDate: formatDateISO(formData.selectedDate),
          status: "Not Attended",
        }),
      });
      const result = await response.json();

      if (result.success) {
        const booking = {
          name: formData.name.trim(),
          phone: formData.contact.trim(),
          selectedDate: formatDateISO(formData.selectedDate),
          seminarTime: selectedTime,
        };

        try {
          await fetch("/api/demo-whatsapp-template", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(booking),
          });
        } catch (err) {
          console.error("WhatsApp template error:", err);
        }

        try {
          sessionStorage.setItem("demoModalSeen", "1");
        } catch {}

        const query = new URLSearchParams({
          name: booking.name,
          phone: booking.phone,
          date: booking.selectedDate,
          time: booking.seminarTime,
        }).toString();

        router.push(`/thank-you?${query}`);
      } else if (result.slotBooked && Array.isArray(result.availableSlots)) {
        setError(
          result.availableSlots.length
            ? `${result.message} Available: ${result.availableSlots.join(", ")}`
            : result.message ||
                "This slot is booked. Please pick another date.",
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

  if (!open) return null;

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", {
          weekday: "short",
          day: "numeric",
          month: "long",
        })
      : null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[4px] demoModalFade"
      onMouseDown={(e) => {
        if (!dialogRef.current?.contains(e.target)) close();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Book your free demo"
    >
      <div
        ref={dialogRef}
        className="relative w-full max-w-[440px] max-h-[92vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-slate-100 demoModalPop"
      >
        {/* Close Button */}
        <button
          onClick={close}
          className="absolute top-4 right-4 z-30 w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-800 rounded-full transition-all"
          aria-label="Close"
        >
          <X size={15} strokeWidth={2.5} />
        </button>

        {/* Elegant top accent bar */}
        <div className="h-[5px] w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />

        <div className="p-6 sm:p-7">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="font-bold text-xl text-slate-900 tracking-tight">
                Book Your Free Demo
              </h2>
              <p className="text-slate-500 text-xs mt-1">
                {formData.selectedDate
                  ? `${formatDate(formData.selectedDate)} · ${selectedTime || "Pick a time"}`
                  : "Select your preferred date and time below"}
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-200/50 rounded-xl px-3 py-1 flex-shrink-0">
              <span className="text-amber-800 text-xs font-bold tracking-wide">
                FREE
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="space-y-3.5">
              {/* Full Name */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <User size={15} />
                </span>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Your full name"
                  autoComplete="name"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-950/5 transition-all duration-200"
                />
              </div>

              {/* WhatsApp Number */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Smartphone size={15} />
                </span>
                <input
                  type="tel"
                  name="contact"
                  value={formData.contact}
                  onChange={handleInputChange}
                  placeholder="WhatsApp number (10 digits)"
                  maxLength={10}
                  autoComplete="tel"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-950/5 transition-all duration-200"
                />
              </div>

              {/* Business Name */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Building2 size={15} />
                </span>
                <input
                  type="text"
                  name="business"
                  value={formData.business}
                  onChange={handleInputChange}
                  placeholder="Business name (optional)"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-950/5 transition-all duration-200"
                />
              </div>

              {/* Date Picker */}
              <DatePickerField
                value={formData.selectedDate}
                onChange={(d) => {
                  setFormData((p) => ({ ...p, selectedDate: d }));
                  setSelectedTime("");
                  if (error) setError("");
                }}
              />

              {/* Sunday Alert */}
              {isSunday && (
                <div className="flex items-center gap-2.5 bg-amber-50/50 border border-amber-200/50 rounded-xl px-4 py-3">
                  <span className="text-amber-600 text-sm">⚠️</span>
                  <span className="text-amber-800 text-xs font-medium">
                    No demos on Sundays. Please select a weekday or Saturday.
                  </span>
                </div>
              )}

              {/* Time Slots Selection */}
              {formData.selectedDate && !isSunday && (
                <div className="space-y-2 pt-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Choose time slot
                  </p>
                  {getAvailableSlots().length === 0 ? (
                    <div className="space-y-3">
                      <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium leading-relaxed">
                        All slots for today are booked. Please specify your preferred time below.
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <Clock size={15} />
                        </span>
                        <input
                          type="text"
                          placeholder="e.g. 10:00 PM, Tomorrow 9 AM..."
                          value={selectedTime}
                          onChange={(e) => {
                            setSelectedTime(e.target.value);
                            if (error) setError("");
                          }}
                          className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-950/5 transition-all duration-200"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[190px] overflow-y-auto pr-1">
                      {getAvailableSlots().map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => {
                            setSelectedTime(slot);
                            if (error) setError("");
                          }}
                          className={`rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition duration-200 ${
                            selectedTime === slot
                              ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                              : "border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          {slot}
                          <span className={`block text-[10px] font-medium mt-0.5 ${selectedTime === slot ? "text-slate-300" : "text-emerald-600"}`}>
                            Available
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Confirmation Indicator */}
              {formData.selectedDate && !isSunday && selectedTime && (
                <div className="flex items-center gap-2.5 bg-emerald-50/40 border border-emerald-100 rounded-xl px-4 py-3">
                  <Clock size={14} className="text-emerald-600 flex-shrink-0" />
                  <span className="text-emerald-800 text-xs font-medium">
                    {formatDate(formData.selectedDate)} · {selectedTime} · 45-Min Live Demo
                  </span>
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <div className="flex items-start gap-2.5 bg-red-50/50 border border-red-200/50 rounded-xl px-4 py-3">
                  <span className="text-red-500 text-sm mt-0.5 flex-shrink-0">
                    ⚠️
                  </span>
                  <p className="text-red-700 text-xs font-medium leading-relaxed">
                    {error}
                  </p>
                </div>
              )}

              {/* Submission Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-all duration-200 active:scale-[0.98] mt-2 flex items-center justify-center gap-2 shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-slate-400" />
                    <span>Booking Session…</span>
                  </>
                ) : (
                  "Book Free Demo"
                )}
              </button>

              {/* Cancel Button */}
              <button
                type="button"
                onClick={close}
                className="w-full text-[10px] font-bold tracking-wider uppercase text-slate-400 hover:text-slate-600 transition-colors pt-1.5"
              >
                Maybe Later
              </button>
            </div>
          </form>

          {/* Footer Assurances */}
          <div className="flex items-center justify-center gap-3.5 mt-5 pt-4 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
            <span className="flex items-center gap-1">
              <ShieldCheck size={11} className="text-slate-400" /> Secure Booking
            </span>
            <span>·</span>
            <span>Reschedule Anytime</span>
            <span>·</span>
            <span>100% Free</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes demoModalFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes demoModalPopIn {
          from { opacity: 0; transform: translateY(12px) scale(0.98) }
          to { opacity: 1; transform: translateY(0) scale(1) }
        }
        .demoModalFade { animation: demoModalFadeIn .2s ease forwards }
        .demoModalPop { animation: demoModalPopIn .24s cubic-bezier(.16,1,.3,1) forwards }
      `}</style>
    </div>
  );
}