import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "mannubhai_secret";

/** httpOnly cookie jo har fetch ke saath apne aap jata hai — isliye call sites badalne ki zaroorat nahi. */
export const APP_SESSION_COOKIE = "limbu_app_session";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // login token ke 7d ke barabar

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

/** Cookie ke liye chhota session token banata hai. */
export function createAppSessionToken({ userId, email, impersonated }) {
  return jwt.sign(
    { userId, email: email || null, impersonated: impersonated === true },
    JWT_SECRET,
    { expiresIn: "7d" },
  );
}

export function appSessionCookieOptions() {
  return {
    name: APP_SESSION_COOKIE,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  };
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
