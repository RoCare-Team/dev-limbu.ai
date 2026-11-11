"use client";

import dynamic from "next/dynamic";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { usePlanCheckout } from "@/hooks/usePlanCheckout";
import { GST_RATE, formatInr, toCheckoutPlan } from "@/lib/seoPlans";

const ServiceBookingModal = dynamic(() => import("@/components/modals/ServiceBookingModal"), { ssr: false });

/** One ad setup plan with price and "Get Started", using the site's booking + Razorpay checkout. */
export default function AdPlanCheckout({ plan }) {
  const { handlePlanClick, modalProps } = usePlanCheckout();
  const gst = Math.round(plan.basePrice * GST_RATE);

  return (
    <>
      <div className="mx-auto flex max-w-md flex-col rounded-3xl border border-[#eab308] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-2 ring-[#facc15] ring-offset-2">
        <h3 className="text-xl font-black text-slate-900">{plan.title}</h3>
        <p className="mt-1 text-sm text-slate-500">{plan.description}</p>
        <p className="mt-5 text-4xl font-black text-slate-900">
          {formatInr(plan.basePrice)}
          <span className="text-sm font-bold text-slate-500"> one-time</span>
        </p>
        <p className="text-xs font-semibold text-slate-500">
          + {formatInr(gst)} GST · ad spend paid directly to the platform
        </p>
        <ul className="mt-5 space-y-2">
          {plan.staticFeatures.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <CheckCircle2 size={16} className="flex-shrink-0 fill-emerald-500 text-white" /> {f}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => handlePlanClick(toCheckoutPlan(plan))}
          className="mt-6 rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-black text-white transition hover:bg-slate-700"
        >
          Get Started
        </button>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-400">
          <ShieldCheck size={13} /> Secure payment via Razorpay
        </p>
      </div>
      <ServiceBookingModal {...modalProps} />
    </>
  );
}
