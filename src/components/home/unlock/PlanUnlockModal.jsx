"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Loader2, Lock, PlayCircle, ShieldCheck, ShoppingCart, Sparkles, X } from "lucide-react";
import { useCartStore } from "@/stores/useCartStore";
import { TileIcon } from "../toolIcons";
import { cycleInfo, offerPricing, toOfferCheckoutPlan } from "@/lib/planOffers";
import { actionHref } from "@/lib/homeSections/links";
import { formatInr } from "@/lib/seoPlans";

const INPUT =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#eab308] focus:bg-white focus:ring-4 focus:ring-[#facc15]/20";

/**
 * Subscribe without leaving the home page: the offer's plan tabs (billed in the
 * offer's cycle, see lib/planOffers.js), the buyer's details (guests) and Razorpay
 * checkout in one modal, then an "unlocked" screen with a button into the tool.
 *
 * `checkout` is usePlanCheckout() from the parent (it owns the Razorpay flow);
 * `paid` flips true after a verified payment. `tool` is the card that was
 * clicked, or null from the banner. `showDemo` opens with the video playing.
 */
export default function PlanUnlockModal({ offer, open, tool, showDemo = false, onClose, checkout, paid }) {
  const { handlePlanClick, modalProps } = checkout;
  const { isLoggedIn, loggedInUser, serviceForm, setServiceForm, handleServicePayment } = modalProps;
  const [demo, setDemo] = useState(showDemo);
  const [tierKey, setTierKey] = useState(offer.tiers[0].key);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const cartItems = useCartStore((s) => s.items);
  const addToCart = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.open);

  // Start on the first plan tab each time the modal opens.
  useEffect(() => {
    if (!open) return;
    setTierKey(offer.tiers[0].key);
    setDemo(showDemo);
    setError("");
  }, [open, showDemo, offer]);

  const tier = offer.tiers.find((t) => t.key === tierKey) || offer.tiers[0];

  // Hand the chosen plan to the Razorpay flow (usePlanCheckout).
  useEffect(() => {
    if (open) handlePlanClick(toOfferCheckoutPlan(offer, tier));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tierKey]);

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

  const plan = offerPricing(offer, tier);
  const inCart = cartItems.some((i) => i.offer === offer.key && i.tier === tier.key);
  const cartCount = cartItems.length;
  const cycle = cycleInfo(offer);
  const oneTime = offer.cycle === "one-time";
  const period = oneTime ? "one-time" : `${plan.months} month${plan.months > 1 ? "s" : ""}`;
  const setField = (name, value) => setServiceForm({ ...serviceForm, [name]: value });

  const pay = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      if (!/^[A-Za-z\s]{2,40}$/.test(serviceForm.name.trim())) return setError("Enter your name (letters only).");
      if (!/^[6-9]\d{9}$/.test(serviceForm.phone.trim())) return setError("Enter a valid 10-digit mobile number.");
      // create-or-find needs an email to set up the buyer's account
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(serviceForm.email.trim())) {
        return setError("Enter a valid email address.");
      }
    }
    setError("");
    setPaying(true);
    try {
      await handleServicePayment(e); // opens Razorpay; `paid` turns true after verification
    } finally {
      setPaying(false);
    }
  };

  const toolHref = tool ? actionHref(tool.action) : offer.homeHref;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={offer.heading}
        className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow ring-1 ring-slate-200 transition hover:text-slate-900"
        >
          <X size={18} />
        </button>

        {paid ? (
          /* ── Unlocked ── */
          <div className="px-6 py-12 text-center sm:px-12">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50">
              <CheckCircle2 size={34} />
            </span>
            <h2 className="mt-5 text-2xl font-black text-slate-900">
              {oneTime ? "Booking confirmed 🎉" : `${offer.toolsLabel} unlocked 🎉`}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              {oneTime
                ? `Your ${plan.title} is booked. Our team will call you shortly to get started.`
                : `Your ${plan.title} is active for ${period}. Everything in your plan is ready to use.`}
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              {isLoggedIn ? (
                <Link href={toolHref} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-black text-white hover:bg-slate-700">
                  {tool ? `Open ${tool.label}` : "Go to Dashboard"} <ArrowRight size={16} />
                </Link>
              ) : (
                <Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-black text-white hover:bg-slate-700">
                  Log in with {serviceForm.phone || "your phone"} to start <ArrowRight size={16} />
                </Link>
              )}
              <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
                Close
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ── Plan tabs ── */}
            <div className="border-b border-slate-100 px-6 pt-6 sm:px-8">
              <div className="flex flex-wrap items-center gap-2 pr-10">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-[#facc15]">
                  <Lock size={11} strokeWidth={3} /> Locked
                </span>
                {tool && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-700">
                    <TileIcon icon={tool.icon} size={13} /> {tool.label}
                  </span>
                )}
                <span className="text-xs font-semibold text-slate-400">{offer.note || cycle.note}</span>
              </div>
              <div role="tablist" aria-label="Plans" className="mt-4 flex gap-1 overflow-x-auto">
                {offer.tiers.map((t) => {
                  const selected = tierKey === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => setTierKey(t.key)}
                      className={`relative flex-shrink-0 rounded-t-xl px-4 pb-3 pt-2.5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#facc15] ${
                        selected ? "text-slate-900" : "text-slate-400 hover:text-slate-700"
                      }`}
                    >
                      <span className="flex items-center gap-1.5 text-sm font-black">
                        {t.title}
                        {t.popular && <span className="rounded-full bg-[#facc15] px-1.5 py-0.5 text-[9px] font-black uppercase text-black">Popular</span>}
                      </span>
                      <span className="block text-xs font-bold">{formatInr(t.perMonth)}{cycle.short}</span>
                      {selected && <span className="absolute inset-x-3 bottom-0 h-[3px] rounded-full bg-[#facc15]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid md:grid-cols-[1.1fr_1fr]">
              {/* ── Plan details ── */}
              <div className="border-b border-slate-100 p-6 sm:p-8 md:border-b-0 md:border-r">
                {demo && (
                  <div className="mb-5 aspect-video overflow-hidden rounded-2xl bg-black">
                    <iframe
                      src={`https://www.youtube.com/embed/${offer.demoVideoId}?autoplay=1&rel=0&modestbranding=1`}
                      title={`${offer.heading} demo`}
                      className="h-full w-full"
                      allow="autoplay; encrypted-media; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}
                <h2 className="text-2xl font-black leading-tight text-slate-900">{plan.title}</h2>
                <p className="mt-1 text-sm text-slate-500">{plan.tagline}</p>

                <ul className="mt-5 grid gap-2.5 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm font-semibold text-slate-700">
                      <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0 text-emerald-500" /> {f}
                    </li>
                  ))}
                </ul>

                {plan.addon && (
                  <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-[#fefce8] px-3.5 py-2.5 ring-1 ring-[#fde68a]">
                    <span className="rounded-md bg-slate-900 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-[#facc15]">Add-on</span>
                    <span className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
                      <Sparkles size={14} className="text-[#ca8a04]" /> {plan.addon}
                    </span>
                    <span className="ml-auto text-[11px] font-bold text-emerald-700">Included</span>
                  </div>
                )}

                {!demo && (
                  <button type="button" onClick={() => setDemo(true)} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-slate-900">
                    <PlayCircle size={18} className="text-[#eab308]" /> Watch the 1-minute demo
                  </button>
                )}
              </div>

              {/* ── Checkout ── */}
              <form onSubmit={pay} className="flex flex-col p-6 sm:p-8">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">{cycle.label}</p>
                <div className="mt-2 flex flex-wrap items-end gap-2">
                  <p className="text-4xl font-black text-slate-900">
                    {formatInr(plan.perMonth)}
                    <span className="text-base font-bold text-slate-400"> {cycle.unit}</span>
                  </p>
                  {plan.listPerMonth && (
                    <span className="mb-1.5 text-sm font-bold text-slate-400 line-through">{formatInr(plan.listPerMonth)}</span>
                  )}
                  {plan.savePct > 0 && (
                    <span className="mb-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-black text-emerald-700">Save {plan.savePct}%</span>
                  )}
                </div>
                <p className="text-xs font-semibold text-slate-500">Billed {formatInr(plan.price)} {cycle.every}</p>

                <div className="mt-4 space-y-1.5 rounded-2xl bg-slate-50 p-4 text-sm ring-1 ring-slate-100">
                  <div className="flex justify-between text-slate-600">
                    <span>{plan.title} · {period}</span>
                    <span className="font-semibold">{formatInr(plan.price)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST (18%)</span>
                    <span className="font-semibold">{formatInr(plan.gst)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1.5 font-black text-slate-900">
                    <span>Total today</span>
                    <span>{formatInr(plan.total)}</span>
                  </div>
                </div>

                {isLoggedIn ? (
                  <div className="mt-4 rounded-2xl border border-slate-200 p-3.5">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Subscribing as</p>
                    <p className="mt-1 text-sm font-bold text-slate-900">{loggedInUser?.name || "Your account"}</p>
                    <p className="text-xs text-slate-500">{[loggedInUser?.phone, loggedInUser?.email].filter(Boolean).join(" · ")}</p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-2.5">
                    <input
                      className={INPUT}
                      placeholder="Your name *"
                      autoComplete="name"
                      value={serviceForm.name}
                      onChange={(e) => setField("name", e.target.value.replace(/[^a-zA-Z\s]/g, ""))}
                    />
                    <input
                      className={INPUT}
                      placeholder="Mobile number *"
                      inputMode="numeric"
                      autoComplete="tel"
                      value={serviceForm.phone}
                      onChange={(e) => setField("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                    />
                    <input
                      className={INPUT}
                      placeholder="Email *"
                      type="email"
                      autoComplete="email"
                      value={serviceForm.email}
                      onChange={(e) => setField("email", e.target.value)}
                    />
                    <p className="text-[11px] text-slate-400">Use this mobile number to log in after paying.</p>
                  </div>
                )}

                {error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 ring-1 ring-rose-100">{error}</p>}

                <button
                  type="submit"
                  disabled={paying}
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-[#facc15] px-5 py-3.5 text-sm font-black text-slate-950 shadow-[0_6px_16px_rgba(234,179,8,0.35)] transition hover:bg-[#eab308] disabled:opacity-60"
                >
                  {paying ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  {paying ? "Opening payment…" : `Pay ${formatInr(plan.total)} & ${offer.payVerb || "Unlock"}`}
                </button>

                {/* Cart: buy several services in one payment */}
                {inCart ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      openCart();
                    }}
                    className="mt-2.5 inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100"
                  >
                    <CheckCircle2 size={16} /> Added to cart · View cart ({cartCount})
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => addToCart(offer.key, tier.key)}
                    className="mt-2.5 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-800 transition hover:border-slate-400"
                  >
                    <ShoppingCart size={16} /> Add to Cart
                  </button>
                )}
                <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-400">
                  <ShieldCheck size={13} /> Secure payment via Razorpay · {oneTime ? "Our team will contact you to get started" : "Unlocks instantly"}
                </p>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
