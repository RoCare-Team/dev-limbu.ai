import axios from "axios";
import dbConnect from "@/lib/dbConnect";
import GmbConnection from "@/models/GmbConnection";
import GmbUser from "@/models/GmbUser";
import AutomationPlan from "@/models/AutomationPlan";
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

      // Is row ka token mar gaya. Reconnect maangne se pehle usi Google account
      // ki doosri rows dekho — Google ke 100-token cap me purana token prune ho
      // jata hai jabki account ka naya token doosri row par zinda hota hai.
      if (googleErr === "invalid_grant") {
        for (const sibling of await siblingRefreshTokens(conn)) {
          const healed = await exchangeRefreshToken(sibling);
          if (!healed.accessToken) continue;

          conn.accessToken = healed.accessToken;
          conn.accessTokenExpires = Date.now() + healed.expiresIn * 1000;
          conn.refreshToken = healed.newRefreshToken || sibling;
          conn.invalid = false;
          conn.invalidReason = undefined;
          conn.updatedAt = new Date();
          await conn.save();
          console.log(
            `[gmbSession] healed ${conn.userId} from another connection of the same Google account`,
          );
          return conn.accessToken;
        }

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

/* ────────────────────────────────────────────────────────────────────────────
   Multi-source token resolve (cron / scheduled publish ke liye)

   Problem jo isne solve kiya:
   Har jagah refresh token ka apna SNAPSHOT padda hai —
     • GmbConnection.refreshToken   (live, reconnect par update hota hai)
     • AutomationPlan.refreshToken  (user-settings save ke waqt ka snapshot)
     • Post.refreshToken            (queue banate waqt ka snapshot)
   User reconnect kare to Google purana refresh token REVOKE kar deta hai aur
   naya deta hai. Sirf ek source dekhne wala code us stale snapshot par
   `invalid_grant` khaata tha aur user ko "Reconnect GMB" dikha deta tha —
   jabki DB me hi ek doosra, bilkul valid token pada hota tha.

   Ab: saare candidates ek-ek karke try hote hain. Koi bhi chal gaya to
   reconnect ki zaroorat NAHI — aur jeetne wala token wapas GmbConnection me
   likh diya jata hai (self-heal), taaki agli baar pehli hi koshish me lag jaye.
   "Reconnect" tabhi jab SAB candidates invalid_grant dein.
──────────────────────────────────────────────────────────────────────────── */

/**
 * Ek hi Google account aksar KAI app users par connected hota hai (agency ka
 * account 50+ businesses chalata hai). Google har naye consent par naya refresh
 * token deta hai aur **ek account + ek OAuth client par sirf 100 live refresh
 * token** rakhta hai — limit cross hote hi sabse purana token bina bataye
 * revoke ho jata hai. Isi wajah se 1-2 din purani entry achanak `invalid_grant`
 * deti thi jabki usi account ka doosra, bilkul zinda token DB me pada tha.
 *
 * Isliye same `googleId` wali baaki rows ke token bhi candidate hain, aur
 * jeetne wala token sab par likh diya jata hai (converge) — taaki account ke
 * liye practically ek hi token zinda rahe.
 */
async function siblingRefreshTokens(conn) {
  if (!conn?.googleId) return [];
  try {
    const siblings = await GmbConnection.find({
      googleId: conn.googleId,
      userId: { $ne: conn.userId },
      refreshToken: { $nin: [null, ""] },
    })
      .select("refreshToken updatedAt")
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean();
    return siblings.map((s) => s.refreshToken).filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Us Google account ka koi bhi stored refresh token do.
 * Callback isse use karta hai jab Google (already-granted account hone ki wajah
 * se) naya refresh token nahi bhejta — tab naya token mint karne ki zaroorat hi
 * nahi, purana hi kaam karta hai.
 */
export async function findRefreshTokenByGoogleId(googleId, { excludeUserId } = {}) {
  if (!googleId) return null;
  await dbConnect();
  const query = { googleId, refreshToken: { $nin: [null, ""] }, invalid: { $ne: true } };
  if (excludeUserId) query.userId = { $ne: excludeUserId };
  const row = await GmbConnection.findOne(query).sort({ updatedAt: -1 }).select("refreshToken").lean();
  return row?.refreshToken || null;
}

/** Ek account ke saare connections ko ek hi (working) refresh token par le aao. */
export async function convergeGoogleAccountToken(googleId, refreshToken) {
  if (!googleId || !refreshToken) return 0;
  try {
    const res = await GmbConnection.updateMany(
      { googleId, refreshToken: { $ne: refreshToken } },
      { $set: { refreshToken, invalid: false, invalidReason: null, updatedAt: new Date() } },
    );
    return res.modifiedCount || 0;
  } catch {
    return 0;
  }
}

export class GmbReconnectRequiredError extends Error {
  constructor(message = "invalid_grant: reconnect GMB required") {
    super(message);
    this.name = "GmbReconnectRequiredError";
    this.code = "GMB_RECONNECT_REQUIRED";
  }
}

export class GmbTokenUnavailableError extends Error {
  constructor(message = "Google token refresh temporarily failed") {
    super(message);
    this.name = "GmbTokenUnavailableError";
    this.code = "GMB_TEMPORARILY_UNAVAILABLE";
  }
}

/**
 * Ek refresh token ko Google se exchange karta hai.
 * Transient failures par retry; invalid_grant par turant `dead: true`.
 */
async function exchangeRefreshToken(refreshToken) {
  const MAX_ATTEMPTS = 3;
  let lastDetail = "";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      });
      const { data } = await axios.post(
        "https://oauth2.googleapis.com/token",
        params.toString(),
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          timeout: 10000,
        },
      );
      return {
        accessToken: data.access_token,
        expiresIn: data.expires_in || 3600,
        newRefreshToken: data.refresh_token || null,
      };
    } catch (error) {
      const googleErr = error.response?.data?.error;
      lastDetail = googleErr || error.message;
      if (googleErr === "invalid_grant") return { dead: true, detail: lastDetail };
      if (attempt < MAX_ATTEMPTS) await sleep(500 * attempt);
    }
  }
  return { transient: true, detail: lastDetail };
}

