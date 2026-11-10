"use client";

import dynamic from "next/dynamic";
import { CheckCircle2, ShieldCheck, Star } from "lucide-react";
import { usePlanCheckout } from "@/hooks/usePlanCheckout";
import { GST_RATE, SEO_PLANS, formatInr, toCheckoutPlan } from "@/lib/seoPlans";

const ServiceBookingModal = dynamic(() => import("@/components/modals/ServiceBookingModal"), { ssr: false });

/**
 * SEO plans with prices and a "Get Started" button that opens the same
 * booking + Razorpay checkout as the pricing page.
 * `recommended` is the plan title to highlight for this tool.
 */
export default function SeoPlansCheckout({ toolName, recommended }) {
  const { handlePlanClick, modalProps } = usePlanCheckout();

  return (
    <>
      <div className="grid gap-6 md:grid-cols-3">
        {SEO_PLANS.map((plan) => {
          const highlight = plan.title === recommended;
          const gst = Math.round(plan.basePrice * GST_RATE);
          return (
            <div
              key={plan.title}
              className={`relative flex flex-col rounded-3xl border bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)] ${
                highlight ? "border-[#eab308] ring-2 ring-[#facc15] ring-offset-2" : "border-slate-200"
              }`}
            >
              {highlight && (
                <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-[#facc15] px-3 py-1 text-[11px] font-black uppercase tracking-wide text-black shadow">
                  <Star size={11} className="fill-black" /> Best for {toolName}
                </span>
              )}

              <h3 className="text-xl font-black text-slate-900">{plan.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{plan.description}</p>

              <div className="mt-5">
                <span className="text-4xl font-black text-slate-900">{formatInr(plan.basePrice)}</span>
                <span className="ml-1 text-sm font-semibold text-slate-500">+ GST</span>
              </div>
              <p className="mt-1 text-xs font-medium text-slate-500">
                {formatInr(gst)} GST · {formatInr(plan.basePrice + gst)} total
              </p>

              <ul className="mt-6 flex-1 space-y-3">
                {plan.staticFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm font-medium text-slate-700">
                    <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0 fill-emerald-500 text-white" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => handlePlanClick(toCheckoutPlan(plan))}
                className={`mt-7 w-full rounded-xl py-3 text-sm font-bold transition-colors ${
                  highlight
                    ? "bg-[#eab308] text-slate-900 hover:bg-[#ca8a04]"
                    : "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
                }`}
              >
                Get Started
              </button>
            </div>
          );
        })}
      </div>

      <p className="mt-6 flex items-center justify-center gap-2 text-center text-sm font-medium text-slate-500">
        <ShieldCheck size={16} className="text-emerald-600" />
        Secure payment via Razorpay · UPI, cards and net banking
      </p>

      <ServiceBookingModal {...modalProps} />
    </>
  );
}
