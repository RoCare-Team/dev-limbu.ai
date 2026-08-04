"use client";

import React, { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";

/**
 * Mobile ka feature tour.
 *
 * Touch device par hover nahi hota, isliye desktop wale tooltips wahan kaam ke
 * nahi the (atke hue dikhte the). Yahan asli card ko spotlight karke uske paas
 * hi step dikhaya jata hai — Next se agla feature, Skip se tour khatam.
 *
 * Card dhoondhne ke liye NavLinks har card par `data-tour-id={href}` deta hai.
 * Ek baar poora dekh liya ya skip kar diya to dobara nahi aata (localStorage).
 */
const GUIDE_SEEN_KEY = "limbu:dashboardFeatureGuideSeen";
const SPOT_PAD = 8; // highlight ring card se itna bahar

export default function MobileFeatureGuide({ items = [] }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState(null);

  const steps = items.filter((i) => i.tooltip);
  const item = steps[step];

  useEffect(() => {
    if (typeof window === "undefined" || !steps.length) return;

    // Sirf mobile width par — desktop par tooltips already hain.
    if (!window.matchMedia("(max-width: 767px)").matches) return;

    try {
      if (window.localStorage.getItem(GUIDE_SEEN_KEY)) return;
    } catch {
      /* storage blocked — tour dikha dete hain */
    }

    // Cards render/paint hone ke baad shuru karo.
    const timer = setTimeout(() => setOpen(true), 700);
    return () => clearTimeout(timer);
  }, [steps.length]);

  /* Current card ko view me lao aur uski position naapo. Smooth scroll ke baad
     bhi naapte hain, warna ring purani jagah par reh jati hai. */
  useEffect(() => {
    if (!open || !item) return;

    const el = document.querySelector(`[data-tour-id="${item.href}"]`);
    if (!el) {
      setRect(null);
      return;
    }

    const measure = () => setRect(el.getBoundingClientRect());

    el.scrollIntoView({ behavior: "smooth", block: "center" });
    measure();
    const timers = [180, 400, 700].map((ms) => setTimeout(measure, ms));

    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, item]);

  const dismiss = useCallback(() => {
    setOpen(false);
    try {
      window.localStorage.setItem(GUIDE_SEEN_KEY, "1");
    } catch {
      /* storage blocked — is session bhar band rahega */
    }
  }, []);

  if (!open || !item) return null;

  const isLast = step === steps.length - 1;
  const viewportH = typeof window !== "undefined" ? window.innerHeight : 0;

  // Bubble card ke neeche, aur neeche jagah na ho to upar.
  const showBelow = !rect || rect.bottom + 230 < viewportH;
  const bubbleStyle = rect
    ? showBelow
      ? { top: Math.round(rect.bottom + SPOT_PAD + 14) }
      : { bottom: Math.round(viewportH - rect.top + SPOT_PAD + 14) }
    : { bottom: 24 };

  return (
    <div className="fixed inset-0 z-[100] md:hidden">
      {/* SPOTLIGHT — bada box-shadow baaki screen ko dim karta hai, card saaf rehta hai */}
      {rect ? (
        <div
          className="pointer-events-auto absolute rounded-2xl ring-2 ring-yellow-400 transition-all duration-300"
          style={{
            top: Math.round(rect.top - SPOT_PAD),
            left: Math.round(rect.left - SPOT_PAD),
            width: Math.round(rect.width + SPOT_PAD * 2),
            height: Math.round(rect.height + SPOT_PAD * 2),
            boxShadow: "0 0 0 9999px rgba(15,23,42,0.72)",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-slate-900/70" />
      )}

      {/* STEP BUBBLE */}
      <div
        className="absolute left-3 right-3 rounded-2xl bg-white p-4 shadow-2xl"
        style={bubbleStyle}
      >
        {/* pointer — highlight ki taraf */}
        <span
          className={`absolute h-3 w-3 rotate-45 bg-white ${
            showBelow ? "-top-1.5" : "-bottom-1.5"
          }`}
          style={{
            left: rect
              ? Math.min(
                  Math.max(Math.round(rect.left + rect.width / 2 - 12), 18),
                  (typeof window !== "undefined" ? window.innerWidth : 360) - 42,
                )
              : "48%",
          }}
        />

        <div className="mb-2.5 flex items-center justify-between">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
            Step {step + 1} / {steps.length}
          </span>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Skip guide"
            className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-50 text-yellow-600 ring-1 ring-yellow-200">
            {React.cloneElement(item.icon, { size: 18 })}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-[13px] font-black uppercase tracking-tight text-slate-900">
                {item.label}
              </h3>
              {item.isFree && (
                <span className="rounded-full bg-yellow-100 px-1.5 py-[1px] text-[8px] font-black uppercase tracking-wider text-yellow-700 ring-1 ring-yellow-200">
                  Free
                </span>
              )}
            </div>
            <p className="mt-1.5 text-[12px] leading-relaxed text-slate-600">
              {item.tooltip}
            </p>
          </div>
        </div>

        <div className="mt-3.5 flex items-center justify-center gap-1.5">
          {steps.map((s, i) => (
            <span
              key={s.label}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? "w-5 bg-yellow-400" : "w-1.5 bg-slate-200"
              }`}
            />
          ))}
        </div>

        <div className="mt-3.5 flex items-center gap-3">
          <button
            type="button"
            onClick={dismiss}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-[13px] font-bold text-slate-500 transition-colors hover:bg-slate-50"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={() => (isLast ? dismiss() : setStep((s) => s + 1))}
            className="flex-1 rounded-xl bg-slate-900 py-2.5 text-[13px] font-bold text-white transition-transform active:scale-[0.98]"
          >
            {isLast ? "Got it" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