/**
 * Kisi user ke liye fresh GMB access token nikalo — DB me maujood HAR refresh
 * token snapshot try karke.
 *
 * @param {object}   opts
 * @param {string}   [opts.userId]          app userId (USR…/MB…/phone:…)
 * @param {string}   [opts.phone]           chatbot flow — userId ki jagah phone
 * @param {string[]} [opts.extraRefreshTokens] snapshot tokens (post / plan doc se)
 * @param {function} [opts.log]             optional logger
 * @returns {Promise<{accessToken: string, refreshToken: string, source: string}>}
 * @throws  {GmbReconnectRequiredError|GmbTokenUnavailableError}
 */
export async function resolveGmbAccessToken({
  userId,
  phone,
  extraRefreshTokens = [],
  log = () => {},
} = {}) {
  await dbConnect();

  let conn = null;
  try {
    if (userId) conn = await getGmbConnection(userId);
    // Chatbot flow (WhatsApp) me app login nahi hota — identity sirf phone hai.
    else if (phone) conn = await getGmbConnectionByPhone(phone);
  } catch (err) {
    log(`⚠ GmbConnection lookup failed: ${err.message}`);
  }
  // Phone se mila connection apne asli userId par ho sakta hai — plan lookup
  // ke liye wahi chahiye.
  if (!userId && conn?.userId) userId = conn.userId;

  // Plan snapshot bhi candidate hai — cron path me plan par hi sabse naya token
  // hota hai jab user ne settings dobara save ki ho.
  let planTokens = [];
  if (userId) {
    try {
      const plans = await AutomationPlan.find({ userId })
        .select("refreshToken updatedAt")
        .sort({ updatedAt: -1 })
        .limit(3)
        .lean();
      planTokens = plans.map((p) => p.refreshToken).filter(Boolean);
    } catch (err) {
      log(`⚠ AutomationPlan token lookup skipped: ${err.message}`);
    }
  }

  // Usi Google account par bane doosre connections ke token bhi try karo —
  // Google ke 100-token cap ki wajah se is row ka token mar sakta hai jabki
  // account ka naya token doosri row par zinda hota hai.
  const siblingTokens = await siblingRefreshTokens(conn);

  // Priority: live connection → same account ki doosri rows → plan snapshot →
  // caller ke snapshots.
  const candidates = [];
  const seen = new Set();
  const push = (token, source) => {
    const t = String(token || "").trim();
    if (!t || seen.has(t)) return;
    seen.add(t);
    candidates.push({ token: t, source });
  };
  push(conn?.refreshToken, "GmbConnection");
  siblingTokens.forEach((t, i) => push(t, `SameGoogleAccount[${i}]`));
  planTokens.forEach((t, i) => push(t, `AutomationPlan[${i}]`));
  extraRefreshTokens.forEach((t, i) => push(t, `snapshot[${i}]`));

  if (!candidates.length) {
    throw new GmbReconnectRequiredError("No Google refresh token stored for this user");
  }

  let sawTransient = false;
  const deadTokens = [];

  for (const { token, source } of candidates) {
    const result = await exchangeRefreshToken(token);

    if (result.accessToken) {
      log(`🔑 Token resolved from ${source} (tried ${deadTokens.length + 1}/${candidates.length}).`);
      const workingRefresh = result.newRefreshToken || token;

      // Self-heal: jeetne wala token live connection par likh do, invalid flag
      // hatao — taaki dashboard bekaar me "Reconnect" na maange aur agla run
      // pehli hi koshish me pass ho.
      if (conn) {
        try {
          conn.accessToken = result.accessToken;
          conn.accessTokenExpires = Date.now() + result.expiresIn * 1000;
          conn.refreshToken = workingRefresh;
          conn.invalid = false;
          conn.invalidReason = undefined;
          conn.updatedAt = new Date();
          await conn.save();
        } catch (saveErr) {
          log(`⚠ Could not persist healed token to GmbConnection: ${saveErr.message}`);
        }

        // Account ke baaki connections ko bhi isi token par le aao — warna har
        // row apna purana (kabhi bhi prune ho sakne wala) token pakde rehti hai.
        const converged = await convergeGoogleAccountToken(conn.googleId, workingRefresh);
        if (converged) {
          log(`↻ Same Google account ke ${converged} aur connection(s) working token par shift kiye.`);
        }
      }

      return { accessToken: result.accessToken, refreshToken: workingRefresh, source };
    }

    if (result.dead) {
      deadTokens.push(source);
      log(`✗ refreshToken from ${source} is revoked (invalid_grant) — trying next source.`);
      continue;
    }

    sawTransient = true;
    log(`⚠ Transient refresh failure for ${source}: ${result.detail}`);
  }

  // Ek bhi source transiently fail hua to reconnect mat maango — Google ka
  // hiccup ho sakta hai, agla run apne aap chal jayega.
  if (sawTransient) {
    throw new GmbTokenUnavailableError(
      "Couldn't reach Google for token refresh — will retry on next run",
    );
  }

  // SAB tokens sach me revoke ho chuke — ab reconnect hi rasta hai.
  if (conn) {
    try {
      conn.invalid = true;
      conn.invalidReason = "invalid_grant";
      conn.updatedAt = new Date();
      await conn.save();
    } catch (markErr) {
      log(`⚠ Could not mark GmbConnection invalid: ${markErr.message}`);
    }
  }
  throw new GmbReconnectRequiredError(
    `invalid_grant: reconnect GMB required (all ${deadTokens.length} stored token(s) revoked)`,
  );
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
    { userId, connectedBy: "self" },
    {
      $set: {
        userId,
        connectedBy: "self",
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

/**
 * Ek userId ka connection record lao (backfill sameth).
 *
 * Same userId ke do slots ho sakte hain — `connectedBy: "self"` (client ka
 * apna) aur `connectedBy: "admin_impersonation"` (in-house team ne manager
 * access se connect kiya). Ye function **background/functional** kaam ke
 * liye hai (posting, cron, token refresh) jahan bas KOI bhi valid token
 * chahiye — isliye self ko priority, warna admin wala fallback, taaki client
 * ke khud connect karne se pehle bhi automation na ruke.
 *
 * UI par "connected hai ya nahi" dikhane ke liye ye MAT use karo —
 * `getVisibleGmbConnection()` use karo, jo context-aware hai.
 */
export async function getGmbConnection(userId) {
  if (!userId) return null;
  await dbConnect();
  const self = await GmbConnection.findOne({ userId, connectedBy: "self" });
  if (self) return self;
  const adminConn = await GmbConnection.findOne({ userId, connectedBy: "admin_impersonation" });
  if (adminConn) return adminConn;
  return backfillFromGmbUser(userId);
}

/**
 * Context-aware connection lookup — UI/status ke liye isi ko use karo.
 *
 * - Impersonated session (admin login-as-user): admin-connected slot dikhta
 *   hai; agar wo maujood nahi to client ke apne slot par fallback (client ne
 *   pehle se khud connect kar rakha ho sakta hai).
 * - Real client login (impersonate NAHI): SIRF apna `"self"` slot dikhta hai
 *   — admin ka connection kabhi nahi, chahe maujood ho.
 */
export async function getVisibleGmbConnection(userId, impersonated) {
  if (!userId) return null;
  await dbConnect();

  if (impersonated) {
    const adminConn = await GmbConnection.findOne({ userId, connectedBy: "admin_impersonation" });
    if (adminConn) return adminConn;
    const self = await GmbConnection.findOne({ userId, connectedBy: "self" });
    if (self) return self;
    return backfillFromGmbUser(userId);
  }

  const self = await GmbConnection.findOne({ userId, connectedBy: "self" });
  if (self) return self;
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

  const conn = await getVisibleGmbConnection(appUser.userId, appUser.impersonated);

  if (!conn) {
    // App me logged in hai par GMB connected nahi (ya isi user ke liye
    // chhupaya gaya hai). Identity phir bhi do — taaki non-GMB routes (jaise
    // user-settings GET) 401 na dein.
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
