"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Loader2, ShieldCheck, ShoppingCart, Trash2, X } from "lucide-react";
import { useCartStore } from "@/stores/useCartStore";
import { useCartCheckout } from "@/hooks/useCartCheckout";
import { PLAN_OFFERS, cycleInfo, offerPricing } from "@/lib/planOffers";
import { formatInr } from "@/lib/seoPlans";

const INPUT =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#eab308] focus:bg-white focus:ring-4 focus:ring-[#facc15]/20";

/** Cart items with their offer, tier and price (items that no longer exist are dropped). */
function cartLines(items) {
  return items
    .map(({ offer, tier }) => {
      const o = PLAN_OFFERS[offer];
      const t = o?.tiers.find((x) => x.key === tier);
      return o && t ? { offer: o, tier: t, pricing: offerPricing(o, t) } : null;
    })
    .filter(Boolean);
}

/** Right-side drawer: cart lines, totals, buyer details and one payment for all plans. */
export default function CartDrawer() {
  const { items, isOpen, close, removeItem, clear } = useCartStore();
  const { loggedInUser, status, error, pay, reset } = useCartCheckout();
  const [guest, setGuest] = useState({ name: "", phone: "", email: "" });
  const [formError, setFormError] = useState("");

  const lines = cartLines(items);
  const totals = lines.reduce(
    (acc, l) => ({ price: acc.price + l.pricing.price, gst: acc.gst + l.pricing.gst, total: acc.total + l.pricing.total }),
    { price: 0, gst: 0, total: 0 }
  );

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, close]);

  // Rendered into <body>: the header's backdrop-blur would otherwise make this
  // fixed drawer only as tall as the header.
  if (!isOpen || typeof document === "undefined") return null;

  const onPay = async (e) => {
    e.preventDefault();
    if (!loggedInUser) {
      if (!/^[A-Za-z\s]{2,40}$/.test(guest.name.trim())) return setFormError("Enter your name (letters only).");
      if (!/^[6-9]\d{9}$/.test(guest.phone.trim())) return setFormError("Enter a valid 10-digit mobile number.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email.trim())) return setFormError("Enter a valid email address.");
    }
    setFormError("");
    const ok = await pay(items, guest);
    if (ok) clear();
  };

  const closeDrawer = () => {
    // After a purchase, reload so locked sections pick up the new plans.
    if (status === "success") {
      reset();
      window.location.reload();
      return;
    }
    close();
  };

  return createPortal(
    <div className="fixed inset-0 z-[1100] flex justify-end bg-slate-900/40 backdrop-blur-sm" onClick={closeDrawer}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Your cart"
        className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <p className="flex items-center gap-2 text-lg font-black text-slate-900">
            <ShoppingCart size={20} /> Your cart
            {lines.length > 0 && <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs text-[#facc15]">{lines.length}</span>}
          </p>
          <button type="button" onClick={closeDrawer} aria-label="Close cart" className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900">
            <X size={18} />
          </button>
        </header>

        {status === "success" ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50">
              <CheckCircle2 size={34} />
            </span>
            <h2 className="mt-5 text-2xl font-black text-slate-900">Payment successful 🎉</h2>
            <p className="mt-2 text-sm text-slate-500">All your plans are active. One-time services: our team will call you to get started.</p>
            <Link
              href={loggedInUser ? "/dashboard" : "/login"}
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-black text-white hover:bg-slate-700"
            >
              {loggedInUser ? "Go to Dashboard" : "Log in to start"} <ArrowRight size={16} />
            </Link>
          </div>
        ) : !lines.length ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <ShoppingCart size={40} className="text-slate-300" />
            <p className="mt-4 text-base font-black text-slate-900">Your cart is empty</p>
            <p className="mt-1 text-sm text-slate-500">Open any service on the home page and tap “Add to Cart”.</p>
            <Link href="/#all-tools" onClick={close} className="mt-6 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
              Browse services
            </Link>
          </div>
        ) : (
          <form onSubmit={onPay} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {lines.map(({ offer, tier, pricing }) => {
                const cycle = cycleInfo(offer);
                return (
                  <div key={offer.key} className="flex items-start gap-3 rounded-2xl border border-slate-200 p-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{offer.toolsLabel}</p>
                      <p className="text-sm font-black text-slate-900">{tier.title}</p>
                      <p className="text-xs text-slate-500">
                        {cycle.label} · {formatInr(pricing.price)} + GST
                      </p>
                    </div>
                    <p className="text-sm font-black text-slate-900">{formatInr(pricing.total)}</p>
                    <button type="button" onClick={() => removeItem(offer.key)} aria-label={`Remove ${tier.title}`} className="text-slate-400 hover:text-rose-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}

              <div className="space-y-1.5 rounded-2xl bg-slate-50 p-4 text-sm ring-1 ring-slate-100">
                <div className="flex justify-between text-slate-600">
                  <span>Plans ({lines.length})</span>
                  <span className="font-semibold">{formatInr(totals.price)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST (18%)</span>
                  <span className="font-semibold">{formatInr(totals.gst)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5 font-black text-slate-900">
                  <span>Total today</span>
                  <span>{formatInr(totals.total)}</span>
                </div>
              </div>

              {loggedInUser ? (
                <div className="rounded-2xl border border-slate-200 p-3.5">
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Paying as</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">{loggedInUser.name || "Your account"}</p>
                  <p className="text-xs text-slate-500">{[loggedInUser.phone, loggedInUser.email].filter(Boolean).join(" · ")}</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <input className={INPUT} placeholder="Your name *" autoComplete="name" value={guest.name} onChange={(e) => setGuest({ ...guest, name: e.target.value.replace(/[^a-zA-Z\s]/g, "") })} />
                  <input className={INPUT} placeholder="Mobile number *" inputMode="numeric" autoComplete="tel" value={guest.phone} onChange={(e) => setGuest({ ...guest, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} />
                  <input className={INPUT} placeholder="Email *" type="email" autoComplete="email" value={guest.email} onChange={(e) => setGuest({ ...guest, email: e.target.value })} />
                  <p className="text-[11px] text-slate-400">Use this mobile number to log in after paying.</p>
                </div>
              )}
            </div>

            <footer className="border-t border-slate-100 p-5">
              {(formError || error) && (
                <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 ring-1 ring-rose-100">{formError || error}</p>
              )}
              <button
                type="submit"
                disabled={status === "paying"}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#facc15] px-5 py-3.5 text-sm font-black text-slate-950 shadow-[0_6px_16px_rgba(234,179,8,0.35)] transition hover:bg-[#eab308] disabled:opacity-60"
              >
                {status === "paying" && <Loader2 size={16} className="animate-spin" />}
                {status === "paying" ? "Processing…" : `Pay ${formatInr(totals.total)} for ${lines.length} plan${lines.length > 1 ? "s" : ""}`}
              </button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-400">
                <ShieldCheck size={13} /> One secure payment via Razorpay
              </p>
            </footer>
          </form>
        )}
      </aside>
    </div>,
    document.body
  );
}
