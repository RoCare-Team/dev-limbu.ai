import axios from "axios";
import dbConnect from "@/lib/dbConnect";
import GmbConnection from "@/models/GmbConnection";
import GmbUser from "@/models/GmbUser";
import User from "@/models/User";
import { getAppUser } from "@/lib/appSession";

/** Token ko expiry se itna pehle hi refresh kar do, taaki in-flight call fail na ho. */
const REFRESH_SKEW_MS = 5 * 60 * 1000;

export const GMB_SCOPE =
  "openid email profile https://www.googleapis.com/auth/business.manage";

/**
 * Hardcoded production base.
 *
 * Env se derive karne par live server localhost:3000 par redirect kar raha tha
 * (reverse proxy ke peeche APP_URL/NEXTAUTH_URL galat resolve ho rahe the).
 * Isliye ye jaan-boojhkar fixed hai — Google Console me bhi yahi URI whitelisted
 * hona chahiye. Local development ke liye GMB_REDIRECT_BASE_URL override kar do.
 */
export const GMB_BASE_URL = (
  process.env.GMB_REDIRECT_BASE_URL || "https://limbu.ai"
).replace(/\/$/, "");

export function gmbRedirectUri() {
  return `${GMB_BASE_URL}/api/gmb/callback`;
}

function emailRegexFor(email) {
  if (!email) return null;
  return new RegExp(`^${String(email).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
}

/**
 * Google se naya access token lo.
 * Fail hone par connection ko `invalid` mark karte hain — user ko sirf
 * "Reconnect GMB" dikhega, app se logout NAHI hoga.
 */
async function refreshAccessToken(conn) {
  if (!conn.refreshToken) {
    conn.invalid = true;
    conn.invalidReason = "no_refresh_token";
    await conn.save();
    return null;
  }

  try {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: conn.refreshToken,
    });
    const { data } = await axios.post(
      "https://oauth2.googleapis.com/token",
      params.toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
    );

    conn.accessToken = data.access_token;
    conn.accessTokenExpires = Date.now() + (data.expires_in || 3600) * 1000;
    if (data.refresh_token) conn.refreshToken = data.refresh_token;
    conn.invalid = false;
    conn.invalidReason = undefined;
    conn.updatedAt = new Date();
    await conn.save();
    return conn.accessToken;
  } catch (error) {
    const detail = error.response?.data?.error || error.message;
    console.error(`[gmbSession] refresh failed for ${conn.userId}:`, detail);
    // invalid_grant = user ne access revoke kiya / refresh token mar gaya
    if (error.response?.data?.error === "invalid_grant") {
      conn.invalid = true;
      conn.invalidReason = "invalid_grant";
      conn.updatedAt = new Date();
      await conn.save();
    }
    return null;
  }
}

/** Zaroorat ho to refresh karke fresh access token lautata hai. */
export async function ensureFreshToken(conn) {
  if (!conn) return null;
  if (
    conn.accessToken &&
    conn.accessTokenExpires &&
    Date.now() < conn.accessTokenExpires - REFRESH_SKEW_MS
  ) {
    return conn.accessToken;
  }
  return refreshAccessToken(conn);
}

/**
 * Purane NextAuth-era tokens (`GmbUser.projects[]`) ko naye collection me utha lo.
 * Ek hi baar chalta hai — uske baad record maujood rehta hai.
 * Isi wajah se migration par kisi user ko dobara connect nahi karna padta.
 */
async function backfillFromGmbUser(userId) {
  const appUser = await User.findOne({ userId }).lean();
  const rx = emailRegexFor(appUser?.email);
  if (!rx) return null;

  const gmbUser = await GmbUser.findOne({ email: rx }).lean();
  const project = gmbUser?.projects?.find((p) => p.refreshToken) || gmbUser?.projects?.[0];
  if (!project?.refreshToken) return null;

  console.log(`[gmbSession] backfilling GMB connection for ${userId} from GmbUser`);
  return GmbConnection.findOneAndUpdate(
    { userId },
    {
      $set: {
        userId,
        googleId: project.googleId,
        email: gmbUser.email,
        name: gmbUser.name,
        image: gmbUser.image,
        accessToken: project.accessToken,
        refreshToken: project.refreshToken,
        // Purana access token stale maana jaye — pehle use par refresh ho jayega.
        accessTokenExpires: 0,
        connectedAt: project.createdAt || new Date(),
        updatedAt: new Date(),
        invalid: false,
      },
    },
    { upsert: true, new: true },
  );
}

/** Ek userId ka connection record lao (backfill sameth). */
export async function getGmbConnection(userId) {
  if (!userId) return null;
  await dbConnect();
  const existing = await GmbConnection.findOne({ userId });
  if (existing) return existing;
  return backfillFromGmbUser(userId);
}

/**
 * `getServerSession(authOptions)` ka drop-in replacement.
 *
 * Bilkul wahi shape lautata hai jo NextAuth lautata tha —
 * `{ user: { email, id }, accessToken, refreshToken }` — taaki call sites ka
 * baaki code jaisa hai waisa chale.
 *
 * Farak sirf itna: identity app ke apne login se aati hai, Google se nahi.
 * Isliye Google token expire hone par user app se logout nahi hota.
 */
export async function getGmbSession(request) {
  const appUser = getAppUser(request);
  if (!appUser?.userId) return null;

  const conn = await getGmbConnection(appUser.userId);
  if (!conn) {
    // App me logged in hai par GMB connected nahi. Identity phir bhi do —
    // taaki non-GMB routes (jaise user-settings GET) 401 na dein.
    return {
      user: { email: appUser.email || null, id: appUser.userId },
      userId: appUser.userId,
      impersonated: appUser.impersonated,
      accessToken: null,
      refreshToken: null,
      gmbConnected: false,
    };
  }

  const accessToken = await ensureFreshToken(conn);
  return {
    user: { email: conn.email || appUser.email || null, id: appUser.userId },
    userId: appUser.userId,
    impersonated: appUser.impersonated,
    accessToken,
    refreshToken: conn.refreshToken || null,
    gmbConnected: !!accessToken && !conn.invalid,
    error: conn.invalid ? "GmbReconnectRequired" : undefined,
  };
}

/**
 * Un routes ke liye jinhe sach me Google token chahiye.
 * Session ke saath ek ready-made 401/409 response bhi deta hai.
 */
export async function requireGmbSession(request) {
  const session = await getGmbSession(request);
  if (!session?.user?.id) {
    return { session: null, error: { message: "Unauthorized", status: 401 } };
  }
  if (!session.accessToken) {
    return {
      session,
      error: {
        message: "Google Business Profile not connected",
        code: "GMB_NOT_CONNECTED",
        status: 409,
      },
    };
  }
  return { session, error: null };
}
