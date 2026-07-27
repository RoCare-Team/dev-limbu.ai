import axios from "axios";
import dbConnect from "@/lib/dbConnect";
import GmbConnection from "@/models/GmbConnection";
import GmbUser from "@/models/GmbUser";
import User from "@/models/User";
import { getAppUser, getGmbPhone } from "@/lib/appSession";

/** Token ko expiry se itna pehle hi refresh kar do, taaki in-flight call fail na ho. */
const REFRESH_SKEW_MS = 5 * 60 * 1000;

export const GMB_SCOPE =
  "openid email profile https://www.googleapis.com/auth/business.manage";

/**
 * OAuth redirect ka base.
 *
 * Jaan-boojhkar fixed hai (dynamic nahi): `APP_URL` / `NEXTAUTH_URL` reverse
 * proxy ke peeche galat resolve hote the aur live par localhost:3000 par
 * redirect ho jata tha.
 *
 * Default production par set hai. Local development ke liye `.env.local` me:
 *     GMB_REDIRECT_BASE_URL=http://localhost:3000
 *
 * Google Console ke "Authorized redirect URIs" me dono hone chahiye:
 *     https://limbu.ai/api/gmb/callback
 *     http://localhost:3000/api/gmb/callback
 */
export const GMB_BASE_URL = (
  process.env.GMB_REDIRECT_BASE_URL || "http://localhost:3000"
).replace(/\/$/, "");

export function gmbRedirectUri() {
  return `${GMB_BASE_URL}/api/gmb/callback`;
}

