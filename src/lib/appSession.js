import jwt from "jsonwebtoken";

/**
 * Ek hi secret, poore app me.
 *
 * Pehle har route apna fallback rakhta tha — `admin/login-as-user` aur
 * `franchise-panel/login-as-user` `"fallback-secret-key"` se SIGN karte the,
 * jabki verify yahan `"mannubhai_secret"` se hota hai. Jis bhi environment me
 * `JWT_SECRET` set nahi hai, wahan impersonation ka token banate hi invalid ho
 * jata tha — user ko turant "Your login session isn't active" milta.
 * Sign aur verify dono ab isi constant se hote hain.
 */
export const APP_JWT_SECRET = process.env.JWT_SECRET || "mannubhai_secret";
const JWT_SECRET = APP_JWT_SECRET;

/** httpOnly cookie jo har fetch ke saath apne aap jata hai — isliye call sites badalne ki zaroorat nahi. */
export const APP_SESSION_COOKIE = "limbu_app_session";

/**
 * Session ki umr — login token (/api/auth/login) ke barabar rakhi jati hai.
 *
 * 7 din se badhakar 30 din: user ko har hafte phone+OTP se dobara login karna
 * padta tha. Aur wo confusing tha, kyunki AuthGuard localStorage ke `userId`
 * par chalta hai (jo kabhi expire nahi hota) — isliye UI logged-in dikhta tha
 * par server 401 deta tha ("Your login session isn't active").
 *
 * Iske upar session ROLLING hai (dekho: /api/auth/session-cookie GET) — active
 * user ki cookie har page load par 30 din aage badh jati hai, isliye regular
 * user ko practically kabhi dobara login nahi karna padta.
 */
export const APP_SESSION_DAYS = 30;
export const APP_SESSION_MAX_AGE = APP_SESSION_DAYS * 24 * 60 * 60;

/**
 * App ka apna login token verify karta hai (/api/auth/login ya
 * /api/admin/login-as-user dono JWT_SECRET se sign karte hain).
 */
function verifyAppToken(token) {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded?.userId) return null;
    return {
      userId: decoded.userId,
      email: decoded.email || null,
      impersonated: decoded.impersonated === true,
    };
  } catch {
    return null;
  }
}

/**
 * Impersonation session sirf 6h ki honi chahiye — bilkul localStorage wale
 * `userToken` jitni (dekho: admin/login-as-user route.js). Pehle ye bhi
 * 30-din wali cookie ban jati thi, isliye "Exited user view" / logout ke
 * baad bhi ye cookie zinda rehti thi aur GMB APIs impersonated user ban ke
 * hi authenticate hote rehte the.
 */
const IMPERSONATED_SESSION_HOURS = 6;
const IMPERSONATED_SESSION_MAX_AGE = IMPERSONATED_SESSION_HOURS * 60 * 60;

/** Cookie ke liye chhota session token banata hai. */
export function createAppSessionToken({ userId, email, impersonated }) {
  return jwt.sign(
    { userId, email: email || null, impersonated: impersonated === true },
    JWT_SECRET,
    {
      expiresIn: impersonated === true
        ? `${IMPERSONATED_SESSION_HOURS}h`
        : `${APP_SESSION_DAYS}d`,
    },
  );
}

export function appSessionCookieOptions({ impersonated } = {}) {
  return {
    name: APP_SESSION_COOKIE,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: impersonated === true ? IMPERSONATED_SESSION_MAX_AGE : APP_SESSION_MAX_AGE,
  };
}

/**
 * Chatbot flow ke liye alag, GMB-only cookie.
 *
 * Ye JAAN-BOOJHKAR app session cookie nahi hai: /connect-google-business par
 * user app me logged in nahi hota, sirf WhatsApp link ka phone hota hai. Use
 * poora app session dena zyada grant hota, isliye ye cookie sirf GMB routes ke
 * liye ek phone identity deti hai aur jaldi expire ho jati hai.
 */
export const GMB_PHONE_COOKIE = "limbu_gmb_phone";

/**
 * 12 ghante. Pehle 2 the — WhatsApp user connect karke beech me chala jata tha
 * aur wapas aakar "Continue to chatbot" dabaata, tab tak cookie mar chuki hoti
 * aur my-locations / sync-and-save "Unauthorized" de dete the.
 * Scope phir bhi tang hai: sirf GMB routes, sirf us ek phone ki identity.
 */
const GMB_PHONE_HOURS = 12;
const GMB_PHONE_MAX_AGE = GMB_PHONE_HOURS * 60 * 60;

export function createGmbPhoneToken(phone) {
  return jwt.sign({ phone, scope: "gmb" }, JWT_SECRET, {
    expiresIn: `${GMB_PHONE_HOURS}h`,
  });
}

export function gmbPhoneCookieOptions() {
  return {
    name: GMB_PHONE_COOKIE,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: GMB_PHONE_MAX_AGE,
  };
}

/** @returns {string|null} verified phone digits */
export function getGmbPhone(request) {
  const cookie = request?.cookies?.get?.(GMB_PHONE_COOKIE);
  const value = typeof cookie === "string" ? cookie : cookie?.value;
  if (!value) return null;
  try {
    const decoded = jwt.verify(value, JWT_SECRET);
    return decoded?.scope === "gmb" && decoded?.phone ? String(decoded.phone) : null;
  } catch {
    return null;
  }
}

/**
 * Request se app user resolve karta hai.
 *
 * Order:
 *   1. `Authorization: Bearer <app jwt>`  — jahan client pehle se header bhejta hai
 *   2. `limbu_app_session` httpOnly cookie — baaki sab jagah (default)
 *
 * `?userId=` query param yahan JAAN-BOOJHKAR nahi padha jata: wo caller-supplied
 * hai aur authentication nahi hai.
 *
 * @returns {{userId: string, email: string|null, impersonated: boolean}|null}
 */
export function getAppUser(request) {
  const authHeader =
    request?.headers?.get?.("authorization") ||
    request?.headers?.authorization ||
    "";
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    const fromHeader = verifyAppToken(authHeader.slice(7).trim());
    if (fromHeader) return fromHeader;
  }

  const cookie = request?.cookies?.get?.(APP_SESSION_COOKIE);
  const cookieValue = typeof cookie === "string" ? cookie : cookie?.value;
  return verifyAppToken(cookieValue);
}
