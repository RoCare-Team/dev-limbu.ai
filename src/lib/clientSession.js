"use client";

import { getLocalStorage, getSessionStorage } from "@/utils/storage";

/** JWT abhi zinda hai? (60s skew — clock thoda aage-peeche ho sakta hai) */
function isTokenAlive(token) {
  if (!token) return false;
  try {
    const { exp } = JSON.parse(atob(token.split(".")[1]));
    if (!exp) return true; // bina exp wala token server hi reject karega
    return exp * 1000 > Date.now() + 60_000;
  } catch {
    return false;
  }
}

/**
 * Impersonation ko dhyan me rakhte hue app login token.
 *
 * Do bugs jo yahan the:
 *
 *  1. `isImpersonating` localStorage me set hota hai (impersonate-login page) aur
 *     kabhi clear nahi hota — localStorage browser-wide aur permanent hai. Us
 *     browser me baad me koi NORMAL login kare, tab bhi ye 6-ghante wala
 *     `userToken` hi uthata tha, user ka apna 30-din wala `token` nahi. Nateeja:
 *     login karne ke kuch ghante baad hi "Your login session isn't active".
 *
 *  2. Impersonation token mar jaane par ye `null` laut deta tha, jabki usi
 *     browser me user ka apna valid token pada hota tha.
 *
 * Ab expiry client par bhi check hoti hai aur jo token ZINDA hai wahi chunte
 * hain — impersonation ko preference, par mar chuke token ke chakkar me valid
 * session nahi girta.
 */
export function getAppLoginToken() {
  const impersonating =
    getLocalStorage("isImpersonating") === "true" ||
    getSessionStorage("isImpersonating") === "true";

  const impersonationToken =
    getSessionStorage("userToken") || getLocalStorage("userToken") || null;
  const ownToken = getLocalStorage("token") || null;

  if (impersonating && isTokenAlive(impersonationToken)) return impersonationToken;
  if (isTokenAlive(ownToken)) return ownToken;

  // Impersonation khatam ho chuka hai par flag ab tak pada hai — hata do, warna
  // ye har agle login ko bhi shadow karta rahega.
  if (impersonating && !isTokenAlive(impersonationToken)) clearImpersonation();

  return ownToken || impersonationToken || null;
}

/**
 * Server calls ke liye identity header.
 *
 * Ye ZAROORI hai, sirf cookie kaafi nahi. `limbu_app_session` cookie
 * browser-wide hoti hai — ek hi browser me admin do users ko impersonate kare to
 * doosri tab ki cookie pehli ko overwrite kar deti hai. Tab A ka UI user A
 * dikhata rehta hai par uski API calls user B ban ke jaati thi: GMB connect user
 * B ke record par ban jata, disconnect user B ka hat jata, aur user A ko dobara
 * "Connect GMB" dikhta.
 *
 * `getAppUser()` server par Authorization header ko cookie se PEHLE dekhta hai,
 * isliye header bhejne se har tab ki apni identity sahi rehti hai.
 */
export function appAuthHeaders(extra = {}) {
  const token = getAppLoginToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : { ...extra };
}

/** Is tab me abhi impersonation chal raha hai? */
export function isImpersonatingNow() {
  return (
    getSessionStorage("isImpersonating") === "true" ||
    getLocalStorage("isImpersonating") === "true"
  );
}

/** Impersonation ke nishaan dono storages se hata do. */
export function clearImpersonation() {
  try {
    ["isImpersonating", "userToken", "impersonatedUser", "impersonatedEmail"].forEach(
      (k) => {
        window.localStorage?.removeItem(k);
        window.sessionStorage?.removeItem(k);
      },
    );
  } catch {
    /* storage blocked */
  }
}

/**
 * Mar chuke login ke nishaan hata do — warna AuthGuard (jo sirf `userId` dekhta
 * hai) user ko andar rehne deta hai aur har API call 401 deti rehti hai.
 */
function clearStaleLogin() {
  try {
    ["token", "userToken", "userId", "isImpersonating"].forEach((k) => {
      window.localStorage?.removeItem(k);
      window.sessionStorage?.removeItem(k);
    });
  } catch {
    /* storage blocked — kuch nahi kar sakte */
  }
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

      // 401 do wajah se aa sakta hai:
      //   • token sach me EXPIRE ho gaya → login saaf karo, warna AuthGuard
      //     (jo sirf `userId` dekhta hai) user ko andar rehne deta hai aur har
      //     server call 401 deti rehti hai.
      //   • token admin ka hai → usme `userId` hota hi nahi (adminId/role hote
      //     hain), isliye ye route hamesha 401 dega. Ye BILKUL normal hai —
      //     yahan login saaf karna admin ko admin panel se hi bahar phenk deta.
      if (set.status === 401) {
        if (!isTokenAlive(token)) clearStaleLogin();
        return false;
      }
      if (!set.ok) return false;

      // Set-Cookie sach me apply hui ya nahi, ye confirm karke hi aage badho.
      // Bina verify kiye pehli GMB call 401 de deti thi (pehle click par
      // "page refresh" jaisa behaviour), aur doosri baar cookie maujood hone
      // se sab theek lagta tha.
      const confirm = await fetch("/api/auth/session-cookie", {
        cache: "no-store",
      });
      const confirmed = await confirm.json();
      return confirmed?.active === true;
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
