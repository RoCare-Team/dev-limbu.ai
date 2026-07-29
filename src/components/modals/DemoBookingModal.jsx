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
  Video,
  Users,
  Gift,
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
    <div className="absolute bottom-full left-0 w-[260px] mb-2 z-50 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all"
          aria-label="Previous month"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-xs font-bold text-slate-800 tracking-wide">
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
              className="text-center text-[10px] font-semibold text-slate-400 py-0.5"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            const past = d ? isPast(d) : false;
            const selected = isSelected(d);
            return (
              <button
                key={i}
                type="button"
                disabled={!d || past}
                onClick={() => handleSelect(d)}
                className={`relative w-full aspect-square flex items-center justify-center rounded-md text-xs font-medium transition-all
                  ${!d ? "invisible" : ""}
                  ${past ? "text-slate-300 cursor-not-allowed" : "cursor-pointer"}
                  ${
                    selected
                      ? "bg-gradient-to-br from-yellow-400 to-amber-400 text-black font-black shadow-md shadow-yellow-400/20"
                      : !past && d
                        ? "hover:bg-slate-100 text-slate-700 hover:text-slate-900"
                        : ""
                  }`}
              >
                {d}
                {isToday(d) && !selected && (
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
    } else if (value) {
      onChange(null);
    }
  };

  const hasError = !!inputError;

  return (
    <div className="relative" ref={wrapRef}>
      <div
        className={`flex items-center rounded-xl border overflow-hidden transition-all
        ${hasError ? "border-red-300 bg-red-50" : value ? "border-yellow-300 bg-yellow-50" : "border-slate-200 bg-slate-50"}
        focus-within:border-yellow-400 focus-within:bg-white`}
      >
        <button
          type="button"
          onClick={() => setCalOpen((v) => !v)}
          className="flex items-center justify-center w-10 h-11 flex-shrink-0"
          title="Pick from calendar"
        >
          <CalendarDays
            size={15}
            className={value ? "text-yellow-600" : "text-slate-400"}
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
          className="flex-1 min-w-0 bg-transparent py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
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
            <X size={13} />
          </button>
        )}
      </div>

      {value && !hasError && (
        <p className="text-[11px] text-yellow-600 mt-1.5 px-1 flex items-center gap-1">
          <span>📅</span>{" "}
          {new Date(value).toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      )}

      {hasError && (
        <p className="text-[11px] text-red-500 mt-1.5 px-1 font-semibold">
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
      className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm demoModalFade"
      onMouseDown={(e) => {
        if (!dialogRef.current?.contains(e.target)) close();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Book your free demo"
    >
      <div
        ref={dialogRef}
        className="relative w-full max-w-[440px] max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-2xl demoModalPop"
      >
        {/* Close */}
        <button
          onClick={close}
          className="absolute top-3 right-3 z-30 w-9 h-9 flex items-center justify-center bg-white/90 hover:bg-slate-900 text-slate-500 hover:text-white rounded-full shadow-md border border-slate-200 transition-all hover:rotate-90"
          aria-label="Close"
        >
          <X size={17} strokeWidth={2.5} />
        </button>

        <div className="h-1 w-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-t-2xl" />

        <div className="bg-red-50 border-b border-red-100 px-5 py-3 flex items-center gap-3 pr-14">
          <span className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <p className="text-xs text-red-600 font-semibold">
            ⚡ Hurry! <span className="text-red-800 font-black">1 Hour Left</span>{" "}
            —{" "}
            <span className="text-slate-900 font-black">
              Limited Seats Available
            </span>
          </p>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-black text-lg text-slate-900">
                Book Your Free Demo
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">
                {formData.selectedDate
                  ? `${formatDate(formData.selectedDate)} · ${selectedTime || "Pick a time"}`
                  : "9 AM – 9 PM IST · Online · Mon – Sat"}
              </p>
            </div>
            <div className="bg-green-100 border border-green-200 rounded-xl px-3 py-1.5 text-center flex-shrink-0">
              <p className="text-green-700 text-base font-black leading-none">
                FREE
              </p>
            </div>
          </div>

          {/* Value props */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { icon: <Video size={13} />, label: "45 min live" },
              { icon: <Users size={13} />, label: "1-on-1 expert" },
              { icon: <Gift size={13} />, label: "No payment" },
            ].map((f) => (
              <div
                key={f.label}
                className="flex flex-col items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl py-2 px-1"
              >
                <span className="text-yellow-500">{f.icon}</span>
                <span className="text-[10px] font-semibold text-slate-600 text-center leading-tight">
                  {f.label}
                </span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="space-y-3">
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
                  className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-yellow-400 focus:bg-white transition-all"
                />
              </div>

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
                  className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-yellow-400 focus:bg-white transition-all"
                />
              </div>

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
                  className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-yellow-400 focus:bg-white transition-all"
                />
              </div>

              <DatePickerField
                value={formData.selectedDate}
                onChange={(d) => {
                  setFormData((p) => ({ ...p, selectedDate: d }));
                  setSelectedTime("");
                  if (error) setError("");
                }}
              />

              {isSunday && (
                <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5">
                  <span className="text-orange-500 text-sm">⚠️</span>
                  <span className="text-orange-800 text-xs font-semibold">
                    No demos on Sundays — please pick another day.
                  </span>
                </div>
              )}

              {formData.selectedDate && !isSunday && (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Choose time slot
                  </p>
                  {getAvailableSlots().length === 0 ? (
                    <div className="space-y-2">
                      <div className="text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 font-semibold">
                        Aaj ke saare slots complete ho gaye — apna preferred time
                        likhein.
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
                          className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-yellow-400 focus:bg-white transition-all"
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
                          className={`rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition ${
                            selectedTime === slot
                              ? "border-yellow-400 bg-yellow-50 text-yellow-900 ring-2 ring-yellow-300"
                              : "border-slate-200 bg-slate-50 text-slate-700 hover:border-yellow-300"
                          }`}
                        >
                          {slot}
                          <span className="block text-[10px] font-medium text-emerald-600 mt-0.5">
                            Available
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {formData.selectedDate && !isSunday && selectedTime && (
                <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2.5">
                  <Clock size={13} className="text-yellow-600 flex-shrink-0" />
                  <span className="text-yellow-800 text-xs font-semibold">
                    {formatDate(formData.selectedDate)} · {selectedTime} · 45 min
                    · Online
                  </span>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                  <span className="text-red-500 text-sm mt-0.5 flex-shrink-0">
                    ⚠
                  </span>
                  <p className="text-red-700 text-xs font-semibold leading-relaxed">
                    {error}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-amber-300 disabled:opacity-60 disabled:cursor-not-allowed text-black font-black rounded-xl text-sm sm:text-base transition-all active:scale-[0.98] shadow-lg shadow-yellow-400/20 mt-1 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Booking your demo…</span>
                  </>
                ) : (
                  "🚀 Book My FREE Demo Now"
                )}
              </button>

              <button
                type="button"
                onClick={close}
                className="w-full text-[10px] font-bold tracking-[0.15em] uppercase text-slate-400 hover:text-slate-600 transition-colors pt-1"
              >
                No thanks, maybe later
              </button>
            </div>
          </form>

          <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
            <span className="flex items-center gap-1">
              <ShieldCheck size={10} /> No spam
            </span>
            <span>·</span>
            <span>Cancel anytime</span>
            <span>·</span>
            <span>100% free</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes demoModalFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes demoModalPopIn {
          from { opacity: 0; transform: translateY(16px) scale(0.96) }
          to { opacity: 1; transform: translateY(0) scale(1) }
        }
        .demoModalFade { animation: demoModalFadeIn .2s ease forwards }
        .demoModalPop { animation: demoModalPopIn .28s cubic-bezier(.2,.9,.3,1) forwards }
      `}</style>
    </div>
  );
}
