"use client";

import dynamic from "next/dynamic";
import { Check, Phone, Sparkles } from "lucide-react";
import SectionHeading from "./SectionHeading";
import { usePlanCheckout } from "@/hooks/usePlanCheckout";
import { GST_RATE, WEB_DEVELOPMENT_PLANS, toCheckoutPlan } from "@/lib/webPlans";

// Only needed once a plan is picked.
const ServiceBookingModal = dynamic(() => import("@/components/modals/ServiceBookingModal"), {
  ssr: false,
});

const inr = (n) => `₹${n.toLocaleString("en-IN")}`;

function PlanCard({ plan, onChoose }) {
  const popular = plan.popular;
  return (
    <div
      className={`relative flex flex-col rounded-3xl border p-7 transition-all duration-300 hover:-translate-y-1 ${
        popular
          ? "border-slate-900 bg-slate-900 text-white shadow-[0_30px_60px_-20px_rgba(15,23,42,0.6)]"
          : "border-slate-200 bg-white hover:border-amber-300 hover:shadow-[0_20px_40px_-12px_rgba(234,179,8,0.3)]"
      }`}
    >
      {popular && (
        <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-[#facc15] px-3 py-1 text-[11px] font-black uppercase tracking-wide text-black">
          <Sparkles size={12} /> Most popular
        </span>
      )}

      <h3 className={`text-lg font-black ${popular ? "text-white" : "text-slate-900"}`}>{plan.title}</h3>
      <p className={`mt-1 text-sm font-medium ${popular ? "text-white/60" : "text-slate-500"}`}>
        {plan.description}
      </p>

      <div className="mt-6 flex items-end gap-1.5">
        <span
          className={`text-4xl font-black tracking-tight ${popular ? "text-[#facc15]" : "text-slate-900"}`}
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {inr(plan.basePrice)}
        </span>
        <span className={`pb-1.5 text-sm font-semibold ${popular ? "text-white/50" : "text-slate-400"}`}>
          + {Math.round(GST_RATE * 100)}% GST
        </span>
      </div>
      <p className={`text-xs font-semibold ${popular ? "text-white/50" : "text-slate-400"}`}>One-time payment</p>

      <div
        className={`mt-6 rounded-xl px-4 py-3 text-sm font-bold ${
          popular ? "bg-white/10 text-white" : "bg-slate-50 text-slate-800"
        }`}
      >
        {plan.basePages} professional pages
      </div>

      <ul className="mt-5 flex-1 space-y-3">
        {plan.staticFeatures.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm font-semibold">
            <span
              className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${
                popular ? "bg-[#facc15] text-black" : "bg-slate-900 text-white"
              }`}
            >
              <Check size={12} strokeWidth={3} />
            </span>
            <span className={popular ? "text-white/90" : "text-slate-700"}>{f}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onChoose(toCheckoutPlan(plan))}
        className={`mt-8 w-full rounded-2xl py-3.5 text-sm font-black transition-all ${
          popular
            ? "bg-[#facc15] text-black hover:bg-[#fde047]"
            : "bg-slate-900 text-white hover:bg-slate-700"
        }`}
      >
        Choose {plan.title.replace(" Website", "")}
      </button>
    </div>
  );
}

export default function WebPricing() {
  const { handlePlanClick, modalProps } = usePlanCheckout();

  return (
    <section id="pricing" className="scroll-mt-24 border-y border-slate-200 bg-slate-50 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <SectionHeading
          eyebrow="Pricing"
          title="Simple pricing, no hidden costs"
          text="Pick a plan that fits your business. Pay once and we build, launch and support your site."
        />

        <div className="mx-auto mt-14 grid max-w-6xl gap-6 lg:grid-cols-3 lg:items-center">
          {WEB_DEVELOPMENT_PLANS.map((plan) => (
            <PlanCard key={plan.title} plan={plan} onChoose={handlePlanClick} />
          ))}
        </div>

        <div className="mx-auto mt-10 flex max-w-3xl flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-5 sm:flex-row">
          <div>
            <div className="text-base font-black text-slate-900">Need more pages or something custom?</div>
            <div className="text-sm font-medium text-slate-500">Tell us what you need and we&apos;ll share a quote.</div>
          </div>
          <a
            href="tel:+919289344726"
            className="inline-flex flex-shrink-0 items-center gap-2 rounded-full border-2 border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-800 transition-colors hover:border-slate-900"
          >
            <Phone size={15} /> +91 92893 44726
          </a>
        </div>
      </div>

      <ServiceBookingModal {...modalProps} />
    </section>
  );
}
