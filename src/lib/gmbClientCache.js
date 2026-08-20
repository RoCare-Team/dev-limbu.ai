"use client";

/**
 * Logout / exit-impersonation ke waqt GMB ka client-side pichhla nishaan
 * saaf karna.
 *
 * Do cheezein clear karni padti hain, warna GMB "logout" ke baad bhi
 * connected dikhta rehta ya galat user ka data dikha deta hai:
 *
 *  1. `gmb_data_<key>` sessionStorage cache (useGMB.js) — 10 minute tak
 *     stale listings serve karta hai, chahe DB se connection delete ho
 *     chuka ho ya user badal chuka ho.
 *  2. `limbu_app_session` httpOnly cookie — sirf client se delete nahi ho
 *     sakti (httpOnly), isliye DELETE /api/auth/session-cookie call karke
 *     server se hataani padti hai. Ye cookie hi GMB APIs (getAppUser) ko
 *     authenticate karti hai; ise chhod dena poori is-bug ki jad tha —
 *     "logout" ke baad bhi GMB connected/authenticated rehta tha.
 */

/** Server se httpOnly app-session cookie clear karo (GMB auth isi par tikta hai). */
export async function clearGmbSessionCookie() {
  try {
    await fetch("/api/auth/session-cookie", { method: "DELETE" });
  } catch {
    /* best-effort — network down ho to bhi logout aage badhna chahiye */
  }
}

/** sessionStorage se sabhi `gmb_data_*` cached listings hata do. */
export function clearGmbDataCache() {
  if (typeof window === "undefined") return;
  try {
    const keys = [];
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const k = window.sessionStorage.key(i);
      if (k && k.startsWith("gmb_data_")) keys.push(k);
    }
    keys.forEach((k) => window.sessionStorage.removeItem(k));
  } catch {
    /* storage blocked */
  }
}