function emailRegexFor(email) {
  if (!email) return null;
  return new RegExp(`^${String(email).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Google se naya access token lo.
 *
 * Sirf `invalid_grant` (revoke / refresh token sach me mar gaya) par connection
 * `invalid` mark hota hai — tabhi user ko "Reconnect" dikhta hai. Transient
 * failures (network, 5xx, timeout) par retry karte hain aur `invalid` NAHI
 * karte — warna Google ka ek chhota hiccup bhi session ko "expired" dikha deta
 * aur scheduled post fail ho jata.
 */
async function refreshAccessToken(conn) {
  if (!conn.refreshToken) {
    conn.invalid = true;
    conn.invalidReason = "no_refresh_token";
    await conn.save();
    return null;
  }

  const MAX_ATTEMPTS = 3;
  let lastDetail = "";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
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
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          timeout: 10000,
        },
      );

      conn.accessToken = data.access_token;
      conn.accessTokenExpires = Date.now() + (data.expires_in || 3600) * 1000;
      // Google refresh par naya refresh_token aam taur par nahi bhejta —
      // aaye to hi update karo, warna purana hi valid rehta hai.
      if (data.refresh_token) conn.refreshToken = data.refresh_token;
      conn.invalid = false;
      conn.invalidReason = undefined;
      conn.updatedAt = new Date();
      await conn.save();
      return conn.accessToken;
    } catch (error) {
      const googleErr = error.response?.data?.error;
      lastDetail = googleErr || error.message;

      // Refresh token pakka mar gaya — retry se kuch nahi hoga. Reconnect chahiye.
      if (googleErr === "invalid_grant") {
        conn.invalid = true;
        conn.invalidReason = "invalid_grant";
        conn.updatedAt = new Date();
        await conn.save();
        console.error(`[gmbSession] refresh invalid_grant for ${conn.userId} — reconnect needed`);
        return null;
      }

      // Baaki sab transient maana jaye — thodi der ruk kar retry.
      console.warn(
        `[gmbSession] refresh attempt ${attempt}/${MAX_ATTEMPTS} failed for ${conn.userId}: ${lastDetail}`,
      );
      if (attempt < MAX_ATTEMPTS) await sleep(500 * attempt);
    }
  }

  // Transient failure barkarar — invalid NAHI kar rahe, agli call phir try karegi.
  console.error(`[gmbSession] refresh gave up (transient) for ${conn.userId}: ${lastDetail}`);
  return null;
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
 * Chatbot flow ka connection — phone se.
 * Pehle asli User dekhte hain (tab connection uske userId par hota hai),
 * warna `phone:<digits>` wala standalone record.
 */
export async function getGmbConnectionByPhone(phone) {
  if (!phone) return null;
  await dbConnect();

  const appUser = await User.findOne({ phone }).lean();
  if (appUser?.userId) {
    const byUser = await getGmbConnection(appUser.userId);
    if (byUser) return byUser;
  }

  return GmbConnection.findOne({ phone });
}

/** Chatbot connection kis key par store hoga. */
export async function resolveGmbOwnerId(phone) {
  await dbConnect();
  const appUser = await User.findOne({ phone }).lean();
  return appUser?.userId || `phone:${phone}`;
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

  // App login nahi hai — chatbot flow ki GMB-only phone cookie try karo.
  if (!appUser?.userId) {
    const phone = getGmbPhone(request);
    if (!phone) return null;

    const conn = await getGmbConnectionByPhone(phone);
    if (!conn) {
      return {
        user: { email: null, id: null },
        userId: null,
        phone,
        accessToken: null,
        refreshToken: null,
        hasConnection: false,
        gmbConnected: false,
        needsReconnect: false,
      };
    }

    const accessToken = await ensureFreshToken(conn);
    return {
      user: { email: conn.email || null, id: conn.userId },
      userId: conn.userId,
      phone,
      accessToken,
      refreshToken: conn.refreshToken || null,
      hasConnection: true,
      gmbConnected: !!accessToken && !conn.invalid,
      needsReconnect: !!conn.invalid,
    };
  }

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
      hasConnection: false,
      gmbConnected: false,
      needsReconnect: false,
    };
  }

  const accessToken = await ensureFreshToken(conn);
  return {
    user: { email: conn.email || appUser.email || null, id: appUser.userId },
    userId: appUser.userId,
    impersonated: appUser.impersonated,
    accessToken,
    refreshToken: conn.refreshToken || null,
    // Record maujood hai — token na milne par bhi. Isse "reconnect chahiye"
    // aur "Google abhi jawab nahi de raha" me farak kar paate hain.
    hasConnection: true,
    gmbConnected: !!accessToken && !conn.invalid,
    needsReconnect: !!conn.invalid,
    error: conn.invalid ? "GmbReconnectRequired" : undefined,
  };
}

/**
 * Un routes ke liye jinhe sach me Google token chahiye.
 *
 * Teen alag failure modes — inhe mila dena hi "session turant expire ho gaya"
 * wali galat feeling deta tha:
 *
 *   401 APP_NOT_AUTHENTICATED — app session cookie hi nahi mili. GMB ka isse
 *       koi lena-dena nahi; client ko sirf cookie dobara sync karke retry karna hai.
 *   409 GMB_RECONNECT_REQUIRED — refresh token sach me mar chuka hai
 *       (invalid_grant / revoke). Tabhi "Reconnect" modal dikhana chahiye.
 *   503 GMB_TEMPORARILY_UNAVAILABLE — Google se refresh transiently fail hua.
 *       Ye baad me apne aap theek ho jata hai; reconnect maangna galat hai.
 */
export async function requireGmbSession(request) {
  const session = await getGmbSession(request);

  // Identity ya to app login se aati hai ya chatbot ki phone cookie se.
  if (!session || (!session.user?.id && !session.phone)) {
    return {
      session: null,
      error: {
        message: "Not logged in",
        code: "APP_NOT_AUTHENTICATED",
        status: 401,
      },
    };
  }

  if (!session.accessToken) {
    // Connection hi nahi, ya refresh token pakka mar chuka hai → reconnect.
    if (!session.hasConnection || session.needsReconnect) {
      return {
        session,
        error: {
          message: "Please reconnect your Google Business Profile",
          code: "GMB_RECONNECT_REQUIRED",
          status: 409,
        },
      };
    }

    return {
      session,
      error: {
        message: "Couldn't reach Google right now. Please try again shortly.",
        code: "GMB_TEMPORARILY_UNAVAILABLE",
        status: 503,
      },
    };
  }

  return { session, error: null };
}
