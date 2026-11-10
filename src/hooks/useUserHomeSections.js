"use client";

import { useEffect, useState } from "react";
import { getLocalStorage } from "@/utils/storage";

/** Same rule the dashboard hooks use: impersonated user first, else own user. */
function activeUserId() {
  return getLocalStorage("isImpersonating") === "true"
    ? getLocalStorage("impersonatedUser")
    : getLocalStorage("userId");
}

/**
 * Home sections as the logged-in user sees them (/api/home-sections?userId=),
 * i.e. with their plan's badges, plus the plan groups they unlock.
 * Starts from `initialSections` (guest view rendered on the server) so the page
 * never shows an empty state while loading. `planGroups` is null until loaded.
 */
export function useUserHomeSections(initialSections = []) {
  const [sections, setSections] = useState(initialSections);
  const [planGroups, setPlanGroups] = useState(null);

  useEffect(() => {
    const userId = activeUserId();
    if (!userId) return;
    let cancelled = false;
    fetch(`/api/home-sections?userId=${encodeURIComponent(userId)}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (cancelled || !json?.success) return;
        setSections(json.data.sections || []);
        setPlanGroups(json.data.user?.planGroups || []);
      })
      .catch(() => {
        /* keep the guest view */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { sections, planGroups };
}
