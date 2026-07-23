"use client";

import { getLocalStorage, getSessionStorage } from "@/utils/storage";

/** Impersonation ko dhyan me rakhte hue app login token. */
export function getAppLoginToken() {
  const impersonating =
    getLocalStorage("isImpersonating") === "true" ||
    getSessionStorage("isImpersonating") === "true";

  if (impersonating) {
    return getSessionStorage("userToken") || getLocalStorage("userToken") || null;
  }
  return getLocalStorage("token") || null;
}

function tokenUserId(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]))?.userId || null;
  } catch {
    return null;
  }
}

// Ek hi waqt me kai callers ensure kar sakte hain (SessionCookieSync, connect
// button, connection hook) — sabko ek hi promise dete hain taaki cookie ek hi
// baar set ho aur race na bane.
let inflight = null;

/**
 * Guarantee: is promise ke resolve hone ke baad `limbu_app_session` cookie
 * sahi user ke liye set hai (ya user logged in hi nahi hai).
 *
 * Ye zaroori isliye hai kyunki app ka login token localStorage me hai —
 * server use tab tak nahi dekh sakta jab tak cookie mirror na ho. Cookie set
 * hone se PEHLE koi GMB call gayi to wo 401 deti thi, jisse "connect karte hi
 * /login" wala redirect aur UI flicker ho raha tha.
 *
 * @returns {Promise<boolean>} true = server ab is user ko pehchanta hai
 */
export function ensureAppSessionCookie() {
  if (inflight) return inflight;

  const run = (async () => {
    const token = getAppLoginToken();
    if (!token) return false; // app me logged in hi nahi

    try {
      const res = await fetch("/api/auth/session-cookie", { cache: "no-store" });
      const current = await res.json();

      // Cookie pehle se sahi user ki hai to dobara set mat karo.
      if (current?.active && current.userId === tokenUserId(token)) return true;

      const set = await fetch("/api/auth/session-cookie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      return set.ok;
    } catch (error) {
      console.warn("[clientSession] cookie sync failed:", error.message);
      return false;
    }
  })();

  inflight = run;
  // Agli call fresh check kare (impersonation switch ke liye zaroori).
  run.finally(() => {
    if (inflight === run) inflight = null;
  });

  return run;
}
