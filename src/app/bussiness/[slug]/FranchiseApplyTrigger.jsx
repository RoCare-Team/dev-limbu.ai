"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";

/**
 * Pehle poora `FranchisePageClient` (form + Razorpay flow + payment state)
 * har page load par download aur hydrate hota tha, jabki uska kaam sirf tab
 * shuru hota hai jab user "Apply Now" dabaye. Wahi JS main thread par baithkar
 * INP kharab kar raha tha.
 *
 * Ab ye chhota trigger hi initial bundle me jata hai:
 *   - ek delegated click listener document par (buttons ke DOM me aane ka
 *     intezaar nahi karna padta),
 *   - bhaari modal alag chunk me, jo browser idle hone par ya CTA par pointer
 *     aate hi warm ho jata hai — to click par koi visible delay nahi rehta.
 */
const FranchiseApplyModal = dynamic(() => import("./FranchisePageClient"), {
  ssr: false,
  // Slow connection par pehla click "kuch hua hi nahi" jaisa na lage.
  loading: () => (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      role="status"
      aria-label="Opening application form"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/25 border-t-lemon-glow" />
    </div>
  ),
});

const CTA_SELECTOR = '[data-franchise-action="open"]';

// Sirf ek hi baar chunk mangwane ke liye — warm() kai jagah se call hota hai.
let modalChunk = null;
function warmModalChunk() {
  modalChunk = modalChunk || import("./FranchisePageClient");
  return modalChunk;
}

export default function FranchiseApplyTrigger({ cityName }) {
  // null = modal abhi tak khula hi nahi, isliye kuch render nahi hota.
  const [activePlan, setActivePlan] = useState(null);

  const handleClose = useCallback(() => setActivePlan(null), []);

  useEffect(() => {
    const onClick = (event) => {
      const trigger = event.target.closest?.(CTA_SELECTOR);
      if (!trigger) return;
      warmModalChunk();
      setActivePlan(trigger.dataset.plan || "premium");
    };

    // Pointer CTA par aate hi chunk fetch — click tak aksar ready hota hai.
    const onPointerOver = (event) => {
      if (event.target.closest?.(CTA_SELECTOR)) warmModalChunk();
    };

    document.addEventListener("click", onClick);
    document.addEventListener("pointerover", onPointerOver, { passive: true });

    // Warna page settle hone ke baad background me le aao.
    const idleId = window.requestIdleCallback
      ? window.requestIdleCallback(warmModalChunk, { timeout: 4000 })
      : window.setTimeout(warmModalChunk, 2500);

    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("pointerover", onPointerOver);
      if (window.cancelIdleCallback) window.cancelIdleCallback(idleId);
      else window.clearTimeout(idleId);
    };
  }, []);

  if (!activePlan) return null;

  return (
    <FranchiseApplyModal
      cityName={cityName}
      autoOpenPlan={activePlan}
      onClose={handleClose}
    />
  );
}
