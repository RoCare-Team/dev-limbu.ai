"use client";

import { useEffect } from "react";
import { CheckCircle2, Lock, PlayCircle, X } from "lucide-react";
import { TileIcon } from "./toolIcons";
import { GMB_DEMO_VIDEO_ID, GMB_GST, GMB_PLAN, GMB_TOTAL } from "@/lib/gmbPlan";
import { formatInr } from "@/lib/seoPlans";

/**
 * Step one of unlocking the GMB tools: the demo video plays, with the plan,
 * price and a "Subscribe Now" button underneath. Subscribing hands over to the
 * normal booking + Razorpay modal (see GmbToolGrid).
 * `tool` is the card that was clicked, or null when opened from the banner.
 */
export default function GmbUnlockModal({ open, tool, onClose, onSubscribe }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Unlock GMB tools"
        className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black"
        >
          <X size={18} />
        </button>

        {/* Demo video — starts on open */}
        <div className="aspect-video w-full overflow-hidden rounded-t-3xl bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${GMB_DEMO_VIDEO_ID}?autoplay=1&rel=0&modestbranding=1`}
            title="Limbu AI GMB tools demo"
            className="h-full w-full"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-[#facc15]">
              <Lock size={11} strokeWidth={3} /> Locked
            </span>
            {tool && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-700">
                <TileIcon icon={tool.icon} size={13} /> {tool.label}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <PlayCircle size={14} /> Watch the demo, then subscribe
            </span>
          </div>

          <h2 className="mt-4 text-2xl font-black leading-tight text-slate-900 sm:text-3xl">
            Unlock all GMB tools
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500">{GMB_PLAN.description}</p>

          <div className="mt-6 grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
            <ul className="grid gap-2 sm:grid-cols-2">
              {GMB_PLAN.staticFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm font-semibold text-slate-700">
                  <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0 text-emerald-500" /> {f}
                </li>
              ))}
            </ul>

            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 sm:min-w-[220px]">
              <p className="text-3xl font-black text-slate-900">
                {formatInr(GMB_PLAN.basePrice)}
                <span className="text-sm font-bold text-slate-500"> / month</span>
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                + {formatInr(GMB_GST)} GST = {formatInr(GMB_TOTAL)}
              </p>
              <button
                type="button"
                onClick={onSubscribe}
                className="mt-4 w-full rounded-xl bg-[#facc15] px-5 py-3 text-sm font-black text-black shadow-[0_6px_16px_rgba(234,179,8,0.4)] transition hover:bg-[#eab308]"
              >
                Subscribe Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
