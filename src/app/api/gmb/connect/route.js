import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getAppUser } from "@/lib/appSession";
import {
  GMB_SCOPE,
  gmbRedirectUri,
  GMB_BASE_URL,
  getGmbConnectionByPhone,
} from "@/lib/gmbSession";
import dbConnect from "@/lib/dbConnect";
import GmbConnection from "@/models/GmbConnection";

export const dynamic = "force-dynamic";

const JWT_SECRET = process.env.JWT_SECRET || "mannubhai_secret";

/**
 * Google consent URL banata hai.
 *
 * NextAuth se farak: CSRF state ek **signed JWT** hai jo URL me travel karta hai,
 * cookie me nahi. Isiliye `error=OAuthCallback` (state-cookie mismatch) wala
 * loop yahan ho hi nahi sakta — reverse proxy / subdomain par bhi nahi.
 */
function buildAuthUrl(identity, callbackUrl, forceConsent) {
  const state = jwt.sign({ ...identity, callbackUrl }, JWT_SECRET, {
    expiresIn: "10m",
  });

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: gmbRedirectUri(),
    response_type: "code",
    scope: GMB_SCOPE,
    access_type: "offline",
    // `include_granted_scopes` jaan-boojhkar NAHI: wo is account ko pehle diye
    // gaye saare scopes (YouTube, Drive) is request me mila deta tha, aur Google
    // YouTube scopes ko dusre scopes ke saath grant nahi karta —
    // "scopes that cannot be requested together" (Error 400: invalid_request).
    // GMB ko sirf business.manage chahiye, incremental auth ki zaroorat nahi.
    state,
  });
  // Consent sirf tab jab refresh token chahiye — har baar nahi.
  if (forceConsent) params.set("prompt", "consent");

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Consent screen (`prompt=consent`) sirf tab dikhana chahiye jab hume ek naya
 * refresh token chahiye — yaani pehli baar connect, ya reconnect after revoke.
 *
 * Agar pehle se ek valid connection (refresh token) maujood hai, to consent
 * force karna hi wo "bar-bar permission maango" wala behaviour tha. Google is
 * case me consent screen skip karke seedha wapas bhej deta hai (already
 * authorized). Refresh token callback me preserve ho jata hai.
 *
 * `?consent=1` se caller jaan-boojhkar consent maang sakta hai (jaise "Switch
 * account" flow), aur `?consent=0` kabhi force nahi karta.
 */
async function shouldForceConsent(request, identity) {
  const consentParam = new URL(request.url).searchParams.get("consent");
  if (consentParam === "1") return true;
  if (consentParam === "0") return false;

  // Default: valid connection hai to consent skip, warna force.
  //
  // Identity ke SAME slot ka connection check karo (self ya
  // admin_impersonation) — generic fallback (getGmbConnection) yahan nahi,
  // warna doosre slot ka valid refresh token dekh kar consent skip ho jata,
  // aur naya connect us doosre slot me hi likhega (galat data).
  try {
    let conn = null;
    if (identity.userId) {
      await dbConnect();
      conn = await GmbConnection.findOne({
        userId: identity.userId,
        connectedBy: identity.impersonated ? "admin_impersonation" : "self",
      });
    } else {
      conn = await getGmbConnectionByPhone(identity.phone);
    }
    const hasValid = !!conn?.refreshToken && !conn.invalid;
    return !hasValid;
  } catch {
    // Shaq ho to force — nahi to refresh token miss ho sakta hai.
    return true;
  }
}

async function resolve(request) {
  const { searchParams } = new URL(request.url);
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  // WhatsApp chatbot flow (/connect-google-business?phone=…). Ye JAAN-BOOJHKAR
  // app session se PEHLE dekha jata hai.
  //
  // Wajah: ye link WhatsApp se khulta hai aur aksar agent/shared device par —
  // jahan browser me kisi AUR app user ka login pada ho sakta hai. Pehle app
  // session ko priority thi, to connect us doosre user ke record par chala jata
  // tha aur phone cookie set hi nahi hoti thi (callback sirf phone flow me set
  // karta hai) — yaani galat account connect ho jata. URL ka phone hi is flow ki
  // asli identity hai. `resolveGmbOwnerId` us phone ka asli User mil jaye to
  // uske userId par hi store karta hai, isliye normal user ko koi nuksan nahi.
  const phone = String(searchParams.get("phone") || "").replace(/\D/g, "");
  if (phone) {
    const identity = { phone };
    const forceConsent = await shouldForceConsent(request, identity);
    return { url: buildAuthUrl(identity, callbackUrl, forceConsent) };
  }

  const appUser = getAppUser(request);
  if (appUser?.userId) {
    // impersonated flag state ke saath travel karta hai taaki callback ko pata
    // chale ye connect asli client ne khud kiya ya in-house team ne
    // login-as-user (manager access) se. Dekho: gmb/callback route.
    const identity = { userId: appUser.userId, impersonated: appUser.impersonated === true };
    const forceConsent = await shouldForceConsent(request, identity);
    return { url: buildAuthUrl(identity, callbackUrl, forceConsent) };
  }

  return { error: true };
}

/** JSON URL lauta ta hai — client `window.location.href` set karta hai. */
export async function POST(request) {
  const result = await resolve(request);
  if (result.error) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }
  return NextResponse.json({ url: result.url });
}

/** Seedha link/redirect ke liye. */
export async function GET(request) {
  const result = await resolve(request);
  if (result.error) {
    // request.url proxy ke peeche localhost hota hai — fixed base use karo.
    return NextResponse.redirect(new URL("/login", GMB_BASE_URL));
  }
  return NextResponse.redirect(result.url);
}
