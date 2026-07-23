"use client";

import { useEffect } from "react";
import { ensureAppSessionCookie } from "@/lib/clientSession";

/**
 * App ka login token localStorage me rehta hai, isliye API routes use apne aap
 * nahi dekh pate. Ye component use ek httpOnly cookie me mirror kar deta hai.
 *
 * Faayda: kisi bhi `fetch()` call site par Authorization header lagane ki
 * zaroorat nahi — cookie khud jati hai.
 *
 * Impersonation: admin ka apna tab aur impersonated tab ek hi cookie share karte
 * hain (cookie browser-wide hai, sessionStorage per-tab). Isliye focus par bhi
 * sync karte hain — jo tab active hai wahi cookie ka maalik banta hai.
 */
export default function SessionCookieSync() {
  useEffect(() => {
    ensureAppSessionCookie();

    const onFocus = () => ensureAppSessionCookie();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  return null;
}
