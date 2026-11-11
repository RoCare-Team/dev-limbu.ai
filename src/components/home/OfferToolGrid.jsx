"use client";

import { ToolCard } from "./ToolCard";
import UnlockBanner from "./unlock/UnlockBanner";
import PlanUnlockModal from "./unlock/PlanUnlockModal";
import { usePlanUnlock } from "@/hooks/usePlanUnlock";
import { PLAN_OFFERS } from "@/lib/planOffers";

/**
 * A home section's tools with its plan offer (lib/planOffers.js): subscribe
 * banner, the tool cards and the plans modal. Locked cards (see web.js) open
 * the modal; they unlock for users whose plan is in the offer's group.
 * `countTools` shows "all N tools" in the banner.
 */
export default function OfferToolGrid({ items, offerKey, variant, countTools = false }) {
  const offer = PLAN_OFFERS[offerKey];
  const { unlocked, justPaid, modal, openModal, closeModal, checkout } = usePlanUnlock(offer.planGroup);

  const cards = unlocked
    ? items.map((item) =>
        item.access?.status === "locked"
          ? { ...item, badge: item.badge === "UNLOCK" ? null : item.badge, access: { ...item.access, status: "active" } }
          : item
      )
    : items;

  return (
    <>
      <UnlockBanner
        offer={offer}
        unlocked={unlocked}
        toolCount={countTools ? items.length : null}
        onWatchDemo={() => openModal(null, true)}
        onSubscribe={() => openModal()}
      />

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {cards.map((item) => (
          <ToolCard key={item.key} item={item} onLockedClick={openModal} variant={variant} />
        ))}
      </div>

      <PlanUnlockModal
        offer={offer}
        open={!!modal}
        tool={modal?.tool || null}
        showDemo={!!modal?.demo}
        onClose={closeModal}
        checkout={checkout}
        paid={justPaid}
      />
    </>
  );
}
