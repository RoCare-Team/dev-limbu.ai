"use client";

import { useEffect, useRef } from "react";

/**
 * At scheduled followUpDate: optional popup (onDueAlert), voice (TTS), optional notification.
 * Fires in a short window after the exact time so polling catches it.
 */
export function useFollowUpVoiceAlerts(
  items,
  { enabled = true, onDueAlert } = {},
) {
  const announcedRef = useRef(new Set());
  const permissionAskedRef = useRef(false);
  const itemsRef = useRef(items);
  const onDueAlertRef = useRef(onDueAlert);
  itemsRef.current = items;
  onDueAlertRef.current = onDueAlert;

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return undefined;

    if (
      enabled &&
      typeof Notification !== "undefined" &&
      Notification.permission === "default" &&
      !permissionAskedRef.current
    ) {
      permissionAskedRef.current = true;
      try {
        void Notification.requestPermission();
      } catch {
        /* ignore */
      }
    }

    const run = () => {
      const list = itemsRef.current || [];
      const now = Date.now();
      for (const it of list) {
        if (!it?.followUpDate) continue;
        const t = new Date(it.followUpDate).getTime();
        if (Number.isNaN(t)) continue;
        // Exact-ish: from due time up to 2 minutes after (tab may lag)
        if (now < t || now > t + 2 * 60 * 1000) continue;
        const key = `${it.id}-${Math.floor(t / 60000)}`;
        if (announcedRef.current.has(key)) continue;
        announcedRef.current.add(key);

        const name = (it.name || "Lead").trim() || "Lead";
        const line = `Follow-up time for ${name}. Please call now.`;

        if (typeof onDueAlertRef.current === "function") {
          try {
            onDueAlertRef.current({ ...it });
          } catch {
            /* ignore */
          }
        }

        try {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(line);
          u.lang = "en-IN";
          u.rate = 0.92;
          window.speechSynthesis.speak(u);
        } catch {
          /* ignore */
        }
        try {
          if (
            typeof Notification !== "undefined" &&
            Notification.permission === "granted"
          ) {
            new Notification("Follow-up due", { body: name, tag: key });
          }
        } catch {
          /* ignore */
        }
      }
    };

    run();
    const id = setInterval(run, 10000);
    return () => clearInterval(id);
  }, [enabled]);
}
