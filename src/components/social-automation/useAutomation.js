"use client";

import { useCallback, useEffect, useState } from "react";

export const getUserId = () => {
  try {
    return localStorage.getItem("isImpersonating") === "true" ? localStorage.getItem("impersonatedUser") : localStorage.getItem("userId");
  } catch {
    return null;
  }
};

/**
 * Settings, accounts and activity for one automation feature
 * (/api/social/automation). `save(section, data)` updates and reloads.
 */
export function useAutomation(feature) {
  const [state, setState] = useState({ loading: true, error: "", settings: null, accounts: [], logs: [], socialPlan: null });
  const [userId, setUserId] = useState(null);

  const load = useCallback(async () => {
    const uid = getUserId();
    setUserId(uid);
    if (!uid) return setState((s) => ({ ...s, loading: false, error: "Please log in." }));
    try {
      const d = await fetch(`/api/social/automation?userId=${encodeURIComponent(uid)}&feature=${feature}`, { cache: "no-store" }).then((r) => r.json());
      if (!d.success) throw new Error(d.error);
      setState({ loading: false, error: "", settings: d.settings, accounts: d.accounts, logs: d.logs, socialPlan: d.socialPlan });
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: err.message || "Could not load." }));
    }
  }, [feature]);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(
    async (section, data) => {
      const d = await fetch("/api/social/automation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, section, data }),
      }).then((r) => r.json());
      if (!d.success) throw Object.assign(new Error(d.error || "Could not save."), { needsPlan: d.needsPlan });
      setState((s) => ({ ...s, settings: d.settings }));
      return d.settings;
    },
    [userId]
  );

  const preview = useCallback(
    async (body) => {
      const d = await fetch("/api/social/automation/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...body }),
      }).then((r) => r.json());
      if (!d.success) throw new Error(d.error || "Could not create a preview.");
      return d;
    },
    [userId]
  );

  return { ...state, userId, reload: load, save, preview };
}
