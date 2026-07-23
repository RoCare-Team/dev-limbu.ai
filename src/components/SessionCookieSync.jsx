"use client";

import { useEffect } from "react";
import { getAppLoginToken } from "@/hooks/useGmbConnection";

/**
 * App ka login token localStorage me rehta hai, isliye API routes use apne aap
 * nahi dekh pate. Ye component use ek httpOnly cookie me mirror kar deta hai.
 *
 * Faayda: kisi bhi `fetch()` call site par Authorization header lagane ki
 * zaroorat nahi — cookie khud jati hai. Isi wajah se migration me client code
 * lagbhag chhua hi nahi gaya.
 *
 * Impersonation: admin ka apna tab aur impersonated tab ek hi cookie share karte
 * hain (cookie browser-wide hai, sessionStorage per-tab). Isliye focus par bhi
 * sync karte hain — jo tab active hai wahi cookie ka maalik banta hai.
 */
function localUserId(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload?.userId || null;
  } catch {
    return null;
  }
}

export default function SessionCookieSync() {
  useEffect(() => {
    let cancelled = false;

    async function sync() {
      const token = getAppLoginToken();
      if (!token || cancelled) return;

      try {
        const res = await fetch("/api/auth/session-cookie", { cache: "no-store" });
        const current = await res.json();
        if (cancelled) return;

        // Cookie pehle se sahi user ki hai to kuch mat karo.
        if (current?.active && current.userId === localUserId(token)) return;

        await fetch("/api/auth/session-cookie", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
      } catch (error) {
        console.warn("[SessionCookieSync]", error.message);
      }
    }

    sync();
    window.addEventListener("focus", sync);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", sync);
    };
  }, []);

  return null;
}
