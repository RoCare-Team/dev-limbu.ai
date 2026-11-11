"use client";

import { useCallback, useEffect, useState } from "react";
import { usePlanCheckout } from "@/hooks/usePlanCheckout";
import { useUserHomeSections } from "@/hooks/useUserHomeSections";

/**
 * State for a locked home section and its subscribe modal.
 * `planGroup` is the group a plan must be in to unlock (lib/userPlans.js).
 * Returns { unlocked, justPaid, modal, openModal, closeModal, checkout } where
 * modal is null (closed) or { tool, demo }.
 */
export function usePlanUnlock(planGroup) {
  const { planGroups } = useUserHomeSections();
  const [justPaid, setJustPaid] = useState(false);
  const [modal, setModal] = useState(null);
  const checkout = usePlanCheckout();
  const { bookingSuccess } = checkout.modalProps;

  useEffect(() => {
    if (bookingSuccess) setJustPaid(true);
  }, [bookingSuccess]);

  const openModal = useCallback((tool = null, demo = false) => setModal({ tool, demo }), []);
  const closeModal = useCallback(() => setModal(null), []);

  return {
    unlocked: justPaid || !!planGroups?.includes(planGroup),
    justPaid,
    modal,
    openModal,
    closeModal,
    checkout,
  };
}
