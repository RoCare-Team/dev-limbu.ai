"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { CheckCircle2, Lock, PlayCircle } from "lucide-react";
import { ToolCard } from "./ToolCard";
import GmbUnlockModal from "./GmbUnlockModal";
import { usePlanCheckout } from "@/hooks/usePlanCheckout";
import { useUserHomeSections } from "@/hooks/useUserHomeSections";
import { GMB_GST, GMB_PLAN, gmbCheckoutPlan } from "@/lib/gmbPlan";
import { formatInr } from "@/lib/seoPlans";

const ServiceBookingModal = dynamic(() => import("@/components/modals/ServiceBookingModal"), { ssr: false });

/**
 * Google Business Profile tools on the home page. They arrive locked (guest
 * view, see withGmbLock in lib/homeSections/web.js) and open for a user whose
 * plan is in the `gmb` group. Locked flow: card -> demo video + price ->
 * Subscribe Now -> booking + Razorpay -> tools unlocked.
 */
export default function GmbToolGrid({ items }) {
  const { planGroups } = useUserHomeSections();
  const [justPaid, setJustPaid] = useState(false);
  const [unlockTool, setUnlockTool] = useState(undefined); // undefined = closed, null = banner
  const { handlePlanClick, modalProps } = usePlanCheckout();

  const unlocked = justPaid || !!planGroups?.includes("gmb");

  useEffect(() => {
    if (modalProps.bookingSuccess) setJustPaid(true);
  }, [modalProps.bookingSuccess]);

  const closeUnlock = useCallback(() => setUnlockTool(undefined), []);
  const subscribe = () => {
    setUnlockTool(undefined);
    handlePlanClick(gmbCheckoutPlan());
  };

  const cards = unlocked
    ? items.map((item) =>
        item.access?.status === "locked"
          ? { ...item, badge: null, access: { ...item.access, status: "active" } }
          : item
      )
    : items;

  return (
    <>
      {unlocked ? (
        <div className="mt-7 flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 ring-1 ring-emerald-200 sm:mt-8 lg:mt-10">
          <CheckCircle2 size={18} /> GMB tools unlocked, open any tool below.
        </div>
      ) : (
        <div className="mt-7 flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.65)] sm:flex-row sm:items-center sm:justify-between sm:p-5 lg:mt-10">
          <div className="flex items-center gap-3.5">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#facc15] text-slate-950">
              <Lock size={18} strokeWidth={2.5} />
            </span>
            <div>
              <p className="text-[15px] font-black leading-snug text-white">
                {GMB_PLAN.title}: all {items.length} tools for{" "}
                <span className="text-[#facc15]">{formatInr(GMB_PLAN.basePrice)}/month</span>
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-300">
                + {formatInr(GMB_GST)} GST · Watch a short demo before you pay
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-shrink-0">
            <button
              type="button"
              onClick={() => setUnlockTool(null)}
              className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-600 bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:border-slate-400 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#facc15] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:w-auto"
            >
              <PlayCircle size={15} /> Watch Demo
            </button>
            <button
              type="button"
              onClick={() => setUnlockTool(null)}
              className="min-h-11 w-full whitespace-nowrap rounded-xl bg-[#facc15] px-5 py-2.5 text-sm font-black text-slate-950 transition-colors hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:w-auto"
            >
              Subscribe Now
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {cards.map((item) => (
          <ToolCard key={item.key} item={item} onLockedClick={setUnlockTool} variant="gbp" />
        ))}
      </div>

      <GmbUnlockModal
        open={unlockTool !== undefined}
        tool={unlockTool}
        onClose={closeUnlock}
        onSubscribe={subscribe}
      />
      <ServiceBookingModal {...modalProps} />
    </>
  );
}
